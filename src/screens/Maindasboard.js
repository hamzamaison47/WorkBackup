// screens/MainDashboard.js

/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useCallback, useState, useRef, useMemo} from 'react';
import {
  SafeAreaView,
  Animated,
  RefreshControl,
  BackHandler,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useSelector, useDispatch} from 'react-redux';
// near your other imports
import useDashboardAlerts from '../hooks/useDashboardAlerts';
import DashboardAlertsCard from '../components/PageHeader/DashboardAlertsCard';

import ActionPaneContainer from '../components/ActionPaneContainer';
import LogoutAlertModal from '../components/Alert/LogoutAlertModal';
import CustomIndicator from '../components/CustomIndicator/CustomIndicator';
import DashboardHeader from '../components/MainDashboard/DashboardHeader';
import MenuGrid from '../components/MainDashboard/MenuGrid';
import useTodayAttendance from '../hooks/Usetodayattendance';
import {
  buildOpdClaimAlert,
  buildOpdClaimStatusAlerts,
} from '../store/utils/dashboardAlertRules';
import {GetAllExpenseManagementHeaders} from '../Customizations/IDAP/API/ExpenseManagement/Header/GetAllExpenseManagementHeaders';
import QuickAccessSheet, {
  QuickAccessButton,
} from '../components/MainDashboard/QuickAccessSheet';

import MasterService from '../services/MasterService';
import {handleLogoutauth} from '../Controller/authUtils';
import {setSelectedLegalEntity} from '../store/slices/companySlice';
import {useDashboardDimensions} from '../hooks/useDashboardDimensions';
import {useDashboardData} from '../hooks/useDashboardData';
import {useMenuBuilder} from '../hooks/useMenuBuilder';
import useAppTokens from '../components/AppComponentsDesign/useAppTokens';

import styles from '../styles/styles';

