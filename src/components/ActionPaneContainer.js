/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useCallback} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {View, TouchableOpacity, BackHandler} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import {
  setSelectedLegalEntity,
  resetCompanyState,
} from '../store/slices/companySlice';
import {setMenuItems} from '../store/slices/menuItemSlice';

import AlertModal from './Alert/AlertModal';
import LogoutAlertModal from './Alert/LogoutAlertModal';
import MainPageHeader from './PageHeader/MainPageHeader';
import NotificationDropdown from './PageHeader/NotificationDropdown';
import CompanyDropdown from './PageHeader/CompanyDropdown';

import CustomTabBar from '../Controller/CustomTabBar';
import {fetchEmployeeMenuItemsByCompany} from '../Controller/authUtils';

import {retrieveByEmail} from '../API/WorkflowTrackingStatusTable/retrieveByEmail';
import styles from '../styles/styles';

const ActionPaneContainer = ({
  children,
  pageTitle,
  showFloatingButton = false,
  isHeaderActive = true,
  showTabNavigator = true,
  onFloatingButtonPress,
  onRefresh, // Add onRefresh prop to handle refresh functionality
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [activeTab, setActiveTab] = useState('MainDashboard');

  const navigation = useNavigation();
  const dispatch = useDispatch();

  const {selectedLegalEntity, defaultLegalEntity, legalEntities} = useSelector(
    state => state.company,
  );
  const {userData} = useSelector(state => state.user);

  // Detect active tab
  useEffect(() => {
    const unsubscribe = navigation.addListener('state', () => {
      const state = navigation.getState();
      const currentRoute = state?.routes?.[state?.index];
      if (currentRoute?.name === 'TabNavigator' && currentRoute?.state) {
        const tabState = currentRoute.state;
        const activeTabRoute = tabState?.routes?.[tabState?.index];
        if (activeTabRoute) setActiveTab(activeTabRoute.name);
      } else {
        setActiveTab(currentRoute?.name || 'MainDashboard');
      }
    });
    return unsubscribe;
  }, [navigation]);

  // Close overlays
  const closeAllOverlays = useCallback(() => {
    setDropdownVisible(false);
    setNotificationVisible(false);
    setModalVisible(false);
    navigation.closeDrawer?.();
  }, [navigation]);

  // Back handler
  useFocusEffect(
    useCallback(() => {
      const onBackPressHandler = () => {
        navigation.goBack();
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPressHandler);
      return () =>
        BackHandler.removeEventListener(
          'hardwareBackPress',
          onBackPressHandler,
        );
    }, [navigation]),
  );

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await retrieveByEmail({email: userData?.email});
        if (Array.isArray(data)) {
          const formatted = data.map(n => ({
            document: n.Document,
            documentType: n.DocumentType,
            correlationId: n.CorrelationId,
          }));
          setNotifications(formatted);
          setNotificationCount(formatted.length);
        }
      } catch (err) {
        // console.error('Error fetching notifications:', err);
      }
    };
    const interval = setInterval(fetchNotifications, 30000);
    fetchNotifications();
    return () => clearInterval(interval);
  }, [userData?.email]);

  // Header config
  useEffect(() => {
    if (isHeaderActive) {
      const headerOptions = MainPageHeader({
        onToggleDrawer: toggleDrawer,
        onTitle: pageTitle,
        onShowNotify: toggleNotification,
        onCount: notificationCount,
        onLogout: handleLogout,
        isBack: false,
        onDatPress: toggleCompanyDropdown,
        selectedDat:
          selectedLegalEntity || defaultLegalEntity || 'Select Company',
        defaultDat: defaultLegalEntity,
      });
      navigation.setOptions(headerOptions);
    }
  }, [
    navigation,
    pageTitle,
    notificationCount,
    selectedLegalEntity,
    defaultLegalEntity,
    isHeaderActive,
  ]);

  // Handle company selection with refresh functionality
  const handleCompanySelect = async newLegalEntity => {
    setDropdownVisible(false);

    // Show loading state if needed
    // eslint-disable-next-line no-unused-vars
    const currentMenus = [...notifications]; // Store current state for rollback if needed

    try {
      // Update the selected legal entity
      dispatch(setSelectedLegalEntity(newLegalEntity));

      // Fetch new menu items for the selected company
      const newMenuItems = await fetchEmployeeMenuItemsByCompany(
        userData?.employeeId,
        newLegalEntity,
      );

      // Update menu items in Redux
      dispatch(setMenuItems(newMenuItems));

      // Trigger refresh if callback is provided
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error updating data after company change:', error);

      // Rollback on error
      dispatch(setSelectedLegalEntity(selectedLegalEntity)); // Revert to previous selection

      setAlertMessage('Failed to update menu items for the selected company.');
      setAlertModal(true);
    }
  };
  // const handleCompanySelect = async newLegalEntity => {
  //   dispatch(setSelectedLegalEntity(newLegalEntity));

  //   try {
  //     // Trigger refresh if callback is provided
  //     if (onRefresh) {
  //       await onRefresh();
  //     }
  //   } catch (error) {
  //     console.error('Error updating data after company change:', error);
  //     setAlertMessage('Failed to refresh data after company change.');
  //     setAlertModal(true);
  //   } finally {
  //     setDropdownVisible(false);
  //   }
  // };

  const toggleDrawer = () => {
    closeAllOverlays();
    navigation.toggleDrawer();
  };

  const toggleNotification = () => {
    setDropdownVisible(false);
    setNotificationVisible(prev => !prev);
  };

  const handleLogout = () => {
    closeAllOverlays();
    setModalVisible(true);
  };

  const toggleCompanyDropdown = () => {
    setNotificationVisible(false);
    setDropdownVisible(prev => !prev);
  };

  const confirmLogout = () => {
    dispatch(resetCompanyState());
    setModalVisible(false);
    navigation.navigate('Login');
  };

  // ✅ When tab is pressed
  const handleTabPress = tabName => {
    setActiveTab(tabName);
    navigation.navigate('TabNavigator', {
      screen: tabName,
      params: {userData},
    });
  };

  return (
    <View style={styles.APCont_container}>
      {/* Main content */}
      <View style={styles.APCont_content}>{children}</View>

      {/* ✅ Reusable Custom Tab Bar */}
      {showTabNavigator && (
        <CustomTabBar activeTab={activeTab} onTabPress={handleTabPress} />
      )}

      {/* Floating Button */}
      {showFloatingButton && (
        <View style={styles.APCont_floatingPlusButtonContainer}>
          <TouchableOpacity
            style={styles.APCont_floatingPlusButton}
            onPress={onFloatingButtonPress}>
            <FontAwesome name="plus" style={styles.APCont_plusIcon} />
          </TouchableOpacity>
        </View>
      )}

      {/* Modals */}
      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />

      <LogoutAlertModal
        visible={modalVisible}
        heading="Are you sure you want to logout?"
        text="Are you sure you want to logout?"
        onConfirm={confirmLogout}
        onCancel={() => setModalVisible(false)}
      />

      {notificationVisible && (
        <NotificationDropdown
          visible={notificationVisible}
          notifications={notifications}
          onClose={() => setNotificationVisible(false)}
        />
      )}

      {dropdownVisible && (
        <CompanyDropdown
          visible={dropdownVisible}
          onClose={() => setDropdownVisible(false)}
          legalEntities={legalEntities}
          selectedLegalEntity={selectedLegalEntity}
          onSelect={handleCompanySelect} // Use the enhanced handler with refresh
        />
      )}
    </View>
  );
};

export default ActionPaneContainer;
