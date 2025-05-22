/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable no-unused-vars */
import React, {useContext, useEffect, useState} from 'react';
import {Image, View, StyleSheet, Text, TouchableOpacity} from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
} from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/FontAwesome';
import {UserContext} from '../context/UserContext';

import LeaveRequest from '../screens/Leaves/LeaveRequest';
import EndOfService from '../screens/EOS/EndOfService';
import PRSalarySlip from '../screens/Reports/PRSalarySlip';
import PRTaxCertificate from '../screens/Reports/PRTaxCertificate';
import LoanRequest from '../screens/Advance/LoanRequest';
import AdvanceSalary from '../screens/Advance/AdvanceSalary';
import EntitlementBalance from '../screens/EntitlementBalance/EntitlementBalance';
import WorkerAssignedToMe from '../screens/WorkerAssignedToMe/WorkerAssignedToMe';

import {retrieveByEmail} from '../API/WorkflowTrackingStatusTable/retrieveByEmail';
import NotificationButton from '../components/NotificationButton';
import NotificationDropdown from '../components/NotificationDropdown';
import LogoutAlertModal from '../components/Leaves/LogoutAlertModal';
import logo from '../assets/cloud.png';
import TabNavigator from './TabNavigator';
import EmployeeCertificates from '../screens/EmployeeCertificates/EmployeeCertificates';
import EmployeeBankAccount from '../screens/EmployeeBankAccount/EmployeeBankAccount';
import HelpDesk from '../screens/HelpDesk/HelpDesk';

const Drawer = createDrawerNavigator();

const CustomDrawerContent = props => {
  const [modalVisible, setModalVisible] = useState(false);
  const {userData} = useContext(UserContext);

  const handleLogout = () => setModalVisible(true);
  const confirmLogout = () => {
    setModalVisible(false);
    props.navigation.navigate('Login');
  };
  const cancelLogout = () => setModalVisible(false);

  return (
    <>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{paddingTop: 0}}>
        <View style={styles.drawerHeader}>
          <Image source={logo} style={styles.drawerHeaderImage} />
          <Text style={styles.drawerHeaderText}>
            {userData?.employeeName || ''}
          </Text>
          <Text style={styles.drawerHeaderEmail}>{userData?.email || ''}</Text>
        </View>
        {/* <DrawerItem
          label="Home"
          onPress={() => props.navigation.navigate('TabNavigator')}
          icon={() => <Icon name="tachometer" size={24} color="#FFA500" />}
        /> */}
        <DrawerItem
          label="Leave Requests"
          onPress={() => props.navigation.navigate('Leaves')}
          icon={() => <Icon name="calendar" size={24} color="#FFA500" />}
        />
        <DrawerItem
          label="Resignation Requests"
          onPress={() => props.navigation.navigate('EndOfService')}
          icon={() => <Icon name="flag" size={24} color="#FFA500" />}
        />
        <DrawerItem
          label="Entitlement Balance"
          onPress={() => props.navigation.navigate('EntitlementBalance')}
          icon={() => <Icon name="balance-scale" size={20} color="#FFA500" />}
        />
        <DrawerItem
          label="Salary Slip"
          onPress={() => props.navigation.navigate('PRSalarySlip')}
          icon={() => <Icon name="money" size={24} color="#FFA500" />}
        />
        <DrawerItem
          label="Tax Certificate"
          onPress={() => props.navigation.navigate('PRTaxCertificate')}
          icon={() => <Icon name="certificate" size={24} color="#FFA500" />}
        />
        <DrawerItem
          label="Loan Request"
          onPress={() => props.navigation.navigate('LoanRequest')}
          icon={() => <Icon name="handshake-o" size={18} color="#FFA500" />}
        />
        <DrawerItem
          label="Advance Salary"
          onPress={() => props.navigation.navigate('AdvanceSalary')}
          icon={() => <Icon name="credit-card" size={18} color="#FFA500" />}
        />
        <DrawerItem
          label="My Team"
          onPress={() => props.navigation.navigate('WorkerAssignedToMe')}
          icon={() => <Icon name="users" size={18} color="#FFA500" />}
        />
        <DrawerItem
          label="Employee Certificates"
          onPress={() => props.navigation.navigate('EmployeeCertificates')}
          icon={() => <Icon name="file-text" size={18} color="#FFA500" />}
        />
        <DrawerItem
          label="Employee Bank Account"
          onPress={() => props.navigation.navigate('EmployeeBankAccount')}
          icon={() => <Icon name="bank" size={18} color="#FFA500" />}
        />
        <DrawerItem
          label="Help Desk"
          onPress={() => props.navigation.navigate('HelpDesk')}
          icon={() => <Icon name="heart-o" size={18} color="#FFA500" />}
        />
      </DrawerContentScrollView>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Log out</Text>
      </TouchableOpacity>

      <LogoutAlertModal
        visible={modalVisible}
        heading="Are you sure?"
        text="Do you really want to logout?"
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />
    </>
  );
};

