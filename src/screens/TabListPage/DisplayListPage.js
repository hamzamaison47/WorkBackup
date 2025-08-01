/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useCallback} from 'react';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  BackHandler,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import NotificationDropdown from '../../components/NotificationDropdown';
import {retrieveByEmail} from '../../API/WorkflowTrackingStatusTable/retrieveByEmail';
import MainPageHeader from '../../components/PageHeader/MainPageHeader';
import LogoutAlertModal from '../../components/Leaves/LogoutAlertModal';
import CompanyDropdown from '../../components/PageHeader/CompanyDropdown';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import {setSelectedLegalEntity} from '../../store/slices/companySlice';

const {width, height} = Dimensions.get('window');

const DisplayListPage = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const userData = useSelector(state => state.user.userData);
  const selectedLegalEntity = useSelector(
    state => state.company.selectedLegalEntity,
  );
  const legalEntities = useSelector(state => state.company.legalEntities);

  const pages = [
    {
      id: '1',
      title: 'Leave Request',
      icon: 'calendar-outline',
      screen: 'LeaveSaveRecord',
      color: '#f59e0b',
      category: 'PR',
      onPress: () =>
        navigation.navigate('LeavesListPage', {
          employeeId: userData.employeeId,
          employeeName: userData.employeeName,
          WorkerRecId: userData.WorkerRecId,
          cameFrom: 'DisplayListPage',
        }),
    },
    {
      id: '2',
      title: 'Salary Slip',
      icon: 'card-outline',
      screen: 'PRSalarySlip',
      color: '#f59e0b',
      category: 'PR',
      onPress: () =>
        navigation.navigate('PRSalarySlip', {
          employeeId: userData.employeeId,
        }),
    },
  ];

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [filteredPages, setFilteredPages] = useState(pages);
  const [isCompanySwitching, setIsCompanySwitching] = useState(false);

  useFocusEffect(
    useCallback(() => {
      closeAllOverlays();
      const onBackPress = () => {
        handleLogout();
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => {
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
      };
    }, []),
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', closeAllOverlays);
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    fetchNotifications();
    return () => clearInterval(interval);
  }, [userData.email]);

  useEffect(() => {
    const headerOptions = MainPageHeader({
      onToggleDrawer: toggleDrawer,
      onTitle: 'Employee History',
      onShowNotify: toggleNotification,
      onCount: notificationCount,
      onLogout: handleLogout,
      isBack: false,
      onDatPress: toggleCompanyDropdown,
      selectedDat:
        selectedLegalEntity || userData?.defaultLegalEntity || 'Select Company',
      defaultDat: userData?.defaultLegalEntity,
    });
    navigation.setOptions(headerOptions);
  }, [
    navigation,
    notificationCount,
    notificationVisible,
    notifications,
    toggleDrawer,
    selectedLegalEntity,
    userData?.defaultLegalEntity,
  ]);

  useEffect(() => {
    filterPages(activeFilter);
  }, [activeFilter]);

  const handleCompanySelect = async newLegalEntity => {
    setIsCompanySwitching(true);
    dispatch(setSelectedLegalEntity(newLegalEntity));
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsCompanySwitching(false);
  };

  const closeAllOverlays = () => {
    setDropdownVisible(false);
    setNotificationVisible(false);
    setModalVisible(false);
    navigation.closeDrawer?.();
  };

  const toggleNotification = () => {
    closeAllOverlays();
    setNotificationVisible(prev => !prev);
  };
  const toggleDrawer = () => {
    closeAllOverlays();
    navigation.toggleDrawer();
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

  const filterPages = category => {
    setFilteredPages(
      category === 'All'
        ? pages
        : pages.filter(page => page.category === category),
    );
  };

  const handleFilterPress = filter => setActiveFilter(filter);

  const fetchNotifications = async () => {
    try {
      const data = await retrieveByEmail({email: userData.email});
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

  const handlePagePress = page => {
    // console.log(`Navigating to: ${page.screen}`);
    if (page.onPress) {
      page.onPress();
    }
  };

  const getCategoryDisplayName = category => {
    switch (category) {
      case 'PR':
        return 'Payroll';
      case 'HR':
        return 'Human Resource';
      case 'TAS':
        return 'Time Attendance';
      default:
        return category;
    }
  };

  const renderFilterButton = filter => (
    <TouchableOpacity
      key={filter}
      style={[
        styles.filterButton,
        activeFilter === filter && styles.activeFilterButton,
      ]}
      onPress={() => handleFilterPress(filter)}
      activeOpacity={0.7}>
      <Text
        style={[
          styles.filterButtonText,
          activeFilter === filter && styles.activeFilterButtonText,
        ]}>
        {filter}
      </Text>
    </TouchableOpacity>
  );

  const renderMenuItem = item => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={() => handlePagePress(item)}
      activeOpacity={0.7}>
      <View style={[styles.iconWrapper, {backgroundColor: item.color}]}>
        <Ionicons name={item.icon} size={width * 0.06} color="#ffffff" />
      </View>
      <Text style={styles.menuTitle}>{item.title}</Text>
      <Ionicons name="chevron-forward" size={width * 0.04} color="#9ca3af" />
    </TouchableOpacity>
  );

  const renderNoMenuMessage = () => (
    <View style={styles.noMenuContainer}>
      <Text style={styles.noMenuText}>
        No menu item for{'\n'}
        {getCategoryDisplayName(activeFilter)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.filterContainer}>
        <View style={styles.filterScrollContent}>
          {['All', 'PR', 'HR', 'TAS'].map(filter => renderFilterButton(filter))}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.menuContainer}>
          {filteredPages.length > 0
            ? filteredPages.map(renderMenuItem)
            : renderNoMenuMessage()}
        </View>
        <View style={styles.bottomPadding} />
      </ScrollView>

      {isCompanySwitching && (
        <View style={styles.loadingOverlay}>
          <CustomIndicator size="large" color="#007AFF" />
        </View>
      )}

      {notificationVisible && (
        <NotificationDropdown
          visible={notificationVisible}
          notifications={notifications}
          onClose={closeNotification}
        />
      )}

      <LogoutAlertModal
        visible={modalVisible}
        heading="Are you sure?"
        text="Do you really want to logout?"
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  filterContainer: {
    backgroundColor: '#ffefe3',
    paddingBottom: 0,
    paddingHorizontal: 0,
    marginBottom: height * 0.01,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 2,
  },
  filterScrollContent: {
    paddingHorizontal: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  filterButton: {
    flex: 1,
    paddingVertical: height * 0.02,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    position: 'relative',
  },
  activeFilterButton: {
    borderBottomWidth: 5,
    borderBottomColor: '#ff6b35',
  },
  filterButtonText: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  activeFilterButtonText: {
    color: '#ff6b35',
    fontWeight: '700',
  },
  menuContainer: {
    paddingTop: width * 0.05,
    paddingHorizontal: width * 0.03,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.05,
    marginBottom: height * 0.015,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 3,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    minHeight: height * 0.08,
  },
  iconWrapper: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: width * 0.04,
  },
  menuTitle: {
    flex: 1,
    fontSize: width * 0.042,
    fontWeight: '600',
    color: '#1f2937',
  },
  noMenuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: height * 0.1,
  },
  noMenuText: {
    fontSize: width * 0.045,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: width * 0.055,
  },
  bottomPadding: {
    height: height * 0.05,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 9999,
  },
});

export default DisplayListPage;
