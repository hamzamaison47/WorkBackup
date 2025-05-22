import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import MainDashboard from '../screens/Maindasboard';
import WorkItemAssigned from '../screens/WorkItemsAssignedToMe/WorkItemAssigned';
import DisplayPersonalInfo from '../screens/PersonalInformation/DisplayPersonalInfo';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        // eslint-disable-next-line react/no-unstable-nested-components
        tabBarIcon: ({focused, color, size}) => {
          let iconName;

          if (route.name === 'MainDashboard') {
            iconName = focused ? 'speedometer' : 'speedometer-outline';
          } else if (route.name === 'WorkItemAssigned') {
            iconName = focused ? 'library' : 'library-outline';
          } else if (route.name === 'DisplayPersonalInfo') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'orange',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {backgroundColor: '#ffefe3', height: 60},
        // headerShown: false,
      })}>
      <Tab.Screen
        name="MainDashboard"
        component={MainDashboard}
        options={{
          tabBarLabel: 'Dashboard',
          // tabBarStyle: {backgroundColor: 'white', height: 60},
          // headerShown: false,
        }}
      />
      <Tab.Screen
        name="WorkItemAssigned"
        component={WorkItemAssigned}
        options={{
          tabBarLabel: 'Work Items',
          // tabBarStyle: {backgroundColor: 'white', height: 60},
          // tabBarShowLabel: false,
          // headerShown: false,
        }}
      />
      <Tab.Screen
        name="DisplayPersonalInfo"
        component={DisplayPersonalInfo}
        options={{
          tabBarLabel: 'Profile',
          // tabBarStyle: {backgroundColor: 'white', height: 60},
          //   tabBarBadge: 3,
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
