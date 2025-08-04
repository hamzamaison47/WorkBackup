import React from 'react';
import {TouchableOpacity, StyleSheet} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const LogoutButton = ({onPress}) => (
  <TouchableOpacity onPress={onPress} style={styles.buttonContainer}>
    <Ionicons name="log-out" size={22} color="white" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  buttonContainer: {
    marginRight: 10,
    // Remove any background color or additional styles
  },
});

export default LogoutButton;
