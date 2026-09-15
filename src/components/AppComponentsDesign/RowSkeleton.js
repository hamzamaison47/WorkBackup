/**
 * RowSkeleton.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Loading placeholder that matches a SettingRow's height and layout.
 * Use while data is loading to prevent layout jump.
 *
 * Props:
 *   count   — number of skeleton rows to show (default 3)
 *   style   — override card container style
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import {View, StyleSheet} from 'react-native';
import {StaticCard} from './Cards';
import {AppTokens} from './Tokens';
import {
  conditionalScale,
  conditionalVerticalScale,
} from '../../store/utils/scaling';

const RowSkeleton = ({count = 3, style}) => (
  <StaticCard style={style}>
    {Array.from({length: count}).map((_, i) => (
      <View
        key={i}
        style={[S.skeletonRow, i === count - 1 && S.skeletonRowLast]}>
        <View style={S.skeletonBadge} />
        <View style={S.skeletonTextBlock}>
          <View style={S.skeletonTitle} />
          <View style={S.skeletonSubtitle} />
        </View>
      </View>
    ))}
  </StaticCard>
);

const S = StyleSheet.create({
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: conditionalScale(14, 15, 16, 16),
    paddingVertical: conditionalVerticalScale(13, 14, 15, 15),
    borderBottomWidth: 1,
    borderBottomColor: AppTokens.rowDivider,
  },
  skeletonRowLast: {
    borderBottomWidth: 0,
  },
  skeletonBadge: {
    width: conditionalScale(36, 37, 38, 38),
    height: conditionalScale(36, 37, 38, 38),
    borderRadius: conditionalScale(10, 10, 11, 11),
    backgroundColor: AppTokens.cardDivider,
    marginRight: conditionalScale(12, 13, 14, 14),
  },
  skeletonTextBlock: {
    flex: 1,
  },
  skeletonTitle: {
    height: conditionalVerticalScale(11, 12, 13, 13),
    borderRadius: 4,
    backgroundColor: AppTokens.cardDivider,
    width: '60%',
    marginBottom: 6,
  },
  skeletonSubtitle: {
    height: conditionalVerticalScale(9, 10, 10, 10),
    borderRadius: 4,
    backgroundColor: '#F8FAFC',
    width: '40%',
  },
});

export default RowSkeleton;
