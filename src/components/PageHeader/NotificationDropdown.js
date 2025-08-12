/* eslint-disable curly */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
// import {useNavigation} from '@react-navigation/native';
import {styles} from '../../styles/styles';

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
      <View style={styles.NotDD_overlay}>
        <TouchableWithoutFeedback>
          <View style={styles.NotDD_dropdownContainer}>
            <View style={styles.NotDD_dropdownContent}>
              <Text style={styles.NotDD_dropdownTitle}>Notifications</Text>

              {/* ScrollView to allow scrolling through notifications */}
              <ScrollView style={styles.NotDD_scrollView}>
                {formattedNotifications.map((message, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      onClose();
                      // navigation.navigate('WorkItemAssigned', {
                      //   notification: notifications[index],
                      // });
                    }}>
                    <Text style={styles.NotDD_dropdownText}>{message}</Text>
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

export default NotificationDropdown;
