/* eslint-disable curly */
// store/utils/scaling.js
import {Dimensions, Platform, PixelRatio} from 'react-native';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// Guideline sizes based on standard ~5" screen mobile device
const GUIDELINE_WIDTH = 375;
const GUIDELINE_HEIGHT = 812;

// Base scaling functions
export const scale = size => (SCREEN_WIDTH / GUIDELINE_WIDTH) * size;
export const verticalScale = size => (SCREEN_HEIGHT / GUIDELINE_HEIGHT) * size;
export const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

// Font scaling with platform-specific adjustments
export const fontScale = size => {
  const scaleFactor = SCREEN_WIDTH / GUIDELINE_WIDTH;
  const newSize = size * scaleFactor;

  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
};

// Screen size detection helpers
export const isSmallScreen = SCREEN_WIDTH < 375;
export const isLargeScreen = SCREEN_WIDTH > 414;
export const isTablet = SCREEN_WIDTH >= 768;

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

// Conditional scaling based on screen size
export const conditionalScale = (smallSize, mediumSize, largeSize) => {
  if (isSmallScreen) return scale(smallSize);
  if (isLargeScreen || isTablet) return scale(largeSize);
  return scale(mediumSize);
};

export const conditionalValue = (smallValue, mediumValue, largeValue) => {
  if (isSmallScreen) return smallValue;
  if (isLargeScreen || isTablet) return largeValue;
  return mediumValue;
};
