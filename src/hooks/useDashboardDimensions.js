/* eslint-disable curly */
import {useWindowDimensions} from 'react-native';
import {scale, moderateScale} from '../store/utils/scaling';

export const useDashboardDimensions = () => {
  const {width: screenWidth, height: screenHeight} = useWindowDimensions();

  const isSmallScreen = screenWidth < 360;
  const isMediumScreen = screenWidth >= 360 && screenWidth <= 414;

  const getNumColumns = () => {
    if (isSmallScreen) return 2;
    if (isMediumScreen) return 3;
    return screenWidth > 500 ? 4 : 3;
  };

  const numColumns = getNumColumns();
  const cardsPerPage = numColumns * 2;

  const H_PADDING = scale(20);
  const GRID_GAP = moderateScale(12);
  const totalHorizontalGutters = H_PADDING * 2 + GRID_GAP * (numColumns - 1);

  const computedCardWidth = Math.floor(
    (screenWidth - totalHorizontalGutters) / numColumns,
  );

  const getCardHeight = () => {
    const baseRatio = isSmallScreen ? 1.1 : 0.9;
    const calculated = Math.floor(computedCardWidth * baseRatio);
    const minHeight = isSmallScreen ? 100 : 120;
    const maxHeight = isSmallScreen ? 140 : 160;
    return Math.max(minHeight, Math.min(calculated, maxHeight));
  };

  const computedCardHeight = getCardHeight();

  const getIconSize = () => {
    const baseSize = computedCardWidth * 0.4;
    const min = isSmallScreen ? 28 : 32;
    const max = isSmallScreen ? 48 : 60;
    return Math.max(min, Math.min(baseSize, max));
  };

  const iconSize = getIconSize();

  return {
    screenWidth,
    screenHeight,
    isSmallScreen,
    isMediumScreen,
    numColumns,
    cardsPerPage,
    H_PADDING,
    GRID_GAP,
    computedCardWidth,
    computedCardHeight,
    iconSize,
  };
};
