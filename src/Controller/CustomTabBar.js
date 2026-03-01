// /* eslint-disable no-unused-vars */
// import React from 'react';
// import {View, TouchableOpacity, Text, StyleSheet, Platform} from 'react-native';
// import {useNavigation} from '@react-navigation/native';
// import {useSelector} from 'react-redux';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import LinearGradient from 'react-native-linear-gradient';
// import {translate as t} from '../store/utils/translate';

// export default function CustomTabBar(props) {
//   const tabBarState = props?.state;
//   const tabBarNavigation = props?.navigation;
//   const navigation = useNavigation();
//   const nav = tabBarNavigation || navigation;
//   const currentLanguage = useSelector(state => state.language.currentLanguage);

//   const defaultTabs = [
//     {
//       name: 'MainDashboard',
//       label: t('tabNavigator.home'),
//       iconFocused: 'home',
//       iconUnfocused: 'home-outline',
//       color: '#1a73e8',
//     },
//     {
//       name: 'WorkerAssignedToMe',
//       label: t('tabNavigator.myTeam'),
//       iconFocused: 'people',
//       iconUnfocused: 'people-outline',
//       color: '#1a73e8',
//     },
//     {
//       name: 'DisplayListPage',
//       label: t('tabNavigator.history'),
//       iconFocused: 'grid',
//       iconUnfocused: 'grid-outline',
//       color: '#1a73e8',
//     },
//     {
//       name: 'WorkItemAssigned',
//       label: t('tabNavigator.MyWorkItems'),
//       iconFocused: 'clipboard',
//       iconUnfocused: 'clipboard-outline',
//       color: '#1a73e8',
//     },
//     {
//       name: 'ESSMyRequestStatusListPage',
//       label: t('tabNavigator.ESSMyRequestStatusListPage'),
//       iconFocused: 'document-text',
//       iconUnfocused: 'document-text-outline',
//       color: '#1a73e8',
//     },
//     {
//       name: 'Profile',
//       label: t('tabNavigator.profile'),
//       iconFocused: 'person',
//       iconUnfocused: 'person-outline',
//       color: '#1a73e8',
//     },
//   ];

//   const tabs = props.tabs || defaultTabs;

//   const getActiveTabName = () => {
//     if (tabBarState && typeof tabBarState.index === 'number') {
//       return tabBarState.routes[tabBarState.index]?.name;
//     }

//     try {
//       const rootState = nav.getState?.();
//       if (rootState && Array.isArray(rootState.routes)) {
//         const tabRoute = rootState.routes.find(
//           r => r.name === 'TabNavigator' && r.state,
//         );
//         if (
//           tabRoute &&
//           tabRoute.state &&
//           typeof tabRoute.state.index === 'number'
//         ) {
//           return tabRoute.state.routes[tabRoute.state.index]?.name;
//         }
//       }
//     } catch (e) {
//       // ignore
//     }

//     try {
//       const rs = nav.getState?.();
//       return rs?.routes?.[rs.index]?.name ?? null;
//     } catch (e) {
//       return null;
//     }
//   };

//   const activeTab = getActiveTabName();

//   const handlePress = tabName => {
//     if (tabBarNavigation && typeof tabBarNavigation.navigate === 'function') {
//       tabBarNavigation.navigate(tabName);
//       return;
//     }

//     nav.navigate('TabNavigator', {screen: tabName});
//   };

//   // Calculate responsive sizing based on number of tabs
//   const getResponsiveStyles = () => {
//     const tabCount = tabs.length;

//     if (tabCount <= 4) {
//       return {
//         iconSize: 24,
//         fontSize: 11,
//         showLabel: true,
//       };
//     } else if (tabCount === 5) {
//       return {
//         iconSize: 22,
//         fontSize: 10,
//         showLabel: true,
//       };
//     } else {
//       // 6+ tabs - compact mode
//       return {
//         iconSize: 21,
//         fontSize: 9,
//         showLabel: true,
//       };
//     }
//   };

//   const responsiveStyles = getResponsiveStyles();

//   // Helper to lighten color for background
//   const getLightColor = color => {
//     const colors = {
//       '#1a73e8': ['#e3f2fd', '#bbdefb'],
//       '#8b5cf6': ['#f3e8ff', '#e9d5ff'],
//       '#10b981': ['#d1fae5', '#a7f3d0'],
//       '#f59e0b': ['#fef3c7', '#fde68a'],
//       '#ef4444': ['#fee2e2', '#fecaca'],
//       '#06b6d4': ['#cffafe', '#a5f3fc'],
//     };
//     return colors[color] || ['#f3f4f6', '#e5e7eb'];
//   };

//   return (
//     <View style={[styles.container, props.style]}>
//       <View style={styles.tabBarWrapper}>
//         {tabs.map((tab, index) => {
//           const isActive = activeTab === tab.name;
//           const tabColor = tab.color || '#1a73e8';
//           const lightColors = getLightColor(tabColor);

