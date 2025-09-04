/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
import React, {useState, useEffect} from 'react';
import {
  Image,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
} from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
} from '@react-navigation/drawer';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';

import {ProfilePicture} from '../API/PersonalInformation/ProfilePicture/ProfilePicture';
import {handleLogoutauth} from '../Controller/authUtils';
import LogoutAlertModal from '../components/Alert/LogoutAlertModal';

import TabNavigator from './TabNavigator';
import PRSalarySlip from '../screens/SalarySlip/PRSalarySlip';
import LeaveRequestListPage from '../screens/Leaves/LeaveRequestListPage';
import LeaveRequestSaveRecord from '../screens/Leaves/LeaveRequestSaveRecord';
import PRTaxCertificate from '../screens/TaxCertificate/PRTaxCertificate';
import RequestForRegistration from '../screens/RequestForRegistration/RequestForRegistration';
import EntitlementBalance from '../screens/EntitlementBalance/EntitlementBalance';
import GenericAdvanceSaveScreen from '../screens/EmployeeAdvanceRequest/GenericAdvanceSaveScreen';
import GenericAdvanceListScreen from '../screens/EmployeeAdvanceRequest/GenericAdvanceListScreen';

const {width} = Dimensions.get('window');
const Drawer = createDrawerNavigator();

