import React from 'react';
import {Text} from 'react-native';
import useAppTokens from './useAppTokens';
import {
  conditionalScale,
  conditionalVerticalScale,
  conditionalFontScale,
} from '../../store/utils/scaling';

export const CardHeading = ({label, style}) => {
  const T = useAppTokens();
  return (
    <Text
      style={[
        // eslint-disable-next-line react-native/no-inline-styles
        {
          fontSize: conditionalFontScale(9, 9, 10, 10),
          fontWeight: '700',
          color: T.headingText,
          letterSpacing: 1,
          paddingHorizontal: conditionalScale(14, 15, 16, 16),
          paddingTop: conditionalVerticalScale(12, 13, 14, 14),
          paddingBottom: conditionalVerticalScale(6, 7, 8, 8),
          backgroundColor: T.cardHeadingBg,
          borderBottomWidth: 1,
          borderBottomColor: T.cardDivider,
        },
        style,
      ]}>
      {label}
    </Text>
  );
};

export const SectionLabel = ({label, style}) => {
  const T = useAppTokens();
  return (
    <Text
      style={[
        {
          fontSize: conditionalFontScale(9, 9, 10, 10),
          fontWeight: '700',
          color: T.headingText,
          letterSpacing: 1,
          paddingHorizontal: conditionalScale(14, 15, 16, 16),
          paddingTop: conditionalVerticalScale(4, 5, 6, 6),
          paddingBottom: conditionalVerticalScale(2, 3, 3, 3),
        },
        style,
      ]}>
      {label}
    </Text>
  );
};
