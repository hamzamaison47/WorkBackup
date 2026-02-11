/* eslint-disable curly */
import React, {useEffect, useMemo, useCallback} from 'react';
import {Provider, useSelector} from 'react-redux';
import {NavigationContainer} from '@react-navigation/native';
import {I18nManager} from 'react-native';
import RNRestart from 'react-native-restart';
import {PersistGate} from 'redux-persist/integration/react';

import {store, persistor} from './src/store';
import AppNavigator from './src/Navigation/AppNavigator';
import firebaseService from './src/store/FirebaseService';
import {initializeAzureConfig} from './src/services/SecureConfigService';
import azureAIService from './src/services/AzureAIService';
import {performanceMonitor} from './src/utils/performanceMonitor';
import {selectIsRTL, selectCurrentLanguage} from './src/store/selectors';

const AppContent = () => {
  // Use memoized selectors to prevent unnecessary re-renders
  const isRTL = useSelector(selectIsRTL);
  const currentLanguage = useSelector(selectCurrentLanguage);

  // Memoize the RTL check function
  const checkRTL = useCallback(() => {
    try {
      if (isRTL !== I18nManager.isRTL) {
        console.log('RTL mismatch detected. Restarting app...', {
          reduxIsRTL: isRTL,
          i18nManagerIsRTL: I18nManager.isRTL,
          currentLanguage,
        });
        I18nManager.forceRTL(isRTL);
        RNRestart.Restart();
      }
    } catch (error) {
      console.error('Error checking RTL:', error);
    }
  }, [isRTL, currentLanguage]);

  // Initialize services with error handling and performance tracking
  useEffect(() => {
    const initializeApp = async () => {
      performanceMonitor.startMeasure('app-initialization');

      try {
        // Initialize secure configuration (Azure)
        await performanceMonitor.measureAsync('secure-config-init', () =>
          initializeAzureConfig(),
        );
        console.log('✅ Secure configuration initialized');

        // Initialize Azure AI Service after config is loaded
        await performanceMonitor.measureAsync('azure-ai-init', () =>
          azureAIService.initialize(),
        );
        console.log('✅ Azure AI Service initialized');

        // Request notification permissions
        await performanceMonitor.measureAsync('firebase-permissions', () =>
          firebaseService.requestPermissions(),
        );

        checkRTL();
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
      } finally {
        performanceMonitor.endMeasure('app-initialization');
      }
    };

    // Setup Firebase message handlers
    const cleanup = firebaseService.setupMessageHandlers();

    initializeApp();

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

const App = () => {
  // Memoize the AppContent component
  const memoizedAppContent = useMemo(() => <AppContent />, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {memoizedAppContent}
      </PersistGate>
    </Provider>
  );
};

export default App;
