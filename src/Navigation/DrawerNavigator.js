/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unstable-nested-components */
import React, {useContext, useEffect, useState} from 'react';
import {Image, View, StyleSheet} from 'react-native';
import {createDrawerNavigator} from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/FontAwesome';
import {UserContext} from '../context/UserContext';

import LeaveRequest from '../screens/Leaves/LeaveRequest';
import EndOfService from '../screens/EOS/EndOfService';
import PRSalarySlip from '../screens/Reports/PRSalarySlip';
import PRTaxCertificate from '../screens/Reports/PRTaxCertificate';
import AdvanceSalarySlip from '../screens/Advance/AdvanceSalarySlip';
import EntitlementBalance from '../screens/EntitlementBalance/EntitlementBalance';

import {retrieveByEmail} from '../API/WorkflowTrackingStatusTable/retrieveByEmail';
import NotificationButton from '../components/NotificationButton';
import NotificationDropdown from '../components/NotificationDropdown';
import logo from '../assets/cloud.png';
import TabNavigator from './TabNavigator';

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  const {userData} = useContext(UserContext);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationVisible, setNotificationVisible] = useState(false);

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

  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    fetchNotifications(); // Initial fetch
    return () => clearInterval(interval);
  }, [userData.email]);

  const showNotification = () => setNotificationVisible(true);

  return (
    <>
      <Drawer.Navigator
        initialRouteName="TabNavigator"
        screenOptions={{
          drawerStyle: {backgroundColor: '#F0F0F0'},
          drawerActiveTintColor: '#FFA500',
          drawerInactiveTintColor: '#333333',
          headerStyle: {backgroundColor: '#FFA500'},
          headerTintColor: '#FFFFFF',
          headerTitleAlign: 'center',
          headerTitle: () => <Image source={logo} style={styles.headerImage} />,
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              <NotificationButton
                onPress={showNotification}
                notificationCount={notificationCount}
              />
            </View>
          ),
          headerShown: false,
        }}>
        {/* Main Dashboard */}
        <Drawer.Screen
          name="TabNavigator"
          component={TabNavigator}
          initialParams={{userData}}
          options={{
            title: 'Home',
            drawerIcon: () => <Icon name="home" size={24} color="#FFA500" />,
          }}
        />
        <Drawer.Screen
          name="Leaves"
          component={LeaveRequest}
          initialParams={{userData}}
          options={{
            title: 'Leave Requests',
            drawerIcon: () => (
              <Icon name="calendar" size={24} color="#FFA500" />
            ),
            headerShown: true,
          }}
        />
        <Drawer.Screen
          name="EndOfService"
          component={EndOfService}
          initialParams={{userData}}
          options={{
            title: 'Resignation Requests',
            drawerIcon: () => (
              <Icon name="calendar" size={24} color="#FFA500" />
            ),
            headerShown: true,
          }}
        />
        <Drawer.Screen
          name="EntitlementBalance"
          component={EntitlementBalance}
          initialParams={{userData}}
          options={{
            title: 'Entitlement Balance',
            drawerIcon: () => (
              <Icon name="balance-scale" size={20} color="#FFA500" />
            ),
            headerShown: true,
          }}
        />
        <Drawer.Screen
          name="PRSalarySlip"
          component={PRSalarySlip}
          initialParams={{userData}}
          options={{
            title: 'Salary Slip',
            drawerIcon: () => <Icon name="money" size={24} color="#FFA500" />,
            headerShown: true,
          }}
        />
        <Drawer.Screen
          name="PRTaxCertificate"
          component={PRTaxCertificate}
          initialParams={{userData}}
          options={{
            title: 'Tax Certificate',
            drawerIcon: () => (
              <Icon name="certificate" size={24} color="#FFA500" />
            ),
            headerShown: true,
          }}
        />
        <Drawer.Screen
          name="AdvanceSalarySlip"
          component={AdvanceSalarySlip}
          initialParams={{userData}}
          options={{
            title: 'Loan Request',
            drawerIcon: () => (
              <Icon name="handshake-o" size={20} color="#FFA500" />
            ),
            headerShown: true,
          }}
        />
      </Drawer.Navigator>

      <NotificationDropdown
        visible={notificationVisible}
        notifications={notifications}
        onClose={() => setNotificationVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  headerImage: {
    width: 100,
    height: 40,
  },
});

export default DrawerNavigator;
