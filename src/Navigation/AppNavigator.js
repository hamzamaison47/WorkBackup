// import React from 'react';
// import {createStackNavigator} from '@react-navigation/stack';

// import SplashScreens from '../screens/SplashScreens';
// import LoginScreen from '../screens/LoginScreen';
// import DrawerNavigator from './DrawerNavigator';
// import QRSetupScreen from '../screens/Setup/QRSetupScreen';
// import RequestForRegistration from '../screens/RequestForRegistration/RequestForRegistration';
// import ConfigSelectionScreen from '../screens/Setup/ConfigSelectionScreen';

// const Stack = createStackNavigator();

// const AppNavigator = () => {
//   return (
//     <Stack.Navigator initialRouteName="SplashScreen">
//       <Stack.Screen
//         name="SplashScreen"
//         component={SplashScreens}
//         options={{headerShown: false}}
//       />
//       <Stack.Screen
//         name="Login"
//         component={LoginScreen}
//         options={{headerShown: false}}
//       />
//       <Stack.Screen
//         name="DrawerNavigator"
//         component={DrawerNavigator}
//         options={{headerShown: false}}
//       />
//       <Stack.Screen
//         name="RequestForRegistration"
//         component={RequestForRegistration}
//         options={{headerShown: false}}
//       />
//       <Stack.Screen
//         name="ConfigSelectionScreen"
//         component={ConfigSelectionScreen}
//         options={{headerShown: false}}
//       />
//       <Stack.Screen
//         name="QRSetupScreen"
//         component={QRSetupScreen}
//         options={{headerShown: false}}
//       />
//     </Stack.Navigator>
//   );
// };

// export default AppNavigator;

import React, {useEffect, useState} from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SplashScreens from '../screens/SplashScreens';
import LoginScreen from '../screens/LoginScreen';
import DrawerNavigator from './DrawerNavigator';
import QRSetupScreen from '../screens/Setup/QRSetupScreen';
import RequestForRegistration from '../screens/RequestForRegistration/RequestForRegistration';
import ConfigSelectionScreen from '../screens/Setup/ConfigSelectionScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const [initialRoute, setInitialRoute] = useState('SplashScreen');
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      // Check if user is logged in
      const userToken = await AsyncStorage.getItem('@user_token');
      const isRestarting = await AsyncStorage.getItem('@app_restarting');

      // If we just restarted for language change and user was logged in
      if (isRestarting === 'true' && userToken) {
        setInitialRoute('DrawerNavigator');
      } else {
        setInitialRoute('SplashScreen');
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      setInitialRoute('SplashScreen');
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return null; // Or show a loading indicator
  }

  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Screen
        name="SplashScreen"
        component={SplashScreens}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="DrawerNavigator"
        component={DrawerNavigator}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="RequestForRegistration"
        component={RequestForRegistration}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ConfigSelectionScreen"
        component={ConfigSelectionScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="QRSetupScreen"
        component={QRSetupScreen}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
