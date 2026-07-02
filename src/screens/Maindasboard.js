// screens/MainDashboard.js

/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useCallback, useState, useRef} from 'react';
import {
  SafeAreaView,
  Animated,
  RefreshControl,
  BackHandler,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useSelector, useDispatch} from 'react-redux';

import ActionPaneContainer from '../components/ActionPaneContainer';
import LogoutAlertModal from '../components/Alert/LogoutAlertModal';
import CustomIndicator from '../components/CustomIndicator/CustomIndicator';
import DashboardHeader from '../components/MainDashboard/DashboardHeader';
import MenuGrid from '../components/MainDashboard/MenuGrid';
import AIChatbot from '../components/AIChatbot/AIChatbot';
import AIFloatingButton from '../components/AIChatbot/AIFloatingButton';
import QuickAccessSheet, {
  QuickAccessButton,
} from '../components/MainDashboard/QuickAccessSheet';

import MasterService from '../services/MasterService';
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

  console.log('[MainDashboard] userData:', {
    allKeys: userData ? Object.keys(userData) : 'null/undefined',
    fullData: userData,
  });

  const {dynamicMenus, handleCardPress} = useMenuBuilder(
    userData,
    selectedLegalEntity,
    navigation,
  );

  const [quickAccessVisible, setQuickAccessVisible] = useState(false);

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
    navigation.reset({index: 0, routes: [{name: 'Login'}]});
  };

  const cancelLogout = () => setModalVisible(false);

  const [chatVisible, setChatVisible] = useState(false);

  return (
    <>
      <ActionPaneContainer
        pageTitle="Dynaface"
        showPageTitleRow={false}
        isBackButton={false}
        showFooter={false}
        showFloatingButton={false}
        isHeaderActive={true}
        showTabNavigator={true}
        onRefresh={handleRefresh}>
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
                  onRefresh={handleRefresh}
                />
              }>
              <DashboardHeader
                userData={userData}
                profilePictureUrl={profilePictureUrl}
                isLoading={isLoading}
                isSmallScreen={dimensions.isSmallScreen}
                onProfilePress={() => navigation.navigate('Profile')}
              />

              <MenuGrid
                dynamicMenus={dynamicMenus}
                dimensions={dimensions}
                onCardPress={handleCardPress}
                userData={userData}
              />

              <View style={{height: 100}} />
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
