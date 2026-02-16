/* eslint-disable no-unused-vars */
/* eslint-disable curly */
// store/utils/scaling.js
// IMPROVED PRODUCTION-READY RESPONSIVE SCALING FOR ANDROID
import {Dimensions, Platform, PixelRatio} from 'react-native';

// Get current screen dimensions
const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// Design baseline - Pixel 7 (most common Android size in 2024)
const GUIDELINE_WIDTH = 393; // Changed from 375 to better match modern Android
const GUIDELINE_HEIGHT = 851; // Changed from 812

// Calculate aspect ratio
const ASPECT_RATIO = SCREEN_HEIGHT / SCREEN_WIDTH;

// Device categorization with more granular breakpoints
const EXTRA_SMALL_WIDTH = 360; // Small budget phones
const SMALL_SCREEN_WIDTH = 375; // iPhone SE, small Android
const MEDIUM_SCREEN_WIDTH = 393; // Pixel 7, most modern phones
const LARGE_SCREEN_WIDTH = 412; // Galaxy S23, Pixel 7 Pro
const EXTRA_LARGE_WIDTH = 428; // iPhone Pro Max size
const TABLET_WIDTH = 600; // 7" tablets and up

// Screen size detection
export const isExtraSmallScreen = SCREEN_WIDTH < EXTRA_SMALL_WIDTH;
export const isSmallScreen =
  SCREEN_WIDTH >= EXTRA_SMALL_WIDTH && SCREEN_WIDTH < SMALL_SCREEN_WIDTH;
export const isMediumScreen =
  SCREEN_WIDTH >= SMALL_SCREEN_WIDTH && SCREEN_WIDTH < LARGE_SCREEN_WIDTH;
export const isLargeScreen =
  SCREEN_WIDTH >= LARGE_SCREEN_WIDTH && SCREEN_WIDTH < EXTRA_LARGE_WIDTH;
export const isExtraLargeScreen =
  SCREEN_WIDTH >= EXTRA_LARGE_WIDTH && SCREEN_WIDTH < TABLET_WIDTH;
export const isTablet = SCREEN_WIDTH >= TABLET_WIDTH;

// Get device category
export const getDeviceType = () => {
  if (isTablet) return 'tablet';
  if (isExtraLargeScreen) return 'xlarge';
  if (isLargeScreen) return 'large';
  if (isMediumScreen) return 'medium';
  if (isSmallScreen) return 'small';
  return 'xsmall';
};

// Dimension helpers
export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;
export const aspectRatio = ASPECT_RATIO;

// ============================================
// IMPROVED SCALING FUNCTIONS
// ============================================

/**
 * Horizontal scale with improved clamping
 * Prevents extreme scaling on very small or very large devices
 */
export const scale = size => {
  const scaleFactor = SCREEN_WIDTH / GUIDELINE_WIDTH;

  // More conservative clamping
  const MIN_SCALE = 0.8; // Allows 80% of original size
  const MAX_SCALE = 1.35; // Allows 135% of original size

  const clampedFactor = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scaleFactor));
  const finalFactor = isMediumScreen ? clampedFactor * 0.95 : clampedFactor;
  return Math.round(size * finalFactor);
};

/**
 * Vertical scale with aspect ratio awareness
 * Prevents excessive vertical spacing on tall phones
 */
export const verticalScale = size => {
  const scaleFactor = SCREEN_HEIGHT / GUIDELINE_HEIGHT;

  // Apply aspect ratio correction for ultra-tall screens (21:9, 20:9, etc.)
  const aspectRatioCorrection = ASPECT_RATIO > 2.2 ? 0.92 : 1.0;

  const MIN_SCALE = 0.8;
  const MAX_SCALE = 1.35;

  const clampedFactor = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scaleFactor));
  const finalFactor = isMediumScreen ? clampedFactor * 0.95 : clampedFactor;
  return Math.round(size * finalFactor * aspectRatioCorrection);
};

/**
 * Moderate scale - less aggressive scaling for fonts and icons
 * factor: 0 = no scaling, 0.5 = moderate, 1 = full scaling
 */
export const moderateScale = (size, factor = 0.4) => {
  const scaledSize = scale(size);
  return Math.round(size + (scaledSize - size) * factor);
};

/**
 * Font scaling with platform-specific adjustments
 * More conservative min/max to prevent readability issues
 */
