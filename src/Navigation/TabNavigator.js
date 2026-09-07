/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unstable-nested-components */
import React, {useRef, useEffect} from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Animated} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';

import ESSMyRequestStatusListPage from '../screens/ESSMyRequestStatus';
import MainDashboard from '../screens/Maindasboard';
import DisplayListPage from '../screens/TabListPage/DisplayListPage';
import WorkerAssignedToMe from '../screens/WorkerAssignedToMe/WorkerAssignedToMe';
import Profile from '../screens/Profile/Profile';

import styles from '../styles/styles';
import CustomTabBar from '../Controller/CustomTabBar';
import {translate as t} from '../store/utils/translate';
import WorkItemsAssignedToMePage from '../screens/WorkItemsAssignedToMe/WorkItemAssignedToMe';
import {screenMapping} from '../Controller/screenMapping';

const Tab = createBottomTabNavigator();

// Mustard badge for the pending-approvals count — deliberately distinct from
// the platform-default red badge color used elsewhere, since this count is
// informational (items waiting on you) rather than an error/alert state.
const MUSTARD_BADGE_BG = '#D9A404';
const MUSTARD_BADGE_TEXT = '#1A1A1A';

const TabNavigator = () => {
  const currentLanguage = useSelector(state => state.language.currentLanguage);
  const {menuItems} = useSelector(state => state.menuItem);
  const pendingWorkItemsCount = useSelector(
    state => state.workItems?.pendingCount ?? 0,
  );

  const footerTabs = menuItems.filter(
    item =>
      screenMapping[item.MenuId] &&
      item.Visible === '1' &&
      item.DisplayOnFooter === 'Yes',
  );

  const uniqueFooterTabs = footerTabs.filter(
    (it, idx, arr) =>
      !!it?.MenuId && arr.findIndex(x => x.MenuId === it.MenuId) === idx,
  );

  return (
    <Tab.Navigator
      initialRouteName="MainDashboard"
      // ⬅️ Use CustomTabBar as the tabBar
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color}) => {
          const scaleAnim = useRef(new Animated.Value(1)).current;

          useEffect(() => {
            Animated.spring(scaleAnim, {
              toValue: focused ? 1.3 : 1,
              friction: 4,
              useNativeDriver: true,
            }).start();
          }, [focused]);

          let iconName;
          if (route.name === 'MainDashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'DisplayListPage') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'WorkerAssignedToMe') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'WorkItemAssigned') {
            iconName = focused ? 'clipboard' : 'clipboard-outline';
          }

          return (
            <Animated.View style={{transform: [{scale: scaleAnim}]}}>
              <Ionicons name={iconName} size={22} color={color} />
            </Animated.View>
          );
        },
        tabBarActiveTintColor: '#ffffffff',
        tabBarInactiveTintColor: 'white',
        tabBarStyle: styles.TNav_TabBarO,
        tabBarLabelStyle: styles.TNav_TabLabelO,
        headerShadowVisible: false,
      })}>
      {uniqueFooterTabs.length > 0 ? (
        uniqueFooterTabs.map((item, idx) => {
          const ScreenComponent = screenMapping[item.MenuId];
          return (
            <Tab.Screen
              key={`${item.MenuId}-${item.Sequence ?? idx}`}
              name={item.MenuId}
              component={ScreenComponent}
              options={{
                tabBarLabel: item.Label || item.MenuId,
                tabBarBadge:
                  item.MenuId === 'WorkItemsAssignedToMePage' &&
                  pendingWorkItemsCount > 0
                    ? pendingWorkItemsCount
                    : undefined,
                // Only takes effect when tabBarBadge above is actually set,
                // so it's safe to leave unconditional here.
                tabBarBadgeStyle: {
                  backgroundColor: MUSTARD_BADGE_BG,
                  color: MUSTARD_BADGE_TEXT,
                  fontWeight: '700',
                },
              }}
            />
          );
        })
      ) : (
        <Tab.Screen
          name="MainDashboard"
          component={MainDashboard}
          options={{tabBarLabel: 'Home'}}
        />
      )}
    </Tab.Navigator>
  );
};

export default TabNavigator;
