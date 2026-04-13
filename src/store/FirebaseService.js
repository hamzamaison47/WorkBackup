// /* eslint-disable no-shadow */
// /* eslint-disable curly */
// /* eslint-disable no-unused-vars */
// // CORRECT IMPORTS FOR v23+
// import {
//   getMessaging,
//   getToken,
//   onMessage,
//   onNotificationOpenedApp,
//   getInitialNotification,
//   onTokenRefresh,
//   requestPermission,
//   hasPermission,
//   AuthorizationStatus,
// } from '@react-native-firebase/messaging';
// import {Platform, Alert, AppState} from 'react-native';
// import DeviceInfo from 'react-native-device-info';
// import {UpdateFirebaseToken} from '../API/RequestForRegistration/UpdateFirebaseToken';
// import {store} from './index';
// import {
//   setFirebaseToken,
//   setLastSyncedToken,
//   setDynamicsSynced,
//   clearFirebaseData,
//   setFirebaseInitialized,
// } from './slices/firebaseSlice';

// class FirebaseService {
//   constructor() {
//     // Get messaging instance
//     this.messaging = getMessaging();
//   }

//   // Helper to get current user data from Redux
//   getUserDataFromRedux() {
//     const state = store.getState();
//     return {
//       userEmail: state.firebase.userEmail,
//       employeeId: state.firebase.employeeId,
//       company: state.firebase.company,
//       isInitialized: state.firebase.isInitialized,
//     };
//   }

//   // Check and request notification permissions
//   async ensureNotificationPermissions() {
//     try {
//       // Request permission on BOTH iOS and Android (Android 13+ requires it)
//       const authStatus = await requestPermission(this.messaging);
//       const enabled =
//         authStatus === AuthorizationStatus.AUTHORIZED ||
//         authStatus === AuthorizationStatus.PROVISIONAL;

//       if (!enabled) {
//         console.log('User declined push notifications');
//         return false;
//       }
//       return true;
//     } catch (error) {
//       console.error('Error ensuring permissions:', error);
//       return false;
//     }
//   }

//   // Get FCM token (with permission check)
//   async getFCMToken() {
//     try {
//       // Check permissions first
//       const hasPermission = await this.ensureNotificationPermissions();
//       if (!hasPermission) {
//         return null;
//       }

//       // Get saved token from Redux
//       const state = store.getState();
//       const savedToken = state.firebase.fcmToken;

//       if (savedToken) {
//         console.log('Using saved FCM token from Redux:', savedToken);
//         return savedToken;
//       }

//       // NEW: Use getToken with messaging instance as first parameter
//       const token = await getToken(this.messaging);
//       console.log('New FCM Token obtained:', token);
//       // Save to Redux
//       store.dispatch(setFirebaseToken(token));
//       return token;
//     } catch (error) {
//       console.error('Error getting FCM token:', error);
//       return null;
//     }
//   }

//   // Setup message handlers (call from App.js, pass navigationRef.current)
//   setupMessageHandlers(navigation) {
//     console.log('Setting up Firebase message handlers');

//     // Foreground messages — show Alert when app is open
//     const unsubscribeForeground = onMessage(
//       this.messaging,
//       async remoteMessage => {
//         console.log('Foreground notification received:', remoteMessage);
//         // this.showForegroundNotification(remoteMessage, navigation);
//       },
//     );

//     // App opened from a notification while it was backgrounded (not killed)
//     const unsubscribeOpenedApp = onNotificationOpenedApp(
//       this.messaging,
//       remoteMessage => {
//         console.log('App opened from background notification:', remoteMessage);
//         this.handleNotificationTap(remoteMessage, navigation);
//       },
//     );

//     // App opened from a notification while it was KILLED
//     // Navigation may not be mounted yet — wait 1 second then navigate.
//     getInitialNotification(this.messaging).then(remoteMessage => {
//       if (remoteMessage) {
//         console.log(
//           'App opened from killed state notification:',
//           remoteMessage,
//         );
//         setTimeout(() => {
//           this.handleNotificationTap(remoteMessage, navigation);
//         }, 1000);
//       }
//     });

