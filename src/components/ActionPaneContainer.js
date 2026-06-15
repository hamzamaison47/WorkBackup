import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  BackHandler,
  StyleSheet,
  Keyboard,
  TextInput,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import {translate as t} from '../store/utils/translate';
import {
  markInAppNotificationRead,
  clearInAppNotifications,
} from '../store/slices/firebaseSlice';

import {
  setSelectedLegalEntity,
  resetCompanyState,
} from '../store/slices/companySlice';
import {setMenuItems} from '../store/slices/menuItemSlice';

import AlertModal from './Alert/AlertModal';
import LogoutAlertModal from './Alert/LogoutAlertModal';
import MainPageHeader from './PageHeader/MainPageHeader';
import NotificationPanel from './PageHeader/NotificationPanel';
import CompanyDropdown from './PageHeader/CompanyDropdown';
import ActionPaneMenuModal from './ActionPaneMenuModal';
import SearchBar from './SearchBar';

import CustomTabBar from '../Controller/CustomTabBar';
import {fetchEmployeeMenuItemsByCompany} from '../Controller/authUtils';
import {RetrieveEmployeeNotification} from '../API/Notification/RetriveEmployeeNotification';
import styles from '../styles/styles';

import {AppTokens} from './AppComponentsDesign/Appcomponents';
import useAppTokens from './AppComponentsDesign/useAppTokens';
import {
  conditionalScale,
  conditionalVerticalScale,
  conditionalFontScale,
} from '../store/utils/scaling';

const PILL_COLORS = {
  All: {
    active: AppTokens.blue,
    bg: AppTokens.blueBg,
    text: AppTokens.blue,
    dot: null,
  },
  Draft: {
    active: AppTokens.slate,
    bg: AppTokens.slateBg,
    text: AppTokens.slate,
    dot: AppTokens.slate,
  },
  Pending: {
    active: AppTokens.amber,
    bg: AppTokens.amberBg,
    text: '#92400E',
    dot: AppTokens.amber,
  },
  'In review': {
    active: AppTokens.amber,
    bg: AppTokens.amberBg,
    text: '#92400E',
    dot: AppTokens.amber,
  },
  'In Review': {
    active: AppTokens.amber,
    bg: AppTokens.amberBg,
    text: '#92400E',
    dot: AppTokens.amber,
  },
  'Pending Approval': {
    active: AppTokens.amber,
    bg: AppTokens.amberBg,
    text: '#92400E',
    dot: AppTokens.amber,
  },
  Approved: {
    active: AppTokens.green,
    bg: AppTokens.greenBg,
    text: '#065F46',
    dot: AppTokens.green,
  },
  Rejected: {
    active: AppTokens.red,
    bg: AppTokens.redBg,
    text: '#991B1B',
    dot: AppTokens.red,
  },
  Completed: {
    active: AppTokens.purple,
    bg: AppTokens.purpleBg,
    text: '#4C1D95',
    dot: AppTokens.purple,
  },
};

const DEFAULT_PILLS = [
  'All',
  'Draft',
  'Pending',
  'Approved',
  'Rejected',
  'Completed',
];

