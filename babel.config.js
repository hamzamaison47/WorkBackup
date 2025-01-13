module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
    [
      'module:react-native-dotenv',
      {
        envName: 'APP_ENV',
        moduleName: '@env',
        path: '.env',
        blocklist: null,
        allowlist: null,
        blacklist: null, // DEPRECATED
        whitelist: null, // DEPRECATED
        safe: false,
        allowUndefined: true,
        verbose: false,
      },
    ],
    [
      '@babel/plugin-transform-class-properties',
      {
        loose: true, // Ensure consistency across plugins
      },
    ],
    [
      '@babel/plugin-transform-private-methods',
      {
        loose: true, // Ensure consistency across plugins
      },
    ],
    [
      '@babel/plugin-transform-private-property-in-object',
      {
        loose: true, // Ensure consistency across plugins
      },
    ],
  ],
};
