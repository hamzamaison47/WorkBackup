import React from 'react';
import {TouchableOpacity, View, Text, StyleSheet} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import FAIcon from 'react-native-vector-icons/FontAwesome';

import NotificationButton from './NotificationButton';
import {
  conditionalScale,
  conditionalFontScale,
} from '../../store/utils/scaling';

const BLUE = '#0A66C2';

const MainPageHeader = ({
  onToggleDrawer,
  onShowNotify,
  onCount,
  onHeaderMenuPress,
  isBack = false,
  headerBg = '#0A66C2',
}) => ({
  headerTitle: () => null,

  headerLeft: () => (
    <View style={S.side}>
      <TouchableOpacity
        onPress={onToggleDrawer}
        style={S.iconBtn}
        activeOpacity={0.72}>
        <FeatherIcon
          name={isBack ? 'arrow-left' : 'menu'}
          size={conditionalFontScale(15, 16, 17, 17)}
          color="#fff"
        />
      </TouchableOpacity>
      <Text style={S.titleText}>Dynaface</Text>
    </View>
  ),

  headerRight: () => (
    <View style={S.side}>
      {/* Notification bell with badge */}
      <TouchableOpacity
        onPress={onShowNotify}
        activeOpacity={0.72}
        style={S.iconBtn}>
        <FeatherIcon
          name="bell"
          size={conditionalFontScale(15, 16, 16, 17)}
          color="#fff"
        />
        {onCount > 0 && (
          <View style={S.badge}>
            <Text style={S.badgeText}>{onCount > 99 ? '99+' : onCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Avatar / profile button */}
      <TouchableOpacity
        onPress={onHeaderMenuPress}
        activeOpacity={0.72}
        style={S.avatarBtn}>
        <FeatherIcon
          name="user"
          size={conditionalFontScale(14, 15, 15, 16)}
          color="#fff"
        />
      </TouchableOpacity>
    </View>
  ),

  headerStyle: {
    backgroundColor: headerBg, // ← now accepts dynamic color
    height: conditionalScale(48, 50, 52, 54),
    elevation: 4,
    shadowColor: '#0A2540',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.18,
    shadowRadius: 6,
    borderBottomWidth: 0,
  },

  headerTintColor: '#fff',
  headerTitleAlign: 'left',
});

const S = StyleSheet.create({
  side: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: conditionalScale(6, 7, 8, 8),
    gap: conditionalScale(6, 7, 8, 8),
  },

  // Generic square icon button
  iconBtn: {
    width: conditionalScale(32, 33, 34, 34),
    height: conditionalScale(32, 33, 34, 34),
    borderRadius: conditionalScale(9, 9, 10, 10),
    backgroundColor: 'rgba(255,255,255,0.14)',
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
    borderColor: BLUE,
  },
  badgeText: {
    fontSize: conditionalFontScale(7, 8, 8, 9),
    fontWeight: '700',
    color: '#fff',
    lineHeight: conditionalFontScale(10, 11, 11, 12),
  },

  // Avatar button — slightly more opaque + circular to feel like a profile chip
  avatarBtn: {
    width: conditionalScale(32, 33, 34, 34),
    height: conditionalScale(32, 33, 34, 34),
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },

  titleText: {
    fontSize: conditionalFontScale(14, 15, 16, 16),
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.2,
  },
});

export default MainPageHeader;
