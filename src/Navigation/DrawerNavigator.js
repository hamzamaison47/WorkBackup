/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
import React, {useState} from 'react';
import {Image, View, StyleSheet, Text, TouchableOpacity} from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
} from '@react-navigation/drawer';
// import Icon from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';
import logo from '../assets/cloud.png';
import TabNavigator from './TabNavigator';
import LogoutAlertModal from '../components/Alert/LogoutAlertModal';
import PRSalarySlip from '../screens/SalarySlip/PRSalarySlip';
import LeaveRequestListPage from '../screens/Leaves/LeaveRequestListPage';
import LeaveRequestSaveRecord from '../screens/Leaves/LeaveRequestSaveRecord';
import {handleLogoutauth} from '../Controller/authUtils';
import PRTaxCertificate from '../screens/TaxCertificate/PRTaxCertificate';
import RequestForRegistration from '../screens/RequestForRegistration/RequestForRegistration';
import LoanRequestListPage from '../screens/EmployeeAdvanceRequest/Loan/LoanRequestListPage';
import EntitlementBalance from '../screens/EntitlementBalance/EntitlementBalance';
import GenericAdvanceSaveScreen from '../screens/EmployeeAdvanceRequest/GenericAdvanceSaveScreen';
// import AdvanceRequestListPage from '../screens/EmployeeAdvanceRequest/Advance/AdvanceRequestListPage';

const Drawer = createDrawerNavigator();
const CustomDrawerContent = props => {
  const [modalVisible, setModalVisible] = useState(false);
  const userData = useSelector(state => state.user.userData);

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
          icon={() => (
            <Ionicons name="calendar-outline" size={24} color="#0A66C2" />
          )}
        />
        <DrawerItem
          label="Salary Slip"
          onPress={() => props.navigation.navigate('PRSalarySlip')}
          icon={() => (
            <Ionicons name="card-outline" size={24} color="#0A66C2" />
          )}
        />
        <DrawerItem
          label="Tax Certificate"
          onPress={() => props.navigation.navigate('PRTaxCertificate')}
          icon={() => (
            <Ionicons name="document-text-outline" size={24} color="#0A66C2" />
          )}
        />
        <DrawerItem
          label="Loan & Advance"
          onPress={() => props.navigation.navigate('LoanRequestListPage')}
          icon={() => (
            <Ionicons name="wallet-outline" size={24} color="#0A66C2" />
          )}
        />
        <DrawerItem
          label="Entitlement Balance"
          onPress={() => props.navigation.navigate('EntitlementBalance')}
          icon={() => (
            <Ionicons name="time-outline" size={24} color="#0A66C2" />
          )}
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
  const userData = useSelector(state => state.user.userData);

  return (
    <>
      <Drawer.Navigator
        initialRouteName="TabNavigator"
        drawerContent={props => <CustomDrawerContent {...props} />}
        screenOptions={{
          drawerStyle: {backgroundColor: '#d4e9ff'},
          drawerActiveTintColor: '#0A66C2',
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
              <Ionicons name="speedometer" size={24} color="#0A66C2" />
            ),
          }}
        />
        <Drawer.Screen
          name="LeavesListPage"
          component={LeaveRequestListPage}
          initialParams={{userData}}
          options={{
            title: 'Leave Requests List Page',
            drawerIcon: () => (
              <Ionicons name="calendar" size={24} color="#0A66C2" />
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
              <Ionicons name="calendar" size={24} color="#0A66C2" />
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
            drawerIcon: () => (
              <Ionicons name="card-outline" size={24} color="#0A66C2" />
            ),
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
              <Ionicons name="receipt-outline" size={24} color="#0A66C2" />
            ),
            headerShown: true,
          }}
        />
        <Drawer.Screen
          name="RequestForRegistration"
          component={RequestForRegistration}
          initialParams={{userData}}
          options={{
            title: 'Registration Request',
            drawerIcon: () => (
              <Ionicons name="receipt-outline" size={24} color="#0A66C2" />
            ),
            headerShown: false,
          }}
        />
        <Drawer.Screen
          name="LoanRequestListPage"
          component={LoanRequestListPage}
          initialParams={{userData}}
          options={{
            title: 'Loan Request',
            drawerIcon: () => (
              <Ionicons name="receipt-outline" size={24} color="#0A66C2" />
            ),
            headerShown: true,
          }}
        />
        <Drawer.Screen
          name="GenericAdvanceSaveScreen"
          component={GenericAdvanceSaveScreen}
          initialParams={{userData}}
          options={{
            title: 'Loan and Advance Requests Create and Update',
            drawerIcon: () => (
              <Ionicons name="receipt-outline" size={24} color="#0A66C2" />
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
              <Ionicons name="calendar-outline" size={24} color="#0A66C2" />
            ),
            headerShown: true,
          }}
        />
        {/* <Drawer.Screen
          name="AdvanceRequestListPage"
          component={AdvanceRequestListPage}
          initialParams={{userData}}
          options={{
            title: 'Advance Request',
            drawerIcon: () => (
              <Ionicons name="receipt-outline" size={24} color="#0A66C2" />
            ),
            headerShown: true,
          }}
        /> */}
      </Drawer.Navigator>
    </>
  );
};

const styles = StyleSheet.create({
  drawerHeader: {
    width: '100%',
    padding: 20,
    backgroundColor: '#0A66C2',
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
    backgroundColor: '#0A66C2',
    borderRadius: 5,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DrawerNavigator;