// ─────────────────────────────────────────────────────────────────────────────
//  SubHeader
// ─────────────────────────────────────────────────────────────────────────────
const SubHeader = ({
  pageTitle,
  showSearchBar,
  onSearchChange,
  onSortChange,
  activeSortOrder,
  searchPlaceholder,
  showFilterPills,
  filterPills,
  activeFilter,
  onFilterChange,
  filterCounts,
}) => {
  // ✅ useAppTokens inside component — reactive to theme changes
  const T = useAppTokens();

  const [expanded, setExpanded] = useState(true);
  const [query, setQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(null);

  const chevronAnim = useRef(new Animated.Value(1)).current;
  const expandAnim = useRef(new Animated.Value(1)).current;
  const hasExpandable =
    showSearchBar || (showFilterPills && filterPills?.length > 0);

  const toggleExpand = () => {
    const toValue = expanded ? 0 : 1;
    Animated.spring(chevronAnim, {
      toValue,
      useNativeDriver: true,
      tension: 160,
      friction: 14,
    }).start();
    Animated.timing(expandAnim, {
      toValue,
      duration: 80,
      useNativeDriver: true,
    }).start();
    setExpanded(prev => !prev);
  };

  const handleQueryChange = text => {
    setQuery(text);
    onSearchChange?.(text);
  };

  const chevronRotation = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const activeFilterLabel =
    activeFilter && activeFilter !== 'All' ? activeFilter : null;
  const activeCount = filterCounts?.[activeFilter];

  // ✅ Styles computed inside render — use T values, never frozen
  const wrapperStyle = {
    backgroundColor: T.cardBg,
    shadowColor: T.shadowColor,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 4,
    borderBottomWidth: 1,
    borderBottomColor: T.cardDivider,
  };

  const searchBoxStyle = {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.pageBg,
    borderRadius: conditionalScale(9, 9, 10, 10),
    paddingHorizontal: conditionalScale(10, 11, 12, 12),
    height: conditionalVerticalScale(36, 37, 38, 38),
    gap: conditionalScale(6, 7, 8, 8),
  };

  const searchInputStyle = {
    flex: 1,
    fontSize: conditionalFontScale(12, 13, 13, 14),
    color: T.titleText,
    paddingVertical: 0,
  };

  const titleTextStyle = {
    fontSize: conditionalFontScale(13, 14, 14, 15),
    fontWeight: '700',
    color: T.titleText,
    letterSpacing: -0.1,
  };

  return (
    <View style={wrapperStyle}>
      {/* ── Always-visible title row ── */}
      <TouchableOpacity
        onPress={hasExpandable ? toggleExpand : undefined}
        activeOpacity={hasExpandable ? 0.72 : 1}
        style={SH.titleRow}>
        <View style={SH.titleLeft}>
          <View style={SH.titleMeta}>
            <Text style={titleTextStyle} numberOfLines={1}>
              {pageTitle}
            </Text>
            {!expanded && activeFilterLabel && (
              <View style={SH.collapsedPill}>
                <View
                  style={[
                    SH.collapsedDot,
                    {
                      backgroundColor: (
                        PILL_COLORS[activeFilterLabel] ?? PILL_COLORS.All
                      ).active,
                    },
                  ]}
                />
                <Text
                  style={[
                    SH.collapsedPillText,
                    {
                      color: (PILL_COLORS[activeFilterLabel] ?? PILL_COLORS.All)
                        .active,
                    },
                  ]}>
                  {activeFilterLabel}
                  {activeCount ? ` · ${activeCount}` : ''}
                </Text>
              </View>
            )}
            {!expanded && query.length > 0 && (
              <View style={SH.collapsedSearch}>
                <FeatherIcon
                  name="search"
                  size={conditionalFontScale(9, 9, 10, 10)}
                  color={T.blue}
                />
                <Text
                  style={[SH.collapsedSearchText, {color: T.blue}]}
                  numberOfLines={1}>
                  {query}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={SH.titleRight}>
          {hasExpandable && (
            <Animated.View style={{transform: [{rotate: chevronRotation}]}}>
              <FeatherIcon
                name="chevron-down"
                size={conditionalFontScale(14, 15, 15, 16)}
                color={expanded ? T.blue : T.subtitleText}
              />
            </Animated.View>
          )}
        </View>
      </TouchableOpacity>

      {/* ── Expandable body ── */}
      {expanded && (
        <Animated.View style={{opacity: expandAnim}}>
          {showSearchBar && (
            <View style={SH.searchRow}>
              <View style={searchBoxStyle}>
                <FeatherIcon
                  name="search"
                  size={conditionalFontScale(13, 14, 14, 15)}
                  color={T.subtitleText}
                />
                <TextInput
                  style={searchInputStyle}
                  placeholder={searchPlaceholder || 'Search…'}
                  placeholderTextColor={T.subtitleText}
                  value={query}
                  onChangeText={handleQueryChange}
                  returnKeyType="search"
                  autoFocus={false}
                />
                {query.length > 0 && (
                  <TouchableOpacity
                    onPress={() => handleQueryChange('')}
                    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                    <FeatherIcon
                      name="x"
                      size={conditionalFontScale(12, 13, 13, 14)}
                      color={T.subtitleText}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Filter pills */}
          {showFilterPills && filterPills?.length > 0 && (
            <>
              <View
                style={[SH.pillsDivider, {backgroundColor: T.cardDivider}]}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={SH.pillsScroll}>
                {filterPills.map(pill => {
                  const isActive = activeFilter === pill;
                  const color = PILL_COLORS[pill] ?? PILL_COLORS.All;
                  const count = filterCounts?.[pill];
                  return (
                    <TouchableOpacity
                      key={pill}
                      onPress={() => onFilterChange?.(pill)}
                      activeOpacity={0.75}
                      style={[
                        SH.pill,
                        {
                          backgroundColor: isActive ? color.active : color.bg,
                          borderColor: isActive ? color.active : 'transparent',
                        },
                      ]}>
                      {pill !== 'All' && color.dot && (
                        <View
                          style={[
                            SH.dot,
                            {backgroundColor: isActive ? '#fff' : color.dot},
                          ]}
                        />
                      )}
                      <Text
                        style={[
                          SH.pillText,
                          {color: isActive ? '#fff' : color.text},
                        ]}>
                        {pill}
                      </Text>
                      {count !== undefined && count > 0 && (
                        <View
                          style={[
                            SH.countBadge,
                            {
                              backgroundColor: isActive
                                ? 'rgba(255,255,255,0.28)'
                                : color.active,
                            },
                          ]}>
                          <Text style={SH.countText}>{count}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}
        </Animated.View>
      )}
    </View>
  );
};

// ✅ Only layout/spacing styles remain in StyleSheet — no colors
const SH = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: conditionalScale(14, 15, 16, 16),
    paddingVertical: conditionalVerticalScale(9, 10, 11, 11),
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: conditionalScale(10, 11, 12, 12),
    flex: 1,
  },
  titleMeta: {
    flex: 1,
    gap: conditionalVerticalScale(2, 2, 3, 3),
  },
  collapsedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: conditionalScale(4, 4, 5, 5),
  },
  collapsedDot: {
    width: conditionalScale(5, 5, 6, 6),
    height: conditionalScale(5, 5, 6, 6),
    borderRadius: 99,
  },
  collapsedPillText: {
    fontSize: conditionalFontScale(10, 10, 11, 11),
    fontWeight: '600',
  },
  collapsedSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: conditionalScale(3, 4, 4, 4),
  },
  collapsedSearchText: {
    fontSize: conditionalFontScale(10, 10, 11, 11),
    fontWeight: '500',
    flex: 1,
  },
  titleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: conditionalScale(8, 9, 10, 10),
    flexShrink: 0,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: conditionalScale(14, 15, 16, 16),
    paddingBottom: conditionalVerticalScale(9, 10, 11, 11),
    gap: conditionalScale(8, 9, 10, 10),
  },
  pillsDivider: {
    height: 1,
    marginHorizontal: conditionalScale(14, 15, 16, 16),
  },
  pillsScroll: {
    paddingHorizontal: conditionalScale(12, 13, 14, 14),
    paddingVertical: conditionalVerticalScale(8, 9, 10, 10),
    gap: conditionalScale(6, 7, 8, 8),
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: conditionalScale(10, 11, 12, 12),
    paddingVertical: conditionalVerticalScale(5, 5, 6, 6),
    borderRadius: 99,
    borderWidth: 1.5,
    gap: conditionalScale(4, 5, 5, 5),
  },
  dot: {
    width: conditionalScale(5, 6, 6, 7),
    height: conditionalScale(5, 6, 6, 7),
    borderRadius: 99,
  },
  pillText: {
    fontSize: conditionalFontScale(11, 11, 12, 12),
    fontWeight: '600',
  },
  countBadge: {
    paddingHorizontal: conditionalScale(5, 5, 6, 6),
    paddingVertical: 1,
    borderRadius: 99,
    minWidth: conditionalScale(16, 17, 18, 18),
    alignItems: 'center',
  },
  countText: {
    fontSize: conditionalFontScale(10, 10, 11, 11),
    fontWeight: '700',
    color: '#fff',
  },
});

export const FilterPills = ({
  pills = DEFAULT_PILLS,
  activeFilter,
  onFilterChange,
  counts = {},
}) => (
  <SubHeader
    showFilterPills
    filterPills={pills}
    activeFilter={activeFilter}
    onFilterChange={onFilterChange}
    filterCounts={counts}
  />
);

// ─────────────────────────────────────────────────────────────────────────────
//  ActionPaneContainer
// ─────────────────────────────────────────────────────────────────────────────
const ActionPaneContainer = ({
  children,
  pageTitle,
  showFloatingButton = false,
  isHeaderActive = true,
  showTabNavigator = true,
  onFloatingButtonPress,
  onRefresh,
  onBackPress,
  showPageTitleRow = false,
  showSearchBar = false,
  onSearchChange = () => {},
  onSortChange = () => {},
  activeSortOrder = null,
  searchPlaceholder = 'Search...',
  showDocumentTypeFilter = false,
  documentTypes = [],
  selectedDocumentType = null,
  onDocumentTypeChange = () => {},
  showFilterPills = false,
  filterPills = DEFAULT_PILLS,
  activeFilter = 'All',
  onFilterChange = () => {},
  filterCounts = {},
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [activeTab, setActiveTab] = useState('MainDashboard');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [headerMenuVisible, setHeaderMenuVisible] = useState(false);

  const navigation = useNavigation();
  const dispatch = useDispatch();
  const T = useAppTokens();

  const {selectedLegalEntity, defaultLegalEntity, legalEntities} = useSelector(
    state => state.company,
  );
  const {userData} = useSelector(state => state.user);

  // 👇 ADD THESE here, inside ActionPaneContainer
  const inAppNotifications = useSelector(
    state => state.firebase.inAppNotifications,
  );
  const allNotifications = [...inAppNotifications, ...notifications];
  const totalUnreadCount =
    inAppNotifications.filter(n => n.NotificationActivityStatus === 'Unread')
      .length + notificationCount;

  useEffect(() => {
    const unsubscribe = navigation.addListener('state', () => {
      const state = navigation.getState();
      const currentRoute = state?.routes?.[state?.index];
      setActiveTab(currentRoute?.name || 'MainDashboard');
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const closeAllOverlays = useCallback(() => {
    setDropdownVisible(false);
    setNotificationVisible(false);
    setModalVisible(false);
    navigation.closeDrawer?.();
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPressHandler = () => {
        navigation.goBack();
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPressHandler);
      return () =>
        BackHandler.removeEventListener(
          'hardwareBackPress',
          onBackPressHandler,
        );
    }, [navigation]),
  );

  const fetchNotifications = useCallback(async () => {
    try {
      if (!userData?.employeeId) {
        return;
      }
      const data = await RetrieveEmployeeNotification({
        employeeId: userData.employeeId,
      });
      if (Array.isArray(data)) {
        setNotifications(data);
        setNotificationCount(data.length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [userData?.employeeId]);

  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    fetchNotifications();
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const toggleDrawer = useCallback(() => {
    closeAllOverlays();
    navigation.toggleDrawer?.();
  }, [closeAllOverlays, navigation]);
  const toggleNotification = () => {
    setDropdownVisible(false);
    setNotificationVisible(prev => !prev);
  };
  const handleLogout = () => {
    closeAllOverlays();
    setModalVisible(true);
  };
  const confirmLogout = () => {
    dispatch(resetCompanyState());
    setModalVisible(false);
    navigation.navigate('Login');
  };
  const handleTabPress = tabName => {
    setActiveTab(tabName);
    navigation.navigate(tabName, {userData});
  };

  useLayoutEffect(() => {
    if (isHeaderActive) {
      const headerOptions = MainPageHeader({
        onToggleDrawer: toggleDrawer,
        onTitle: pageTitle,
        onShowNotify: toggleNotification,
        onCount: totalUnreadCount,
        headerBg: T.blue,
        onHeaderMenuPress: () => setHeaderMenuVisible(true),
        isBack: false,
        onBackPress: onBackPress,
        selectedDat:
          selectedLegalEntity ||
          defaultLegalEntity ||
          t('actionPane.selectCompany'),
        defaultDat: defaultLegalEntity,
      });
      navigation.setOptions(headerOptions);
    }
  }, [
    navigation,
    pageTitle,
    selectedLegalEntity,
    defaultLegalEntity,
    isHeaderActive,
    toggleDrawer,
    T.blue,
    onBackPress,
    totalUnreadCount,
  ]);

  const handleCompanySelect = async newLegalEntity => {
    setDropdownVisible(false);
    try {
      dispatch(setSelectedLegalEntity(newLegalEntity));
      const newMenuItems = await fetchEmployeeMenuItemsByCompany(
        userData?.Person,
        newLegalEntity,
      );
      dispatch(setMenuItems(newMenuItems));
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      dispatch(setSelectedLegalEntity(selectedLegalEntity));
      setAlertMessage(t('actionPane.companyChangeFailed'));
      setAlertModal(true);
    }
  };

  // ✅ FAB style uses T.blue and T.shadowColor — reactive
  const fabStyle = {
    position: 'absolute',
    bottom: conditionalVerticalScale(100, 104, 108, 108),
    right: conditionalScale(20, 22, 24, 24),
    width: conditionalScale(52, 54, 56, 56),
    height: conditionalScale(52, 54, 56, 56),
    borderRadius: 99,
    backgroundColor: T.blue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: T.shadowColor,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 10,
  };

  return (
    <View style={[styles.APCont_container, {backgroundColor: T.pageBg}]}>
      <View style={[styles.APCont_content, {backgroundColor: T.pageBg}]}>
        {(showPageTitleRow || showFilterPills) && (
          <SubHeader
            pageTitle={pageTitle}
            showSearchBar={showSearchBar && showPageTitleRow}
            onSearchChange={onSearchChange}
            onSortChange={onSortChange}
            activeSortOrder={activeSortOrder}
            searchPlaceholder={searchPlaceholder}
            showFilterPills={showFilterPills}
            filterPills={filterPills}
            activeFilter={activeFilter}
            onFilterChange={onFilterChange}
            filterCounts={filterCounts}
          />
        )}

        <View style={AC.childrenArea}>{children}</View>
      </View>

      {showTabNavigator && !keyboardVisible && (
        <CustomTabBar activeTab={activeTab} onTabPress={handleTabPress} />
      )}

      {showFloatingButton && (
        <TouchableOpacity
          onPress={onFloatingButtonPress}
          activeOpacity={0.85}
          style={fabStyle}>
          <FeatherIcon
            name="plus"
            size={conditionalFontScale(20, 22, 24, 24)}
            color="#fff"
          />
        </TouchableOpacity>
      )}

      <AlertModal
        visible={alertModal}
        heading={t('common.alert')}
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
      <LogoutAlertModal
        visible={modalVisible}
        heading={t('profile.logoutConfirm')}
        text={t('profile.logoutConfirm')}
        onConfirm={confirmLogout}
        onCancel={() => setModalVisible(false)}
      />
      <NotificationPanel
        visible={notificationVisible}
        notifications={allNotifications}
        onClose={() => setNotificationVisible(false)}
        onRefresh={fetchNotifications}
        employeeId={userData?.employeeId}
        onMarkLocalRead={(
          recId, // 👈 ADD this prop
        ) => dispatch(markInAppNotificationRead(recId))}
        onClearAll={() => dispatch(clearInAppNotifications())}
      />
      <ActionPaneMenuModal
        visible={headerMenuVisible}
        onClose={() => setHeaderMenuVisible(false)}
        onLogout={handleLogout}
        legalEntities={legalEntities}
        selectedLegalEntity={selectedLegalEntity || defaultLegalEntity}
        onCompanySelect={handleCompanySelect}
      />
    </View>
  );
};

// ✅ Only layout — no colors
const AC = StyleSheet.create({
  childrenArea: {
    flex: 1,
  },
});

export default ActionPaneContainer;
