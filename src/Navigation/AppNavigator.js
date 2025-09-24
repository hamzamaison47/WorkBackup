import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import SplashScreens from '../screens/SplashScreens';
import LoginScreen from '../screens/LoginScreen';
import DrawerNavigator from './DrawerNavigator';
import QRSetupScreen from '../screens/Setup/QRSetupScreen';
import RequestForRegistration from '../screens/RequestForRegistration/RequestForRegistration';
import ConfigSelectionScreen from '../screens/Setup/ConfigSelectionScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="SplashScreen">
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
        name="QRSetupScreen"
        component={QRSetupScreen}
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
    </Stack.Navigator>
  );
};

export default AppNavigator;
