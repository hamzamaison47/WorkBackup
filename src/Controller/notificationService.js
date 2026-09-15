/* eslint-disable curly */
import PushNotification from 'react-native-push-notification';
import {PermissionsAndroid, Platform, Alert} from 'react-native';
import FileViewer from 'react-native-file-viewer';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';

class NotificationService {
  constructor() {
    this.isConfigured = false;
    this.isChannelReady = false;
    this.init();
  }

  init = () => {
    this.configure();

    if (Platform.OS === 'android') {
      // For Android, check permissions and setup channel
      setTimeout(() => {
        this.setupAndroidNotifications();
      }, 5000);
    } else {
      this.createDefaultChannel();
    }
  };

  setupAndroidNotifications = async () => {
    await this.requestPermissions();
    await this.ensureNotificationChannel();
  };

  requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        // Check Android version - POST_NOTIFICATIONS is only needed for Android 13+
        const androidVersion = Platform.Version;
        if (androidVersion >= 33) {
          // Android 13 (API 33)
          const hasPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );

          console.log('Android version:', androidVersion);
          console.log('Already has notification permission:', hasPermission);

          if (!hasPermission) {
            console.log('Requesting notification permission...');
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
              {
                title: 'Notification Permission',
                message:
                  'This app needs notification permissions to show download status and alerts.',
                buttonPositive: 'Allow',
                buttonNegative: 'Deny',
              },
            );

