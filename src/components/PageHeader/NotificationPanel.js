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
  RefreshControl,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {updateNotificationByRecID} from '../../API/Notification/UpdateNotificationByRecID';
import styles from '../../styles/styles';

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
        styles.notif_NotificationItem,
        item.isToday && styles.notif_NotificationItemToday,
        item.isRead && styles.notif_NotificationItemRead,
      ]}>
      {/* Left Logo Container with overlapping button */}
      <TouchableOpacity
        style={styles.notif_LogoContainer}
        onPress={() => handleMarkAsRead(item)}
        disabled={item.isRead || loadingStates[item.RecId]}>
        <View style={styles.notif_IconContainer}>
          <FontAwesome
            name={getIconName(item.EmailLogType)}
            style={[
              styles.notif_NotificationIcon,
              item.isToday && styles.notif_NotificationIconToday,
            ]}
          />
        </View>

        {/* Mark as read button positioned at bottom-right of logo */}
        <View style={styles.notif_MarkReadButtonContainer}>
          <TouchableOpacity
            style={[
              styles.notif_MarkReadButton,
              item.isToday && styles.notif_MarkReadButtonToday,
              item.isRead && styles.notif_MarkReadButtonRead,
              loadingStates[item.RecId] && styles.notif_MarkReadButtonDisabled,
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
                  styles.notif_MarkReadIcon,
                  item.isToday && styles.notif_MarkReadIconToday,
                  item.isRead && styles.notif_MarkReadIconRead,
                ]}
              />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Content Container */}
      <View style={styles.notif_ContentContainer}>
        <Text
          style={[
            styles.notif_NotificationMessage,
            item.isToday && styles.notif_NotificationMessageToday,
          ]}>
          {item.notificationText}
        </Text>
        <Text
          style={[
            styles.notif_NotificationTime,
            item.isToday && styles.notif_NotificationTimeToday,
          ]}>
          {formatTime(item.CreatedDateTime)}
        </Text>
      </View>
    </View>
  );

  const renderSectionHeader = (title, count) => (
    <View style={styles.notif_SectionHeader}>
      <Text style={styles.notif_SectionTitle}>{title}</Text>
      <View style={styles.notif_CountBadge}>
        <Text style={styles.notif_CountText}>{count}</Text>
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
      <Animated.View style={[styles.notif_Overlay, {opacity: fadeAnim}]}>
        <TouchableOpacity
          style={styles.notif_OverlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[styles.notif_Panel, {transform: [{translateX}]}]}>
          <View style={styles.notif_Header}>
            <View style={styles.notif_HeaderLeft}>
              <FontAwesome name="bell" style={styles.notif_BellIcon} />
              <View>
                <Text style={styles.notif_HeaderTitle}>Notifications</Text>
                <Text style={styles.notif_HeaderCount}>
                  {unreadCount} unread
                </Text>
              </View>
            </View>

            <View style={styles.notif_HeaderRight}>
              {/* Mark All as Read Button */}
              <TouchableOpacity
                onPress={handleMarkAllAsRead}
                style={[
                  styles.notif_MarkAllButton,
                  markAllLoading && styles.notif_MarkAllButtonDisabled,
                ]}
                disabled={unreadCount === 0 || markAllLoading}>
                {markAllLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <FontAwesome
                      name="check"
                      style={styles.notif_MarkAllIcon}
                    />
                    <Text style={styles.notif_MarkAllText}>Mark all read</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.notif_ScrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
              />
            }>
            {processedNotifications.length === 0 ? (
              <View style={styles.notif_EmptyContainer}>
                <FontAwesome name="bell-slash" style={styles.notif_EmptyIcon} />
                <Text style={styles.notif_EmptyText}>No notifications</Text>
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

          <TouchableOpacity onPress={onClose} style={styles.notif_CloseButton}>
            <FontAwesome name="times" style={styles.notif_CloseIcon} />
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

export default NotificationPanel;
