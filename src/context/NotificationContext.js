/* eslint-disable react-hooks/exhaustive-deps */
import React, {createContext, useContext, useState, useEffect} from 'react';
import {retrieveByEmail} from '../API/WorkflowTrackingStatusTable/retrieveByEmail';
import {UserContext} from './UserContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider',
    );
  }
  return context;
};

export const NotificationProvider = ({children}) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const {userData} = useContext(UserContext);

  const fetchNotifications = async () => {
    try {
      const data = await retrieveByEmail({email: userData.email});
      if (Array.isArray(data)) {
        const formattedNotifications = data.map((notification, index) => ({
          id: notification.CorrelationId || index.toString(),
          title: 'Document Approval',
          message: `You have a ${notification.Document} to approve`,
          timestamp: new Date().toISOString(),
          type: 'document',
          isRead: false,
          avatar: '📄',
          documentType: notification.DocumentType,
          document: notification.Document,
          correlationId: notification.CorrelationId,
          originalData: notification,
        }));

        setNotifications(formattedNotifications);
        setUnreadCount(formattedNotifications.filter(n => !n.isRead).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = id => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? {...notification, isRead: true} : notification,
      ),
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({...notification, isRead: true})),
    );
    setUnreadCount(0);
  };

  const deleteNotification = id => {
    const notification = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notification && !notification.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const refreshNotifications = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  useEffect(() => {
    if (userData?.email) {
      fetchNotifications();
    }
  }, [userData?.email]);

  const value = {
    notifications,
    unreadCount,
    refreshing,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
