// AlertModal.js
import React from 'react';
import {View, Text, TouchableOpacity, Modal, StyleSheet} from 'react-native';
import {hp, wp} from '../../constants/Size';

export const AlertModal = ({visible, heading, text, onPress}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onPress}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.headingText}>{heading}</Text>
          <Text style={styles.modalText}>{text}</Text>
          <TouchableOpacity style={styles.button} onPress={onPress}>
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

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
      onRequestClose={onPress}>
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text style={styles.heading}>{heading}</Text>
          <Text style={styles.text}>{text}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.buttonDeleteText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={onPress}>
              <Text style={styles.buttonDeleteText}>Delete</Text>
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
    // fontSize: hp(3.5),
    // fontFamily: 'HelveticaNowMicro-Bold',
    textAlign: 'center',
    color: 'black',
    fontWeight: 'bold',
  },
  modalText: {
    marginVertical: 10,
    // marginTop: hp(0.5),
    // marginBottom: hp(0.5),
    textAlign: 'center',
    color: 'black',
    // fontFamily: 'HelveticaNowMicro-Regular',
    fontSize: hp(2.8),
  },
  button: {
    backgroundColor: 'orange',
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    width: wp(70),
  },
  buttonText: {
    color: '#000',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
    // fontFamily: 'HelveticaNowMicro-Bold',
  },

  //

  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  heading: {
    fontSize: 20,
    // fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#707070',
  },
  text: {
    fontSize: 18,
    // fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#707070',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#a3a3a3',
    alignItems: 'center',
    borderRadius: 5,
    marginRight: 5,
  },
  confirmButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#ff4547',
    alignItems: 'center',
    borderRadius: 5,
    marginLeft: 5,
  },
  buttonDeleteText: {
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: hp(4),
    // fontFamily: 'HelveticaNowMicro-Bold',
  },
});

// export AlertModal;
// export AlertDeleteModal;
