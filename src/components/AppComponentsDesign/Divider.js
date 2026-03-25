/**
 * Divider.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Thin horizontal separator line.
 *
 * Props:
 *   color   — default AppTokens.cardDivider (#F1F5F9)
 *   style   — override
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import {View, StyleSheet} from 'react-native';
import {AppTokens} from './Tokens';
import {conditionalScale} from '../../store/utils/scaling';

const Divider = ({color, style}) => (
  <View style={[S.divider, color && {backgroundColor: color}, style]} />
);

const S = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: AppTokens.cardDivider,
    marginHorizontal: conditionalScale(14, 15, 16, 16),
  },
});

export default Divider;
