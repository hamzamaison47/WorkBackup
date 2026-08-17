/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, TouchableOpacity, Platform, Image} from 'react-native';
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
import useAppTokens from '../components/AppComponentsDesign/useAppTokens';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import usePalette from '../hooks/usePalette';

import {
  conditionalScale,
  conditionalVerticalScale,
} from '../store/utils/scaling';

const Drawer = createDrawerNavigator();

// Compact Drawer Item — fully theme-reactive via T (useAppTokens), so colors
// flip correctly between light/dark instead of using the static AppTokens
// export.
const CustomDrawerItem = ({label, icon, onPress, isActive = false}) => {
  const T = useAppTokens();
  const P = usePalette();

  const renderIcon = () => {
    const iconSize = 20;
    const color = isActive ? '#FFFFFF' : P.primary;

    if (typeof icon === 'string') {
      return (
        <Ionicons
          name={icon}
          size={iconSize}
          color={isActive ? '#FFFFFF' : P.primary}
        />
      );
    }

    if (typeof icon === 'function' || (icon && icon.$$typeof)) {
      const IconComponent = icon;
      return <IconComponent size={iconSize} color={color} />;
    }

    return (
      <Image
        source={icon}
        style={{
          width: conditionalScale(18, 19, 20, 20),
          height: conditionalScale(18, 19, 20, 20),
        }}
        resizeMode="contain"
      />
    );
  };

  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: conditionalVerticalScale(8, 9, 10, 10),
        paddingHorizontal: conditionalScale(14, 15, 16, 16),
        marginHorizontal: conditionalScale(12, 14, 16, 16),
        marginVertical: conditionalVerticalScale(1, 1, 2, 2),
        borderRadius: conditionalScale(8, 9, 10, 10),
        backgroundColor: isActive ? T.blue : 'transparent',
      }}
      onPress={onPress}
      activeOpacity={0.7}>
      <View
        style={{
          width: conditionalScale(32, 34, 36, 36),
          height: conditionalScale(32, 34, 36, 36),
          borderRadius: conditionalScale(9, 10, 10, 10),
          backgroundColor: isActive ? 'rgba(255,255,255,0.18)' : T.blueBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: conditionalScale(12, 13, 14, 14),
        }}>
        {renderIcon()}
      </View>
      <Text
        style={{
          flex: 1,
          fontSize: conditionalScale(13, 14, 14, 14),
          fontWeight: isActive ? '500' : '400',
          color: isActive ? '#FFFFFF' : T.titleText,
          letterSpacing: 0.2,
        }}
        numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// Header stays on brand blue in both themes (same as QuickAccessSheet's