const CustomDrawerItem = ({label, icon, onPress, isActive = false}) => (
  <TouchableOpacity
    style={[styles.drawerItem, isActive && styles.activeDrawerItem]}
    onPress={onPress}>
    <Image
      source={typeof icon === 'string' ? {uri: icon} : icon}
      style={styles.drawerIcon}
    />
    <Text
      style={[styles.drawerItemText, isActive && styles.activeDrawerItemText]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const CustomDrawerContent = props => {
  const [modalVisible, setModalVisible] = useState(false);
  const [activeRoute, setActiveRoute] = useState('MainDashboard');
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);

  const userData = useSelector(state => state.user.userData);

  useEffect(() => {
    const unsubscribe = props.navigation.addListener('state', e => {
      const state = e.data.state;
      if (state && state.routes && state.index !== undefined) {
        const currentRoute = state.routes[state.index]?.name;
        if (currentRoute) {
          setActiveRoute(currentRoute);
        }
      }
    });

    const currentState = props.navigation.getState();
    if (
      currentState &&
      currentState.routes &&
      currentState.index !== undefined
    ) {
      const currentRoute = currentState.routes[currentState.index]?.name;
      if (currentRoute) {
        setActiveRoute(currentRoute);
      }
    }

    return unsubscribe;
  }, [props.navigation]);

  useEffect(() => {
    const loadProfilePicture = async () => {
      const picture = await fetchProfilePicture();
      setProfilePictureUrl(picture);
    };
    loadProfilePicture();
  }, [userData?.employeeId]);

  const handleLogout = () => setModalVisible(true);
  const confirmLogout = () => {
    setModalVisible(false);
    handleLogoutauth(userData.Provider);
    props.navigation.navigate('Login');
  };
  const cancelLogout = () => setModalVisible(false);

  const navigateToScreen = (screenName, params = {}) => {
    setActiveRoute(screenName);
    props.navigation.navigate(screenName, params);
  };

  const getInitials = name => {
    if (!name) return 'UN';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const fetchProfilePicture = async () => {
    try {
      if (!userData?.employeeId) return null;

      const data = await ProfilePicture({employeeId: userData.employeeId});
      const imageData = Array.isArray(data) && data.length > 0 ? data[0] : data;

      if (imageData?.StringImage) {
        const cleanBase64 = imageData.StringImage.replace(/\s/g, '');
        return `data:image/png;base64,${cleanBase64}`;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch profile picture:', error);
      return null;
    } finally {
      console.log('Profile picture fetch completed ✅');
    }
  };

  return (
    <View style={{flex: 1, backgroundColor: '#FAFAFA'}}>
      {/* Header */}
      <ImageBackground
        source={require('../assets/DrawerNavigator/backgroungGradient.jpg')}
        style={styles.headerBackground}
        imageStyle={{resizeMode: 'stretch'}}>
        <Image
          source={require('../assets/cloud.png')}
          style={styles.maisonLogo}
          resizeMode="contain"
        />
        <View style={styles.empInfoContainer}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <TouchableOpacity
                onPress={() => navigateToScreen('DisplayPersonalInfo')}>
                {profilePictureUrl ? (
                  <Image
                    source={{uri: profilePictureUrl}}
                    style={styles.profilePicture}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.avatarText}>
                    {getInitials(userData?.employeeName)}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.onlineIndicator} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {userData?.employeeName || 'User Name'}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {userData?.email || 'user@email.com'}
            </Text>
          </View>
        </View>
      </ImageBackground>

      {/* Drawer Items */}
      <DrawerContentScrollView {...props} showsVerticalScrollIndicator={false}>
        <CustomDrawerItem
          label="Dashboard"
          icon={require('../assets/Maindashboard/dashboard.png')}
          isActive={activeRoute === 'MainDashboard'}
          onPress={() => navigateToScreen('MainDashboard')}
        />
        <CustomDrawerItem
          label="Leave Requests"
          icon={require('../assets/Maindashboard/calendar.png')}
          isActive={activeRoute === 'LeavesListPage'}
          onPress={() =>
            navigateToScreen('LeavesListPage', {
              employeeId: userData.employeeId,
              employeeName: userData.employeeName,
              WorkerRecId: userData.WorkerRecId,
              cameFrom: 'DisplayListPage',
            })
          }
        />
        <CustomDrawerItem
          label="Salary Slip"
          icon={require('../assets/Maindashboard/payment.png')}
          isActive={activeRoute === 'PRSalarySlip'}
          onPress={() => navigateToScreen('PRSalarySlip')}
        />
        <CustomDrawerItem
          label="Tax Certificate"
          icon={require('../assets/Maindashboard/certificate.png')}
          isActive={activeRoute === 'PRTaxCertificate'}
          onPress={() => navigateToScreen('PRTaxCertificate')}
        />
        <CustomDrawerItem
          label="Entitlement Balance"
          icon={require('../assets/Maindashboard/justice.png')}
          isActive={activeRoute === 'EntitlementBalance'}
          onPress={() => navigateToScreen('EntitlementBalance')}
        />
        <CustomDrawerItem
          label="Loan & Advance"
          icon={require('../assets/Maindashboard/loan-approved.png')}
          isActive={activeRoute === 'GenericAdvanceListScreen'}
          onPress={() =>
            navigateToScreen('GenericAdvanceListScreen', {
              employeeId: userData.employeeId,
              employeeName: userData.employeeName,
              WorkerRecId: userData.WorkerRecId,
              cameFrom: 'DrawerNavigation',
            })
          }
        />
      </DrawerContentScrollView>

      {/* Footer */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.7}>
        <View style={styles.logoutIconSection}>
          <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
        </View>
        <View style={styles.logoutTextSection}>
          <Text style={styles.logoutText}>LOGOUT</Text>
        </View>
      </TouchableOpacity>

      <LogoutAlertModal
        visible={modalVisible}
        heading="Are you sure?"
        text="Do you really want to logout?"
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />
    </View>
  );
};

const DrawerNavigator = () => {
  const userData = useSelector(state => state.user.userData);

  return (
    <Drawer.Navigator
      initialRouteName="TabNavigator"
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: {backgroundColor: '#f9fcffff'},
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
        name="GenericAdvanceListScreen"
        component={GenericAdvanceListScreen}
        initialParams={{userData}}
        options={{
          title: 'Loan & Advance Requests',
          drawerIcon: () => (
            <Ionicons name="wallet-outline" size={24} color="#0A66C2" />
          ),
          headerShown: true,
        }}
      />
      <Drawer.Screen
        name="GenericAdvanceSaveScreen"
        component={GenericAdvanceSaveScreen}
        initialParams={{userData}}
        options={{
          title: 'Create/Edit Request',
          drawerIcon: () => (
            <Ionicons name="create-outline" size={24} color="#0A66C2" />
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
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  drawerIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    resizeMode: 'contain',
  },
  activeDrawerItem: {
    backgroundColor: '#E0E7FF',
  },
  drawerItemText: {
    fontSize: 15,
    color: '#374151',
  },
  activeDrawerItemText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  headerBackground: {
    width: '100%',
    height: 150,
    justifyContent: 'flex-end',
  },
  maisonLogo: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 100,
    height: 40,
  },
  empInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    marginLeft: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.20)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  userEmail: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
  },
  profilePicture: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  logoutIconSection: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  logoutTextSection: {
    backgroundColor: '#1976D2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    justifyContent: 'center',
    flex: 1,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default DrawerNavigator;
