/* eslint-disable curly */
/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
import React, {useState, useEffect} from 'react';
import {
  Image,
  View,
  Text,
  TouchableOpacity,
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
import {clearConfig} from '../Controller/secureConfig';

import {ProfilePicture} from '../API/PersonalInformation/ProfilePicture/ProfilePicture';

import LogoutAlertModal from '../components/Alert/LogoutAlertModal';

import styles from '../styles/styles';

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
      if (!userData?.employeeId) {
        setProfilePictureUrl(null);
        return;
      }

      try {
        const data = await ProfilePicture({employeeId: userData.employeeId});
        const imageData =
          Array.isArray(data) && data.length > 0 ? data[0] : data;

        if (imageData?.StringImage) {
          const cleanBase64 = imageData.StringImage.replace(/\s/g, '');
          const imageUrl = `data:image/png;base64,${cleanBase64}`;
          setProfilePictureUrl(imageUrl);
        } else {
          setProfilePictureUrl(null);
        }
      } catch (error) {
        console.error('Failed to fetch profile picture:', error);
        setProfilePictureUrl(null);
      }
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

  const filteredMenuItems = menuItems.filter(item => {
    return (
      screenMapping[item.MenuId] &&
      [0, 2, 3].includes(Number(item.Type)) &&
      item.Visible === '1' &&
      item.DisplayOnSideNavigation === 'Yes'
    );
  });

  const uniqueMenuItems = filteredMenuItems.filter(
    (it, idx, arr) =>
      !!it?.MenuId && arr.findIndex(x => x.MenuId === it.MenuId) === idx,
  );

  return (
    <View style={{flex: 1, backgroundColor: '#FAFAFA'}}>
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
            <TouchableOpacity
              style={styles.DNav_Avatar}
              onPress={() => navigateToScreen('Profile')}>
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

      <DrawerContentScrollView {...props} showsVerticalScrollIndicator={false}>
        {/* <CustomDrawerItem
          label="Dashboard"
          icon={require('../assets/Maindashboard/dashboard.png')}
          isActive={activeRoute === 'MainDashboard'}
          onPress={() => navigateToScreen('MainDashboard')}
        /> */}

        {uniqueMenuItems.map((item, idx) => (
          <CustomDrawerItem
            key={`${item.MenuId}-${item.Sequence ?? idx}`}
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

  // ALL valid screens available in the app to be registered in Drawer
  const validScreens = menuItems.filter(item => screenMapping[item.MenuId]);

  const uniqueScreens = validScreens.filter(
    (it, idx, arr) =>
      !!it?.MenuId && arr.findIndex(x => x.MenuId === it.MenuId) === idx,
  );

  return (
    <Drawer.Navigator
      initialRouteName="MainDashboard"
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: {backgroundColor: '#f9fcffff'},
        drawerActiveTintColor: '#0A66C2',
        drawerInactiveTintColor: '#333333',
        headerShown: true,
      }}>
      {/* MainDashboard manages its own header internally via ActionPaneContainer */}
      <Drawer.Screen
        name="MainDashboard"
        component={screenMapping.MainDashboard}
        initialParams={{userData}}
        options={{
          title: 'Home',
          drawerIcon: () => <Ionicons name="home" size={24} color="#0A66C2" />,
          headerShown: true,
        }}
      />

      {uniqueScreens
        .filter(item => item.MenuId !== 'MainDashboard')
        .map((item, idx) => {
          const ScreenComponent = screenMapping[item.MenuId];
          return (
            <Drawer.Screen
              key={`${item.MenuId}-${item.Sequence ?? idx}`}
              name={item.MenuId}
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
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
