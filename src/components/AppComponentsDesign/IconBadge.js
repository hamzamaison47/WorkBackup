/**
 * IconBadge.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Rounded square colored icon container.
 * Matches the icon badges in SettingsScreen and ActionPaneMenuModal.
 *
 * Props:
 *   name      — icon name string
 *   color     — icon color (e.g. AppTokens.blue)
 *   bgColor   — badge background (e.g. AppTokens.blueBg)
 *   lib       — 'feather' (default) | 'ion' | 'fa'
 *   size      — override icon size
 *   style     — override badge container style
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import {View, StyleSheet} from 'react-native';
import resolveIcon from './resolveIcon';
import {
  conditionalScale,
  conditionalFontScale,
} from '../../store/utils/scaling';

const IconBadge = ({name, color, bgColor, lib = 'feather', size, style}) => {
  const IconComponent = resolveIcon(lib);
  return (
    <View style={[S.iconBadge, {backgroundColor: bgColor}, style]}>
      <IconComponent
        name={name}
        size={size ?? conditionalFontScale(15, 15, 16, 16)}
        color={color}
      />
    </View>
  );
};

const S = StyleSheet.create({
  iconBadge: {
    width: conditionalScale(36, 37, 38, 38),
    height: conditionalScale(36, 37, 38, 38),
    borderRadius: conditionalScale(10, 10, 11, 11),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: conditionalScale(12, 13, 14, 14),
  },
});

export default IconBadge;