//     // Token refresh — keep Dynamics in sync
//     const unsubscribeTokenRefresh = onTokenRefresh(
//       this.messaging,
//       async newToken => {
//         console.log('FCM token refreshed:', newToken.substring(0, 20) + '...');
//         store.dispatch(setFirebaseToken(newToken));

//         const {userEmail} = this.getUserDataFromRedux();
//         if (userEmail) {
//           await this.updateTokenInDynamics(newToken);
//         }
//       },
//     );

//     // Eagerly obtain the FCM token now that handlers are ready
//     this.getFCMToken().catch(err =>
//       console.error('Error obtaining FCM token on startup:', err),
//     );

//     return () => {
//       unsubscribeForeground?.();
//       unsubscribeOpenedApp?.();
//       unsubscribeTokenRefresh?.();
//     };
//   }

//   // Check permissions
//   async checkPermissions() {
//     try {
//       // NEW: Use hasPermission with messaging instance
//       const authStatus = await hasPermission(this.messaging);
//       const enabled =
//         authStatus === AuthorizationStatus.AUTHORIZED ||
//         authStatus === AuthorizationStatus.PROVISIONAL;
//       return enabled;
//     } catch (error) {
//       console.error('Error checking permissions:', error);
//       return false;
//     }
//   }

//   async requestPermissions() {
//     try {
//       // NEW: Use requestPermission with messaging instance
//       const authStatus = await requestPermission(this.messaging);
//       const enabled =
//         authStatus === AuthorizationStatus.AUTHORIZED ||
//         authStatus === AuthorizationStatus.PROVISIONAL;
//       return enabled;
//     } catch (error) {
//       console.error('Error requesting permissions:', error);
//       return false;
//     }
//   }

//   // ... rest of your methods remain the same (syncDeviceAfterLogin, updateTokenInDynamics, etc.)
//   // Just copy the rest of your existing methods here

//   // Handle notification tap
//   handleNotificationTap(remoteMessage, navigation) {
//     if (!navigation) return;
//     const data = remoteMessage.data || {};

//     if (data.workflowType) {
//       navigation.navigate('WorkflowApprovals', {notificationData: data});
//     } else {
//       navigation.navigate('Notifications');
//     }
//   }

//   // Show foreground notification
//   showForegroundNotification(remoteMessage, navigation) {
//     Alert.alert(
//       remoteMessage.notification?.title || 'Notification',
//       remoteMessage.notification?.body || 'New message',
//       [
//         {
//           text: 'View',
//           onPress: () => this.handleNotificationTap(remoteMessage, navigation),
//         },
//         {text: 'Dismiss', style: 'cancel'},
//       ],
//     );
//   }

//   // Cleanup on logout - clear Redux state
//   async cleanup() {
//     try {
//       store.dispatch(clearFirebaseData());
//       console.log('Firebase service cleaned up - Redux state cleared');
//     } catch (error) {
//       console.error('Error during cleanup:', error);
//     }
//   }

//   // Helper to check if device is already synced
//   isDeviceSynced() {
//     try {
//       const state = store.getState();
//       const synced = state.firebase.dynamicsSynced;
//       const lastToken = state.firebase.lastSyncedToken;
//       const currentToken = state.firebase.fcmToken;

//       return synced && lastToken === currentToken;
//     } catch (error) {
//       console.error('Error checking sync status:', error);
//       return false;
//     }
//   }

//   // Update token in Dynamics (for token refresh)
//   async updateTokenInDynamics(newToken) {
//     try {
//       // Get FRESH user data from Redux
//       const {userEmail, employeeId, company} = this.getUserDataFromRedux();

//       if (!employeeId) {
//         console.log('No employee ID found, skipping token update');
//         return {success: false, message: 'User not logged in'};
//       }

