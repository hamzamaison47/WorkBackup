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

AppRegistry.registerComponent(appName, () => App);
