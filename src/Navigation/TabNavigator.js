/* eslint-disable react/no-unstable-nested-components */
import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {StyleSheet} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/FontAwesome';

import MainDashboard from '../screens/Maindasboard';
import DisplayPersonalInfo from '../screens/PersonalInformation/DisplayPersonalInfo';
import DisplayListPage from '../screens/TabListPage/DisplayListPage';
import WorkerAssignedToMe from '../screens/WorkerAssignedToMe/WorkerAssignedToMe';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="MainDashboard"
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName;

          if (route.name === 'MainDashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'DisplayListPage') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'DisplayPersonalInfo') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'WorkerAssignedToMe') {
            return (
              <Icon focused={focused} name="users" size={20} color={color} />
            );
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0A66C2',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        // headerShown: false,
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
        options={{
          tabBarLabel: 'My Team',
        }}
      />
      <Tab.Screen
        name="DisplayListPage"
        component={DisplayListPage}
        options={{tabBarLabel: 'History'}}
      />
      <Tab.Screen
        name="DisplayPersonalInfo"
        component={DisplayPersonalInfo}
        options={{tabBarLabel: 'Profile'}}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ebf5ff',
    height: 60,
    borderColor: '#0A66C2',
    borderTopWidth: 3,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    color: 'gray',
  },
});

export default TabNavigator;
