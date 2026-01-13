/* eslint-disable no-unused-vars */
/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useCallback} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {View, TouchableOpacity, BackHandler} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {translate as t} from '../store/utils/translate';

import {
  setSelectedLegalEntity,
  resetCompanyState,
} from '../store/slices/companySlice';
import {setMenuItems} from '../store/slices/menuItemSlice';

import AlertModal from './Alert/AlertModal';
import LogoutAlertModal from './Alert/LogoutAlertModal';
import MainPageHeader from './PageHeader/MainPageHeader';
import NotificationPanel from './PageHeader/NotificationPanel';
import CompanyDropdown from './PageHeader/CompanyDropdown';

import CustomTabBar from '../Controller/CustomTabBar';
import {fetchEmployeeMenuItemsByCompany} from '../Controller/authUtils';

import {RetrieveEmployeeNotification} from '../API/Notification/RetriveEmployeeNotification';
import styles from '../styles/styles';

const ActionPaneContainer = ({
  children,
  pageTitle,
  showFloatingButton = false,
  isHeaderActive = true,
  showTabNavigator = true,
  onFloatingButtonPress,
  onRefresh,
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

  const currentLanguage = useSelector(state => state.language.currentLanguage);
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

  // ✅ Fetch notifications using RetriveEmployeeNotification
  const fetchNotifications = useCallback(async () => {
    try {
      if (!userData?.employeeId) return;

      const data = await RetrieveEmployeeNotification({
        employeeId: userData.employeeId,
      });

      // console.log({data});

      if (Array.isArray(data)) {
        setNotifications(data);
        setNotificationCount(data.length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [userData?.employeeId]);

  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    fetchNotifications();
    return () => clearInterval(interval);
  }, [fetchNotifications]);

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
          selectedLegalEntity ||
          defaultLegalEntity ||
          t('actionPane.selectCompany'),
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

    try {
      dispatch(setSelectedLegalEntity(newLegalEntity));

      const newMenuItems = await fetchEmployeeMenuItemsByCompany(
        userData?.employeeId,
        newLegalEntity,
      );

      dispatch(setMenuItems(newMenuItems));

      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      dispatch(setSelectedLegalEntity(selectedLegalEntity));

      setAlertMessage(t('actionPane.companyChangeFailed'));
      setAlertModal(true);
    }
  };

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

      {/* Custom Tab Bar */}
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
        heading={t('common.alert')}
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />

      <LogoutAlertModal
        visible={modalVisible}
        heading={t('profile.logoutConfirm')}
        text={t('profile.logoutConfirm')}
        onConfirm={confirmLogout}
        onCancel={() => setModalVisible(false)}
      />

      {/* ✅ Updated Notification Panel */}
      <NotificationPanel
        visible={notificationVisible}
        notifications={notifications}
        onClose={() => setNotificationVisible(false)}
        onRefresh={fetchNotifications}
        employeeId={userData?.employeeId}
      />

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

export default ActionPaneContainer;
