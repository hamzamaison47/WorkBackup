// const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

// const defaultConfig = getDefaultConfig(__dirname);

// const config = {
//   resolver: {
//     extraNodeModules: {
//       crypto: require.resolve('crypto-browserify'),
//       stream: require.resolve('stream-browserify'),
//     },
//   },
// };

// module.exports = mergeConfig(defaultConfig, config);

const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  // Increase the file watching limit
  watchFolders: [],
  resolver: {
    // Ignore problematic folders
    blockList: [
      /.*\/android\/\.cxx\/.*/,
      /.*\/node_modules\/.*\/\.cxx\/.*/,
      /.*\/android\/build\/.*/,
      /.*\/ios\/build\/.*/,
    ],
    // Alternative platforms
    unstable_enablePackageExports: true,
    // Source Extensions
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json', 'cjs', 'mjs'],
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  // Max workers (adjust based on your system)
  maxWorkers: 2,
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
