module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    '@react-native-community/netinfo':
      '<rootDir>/node_modules/@react-native-community/netinfo/jest/netinfo-mock.js',
    'react-native-fs': '<rootDir>/node_modules/react-native-fs/FS.common.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-redux|@reduxjs/toolkit|immer|@react-navigation|react-native-restart|react-native-reanimated|react-native-screens|react-native-gesture-handler|react-native-safe-area-context|react-native-vector-icons|react-i18next|i18next|react-native-paper|react-native-svg|react-native-device-info|redux-persist|react-native-maps|react-native-permissions|react-native-image-picker|react-native-document-picker|react-native-keychain|react-native-biometrics|react-native-vision-camera|react-native-vision-camera-face-detector|react-native-worklets-core|react-native-encrypted-storage|react-native-firebase|@react-native-firebase|@react-native-google-signin|@react-native-async-storage|@react-native-community|react-native-linear-gradient|react-native-modal|react-native-date-picker|react-native-calendars|react-native-tab-view|react-native-share|react-native-fs|react-native-config|react-native-splash-screen|react-native-push-notification|react-native-tts|react-native-render-html|react-native-dropdown-picker|react-native-element-dropdown|react-native-shimmer-placeholder|react-native-app-auth|jail-monkey|jwt-decode|date-fns|dayjs|axios|openai|node-fetch|@react-native-community/netinfo)/)',
  ],
};
