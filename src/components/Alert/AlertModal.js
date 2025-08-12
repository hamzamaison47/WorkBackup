import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';

// Get screen width and height for responsive design
const {width, height} = Dimensions.get('window');

/**
 * AlertModal: A simple modal with a heading, message, and OK button.
 * Typically used for informational or confirmation alerts.
 */
export const AlertModal = ({visible, heading, text, onPress}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onPress}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          {/* Modal Heading */}
          <Text style={styles.modalHeading}>{heading}</Text>

          {/* Modal Description Text */}
          <Text style={styles.modalText}>{text}</Text>

          {/* OK Button */}
          <TouchableOpacity style={styles.okButton} onPress={onPress}>
            <Text style={styles.okButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

/**
 * AlertDeleteModal: A confirmation modal used for delete actions.
 * It includes Cancel and Delete buttons.
 */
export const AlertDeleteModal = ({
  visible,
  heading,
  text,
  onPress,
  onCancel,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          {/* Modal Heading */}
          <Text style={styles.modalHeading}>{heading}</Text>

          {/* Modal Description Text */}
          <Text style={styles.modalText}>{text}</Text>

          {/* Two buttons: Cancel and Delete */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={onPress}>
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Shared styles for both modals
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: width * 0.85,
    paddingVertical: height * 0.035,
    paddingHorizontal: width * 0.06,
    backgroundColor: '#fff',
    borderRadius: width * 0.04,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: {width: 0, height: 3},
    shadowRadius: 6,
    alignItems: 'center',
  },
  modalHeading: {
    fontSize: width * 0.05,
    fontWeight: '700',
    color: '#333',
    marginBottom: height * 0.015,
    textAlign: 'center',
  },
  modalText: {
    fontSize: width * 0.038,
    color: '#555',
    textAlign: 'center',
    marginBottom: height * 0.02,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: height * 0.014,
    backgroundColor: '#ccc',
    borderRadius: width * 0.025,
    alignItems: 'center',
    marginRight: width * 0.025,
  },
  deleteButton: {
    flex: 1,
    paddingVertical: height * 0.014,
    backgroundColor: '#FF5252',
    borderRadius: width * 0.025,
    alignItems: 'center',
    marginLeft: width * 0.025,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.04,
  },
  okButton: {
    marginTop: height * 0.001,
    backgroundColor: '#0A66C2',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.3,
    borderRadius: width * 0.03,
    alignItems: 'center',
  },
  okButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.04,
  },
});
