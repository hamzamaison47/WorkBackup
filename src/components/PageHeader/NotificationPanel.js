// export default NotificationPanel;
/* eslint-disable curly */
import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Modal,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {updateNotificationByRecID} from '../../API/Notification/UpdateNotificationByRecID';

// ─── AppComponents imports ────────────────────────────────────────────────────
import {
  PageBackground,
  AnimatedCard,
  CardHeading,
  BadgePill,
  Divider,
  EmptyState,
  IconBadge,
} from '../AppComponentsDesign/Appcomponents';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
const PANEL_WIDTH = SCREEN_WIDTH * 0.88;

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  navy: '#0A66C2',
  blue: '#0A66C2',
  blueSoft: '#E8F1FB',
  blueLight: '#C8DEFA',
  accent: '#3B82F6',
  success: '#10B981',
  warn: '#F59E0B',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFF',
  border: '#E8EFF8',
  text: '#1E293B',
  textSub: '#64748B',
  textMute: '#94A3B8',
  unreadDot: '#EF4444',
  todayBg: '#EFF6FF',
  todayBorder: '#BFDBFE',
  shadow: 'rgba(10, 102, 194, 0.10)',
};

const TYPE_CONFIG = {
  // your existing ones unchanged...
  SalarySlip: {
    icon: 'money',
    color: '#10B981',
    bg: '#D1FAE5',
    label: 'Payroll',
  },
  LeaveRequest: {
    icon: 'calendar',
    color: '#8B5CF6',
    bg: '#EDE9FE',
    label: 'Leave',
  },
  Expense: {
    icon: 'credit-card',
    color: '#F59E0B',
    bg: '#FEF3C7',
    label: 'Expense',
  },

  // 👇 ADD THESE
  Success: {
    icon: 'check-circle',
    color: '#10B981',
    bg: '#D1FAE5',
    label: 'Success',
  },
  Error: {
    icon: 'times-circle',
    color: '#DC2626',
    bg: '#FEE2E2',
    label: 'Error',
  },
  Delete: {icon: 'trash', color: '#DC2626', bg: '#FEE2E2', label: 'Deleted'},
  Firebase: {icon: 'bell', color: '#0A66C2', bg: '#E8F1FB', label: 'Push'},
  Info: {icon: 'info-circle', color: '#0A66C2', bg: '#E8F1FB', label: 'Info'},

  default: {icon: 'bell', color: '#0A66C2', bg: '#E8F1FB', label: 'System'},
};

const getTypeConfig = type => TYPE_CONFIG[type] || TYPE_CONFIG.default;

