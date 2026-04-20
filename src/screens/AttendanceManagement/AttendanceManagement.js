// // ─────────────────────────────────────────────
// // screens/AttendanceManagement/AttendanceManagement.js
// // Root entry. Wraps everything in GeofenceProvider
// // so permission + GPS + API runs exactly once.
// // ─────────────────────────────────────────────
// import React, {useState, useRef, useEffect} from 'react';
// import {Animated, View, Dimensions, StyleSheet, BackHandler} from 'react-native';
// import {useSelector} from 'react-redux';
// import {useFocusEffect, useNavigation} from '@react-navigation/native';
// import ActionPaneContainer from '../../components/ActionPaneContainer';
// import {GeofenceProvider} from '../../components/AttendanceManagement/GeofenceContext';
// import HomeScreen from '../../components/AttendanceManagement/Screen/HomeScreen';
// import TimeClockScreen from '../../components/AttendanceManagement/Screen/TimeClockScreen';
// import AttendanceRecordsScreen from '../../components/AttendanceManagement/Screen/AttendanceRecordsScreen';

// const TITLES = {
//   Home: 'Attendance',
//   TimeClock: 'Time Clock',
//   Records: 'Timesheets',
// };

// const {width} = Dimensions.get('window');

// const AttendanceManagement = () => {
//   const navigation = useNavigation();
//   const [screenStack, setScreenStack] = useState([{name: 'Home', key: 'Home_0'}]);
//   const slideAnim = useRef(new Animated.Value(0)).current;

//   const {userData} = useSelector(s => s.user);
//   const person = userData?.Person;

//   const currentScreen = screenStack[screenStack.length - 1];
//   const previousScreen = screenStack.length > 1 ? screenStack[screenStack.length - 2] : null;

//   const onNavigate = newScreenName => {
//     if (newScreenName === currentScreen.name) return;

//     // Check if we are going back to the immediate previous screen (e.g. via FAB back tap)
//     if (previousScreen && previousScreen.name === newScreenName) {
//       handleGoBack();
//       return;
//     }

//     // Otherwise push new screen
//     setScreenStack(prev => [...prev, {name: newScreenName, key: `${newScreenName}_${Date.now()}`}]);
//     slideAnim.setValue(width);
//     Animated.spring(slideAnim, {
//       toValue: 0,
//       useNativeDriver: true,
//       bounciness: 0,
//       speed: 15,
//     }).start();
//   };

//   const handleGoBack = () => {
//     if (screenStack.length > 1) {
//       Animated.spring(slideAnim, {
//         toValue: width,
//         useNativeDriver: true,
//         bounciness: 0,
//         speed: 15,
//       }).start(() => {
//         setScreenStack(prev => prev.slice(0, -1));
//         slideAnim.setValue(0);
//       });
//       return true;
//     }
//     return false;
//   };

//   useFocusEffect(
//     React.useCallback(() => {
//       const onBackPress = () => {
//         return handleGoBack();
//       };
//       BackHandler.addEventListener('hardwareBackPress', onBackPress);
//       return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
//     }, [screenStack.length])
//   );

//   const renderScreen = screenName => {
//     switch (screenName) {
//       case 'TimeClock':
//         return <TimeClockScreen onNavigate={onNavigate} />;
//       case 'Records':
//         return <AttendanceRecordsScreen onNavigate={onNavigate} />;
//       default:
//         return <HomeScreen onNavigate={onNavigate} />;
//     }
//   };

//   return (
//     <GeofenceProvider person={person}>
//       <ActionPaneContainer
//         pageTitle={TITLES[currentScreen.name]}
//         isBackButton={true}
//         onBackPress={() => {
//           if (!handleGoBack()) {
//             navigation?.goBack();
//           }
//         }}
//         showFooter={true}
//         showFloatingButton={false}
//         isHeaderActive={true}
//         showPageTitleRow={true}>
//         <View style={S.container}>
//           {previousScreen && (
//             <Animated.View
//               style={[
//                 S.screen,
//                 { transform: [{ translateX: slideAnim.interpolate({ inputRange: [0, width], outputRange: [-width * 0.3, 0] }) }] }
//               ]}
//             >
//               {renderScreen(previousScreen.name)}
//             </Animated.View>
//           )}

//           <Animated.View
//             style={[
//               S.screen,
//               { transform: [{ translateX: slideAnim }] }
//             ]}
//           >
//             {renderScreen(currentScreen.name)}
//           </Animated.View>
//         </View>
//       </ActionPaneContainer>
//     </GeofenceProvider>
//   );
// };

// const S = StyleSheet.create({
//   container: {flex: 1, overflow: 'hidden'},
//   screen: {...StyleSheet.absoluteFillObject, backgroundColor: '#F8FAFC'},
// });

// export default AttendanceManagement;

