/**
 * BadgePill.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Small colored pill badge. Use for status indicators, counts, tags.
 *
 * Props:
 *   label     — text inside pill
 *   color     — text color (default AppTokens.blue)
 *   bgColor   — background color (default AppTokens.blueBg)
 *   style     — override
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {
  conditionalScale,
  conditionalVerticalScale,
  conditionalFontScale,
} from '../../store/utils/scaling';
import usePalette from '../../hooks/usePalette';

const BadgePill = ({label, color, bgColor, style}) => {
  const P = usePalette();
  return (
    <View style={[S.badgePill, {backgroundColor: bgColor || P.tint}, style]}>
      <Text style={[S.badgePillText, {color: color || P.primary}]}>
        {label}
      </Text>
    </View>
  );
};

const S = StyleSheet.create({
  badgePill: {
    paddingHorizontal: conditionalScale(8, 9, 10, 10),
    paddingVertical: conditionalVerticalScale(3, 3, 4, 4),
    borderRadius: conditionalScale(20, 20, 20, 20),
    alignSelf: 'flex-start',
  },
  badgePillText: {
    fontSize: conditionalFontScale(10, 10, 11, 11),
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default BadgePill;
