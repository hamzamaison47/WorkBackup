/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet, Platform} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {translate as t} from '../store/utils/translate';
import useAppTokens from '../components/AppComponentsDesign/useAppTokens';
import usePalette from '../hooks/usePalette';
import {screenMapping} from './screenMapping';

export default function CustomTabBar(props) {
  // ✅ reactive theme tokens
  const T = useAppTokens();
  const P = usePalette();
  const insets = useSafeAreaInsets();

  const tabBarState = props?.state;
  const tabBarNavigation = props?.navigation;
  const navigation = useNavigation();
  const nav = tabBarNavigation || navigation;
  const currentLanguage = useSelector(state => state.language.currentLanguage);
  const {menuItems} = useSelector(state => state.menuItem);

  const footerTabs = menuItems.filter(
    item =>
      item.Visible === '1' &&
      item.DisplayOnFooter === 'Yes' &&
      screenMapping[item.MenuId],
  );

  const iconMap = {
    MainDashboard: {focused: 'home', unfocused: 'home-outline'},
    DisplayListPage: {focused: 'grid', unfocused: 'grid-outline'},
    Profile: {focused: 'person', unfocused: 'person-outline'},
    WorkerAssignedToMe: {focused: 'people', unfocused: 'people-outline'},
    WorkItemAssigned: {focused: 'clipboard', unfocused: 'clipboard-outline'},
    ESSMyRequestStatusListPage: {
      focused: 'document-text',
      unfocused: 'document-text-outline',
    },
    WorkItemsAssignedToMePage: {focused: 'list', unfocused: 'list-outline'},
    AttendanceManagement: {focused: 'calendar', unfocused: 'calendar-outline'},
  };

  const uniqueFooterTabs = footerTabs
    .filter(
      (it, idx, arr) =>
        !!it?.MenuId && arr.findIndex(x => x.MenuId === it.MenuId) === idx,
    )
    .map(item => ({
      name: item.MenuId,
      label: item.Label || item.MenuId,
      iconFocused: iconMap[item.MenuId]?.focused || 'folder-open',
      iconUnfocused: iconMap[item.MenuId]?.unfocused || 'folder-outline',
      color: P.primary,
    }));

  const defaultHomeTab = {
    name: 'MainDashboard',
    label: 'Home',
    iconFocused: 'home',
    iconUnfocused: 'home-outline',
    color: P.primary,
  };

  const tabs =
    props.tabs ||
    (uniqueFooterTabs.length > 0 ? uniqueFooterTabs : [defaultHomeTab]);

  const getActiveTabName = () => {
    if (tabBarState && typeof tabBarState.index === 'number') {
      return tabBarState.routes[tabBarState.index]?.name;
    }
    try {
      const rs = nav.getState?.();
      return rs?.routes?.[rs.index]?.name ?? null;
    } catch (e) {
      return null;
    }
  };

  const activeTab = getActiveTabName();

  // const handlePress = tabName => {
  //   if (tabBarNavigation && typeof tabBarNavigation.navigate === 'function') {
  //     tabBarNavigation.navigate(tabName);
  //     return;
  //   }
  //   nav.navigate(tabName);
  // };
  const handlePress = tabName => {
    if (tabName === 'AttendanceManagement') {
      nav.navigate('AttendanceManagement', {
        fromTab: true,
      });
      return;
    }

    if (tabBarNavigation && typeof tabBarNavigation.navigate === 'function') {
      tabBarNavigation.navigate(tabName);
      return;
    }

    nav.navigate(tabName);
  };

  const getResponsiveStyles = () => {
    const tabCount = tabs.length;
    if (tabCount <= 4) {
      return {iconSize: 24, fontSize: 11, showLabel: true};
    }
    if (tabCount === 5) {
      return {iconSize: 22, fontSize: 10, showLabel: true};
    }
    return {iconSize: 21, fontSize: 9, showLabel: true};
  };

  const responsiveStyles = getResponsiveStyles();

  // ✅ In dark mode: deep dark surface for tab bar
  // In light mode: brand blue (unchanged from original)
  const tabBarBg =
    T.pageBg === '#0F172A'
      ? '#1E293B' // dark mode — elevated surface
      : P.primary; // light mode — brand blue

  // ✅ Active icon bg — white pill in light, subtle blue in dark
  const activeIconGradient =
    T.pageBg === '#0F172A'
      ? ['#334155', '#1E293B'] // dark mode
      : ['#ffffff', '#f0f0f0']; // light mode

  // ✅ Active icon color — brand blue in light, bright white in dark
  const activeIconColor = T.pageBg === '#0F172A' ? '#93C5FD' : P.primary;

  // ✅ Inactive icon color — white in light, muted in dark
  const inactiveIconColor =
    T.pageBg === '#0F172A' ? 'rgba(148, 163, 184, 0.9)' : P.onPrimary;

  // ✅ Label colors
  const activeLabelColor = T.pageBg === '#0F172A' ? '#93C5FD' : P.onPrimary;
  const inactiveLabelColor =
    T.pageBg === '#0F172A'
      ? 'rgba(148, 163, 184, 0.7)'
      : 'rgba(255, 255, 255, 0.7)';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: tabBarBg,
          borderTopColor: P.primary,
          paddingBottom: insets.bottom,
        },
        props.style,
      ]}>
      <View style={styles.tabBarWrapper}>
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.name;

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              onPress={() => handlePress(tab.name)}
              activeOpacity={0.6}
              accessibilityLabel={tab.label}
              accessibilityRole="button"
              accessibilityState={{selected: isActive}}>
              {/* Icon */}
              {isActive ? (
                <LinearGradient
                  colors={activeIconGradient}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.iconWrapper}>
                  <View
                    style={[
                      styles.iconInnerGlow,
                      {backgroundColor: 'transparent'},
                    ]}>
                    <Ionicons
                      name={tab.iconFocused}
                      size={responsiveStyles.iconSize}
                      color={activeIconColor}
                    />
                  </View>
                </LinearGradient>
              ) : (
                <View style={[styles.iconWrapper, styles.iconWrapperInactive]}>
                  <Ionicons
                    name={tab.iconUnfocused}
                    size={responsiveStyles.iconSize}
                    color={inactiveIconColor}
                  />
                </View>
              )}

              {/* Label */}
              {responsiveStyles.showLabel && (
                <View style={styles.labelContainer}>
                  <Text
                    style={[
                      styles.label,
                      isActive
                        ? {color: activeLabelColor, fontWeight: '700'}
                        : {color: inactiveLabelColor},
                      {fontSize: responsiveStyles.fontSize},
                    ]}
                    numberOfLines={2}
                    ellipsizeMode="tail">
                    {tab.label}
                  </Text>
                  {isActive && (
                    <View style={styles.activeUnderline}>
                      <LinearGradient
                        colors={[activeLabelColor, activeLabelColor]}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 0}}
                        style={styles.underlineGradient}
                      />
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ✅ No colors in StyleSheet — all applied inline
const styles = StyleSheet.create({
  container: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -8},
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 20,
    borderTopWidth: 1,
  },
  tabBarWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 2,
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 2,
    position: 'relative',
    minHeight: 64,
    maxWidth: 80,
  },
  iconWrapper: {
    width: 52,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  iconWrapperInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  iconInnerGlow: {
    width: 48,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 22,
    maxHeight: 30,
  },
  label: {
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.3,
    paddingHorizontal: 2,
    lineHeight: 12,
  },
  activeUnderline: {
    position: 'absolute',
    bottom: -4,
    width: '100%',
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  underlineGradient: {
    width: '100%',
    height: '100%',
  },
});