//           return (
//             <TouchableOpacity
//               key={tab.name}
//               style={styles.tabItem}
//               onPress={() => handlePress(tab.name)}
//               activeOpacity={0.6}
//               accessibilityLabel={tab.label}
//               accessibilityRole="button"
//               accessibilityState={{selected: isActive}}>
//               {/* Icon with gradient background when active */}
//               {isActive ? (
//                 <LinearGradient
//                   colors={['#dbeafe', '#bfdbfe']}
//                   start={{x: 0, y: 0}}
//                   end={{x: 1, y: 1}}
//                   style={styles.iconWrapper}>
//                   <View
//                     style={[
//                       styles.iconInnerGlow,
//                       {backgroundColor: tabColor + '30'},
//                     ]}>
//                     <Ionicons
//                       name={tab.iconFocused}
//                       size={responsiveStyles.iconSize}
//                       color={tabColor}
//                     />
//                   </View>
//                 </LinearGradient>
//               ) : (
//                 <View style={[styles.iconWrapper, styles.iconWrapperInactive]}>
//                   <Ionicons
//                     name={tab.iconUnfocused}
//                     size={responsiveStyles.iconSize}
//                     color="#6b7280"
//                   />
//                 </View>
//               )}

//               {/* Label with gradient underline when active */}
//               {responsiveStyles.showLabel && (
//                 <View style={styles.labelContainer}>
//                   <Text
//                     style={[
//                       styles.label,
//                       isActive && [styles.labelActive, {color: tabColor}],
//                       {fontSize: responsiveStyles.fontSize},
//                     ]}
//                     numberOfLines={2}
//                     ellipsizeMode="tail">
//                     {tab.label}
//                   </Text>
//                   {isActive && (
//                     <View style={styles.activeUnderline}>
//                       <LinearGradient
//                         colors={['#1a73e8', '#2563eb']}
//                         start={{x: 0, y: 0}}
//                         end={{x: 1, y: 0}}
//                         style={styles.underlineGradient}
//                       />
//                     </View>
//                   )}
//                 </View>
//               )}
//             </TouchableOpacity>
//           );
//         })}
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: '#ffffff',
//     paddingBottom: Platform.OS === 'ios' ? 24 : 8,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: -8},
//     shadowOpacity: 0.08,
//     shadowRadius: 16,
//     elevation: 20,
//     borderTopWidth: 1,
//     borderTopColor: '#f3f4f6',
//   },
//   tabBarWrapper: {
//     flexDirection: 'row',
//     paddingHorizontal: 4,
//     paddingTop: 10,
//     paddingBottom: 4,
//     justifyContent: 'space-around',
//     alignItems: 'flex-end',
//   },
//   tabItem: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'flex-end',
//     paddingVertical: 4,
//     paddingHorizontal: 2,
//     position: 'relative',
//     minHeight: 64,
//     maxWidth: 80,
//   },
//   iconWrapper: {
//     width: 52,
//     height: 44,
//     borderRadius: 14,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 4,
//   },
//   iconWrapperInactive: {
//     backgroundColor: '#f9fafb',
//   },
//   iconInnerGlow: {
//     width: 48,
//     height: 40,
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   labelContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     position: 'relative',
//     minHeight: 22,
//     maxHeight: 30,
//   },
//   label: {
//     color: '#9ca3af',
//     fontWeight: '500',
//     textAlign: 'center',
//     letterSpacing: 0.3,
//     paddingHorizontal: 2,
//     lineHeight: 12,
//   },
//   labelActive: {
//     fontWeight: '700',
//   },
//   activeUnderline: {
//     position: 'absolute',
//     bottom: -4,
//     width: '100%',
//     height: 2,
//     borderRadius: 1,
//     overflow: 'hidden',
//   },
//   underlineGradient: {
//     width: '100%',
//     height: '100%',
//   },
// });

/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet, Platform} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {translate as t} from '../store/utils/translate';