const MainDashboard = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const scrollY = useRef(new Animated.Value(0)).current;
  const calendarRef = useRef();
  const T = useAppTokens(); // ← add this at top

  // Allow AttendanceCalendar to set its ref in navigation
  navigation.setCalendarRef = ref => {
    calendarRef.current = ref.current;
  };

  const dimensions = useDashboardDimensions();
  const {
    isLoading,
    refreshing,
    profilePictureUrl,
    modalVisible,
    setModalVisible,
    fetchProfilePicture,
    handleRefresh,
  } = useDashboardData();

  const userData = useSelector(state => state.user.userData);
  const selectedLegalEntity = useSelector(
    state => state.company.selectedLegalEntity,
  );

  // console.log('[MainDashboard] userData:', {
  //   allKeys: userData ? Object.keys(userData) : 'null/undefined',
  //   fullData: userData,
  // });

  const {dynamicMenus, handleCardPress} = useMenuBuilder(
    userData,
    selectedLegalEntity,
    navigation,
  );

  const [quickAccessVisible, setQuickAccessVisible] = useState(false);
  // inside the component:
  const {
    attendanceRecords,
    isLoading: attendanceLoading,
    refresh: refreshAttendance,
  } = useTodayAttendance();
  const {alerts: baseAlerts} = useDashboardAlerts(
    attendanceRecords,
    attendanceLoading,
  );

  // NEW — bumping this forces ApprovalsSection (and anything else keyed on
  // it) to re-fetch, since MenuGrid's approvals list has its own fetch
  // effect that isn't otherwise triggered by pull-to-refresh.
  const [refreshKey, setRefreshKey] = useState(0);

  const [medicalHeaders, setMedicalHeaders] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!userData?.employeeId) return;
      try {
        const data = await GetAllExpenseManagementHeaders({
          personnelNumber: userData.employeeId,
          purpose: 'Medical',
        });
        if (!cancelled) setMedicalHeaders(data || []);
      } catch {
        if (!cancelled) setMedicalHeaders([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userData?.employeeId, refreshKey]);

  const alerts = useMemo(() => {
    const attendance = (baseAlerts || []).map(a => ({
      ...a,
      screen: 'AttendanceManagement',
    }));

    const opdScreen = 'MedicalExpenseManagmentListPage';
    const opd = buildOpdClaimAlert(medicalHeaders);
    const opdStatus = buildOpdClaimStatusAlerts(medicalHeaders);

    return [
      ...(opd ? [{...opd, screen: opdScreen}] : []),
      ...opdStatus.map(a => ({...a, screen: opdScreen})),
      ...attendance,
    ];
  }, [medicalHeaders, baseAlerts]);

  const handleAlertPress = useCallback(
    alert => {
      if (!alert?.screen) return;

      navigation.navigate(alert.screen, {
        employeeId: userData?.employeeId,
        employeeName: userData?.employeeName,
        WorkerRecId: userData?.WorkerRecId,
        userData,
        cameFrom: 'MainDashboard',
        selectedLegalEntity,
        // AttendanceManagement only shows the tab bar when this is true
        ...(alert.screen === 'AttendanceManagement' ? {fromTab: true} : {}),
      });
    },
    [navigation, userData, selectedLegalEntity],
  );

  const handleRefreshAll = useCallback(async () => {
    setRefreshKey(k => k + 1);
    await Promise.all([handleRefresh(), refreshAttendance()]);
  }, [handleRefresh, refreshAttendance]);

  // Initialize Leave Service
  const masterService = MasterService();

  useEffect(() => {
    if (userData?.employeeId) {
      masterService.initialize(userData);
    }
  }, [userData, masterService]);

  useEffect(() => {
    if (userData?.defaultLegalEntity && !selectedLegalEntity) {
      dispatch(setSelectedLegalEntity(userData.defaultLegalEntity));
    }
  }, [userData?.defaultLegalEntity, selectedLegalEntity]);

  useEffect(() => {
    const unsub = navigation.addListener('blur', () => {
      navigation.closeDrawer?.();
    });
    return unsub;
  }, [navigation]);

  // Refresh calendar when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (
        calendarRef.current &&
        typeof calendarRef.current.refreshCalendar === 'function'
      ) {
        calendarRef.current.refreshCalendar();
      }
    }, []),
  );

  useEffect(() => {
    fetchProfilePicture(userData?.employeeId);
  }, [userData?.employeeId]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        setModalVisible(true);
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, []),
  );

  const confirmLogout = () => {
    setModalVisible(false);
    // Reached via the hardware back button (useFocusEffect above), so this is
    // an easy path to hit. Was a bare navigation.reset() with no teardown.
    handleLogoutauth(navigation);
  };

  const cancelLogout = () => setModalVisible(false);

  // const [chatVisible, setChatVisible] = useState(false);

  return (
    <>
      <ActionPaneContainer
        pageTitle="IDAP360"
        showPageTitleRow={false}
        isBackButton={false}
        showFooter={false}
        showFloatingButton={false}
        isHeaderActive={true}
        showTabNavigator={true}
        onRefresh={handleRefreshAll}>
        {isLoading ? (
          <CustomIndicator />
        ) : (
          <SafeAreaView
            style={[styles.MainDash_Container, {backgroundColor: T.pageBg}]}>
            <Animated.ScrollView
              style={[styles.MainDash_ScrollView, {backgroundColor: T.pageBg}]}
              showsVerticalScrollIndicator={false}
              onScroll={Animated.event(
                [{nativeEvent: {contentOffset: {y: scrollY}}}],
                {useNativeDriver: false},
              )}
              scrollEventThrottle={16}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefreshAll}
                />
              }>
              <DashboardHeader
                userData={userData}
                profilePictureUrl={profilePictureUrl}
                isLoading={isLoading}
                isSmallScreen={dimensions.isSmallScreen}
                onProfilePress={() => navigation.navigate('Profile')}
                attendanceRecords={attendanceRecords}
              />

              <DashboardAlertsCard
                alerts={alerts}
                onAlertPress={handleAlertPress}
              />

              <MenuGrid
                dynamicMenus={dynamicMenus}
                dimensions={dimensions}
                onCardPress={handleCardPress}
                userData={userData}
                refreshKey={refreshKey}
              />

              <View style={{height: 24}} />
            </Animated.ScrollView>
          </SafeAreaView>
        )}

        <LogoutAlertModal
          visible={modalVisible}
          heading="Are you sure you want to logout?"
          text="Are you sure you want to logout?"
          onConfirm={confirmLogout}
          onCancel={cancelLogout}
        />

        <QuickAccessButton onPress={() => setQuickAccessVisible(true)} />
      </ActionPaneContainer>

      <QuickAccessSheet
        visible={quickAccessVisible}
        onClose={() => setQuickAccessVisible(false)}
        menus={dynamicMenus}
        onCardPress={handleCardPress}
      />

      {/* <AIFloatingButton onPress={() => setChatVisible(true)} scrollY={scrollY} />
      <AIChatbot
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        serviceInstance={masterService}
      /> */}
    </>
  );
};

export default MainDashboard;