// ─── Main Component ──────────────────────────────────────────────────────────
const NotificationPanel = ({
  visible,
  notifications,
  onClose,
  onRefresh,
  employeeId,
  onMarkLocalRead,
  onClearAll, // 👈 ADD
}) => {
  const slideAnim = useRef(new Animated.Value(PANEL_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(0.97)).current;

  const [loadingStates, setLoadingStates] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processedNotifications, setProcessedNotifications] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});

  const toggleExpand = recId => {
    setExpandedItems(prev => ({...prev, [recId]: !prev[recId]}));
  };

  // ── Process notifications ──────────────────────────────────────────────────
  useEffect(() => {
    if (!notifications || !Array.isArray(notifications)) {
      setProcessedNotifications([]);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sorted = [...notifications].sort(
      (a, b) => new Date(b.CreatedDateTime) - new Date(a.CreatedDateTime),
    );

    const processed = sorted.map(n => {
      const nDate = new Date(n.CreatedDateTime);
      nDate.setHours(0, 0, 0, 0);
      return {
        ...n,
        isToday: nDate.getTime() === today.getTime(),
        isRead:
          n.NotificationActivityStatus === 'Read' || n.EmailStatus === 'Sent',
        notificationText:
          n.NotificationText || `${n.EmailLogType} — ${n.EmployeeName}`,
        typeConfig: getTypeConfig(n.EmailLogType),
      };
    });

    setProcessedNotifications(processed);
  }, [notifications]);

  // ── Open / close animation ─────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      // Auto-mark all as read when panel opens
      const unread = processedNotifications.filter(n => !n.isRead);
      if (unread.length) {
        const localUnread = unread.filter(n => n.source === 'local');
        const apiUnread = unread.filter(n => n.source !== 'local');
        localUnread.forEach(n => onMarkLocalRead?.(n.RecId));
        if (apiUnread.length) {
          updateNotificationByRecID(apiUnread.map(n => n.RecId))
            .then(() => onRefresh?.())
            .catch(e => console.error('Auto mark read error:', e));
        }
      }

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 2,
          speed: 16,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.spring(headerScale, {
          toValue: 1,
          useNativeDriver: true,
          bounciness: 3,
          speed: 14,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: PANEL_WIDTH,
          useNativeDriver: true,
          bounciness: 0,
          speed: 18,
        }),
        Animated.spring(fadeAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
          speed: 18,
        }),
        Animated.spring(headerScale, {
          toValue: 0.97,
          useNativeDriver: true,
          bounciness: 0,
          speed: 18,
        }),
      ]).start();
    }
  }, [
    fadeAnim,
    headerScale,
    onMarkLocalRead,
    onRefresh,
    processedNotifications,
    slideAnim,
    visible,
  ]); // keep deps as just visible to avoid re-triggering on processedNotifications change

  // ── Actions ────────────────────────────────────────────────────────────────
  // Update handleMarkAsRead — replace the existing one:
  const handleMarkAsRead = async notification => {
    if (!notification.RecId || notification.isRead) return;
    setLoadingStates(prev => ({...prev, [notification.RecId]: true}));
    try {
      if (notification.source === 'local') {
        // Local only — no API call needed
        onMarkLocalRead?.(notification.RecId);
      } else {
        // Your existing API call — unchanged
        await updateNotificationByRecID(notification.RecId);
        if (onRefresh) await onRefresh();
      }
    } catch (e) {
      console.error('Error marking as read:', e);
    } finally {
      setLoadingStates(prev => ({...prev, [notification.RecId]: false}));
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const todayList = processedNotifications.filter(n => n.isToday);
  const olderList = processedNotifications.filter(n => !n.isToday);
  const unreadCount = processedNotifications.filter(n => !n.isRead).length;

  // ── Render helpers ─────────────────────────────────────────────────────────
  const renderItem = ({item, index}) => {
    const cfg = item.typeConfig;
    const isLoading = loadingStates[item.RecId];

    return (
      <Animated.View>
        <TouchableOpacity
          activeOpacity={0.72}
          onPress={() => handleMarkAsRead(item)}
          disabled={item.isRead || isLoading}
          style={[
            styles.notifItem,
            item.isToday && styles.notifItemToday,
            item.isRead && styles.notifItemRead,
          ]}>
          {/* Unread accent bar */}
          {!item.isRead && <View style={styles.unreadBar} />}

          {/* Icon Badge */}
          <View style={[styles.iconWrap, {backgroundColor: cfg.bg}]}>
            <FontAwesome name={cfg.icon} size={16} color={cfg.color} />
          </View>

          {/* Body */}
          <View style={styles.notifBody}>
            <View style={styles.notifTopRow}>
              <View style={[styles.typePill, {backgroundColor: cfg.bg}]}>
                <Text style={[styles.typePillText, {color: cfg.color}]}>
                  {cfg.label}
                </Text>
              </View>
              <Text style={styles.notifTime}>
                {formatTime(item.CreatedDateTime)}
              </Text>
            </View>

            {/* Title for Firebase notifications */}
            {item.NotificationTitle ? (
              <Text style={styles.notifTitle} numberOfLines={1}>
                {item.NotificationTitle}
              </Text>
            ) : null}

            {/* Expandable message text */}
            <Text
              style={[styles.notifText, !item.isRead && styles.notifTextUnread]}
              numberOfLines={expandedItems[item.RecId] ? undefined : 3}>
              {item.notificationText}
            </Text>

            {/* Show more / Show less — only renders if text is long */}
            {item.notificationText?.length > 120 && (
              <TouchableOpacity
                onPress={() => toggleExpand(item.RecId)}
                hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}
                style={styles.showMoreBtn}>
                <Text style={[styles.showMoreText, {color: cfg.color}]}>
                  {expandedItems[item.RecId] ? 'Show less ▲' : 'Show more ▼'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Read toggle */}
          <TouchableOpacity
            style={styles.readToggle}
            onPress={() => handleMarkAsRead(item)}
            disabled={item.isRead || isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color={T.blue} />
            ) : (
              <View
                style={[
                  styles.readDot,
                  item.isRead ? styles.readDotDone : styles.readDotPending,
                ]}>
                {item.isRead && (
                  <Ionicons name="checkmark" size={10} color="#fff" />
                )}
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Subtle divider between items (not after last) */}
        <View style={styles.itemDivider} />
      </Animated.View>
    );
  };

  const renderSectionLabel = (title, count, isToday) => (
    <View style={styles.sectionLabel}>
      <View style={styles.sectionLabelLeft}>
        <View style={[styles.sectionDot, isToday && styles.sectionDotToday]} />
        <Text
          style={[styles.sectionTitle, isToday && styles.sectionTitleToday]}>
          {title}
        </Text>
      </View>
      <View style={[styles.countPill, isToday && styles.countPillToday]}>
        <Text
          style={[styles.countPillText, isToday && styles.countPillTextToday]}>
          {count}
        </Text>
      </View>
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}>
      {/* Dimmed backdrop */}
      <Animated.View style={[styles.backdrop, {opacity: fadeAnim}]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      {/* Sliding panel */}
      <Animated.View
        style={[styles.panel, {transform: [{translateX: slideAnim}]}]}>
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <Animated.View
          style={[styles.header, {transform: [{scale: headerScale}]}]}>
          <View style={styles.headerTop}>
            {/* Close */}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>

            {/* Title block */}
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Notifications</Text>
              <Text style={styles.headerSub}>
                {processedNotifications.length > 0
                  ? `${processedNotifications.length} notification${
                      processedNotifications.length > 1 ? 's' : ''
                    }`
                  : 'All caught up'}
              </Text>
            </View>

            {/* Clear all button */}
            <TouchableOpacity
              onPress={onClearAll}
              disabled={processedNotifications.length === 0}
              activeOpacity={0.75}
              style={[
                styles.clearBtn,
                processedNotifications.length === 0 && styles.clearBtnDisabled,
              ]}>
              <Ionicons
                name="trash-outline"
                size={14}
                color={
                  processedNotifications.length === 0
                    ? 'rgba(255,255,255,0.3)'
                    : '#fff'
                }
              />
              <Text
                style={[
                  styles.clearBtnText,
                  processedNotifications.length === 0 &&
                    styles.clearBtnTextDisabled,
                ]}>
                Clear
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── List ───────────────────────────────────────────────────────── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={T.blue}
              colors={[T.blue]}
            />
          }>
          {processedNotifications.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconCircle}>
                <Ionicons
                  name="notifications-off-outline"
                  size={36}
                  color={T.textMute}
                />
              </View>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySubtitle}>
                You're all caught up. New notifications will appear here.
              </Text>
            </View>
          ) : (
            <>
              {todayList.length > 0 && (
                <AnimatedCard delay={0} style={styles.sectionCard}>
                  {renderSectionLabel('Today', todayList.length, true)}
                  <FlatList
                    data={todayList}
                    renderItem={renderItem}
                    keyExtractor={item => `today-${item.RecId}`}
                    scrollEnabled={false}
                  />
                </AnimatedCard>
              )}

              {olderList.length > 0 && (
                <AnimatedCard delay={60} style={styles.sectionCard}>
                  {renderSectionLabel('Earlier', olderList.length, false)}
                  <FlatList
                    data={olderList}
                    renderItem={renderItem}
                    keyExtractor={item => `older-${item.RecId}`}
                    scrollEnabled={false}
                  />
                </AnimatedCard>
              )}
            </>
          )}

          <View style={{height: 32}} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Backdrop
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 27, 62, 0.45)',
  },

  // Panel
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: PANEL_WIDTH,
    backgroundColor: T.surfaceAlt,
    shadowColor: T.navy,
    shadowOffset: {width: -4, height: 0},
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 24,
  },

  // Header
  header: {
    backgroundColor: T.navy,
    paddingTop: (StatusBar.currentHeight || 44) + 10,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerCenter: {flex: 1},
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 1,
    fontWeight: '500',
  },
  bellWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: T.unreadDot,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: T.navy,
  },
  bellBadgeText: {fontSize: 9, color: '#fff', fontWeight: '700'},

  // Mark all button
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 5,
  },
  markAllBtnDisabled: {backgroundColor: 'rgba(255,255,255,0.25)'},
  markAllText: {fontSize: 12, color: T.blue, fontWeight: '600'},
  markAllTextDisabled: {color: T.textMute},

  // Scroll
  scroll: {flex: 1},
  scrollContent: {padding: 12, paddingTop: 14},

  // Section card (uses AnimatedCard from AppComponents)
  sectionCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: T.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },

  // Section label
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.surfaceAlt,
  },
  sectionLabelLeft: {flexDirection: 'row', alignItems: 'center', gap: 7},
  sectionDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: T.textMute,
  },
  sectionDotToday: {backgroundColor: T.blue},
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: T.textSub,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  sectionTitleToday: {color: T.blue},
  countPill: {
    backgroundColor: T.border,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countPillToday: {backgroundColor: T.blueSoft},
  countPillText: {fontSize: 11, fontWeight: '700', color: T.textSub},
  countPillTextToday: {color: T.blue},

  // Notification item
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: T.surface,
    position: 'relative',
  },
  notifItemToday: {backgroundColor: '#FAFCFF'},
  notifItemRead: {opacity: 0.75},

  unreadBar: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderRadius: 2,
    backgroundColor: T.blue,
  },

  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
    flexShrink: 0,
  },

  notifBody: {flex: 1, marginRight: 8},
  notifTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  typePill: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  typePillText: {fontSize: 10, fontWeight: '700', letterSpacing: 0.3},

  notifTime: {fontSize: 10, color: T.textMute, fontWeight: '500'},
  notifText: {
    fontSize: 12.5,
    color: T.textSub,
    lineHeight: 17,
    fontWeight: '400',
  },
  notifTextUnread: {color: T.text, fontWeight: '600'},

  // Read dot toggle
  readToggle: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  readDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readDotPending: {
    borderWidth: 2,
    borderColor: T.blueLight,
    backgroundColor: 'transparent',
  },
  readDotDone: {backgroundColor: T.success},

  // Item divider
  itemDivider: {
    height: 1,
    backgroundColor: T.border,
    marginLeft: 65, // aligns with text, skips icon area
    opacity: 0.6,
  },

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: T.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: T.textMute,
    textAlign: 'center',
    lineHeight: 18,
  },
  notifTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: T.text,
    marginBottom: 3,
  },
  showMoreBtn: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  showMoreText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  clearBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  clearBtnTextDisabled: {
    color: 'rgba(255,255,255,0.3)',
  },
});

// ─── Time formatter ───────────────────────────────────────────────────────────
const formatTime = dateString => {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
};

export default NotificationPanel;
