/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unstable-nested-components */
import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {View, TouchableOpacity, StyleSheet, Text} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/FontAwesome';

import {useNotifications} from '../context/NotificationContext';
import MainDashboard from '../screens/Maindasboard';
// import WorkItemAssigned from '../screens/WorkItemsAssignedToMe/WorkItemAssigned';
import DisplayPersonalInfo from '../screens/PersonalInformation/DisplayPersonalInfo';
import DisplayListPage from '../screens/TabListPage/DisplayListPage';
// import NotificationPage from '../screens/Notifications/NotificationPage';
import WorkerAssignedToMe from '../screens/WorkerAssignedToMe/WorkerAssignedToMe';

const Tab = createBottomTabNavigator();

const NotificationIcon = ({focused, color, size}) => {
  const {unreadCount} = useNotifications();

  return (
    <View style={styles.iconContainer}>
      <Ionicons
        name={focused ? 'notifications' : 'notifications-outline'}
        size={size}
        color={color}
      />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </View>
  );
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="MainDashboard"
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName;

          if (route.name === 'MainDashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'WorkItemAssigned') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'DisplayListPage') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'NotificationPage') {
            return (
              <NotificationIcon focused={focused} color={color} size={size} />
            );
          } else if (route.name === 'DisplayPersonalInfo') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'WorkerAssignedToMe') {
            return (
              <Icon focused={focused} name="users" size={20} color={color} />
            );
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'orange',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        // headerShown: false,
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
    backgroundColor: '#ffefe3',
    height: 60,
    borderColor: 'orange',
    borderTopWidth: 3,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    color: 'gray',
  },
  customButton: {
    top: -30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButton: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFA500',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    borderColor: 'orange',
    borderWidth: 3,
  },
  centerButtonSelected: {
    backgroundColor: '#FFA500',
    borderColor: 'white',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default TabNavigator;
