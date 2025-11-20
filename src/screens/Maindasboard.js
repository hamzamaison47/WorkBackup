/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useCallback} from 'react';
import {
  SafeAreaView,
  ScrollView,
  RefreshControl,
  BackHandler,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useSelector, useDispatch} from 'react-redux';

import ActionPaneContainer from '../components/ActionPaneContainer';
import LogoutAlertModal from '../components/Alert/LogoutAlertModal';
import CustomIndicator from '../components/CustomIndicator/CustomIndicator';
import AttendanceCalendar from '../components/Attendance/AttendanceCalender';

import DashboardHeader from '../components/MainDashboard/DashboardHeader';
import MenuGrid from '../components/MainDashboard/MenuGrid';

import {setSelectedLegalEntity} from '../store/slices/companySlice';
import {useDashboardDimensions} from '../hooks/useDashboardDimensions';
import {useDashboardData} from '../hooks/useDashboardData';
import {useMenuBuilder} from '../hooks/useMenuBuilder';

import styles from '../styles/styles';
import AttendanceSummary from '../components/MainDashboard/AttendanceSummary';
import LeaveEntitlementProgress from '../components/MainDashboard/LeaveEntitlementProgress';

const MainDashboard = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  // Custom hooks
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

  // Redux
  const userData = useSelector(state => state.user.userData);
  const selectedLegalEntity = useSelector(
    state => state.company.selectedLegalEntity,
  );

  // Menu builder
  const {dynamicMenus, handleCardPress} = useMenuBuilder(
    userData,
    selectedLegalEntity,
    navigation,
  );

  // Set default legal entity
  useEffect(() => {
    if (userData?.defaultLegalEntity && !selectedLegalEntity) {
      dispatch(setSelectedLegalEntity(userData.defaultLegalEntity));
    }
  }, [userData?.defaultLegalEntity, selectedLegalEntity]);

  // Close drawer on blur
  useEffect(() => {
    const unsub = navigation.addListener('blur', () => {
      navigation.closeDrawer?.();
    });
    return unsub;
  }, [navigation]);

  useEffect(() => {
    fetchProfilePicture(userData?.employeeId);
  }, [userData?.employeeId]);

  // Android Back Handler → Logout
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

  // Logout handlers
  const confirmLogout = () => {
    setModalVisible(false);
    navigation.navigate('Login');
  };

  const cancelLogout = () => setModalVisible(false);

  return (
    <ActionPaneContainer
      pageTitle="Dynaface"
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={false}
      onRefresh={handleRefresh}>
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <SafeAreaView style={styles.MainDash_Container}>
          <ScrollView
            style={styles.MainDash_ScrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }>
            {/* Header with Profile */}
            <DashboardHeader
              userData={userData}
              profilePictureUrl={profilePictureUrl}
              isLoading={isLoading}
              isSmallScreen={dimensions.isSmallScreen}
              onProfilePress={() => navigation.navigate('Profile')}
            />

            {/* Attendance Calendar */}
            <AttendanceCalendar
              userData={userData}
              navigation={navigation}
              screenWidth={dimensions.screenWidth}
              H_PADDING={dimensions.H_PADDING}
            />

            {/* Attendance Summary */}
            <AttendanceSummary
              userData={userData}
              screenWidth={dimensions.screenWidth}
            />

            {/* Leave Balance Progress Summary */}
            <LeaveEntitlementProgress
              userData={userData}
              screenWidth={dimensions.screenWidth}
            />

            {/* Menu Grid */}
            <MenuGrid
              dynamicMenus={dynamicMenus}
              dimensions={dimensions}
              onCardPress={handleCardPress}
            />
          </ScrollView>
        </SafeAreaView>
      )}

      <LogoutAlertModal
        visible={modalVisible}
        heading="Are you sure you want to logout?"
        text="Are you sure you want to logout?"
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />
    </ActionPaneContainer>
  );
};

export default MainDashboard;
