// /* eslint-disable curly */
// import React, {useState, useEffect} from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   ScrollView,
//   Animated,
//   Modal,
//   ActivityIndicator,
//   FlatList,
//   RefreshControl,
// } from 'react-native';
// import FontAwesome from 'react-native-vector-icons/FontAwesome';
// import {updateNotificationByRecID} from '../../API/Notification/UpdateNotificationByRecID';
// import styles from '../../styles/styles';

// const NotificationPanel = ({
//   visible,
//   notifications,
//   onClose,
//   onRefresh,
//   employeeId,
// }) => {
//   const [slideAnim] = useState(new Animated.Value(0));
//   const [fadeAnim] = useState(new Animated.Value(0));
//   const [loadingStates, setLoadingStates] = useState({});
//   const [markAllLoading, setMarkAllLoading] = useState(false);
//   const [processedNotifications, setProcessedNotifications] = useState([]);

//   // Process and categorize notifications
//   useEffect(() => {
//     if (!notifications || !Array.isArray(notifications)) {
//       setProcessedNotifications([]);
//       return;
//     }

//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     // First sort by CreatedDateTime (newest first)
//     const sortedNotifications = [...notifications].sort((a, b) => {
//       return new Date(b.CreatedDateTime) - new Date(a.CreatedDateTime);
//     });

//     const processed = sortedNotifications.map(notification => {
//       const notificationDate = new Date(notification.CreatedDateTime);
//       notificationDate.setHours(0, 0, 0, 0);

//       const isToday = notificationDate.getTime() === today.getTime();

//       return {
//         ...notification,
//         createdAt: notification.CreatedDateTime,
//         isToday,
//         isRead:
//           notification.NotificationActivityStatus === 'Read' ||
//           notification.EmailStatus === 'Sent',
//         notificationText:
//           notification.NotificationText ||
//           `${notification.EmailLogType} - ${notification.EmployeeName}`,
//       };
//     });

//     setProcessedNotifications(processed);
//   }, [notifications]);

//   React.useEffect(() => {
//     if (visible) {
//       Animated.parallel([
//         Animated.timing(slideAnim, {
//           toValue: 1,
//           duration: 300,
//           useNativeDriver: true,
//         }),
//         Animated.timing(fadeAnim, {
//           toValue: 1,
//           duration: 300,
//           useNativeDriver: true,
//         }),
//       ]).start();
//     } else {
//       Animated.parallel([
//         Animated.timing(slideAnim, {
//           toValue: 0,
//           duration: 250,
//           useNativeDriver: true,
//         }),
//         Animated.timing(fadeAnim, {
//           toValue: 0,
//           duration: 250,
//           useNativeDriver: true,
//         }),
//       ]).start();
//     }
//   }, [visible, slideAnim, fadeAnim]);

//   const categorizeNotifications = () => {
//     const todayNotifications = [];
//     const olderNotifications = [];

//     processedNotifications.forEach(notification => {
//       if (notification.isToday) {
//         todayNotifications.push(notification);
//       } else {
//         olderNotifications.push(notification);
//       }
//     });

//     return {todayNotifications, olderNotifications};
//   };

//   const handleMarkAsRead = async notification => {
//     if (!notification.RecId || notification.isRead) return;

//     setLoadingStates(prev => ({...prev, [notification.RecId]: true}));

//     try {
//       await updateNotificationByRecID(notification.RecId);

//       if (onRefresh) await onRefresh();
//     } catch (error) {
//       console.error('Error marking notification as read:', error);
//     } finally {
//       setLoadingStates(prev => ({...prev, [notification.RecId]: false}));
//     }
//   };

//   const handleMarkAllAsRead = async () => {
//     const unreadNotifications = processedNotifications.filter(n => !n.isRead);
//     if (unreadNotifications.length === 0) return;

//     setMarkAllLoading(true);

//     try {
//       const unreadRecIds = unreadNotifications.map(n => n.RecId);

//       const result = await updateNotificationByRecID(unreadRecIds);

//       console.log('Mark all as read result:', result);

//       // Refresh the notifications list
//       if (onRefresh) await onRefresh();
//     } catch (error) {
//       console.error('Error marking all notifications as read:', error);
//     } finally {
//       setMarkAllLoading(false);
//     }
//   };

//   const [isRefreshing, setIsRefreshing] = useState(false);

//   const handleRefresh = async () => {
//     setIsRefreshing(true);
//     try {
//       if (onRefresh) await onRefresh();
//     } catch (error) {
//       console.error('Error refreshing:', error);
//     } finally {
//       setIsRefreshing(false);
//     }
//   };

//   const translateX = slideAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: [400, 0],
//   });

//   const {todayNotifications, olderNotifications} = categorizeNotifications();
//   const unreadCount = processedNotifications.filter(n => !n.isRead).length;

