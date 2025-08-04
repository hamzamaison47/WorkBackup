/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useCallback} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  BackHandler,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import {setSelectedLegalEntity} from '../store/slices/companySlice';

import LogoutAlertModal from './Alert/LogoutAlertModal';
import MainPageHeader from './PageHeader/MainPageHeader';
import NotificationDropdown from './PageHeader/NotificationDropdown';
import CompanyDropdown from './PageHeader/CompanyDropdown';

import {retrieveByEmail} from '../API/WorkflowTrackingStatusTable/retrieveByEmail';
import {AlertModal} from './Alert/AlertModal';

const {width, height} = Dimensions.get('window');

const ActionPaneContainer = ({
  children,
  pageTitle,
  isBackButton = false, // true for back button, false for drawer
  showFooter = true, // show/hide footer
  showFloatingButton = false, // show/hide floating + button
  onBackPress, // callback for back button press
  onRefresh, // callback for refresh button
  onFloatingButtonPress, // callback for floating button press
  customFooterButtons = [], // array of custom footer buttons
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const navigation = useNavigation();
  const dispatch = useDispatch();

  // Redux selectors
  const {selectedLegalEntity, defaultLegalEntity, legalEntities} = useSelector(
    state => state.company,
  );
  const {userData} = useSelector(state => state.user);

  // Close all overlays
  const closeAllOverlays = useCallback(() => {
    setDropdownVisible(false);
    setNotificationVisible(false);
    setModalVisible(false);
    navigation.closeDrawer?.();
  }, [navigation]);

  // Handle back button press
  useFocusEffect(
    useCallback(() => {
      closeAllOverlays();

      const onBackPressHandler = () => {
        if (onBackPress) {
          onBackPress();
        } else if (isBackButton) {
          navigation.goBack();
        } else {
          // Default behavior for drawer
          handleLogout();
          // return false;
        }
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPressHandler);
      return () => {
        BackHandler.removeEventListener(
          'hardwareBackPress',
          onBackPressHandler,
        );
      };
    }, [onBackPress, isBackButton, navigation, closeAllOverlays]),
  );

  // Close overlays when screen blurs
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      closeAllOverlays();
    });
    return unsubscribe;
  }, [navigation, closeAllOverlays]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await retrieveByEmail({email: userData?.email});
        if (Array.isArray(data)) {
          const formattedNotifications = data.map(notification => ({
            document: notification.Document,
            documentType: notification.DocumentType,
            correlationId: notification.CorrelationId,
          }));
          setNotifications(formattedNotifications);
          setNotificationCount(formattedNotifications.length);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    const interval = setInterval(fetchNotifications, 30000);
    fetchNotifications(); // Initial fetch
    return () => clearInterval(interval);
  }, [userData?.email]);

  const handleCompanySelect = async newLegalEntity => {
    dispatch(setSelectedLegalEntity(newLegalEntity));

    try {
      handleRefresh();
    } catch (error) {
      console.error('Error updating data after company change:', error);
      setAlertMessage('Failed to refresh data after company change.');
      setAlertModal(true);
    } finally {
      setDropdownVisible(false);
    }
  };

  // Header configuration
  useEffect(() => {
    const headerOptions = MainPageHeader({
      onToggleDrawer: isBackButton ? handleBackPress : toggleDrawer,
      onTitle: pageTitle,
      onShowNotify: toggleNotification,
      onCount: notificationCount,
      onLogout: handleLogout,
      isBack: isBackButton,
      onDatPress: toggleCompanyDropdown,
      selectedDat:
        selectedLegalEntity || defaultLegalEntity || 'Select Company',
      defaultDat: defaultLegalEntity,
    });
    navigation.setOptions(headerOptions);
  }, [
    navigation,
    pageTitle,
    isBackButton,
    notificationCount,
    selectedLegalEntity,
    defaultLegalEntity,
  ]);

  // Navigation handlers
  const handleBackPress = () => {
    closeAllOverlays();
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  const toggleDrawer = () => {
    closeAllOverlays();
    navigation.toggleDrawer();
  };

  const toggleNotification = () => {
    closeAllOverlays();
    setNotificationVisible(prev => !prev);
  };

  const handleLogout = () => {
    closeAllOverlays();
    setModalVisible(true);
  };

  const toggleCompanyDropdown = () => {
    closeAllOverlays();
    setDropdownVisible(prev => !prev);
  };

  const closeNotification = () => setNotificationVisible(false);

  const confirmLogout = () => {
    setModalVisible(false);
    navigation.navigate('Login');
  };

  const cancelLogout = () => setModalVisible(false);

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleFloatingButtonPress = () => {
    if (onFloatingButtonPress) {
      onFloatingButtonPress();
    }
  };

  // Render default footer buttons
  const renderDefaultFooterButtons = () => (
    <>
      <TouchableOpacity style={styles.tabButton} onPress={handleBackPress}>
        <FontAwesome name="arrow-left" size={24} color="#ffffff" />
        <Text style={styles.tabButtonText}>Back</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tabButton} onPress={handleRefresh}>
        <FontAwesome name="refresh" size={24} color="#ffffff" />
        <Text style={styles.tabButtonText}>Refresh</Text>
      </TouchableOpacity>
    </>
  );

  // Render custom footer buttons
  const renderCustomFooterButtons = () => {
    return customFooterButtons.map((button, index) => (
      <TouchableOpacity
        key={index}
        style={styles.tabButton}
        onPress={button.onPress}>
        <FontAwesome name={button.icon} size={24} color="#ffffff" />
        <Text style={styles.tabButtonText}>{button.label}</Text>
      </TouchableOpacity>
    ));
  };

  return (
    <View style={styles.container}>
      {/* Main content */}
      <View style={styles.content}>{children}</View>

      {/* Footer */}
      {showFooter && (
        <View style={styles.bottomTabBar}>
          {customFooterButtons.length > 0
            ? renderCustomFooterButtons()
            : renderDefaultFooterButtons()}
        </View>
      )}

      {/* Floating Button */}
      {showFloatingButton && (
        <View style={styles.floatingPlusButtonContainer}>
          <TouchableOpacity
            style={styles.floatingPlusButton}
            onPress={handleFloatingButtonPress}>
            <FontAwesome name="plus" style={styles.plusIcon} />
          </TouchableOpacity>
        </View>
      )}

      {/* Modals and Dropdowns */}
      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />

      <LogoutAlertModal
        visible={modalVisible}
        heading="Are you sure?"
        text="Do you really want to logout?"
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />

      {notificationVisible && (
        <NotificationDropdown
          visible={notificationVisible}
          notifications={notifications}
          onClose={closeNotification}
        />
      )}

      {dropdownVisible && (
        <CompanyDropdown
          visible={dropdownVisible}
          onClose={() => setDropdownVisible(false)}
          legalEntities={legalEntities}
          selectedLegalEntity={selectedLegalEntity}
          onSelect={handleCompanySelect}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    // paddingHorizontal: width * 0.03,
    // paddingTop: height * 0.01,
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFA500',
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.18,
    justifyContent: 'space-between',
    alignItems: 'center',
    height: height * 0.075,
  },
  tabButton: {
    alignItems: 'center',
  },
  tabButtonText: {
    fontSize: width * 0.032,
    color: '#ffffff',
    marginTop: 2,
    fontWeight: '500',
  },
  floatingPlusButtonContainer: {
    position: 'absolute',
    bottom: height * 0.035,
    left: width / 2 - 28,
  },
  floatingPlusButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#FFA500',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  plusIcon: {
    fontSize: 24,
    color: '#FFA500',
  },
});

export default ActionPaneContainer;
