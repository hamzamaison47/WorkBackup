/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
import React, {useEffect} from 'react';
import {View, TouchableOpacity, Text, StyleSheet, Platform} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {translate as t} from '../store/utils/translate';
import useAppTokens from '../components/AppComponentsDesign/useAppTokens';
import {AppTokens} from '../components/AppComponentsDesign/Tokens';
import usePalette from '../hooks/usePalette';
import {screenMapping} from './screenMapping';
import {useDispatch} from 'react-redux';
import {RetrieveByEmail} from '../API/WorkflowTrackingStatusTable/retrieveByEmail';
import {setPendingWorkItemsCount} from '../store/slices/workItemsSlice';

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

  // add:
  const pendingWorkItemsCount = useSelector(
    state => state.workItems?.pendingCount ?? 0,
  );

  const footerTabs = menuItems.filter(
    item =>
      item.Visible === '1' &&
      item.DisplayOnFooter === 'Yes' &&
      screenMapping[item.MenuId],
  );
  const dispatch = useDispatch();
  const currentUserData = useSelector(state => state.user?.userData);

  useEffect(() => {
    let cancelled = false;
    const fetchPendingCount = async () => {
      console.log(
        '[CustomTabBar] fetchPendingCount fired, email =',
        currentUserData?.email,
      );
      if (!currentUserData?.email) {
        console.log('[CustomTabBar] no email yet — skipping fetch');
        return;
      }
      try {
        const data = await RetrieveByEmail({email: currentUserData.email});
        console.log(
          '[CustomTabBar] RetrieveByEmail returned',
          data?.length,
          'items',
        );
        const pendingCount = (data || []).filter(
          item => item.workflowWorkItemType === 'WorkItem',
        ).length;
        console.log('[CustomTabBar] computed pendingCount =', pendingCount);
        if (!cancelled) dispatch(setPendingWorkItemsCount(pendingCount));
      } catch (err) {
        console.log(
          '[CustomTabBar] RetrieveByEmail FAILED:',
          err?.message || err,
        );
      }
    };
    fetchPendingCount();
    return () => {
      cancelled = true;
    };
  }, [currentUserData?.email, dispatch]);

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
    WorkItemsAssignedToMePage: {
      focused: 'file-tray-full',
      unfocused: 'file-tray-outline',
    }, // ✅ My Bucket
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
      // ADD THIS LINE:
      badge:
        item.MenuId === 'WorkItemsAssignedToMePage' && pendingWorkItemsCount > 0
          ? pendingWorkItemsCount
          : 0,
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

  // Light mode is an INVERTED bar: surface background, secondary-coloured
  // inactive tabs, primaryStrong active icon/label (primary itself is
  // 1.85:1 on white) and a primary-filled indicator under the active label.
  // Dark mode keeps its elevated dark surface and light-blue active state.
  const tabBarBg = T.isDark ? '#1E293B' : T.cardBg;

  // Active icon well — only dark mode still draws one (a subtle gradient);
  // the light bar has no pill, the indicator carries the active state.
  const activeIconGradient = ['#334155', '#1E293B'];

  const activeIconColor = T.isDark ? '#93C5FD' : T.blueStrong;
  const inactiveIconColor = T.isDark
    ? 'rgba(148, 163, 184, 0.9)'
    : T.subtitleText;

  const activeLabelColor = T.isDark ? '#93C5FD' : T.blueStrong;
  const inactiveLabelColor = T.isDark
    ? 'rgba(148, 163, 184, 0.7)'
    : T.subtitleText;

  // The 2px indicator under the active label: primary on the light bar.
  const indicatorColor = T.isDark ? activeLabelColor : T.blue;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: tabBarBg,
          borderTopColor: T.cardDivider,
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
              {isActive && T.isDark ? (
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
                <View
                  style={[
                    styles.iconWrapper,
                    !isActive && T.isDark && styles.iconWrapperInactive,
                  ]}>
                  <Ionicons
                    name={isActive ? tab.iconFocused : tab.iconUnfocused}
                    size={responsiveStyles.iconSize}
                    color={isActive ? activeIconColor : inactiveIconColor}
                  />
                </View>
              )}
              {/* ADD THIS BLOCK — right after the icon's closing )} above */}
              {tab.badge > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText} numberOfLines={1}>
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </Text>
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
                        colors={[indicatorColor, indicatorColor]}
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
    elevation: 8,
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
  // Dark mode only — a faint well behind inactive icons.
  iconWrapperInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  tabBadge: {
    position: 'absolute',
    top: 0,
    right: 10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: AppTokens.tabBadgeBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  tabBadgeText: {
    color: AppTokens.tabBadgeText,
    fontSize: 10,
    fontWeight: '700',
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
