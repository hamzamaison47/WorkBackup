/* eslint-disable no-unused-vars */
import React from 'react';
import {View, TouchableOpacity, Text} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {translate as t} from '../store/utils/translate';
import styles from '../styles/styles';

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
    },
    {
      name: 'WorkerAssignedToMe',
      label: t('tabNavigator.myTeam'),
      iconFocused: 'people',
      iconUnfocused: 'people-outline',
    },
    {
      name: 'DisplayListPage',
      label: t('tabNavigator.history'),
      iconFocused: 'grid',
      iconUnfocused: 'grid-outline',
    },
    {
      name: 'WorkItemAssigned',
      label: t('tabNavigator.MyWorkItems'),
      iconFocused: 'clipboard',
      iconUnfocused: 'clipboard-outline',
    },
    {
      name: 'Profile',
      label: t('tabNavigator.profile'),
      iconFocused: 'person',
      iconUnfocused: 'person-outline',
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

  return (
    <View style={[styles.TabBar_container, props.style]}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.TabBar_tabItem}
            onPress={() => handlePress(tab.name)}
            activeOpacity={0.75}
            accessibilityLabel={tab.label}
            accessibilityRole="button">
            <Ionicons
              name={isActive ? tab.iconFocused : tab.iconUnfocused}
              size={24}
              color={isActive ? '#ffffff' : '#d1e0ee'}
            />
            <Text
              style={[
                styles.TabBar_label,
                isActive && styles.TabBar_labelActive,
              ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
