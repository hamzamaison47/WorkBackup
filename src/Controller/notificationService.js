import PushNotification from 'react-native-push-notification';
import {Platform, Alert} from 'react-native';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';

class NotificationService {
  constructor() {
    this.configure();
    this.createDefaultChannel();
  }

  configure = () => {
    PushNotification.configure({
      onRegister: function (token) {
        console.log('TOKEN:', token);
      },

      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);

        // Handle notification tap
        if (notification.userInteraction) {
          // User tapped on the notification
          if (notification.data && notification.data.filePath) {
            this.openFile(notification.data.filePath);
          }
        }
      }.bind(this),

      onAction: function (notification) {
        console.log('ACTION:', notification.action);
        console.log('NOTIFICATION:', notification);

        // Handle action button tap
        if (
          notification.action === 'View' &&
          notification.data &&
          notification.data.filePath
        ) {
          this.openFile(notification.data.filePath);
        }
      }.bind(this),

      onRegistrationError: function (err) {
        console.error(err.message, err);
      },

      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });
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

      // Get file stats to determine MIME type
      const fileInfo = await RNFS.stat(filePath);
      console.log('File info:', fileInfo);

      // Determine MIME type based on file extension
      const extension = filePath.split('.').pop().toLowerCase();
      const mimeType = this.getMimeType(extension);

      console.log('Opening file with MIME type:', mimeType);

      // Use react-native-share to open the file
      const shareOptions = {
        title: 'Open Receipt',
        message: 'View your downloaded receipt',
        url: Platform.OS === 'android' ? `file://${filePath}` : filePath,
        type: mimeType,
        failOnCancel: false,
        showAppsToView: true,
      };

      await Share.open(shareOptions);
    } catch (error) {
      console.error('Error opening file:', error);

      // Don't show alert if user just cancelled
      if (error.message && error.message.includes('User did not share')) {
        console.log('User cancelled file open dialog');
        return;
      }

      // Show error for actual failures
      Alert.alert(
        'Unable to Open File',
        `Could not open the file. Please use your file manager to view it in the Downloads folder.\n\nError: ${error.message}`,
        [
          {text: 'OK'},
          {
            text: 'Open Downloads',
            onPress: () => this.openDownloadsFolder(),
          },
        ],
      );
    }
  };

  openDownloadsFolder = async () => {
    try {
      // Open the Downloads folder
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

  createDefaultChannel = () => {
    PushNotification.createChannel(
      {
        channelId: 'receipt-download-channel',
        channelName: 'Receipt Downloads',
        channelDescription: 'Notifications for receipt downloads',
        playSound: true,
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      created => console.log(`createChannel returned '${created}'`),
    );
  };

  showReceiptDownloadNotification = (fileName, filePath) => {
    console.log('Showing notification for file:', filePath);

    PushNotification.localNotification({
      channelId: 'receipt-download-channel',
      title: 'Receipt Downloaded',
      message: `${fileName} has been saved to your device`,
      playSound: true,
      soundName: 'default',
      importance: 'high',
      vibrate: true,
      vibration: 300,
      priority: 'high',
      autoCancel: true,
      largeIcon: '',
      smallIcon: 'ic_launcher_foreground',
      bigText: `${fileName} has been saved to your Downloads folder`,
      subText: 'Tap to view',
      color: '#0A66C2',
      data: {
        filePath: filePath,
        fileName: fileName,
      },
    });
  };

  showReceiptUploadNotification = count => {
    PushNotification.localNotification({
      channelId: 'receipt-download-channel',
      title: 'Receipts Uploaded',
      message: `${count} receipt${count > 1 ? 's' : ''} uploaded successfully`,
      playSound: true,
      soundName: 'default',
      importance: 'high',
      vibrate: true,
      vibration: 300,
      priority: 'high',
      autoCancel: true,
      largeIcon: '',
      smallIcon: 'ic_launcher_foreground',
      color: '#0A66C2',
    });
  };

  showErrorNotification = errorMessage => {
    PushNotification.localNotification({
      channelId: 'receipt-download-channel',
      title: 'Download Failed',
      message: errorMessage,
      playSound: true,
      soundName: 'default',
      importance: 'high',
      vibrate: true,
      vibration: 300,
      priority: 'high',
      autoCancel: true,
      largeIcon: '',
      smallIcon: 'ic_launcher_foreground',
      color: '#ef4444',
    });
  };

  cancelAllNotifications = () => {
    PushNotification.cancelAllLocalNotifications();
  };
}

export default new NotificationService();