export default function CustomTabBar(props) {
  const tabBarState = props?.state;
  const tabBarNavigation = props?.navigation;
  const navigation = useNavigation();
  const nav = tabBarNavigation || navigation;
  const currentLanguage = useSelector(state => state.language.currentLanguage);

  const defaultTabs = [
    {
      name: 'MainDashboard',
      label: t('tabNavigator.home'),
      iconFocused: 'home',
      iconUnfocused: 'home-outline',
      color: '#0A66C2',
    },
    {
      name: 'WorkerAssignedToMe',
      label: t('tabNavigator.myTeam'),
      iconFocused: 'people',
      iconUnfocused: 'people-outline',
      color: '#0A66C2',
    },
    // {
    //   name: 'DisplayListPage',
    //   label: t('tabNavigator.history'),
    //   iconFocused: 'grid',
    //   iconUnfocused: 'grid-outline',
    //   color: '#0A66C2',
    // },
    {
      name: 'WorkItemAssigned',
      label: t('tabNavigator.MyWorkItems'),
      iconFocused: 'clipboard',
      iconUnfocused: 'clipboard-outline',
      color: '#0A66C2',
    },
    {
      name: 'ESSMyRequestStatusListPage',
      label: t('tabNavigator.ESSMyRequestStatusListPage'),
      iconFocused: 'document-text',
      iconUnfocused: 'document-text-outline',
      color: '#0A66C2',
    },
    {
      name: 'Profile',
      label: t('tabNavigator.profile'),
      iconFocused: 'person',
      iconUnfocused: 'person-outline',
      color: '#0A66C2',
    },
  ];

  const tabs = props.tabs || defaultTabs;

  const getActiveTabName = () => {
    if (tabBarState && typeof tabBarState.index === 'number') {
      return tabBarState.routes[tabBarState.index]?.name;
    }

    try {
      const rootState = nav.getState?.();
      if (rootState && Array.isArray(rootState.routes)) {
        const tabRoute = rootState.routes.find(
          r => r.name === 'TabNavigator' && r.state,
        );
        if (
          tabRoute &&
          tabRoute.state &&
          typeof tabRoute.state.index === 'number'
        ) {
          return tabRoute.state.routes[tabRoute.state.index]?.name;
        }
      }
    } catch (e) {
      // ignore
    }

    try {
      const rs = nav.getState?.();
      return rs?.routes?.[rs.index]?.name ?? null;
    } catch (e) {
      return null;
    }
  };

  const activeTab = getActiveTabName();

  const handlePress = tabName => {
    if (tabBarNavigation && typeof tabBarNavigation.navigate === 'function') {
      tabBarNavigation.navigate(tabName);
      return;
    }

    nav.navigate('TabNavigator', {screen: tabName});
  };

  // Calculate responsive sizing based on number of tabs
  const getResponsiveStyles = () => {
    const tabCount = tabs.length;

    if (tabCount <= 4) {
      return {
        iconSize: 24,
        fontSize: 11,
        showLabel: true,
      };
    } else if (tabCount === 5) {
      return {
        iconSize: 22,
        fontSize: 10,
        showLabel: true,
      };
    } else {
      // 6+ tabs - compact mode
      return {
        iconSize: 21,
        fontSize: 9,
        showLabel: true,
      };
    }
  };

  const responsiveStyles = getResponsiveStyles();

  // Helper to lighten color for background
  const getLightColor = color => {
    const colors = {
      '#1a73e8': ['#e3f2fd', '#bbdefb'],
      '#8b5cf6': ['#f3e8ff', '#e9d5ff'],
      '#10b981': ['#d1fae5', '#a7f3d0'],
      '#f59e0b': ['#fef3c7', '#fde68a'],
      '#ef4444': ['#fee2e2', '#fecaca'],
      '#06b6d4': ['#cffafe', '#a5f3fc'],
    };
    return colors[color] || ['#f3f4f6', '#e5e7eb'];
  };

  return (
    <View style={[styles.container, props.style]}>
      <View style={styles.tabBarWrapper}>
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.name;
          const tabColor = tab.color || '#0A66C2';
          const lightColors = getLightColor(tabColor);

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              onPress={() => handlePress(tab.name)}
              activeOpacity={0.6}
              accessibilityLabel={tab.label}
              accessibilityRole="button"
              accessibilityState={{selected: isActive}}>
              {/* Icon with gradient background when active */}
              {isActive ? (
                <LinearGradient
                  colors={['#ffffff', '#f0f0f0']}
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
                      color="#0A66C2"
                    />
                  </View>
                </LinearGradient>
              ) : (
                <View style={[styles.iconWrapper, styles.iconWrapperInactive]}>
                  <Ionicons
                    name={tab.iconUnfocused}
                    size={responsiveStyles.iconSize}
                    color="#ffffff"
                  />
                </View>
              )}

              {/* Label with gradient underline when active */}
              {responsiveStyles.showLabel && (
                <View style={styles.labelContainer}>
                  <Text
                    style={[
                      styles.label,
                      isActive && [styles.labelActive, {color: '#ffffff'}],
                      !isActive && {color: 'rgba(255, 255, 255, 0.7)'},
                      {fontSize: responsiveStyles.fontSize},
                    ]}
                    numberOfLines={2}
                    ellipsizeMode="tail">
                    {tab.label}
                  </Text>
                  {isActive && (
                    <View style={styles.activeUnderline}>
                      <LinearGradient
                        colors={['#ffffff', '#ffffff']}
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0A66C2',
    // paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -8},
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 20,
    borderTopWidth: 1,
    borderTopColor: '#0A66C2',
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
    color: '#ffffff',
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.3,
    paddingHorizontal: 2,
    lineHeight: 12,
  },
  labelActive: {
    fontWeight: '700',
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
