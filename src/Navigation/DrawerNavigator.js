/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
import React, {useState, useEffect} from 'react';
import {
  Image,
  View,
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

import {screenMapping, iconMapping} from '../Controller/screenMapping';
import {handleLogoutauth} from '../Controller/authUtils';

import {ProfilePicture} from '../API/PersonalInformation/ProfilePicture/ProfilePicture';
import LogoutAlertModal from '../components/Alert/LogoutAlertModal';

import TabNavigator from './TabNavigator';
import styles from '../styles/styles';
import DisplayPersonalInfo from '../screens/Profile/PersonalInformation/DisplayPersonalInfo';
import ChangeProfileImage from '../screens/Profile/PersonalInformation/ChangeProfileImage/ChangeProfileImage';
import MarkPresentScreen from '../screens/Attendance/MarkPresentScreen';
import EditAttendanceScreen from '../screens/Attendance/EditAttendanceScreen';
import CreateEmployeeAdjustment from '../components/Attendance/CreateEmployeeAdjustment';
import ContactDetailsListPage from '../screens/Profile/PersonalInformation/PersonalContacts/ContactDetailsListPage';
import ContactDetailsSaveRecord from '../screens/Profile/PersonalInformation/PersonalContacts/ContactDetailsSaveRecord';
import PersonalEducation from '../screens/Profile/PersonalInformation/PersonalEducation/PersonalEducationListPage';
import {BankAccountListPage} from '../screens/Profile/PersonalInformation/BankAccount/BankAccountListPage';
import BankAccountSaveRecord from '../screens/Profile/PersonalInformation/BankAccount/BankAccountSaveRecord';
import PersonalEducationSaveRecord from '../screens/Profile/PersonalInformation/PersonalEducation/PersonalEducationSaveRecord';
import IdentificationNumberListPage from '../screens/Profile/PersonalInformation/Identification/IdentificationNumberListPage';
import IdentificationNumberSaveRecord from '../screens/Profile/PersonalInformation/Identification/IdentificationNumberSaveRecord';
import Preferences from '../screens/Profile/Preferences/Preferences';
import BiometricSettings from '../screens/Profile/Preferences/BiometricSettings/BiometricSettings';

const {width} = Dimensions.get('window');
const Drawer = createDrawerNavigator();

const CustomDrawerItem = ({label, icon, onPress, isActive = false}) => (
  <TouchableOpacity
    style={[styles.DNav_DrawerItem, isActive && styles.DNav_ActiveDrawerItem]}
    onPress={onPress}>
    <Image
      source={typeof icon === 'string' ? {uri: icon} : icon}
      style={styles.DNav_DrawerIcon}
    />
    <Text
      style={[
        styles.DNav_DrawerItemText,
        isActive && styles.DNav_ActiveDrawerItemText,
      ]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const CustomDrawerContent = props => {
  const [modalVisible, setModalVisible] = useState(false);
  const [activeRoute, setActiveRoute] = useState('MainDashboard');
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);

  const userData = useSelector(state => state.user.userData);
  const {menuItems} = useSelector(state => state.menuItem);

  useEffect(() => {
    const unsubscribe = props.navigation.addListener('state', e => {
      const state = e.data.state;
      if (state && state.routes && state.index !== undefined) {
        const currentRoute = state.routes[state.index]?.name;
        if (currentRoute) setActiveRoute(currentRoute);
      }
    });

    const currentState = props.navigation.getState();
    if (
      currentState &&
      currentState.routes &&
      currentState.index !== undefined
    ) {
      const currentRoute = currentState.routes[currentState.index]?.name;
      if (currentRoute) setActiveRoute(currentRoute);
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

  // Filter menuItems (Type === 0 and in screenMapping)
  const filteredMenuItems = menuItems.filter(item => {
    return screenMapping[item.MenuId] && [0, 2, 3].includes(Number(item.Type));
  });

  const uniqueMenuItems = filteredMenuItems.filter(
    (it, idx, arr) =>
      !!it?.MenuId && arr.findIndex(x => x.MenuId === it.MenuId) === idx,
  );

  return (
    <View style={{flex: 1, backgroundColor: '#FAFAFA'}}>
      {/* Header */}
      <ImageBackground
        source={require('../assets/DrawerNavigator/backgroungGradient.jpg')}
        style={styles.DNav_HeaderBackground}
        imageStyle={{resizeMode: 'stretch'}}>
        <Image
          source={require('../assets/cloud.png')}
          style={styles.DNav_MaisonLogo}
          resizeMode="contain"
        />
        <View style={styles.DNav_EmpInfoContainer}>
          <View style={styles.DNav_AvatarContainer}>
            <View style={styles.DNav_Avatar}>
              <TouchableOpacity onPress={() => navigateToScreen('Profile')}>
                {profilePictureUrl ? (
                  <Image
                    source={{uri: profilePictureUrl}}
                    style={styles.DNav_ProfilePicture}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.DNav_AvatarText}>
                    {getInitials(userData?.employeeName)}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.DNav_OnlineIndicator} />
          </View>
          <View style={styles.DNav_UserInfo}>
            <Text style={styles.DNav_UserName} numberOfLines={1}>
              {userData?.employeeName || 'User Name'}
            </Text>
            <Text style={styles.DNav_UserEmail} numberOfLines={1}>
              {userData?.email || 'user@email.com'}
            </Text>
          </View>
        </View>
      </ImageBackground>

      {/* Drawer Items */}
      <DrawerContentScrollView {...props} showsVerticalScrollIndicator={false}>
        {/* Static Dashboard */}
        <CustomDrawerItem
          label="Dashboard"
          icon={require('../assets/Maindashboard/dashboard.png')}
          isActive={activeRoute === 'MainDashboard'}
          onPress={() => navigateToScreen('MainDashboard')}
        />

        {/* Dynamic Menu Items */}
        {uniqueMenuItems.map((item, idx) => (
          <CustomDrawerItem
            key={`${item.MenuId}-${item.Sequence ?? idx}`} // ✅ unique, stable
            label={item.Label || item.MenuId}
            icon={
              iconMapping[item.MenuId] ||
              require('../assets/Maindashboard/calendar.png')
            }
            isActive={activeRoute === item.MenuId}
            onPress={() => {
              if (item.MenuId === 'LeavesListPage') {
                navigateToScreen(item.MenuId, {
                  employeeId: userData.employeeId,
                  employeeName: userData.employeeName,
                  WorkerRecId: userData.WorkerRecId,
                  userData: userData,
                  cameFrom: 'DrawerNavigator',
                });
              } else if (item.MenuId === 'GenericAdvanceListScreen') {
                navigateToScreen('GenericAdvanceListScreen', {
                  employeeId: userData.employeeId,
                  employeeName: userData.employeeName,
                  WorkerRecId: userData.WorkerRecId,
                  cameFrom: 'DrawerNavigation',
                });
              } else {
                navigateToScreen(item.MenuId, {userData});
              }
            }}
          />
        ))}
      </DrawerContentScrollView>

      {/* Footer */}
      <TouchableOpacity
        style={styles.DNav_LogoutButton}
        onPress={handleLogout}
        activeOpacity={0.7}>
        <View style={styles.DNav_LogoutIconSection}>
          <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
        </View>
        <View style={styles.DNav_LogoutTextSection}>
          <Text style={styles.DNav_LogoutText}>LOGOUT</Text>
        </View>
      </TouchableOpacity>

      <LogoutAlertModal
        visible={modalVisible}
        heading="Are you sure you want to logout?"
        text="Are you sure you want to logout?"
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />
    </View>
  );
};

const DrawerNavigator = () => {
  const userData = useSelector(state => state.user.userData);
  const {menuItems} = useSelector(state => state.menuItem);

  // Filter dynamic screens
  const filteredMenuItems = menuItems.filter(item => {
    return screenMapping[item.MenuId];
  });

  const uniqueMenuItems = filteredMenuItems.filter(
    (it, idx, arr) =>
      !!it?.MenuId && arr.findIndex(x => x.MenuId === it.MenuId) === idx,
  );

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
      {/* Static Dashboard */}
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

      {/* Dynamic Screens */}
      {uniqueMenuItems.map((item, idx) => {
        const ScreenComponent = screenMapping[item.MenuId];
        return (
          <Drawer.Screen
            key={`${item.MenuId}-${item.Sequence ?? idx}`} // ✅ unique, stable
            name={item.MenuId} // keep route name as-is
            component={ScreenComponent}
            initialParams={{userData}}
            options={{
              title: item.DisplayName || item.MenuId,
              drawerIcon: () => (
                <Ionicons name="menu" size={24} color="#0A66C2" />
              ),
              headerShown: true,
            }}
          />
        );
      })}

      <Drawer.Screen
        name="DisplayPersonalInfo"
        component={DisplayPersonalInfo}
        initialParams={{userData}}
        options={{
          title: 'DisplayPersonalInfo',
          drawerIcon: () => (
            <Ionicons name="calendar" size={24} color="#0A66C2" />
          ),
          headerShown: true,
          headerShadowVisible: false,
        }}
      />

      <Drawer.Screen
        name="ChangeProfileImage"
        component={ChangeProfileImage}
        initialParams={{userData}}
        options={{
          title: 'ChangeProfileImage',
          drawerIcon: () => (
            <Ionicons name="calendar" size={24} color="#0A66C2" />
          ),
          headerShown: true,
        }}
      />

      <Drawer.Screen
        name="MarkPresentScreen"
        component={MarkPresentScreen}
        initialParams={{userData}}
        options={{
          title: 'MarkPresentScreen',
          drawerIcon: () => (
            <Ionicons name="calendar" size={24} color="#0A66C2" />
          ),
          headerShown: true,
        }}
      />

      <Drawer.Screen
        name="EditAttendanceScreen"
        component={EditAttendanceScreen}
        initialParams={{userData}}
        options={{
          title: 'EditAttendanceScreen',
          drawerIcon: () => (
            <Ionicons name="calendar" size={24} color="#0A66C2" />
          ),
          headerShown: true,
        }}
      />
      <Drawer.Screen
        name="CreateEmployeeAdjustment"
        component={CreateEmployeeAdjustment}
        initialParams={{userData}}
        options={{
          title: 'CreateEmployeeAdjustment',
          drawerIcon: () => (
            <Ionicons name="calendar" size={24} color="#0A66C2" />
          ),
          headerShown: true,
        }}
      />

      <Drawer.Screen
        name="ContactDetailsListPage"
        component={ContactDetailsListPage}
        initialParams={{userData}}
        options={{
          title: 'ContactDetailsListPage',
          drawerIcon: () => (
            <Ionicons name="calendar" size={24} color="#0A66C2" />
          ),
          headerShown: true,
        }}
      />

      <Drawer.Screen
        name="ContactDetailsSaveRecord"
        component={ContactDetailsSaveRecord}
        initialParams={{userData}}
        options={{
          title: 'ContactDetailsSaveRecord',
          drawerIcon: () => (
            <Ionicons name="calendar" size={24} color="#0A66C2" />
          ),
          headerShown: true,
        }}
      />

      <Drawer.Screen
        name="PersonalEducation"
        component={PersonalEducation}
        initialParams={{userData}}
        options={{
          title: 'Education',
          drawerIcon: () => (
            <Ionicons name="school-outline" size={24} color="#0A66C2" />
          ),
          headerShown: true,
        }}
      />

      <Drawer.Screen
        name="BankAccountListPage"
        component={BankAccountListPage}
        initialParams={{userData}}
        options={{
          title: 'Bank Account',
          drawerIcon: () => (
            <Ionicons name="school-outline" size={24} color="#0A66C2" />
          ),
          headerShown: true,
        }}
      />

      <Drawer.Screen
        name="BankAccountSaveRecord"
        component={BankAccountSaveRecord}
        options={{
          title: 'Add / Edit Bank Account Details',
          drawerItemStyle: {display: 'none'}, // hides it from the drawer
          headerShown: true,
          headerStyle: {backgroundColor: '#0A66C2'},
          headerTintColor: '#fff',
        }}
      />

      <Drawer.Screen
        name="PersonalEducationSaveRecord"
        component={PersonalEducationSaveRecord}
        options={{
          title: 'Add / Edit Education',
          drawerItemStyle: {display: 'none'}, // hides it from the drawer
          headerShown: true,
          headerStyle: {backgroundColor: '#0A66C2'},
          headerTintColor: '#fff',
        }}
      />

      <Drawer.Screen
        name="IdentificationNumberListPage"
        component={IdentificationNumberListPage}
        initialParams={{userData}}
        options={{
          title: 'IdentificationListPage',
          drawerIcon: () => (
            <Ionicons name="calendar" size={24} color="#0A66C2" />
          ),
          headerShown: true,
        }}
      />

      <Drawer.Screen
        name="IdentificationNumberSaveRecord"
        component={IdentificationNumberSaveRecord}
        initialParams={{userData}}
        options={{
          title: 'IdentificationNumberSaveRecord',
          drawerIcon: () => (
            <Ionicons name="calendar" size={24} color="#0A66C2" />
          ),
          headerShown: true,
        }}
      />

      <Drawer.Screen
        name="Preferences"
        component={Preferences}
        options={{
          title: 'Add / Edit Education',
          drawerItemStyle: {display: 'none'}, // hides it from the drawer
          headerShown: true,
          headerStyle: {backgroundColor: '#0A66C2'},
          headerTintColor: '#fff',
          headerShadowVisible: false,
        }}
      />

      <Drawer.Screen
        name="BiometricSettings"
        component={BiometricSettings}
        options={{
          title: 'Biometric Settingsn',
          drawerItemStyle: {display: 'none'}, // hides it from the drawer
          headerShown: true,
          headerStyle: {backgroundColor: '#0A66C2'},
          headerTintColor: '#fff',
          headerShadowVisible: false,
        }}
      />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
