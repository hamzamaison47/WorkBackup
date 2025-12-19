/* eslint-disable curly */
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Modal,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {updateNotificationByRecID} from '../../API/Notification/UpdateNotificationByRecID';

const NotificationPanel = ({
  visible,
  notifications,
  onClose,
  onRefresh,
  employeeId,
}) => {
  const [slideAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [loadingStates, setLoadingStates] = useState({});
  const [markAllLoading, setMarkAllLoading] = useState(false);
  const [processedNotifications, setProcessedNotifications] = useState([]);

  // Process and categorize notifications
  useEffect(() => {
    if (!notifications || !Array.isArray(notifications)) {
      setProcessedNotifications([]);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // First sort by CreatedDateTime (newest first)
    const sortedNotifications = [...notifications].sort((a, b) => {
      return new Date(b.CreatedDateTime) - new Date(a.CreatedDateTime);
    });

    const processed = sortedNotifications.map(notification => {
      const notificationDate = new Date(notification.CreatedDateTime);
      notificationDate.setHours(0, 0, 0, 0);

      const isToday = notificationDate.getTime() === today.getTime();

      return {
        ...notification,
        createdAt: notification.CreatedDateTime,
        isToday,
        isRead:
          notification.NotificationActivityStatus === 'Read' ||
          notification.EmailStatus === 'Sent',
        notificationText:
          notification.NotificationText ||
          `${notification.EmailLogType} - ${notification.EmployeeName}`,
      };
    });

    setProcessedNotifications(processed);
  }, [notifications]);

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  const categorizeNotifications = () => {
    const todayNotifications = [];
    const olderNotifications = [];

    processedNotifications.forEach(notification => {
      if (notification.isToday) {
        todayNotifications.push(notification);
      } else {
        olderNotifications.push(notification);
      }
    });

    return {todayNotifications, olderNotifications};
  };

  const handleMarkAsRead = async notification => {
    if (!notification.RecId || notification.isRead) return;

    setLoadingStates(prev => ({...prev, [notification.RecId]: true}));

    try {
      await updateNotificationByRecID(notification.RecId);

      if (onRefresh) await onRefresh();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setLoadingStates(prev => ({...prev, [notification.RecId]: false}));
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = processedNotifications.filter(n => !n.isRead);
    if (unreadNotifications.length === 0) return;

    setMarkAllLoading(true);

    try {
      const unreadRecIds = unreadNotifications.map(n => n.RecId);

      const result = await updateNotificationByRecID(unreadRecIds);

      console.log('Mark all as read result:', result);

      // Refresh the notifications list
      if (onRefresh) await onRefresh();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setMarkAllLoading(false);
    }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) await onRefresh();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  const {todayNotifications, olderNotifications} = categorizeNotifications();
  const unreadCount = processedNotifications.filter(n => !n.isRead).length;

  const renderNotificationItem = ({item}) => (
    <View
      style={[
        styles.notificationItem,
        item.isToday && styles.notificationItemToday,
        item.isRead && styles.notificationItemRead,
      ]}>
      {/* Left Logo Container with overlapping button */}
      <TouchableOpacity
        style={styles.logoContainer}
        onPress={() => handleMarkAsRead(item)}
        disabled={item.isRead || loadingStates[item.RecId]}>
        <View style={styles.iconContainer}>
          <FontAwesome
            name={getIconName(item.EmailLogType)}
            style={[
              styles.notificationIcon,
              item.isToday && styles.notificationIconToday,
            ]}
          />
        </View>

        {/* Mark as read button positioned at bottom-right of logo */}
        <View style={styles.markReadButtonContainer}>
          <TouchableOpacity
            style={[
              styles.markReadButton,
              item.isToday && styles.markReadButtonToday,
              item.isRead && styles.markReadButtonRead,
              loadingStates[item.RecId] && styles.markReadButtonDisabled,
            ]}
            onPress={() => handleMarkAsRead(item)}
            disabled={item.isRead || loadingStates[item.RecId]}>
            {loadingStates[item.RecId] ? (
              <ActivityIndicator
                size="small"
                color={item.isToday ? '#ffffff' : '#0A66C2'}
              />
            ) : (
              <FontAwesome
                name={item.isRead ? 'check-circle' : 'circle'}
                style={[
                  styles.markReadIcon,
                  item.isToday && styles.markReadIconToday,
                  item.isRead && styles.markReadIconRead,
                ]}
              />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* <Text
          style={[
            styles.notificationTitle,
            item.isToday && styles.notificationTitleToday,
          ]}>
          {'Notification'}
        </Text> */}
        <Text
          style={[
            styles.notificationMessage,
            item.isToday && styles.notificationMessageToday,
          ]}>
          {item.notificationText}
        </Text>
        <Text
          style={[
            styles.notificationTime,
            item.isToday && styles.notificationTimeToday,
          ]}>
          {formatTime(item.CreatedDateTime)}
        </Text>
      </View>
    </View>
  );

  const renderSectionHeader = (title, count) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{count}</Text>
      </View>
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, {opacity: fadeAnim}]}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View style={[styles.panel, {transform: [{translateX}]}]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <FontAwesome name="bell" style={styles.bellIcon} />
              <View>
                <Text style={styles.headerTitle}>Notifications</Text>
                <Text style={styles.headerCount}>
                  {unreadCount} unread
                  {/* • {processedNotifications.length} total */}
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              {/* Mark All as Read Button */}
              <TouchableOpacity
                onPress={handleMarkAllAsRead}
                style={[
                  styles.markAllButton,
                  markAllLoading && styles.markAllButtonDisabled,
                ]}
                disabled={unreadCount === 0 || markAllLoading}>
                {markAllLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <FontAwesome name="check" style={styles.markAllIcon} />
                    <Text style={styles.markAllText}>Mark all read</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
              />
            }>
            {processedNotifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <FontAwesome name="bell-slash" style={styles.emptyIcon} />
                <Text style={styles.emptyText}>No notifications</Text>
              </View>
            ) : (
              <>
                {todayNotifications.length > 0 && (
                  <>
                    {renderSectionHeader('Today', todayNotifications.length)}
                    <FlatList
                      data={todayNotifications}
                      renderItem={renderNotificationItem}
                      keyExtractor={item => `today-${item.RecId}`}
                      scrollEnabled={false}
                    />
                  </>
                )}

                {olderNotifications.length > 0 && (
                  <>
                    {renderSectionHeader('Older', olderNotifications.length)}
                    <FlatList
                      data={olderNotifications}
                      renderItem={renderNotificationItem}
                      keyExtractor={item => `older-${item.RecId}`}
                      scrollEnabled={false}
                    />
                  </>
                )}
              </>
            )}
          </ScrollView>

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <FontAwesome name="times" style={styles.closeIcon} />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// Helper function to get icon based on notification type
const getIconName = emailLogType => {
  switch (emailLogType) {
    case 'SalarySlip':
      return 'money';
    case 'LeaveRequest':
      return 'calendar';
    case 'Expense':
      return 'credit-card';
    default:
      return 'file-text-o';
  }
};

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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  overlayTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  panel: {
    width: 350,
    height: '100%',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: -4, height: 0},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0A66C2',
    borderBottomWidth: 1,
    borderBottomColor: '#0c5298',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellIcon: {
    fontSize: 24,
    color: '#ffffff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerCount: {
    fontSize: 12,
    color: '#e2e8f0',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginRight: 45,
  },
  markAllButtonDisabled: {
    opacity: 0.5,
  },
  markAllIcon: {
    fontSize: 14,
    color: '#ffffff',
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIcon: {
    fontSize: 20,
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  countBadge: {
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  notificationItemToday: {
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 2,
    borderLeftColor: '#0A66C2',
  },
  notificationItemRead: {
    backgroundColor: '#fafafa',
    opacity: 0.8,
  },
  logoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: 20,
    color: '#0A66C2',
  },
  notificationIconToday: {
    color: '#0369a1',
  },
  markReadButtonContainer: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    zIndex: 1,
  },
  markReadButton: {
    width: 12,
    height: 12,
    borderRadius: 11,
    backgroundColor: '#0A66C2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  markReadButtonToday: {
    backgroundColor: '#0A66C2',
  },
  markReadButtonRead: {
    backgroundColor: '#94a3b8',
  },
  markReadButtonDisabled: {
    opacity: 0.5,
  },
  markReadIcon: {
    fontSize: 4,
    color: '#ffffff',
  },
  markReadIconToday: {
    color: '#ffffff',
  },
  markReadIconRead: {
    color: '#ffffff',
  },
  contentContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  notificationTitleToday: {
    color: '#0A66C2',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationMessageToday: {
    color: '#475569',
  },
  notificationTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  notificationTimeToday: {
    color: '#0A66C2',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 56,
    color: '#cbd5e1',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  closeIcon: {
    fontSize: 16,
    color: '#64748b',
  },
});

export default NotificationPanel;
