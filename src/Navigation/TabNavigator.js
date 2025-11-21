/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unstable-nested-components */
import React, {useRef, useEffect} from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Animated} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import MainDashboard from '../screens/Maindasboard';
import DisplayListPage from '../screens/TabListPage/DisplayListPage';
import WorkerAssignedToMe from '../screens/WorkerAssignedToMe/WorkerAssignedToMe';
import Profile from '../screens/Profile/Profile';

import styles from '../styles/styles';
import CustomTabBar from '../Controller/CustomTabBar';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
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
          } else if (route.name === 'WorkItemAssignedToMe') {
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
      <Tab.Screen
        name="MainDashboard"
        component={MainDashboard}
        options={{tabBarLabel: 'Home'}}
      />
      <Tab.Screen
        name="WorkerAssignedToMe"
        component={WorkerAssignedToMe}
        options={{tabBarLabel: 'My Team'}}
      />
      <Tab.Screen
        name="DisplayListPage"
        component={DisplayListPage}
        options={{tabBarLabel: 'History'}}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{tabBarLabel: 'Profile'}}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
