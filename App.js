// /* eslint-disable curly */
// import React, {useEffect} from 'react';
// import {Provider, useSelector} from 'react-redux';
// import {NavigationContainer} from '@react-navigation/native';
// import {I18nManager} from 'react-native';
// import RNRestart from 'react-native-restart';
// import {PersistGate} from 'redux-persist/integration/react';

// import {store, persistor} from './src/store';
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

// const AppContent = () => {
//   const isRTL = useSelector(state => state.language.isRTL);
//   const currentLanguage = useSelector(state => state.language.currentLanguage);

//   useEffect(() => {
//     // Setup Firebase message handlers
//     const cleanup = firebaseService.setupMessageHandlers();

//     // Check if RTL is correctly set on app start
//     const checkRTL = () => {
//       try {
//         // Check if RTL setting doesn't match Redux state
//         if (isRTL !== I18nManager.isRTL) {
//           console.log('RTL mismatch detected. Restarting app...', {
//             reduxIsRTL: isRTL,
//             i18nManagerIsRTL: I18nManager.isRTL,
//             currentLanguage,
//           });
//           I18nManager.forceRTL(isRTL);
//           RNRestart.Restart();
//         }
//       } catch (error) {
//         console.error('Error checking RTL:', error);
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
//   }, [isRTL, currentLanguage]);

//   return (
//     <NavigationContainer>
//       <AppWrapper />
//     </NavigationContainer>
//   );
// };

// const App = () => {
//   return (
//     <Provider store={store}>
//       <PersistGate loading={null} persistor={persistor}>
//         <AppContent />
//       </PersistGate>
//     </Provider>
//   );
// };

// export default App;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* eslint-disable curly */
import React, {useEffect} from 'react';
import {Provider, useSelector} from 'react-redux';
import {NavigationContainer} from '@react-navigation/native';
import {I18nManager} from 'react-native';
import RNRestart from 'react-native-restart';
import {PersistGate} from 'redux-persist/integration/react';

import {store, persistor} from './src/store';
import AppNavigator from './src/Navigation/AppNavigator';
import firebaseService from './src/store/FirebaseService';

const AppContent = () => {
  const isRTL = useSelector(state => state.language.isRTL);
  const currentLanguage = useSelector(state => state.language.currentLanguage);

  useEffect(() => {
    // Setup Firebase message handlers
    const cleanup = firebaseService.setupMessageHandlers();

    // Check if RTL is correctly set on app start
    const checkRTL = () => {
      try {
        // Check if RTL setting doesn't match Redux state
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
  }, [isRTL, currentLanguage]);

  return (
    <NavigationContainer>
      <AppNavigator />
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
