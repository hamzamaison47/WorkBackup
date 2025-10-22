// scaling.js
import {Dimensions, PixelRatio} from 'react-native';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const baseWidth = 375; // iPhone X width (baseline for scaling)

export const scale = size => (SCREEN_WIDTH / baseWidth) * size;
export const fontScale = size => size * PixelRatio.getFontScale();
export const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;
