// /* eslint-disable no-unused-vars */
// /* eslint-disable curly */
// /* eslint-disable react-hooks/exhaustive-deps */
// import React, {useState, useEffect, useCallback} from 'react';
// import {useSelector, useDispatch} from 'react-redux';
// import {View, TouchableOpacity, BackHandler} from 'react-native';
// import {useNavigation, useFocusEffect} from '@react-navigation/native';
// import FontAwesome from 'react-native-vector-icons/FontAwesome';
// import {translate as t} from '../store/utils/translate';

// import {
//   setSelectedLegalEntity,
//   resetCompanyState,
// } from '../store/slices/companySlice';
// import {setMenuItems} from '../store/slices/menuItemSlice';

// import AlertModal from './Alert/AlertModal';
// import LogoutAlertModal from './Alert/LogoutAlertModal';
// import MainPageHeader from './PageHeader/MainPageHeader';
// import NotificationPanel from './PageHeader/NotificationPanel';
// import CompanyDropdown from './PageHeader/CompanyDropdown';

// import CustomTabBar from '../Controller/CustomTabBar';
// import {fetchEmployeeMenuItemsByCompany} from '../Controller/authUtils';

// import {RetrieveEmployeeNotification} from '../API/Notification/RetriveEmployeeNotification';
// import styles from '../styles/styles';

// const ActionPaneContainer = ({
//   children,
//   pageTitle,
//   showFloatingButton = false,
//   isHeaderActive = true,
//   showTabNavigator = true,
//   onFloatingButtonPress,
//   onRefresh,
// }) => {
//   const [modalVisible, setModalVisible] = useState(false);
//   const [notificationCount, setNotificationCount] = useState(0);
//   const [notifications, setNotifications] = useState([]);
//   const [notificationVisible, setNotificationVisible] = useState(false);
//   const [dropdownVisible, setDropdownVisible] = useState(false);
//   const [alertModal, setAlertModal] = useState(false);
//   const [alertMessage, setAlertMessage] = useState('');
//   const [activeTab, setActiveTab] = useState('MainDashboard');

//   const navigation = useNavigation();
//   const dispatch = useDispatch();

//   const currentLanguage = useSelector(state => state.language.currentLanguage);
//   const {selectedLegalEntity, defaultLegalEntity, legalEntities} = useSelector(
//     state => state.company,
//   );
//   const {userData} = useSelector(state => state.user);

//   // Detect active tab
//   useEffect(() => {
//     const unsubscribe = navigation.addListener('state', () => {
//       const state = navigation.getState();
//       const currentRoute = state?.routes?.[state?.index];
//       if (currentRoute?.name === 'TabNavigator' && currentRoute?.state) {
//         const tabState = currentRoute.state;
//         const activeTabRoute = tabState?.routes?.[tabState?.index];
//         if (activeTabRoute) setActiveTab(activeTabRoute.name);
//       } else {
//         setActiveTab(currentRoute?.name || 'MainDashboard');
//       }
//     });
//     return unsubscribe;
//   }, [navigation]);

//   // Close overlays
//   const closeAllOverlays = useCallback(() => {
//     setDropdownVisible(false);
//     setNotificationVisible(false);
//     setModalVisible(false);
//     navigation.closeDrawer?.();
//   }, [navigation]);

//   // Back handler
//   useFocusEffect(
//     useCallback(() => {
//       const onBackPressHandler = () => {
//         navigation.goBack();
//         return true;
//       };
//       BackHandler.addEventListener('hardwareBackPress', onBackPressHandler);
//       return () =>
//         BackHandler.removeEventListener(
//           'hardwareBackPress',
//           onBackPressHandler,
//         );
//     }, [navigation]),
//   );

//   // Fetch notifications
//   const fetchNotifications = useCallback(async () => {
//     try {
//       if (!userData?.employeeId) return;

//       const data = await RetrieveEmployeeNotification({
//         employeeId: userData.employeeId,
//       });

//       if (Array.isArray(data)) {
//         setNotifications(data);
//         setNotificationCount(data.length);
//       }
//     } catch (err) {
//       console.error('Error fetching notifications:', err);
//     }
//   }, [userData?.employeeId]);

//   useEffect(() => {
//     const interval = setInterval(fetchNotifications, 30000);
//     fetchNotifications();
//     return () => clearInterval(interval);
//   }, [fetchNotifications]);

