/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
import React, {useEffect, useCallback} from 'react';
import {Provider, useSelector} from 'react-redux';
import {NavigationContainer} from '@react-navigation/native';
import {I18nManager, Text, TextInput} from 'react-native';
import RNRestart from 'react-native-restart';
import {PersistGate} from 'redux-persist/integration/react';

import {store, persistor} from './src/store';
import AppNavigator from './src/Navigation/AppNavigator';
import firebaseService from './src/store/FirebaseService';
import {selectIsRTL, selectCurrentLanguage} from './src/store/selectors';

// Disable font scaling
if (Text.defaultProps == null) Text.defaultProps = {};
Text.defaultProps.allowFontScaling = false;

if (TextInput.defaultProps == null) TextInput.defaultProps = {};
TextInput.defaultProps.allowFontScaling = false;

const AppContent = () => {
  const isRTL = useSelector(selectIsRTL);
  const currentLanguage = useSelector(selectCurrentLanguage);

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
    const cleanup = firebaseService.setupMessageHandlers();

    firebaseService.requestPermissions().catch(console.error);
    checkRTL();

    return () => {
      if (cleanup) cleanup();
    };
  }, [checkRTL]);

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
};

const App = () => (
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <AppContent />
    </PersistGate>
  </Provider>
);

export default App;