            console.log('Notification permission result:', granted);
            return granted === PermissionsAndroid.RESULTS.GRANTED;
          } else {
            console.log('Notification permission already granted');
            return true;
          }
        } else {
          console.log('Android version < 13, no special permission needed');
          return true;
        }
      } catch (err) {
        console.warn('Error requesting notification permission:', err);
        return false;
      }
    }
    return true;
  };

  ensureNotificationChannel = () => {
    return new Promise(resolve => {
      if (Platform.OS !== 'android') {
        this.isChannelReady = true;
        resolve(true);
        return;
      }

      // First, check if channel already exists
      PushNotification.getChannels(channels => {
        console.log('Available notification channels:', channels);

        const channelExists = channels.includes('receipt-download-channel');

        if (channelExists) {
          console.log('✅ Notification channel already exists');
          this.isChannelReady = true;
          resolve(true);
        } else {
          console.log('🔄 Creating new notification channel...');
          this.createDefaultChannel(resolve);
        }
      });
    });
  };

  createDefaultChannel = callback => {
    if (Platform.OS !== 'android') return;

    PushNotification.createChannel(
      {
        channelId: 'receipt-download-channel',
        channelName: 'Receipt Downloads',
        channelDescription:
          'Notifications for downloaded receipts and upload status',
        playSound: true,
        soundName: 'default',
        importance: 4, // IMPORTANCE_HIGH
        vibrate: true,
        vibration: 300,
      },
      created => {
        console.log(`Notification channel creation result: '${created}'`);

        if (created) {
          console.log('✅ Notification channel created successfully');
          this.isChannelReady = true;
        } else {
          console.log('ℹ️ Channel may already exist or creation failed');
          // Even if create returns false, the channel might exist
          // Let's verify by checking channels again
          PushNotification.getChannels(channels => {
            const exists = channels.includes('receipt-download-channel');
            this.isChannelReady = exists;
            console.log('Channel verification:', exists ? 'EXISTS' : 'MISSING');
          });
        }

        if (callback) callback(created);
      },
    );
  };

  configure = () => {
    if (this.isConfigured) return;

    PushNotification.configure({
      onRegister: function (token) {
        console.log('PUSH NOTIFICATION TOKEN:', token);
      },

      onNotification: function (notification) {
        console.log('NOTIFICATION RECEIVED:', {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          userInteraction: notification.userInteraction,
          foreground: notification.foreground,
          data: notification.data,
        });

        // Handle notification tap
        if (notification.userInteraction) {
          console.log('Notification tapped by user');
          if (notification.data && notification.data.filePath) {
            this.openFile(notification.data.filePath);
          }
        }

        if (notification.finish && typeof notification.finish === 'function') {
          try {
            notification.finish(PushNotification.FetchResult.NoData);
          } catch (err) {
            console.log('Error in notification.finish:', err);
          }
        }
      }.bind(this),

      requestPermissions: Platform.OS === 'ios',
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      notificationForeground: true,

      onRegistrationError: function (err) {
        console.error('PUSH NOTIFICATION REGISTRATION ERROR:', err);
      },

      onAction: function (notification) {
        console.log('NOTIFICATION ACTION:', notification.action);
        if (notification.action === 'View' && notification.data?.filePath) {
          this.openFile(notification.data.filePath);
        }
      }.bind(this),
    });

    this.isConfigured = true;
    console.log('Push notification configured');
  };

  // Comprehensive MIME type mapping
  getMimeType = extension => {
    const mimeTypes = {
      // Documents
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain',
      rtf: 'application/rtf',
      csv: 'text/csv',
      odt: 'application/vnd.oasis.opendocument.text',
      ods: 'application/vnd.oasis.opendocument.spreadsheet',
      odp: 'application/vnd.oasis.opendocument.presentation',
      // Images
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      bmp: 'image/bmp',
      tiff: 'image/tiff',
      tif: 'image/tiff',
      svg: 'image/svg+xml',
      heic: 'image/heic',
      heif: 'image/heif',
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  };

  openFile = async filePath => {
    try {
      console.log('Attempting to open file:', filePath);

      // First, verify the file exists
      const fileExists = await RNFS.exists(filePath);

      if (!fileExists) {
        Alert.alert(
          'File Not Found',
          'The downloaded file could not be found. It may have been moved or deleted.',
          [{text: 'OK'}],
        );
        return;
      }

      // Get file info
      const fileInfo = await RNFS.stat(filePath);
      console.log('File info:', fileInfo);

      // Determine MIME type
      const extension = filePath.split('.').pop().toLowerCase();
      const mimeType = this.getMimeType(extension);

      console.log('Opening file with MIME type:', mimeType);

      // Try to open with FileViewer first (opens in default app)
      try {
        await FileViewer.open(filePath, {
          showOpenWithDialog: true, // Show "Open with" dialog on Android
          showAppsSuggestions: true, // Show app suggestions
          displayName: filePath.split('/').pop(), // Display filename
        });
      } catch (fileViewerError) {
        console.log(
          'FileViewer failed, trying Share fallback:',
          fileViewerError,
        );

        // Fallback to Share if FileViewer fails
        const shareOptions = {
          title: 'Open File',
          url: Platform.OS === 'android' ? `file://${filePath}` : filePath,
          type: mimeType,
          failOnCancel: false,
          showAppsToView: true,
        };

        await Share.open(shareOptions);
      }
    } catch (error) {
      console.error('Error opening file:', error);

      // Don't show alert if user just cancelled
      if (
        error.message &&
        (error.message.includes('User did not share') ||
          error.message.includes('cancelled'))
      ) {
        console.log('User cancelled file open dialog');
        return;
      }

      // Show error for actual failures
      Alert.alert(
        'Unable to Open File',
        `Could not open the file. Please install an appropriate app to view this file type.\n\nError: ${error.message}`,
        [
          {text: 'OK'},
          {
            text: 'Open Downloads Folder',
            onPress: () => this.openDownloadsFolder(),
          },
        ],
      );
    }
  };

  openDownloadsFolder = async () => {
    try {
      const downloadsPath = RNFS.DownloadDirectoryPath;
      const shareOptions = {
        url: `file://${downloadsPath}`,
        failOnCancel: false,
      };
      await Share.open(shareOptions);
    } catch (error) {
      console.error('Error opening Downloads folder:', error);
      Alert.alert(
        'Cannot Open Downloads',
        'Please open your file manager and navigate to the Downloads folder manually.',
        [{text: 'OK'}],
      );
    }
  };

  showReceiptDownloadNotification = (fileName, filePath) => {
    // console.log('🎯 Showing notification for:', fileName);
    // console.log('📁 File path:', filePath);
    // console.log('🔔 Channel ready:', this.isChannelReady);

    if (!this.isChannelReady) {
      // console.warn('Channel not ready, attempting to ensure channel exists...');
      this.ensureNotificationChannel().then(() => {
        // Retry after ensuring channel exists
        setTimeout(() => {
          this.showReceiptDownloadNotification(fileName, filePath);
        }, 500);
      });
      return;
    }

    try {
      PushNotification.localNotification({
        channelId: 'receipt-download-channel',
        title: 'Receipt Downloaded',
        message: `${fileName} saved successfully`,
        playSound: true,
        soundName: 'default',
        importance: 4,
        vibrate: true,
        vibration: 300,
        priority: 'high',
        autoCancel: true,
        largeIcon: '',
        smallIcon: 'ic_launcher_foreground',
        bigText: `${fileName} has been downloaded to your device.`,
        subText: 'Download Complete',
        color: '#F4B400',
        userInfo: {
          filePath: filePath,
          fileName: fileName,
        },
        data: {
          filePath: filePath,
          fileName: fileName,
        },
      });

      console.log('✅ Notification scheduled successfully');
    } catch (error) {
      console.error('❌ Error showing notification:', error);

      // Fallback: Show alert if notification fails
      Alert.alert(
        'Download Complete',
        `${fileName} has been downloaded successfully`,
      );
    }
  };

  showReceiptUploadNotification = count => {
    if (!this.isChannelReady) {
      console.warn('Channel not ready for upload notification');
      return;
    }

    PushNotification.localNotification({
      channelId: 'receipt-download-channel',
      title: 'Receipts Uploaded',
      message: `${count} receipt${count > 1 ? 's' : ''} uploaded successfully`,
      playSound: true,
      soundName: 'default',
      importance: 4,
      vibrate: true,
      vibration: 300,
      priority: 'high',
      autoCancel: true,
      largeIcon: '',
      smallIcon: 'ic_launcher_foreground',
      color: '#F4B400',
    });
  };

  showErrorNotification = errorMessage => {
    if (!this.isChannelReady) {
      console.warn('Channel not ready for error notification');
      Alert.alert('Download Failed', errorMessage);
      return;
    }

    PushNotification.localNotification({
      channelId: 'receipt-download-channel',
      title: 'Download Failed',
      message: errorMessage,
      playSound: true,
      soundName: 'default',
      importance: 4,
      vibrate: true,
      vibration: 300,
      priority: 'high',
      autoCancel: true,
      largeIcon: '',
      smallIcon: 'ic_launcher_foreground',
      color: '#F4B400',
    });
  };

  cancelAllNotifications = () => {
    PushNotification.cancelAllLocalNotifications();
  };
}

export default new NotificationService();
