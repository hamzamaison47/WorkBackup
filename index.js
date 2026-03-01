/* eslint-disable no-undef */
/**
 * @format
 */
// Runtime shims to avoid crashes when Expo native modules are referenced
// (some packages may expect `globalThis.expo.NativeModule` or `process.env.EXPO_OS`).
if (typeof globalThis !== 'undefined') {
  try {
    globalThis.expo = globalThis.expo || {};
    if (!globalThis.expo.NativeModule) {
      // provide a safe no-op object to avoid runtime crashes
      globalThis.expo.NativeModule = {};
    }
  } catch (e) {}
}

if (typeof process !== 'undefined') {
  process.env = process.env || {};
  process.env.EXPO_OS = process.env.EXPO_OS || 'android';
}

import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import './src/utils/nativeEventEmitterPatch';
import App from './App';
import {name as appName} from './app.json';
import {
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';

/**
 * Background / killed-state message handler.
 *
 * IMPORTANT — This ONLY fires for DATA-ONLY FCM messages (no "notification" key in payload).
 * For notification-payload messages, when the app is killed or backgrounded, Android
 * displays them in the system tray automatically via MyFirebaseMessagingService.
 * Do NOT add complex logic here — this runs in a headless JS context.
 */
setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
  // Background data-only messages are already displayed by MyFirebaseMessagingService
  // natively. Nothing to do here unless you need extra processing (e.g. store to Redux persist).
  console.log('📩 BG data-only message received in JS:', remoteMessage?.data);
});

AppRegistry.registerComponent(appName, () => App);
