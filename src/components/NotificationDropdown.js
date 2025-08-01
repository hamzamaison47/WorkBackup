/* eslint-disable curly */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
// import {useNavigation} from '@react-navigation/native';

const NotificationDropdown = ({visible, notifications, onClose}) => {
  // const navigation = useNavigation();
  // console.log('Notifications:', notifications); // For debugging

  if (!visible) return null;

  // Format notifications to display document and document type
  const formattedNotifications = notifications.map(
    notification => `You have a ${notification.document} to approve`,
  );

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback>
          <View style={styles.dropdownContainer}>
            <View style={styles.dropdownContent}>
              <Text style={styles.dropdownTitle}>Notifications</Text>

              {/* ScrollView to allow scrolling through notifications */}
              <ScrollView style={styles.scrollView}>
                {formattedNotifications.map((message, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      onClose();
                      // navigation.navigate('WorkItemAssigned', {
                      //   notification: notifications[index],
                      // });
                    }}>
                    <Text style={styles.dropdownText}>{message}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  dropdownContainer: {
    marginTop: 10,
    marginRight: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    width: 300,
  },
  dropdownContent: {
    padding: 15,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFA500',
    marginBottom: 10,
    textAlign: 'center',
  },
  dropdownText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 5,
  },
  scrollView: {
    maxHeight: 300,
  },
});

export default NotificationDropdown;
