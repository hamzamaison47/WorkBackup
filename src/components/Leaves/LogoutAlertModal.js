import React from 'react';
import {View, Text, TouchableOpacity, Modal, StyleSheet} from 'react-native';
import {hp, wp} from '../../constants/Size';

const LogoutAlertModal = ({visible, heading, text, onConfirm, onCancel}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel} // Handle back button action
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.headingText}>{heading}</Text>
          <Text style={styles.modalText}>{text}</Text>

          {/* Cancel and Confirm Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}>
              <Text style={styles.buttonText}>Yes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  headingText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#525252',
  },
  modalText: {
    marginTop: hp(0.5),
    marginBottom: hp(3),
    textAlign: 'center',
    color: 'grey',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: wp(70),
  },
  button: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    width: wp(30),
    marginHorizontal: wp(2),
  },
  cancelButton: {
    backgroundColor: '#ff6666', // Red for cancel button
  },
  confirmButton: {
    backgroundColor: '#4caf50', // Green for confirm button
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default LogoutAlertModal;
