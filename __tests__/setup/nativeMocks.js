// Native-module mocks so the real store, real teardown and real screen
// components can be executed in a JS runtime. Nothing here stubs application
// logic — only the native bridge.

jest.mock('react-native-fs', () => {
  const files = {};
  return {
    DocumentDirectoryPath: '/tmp/doc',
    writeFile: jest.fn(async (p, v) => {
      files[p] = v;
    }),
    readFile: jest.fn(async p => {
      if (files[p] === undefined) {
        throw new Error('ENOENT');
      }
      return files[p];
    }),
    unlink: jest.fn(async p => {
      delete files[p];
    }),
    __files: files,
  };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-encrypted-storage', () => ({
  setItem: jest.fn(async () => {}),
  getItem: jest.fn(async () => null),
  removeItem: jest.fn(async () => {}),
  clear: jest.fn(async () => {}),
}));

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(async () => true),
  getGenericPassword: jest.fn(async () => false),
  resetGenericPassword: jest.fn(async () => true),
  ACCESSIBLE: {AFTER_FIRST_UNLOCK: 'AfterFirstUnlock'},
}));

jest.mock('react-native-biometrics', () =>
  jest.fn().mockImplementation(() => ({
    isSensorAvailable: jest.fn(async () => ({available: false})),
    simplePrompt: jest.fn(async () => ({success: false})),
  })),
);

jest.mock('@react-native-firebase/messaging', () => ({
  getMessaging: jest.fn(() => ({})),
  getToken: jest.fn(async () => 'fcm-token'),
  onMessage: jest.fn(() => () => {}),
  onNotificationOpenedApp: jest.fn(() => () => {}),
  getInitialNotification: jest.fn(async () => null),
  onTokenRefresh: jest.fn(() => () => {}),
  requestPermission: jest.fn(async () => 1),
  hasPermission: jest.fn(async () => 1),
  AuthorizationStatus: {AUTHORIZED: 1, PROVISIONAL: 2},
  registerDeviceForRemoteMessages: jest.fn(async () => {}),
  isDeviceRegisteredForRemoteMessages: jest.fn(() => true),
}));

jest.mock('react-native-device-info', () => ({
  getUniqueId: jest.fn(async () => 'device-1'),
  getDeviceId: jest.fn(() => 'device-1'),
  getSystemName: jest.fn(() => 'Android'),
  getSystemVersion: jest.fn(() => '14'),
}));

jest.mock('react-native-app-auth', () => ({
  authorize: jest.fn(),
  refresh: jest.fn(),
}));

jest.mock('react-native-restart', () => ({Restart: jest.fn()}));
jest.mock('jail-monkey', () => ({isJailBroken: () => false}));
jest.mock('@react-native-community/geolocation', () => ({
  setRNConfiguration: jest.fn(),
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(() => 1),
  clearWatch: jest.fn(),
}));

require('react-native-gesture-handler/jestSetup');

jest.mock('react-native-reanimated', () => {
  try {
    return require('react-native-reanimated/mock');
  } catch {
    return {};
  }
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const inset = {top: 0, right: 0, bottom: 0, left: 0};
  return {
    SafeAreaProvider: ({children}) =>
      React.createElement(React.Fragment, null, children),
    SafeAreaView: ({children}) =>
      React.createElement(React.Fragment, null, children),
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({x: 0, y: 0, width: 390, height: 844}),
    initialWindowMetrics: {
      insets: inset,
      frame: {x: 0, y: 0, width: 390, height: 844},
    },
  };
});

jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-vector-icons/Feather', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-vector-icons/FontAwesome', () => 'Icon');
jest.mock('react-native-vector-icons/AntDesign', () => 'Icon');

// The native attendance foreground service. Patched onto the preset's
// NativeModules rather than jest.mock'd — requireActual on NativeModules trips
// react-native's "__fbBatchedBridgeConfig is not set" invariant.
const {NativeModules} = require('react-native');
NativeModules.AttendanceService = {
  startService: jest.fn(),
  stopService: jest.fn(),
  updateBreakState: jest.fn(),
};
