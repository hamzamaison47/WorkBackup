import React from 'react';
import {View, TouchableOpacity, StyleSheet, Text} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const NotificationButton = ({onPress, notificationCount, onClose}) => {
  return (
    <TouchableOpacity style={styles.button} onPress={() => onPress(onClose)}>
      <View style={styles.iconContainer}>
        <Icon name="bell" size={24} color="#FFFFFF" />
        {notificationCount > 0 && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{notificationCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    marginRight: 10, // Adjust the right margin for proper spacing
  },
  iconContainer: {
    position: 'relative', // Allows badge to position relative to the icon
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: -5, // Adjust vertical position of the badge
    right: -5, // Adjust horizontal position of the badge
    backgroundColor: '#FF4500', // Badge background color
    borderRadius: 10, // Makes the badge circular
    width: 20, // Set width of the badge
    height: 20, // Set height of the badge
    justifyContent: 'center', // Center align text in the badge
    alignItems: 'center', // Center align text in the badge
    borderWidth: 1, // Optional: Add border to improve visibility
    borderColor: '#FFFFFF', // Optional: Set border color
  },
  badgeText: {
    color: '#FFFFFF', // Text color
    fontSize: 12, // Font size of the badge text
    fontWeight: 'bold', // Font weight of the badge text
  },
});

export default NotificationButton;
