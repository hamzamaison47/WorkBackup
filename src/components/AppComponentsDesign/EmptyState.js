/**
 * EmptyState.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Centered empty state with optional icon and message.
 *
 * Props:
 *   icon      — feather icon name (default 'inbox')
 *   iconLib   — icon library
 *   message   — primary message string
 *   subtitle  — secondary string (optional)
 *   style     — override container
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import resolveIcon from './resolveIcon';
import {AppTokens} from './Tokens';
import {
  conditionalScale,
  conditionalVerticalScale,
  conditionalFontScale,
} from '../../store/utils/scaling';

const EmptyState = ({
  icon = 'inbox',
  iconLib = 'feather',
  message,
  subtitle,
  style,
}) => {
  const IconComponent = resolveIcon(iconLib);
  return (
    <View style={[S.emptyState, style]}>
      <IconComponent
        name={icon}
        size={conditionalFontScale(28, 30, 32, 32)}
        color={AppTokens.emptyText}
      />
      {message ? <Text style={S.emptyMessage}>{message}</Text> : null}
      {subtitle ? <Text style={S.emptySubtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const S = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: conditionalVerticalScale(32, 36, 40, 40),
    paddingHorizontal: conditionalScale(24, 28, 32, 32),
  },
  emptyMessage: {
    fontSize: conditionalFontScale(14, 14, 15, 15),
    fontWeight: '600',
    color: AppTokens.emptyText,
    marginTop: conditionalVerticalScale(10, 11, 12, 12),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: conditionalFontScale(11, 11, 12, 12),
    color: AppTokens.emptyText,
    fontWeight: '400',
    marginTop: conditionalVerticalScale(4, 5, 6, 6),
    textAlign: 'center',
    lineHeight: conditionalFontScale(16, 16, 17, 17),
  },
});

export default EmptyState;
