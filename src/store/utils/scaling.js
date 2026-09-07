// /* eslint-disable no-unused-vars */
/* eslint-disable curly */
// store/utils/scaling.js
// IMPROVED PRODUCTION-READY RESPONSIVE SCALING FOR ANDROID
import {Dimensions, Platform, PixelRatio} from 'react-native';

// Get current screen dimensions
const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// Design baseline - Pixel 7 (most common Android size in 2024)
const GUIDELINE_WIDTH = 393;
const GUIDELINE_HEIGHT = 851;

// Calculate aspect ratio
const ASPECT_RATIO = SCREEN_HEIGHT / SCREEN_WIDTH;

// Device categorization
const EXTRA_SMALL_WIDTH = 360;
const SMALL_SCREEN_WIDTH = 375;
const MEDIUM_SCREEN_WIDTH = 393;
const LARGE_SCREEN_WIDTH = 412;
const EXTRA_LARGE_WIDTH = 428;
const TABLET_WIDTH = 600;

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
 */
export const scale = size => {
  const scaleFactor = SCREEN_WIDTH / GUIDELINE_WIDTH;
  const MIN_SCALE = 0.8;
  const MAX_SCALE = 1.15; // REDUCED from 1.35 — prevents oversizing on large phones

  const clampedFactor = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scaleFactor));
  const finalFactor = isMediumScreen ? clampedFactor * 0.95 : clampedFactor;
  return Math.round(size * finalFactor);
};

/**
 * Vertical scale with aspect ratio awareness
 */
export const verticalScale = size => {
  const scaleFactor = SCREEN_HEIGHT / GUIDELINE_HEIGHT;
  const aspectRatioCorrection = ASPECT_RATIO > 2.2 ? 0.92 : 1.0;

  const MIN_SCALE = 0.8;
  const MAX_SCALE = 1.15; // REDUCED from 1.35

  const clampedFactor = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scaleFactor));
  const finalFactor = isMediumScreen ? clampedFactor * 0.95 : clampedFactor;
  return Math.round(size * finalFactor * aspectRatioCorrection);
};

/**
 * Moderate scale - less aggressive scaling for fonts and icons
 */
export const moderateScale = (size, factor = 0.4) => {
  const scaledSize = scale(size);
  return Math.round(size + (scaledSize - size) * factor);
};

/**
 * Font scaling — RAW size only, no device-relative multiplier.
 * conditionalFontScale already picks the right size per device,
 * so fontScale must NOT re-scale on top of that.
 */
export const fontScale = size => {
  // Just round to nearest pixel — no multiplier.
  // The device-appropriate size is already chosen by conditionalFontScale.
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(size));
  }
  return Math.round(PixelRatio.roundToNearestPixel(size));
};

// ============================================
// CONDITIONAL SCALING (FIXED — no double-scaling)
// ============================================

/**
 * Conditional scale — picks raw size per breakpoint, then scales once.
 */
export const conditionalScale = (
  xSmallSize,
  smallSize,
  mediumSize,
  largeSize,
  xLargeSize = null,
  tabletSize = null,
) => {
  if (isTablet) return scale(tabletSize || xLargeSize || largeSize * 1.15);
  if (isExtraLargeScreen) return scale(xLargeSize || largeSize * 1.05);
  if (isLargeScreen) return scale(largeSize);
  if (isMediumScreen) return scale(mediumSize);
  if (isSmallScreen) return scale(smallSize);
  return scale(xSmallSize);
};

/**
 * Conditional vertical scale
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
    return verticalScale(tabletSize || xLargeSize || largeSize * 1.15);
  if (isExtraLargeScreen) return verticalScale(xLargeSize || largeSize * 1.05);
  if (isLargeScreen) return verticalScale(largeSize);
  if (isMediumScreen) return verticalScale(mediumSize);
  if (isSmallScreen) return verticalScale(smallSize);
  return verticalScale(xSmallSize);
};

/**
 * Conditional font scale — FIXED.
 * Picks the right size for the device, then calls fontScale() which is now
 * just a pixel-rounding passthrough (no multiplier applied twice).
 *
 * Also caps the final font size so it never exceeds the medium value by more
 * than 15% — prevents ballooning on large phones.
 */
export const conditionalFontScale = (
  xSmallSize,
  smallSize,
  mediumSize,
  largeSize,
  xLargeSize = null,
  tabletSize = null,
) => {
  let selectedSize;

  if (isTablet) {
    selectedSize = tabletSize || xLargeSize || largeSize * 1.15;
  } else if (isExtraLargeScreen) {
    selectedSize = xLargeSize || largeSize * 1.05;
  } else if (isLargeScreen) {
    // KEY FIX: cap large-phone font size to at most mediumSize + 15%
    const rawLarge = largeSize;
    const cap = mediumSize * 1.15;
    selectedSize = Math.min(rawLarge, cap);
  } else if (isMediumScreen) {
    selectedSize = mediumSize;
  } else if (isSmallScreen) {
    selectedSize = smallSize;
  } else {
    selectedSize = xSmallSize;
  }

  return fontScale(selectedSize);
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
  if (isTablet) return tabletValue || xLargeValue || largeValue * 1.15;
  if (isExtraLargeScreen) return xLargeValue || largeValue * 1.05;
  if (isLargeScreen) return largeValue;
  if (isMediumScreen) return mediumValue;
  if (isSmallScreen) return smallValue;
  return xSmallValue;
};

// ============================================
// RESPONSIVE DESIGN TOKENS
// ============================================

export const spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
  xl: scale(20),
  xxl: scale(24),
  xxxl: scale(32),
};

export const borderRadius = {
  xs: moderateScale(2),
  sm: moderateScale(4),
  md: moderateScale(8),
  lg: moderateScale(12),
  xl: moderateScale(16),
  xxl: moderateScale(24),
  round: moderateScale(999),
};

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

export const wp = percentage => {
  return Math.round((SCREEN_WIDTH * percentage) / 100);
};

export const hp = percentage => {
  return Math.round((SCREEN_HEIGHT * percentage) / 100);
};

export const gridItemWidth = (columns, gutter = spacing.md) => {
  const totalGutter = gutter * (columns + 1);
  const availableWidth = SCREEN_WIDTH - totalGutter;
  return Math.floor(availableWidth / columns);
};

export const hairlineWidth = 1 / PixelRatio.get();

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

// at the very bottom of store/utils/scaling.js
console.log('[scaling.js] exports:', module.exports);
// or if it's ES modules with babel interop:
console.log(
  '[scaling.js] loaded, conditionalScale is:',
  typeof conditionalScale,
);
