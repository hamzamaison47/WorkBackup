// /* eslint-disable curly */
// // store/utils/scaling.js
// import {Dimensions, Platform, PixelRatio} from 'react-native';

// const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// // Guideline sizes based on standard ~5" screen mobile device
// const GUIDELINE_WIDTH = 375;
// const GUIDELINE_HEIGHT = 812;

// // Base scaling functions
// export const scale = size => (SCREEN_WIDTH / GUIDELINE_WIDTH) * size;
// export const verticalScale = size => (SCREEN_HEIGHT / GUIDELINE_HEIGHT) * size;
// export const moderateScale = (size, factor = 0.5) =>
//   size + (scale(size) - size) * factor;

// // Font scaling with platform-specific adjustments
// export const fontScale = size => {
//   const scaleFactor = SCREEN_WIDTH / GUIDELINE_WIDTH;
//   const newSize = size * scaleFactor;

//   if (Platform.OS === 'ios') {
//     return Math.round(PixelRatio.roundToNearestPixel(newSize));
//   }
//   return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
// };

// // Screen size detection helpers
// export const isSmallScreen = SCREEN_WIDTH < 375;
// export const isLargeScreen = SCREEN_WIDTH > 414;
// export const isTablet = SCREEN_WIDTH >= 768;

// // Get device info
// export const getDeviceType = () => {
//   if (isTablet) return 'tablet';
//   if (isLargeScreen) return 'large';
//   if (isSmallScreen) return 'small';
//   return 'medium';
// };

// // Dimension helpers
// export const screenWidth = SCREEN_WIDTH;
// export const screenHeight = SCREEN_HEIGHT;

// // Conditional scaling based on screen size
// export const conditionalScale = (smallSize, mediumSize, largeSize) => {
//   if (isSmallScreen) return scale(smallSize);
//   if (isLargeScreen || isTablet) return scale(largeSize);
//   return scale(mediumSize);
// };

// export const conditionalValue = (smallValue, mediumValue, largeValue) => {
//   if (isSmallScreen) return smallValue;
//   if (isLargeScreen || isTablet) return largeValue;
//   return mediumValue;
// };

// New Scaling Styling
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// store/utils/scaling.js
/* eslint-disable curly */
import {Dimensions, Platform, PixelRatio} from 'react-native';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// Guideline sizes based on standard ~5" screen mobile device
const GUIDELINE_WIDTH = 375;
const GUIDELINE_HEIGHT = 812;

// Device breakpoints
const SMALL_SCREEN_WIDTH = 375;
const LARGE_SCREEN_WIDTH = 414;
const TABLET_WIDTH = 768;

// Screen size detection helpers
export const isSmallScreen = SCREEN_WIDTH < SMALL_SCREEN_WIDTH;
export const isLargeScreen =
  SCREEN_WIDTH >= LARGE_SCREEN_WIDTH && SCREEN_WIDTH < TABLET_WIDTH;
export const isTablet = SCREEN_WIDTH >= TABLET_WIDTH;

// Get device info
export const getDeviceType = () => {
  if (isTablet) return 'tablet';
  if (isLargeScreen) return 'large';
  if (isSmallScreen) return 'small';
  return 'medium';
};

// Dimension helpers
export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;

// Base scaling functions with clamping for tablets
export const scale = (size, maxScale = 1.5) => {
  const scaleFactor = SCREEN_WIDTH / GUIDELINE_WIDTH;

  // For tablets, limit the scale to prevent oversized elements
  if (isTablet) {
    const clampedScale = Math.min(scaleFactor, maxScale);
    return size * clampedScale;
  }

  return size * scaleFactor;
};

export const verticalScale = (size, maxScale = 1.5) => {
  const scaleFactor = SCREEN_HEIGHT / GUIDELINE_HEIGHT;

  // For tablets, limit the scale to prevent oversized elements
  if (isTablet) {
    const clampedScale = Math.min(scaleFactor, maxScale);
    return size * clampedScale;
  }

  return size * scaleFactor;
};

export const moderateScale = (size, factor = 0.5, maxScale = 1.5) => {
  const scaled = scale(size, maxScale);
  return size + (scaled - size) * factor;
};

// Font scaling with platform-specific adjustments and proper clamping
export const fontScale = (size, minScale = 0.85, maxScale = 1.3) => {
  const rawScaleFactor = SCREEN_WIDTH / GUIDELINE_WIDTH;

  // Clamp the scale factor to prevent too small or too large fonts
  const scaleFactor = Math.max(minScale, Math.min(maxScale, rawScaleFactor));
  const newSize = size * scaleFactor;

  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
};

// Conditional scaling based on screen size - use this for better control
export const conditionalScale = (
  smallSize,
  mediumSize,
  largeSize,
  tabletSize = null,
) => {
  if (isTablet) return scale(tabletSize || largeSize * 1.2);
  if (isSmallScreen) return scale(smallSize);
  if (isLargeScreen) return scale(largeSize);
  return scale(mediumSize);
};

export const conditionalValue = (
  smallValue,
  mediumValue,
  largeValue,
  tabletValue = null,
) => {
  if (isTablet) return tabletValue || largeValue * 1.2;
  if (isSmallScreen) return smallValue;
  if (isLargeScreen) return largeValue;
  return mediumValue;
};

// Vertical conditional scaling
export const conditionalVerticalScale = (
  smallSize,
  mediumSize,
  largeSize,
  tabletSize = null,
) => {
  if (isTablet) return verticalScale(tabletSize || largeSize * 1.2);
  if (isSmallScreen) return verticalScale(smallSize);
  if (isLargeScreen) return verticalScale(largeSize);
  return verticalScale(mediumSize);
};

// Font conditional scaling with better tablet support
export const conditionalFontScale = (
  smallSize,
  mediumSize,
  largeSize,
  tabletSize = null,
) => {
  if (isTablet) return fontScale(tabletSize || largeSize * 1.1);
  if (isSmallScreen) return fontScale(smallSize);
  if (isLargeScreen) return fontScale(largeSize);
  return fontScale(mediumSize);
};

// Spacing helpers - commonly used values
export const spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(16),
  lg: scale(24),
  xl: scale(32),
  xxl: scale(48),
};

// Border radius helpers
export const borderRadius = {
  sm: moderateScale(4),
  md: moderateScale(8),
  lg: moderateScale(16),
  xl: moderateScale(24),
  round: moderateScale(50),
};

// Icon size helpers
export const iconSize = {
  xs: conditionalFontScale(16, 18, 20, 24),
  sm: conditionalFontScale(20, 22, 24, 28),
  md: conditionalFontScale(24, 26, 28, 32),
  lg: conditionalFontScale(32, 34, 36, 42),
  xl: conditionalFontScale(40, 44, 48, 56),
};