const DrawerNavigator = () => {
  const {userData} = useContext(UserContext);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationVisible, setNotificationVisible] = useState(false);

  const toggleNotification = () => setNotificationVisible(!notificationVisible);

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

  return (
    <>
      <Drawer.Navigator
        initialRouteName="TabNavigator"
        drawerContent={props => <CustomDrawerContent {...props} />}
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
                onPress={toggleNotification}
                notificationCount={notificationCount}
              />
            </View>
          ),
          headerShown: false,
        }}>
        <Drawer.Screen
          name="TabNavigator"
          component={TabNavigator}
          initialParams={{userData}}
          options={{
            title: 'Home',
            drawerIcon: () => (
              <Icon name="tachometer" size={24} color="#FFA500" />
            ),
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
            drawerIcon: () => <Icon name="flag" size={24} color="#FFA500" />,
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
          name="LoanRequest"
          component={LoanRequest}
          initialParams={{userData}}
          options={{
            title: 'Loan Request',
            drawerIcon: () => (
              <Icon name="handshake-o" size={20} color="#FFA500" />
            ),
            headerShown: true,
          }}
        />
        <Drawer.Screen
          name="AdvanceSalary"
          component={AdvanceSalary}
          initialParams={{userData}}
          options={{
            title: 'Advance Salary',
            drawerIcon: () => (
              <Icon name="credit-card" size={20} color="#FFA500" />
            ),
            headerShown: true,
          }}
        />
        <Drawer.Screen
          name="WorkerAssignedToMe"
          component={WorkerAssignedToMe}
          initialParams={{userData}}
          options={{
            title: 'My Team',
            drawerIcon: () => <Icon name="users" size={20} color="#FFA500" />,
            headerShown: true,
          }}
        />
        <Drawer.Screen
          name="EmployeeCertificates"
          component={EmployeeCertificates}
          initialParams={{userData}}
          options={{
            title: 'Employee Certificates',
            drawerIcon: () => (
              <Icon name="file-text" size={20} color="#FFA500" />
            ),
            headerShown: true,
          }}
        />
        <Drawer.Screen
          name="EmployeeBankAccount"
          component={EmployeeBankAccount}
          initialParams={{userData}}
          options={{
            title: 'Employee Bank Account',
            drawerIcon: () => <Icon name="bank" size={20} color="#FFA500" />,
            headerShown: true,
          }}
        />

        <Drawer.Screen
          name="HelpDesk"
          component={HelpDesk}
          initialParams={{userData}}
          options={{
            title: 'HR Help Desk',
            drawerIcon: () => (
              <Icon name="question-circle" size={20} color="#FFA340" />
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
  drawerHeader: {
    width: '100%',
    padding: 20,
    backgroundColor: '#FFA500',
    alignItems: 'center',
  },
  drawerHeaderImage: {
    width: 100,
    height: 40,
    marginBottom: 10,
  },
  drawerHeaderText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  drawerHeaderEmail: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  logoutButton: {
    margin: 20,
    padding: 10,
    backgroundColor: '#FFA500',
    borderRadius: 5,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
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