//   const renderNotificationItem = ({item}) => (
//     <View
//       style={[
//         styles.notif_NotificationItem,
//         item.isToday && styles.notif_NotificationItemToday,
//         item.isRead && styles.notif_NotificationItemRead,
//       ]}>
//       {/* Left Logo Container with overlapping button */}
//       <TouchableOpacity
//         style={styles.notif_LogoContainer}
//         onPress={() => handleMarkAsRead(item)}
//         disabled={item.isRead || loadingStates[item.RecId]}>
//         <View style={styles.notif_IconContainer}>
//           <FontAwesome
//             name={getIconName(item.EmailLogType)}
//             style={[
//               styles.notif_NotificationIcon,
//               item.isToday && styles.notif_NotificationIconToday,
//             ]}
//           />
//         </View>

//         {/* Mark as read button positioned at bottom-right of logo */}
//         <View style={styles.notif_MarkReadButtonContainer}>
//           <TouchableOpacity
//             style={[
//               styles.notif_MarkReadButton,
//               item.isToday && styles.notif_MarkReadButtonToday,
//               item.isRead && styles.notif_MarkReadButtonRead,
//               loadingStates[item.RecId] && styles.notif_MarkReadButtonDisabled,
//             ]}
//             onPress={() => handleMarkAsRead(item)}
//             disabled={item.isRead || loadingStates[item.RecId]}>
//             {loadingStates[item.RecId] ? (
//               <ActivityIndicator
//                 size="small"
//                 color={item.isToday ? '#ffffff' : '#0A66C2'}
//               />
//             ) : (
//               <FontAwesome
//                 name={item.isRead ? 'check-circle' : 'circle'}
//                 style={[
//                   styles.notif_MarkReadIcon,
//                   item.isToday && styles.notif_MarkReadIconToday,
//                   item.isRead && styles.notif_MarkReadIconRead,
//                 ]}
//               />
//             )}
//           </TouchableOpacity>
//         </View>
//       </TouchableOpacity>

//       {/* Content Container */}
//       <View style={styles.notif_ContentContainer}>
//         <Text
//           style={[
//             styles.notif_NotificationMessage,
//             item.isToday && styles.notif_NotificationMessageToday,
//           ]}>
//           {item.notificationText}
//         </Text>
//         <Text
//           style={[
//             styles.notif_NotificationTime,
//             item.isToday && styles.notif_NotificationTimeToday,
//           ]}>
//           {formatTime(item.CreatedDateTime)}
//         </Text>
//       </View>
//     </View>
//   );

//   const renderSectionHeader = (title, count) => (
//     <View style={styles.notif_SectionHeader}>
//       <Text style={styles.notif_SectionTitle}>{title}</Text>
//       <View style={styles.notif_CountBadge}>
//         <Text style={styles.notif_CountText}>{count}</Text>
//       </View>
//     </View>
//   );

//   if (!visible) return null;

//   return (
//     <Modal
//       visible={visible}
//       transparent
//       animationType="none"
//       onRequestClose={onClose}>
//       <Animated.View style={[styles.notif_Overlay, {opacity: fadeAnim}]}>
//         <TouchableOpacity
//           style={styles.notif_OverlayTouchable}
//           activeOpacity={1}
//           onPress={onClose}
//         />

//         <Animated.View
//           style={[styles.notif_Panel, {transform: [{translateX}]}]}>
//           <View style={styles.notif_Header}>
//             <View style={styles.notif_HeaderLeft}>
//               <FontAwesome name="bell" style={styles.notif_BellIcon} />
//               <View>
//                 <Text style={styles.notif_HeaderTitle}>Notifications</Text>
//                 <Text style={styles.notif_HeaderCount}>
//                   {unreadCount} unread
//                 </Text>
//               </View>
//             </View>

//             <View style={styles.notif_HeaderRight}>
//               {/* Mark All as Read Button */}
//               <TouchableOpacity
//                 onPress={handleMarkAllAsRead}
//                 style={[
//                   styles.notif_MarkAllButton,
//                   markAllLoading && styles.notif_MarkAllButtonDisabled,
//                 ]}
//                 disabled={unreadCount === 0 || markAllLoading}>
//                 {markAllLoading ? (
//                   <ActivityIndicator size="small" color="#ffffff" />
//                 ) : (
//                   <>
//                     <FontAwesome
//                       name="check"
//                       style={styles.notif_MarkAllIcon}
//                     />
//                     <Text style={styles.notif_MarkAllText}>Mark all read</Text>
//                   </>
//                 )}
//               </TouchableOpacity>
//             </View>
//           </View>

