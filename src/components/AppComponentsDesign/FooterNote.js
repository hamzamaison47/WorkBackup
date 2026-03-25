/**
 * FooterNote.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Subtle centered footer text. Used for "Employee ID: xxx", version info, etc.
 *
 * Props:
 *   icon      — optional ionicon name (e.g. 'cube-outline')
 *   iconLib   — icon library (default 'ion')
 *   text      — footer string
 *   style     — override
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

const FooterNote = ({icon, iconLib = 'ion', text, style}) => {
  const IconComponent = resolveIcon(iconLib);
  return (
    <View style={[S.footerNote, style]}>
      {icon ? (
        <IconComponent
          name={icon}
          size={conditionalFontScale(14, 15, 16, 16)}
          color={AppTokens.footerText}
        />
      ) : null}
      <Text style={S.footerNoteText}>{text}</Text>
    </View>
  );
};

const S = StyleSheet.create({
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: conditionalScale(6, 7, 8, 8),
    marginTop: conditionalVerticalScale(8, 10, 12, 12),
    marginBottom: conditionalVerticalScale(4, 5, 6, 6),
  },
  footerNoteText: {
    fontSize: conditionalFontScale(10, 10, 11, 11),
    color: AppTokens.footerText,
    fontWeight: '500',
  },
});

export default FooterNote;