export const fontScale = size => {
  const rawScaleFactor = SCREEN_WIDTH / GUIDELINE_WIDTH;

  // Tighter clamping for fonts to ensure readability
  const MIN_SCALE = 0.85;
  const MAX_SCALE = 1.25;

  const scaleFactor = Math.max(MIN_SCALE, Math.min(MAX_SCALE, rawScaleFactor));
  const finalFactor = isMediumScreen ? scaleFactor * 0.95 : scaleFactor;
  const newSize = size * finalFactor;

  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  // Android optimization
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// ============================================
// CONDITIONAL SCALING (IMPROVED)
// ============================================

/**
 * Conditional scale with 6 size options for fine-grained control
 * Provides better support for wide range of devices
 */
export const conditionalScale = (
  xSmallSize, // < 360dp
  smallSize, // 360-374dp
  mediumSize, // 375-411dp
  largeSize, // 412-427dp
  xLargeSize = null, // 428-599dp
  tabletSize = null, // 600dp+
) => {
  if (isTablet) return scale(tabletSize || xLargeSize || largeSize * 1.3);
  if (isExtraLargeScreen) return scale(xLargeSize || largeSize * 1.15);
  if (isLargeScreen) return scale(largeSize);
  if (isMediumScreen) return scale(mediumSize);
  if (isSmallScreen) return scale(smallSize);
  return scale(xSmallSize);
};

/**
 * Conditional vertical scale with aspect ratio awareness
 */
export const conditionalVerticalScale = (
  xSmallSize,
  smallSize,
  mediumSize,
  largeSize,
  xLargeSize = null,
  tabletSize = null,
) => {
  if (isTablet)
    return verticalScale(tabletSize || xLargeSize || largeSize * 1.3);
  if (isExtraLargeScreen) return verticalScale(xLargeSize || largeSize * 1.15);
  if (isLargeScreen) return verticalScale(largeSize);
  if (isMediumScreen) return verticalScale(mediumSize);
  if (isSmallScreen) return verticalScale(smallSize);
  return verticalScale(xSmallSize);
};

/**
 * Conditional font scale with readability preservation
 */
export const conditionalFontScale = (
  xSmallSize,
  smallSize,
  mediumSize,
  largeSize,
  xLargeSize = null,
  tabletSize = null,
) => {
  if (isTablet) return fontScale(tabletSize || xLargeSize || largeSize * 1.2);
  if (isExtraLargeScreen) return fontScale(xLargeSize || largeSize * 1.1);
  if (isLargeScreen) return fontScale(largeSize);
  if (isMediumScreen) return fontScale(mediumSize);
  if (isSmallScreen) return fontScale(smallSize);
  return fontScale(xSmallSize);
};

/**
 * Conditional value without scaling (raw value selection)
 */
export const conditionalValue = (
  xSmallValue,
  smallValue,
  mediumValue,
  largeValue,
  xLargeValue = null,
  tabletValue = null,
) => {
  if (isTablet) return tabletValue || xLargeValue || largeValue * 1.3;
  if (isExtraLargeScreen) return xLargeValue || largeValue * 1.15;
  if (isLargeScreen) return largeValue;
  if (isMediumScreen) return mediumValue;
  if (isSmallScreen) return smallValue;
  return xSmallValue;
};

// ============================================
// RESPONSIVE DESIGN TOKENS
// ============================================

// Spacing system (4dp grid)
export const spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
  xl: scale(20),
  xxl: scale(24),
  xxxl: scale(32),
};

// Border radius
export const borderRadius = {
  xs: moderateScale(2),
  sm: moderateScale(4),
  md: moderateScale(8),
  lg: moderateScale(12),
  xl: moderateScale(16),
  xxl: moderateScale(24),
  round: moderateScale(999), // Fully rounded
};

// Icon sizes with font scaling
export const iconSize = {
  xxs: fontScale(12),
  xs: fontScale(16),
  sm: fontScale(20),
  md: fontScale(24),
  lg: fontScale(28),
  xl: fontScale(32),
  xxl: fontScale(40),
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get percentage of screen width
 */
export const wp = percentage => {
  return Math.round((SCREEN_WIDTH * percentage) / 100);
};

/**
 * Get percentage of screen height
 */
export const hp = percentage => {
  return Math.round((SCREEN_HEIGHT * percentage) / 100);
};

/**
 * Calculate grid item width for N columns with gutter
 */
export const gridItemWidth = (columns, gutter = spacing.md) => {
  const totalGutter = gutter * (columns + 1);
  const availableWidth = SCREEN_WIDTH - totalGutter;
  return Math.floor(availableWidth / columns);
};

/**
 * Hairline border (1 physical pixel)
 */
export const hairlineWidth = 1 / PixelRatio.get();

/**
 * Shadow elevation for Android
 */
export const elevation = level => {
  return {
    elevation: level,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: Math.floor(level / 2),
    },
    shadowOpacity: level * 0.05,
    shadowRadius: level * 0.8,
  };
};

// Export all for easy access
export default {
  scale,
  verticalScale,
  moderateScale,
  fontScale,
  conditionalScale,
  conditionalVerticalScale,
  conditionalFontScale,
  conditionalValue,
  spacing,
  borderRadius,
  iconSize,
  wp,
  hp,
  gridItemWidth,
  hairlineWidth,
  elevation,
  screenWidth,
  screenHeight,
  aspectRatio,
  isExtraSmallScreen,
  isSmallScreen,
  isMediumScreen,
  isLargeScreen,
  isExtraLargeScreen,
  isTablet,
  getDeviceType,
};
