import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function CustomTabBar(props) {
  const tabBarState = props?.state;
  const tabBarNavigation = props?.navigation;
  const navigation = useNavigation();
  const nav = tabBarNavigation || navigation;

  const defaultTabs = [
    {
      name: 'MainDashboard',
      label: 'Home',
      iconFocused: 'home',
      iconUnfocused: 'home-outline',
    },
    {
      name: 'WorkItemAssignedToMe',
      label: 'Work items',
      iconFocused: 'clipboard',
      iconUnfocused: 'clipboard-outline',
    },
    {
      name: 'WorkerAssignedToMe',
      label: 'My Team',
      iconFocused: 'people',
      iconUnfocused: 'people-outline',
    },
    {
      name: 'DisplayListPage',
      label: 'History',
      iconFocused: 'grid',
      iconUnfocused: 'grid-outline',
    },
    {
      name: 'Profile',
      label: 'Profile',
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
    <View style={[styles.container, props.style]}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabItem}
            onPress={() => handlePress(tab.name)}
            activeOpacity={0.75}
            accessibilityLabel={tab.label}
            accessibilityRole="button">
            <Ionicons
              name={isActive ? tab.iconFocused : tab.iconUnfocused}
              size={24}
              color={isActive ? '#ffffff' : '#d1e0ee'}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    backgroundColor: '#0A66C2',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    marginTop: 2,
    color: '#ffffff',
  },
  labelActive: {
    fontWeight: '600',
  },
});
