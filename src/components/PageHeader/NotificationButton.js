import React from 'react';
import {View, TouchableOpacity, Text} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import styles from '../../styles/styles';
import {conditionalFontScale} from '../../store/utils/scaling';

const NotificationButton = ({onPress, notificationCount, onClose}) => {
  return (
    <TouchableOpacity style={styles.NB_button} onPress={() => onPress(onClose)}>
      <View style={styles.NB_iconContainer}>
        <Icon
          name="bell"
          size={conditionalFontScale(16, 17, 18, 20)}
          color="#FFFFFF"
        />
        {notificationCount > 0 && (
          <View style={styles.NB_badgeContainer}>
            <Text style={styles.NB_badgeText}>
              {notificationCount > 99 ? '99+' : notificationCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default NotificationButton;