//       console.log('Updating Firebase token in Dynamics via SOAP');

//       const updateData = {
//         Email: userEmail,
//         EmployeeID: employeeId,
//         FirebaseToken: newToken,
//         Company: company || '',
//       };

//       const result = await UpdateFirebaseToken({updateData: updateData});

//       if (result && result.parmIsSuccess) {
//         // Update Redux
//         store.dispatch(setLastSyncedToken(newToken));
//         console.log('Token updated successfully in Dynamics');
//         return {
//           success: true,
//           message: result.parmMessage || 'Token updated successfully',
//         };
//       } else {
//         console.error('Token update failed:', result?.parmMessage);
//         return {
//           success: false,
//           message: result?.parmMessage || 'Token update failed',
//         };
//       }
//     } catch (error) {
//       console.error('Error updating token:', error);
//       // Still save token locally in Redux for retry
//       store.dispatch(setLastSyncedToken(newToken));
//       return {
//         success: false,
//         message: `Token update error: ${error.message}`,
//       };
//     }
//   }

//   // Sync device with Dynamics after login (UPDATE only)
//   async syncDeviceAfterLogin() {
//     try {
//       // Step 1: Get FRESH user data from Redux
//       const {userEmail, employeeId, company, isInitialized} =
//         this.getUserDataFromRedux();

//       console.log('FirebaseService syncing with data from Redux:', {
//         userEmail,
//         employeeId,
//         company,
//       });

//       if (!userEmail || !employeeId || !company) {
//         console.error('User data not complete for sync');
//         return {success: false, message: 'User data not complete'};
//       }

//       // Step 2: Get FCM token
//       const firebaseToken = await this.getFCMToken();
//       if (!firebaseToken) {
//         return {success: false, message: 'Failed to get Firebase token'};
//       }

//       // Step 3: Check if token is already synced
//       const state = store.getState();
//       const lastSyncedToken = state.firebase.lastSyncedToken;

//       if (lastSyncedToken === firebaseToken) {
//         console.log('Device token already synced with current token');
//         return {success: true, message: 'Already synced'};
//       }

//       console.log('Syncing device token with Dynamics via SOAP...');

//       // Step 4: Prepare update data for SOAP service
//       const updateData = {
//         Email: userEmail, // Use fresh data from Redux
//         EmployeeID: employeeId, // Use fresh data from Redux
//         FirebaseToken: firebaseToken,
//         Company: company || '', // Use fresh data from Redux
//       };

//       console.log('Sending token update to SOAP service');

//       // Step 5: Update token in Dynamics
//       const result = await UpdateFirebaseToken({updateData: updateData});

//       if (result && result.parmIsSuccess) {
//         // Update Redux with synced token
//         store.dispatch(setLastSyncedToken(firebaseToken));
//         store.dispatch(setDynamicsSynced(true));

//         console.log('Device token synced successfully');

//         return {
//           success: true,
//           message: result.parmMessage || 'Device token synced successfully',
//         };
//       } else {
//         return {
//           success: false,
//           message: result?.parmMessage || 'Token sync failed',
//         };
//       }
//     } catch (error) {
//       console.error('Error in device sync:', error);
//       return {
//         success: false,
//         message: `Sync error: ${error.message}`,
//       };
//     }
//   }
// }

// const firebaseService = new FirebaseService();
// export default firebaseService;
/* eslint-disable no-shadow */
/* eslint-disable curly */
/* eslint-disable no-unused-vars */
// CORRECT IMPORTS FOR v23+
import {
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  onTokenRefresh,
  requestPermission,
  hasPermission,
  AuthorizationStatus,
  registerDeviceForRemoteMessages,
  isDeviceRegisteredForRemoteMessages,
} from '@react-native-firebase/messaging';
import {Platform, Alert, AppState} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import {UpdateFirebaseToken} from '../API/RequestForRegistration/UpdateFirebaseToken';
import {store} from './index';
import {
  setFirebaseToken,
  setLastSyncedToken,
  setDynamicsSynced,
  clearFirebaseData,
  setFirebaseInitialized,
} from './slices/firebaseSlice';