//   // Header config
//   useEffect(() => {
//     if (isHeaderActive) {
//       const headerOptions = MainPageHeader({
//         onToggleDrawer: toggleDrawer,
//         onTitle: pageTitle,
//         onShowNotify: toggleNotification,
//         onCount: notificationCount,
//         onLogout: handleLogout,
//         isBack: false,
//         onDatPress: toggleCompanyDropdown,
//         selectedDat:
//           selectedLegalEntity ||
//           defaultLegalEntity ||
//           t('actionPane.selectCompany'),
//         defaultDat: defaultLegalEntity,
//       });
//       navigation.setOptions(headerOptions);
//     }
//   }, [
//     navigation,
//     pageTitle,
//     notificationCount,
//     selectedLegalEntity,
//     defaultLegalEntity,
//     isHeaderActive,
//   ]);

//   // Handle company selection with refresh functionality
//   const handleCompanySelect = async newLegalEntity => {
//     setDropdownVisible(false);

//     try {
//       dispatch(setSelectedLegalEntity(newLegalEntity));

//       // ✅ Use userData.Person instead of userData.employeeId
//       const newMenuItems = await fetchEmployeeMenuItemsByCompany(
//         userData?.Person,
//         newLegalEntity,
//       );

//       dispatch(setMenuItems(newMenuItems));

//       if (onRefresh) {
//         await onRefresh();
//       }
//     } catch (error) {
//       dispatch(setSelectedLegalEntity(selectedLegalEntity));

//       setAlertMessage(t('actionPane.companyChangeFailed'));
//       setAlertModal(true);
//     }
//   };

//   const toggleDrawer = () => {
//     closeAllOverlays();
//     navigation.toggleDrawer();
//   };

//   const toggleNotification = () => {
//     setDropdownVisible(false);
//     setNotificationVisible(prev => !prev);
//   };

//   const handleLogout = () => {
//     closeAllOverlays();
//     setModalVisible(true);
//   };

//   const toggleCompanyDropdown = () => {
//     setNotificationVisible(false);
//     setDropdownVisible(prev => !prev);
//   };

//   const confirmLogout = () => {
//     dispatch(resetCompanyState());
//     setModalVisible(false);
//     navigation.navigate('Login');
//   };

//   const handleTabPress = tabName => {
//     setActiveTab(tabName);
//     navigation.navigate('TabNavigator', {
//       screen: tabName,
//       params: {userData},
//     });
//   };

//   return (
//     <View style={styles.APCont_container}>
//       {/* Main content */}
//       <View style={styles.APCont_content}>{children}</View>

//       {/* Custom Tab Bar */}
//       {showTabNavigator && (
//         <CustomTabBar activeTab={activeTab} onTabPress={handleTabPress} />
//       )}

//       {/* Floating Button */}
//       {showFloatingButton && (
//         <View style={styles.APCont_floatingPlusButtonContainer}>
//           <TouchableOpacity
//             style={styles.APCont_floatingPlusButton}
//             onPress={onFloatingButtonPress}>
//             <FontAwesome name="plus" style={styles.APCont_plusIcon} />
//           </TouchableOpacity>
//         </View>
//       )}

//       {/* Modals */}
//       <AlertModal
//         visible={alertModal}
//         heading={t('common.alert')}
//         text={alertMessage}
//         onPress={() => setAlertModal(false)}
//       />

//       <LogoutAlertModal
//         visible={modalVisible}
//         heading={t('profile.logoutConfirm')}
//         text={t('profile.logoutConfirm')}
//         onConfirm={confirmLogout}
//         onCancel={() => setModalVisible(false)}
//       />

//       {/* Notification Panel */}
//       <NotificationPanel
//         visible={notificationVisible}
//         notifications={notifications}
//         onClose={() => setNotificationVisible(false)}
//         onRefresh={fetchNotifications}
//         employeeId={userData?.employeeId}
//       />

//       {dropdownVisible && (
//         <CompanyDropdown
//           visible={dropdownVisible}
//           onClose={() => setDropdownVisible(false)}
//           legalEntities={legalEntities}
//           selectedLegalEntity={selectedLegalEntity}
//           onSelect={handleCompanySelect}
//         />
//       )}
//     </View>
//   );
// };

