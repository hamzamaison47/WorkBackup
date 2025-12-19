/* eslint-disable curly */
/* eslint-disable no-unused-vars */
import messaging from '@react-native-firebase/messaging';
import {Platform, Alert, AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import {UpdateFirebaseToken} from '../API/RequestForRegistration/UpdateFirebaseToken';

class FirebaseService {
  constructor() {
    this.userEmail = null;
    this.employeeId = null;
    this.company = null;
    this.isInitialized = false;
  }

  // Initialize with user data
  async initializeUserData() {
    try {
      this.userEmail = await AsyncStorage.getItem('user_email');
      this.employeeId = await AsyncStorage.getItem('employeeId');
      this.company = await AsyncStorage.getItem('defaultLegalEntity');

      this.isInitialized = true;

      console.log('FirebaseService initialized:', {
        email: this.userEmail,
        employeeId: this.employeeId,
        company: this.company,
      });

      return true;
    } catch (error) {
      console.error('Error initializing FirebaseService:', error);
      return false;
    }
  }

  // Check and request notification permissions
  async ensureNotificationPermissions() {
    try {
      if (Platform.OS === 'android') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          console.log('User declined push notifications');
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error ensuring permissions:', error);
      return false;
    }
  }

  // Get FCM token (with permission check)
  async getFCMToken() {
    try {
      // Check permissions first
      const hasPermission = await this.ensureNotificationPermissions();
      if (!hasPermission) {
        return null;
      }

      const savedToken = await AsyncStorage.getItem('fcm_token');
      if (savedToken) {
        console.log(
          'Using saved FCM token:',
          savedToken.substring(0, 20) + '...',
        );
        return savedToken;
      }

      const token = await messaging().getToken();
      console.log('New FCM Token obtained:', token.substring(0, 20) + '...');
      await AsyncStorage.setItem('fcm_token', token);
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  // Get Device ID
  // async getDeviceId() {
  //   try {
  //     let deviceId = await AsyncStorage.getItem('device_id');
  //     if (!deviceId) {
  //       deviceId = await DeviceInfo.getUniqueId();
  //       await AsyncStorage.setItem('device_id', deviceId);
  //     }
  //     console.log('Device ID:', deviceId);
  //     return deviceId;
  //   } catch (error) {
  //     console.error('Error getting device ID:', error);
  //     const fallbackId = `device_${Date.now()}`;
  //     await AsyncStorage.setItem('device_id', fallbackId);
  //     return fallbackId;
  //   }
  // }

  // Sync device with Dynamics after login (UPDATE only)
  async syncDeviceAfterLogin() {
    try {
      // Step 1: Ensure user data is loaded
      if (!this.isInitialized) {
        await this.initializeUserData();
      }

      if (!this.userEmail || !this.employeeId || !this.company) {
        console.error('User data not complete for sync');
        return {success: false, message: 'User data not complete'};
      }

      // Step 2: Get FCM token
      const firebaseToken = await this.getFCMToken();
      if (!firebaseToken) {
        return {success: false, message: 'Failed to get Firebase token'};
      }

      // Step 3: Get device ID
      // const deviceId = await this.getDeviceId();

      // Step 4: Check if token is already synced
      const lastSyncedToken = await AsyncStorage.getItem('last_dynamics_token');
      if (lastSyncedToken === firebaseToken) {
        console.log('Device token already synced with current token');
        return {success: true, message: 'Already synced'};
      }

      console.log('Syncing device token with Dynamics via SOAP...');

      // Step 5: Prepare update data for SOAP service
      const updateData = {
        Email: this.userEmail,
        EmployeeID: this.employeeId,
        FirebaseToken: firebaseToken,
        Company: this.company || '',
      };

      console.log('Sending token update to SOAP service');

      // Step 6: Update token in Dynamics
      // const result = await UpdateFirebaseToken({registerData: updateData});
      const result = await UpdateFirebaseToken({updateData: updateData});

      if (result && result.parmIsSuccess) {
        await AsyncStorage.setItem('last_dynamics_token', firebaseToken);
        await AsyncStorage.setItem('dynamics_synced', 'true');

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

  // Update token in Dynamics (for token refresh)
  async updateTokenInDynamics(newToken) {
    try {
      if (!this.isInitialized) {
        await this.initializeUserData();
      }

      if (!this.employeeId) {
        console.log('No employee ID found, skipping token update');
        return {success: false, message: 'User not logged in'};
      }

      // const deviceId = await this.getDeviceId();

      console.log('Updating Firebase token in Dynamics via SOAP');

      const updateData = {
        Email: this.userEmail,
        EmployeeID: this.employeeId,
        FirebaseToken: newToken,
        Company: this.company || '',
      };

      // const result = await UpdateFirebaseToken({registerData: updateData});
      const result = await UpdateFirebaseToken({updateData: updateData});

      if (result && result.parmIsSuccess) {
        await AsyncStorage.setItem('last_dynamics_token', newToken);
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
      // Still save token locally for retry
      await AsyncStorage.setItem('last_dynamics_token', newToken);
      return {
        success: false,
        message: `Token update error: ${error.message}`,
      };
    }
  }

  // Setup message handlers (should be called from main app component)
  setupMessageHandlers(navigation) {
    console.log('Setting up Firebase message handlers');

    // Handle foreground notifications
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('Foreground notification received:', remoteMessage);
      this.showForegroundNotification(remoteMessage, navigation);
    });

    // Handle when app is opened from notification
    const unsubscribeOpenedApp = messaging().onNotificationOpenedApp(
      remoteMessage => {
        console.log('App opened from notification:', remoteMessage);
        this.handleNotificationTap(remoteMessage, navigation);
      },
    );

    // Handle when app is opened from quit state via notification
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('App opened from quit state:', remoteMessage);
          this.handleNotificationTap(remoteMessage, navigation);
        }
      });

    // Handle token refresh
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(
      async newToken => {
        console.log('FCM token refreshed:', newToken.substring(0, 20) + '...');
        await AsyncStorage.setItem('fcm_token', newToken);

        // Update token in Dynamics if user is logged in
        if (this.isInitialized && this.userEmail) {
          await this.updateTokenInDynamics(newToken);
        }
      },
    );

    // Return cleanup function
    return () => {
      unsubscribeForeground();
      unsubscribeOpenedApp();
      unsubscribeTokenRefresh();
    };
  }

  // Show foreground notification
  // showForegroundNotification(remoteMessage, navigation) {
  //   const title = remoteMessage.notification?.title || 'Dynamics 365';
  //   const body =
  //     remoteMessage.notification?.body ||
  //     remoteMessage.data?.body ||
  //     'New notification';

  //   Alert.alert(title, body, [
  //     {text: 'Cancel', style: 'cancel'},
  //     {
  //       text: 'View',
  //       onPress: () => {
  //         this.handleNotificationTap(remoteMessage, navigation);
  //       },
  //     },
  //   ]);
  // }

  // Handle notification tap
  handleNotificationTap(remoteMessage, navigation) {
    if (!navigation) return;
    const data = remoteMessage.data || {};

    if (data.workflowType) {
      navigation.navigate('WorkflowApprovals', {notificationData: data});
    } else {
      navigation.navigate('Notifications');
    }
  }

  // Cleanup on logout
  async cleanup() {
    try {
      await AsyncStorage.multiRemove([
        'fcm_token',
        'last_dynamics_token',
        'dynamics_synced',
      ]);

      this.userEmail = null;
      this.employeeId = null;
      this.company = null;
      this.isInitialized = false;

      console.log('Firebase service cleaned up');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  // Check permissions
  async checkPermissions() {
    try {
      const authStatus = await messaging().hasPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      return enabled;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  async requestPermissions() {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      return enabled;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  // Helper to check if device is already synced
  async isDeviceSynced() {
    try {
      const synced = await AsyncStorage.getItem('dynamics_synced');
      const lastToken = await AsyncStorage.getItem('last_dynamics_token');
      const currentToken = await AsyncStorage.getItem('fcm_token');

      return synced === 'true' && lastToken === currentToken;
    } catch (error) {
      console.error('Error checking sync status:', error);
      return false;
    }
  }
}

const firebaseService = new FirebaseService();
export default firebaseService;
