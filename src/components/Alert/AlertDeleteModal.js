import React from 'react';
import {View, Text, TouchableOpacity, Modal} from 'react-native';
import styles from '../../styles/styles';

/**
 * AlertDeleteModal: A confirmation modal used for delete actions.
 * It includes Cancel and Delete buttons.
 */
const AlertDeleteModal = ({visible, heading, text, onPress, onCancel}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}>
      <View style={styles.Alert_ModalOverlay}>
        <View style={styles.Alert_ModalBox}>
          {/* Modal Heading */}
          <Text style={styles.Alert_ModalHeading}>{heading}</Text>

          {/* Modal Description Text */}
          <Text style={styles.Alert_ModalText}>{text}</Text>

          {/* Two buttons: Cancel and Delete */}
          <View style={styles.Alert_ButtonRow}>
            <TouchableOpacity
              style={styles.Alert_CancelButton}
              onPress={onCancel}>
              <Text style={styles.Alert_ButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.Alert_DeleteButton}
              onPress={onPress}>
              <Text style={styles.Alert_ButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AlertDeleteModal;

// Shared styles for both modals
