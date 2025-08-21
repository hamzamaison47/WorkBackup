import React from 'react';
import {View, Text, TouchableOpacity, Modal} from 'react-native';
import styles from '../../styles/styles';

// Get screen width and height for responsive design

/**
 * AlertModal: A simple modal with a heading, message, and OK button.
 * Typically used for informational or confirmation alerts.
 */
const AlertModal = ({visible, heading, text, onPress}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onPress}>
      <View style={styles.Alert_ModalOverlay}>
        <View style={styles.Alert_ModalBox}>
          {/* Modal Heading */}
          <Text style={styles.Alert_ModalHeading}>{heading}</Text>

          {/* Modal Description Text */}
          <Text style={styles.Alert_ModalText}>{text}</Text>

          {/* OK Button */}
          <TouchableOpacity style={styles.Alert_OkButton} onPress={onPress}>
            <Text style={styles.Alert_OkButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default AlertModal;