// export default ActionPaneContainer;
/* eslint-disable no-unused-vars */
/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useCallback} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  BackHandler,
  StyleSheet,
} from 'react-native';
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

// ─────────────────────────────────────────────────────────────────────────────
//  Status color map — shared with pill renderer
// ─────────────────────────────────────────────────────────────────────────────
const PILL_COLORS = {
  All: {active: '#0A66C2', bg: '#E8F1FB', text: '#0A66C2', dot: null},
  Draft: {active: '#6B7280', bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF'},
  Pending: {active: '#D97706', bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B'},
  Approved: {active: '#059669', bg: '#D1FAE5', text: '#065F46', dot: '#10B981'},
  Rejected: {active: '#DC2626', bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444'},
  Completed: {
    active: '#7C3AED',
    bg: '#EDE9FE',
    text: '#4C1D95',
    dot: '#8B5CF6',
  },
};

const DEFAULT_PILLS = [
  'All',
  'Draft',
  'Pending',
  'Approved',
  'Rejected',
  'Completed',
];

// ─────────────────────────────────────────────────────────────────────────────
//  FilterPills — exported so pages can also use it standalone if needed
// ─────────────────────────────────────────────────────────────────────────────
export const FilterPills = ({
  pills = DEFAULT_PILLS,
  activeFilter,
  onFilterChange,
  counts = {}, // optional — { Draft: 3, Pending: 1, ... }
}) => {
  return (
    <View style={pillStyles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={pillStyles.scrollContent}>
        {pills.map(pill => {
          const isActive = activeFilter === pill;
          const color = PILL_COLORS[pill] || PILL_COLORS.All;
          const count = counts[pill];

          return (
            <TouchableOpacity
              key={pill}
              onPress={() => onFilterChange(pill)}
              activeOpacity={0.75}
              style={[
                pillStyles.pill,
                {
                  backgroundColor: isActive ? color.active : color.bg,
                  borderColor: isActive ? color.active : 'transparent',
                },
              ]}>
              {/* Status dot for non-All pills */}
              {pill !== 'All' && color.dot && (
                <View
                  style={[
                    pillStyles.dot,
                    {backgroundColor: isActive ? '#fff' : color.dot},
                  ]}
                />
              )}

              <Text
                style={[
                  pillStyles.pillText,
                  {color: isActive ? '#fff' : color.text},
                ]}>
                {pill}
              </Text>

              {/* Count badge */}
              {count !== undefined && count > 0 && (
                <View
                  style={[
                    pillStyles.badge,
                    {
                      backgroundColor: isActive
                        ? 'rgba(255,255,255,0.25)'
                        : color.active,
                    },
                  ]}>
                  <Text
                    style={[
                      pillStyles.badgeText,
                      {color: isActive ? '#fff' : '#fff'},
                    ]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const pillStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  badge: {
    marginLeft: 2,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
//  ActionPaneContainer
// ─────────────────────────────────────────────────────────────────────────────

const ActionPaneContainer = ({
  children,
  pageTitle,
  showFloatingButton = false,
  isHeaderActive = true,
  showTabNavigator = true,
  onFloatingButtonPress,
  onRefresh,

  // ── Filter pills props (all optional) ──
  showFilterPills = false, // set true to show the pill bar
  filterPills = DEFAULT_PILLS, // which pills to show
  activeFilter = 'All', // currently selected pill
  onFilterChange = () => {}, // (pill: string) => void
  filterCounts = {}, // { Draft: 3, Pending: 1, ... }
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

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      if (!userData?.employeeId) return;
      const data = await RetrieveEmployeeNotification({
        employeeId: userData.employeeId,
      });
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

  const handleCompanySelect = async newLegalEntity => {
    setDropdownVisible(false);
    try {
      dispatch(setSelectedLegalEntity(newLegalEntity));
      const newMenuItems = await fetchEmployeeMenuItemsByCompany(
        userData?.Person,
        newLegalEntity,
      );
      dispatch(setMenuItems(newMenuItems));
      if (onRefresh) await onRefresh();
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
      <View style={styles.APCont_content}>
        {/* ── Filter Pills (rendered at the top of content area) ── */}
        {showFilterPills && (
          <FilterPills
            pills={filterPills}
            activeFilter={activeFilter}
            onFilterChange={onFilterChange}
            counts={filterCounts}
          />
        )}

        {children}
      </View>

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
