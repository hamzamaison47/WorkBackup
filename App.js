// import React from 'react';
// import {Provider} from 'react-redux';
// import {NavigationContainer} from '@react-navigation/native';
// import {store} from './src/store';
// import AppNavigator from './src/Navigation/AppNavigator';
// import useSessionTimeout from './src/hooks/useSessionTimeout';
// import AlertModal from './src/components/Alert/AlertModal';

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
import {Provider} from 'react-redux';
import {NavigationContainer} from '@react-navigation/native';
import {store} from './src/store';
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

const App = () => {
  useEffect(() => {
    // Setup Firebase message handlers
    const cleanup = firebaseService.setupMessageHandlers();

    // Request notification permissions
    const requestPermissions = async () => {
      try {
        await firebaseService.requestPermissions();
      } catch (error) {
        console.error('Error requesting notification permissions:', error);
      }
    };

    requestPermissions();

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <Provider store={store}>
      <NavigationContainer>
        <AppWrapper />
      </NavigationContainer>
    </Provider>
  );
};

export default App;
