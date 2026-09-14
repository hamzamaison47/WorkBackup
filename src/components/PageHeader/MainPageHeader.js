import React from 'react';
import {TouchableOpacity, View, Text, StyleSheet} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import FAIcon from 'react-native-vector-icons/FontAwesome';
import {Platform} from 'react-native';

import NotificationButton from './NotificationButton';
import {
  conditionalScale,
  conditionalFontScale,
} from '../../store/utils/scaling';
import brand from '../../theme/brand';

// The app bar is an inverted (surface-coloured) bar: surface background,
// `text`-coloured title/icons, `surfaceAlt` chips, a 1px `divider` bottom edge
// and no tinted shadow. Colours are parameters so ActionPaneContainer can
// pass the theme-aware tokens; the defaults are the brand's light values.
const MainPageHeader = ({
  onToggleDrawer,
  onShowNotify,
  onCount,
  onHeaderMenuPress,
  isBack = false,
  headerBg = brand.surface,
  headerFg = brand.text,
  chipBg = brand.surfaceAlt,
  dividerColor = brand.divider,
  topInset = 0,
}) => ({
  headerTitle: () => null,

  headerLeft: () => (
    <View style={S.side}>
      <TouchableOpacity
        onPress={onToggleDrawer}
        style={[S.iconBtn, {backgroundColor: chipBg}]}
        activeOpacity={0.72}>
        <FeatherIcon
          name={isBack ? 'arrow-left' : 'menu'}
          size={conditionalFontScale(15, 16, 17, 17)}
          color={headerFg}
        />
      </TouchableOpacity>
      <Text style={[S.titleText, {color: headerFg}]}>IDAP360</Text>
    </View>
  ),

  headerRight: () => (
    <View style={S.side}>
      {/* Notification bell with badge */}
      <TouchableOpacity
        onPress={onShowNotify}
        activeOpacity={0.72}
        style={[S.iconBtn, {backgroundColor: chipBg}]}>
        <FeatherIcon
          name="bell"
          size={conditionalFontScale(15, 16, 16, 17)}
          color={headerFg}
        />
        {onCount > 0 && (
          // The badge ring matches the bar behind it (a "cutout" look), so it
          // borrows headerBg on purpose.
          <View style={[S.badge, {borderColor: headerBg}]}>
            <Text style={S.badgeText}>{onCount > 99 ? '99+' : onCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Avatar / profile button */}
      <TouchableOpacity
        onPress={onHeaderMenuPress}
        activeOpacity={0.72}
        style={[
          S.avatarBtn,
          {backgroundColor: chipBg, borderColor: dividerColor},
        ]}>
        <FeatherIcon
          name="user"
          size={conditionalFontScale(14, 15, 15, 16)}
          color={headerFg}
        />
      </TouchableOpacity>
    </View>
  ),

  // Android edge-to-edge: reserve the status-bar strip explicitly so the content
  // row below keeps its full designed height instead of being squeezed under the
  // status bar. (iOS untouched — keeps its default 44 + insets.top.)
  ...(Platform.OS === 'android' && {headerStatusBarHeight: topInset}),

  headerStyle: {
    backgroundColor: headerBg,
    ...(Platform.OS === 'android' && {
      // total header = status-bar strip + the existing compact content height
      height: topInset + conditionalScale(48, 50, 52, 54),
    }),
    // A surface-coloured bar separates from the page with a hairline, not a
    // tinted shadow.
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: dividerColor,
  },

  headerTintColor: headerFg,
  headerTitleAlign: 'left',
});

const S = StyleSheet.create({
  side: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: conditionalScale(6, 7, 8, 8),
    gap: conditionalScale(6, 7, 8, 8),
  },

  // Generic square icon button (background from chipBg)
  iconBtn: {
    width: conditionalScale(32, 33, 34, 34),
    height: conditionalScale(32, 33, 34, 34),
    borderRadius: conditionalScale(9, 9, 10, 10),
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Notification badge — sits top-right of the bell button
  badge: {
    position: 'absolute',
    top: conditionalScale(3, 3, 3, 3),
    right: conditionalScale(3, 3, 3, 3),
    minWidth: conditionalScale(14, 15, 15, 16),
    height: conditionalScale(14, 15, 15, 16),
    borderRadius: 99,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: conditionalScale(2, 2, 3, 3),
    borderWidth: 1.5,
  },
  badgeText: {
    fontSize: conditionalFontScale(7, 8, 8, 9),
    fontWeight: '700',
    color: '#fff', // on the red badge, not on primary
    lineHeight: conditionalFontScale(10, 11, 11, 12),
  },

  // Avatar button — circular to feel like a profile chip (colours inline)
  avatarBtn: {
    width: conditionalScale(32, 33, 34, 34),
    height: conditionalScale(32, 33, 34, 34),
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },

  titleText: {
    fontSize: conditionalFontScale(14, 15, 16, 16),
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});

export default MainPageHeader;