class FirebaseService {
  constructor() {
    this.messaging = getMessaging();
  }

  getUserDataFromRedux() {
    const state = store.getState();
    return {
      userEmail: state.firebase.userEmail,
      employeeId: state.firebase.employeeId,
      company: state.firebase.company,
      isInitialized: state.firebase.isInitialized,
    };
  }

  // Register device for remote messages (iOS only, required before getToken)
  async registerForRemoteMessages() {
    try {
      if (Platform.OS === 'ios') {
        const isRegistered = isDeviceRegisteredForRemoteMessages(this.messaging);
        if (!isRegistered) {
          await registerDeviceForRemoteMessages(this.messaging);
          console.log('Device registered for remote messages (iOS)');
        } else {
          console.log('Device already registered for remote messages (iOS)');
        }
      }
    } catch (error) {
      console.error('Error registering device for remote messages:', error);
      throw error;
    }
  }

  async ensureNotificationPermissions() {
    try {
      const authStatus = await requestPermission(this.messaging);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('User declined push notifications');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error ensuring permissions:', error);
      return false;
    }
  }

  async getFCMToken() {
    try {
      // Step 1: Register device for remote messages (iOS requirement)
      await this.registerForRemoteMessages();

      // Step 2: Check permissions
      const hasPermission = await this.ensureNotificationPermissions();
      if (!hasPermission) {
        return null;
      }

      // Step 3: Get saved token from Redux
      const state = store.getState();
      const savedToken = state.firebase.fcmToken;

      if (savedToken) {
        console.log('Using saved FCM token from Redux:', savedToken);
        return savedToken;
      }

      // Step 4: Get new token
      const token = await getToken(this.messaging);
      console.log('New FCM Token obtained:', token);
      store.dispatch(setFirebaseToken(token));
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  setupMessageHandlers(navigation) {
    console.log('Setting up Firebase message handlers');

    const unsubscribeForeground = onMessage(
      this.messaging,
      async remoteMessage => {
        console.log('Foreground notification received:', remoteMessage);
        // this.showForegroundNotification(remoteMessage, navigation);
      },
    );

    const unsubscribeOpenedApp = onNotificationOpenedApp(
      this.messaging,
      remoteMessage => {
        console.log('App opened from background notification:', remoteMessage);
        this.handleNotificationTap(remoteMessage, navigation);
      },
    );

    getInitialNotification(this.messaging).then(remoteMessage => {
      if (remoteMessage) {
        console.log(
          'App opened from killed state notification:',
          remoteMessage,
        );
        setTimeout(() => {
          this.handleNotificationTap(remoteMessage, navigation);
        }, 1000);
      }
    });

    const unsubscribeTokenRefresh = onTokenRefresh(
      this.messaging,
      async newToken => {
        console.log('FCM token refreshed:', newToken.substring(0, 20) + '...');
        store.dispatch(setFirebaseToken(newToken));

        const {userEmail} = this.getUserDataFromRedux();
        if (userEmail) {
          await this.updateTokenInDynamics(newToken);
        }
      },
    );

    this.getFCMToken().catch(err =>
      console.error('Error obtaining FCM token on startup:', err),
    );

    return () => {
      unsubscribeForeground?.();
      unsubscribeOpenedApp?.();
      unsubscribeTokenRefresh?.();
    };
  }

  async checkPermissions() {
    try {
      const authStatus = await hasPermission(this.messaging);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;
      return enabled;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  async requestPermissions() {
    try {
      const authStatus = await requestPermission(this.messaging);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;
      return enabled;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  handleNotificationTap(remoteMessage, navigation) {
    if (!navigation) return;
    const data = remoteMessage.data || {};

    if (data.workflowType) {
      navigation.navigate('WorkflowApprovals', {notificationData: data});
    } else {
      navigation.navigate('Notifications');
    }
  }

  showForegroundNotification(remoteMessage, navigation) {
    Alert.alert(
      remoteMessage.notification?.title || 'Notification',
      remoteMessage.notification?.body || 'New message',
      [
        {
          text: 'View',
          onPress: () => this.handleNotificationTap(remoteMessage, navigation),
        },
        {text: 'Dismiss', style: 'cancel'},
      ],
    );
  }

  async cleanup() {
    try {
      store.dispatch(clearFirebaseData());
      console.log('Firebase service cleaned up - Redux state cleared');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  isDeviceSynced() {
    try {
      const state = store.getState();
      const synced = state.firebase.dynamicsSynced;
      const lastToken = state.firebase.lastSyncedToken;
      const currentToken = state.firebase.fcmToken;

      return synced && lastToken === currentToken;
    } catch (error) {
      console.error('Error checking sync status:', error);
      return false;
    }
  }

  async updateTokenInDynamics(newToken) {
    try {
      const {userEmail, employeeId, company} = this.getUserDataFromRedux();

      if (!employeeId) {
        console.log('No employee ID found, skipping token update');
        return {success: false, message: 'User not logged in'};
      }

      console.log('Updating Firebase token in Dynamics via SOAP');

      const updateData = {
        Email: userEmail,
        EmployeeID: employeeId,
        FirebaseToken: newToken,
        Company: company || '',
      };

      const result = await UpdateFirebaseToken({updateData: updateData});

      if (result && result.parmIsSuccess) {
        store.dispatch(setLastSyncedToken(newToken));
        console.log('Token updated successfully in Dynamics');
        return {
          success: true,
          message: result.parmMessage || 'Token updated successfully',
        };
      } else {
        console.error('Token update failed:', result?.parmMessage);
        return {
          success: false,
          message: result?.parmMessage || 'Token update failed',
        };
      }
    } catch (error) {
      console.error('Error updating token:', error);
      store.dispatch(setLastSyncedToken(newToken));
      return {
        success: false,
        message: `Token update error: ${error.message}`,
      };
    }
  }

  async syncDeviceAfterLogin() {
    try {
      const {userEmail, employeeId, company, isInitialized} =
        this.getUserDataFromRedux();

      console.log('FirebaseService syncing with data from Redux:', {
        userEmail,
        employeeId,
        company,
      });

      if (!userEmail || !employeeId || !company) {
        console.error('User data not complete for sync');
        return {success: false, message: 'User data not complete'};
      }

      const firebaseToken = await this.getFCMToken();
      if (!firebaseToken) {
        return {success: false, message: 'Failed to get Firebase token'};
      }

      const state = store.getState();
      const lastSyncedToken = state.firebase.lastSyncedToken;

      if (lastSyncedToken === firebaseToken) {
        console.log('Device token already synced with current token');
        return {success: true, message: 'Already synced'};
      }

      console.log('Syncing device token with Dynamics via SOAP...');

      const updateData = {
        Email: userEmail,
        EmployeeID: employeeId,
        FirebaseToken: firebaseToken,
        Company: company || '',
      };

      console.log('Sending token update to SOAP service');

      const result = await UpdateFirebaseToken({updateData: updateData});

      if (result && result.parmIsSuccess) {
        store.dispatch(setLastSyncedToken(firebaseToken));
        store.dispatch(setDynamicsSynced(true));

        console.log('Device token synced successfully');

        return {
          success: true,
          message: result.parmMessage || 'Device token synced successfully',
        };
      } else {
        return {
          success: false,
          message: result?.parmMessage || 'Token sync failed',
        };
      }
    } catch (error) {
      console.error('Error in device sync:', error);
      return {
        success: false,
        message: `Sync error: ${error.message}`,
      };
    }
  }
}

const firebaseService = new FirebaseService();
export default firebaseService;