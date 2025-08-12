import React from 'react';
import {TouchableOpacity} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {styles} from '../../styles/styles';
const LogoutButton = ({onPress}) => (
  <TouchableOpacity onPress={onPress} style={styles.LgOut_ButtonContainer}>
    <Ionicons name="log-out" size={22} color="white" />
  </TouchableOpacity>
);

export default LogoutButton;