//           <ScrollView
//             style={styles.notif_ScrollView}
//             showsVerticalScrollIndicator={false}
//             refreshControl={
//               <RefreshControl
//                 refreshing={isRefreshing}
//                 onRefresh={handleRefresh}
//               />
//             }>
//             {processedNotifications.length === 0 ? (
//               <View style={styles.notif_EmptyContainer}>
//                 <FontAwesome name="bell-slash" style={styles.notif_EmptyIcon} />
//                 <Text style={styles.notif_EmptyText}>No notifications</Text>
//               </View>
//             ) : (
//               <>
//                 {todayNotifications.length > 0 && (
//                   <>
//                     {renderSectionHeader('Today', todayNotifications.length)}
//                     <FlatList
//                       data={todayNotifications}
//                       renderItem={renderNotificationItem}
//                       keyExtractor={item => `today-${item.RecId}`}
//                       scrollEnabled={false}
//                     />
//                   </>
//                 )}

//                 {olderNotifications.length > 0 && (
//                   <>
//                     {renderSectionHeader('Older', olderNotifications.length)}
//                     <FlatList
//                       data={olderNotifications}
//                       renderItem={renderNotificationItem}
//                       keyExtractor={item => `older-${item.RecId}`}
//                       scrollEnabled={false}
//                     />
//                   </>
//                 )}
//               </>
//             )}
//           </ScrollView>

//           <TouchableOpacity onPress={onClose} style={styles.notif_CloseButton}>
//             <FontAwesome name="times" style={styles.notif_CloseIcon} />
//           </TouchableOpacity>
//         </Animated.View>
//       </Animated.View>
//     </Modal>
//   );
// };

// // Helper function to get icon based on notification type
// const getIconName = emailLogType => {
//   switch (emailLogType) {
//     case 'SalarySlip':
//       return 'money';
//     case 'LeaveRequest':
//       return 'calendar';
//     case 'Expense':
//       return 'credit-card';
//     default:
//       return 'file-text-o';
//   }
// };

// const formatTime = dateString => {
//   if (!dateString) return 'Just now';

//   const date = new Date(dateString);
//   const now = new Date();
//   const diffMs = now - date;
//   const diffMins = Math.floor(diffMs / 60000);
//   const diffHours = Math.floor(diffMs / 3600000);
//   const diffDays = Math.floor(diffMs / 86400000);

//   if (diffMins < 1) return 'Just now';
//   if (diffMins < 60) return `${diffMins}m ago`;
//   if (diffHours < 24) return `${diffHours}h ago`;
//   if (diffDays === 1) return 'Yesterday';
//   if (diffDays < 7) return `${diffDays}d ago`;
//   return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
// };

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

// ─── Notification type configs ─────────────────────────────────────────────────
const TYPE_CONFIG = {
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
}) => {
  const slideAnim = useRef(new Animated.Value(PANEL_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(0.97)).current;

  const [loadingStates, setLoadingStates] = useState({});
  const [markAllLoading, setMarkAllLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processedNotifications, setProcessedNotifications] = useState([]);

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
  }, [visible, slideAnim, fadeAnim, headerScale]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleMarkAsRead = async notification => {
    if (!notification.RecId || notification.isRead) return;
    setLoadingStates(prev => ({...prev, [notification.RecId]: true}));
    try {
      await updateNotificationByRecID(notification.RecId);
      if (onRefresh) await onRefresh();
    } catch (e) {
      console.error('Error marking as read:', e);
    } finally {
      setLoadingStates(prev => ({...prev, [notification.RecId]: false}));
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = processedNotifications.filter(n => !n.isRead);
    if (!unread.length) return;
    setMarkAllLoading(true);
    try {
      await updateNotificationByRecID(unread.map(n => n.RecId));
      if (onRefresh) await onRefresh();
    } catch (e) {
      console.error('Error marking all read:', e);
    } finally {
      setMarkAllLoading(false);
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
            <Text
              style={[styles.notifText, !item.isRead && styles.notifTextUnread]}
              numberOfLines={2}>
              {item.notificationText}
            </Text>
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
            {/* Back / close */}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>

            {/* Title block */}
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Notifications</Text>
              <Text style={styles.headerSub}>
                {unreadCount > 0
                  ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`
                  : 'All caught up'}
              </Text>
            </View>

            {/* Bell with badge */}
            <View style={styles.bellWrap}>
              <Ionicons name="notifications" size={22} color="#fff" />
              {unreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Mark all read */}
          <TouchableOpacity
            style={[
              styles.markAllBtn,
              (unreadCount === 0 || markAllLoading) &&
                styles.markAllBtnDisabled,
            ]}
            onPress={handleMarkAllAsRead}
            disabled={unreadCount === 0 || markAllLoading}
            activeOpacity={0.75}>
            {markAllLoading ? (
              <ActivityIndicator size="small" color={T.blue} />
            ) : (
              <>
                <Ionicons
                  name="checkmark-done"
                  size={14}
                  color={unreadCount === 0 ? T.textMute : T.blue}
                />
                <Text
                  style={[
                    styles.markAllText,
                    unreadCount === 0 && styles.markAllTextDisabled,
                  ]}>
                  Mark all as read
                </Text>
              </>
            )}
          </TouchableOpacity>
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
    alignItems: 'center',
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
