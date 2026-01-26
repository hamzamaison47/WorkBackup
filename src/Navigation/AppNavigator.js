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

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import SplashScreens from '../screens/SplashScreens';
import LoginScreen from '../screens/LoginScreen';
import DrawerNavigator from './DrawerNavigator';
import QRSetupScreen from '../screens/Setup/QRSetupScreen';
import RequestForRegistration from '../screens/RequestForRegistration/RequestForRegistration';
import ConfigSelectionScreen from '../screens/Setup/ConfigSelectionScreen';
import CreateAttendanceScreen from '../screens/Attendance/CreateAttendanceScreen';
import CreateAttendanceScreen from '../screens/Attendance/CreateAttendanceScreen';

import useSessionTimeout from '../hooks/useSessionTimeout';
import AlertModal from '../components/Alert/AlertModal';

const Stack = createStackNavigator();

// Component that wraps screens with session timeout
const ScreenWithSessionTimeout = ({children}) => {
  const {showModal, handleOkPress} = useSessionTimeout();

  return (
    <>
      {children}
      <AlertModal
        visible={showModal}
        heading="Session Expired"
        text="Your session has timed out. Please login again to continue."
        onPress={handleOkPress}
      />
    </>
  );
};

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="SplashScreen">
      {/* Screens WITHOUT session timeout */}
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
      <Stack.Navigator initialRouteName="SplashScreen">
        {/* Screens WITHOUT session timeout */}
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

        {/* Screens WITH session timeout */}
        <Stack.Screen name="DrawerNavigator" options={{headerShown: false}}>
          {() => (
            <ScreenWithSessionTimeout>
              <DrawerNavigator />
            </ScreenWithSessionTimeout>
          )}
        </Stack.Screen>
        {/* Screens WITH session timeout */}
        <Stack.Screen name="DrawerNavigator" options={{headerShown: false}}>
          {() => (
            <ScreenWithSessionTimeout>
              <DrawerNavigator />
            </ScreenWithSessionTimeout>
          )}
        </Stack.Screen>

        <Stack.Screen
          name="RequestForRegistration"
          options={{headerShown: false}}>
          {() => (
            <ScreenWithSessionTimeout>
              <RequestForRegistration />
            </ScreenWithSessionTimeout>
          )}
        </Stack.Screen>
        <Stack.Screen
          name="RequestForRegistration"
          options={{headerShown: false}}>
          {() => (
            <ScreenWithSessionTimeout>
              <RequestForRegistration />
            </ScreenWithSessionTimeout>
          )}
        </Stack.Screen>

        {/* FIXED: Removed the extra space */}
        <Stack.Screen
          name="CreateAttendanceScreen"
          component={CreateAttendanceScreen}
          options={{
            title: 'Mark Attendance',
            headerBackTitle: 'Back',
          }}
        />

        <Stack.Screen
          name="ConfigSelectionScreen"
          options={{headerShown: false}}>
          {() => (
            <ScreenWithSessionTimeout>
              <ConfigSelectionScreen />
            </ScreenWithSessionTimeout>
          )}
        </Stack.Screen>
        {/* FIXED: Removed the extra space */}
        <Stack.Screen
          name="CreateAttendanceScreen"
          component={CreateAttendanceScreen}
          options={{
            title: 'Mark Attendance',
            headerBackTitle: 'Back',
          }}
        />

        <Stack.Screen
          name="ConfigSelectionScreen"
          options={{headerShown: false}}>
          {() => (
            <ScreenWithSessionTimeout>
              <ConfigSelectionScreen />
            </ScreenWithSessionTimeout>
          )}
        </Stack.Screen>

        <Stack.Screen name="QRSetupScreen" options={{headerShown: false}}>
          {() => (
            <ScreenWithSessionTimeout>
              <QRSetupScreen />
            </ScreenWithSessionTimeout>
          )}
        </Stack.Screen>
      </Stack.Navigator>
      <Stack.Screen name="QRSetupScreen" options={{headerShown: false}}>
        {() => (
          <ScreenWithSessionTimeout>
            <QRSetupScreen />
          </ScreenWithSessionTimeout>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default AppNavigator;
