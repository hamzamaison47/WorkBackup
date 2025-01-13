import React from 'react';
import {Modal, View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import {Calendar} from 'react-native-calendars';

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
            backgroundColor: '#FFA500',
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
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Calendar
            current={current}
            markedDates={highlightedDates}
            markingType="custom" // Use custom marking
            onDayPress={day => {
              onDateSelected(day.dateString);
              onClose();
            }}
          />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
  },
  closeButton: {
    marginTop: 10,
    alignSelf: 'center',
    backgroundColor: '#FFA500',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default CalendarModal;
