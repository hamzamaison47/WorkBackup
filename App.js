// /* eslint-disable curly */
// import React, {useEffect} from 'react';
// import {Provider} from 'react-redux';
// import {NavigationContainer} from '@react-navigation/native';
// import {I18nManager} from 'react-native';
// import RNRestart from 'react-native-restart';

// import './src/i18n';
// import {store} from './src/store';
// import AppNavigator from './src/Navigation/AppNavigator';
// import useSessionTimeout from './src/hooks/useSessionTimeout';
// import AlertModal from './src/components/Alert/AlertModal';
// import firebaseService from './src/store/FirebaseService';

// const AppWrapper = () => {
//   const {showModal, handleOkPress} = useSessionTimeout();

//   return (
//     <>
//       <AppNavigator />
//       <AlertModal
//         visible={showModal}
//         heading="Session Expired"
//         text="Your session has timed out. Please login again to continue."
//         onPress={handleOkPress}
//       />
//     </>
//   );
// };

// const App = () => {
//   useEffect(() => {
//     // Setup Firebase message handlers
//     const cleanup = firebaseService.setupMessageHandlers();

//     // Check if RTL is correctly set on app start
//     const checkRTL = async () => {
//       const AsyncStorage =
//         require('@react-native-async-storage/async-storage').default;
//       const language = await AsyncStorage.getItem('@app_language');
//       const shouldBeRTL = language === 'ur';

//       if (shouldBeRTL !== I18nManager.isRTL) {
//         I18nManager.forceRTL(shouldBeRTL);
//         RNRestart.Restart();
//       }
//     };

//     // Request notification permissions
//     const requestPermissions = async () => {
//       try {
//         await firebaseService.requestPermissions();
//       } catch (error) {
//         console.error('Error requesting notification permissions:', error);
//       }
//     };

//     requestPermissions();
//     checkRTL();
//     return () => {
//       if (cleanup) cleanup();
//     };
//   }, []);

//   return (
//     <Provider store={store}>
//       <NavigationContainer>
//         <AppWrapper />
//       </NavigationContainer>
//     </Provider>
//   );
// };

// export default App;

/* eslint-disable curly */
import React, {useEffect} from 'react';
import {Provider, useSelector} from 'react-redux';
import {NavigationContainer} from '@react-navigation/native';
import {I18nManager} from 'react-native';
import RNRestart from 'react-native-restart';
import {PersistGate} from 'redux-persist/integration/react';

import './src/i18n';
import {store, persistor} from './src/store';
import AppNavigator from './src/Navigation/AppNavigator';
import useSessionTimeout from './src/hooks/useSessionTimeout';
import AlertModal from './src/components/Alert/AlertModal';
import firebaseService from './src/store/FirebaseService';

const AppWrapper = () => {
  const {showModal, handleOkPress} = useSessionTimeout();

  return (
    <>
      <AppNavigator />
      <AlertModal
        visible={showModal}
        heading="Session Expired"
        text="Your session has timed out. Please login again to continue."
        onPress={handleOkPress}
      />
    </>
  );
};

const AppContent = () => {
  const currentLanguage = useSelector(state => state.language.currentLanguage);

  useEffect(() => {
    // Setup Firebase message handlers
    const cleanup = firebaseService.setupMessageHandlers();

    // Check if RTL is correctly set on app start
    const checkRTL = () => {
      try {
        const shouldBeRTL = currentLanguage === 'ur';

        // Only restart if RTL setting doesn't match current language
        if (shouldBeRTL !== I18nManager.isRTL) {
          console.log('RTL mismatch detected. Restarting app...');
          I18nManager.forceRTL(shouldBeRTL);
          RNRestart.Restart();
        }
      } catch (error) {
        console.error('Error checking RTL:', error);
      }
    };

    // Request notification permissions
    const requestPermissions = async () => {
      try {
        await firebaseService.requestPermissions();
      } catch (error) {
        console.error('Error requesting notification permissions:', error);
      }
    };

    requestPermissions();
    checkRTL();

    return () => {
      if (cleanup) cleanup();
    };
  }, [currentLanguage]);

  return (
    <NavigationContainer>
      <AppWrapper />
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppContent />
      </PersistGate>
    </Provider>
  );
};

export default App;