// header) — white text/circle keep proper contrast against it regardless of
// theme, so those specific colors are intentionally NOT theme-reactive.
const DrawerHeader = ({userData, profilePictureUrl, onPressProfile}) => {
  const T = useAppTokens();

  const getInitials = useCallback(name => {
    if (!name) {
      return 'UN';
    }
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }, []);

  return (
    <View
      style={{
        backgroundColor: T.blue,
        borderBottomLeftRadius: conditionalScale(16, 18, 20, 20),
        borderBottomRightRadius: conditionalScale(16, 18, 20, 20),
        marginBottom: conditionalVerticalScale(8, 10, 12, 12),
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: conditionalVerticalScale(20, 22, 24, 24),
          paddingBottom: conditionalVerticalScale(12, 14, 16, 16),
          paddingHorizontal: conditionalScale(20, 22, 24, 24),
        }}>
        <Image
          source={require('../assets/IDAPNewLogo.jpg')}
          style={{
            width: conditionalScale(32, 34, 36, 36),
            height: conditionalScale(32, 34, 36, 36),
            marginRight: conditionalScale(10, 11, 12, 12),
          }}
          resizeMode="contain"
        />
        <Text
          style={{
            fontSize: conditionalScale(16, 17, 18, 18),
            fontWeight: '600',
            color: '#FFFFFF',
            letterSpacing: 0.3,
          }}>
          IDAP360
        </Text>
      </View>

      <TouchableOpacity
        onPress={onPressProfile}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: conditionalVerticalScale(14, 16, 18, 18),
          paddingHorizontal: conditionalScale(20, 22, 24, 24),
        }}>
        <View
          style={{
            position: 'relative',
            marginRight: conditionalScale(12, 13, 14, 14),
          }}>
          <View
            style={{
              width: conditionalScale(40, 42, 44, 44),
              height: conditionalScale(40, 42, 44, 44),
              borderRadius: conditionalScale(20, 21, 22, 22),
              backgroundColor: '#FFFFFF',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
            }}>
            {profilePictureUrl ? (
              <Image
                source={{uri: profilePictureUrl}}
                style={{width: '100%', height: '100%'}}
                resizeMode="cover"
              />
            ) : (
              <Text
                style={{
                  fontSize: conditionalScale(14, 15, 16, 16),
                  fontWeight: '600',
                  color: T.blue,
                }}>
                {getInitials(userData?.employeeName)}
              </Text>
            )}
          </View>
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: conditionalScale(10, 11, 12, 12),
              height: conditionalScale(10, 11, 12, 12),
              borderRadius: conditionalScale(5, 5.5, 6, 6),
              backgroundColor: '#4ADE80',
              borderWidth: 2,
              borderColor: T.blue,
            }}
          />
        </View>

        <View style={{flex: 1}}>
          <Text
            style={{
              fontSize: conditionalScale(13, 14, 14, 14),
              fontWeight: '600',
              color: '#FFFFFF',
              marginBottom: conditionalVerticalScale(2, 2, 3, 3),
            }}
            numberOfLines={1}>
            {userData?.employeeName || 'User Name'}
          </Text>
          <Text
            style={{
              fontSize: conditionalScale(10, 11, 11, 11),
              color: 'rgba(255,255,255,0.7)',
            }}
            numberOfLines={1}>
            {userData?.email || 'user@email.com'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export const CustomDrawerContent = props => {
  const T = useAppTokens();
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
    handleLogoutauth(props.navigation);
  };
  const cancelLogout = () => setModalVisible(false);

  const navigateToScreen = useCallback(
    (screenName, params = {}) => {
      props.navigation.navigate(screenName, params);
    },
    [props.navigation],
  );

  const filteredMenuItems = menuItems.filter(item => {
    return (
      screenMapping[item.MenuId] &&
      item.Visible === '1' &&
      item.DisplayOnSideNavigation === 'Yes'
    );
  });

  const uniqueMenuItems = filteredMenuItems.filter(
    (it, idx, arr) =>
      !!it?.MenuId && arr.findIndex(x => x.MenuId === it.MenuId) === idx,
  );

  const mainMenuItems = uniqueMenuItems.filter(
    item =>
      item.MenuId !== 'MainDashboard' &&
      item.MenuId !== 'Profile' &&
      !item.Category?.includes('Settings'),
  );

  const settingsMenuItems = uniqueMenuItems.filter(item =>
    item.Category?.includes('Settings'),
  );

  return (
    <View style={{flex: 1, backgroundColor: T.pageBg}}>
      <DrawerHeader
        userData={userData}
        profilePictureUrl={profilePictureUrl}
        onPressProfile={() => navigateToScreen('Profile')}
      />

      <DrawerContentScrollView
        {...props}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingVertical: conditionalVerticalScale(8, 10, 12, 12),
        }}>
        <CustomDrawerItem
          label="Dashboard"
          icon="grid-outline"
          isActive={activeRoute === 'MainDashboard'}
          onPress={() => navigateToScreen('MainDashboard')}
        />

        {mainMenuItems.length > 0 && (
          <>
            <View
              style={{
                paddingHorizontal: conditionalScale(20, 22, 24, 24),
                paddingTop: conditionalVerticalScale(12, 14, 16, 16),
                paddingBottom: conditionalVerticalScale(4, 6, 8, 8),
              }}>
              <Text
                style={{
                  fontSize: conditionalScale(10, 11, 11, 11),
                  fontWeight: '600',
                  color: T.subtitleText,
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                }}>
                Main Menu
              </Text>
            </View>
            {mainMenuItems.map((item, idx) => (
              <CustomDrawerItem
                key={`${item.MenuId}-${item.Sequence ?? idx}`}
                label={item.Label || item.DisplayName || item.MenuId}
                icon={
                  iconMapping[item.MenuId] || item.IconName || 'menu-outline'
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
          </>
        )}

        {settingsMenuItems.length > 0 && (
          <>
            <View
              style={{
                paddingHorizontal: conditionalScale(20, 22, 24, 24),
                paddingTop: conditionalVerticalScale(16, 18, 20, 20),
                paddingBottom: conditionalVerticalScale(4, 6, 8, 8),
              }}>
              <Text
                style={{
                  fontSize: conditionalScale(10, 11, 11, 11),
                  fontWeight: '600',
                  color: T.subtitleText,
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                }}>
                Settings
              </Text>
            </View>
            {settingsMenuItems.map((item, idx) => (
              <CustomDrawerItem
                key={`${item.MenuId}-${item.Sequence ?? idx}`}
                label={item.Label || item.DisplayName || item.MenuId}
                icon={iconMapping[item.MenuId] || 'settings-outline'}
                isActive={activeRoute === item.MenuId}
                onPress={() => navigateToScreen(item.MenuId, {userData})}
              />
            ))}
          </>
        )}

        <View
          style={{
            paddingTop: conditionalVerticalScale(24, 28, 32, 36),
            paddingBottom: conditionalVerticalScale(16, 18, 20, 20),
            alignItems: 'center',
          }}
        />
      </DrawerContentScrollView>

      <LogoutAlertModal
        visible={modalVisible}
        heading="Sign Out"
        text="Are you sure you want to sign out of your account?"
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />
    </View>
  );
};

const DrawerNavigator = () => {
  const userData = useSelector(state => state.user.userData);
  const {menuItems} = useSelector(state => state.menuItem);
  const T = useAppTokens();
  const insets = useSafeAreaInsets();

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
        drawerStyle: {
          width: conditionalScale(280, 300, 320, 340),
          backgroundColor: T.pageBg,
        },
        headerShown: true,
        ...(Platform.OS === 'android' && {headerStatusBarHeight: insets.top}),
        headerStyle: {
          backgroundColor: T.blue,
          shadowColor: 'transparent',
          elevation: 0,
          height:
            Platform.OS === 'android'
              ? insets.top + conditionalVerticalScale(56, 60, 64, 64)
              : conditionalVerticalScale(56, 60, 64, 64),
        },
        headerTitleStyle: {
          fontSize: conditionalScale(15, 16, 17, 17),
          fontWeight: '500',
          color: '#FFFFFF',
        },
        headerTintColor: '#FFFFFF',
        headerTitleAlign: 'center',
      }}>
      <Drawer.Screen
        name="MainDashboard"
        component={screenMapping.MainDashboard}
        initialParams={{userData}}
        options={{
          title: 'Dashboard',
          drawerIcon: ({color, size}) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
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
                title: item.DisplayName || item.Label || item.MenuId,
                // eslint-disable-next-line react/no-unstable-nested-components
                drawerIcon: ({color, size}) => (
                  <Ionicons
                    name={iconMapping[item.MenuId] || 'menu-outline'}
                    size={size}
                    color={color}
                  />
                ),
              }}
            />
          );
        })}
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
