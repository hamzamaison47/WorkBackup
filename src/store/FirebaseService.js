// const firebaseService = new FirebaseService();
// export default firebaseService;
/* eslint-disable no-shadow */

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
import {addInAppNotification} from './slices/firebaseSlice'; // adjust path

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
      console.log(`[Firebase] Platform: ${Platform.OS}`);
      if (Platform.OS === 'ios') {
        console.log(
          '[Firebase] iOS detected - checking device registration for remote messages',
        );
        const isRegistered = isDeviceRegisteredForRemoteMessages(
          this.messaging,
        );
        console.log(
          `[Firebase] isDeviceRegisteredForRemoteMessages: ${isRegistered}`,
        );
        if (!isRegistered) {
          console.log(
            '[Firebase] Calling registerDeviceForRemoteMessages()...',
          );
          await registerDeviceForRemoteMessages(this.messaging);
          console.log(
            '[Firebase] ✅ Device registered for remote messages (iOS)',
          );

          // After registering, wait for APNS token to be set by AppDelegate
          console.log('[Firebase] Waiting for APNS token from AppDelegate...');
          await this.waitForAPNSToken();
          console.log('[Firebase] ✅ APNS token received from AppDelegate');
        } else {
          console.log(
            '[Firebase] ✅ Device already registered for remote messages (iOS)',
          );
        }
      } else {
        console.log(
          '[Firebase] Android platform - skipping registerDeviceForRemoteMessages',
        );
      }
    } catch (error) {
      console.error(
        '[Firebase] ❌ Error registering device for remote messages:',
        error,
      );
      throw error;
    }
  }

  // Wait for APNS token to be set by AppDelegate (iOS only)
  // AppDelegate calls registerForRemoteNotifications() which triggers didRegisterForRemoteNotificationsWithDeviceToken
  // That callback forwards the token to Firebase, which we need to wait for
  async waitForAPNSToken(timeoutMs = 10000, intervalMs = 300) {
    console.log(
      `[Firebase] Polling for APNS token (${timeoutMs}ms timeout)...`,
    );
    return new Promise((resolve, reject) => {
      const now = Date.now();
      const checkToken = () => {
        if (Date.now() - now > timeoutMs) {
          const msg = `APNS token not received within ${timeoutMs}ms`;
          console.error(`[Firebase] ❌ ${msg}`);
          reject(new Error(msg));
          return;
        }

        // Try to get token to see if APNS token is available
        getToken(this.messaging)
          .then(token => {
            if (token) {
              console.log(
                `[Firebase] ✅ APNS token is now available, got FCM token: ${token.substring(
                  0,
                  20,
                )}...`,
              );
              resolve(token);
            } else {
              // Token not ready yet, keep polling
              setTimeout(checkToken, intervalMs);
            }
          })
          .catch(() => {
            // Not ready yet, keep polling
            setTimeout(checkToken, intervalMs);
          });
      };

      checkToken();
    });
  }

  async ensureNotificationPermissions() {
    try {
      console.log('[Firebase] Requesting notification permissions...');
      const authStatus = await requestPermission(this.messaging);
      console.log(`[Firebase] Auth status: ${authStatus}`);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log(
          '⚠️ [Firebase] User declined or did not grant push notifications',
        );
        return false;
      }
      console.log('✅ [Firebase] Push notifications permitted');
      return true;
    } catch (error) {
      console.error('[Firebase] ❌ Error ensuring permissions:', error);
      return false;
    }
  }

  async getFCMToken() {
    try {
      console.log(
        '[Firebase] ========== STARTING FCM TOKEN RETRIEVAL ==========',
      );

      // Step 1: Register device for remote messages (iOS requirement)
      await this.registerForRemoteMessages();

      // Step 2: Check permissions
      console.log('[Firebase] Step 2: Checking notification permissions');
      const hasPermission = await this.ensureNotificationPermissions();
      if (!hasPermission) {
        console.log(
          '[Firebase] ❌ User did not grant notification permissions - aborting token retrieval',
        );
        return null;
      }

      // Step 3: Get saved token from Redux
      console.log('[Firebase] Step 3: Checking for saved token in Redux');
      const state = store.getState();
      const savedToken = state.firebase.fcmToken;

      if (savedToken) {
        console.log(
          `[Firebase] ✅ Using saved FCM token from Redux: ${savedToken.substring(
            0,
            20,
          )}...`,
        );
        return savedToken;
      }

      // Step 4: Get new token
      console.log('[Firebase] Step 4: Getting new FCM token from Firebase');
      const token = await getToken(this.messaging);
      console.log(
        `[Firebase] ✅ New FCM Token obtained: ${token?.substring(0, 20)}...`,
      );
      store.dispatch(setFirebaseToken(token));
      console.log(
        '[Firebase] ========== FCM TOKEN RETRIEVAL COMPLETE ==========',
      );
      return token;
    } catch (error) {
      console.error('[Firebase] ❌ Error getting FCM token:', error);
      return null;
    }
  }

  setupMessageHandlers(navigation) {
    console.log('[Firebase] ========== SETTING UP MESSAGE HANDLERS ==========');
    console.log(`[Firebase] Platform: ${Platform.OS}`);
    console.log(`[Firebase] Navigation available: ${!!navigation}`);

    // Foreground message handler - display notification when app is open
    console.log('[Firebase] Registering onMessage handler (foreground)...');
    const unsubscribeForeground = onMessage(
      this.messaging,
      async remoteMessage => {
        console.log('[Firebase] 🔔 FOREGROUND NOTIFICATION RECEIVED:', {
          title: remoteMessage?.notification?.title,
          body: remoteMessage?.notification?.body,
          data: remoteMessage?.data,
        });
        try {
          this.showForegroundNotification(remoteMessage, navigation);
          console.log('[Firebase] ✅ Foreground notification displayed');
        } catch (err) {
          console.error(
            '[Firebase] ❌ Error showing foreground notification:',
            err,
          );
        }
      },
    );
    console.log('[Firebase] ✅ onMessage listener registered');

    // App opened from a notification while it was backgrounded (not killed)
    console.log('[Firebase] Registering onNotificationOpenedApp handler...');
    const unsubscribeOpenedApp = onNotificationOpenedApp(
      this.messaging,
      remoteMessage => {
        console.log('[Firebase] 👆 USER TAPPED BACKGROUND NOTIFICATION:', {
          title: remoteMessage?.notification?.title,
          body: remoteMessage?.notification?.body,
          data: remoteMessage?.data,
        });
        try {
          this.handleNotificationTap(remoteMessage, navigation);
          console.log(
            '[Firebase] ✅ Navigation handled for background notification tap',
          );
        } catch (err) {
          console.error(
            '[Firebase] ❌ Error handling background notification tap:',
            err,
          );
        }
      },
    );
    console.log('[Firebase] ✅ onNotificationOpenedApp listener registered');

    // App opened from a notification while it was KILLED
    console.log(
      '[Firebase] Checking for initial notification (app killed state)...',
    );
    getInitialNotification(this.messaging)
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log(
            '[Firebase] 👆 APP LAUNCHED FROM KILLED STATE NOTIFICATION:',
            {
              title: remoteMessage?.notification?.title,
              body: remoteMessage?.notification?.body,
              data: remoteMessage?.data,
            },
          );
          try {
            setTimeout(() => {
              this.handleNotificationTap(remoteMessage, navigation);
              console.log(
                '[Firebase] ✅ Navigation handled for killed state notification tap',
              );
            }, 1000);
          } catch (err) {
            console.error(
              '[Firebase] ❌ Error handling killed state notification tap:',
              err,
            );
          }
        } else {
          console.log(
            '[Firebase] No initial notification found (app not launched from notification)',
          );
        }
      })
      .catch(err => {
        console.error(
          '[Firebase] ❌ Error checking initial notification:',
          err,
        );
      });

    // Token refresh listener
    console.log('[Firebase] Registering onTokenRefresh listener...');
    const unsubscribeTokenRefresh = onTokenRefresh(
      this.messaging,
      async newToken => {
        console.log(
          `[Firebase] 🔄 FCM TOKEN REFRESHED: ${newToken?.substring(0, 20)}...`,
        );
        try {
          store.dispatch(setFirebaseToken(newToken));

          const {userEmail} = this.getUserDataFromRedux();
          if (userEmail) {
            console.log('[Firebase] Updating token in Dynamics...');
            await this.updateTokenInDynamics(newToken);
            console.log('[Firebase] ✅ Token updated in Dynamics');
          } else {
            console.log(
              '[Firebase] ⚠️ No user email found - skipping Dynamics update',
            );
          }
        } catch (err) {
          console.error('[Firebase] ❌ Error handling token refresh:', err);
        }
      },
    );
    console.log('[Firebase] ✅ onTokenRefresh listener registered');

    // Eagerly obtain the FCM token
    console.log('[Firebase] Getting FCM token on startup...');
    this.getFCMToken().catch(err =>
      console.error('[Firebase] ❌ Error obtaining FCM token on startup:', err),
    );

    console.log(
      '[Firebase] ========== MESSAGE HANDLERS SETUP COMPLETE ==========',
    );

    return () => {
      console.log('[Firebase] Unsubscribing from message handlers...');
      unsubscribeForeground?.();
      unsubscribeOpenedApp?.();
      unsubscribeTokenRefresh?.();
      console.log('[Firebase] ✅ All listeners unsubscribed');
    };
  }

  async checkPermissions() {
    try {
      console.log('[Firebase] Checking current notification permissions...');
      const authStatus = await hasPermission(this.messaging);
      console.log(`[Firebase] Current auth status: ${authStatus}`);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;
      console.log(`[Firebase] Permissions enabled: ${enabled}`);
      return enabled;
    } catch (error) {
      console.error('[Firebase] ❌ Error checking permissions:', error);
      return false;
    }
  }

  async requestPermissions() {
    try {
      console.log('[Firebase] Requesting notification permissions...');
      const authStatus = await requestPermission(this.messaging);
      console.log(`[Firebase] Requested auth status: ${authStatus}`);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;
      console.log(`[Firebase] Permissions granted: ${enabled}`);
      return enabled;
    } catch (error) {
      console.error('[Firebase] ❌ Error requesting permissions:', error);
      return false;
    }
  }

  handleNotificationTap(remoteMessage, navigation) {
    console.log('[Firebase] handleNotificationTap called');
    if (!navigation) {
      console.log(
        '[Firebase] ❌ Navigation is not available - cannot navigate',
      );
      return;
    }
    console.log('[Firebase] ✅ Navigation available');

    const data = remoteMessage.data || {};
    console.log('[Firebase] Notification data:', data);

    if (data.workflowType) {
      console.log(
        `[Firebase] Navigating to WorkflowApprovals with workflow type: ${data.workflowType}`,
      );
      navigation.navigate('WorkflowApprovals', {notificationData: data});
    } else {
      console.log('[Firebase] Navigating to Notifications screen');
      navigation.navigate('Notifications');
    }
  }

  showForegroundNotification(remoteMessage, navigation) {
    console.log('[Firebase] showForegroundNotification called');
    const title = remoteMessage.notification?.title || 'Notification';
    const body = remoteMessage.notification?.body || 'New message';

    // 👇 ADD THIS — feeds push notification into the panel
    store.dispatch(
      addInAppNotification({
        text: body,
        type: 'Firebase',
      }),
    );

    console.log(
      `[Firebase] Showing Alert with title: "${title}", body: "${body}"`,
    );

    try {
      Alert.alert(title, body, [
        {
          text: 'View',
          onPress: () => {
            console.log('[Firebase] User tapped "View" on foreground alert');
            this.handleNotificationTap(remoteMessage, navigation);
          },
        },
        {
          text: 'Dismiss',
          onPress: () =>
            console.log('[Firebase] User tapped "Dismiss" on foreground alert'),
          style: 'cancel',
        },
      ]);
      console.log('[Firebase] ✅ Alert displayed successfully');
    } catch (err) {
      console.error('[Firebase] ❌ Error showing alert:', err);
    }
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
