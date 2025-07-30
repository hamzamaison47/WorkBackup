/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unstable-nested-components */
import React, {useContext, useEffect, useState} from 'react';
import {Image, View, StyleSheet, Text, TouchableOpacity} from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
} from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/FontAwesome';
import {UserContext} from '../context/UserContext';

import logo from '../assets/cloud.png';
import TabNavigator from './TabNavigator';
import NotificationDropdown from '../components/NotificationDropdown';
import LogoutAlertModal from '../components/Leaves/LogoutAlertModal';
import NotificationButton from '../components/NotificationButton';
import {retrieveByEmail} from '../API/WorkflowTrackingStatusTable/retrieveByEmail';

// import LeaveRequest from '../screens/Leaves/LeaveRequest';

import PRSalarySlip from '../screens/Reports/PRSalarySlip';
import LeaveRequestListPage from '../screens/Leaves/LeaveRequestListPage';
import LeaveRequestSaveRecord from '../screens/Leaves/LeaveRequestSaveRecord';
import {handleLogoutauth} from '../Controller/authUtils';

const Drawer = createDrawerNavigator();

const CustomDrawerContent = props => {
  const [modalVisible, setModalVisible] = useState(false);
  const {userData} = useContext(UserContext);

  const handleLogout = () => setModalVisible(true);
  const confirmLogout = () => {
    setModalVisible(false);
    handleLogoutauth(userData.Provider);
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
          onPress={() =>
            props.navigation.navigate('LeavesListPage', {
              employeeId: userData.employeeId,
              employeeName: userData.employeeName,
              WorkerRecId: userData.WorkerRecId,
              cameFrom: 'DisplayListPage',
            })
          }
          icon={() => <Icon name="calendar" size={24} color="#FFA500" />}
        />
        <DrawerItem
          label="Salary Slip"
          onPress={() => props.navigation.navigate('PRSalarySlip')}
          icon={() => <Icon name="money" size={24} color="#FFA500" />}
        />
        <DrawerItem
          label="My Team"
          onPress={() => props.navigation.navigate('WorkerAssignedToMe')}
          icon={() => <Icon name="users" size={18} color="#FFA500" />}
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
        {/* <Drawer.Screen
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
        /> */}
        <Drawer.Screen
          name="LeavesListPage"
          component={LeaveRequestListPage}
          initialParams={{userData}}
          options={{
            title: 'Leave Requests List Page',
            drawerIcon: () => (
              <Icon name="calendar" size={24} color="#FFA500" />
            ),
            headerShown: true,
          }}
        />
        <Drawer.Screen
          name="LeaveSaveRecord"
          component={LeaveRequestSaveRecord}
          initialParams={{userData}}
          options={{
            title: 'Leave Requests Create and Update',
            drawerIcon: () => (
              <Icon name="calendar" size={24} color="#FFA500" />
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
