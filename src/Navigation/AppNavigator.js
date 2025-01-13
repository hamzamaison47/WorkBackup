import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import SplashScreens from '../screens/SplashScreen/SplashScreens';
import LoginScreen from '../screens/LoginScreen';
import DrawerNavigator from './DrawerNavigator';
import EditPersonalInfo from '../screens/PersonalInformation/EditPersonalInfo';

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
        name="EditPersonalInfo"
        component={EditPersonalInfo}
        initialParams={{hidden: true}}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
