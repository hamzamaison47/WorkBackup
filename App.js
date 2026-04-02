/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
import React, {useEffect, useCallback, useRef} from 'react';
import {Provider, useSelector} from 'react-redux';
import {NavigationContainer} from '@react-navigation/native';
import {I18nManager, Text, TextInput} from 'react-native';
import RNRestart from 'react-native-restart';
import {PersistGate} from 'redux-persist/integration/react';

import {store, persistor} from './src/store';
import AppNavigator from './src/Navigation/AppNavigator';
import firebaseService from './src/store/FirebaseService';
import {selectIsRTL, selectCurrentLanguage} from './src/store/selectors';
import Geolocation from '@react-native-community/geolocation';

// Disable font scaling globally
if (Text.defaultProps == null) Text.defaultProps = {};
Text.defaultProps.allowFontScaling = false;

if (TextInput.defaultProps == null) TextInput.defaultProps = {};
TextInput.defaultProps.allowFontScaling = false;

const AppContent = () => {
  const isRTL = useSelector(selectIsRTL);
  const currentLanguage = useSelector(selectCurrentLanguage);

  /**
   * navigationRef is passed to FirebaseService so that notification taps can
   * call navigation.navigate() from outside the React tree (e.g. background tap handler).
   */
  const navigationRef = useRef(null);

  const checkRTL = useCallback(() => {
    try {
      if (isRTL !== I18nManager.isRTL) {
        I18nManager.forceRTL(isRTL);
        RNRestart.Restart();
      }
    } catch (error) {
      console.error('Error checking RTL:', error);
    }
  }, [isRTL, currentLanguage]);

  useEffect(() => {
    // Pass the navigation ref so notification taps can navigate correctly.
    // requestPermissions is called inside setupMessageHandlers → getFCMToken → ensureNotificationPermissions.
    // No need for a separate requestPermissions() call here.
    const cleanup = firebaseService.setupMessageHandlers(navigationRef.current);

    checkRTL();

    return () => {
      if (cleanup) cleanup();
    };
  }, [checkRTL]);

  return (
    <NavigationContainer ref={navigationRef}>
      <AppNavigator />
    </NavigationContainer>
  );
};

Geolocation.setRNConfiguration({
  skipPermissionRequests: false,
  authorizationLevel: 'whenInUse',
  locationProvider: 'auto',
});

const App = () => (
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <AppContent />
    </PersistGate>
  </Provider>
);

export default App;