// ─────────────────────────────────────────────
// screens/AttendanceManagement/AttendanceManagement.js
// Root entry. Wraps everything in GeofenceProvider
// so permission + GPS + API runs exactly once.
//
// CHANGE: Accepts route.params.initialScreen to allow
// deep-linking directly to 'TimeClock' from LoginScreen.
// ─────────────────────────────────────────────
import React, {useState, useRef, useEffect} from 'react';
import {
  Animated,
  View,
  Dimensions,
  StyleSheet,
  BackHandler,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import {GeofenceProvider} from '../../components/AttendanceManagement/GeofenceContext';
import HomeScreen from '../../components/AttendanceManagement/Screen/HomeScreen';
import TimeClockScreen from '../../components/AttendanceManagement/Screen/TimeClockScreen';
import AttendanceRecordsScreen from '../../components/AttendanceManagement/Screen/AttendanceRecordsScreen';
import LogoutAlertModal from '../../components/Alert/LogoutAlertModal';
import {handleLogoutauth} from '../../Controller/authUtils';
import {translate as t} from '../../store/utils/translate';

const TITLES = {
  Home: 'Attendance',
  TimeClock: 'Time Clock',
  Records: 'Timesheets',
};

const VALID_SCREENS = ['Home', 'TimeClock', 'Records'];

const {width} = Dimensions.get('window');

const AttendanceManagement = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();

  const isFromTab = route?.params?.fromTab === true;
  const fromLogin = route?.params?.fromLogin === true;

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // Support deep-link to a specific sub-screen via navigation params.
  // e.g. navigation.navigate('AttendanceManagement', { initialScreen: 'TimeClock' })
  const routeInitialScreen = route?.params?.initialScreen;
  const resolvedInitial =
    routeInitialScreen && VALID_SCREENS.includes(routeInitialScreen)
      ? routeInitialScreen
      : 'Home';

  const [screenStack, setScreenStack] = useState([
    {name: resolvedInitial, key: `${resolvedInitial}_0`},
  ]);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const {userData} = useSelector(s => s.user);
  const person = userData?.Person;

  const currentScreen = screenStack[screenStack.length - 1];
  const previousScreen =
    screenStack.length > 1 ? screenStack[screenStack.length - 2] : null;

  // If the route params change (e.g. the screen is reused with a new initialScreen),
  // reset the stack to the requested screen.
  useEffect(() => {
    if (!routeInitialScreen) return;
    if (!VALID_SCREENS.includes(routeInitialScreen)) return;
    // Only reset if it differs from the current top of stack
    if (screenStack[screenStack.length - 1]?.name !== routeInitialScreen) {
      setScreenStack([
        {name: routeInitialScreen, key: `${routeInitialScreen}_reset`},
      ]);
      slideAnim.setValue(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeInitialScreen]);

  const onNavigate = newScreenName => {
    if (currentScreen && newScreenName === currentScreen.name) return;

    // Going back to the immediate previous screen (e.g. via FAB back tap)
    if (previousScreen && previousScreen.name === newScreenName) {
      handleGoBack();
      return;
    }

    // Push new screen
    setScreenStack(prev => [
      ...prev,
      {name: newScreenName, key: `${newScreenName}_${Date.now()}`},
    ]);
    slideAnim.setValue(width);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
      speed: 15,
    }).start();
  };

  const handleGoBack = () => {
    if (screenStack.length > 1) {
      Animated.spring(slideAnim, {
        toValue: width,
        useNativeDriver: true,
        bounciness: 0,
        speed: 15,
      }).start(() => {
        setScreenStack(prev => prev.slice(0, -1));
        slideAnim.setValue(0);
      });
      return true;
    } else if (fromLogin && currentScreen?.name === 'TimeClock') {
      setLogoutModalVisible(true);
      return true;
    }
    return false;
  };

  const confirmLogout = () => {
    setLogoutModalVisible(false);
    handleLogoutauth(navigation, dispatch);
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        return handleGoBack();
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [screenStack.length, currentScreen?.name, fromLogin]),
  );

  const renderScreen = screenName => {
    switch (screenName) {
      case 'TimeClock':
        return <TimeClockScreen onNavigate={onNavigate} />;
      case 'Records':
        return <AttendanceRecordsScreen onNavigate={onNavigate} />;
      default:
        return <HomeScreen onNavigate={onNavigate} />;
    }
  };

  return (
    <GeofenceProvider person={person}>
      <ActionPaneContainer
        pageTitle={TITLES[currentScreen?.name] || 'Attendance'}
        isBackButton={false}
        onBackPress={() => {
          if (!handleGoBack()) {
            navigation?.goBack();
          }
        }}
        showFooter={false}
        showFloatingButton={false}
        showTabNavigator={isFromTab}
        isHeaderActive={true}
        showPageTitleRow={true}>
        <View style={S.container}>
          {previousScreen && (
            <Animated.View
              style={[
                S.screen,
                {
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [0, width],
                        outputRange: [-width * 0.3, 0],
                      }),
                    },
                  ],
                },
              ]}>
              {renderScreen(previousScreen.name)}
            </Animated.View>
          )}

          <Animated.View
            style={[S.screen, {transform: [{translateX: slideAnim}]}]}>
            {renderScreen(currentScreen?.name)}
          </Animated.View>
        </View>

        <LogoutAlertModal
          visible={logoutModalVisible}
          heading={t('profile.logoutConfirm')}
          text={t('profile.logoutConfirm')}
          onConfirm={confirmLogout}
          onCancel={() => setLogoutModalVisible(false)}
        />
      </ActionPaneContainer>
    </GeofenceProvider>
  );
};

const S = StyleSheet.create({
  container: {flex: 1, overflow: 'hidden'},
  screen: {...StyleSheet.absoluteFillObject, backgroundColor: '#F8FAFC'},
});

export default AttendanceManagement;
