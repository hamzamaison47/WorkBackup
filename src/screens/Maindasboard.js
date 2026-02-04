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
import AttendanceCalendar from '../components/Attendance/AttendanceCalender';
import DashboardHeader from '../components/MainDashboard/DashboardHeader';
import MenuGrid from '../components/MainDashboard/MenuGrid';
import LeaveEntitlementProgress from '../components/MainDashboard/LeaveEntitlementProgress';
import AIChatbot from '../components/AIChatbot/AIChatbot';
import AIFloatingButton from '../components/AIChatbot/AIFloatingButton';

import {setSelectedLegalEntity} from '../store/slices/companySlice';
import {useDashboardDimensions} from '../hooks/useDashboardDimensions';
import {useDashboardData} from '../hooks/useDashboardData';
import {useMenuBuilder} from '../hooks/useMenuBuilder';

import styles from '../styles/styles';

const MainDashboard = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const scrollY = useRef(new Animated.Value(0)).current;
  const calendarRef = useRef();

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

  const {dynamicMenus, handleCardPress} = useMenuBuilder(
    userData,
    selectedLegalEntity,
    navigation,
  );

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
    navigation.navigate('Login');
  };

  const cancelLogout = () => setModalVisible(false);

  const [chatVisible, setChatVisible] = useState(false);
  const [chatInitialMessages, setChatInitialMessages] = useState([]);

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
          <Animated.ScrollView
            style={styles.MainDash_ScrollView}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{nativeEvent: {contentOffset: {y: scrollY}}}],
              {useNativeDriver: false}, // REQUIRED for width/height animations
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

            <AttendanceCalendar
              userData={userData}
              navigation={navigation}
              screenWidth={dimensions.screenWidth}
              H_PADDING={dimensions.H_PADDING}
              ref={calendarRef}
            />

            <LeaveEntitlementProgress
              userData={userData}
              screenWidth={dimensions.screenWidth}
            />

            <MenuGrid
              dynamicMenus={dynamicMenus}
              dimensions={dimensions}
              onCardPress={handleCardPress}
            />

            {/* Bottom spacing so content isn't hidden behind the button */}
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

      <AIFloatingButton
        scrollY={scrollY}
        onPress={() => {
          setChatInitialMessages([
            {
              id: String(Date.now()),
              from: 'bot',
              text: 'Hey! How may I help you?',
            },
          ]);
          setChatVisible(true);
        }}
      />

      <AIChatbot
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        initialMessages={chatInitialMessages}
      />
    </ActionPaneContainer>
  );
};

export default MainDashboard;
