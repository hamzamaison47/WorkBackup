import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import SplashScreens from '../screens/SplashScreens';
import LoginScreen from '../screens/LoginScreen';
import DrawerNavigator from './DrawerNavigator';
import QRSetupScreen from '../screens/Setup/QRSetupScreen';
import RequestForRegistration from '../screens/RequestForRegistration/RequestForRegistration';
import ConfigSelectionScreen from '../screens/Setup/ConfigSelectionScreen';
import CreateAttendanceScreen from '../screens/Attendance/CreateAttendanceScreen';
import SettingsScreen from '../screens/Settings/Settingsscreen';
import WorkflowHistoryScreen from '../screens/WorkflowHistory/WorkflowHistoryListPage';
import OutlookCalendarScreen from '../screens/Settings/OutlookCalendarScreen';

import useSessionTimeout from '../hooks/useSessionTimeout';
import AlertModal from '../components/Alert/AlertModal';
import AttendanceManagement from '../screens/AttendanceManagement/AttendanceManagement';

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
      {/* Screens WITH session timeout */}
      <Stack.Screen name="DrawerNavigator" options={{headerShown: false, gestureEnabled: false}}>
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
        name="CreateAttendanceScreen"
        options={{
          title: 'Mark Attendance',
          headerBackTitle: 'Back',
        }}>
        {() => (
          <ScreenWithSessionTimeout>
            <CreateAttendanceScreen />
          </ScreenWithSessionTimeout>
        )}
      </Stack.Screen>
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
      <Stack.Screen
        name="OutlookCalendarScreen"
        component={OutlookCalendarScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="AttendanceManagement"
        component={AttendanceManagement}
      />

      {/* SettingsScreen — must NOT hide the header so ActionPaneContainer
          can inject its custom header via navigation.setOptions            */}
      <Stack.Screen name="SettingsScreen" options={{headerShown: true}}>
        {() => (
          <ScreenWithSessionTimeout>
            <SettingsScreen />
          </ScreenWithSessionTimeout>
        )}
      </Stack.Screen>
      <Stack.Screen name="WorkflowHistoryScreen" options={{headerShown: true}}>
        {() => (
          <ScreenWithSessionTimeout>
            <WorkflowHistoryScreen />
          </ScreenWithSessionTimeout>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default AppNavigator;
