import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';

import {styles} from '../../styles/styles';

const LogoutAlertModal = ({visible, heading, text, onConfirm, onCancel}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel} // Handle back button action
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.AlrtLg_CenteredView}>
          <View style={styles.AlrtLg_ModalView}>
            <Text style={styles.AlrtLg_headingText}>{heading}</Text>
            <Text style={styles.AlrtLg_modalText}>{text}</Text>

            {/* Cancel and Confirm Buttons */}
            <View style={styles.AlrtLg_buttonContainer}>
              <TouchableOpacity
                style={[styles.AlrtLg_button, styles.AlrtLg_cancelButton]}
                onPress={onCancel}>
                <Text style={styles.AlrtLg_buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.AlrtLg_button, styles.AlrtLg_confirmButton]}
                onPress={onConfirm}>
                <Text style={styles.AlrtLg_buttonText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default LogoutAlertModal;
