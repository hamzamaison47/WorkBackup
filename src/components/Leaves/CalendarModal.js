import React from 'react';
import {Modal, View, TouchableOpacity, Text} from 'react-native';
import {Calendar} from 'react-native-calendars';
import styles from '../../styles/styles';

const CalendarModal = ({
  visible,
  current,
  selectedDate,
  markedDates,
  onDateSelected,
  onClose,
}) => {
  // Merge markedDates and customize the selected date with a circular highlight
  const highlightedDates = {
    ...markedDates,
    ...(selectedDate && {
      [selectedDate]: {
        selected: true,
        customStyles: {
          container: {
            backgroundColor: '#0A66C2',
            borderRadius: 50,
            width: 36,
            height: 36,
            justifyContent: 'center',
            alignItems: 'center',
          },
          text: {
            color: '#FFFFFF',
            fontWeight: 'bold',
          },
        },
      },
    }),
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.CalMod_ModalContainer}>
        <View style={styles.CalMod_ModalContent}>
          <Calendar
            current={current}
            markedDates={highlightedDates}
            markingType="custom" // Use custom marking
            onDayPress={day => {
              onDateSelected(day.dateString);
              onClose();
            }}
          />
          <TouchableOpacity style={styles.CalMod_CloseButton} onPress={onClose}>
            <Text style={styles.CalMod_CloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default CalendarModal;
