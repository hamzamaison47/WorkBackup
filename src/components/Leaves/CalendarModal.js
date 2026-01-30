/* eslint-disable react-hooks/exhaustive-deps */
// import React, {useState, useEffect} from 'react';
// import {
//   Modal,
//   View,
//   TouchableOpacity,
//   Text,
//   StyleSheet,
//   Platform,
// } from 'react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';

// const CalendarModal = ({visible, current, onDateSelected, onClose}) => {
//   const [date, setDate] = useState(new Date());
//   const [showPicker, setShowPicker] = useState(false);

//   // Initialize date when modal opens or current changes
//   useEffect(() => {
//     if (visible && current) {
//       const dateStr = current.includes('T') ? current.split('T')[0] : current;
//       setDate(new Date(dateStr));
//     } else if (visible && !current) {
//       setDate(new Date());
//     }
//   }, [visible, current]);

//   // Auto-show picker when modal opens
//   useEffect(() => {
//     if (visible) {
//       setShowPicker(true);
//     } else {
//       setShowPicker(false);
//     }
//   }, [visible]);

//   const onChange = (event, selectedDate) => {
//     if (Platform.OS === 'android') {
//       setShowPicker(false);

//       if (event.type === 'set' && selectedDate) {
//         // User clicked OK
//         setDate(selectedDate);
//         const formatted = selectedDate.toISOString().split('T')[0];
//         onDateSelected(formatted);
//         onClose();
//       } else if (event.type === 'dismissed') {
//         // User clicked Cancel
//         onClose();
//       }
//     } else {
//       // iOS
//       if (selectedDate) {
//         setDate(selectedDate);
//       }
//     }
//   };

//   const handleIOSConfirm = () => {
//     const formatted = date.toISOString().split('T')[0];
//     onDateSelected(formatted);
//     setShowPicker(false);
//     onClose();
//   };

//   const handleIOSCancel = () => {
//     setShowPicker(false);
//     onClose();
//   };

//   // For Android, the picker handles its own modal
//   if (Platform.OS === 'android') {
//     return (
//       <>
//         {visible && showPicker && (
//           <DateTimePicker
//             value={date}
//             mode="date"
//             display="calendar"
//             onChange={onChange}
//             accentColor="#0A66C2"
//           />
//         )}
//       </>
//     );
//   }

//   // For iOS, wrap in custom modal
//   return (
//     <Modal visible={visible} transparent={true} animationType="slide">
//       <View style={styles.modalContainer}>
//         <View style={styles.modalContent}>
//           {/* Header */}
//           <View style={styles.header}>
//             <Text style={styles.headerTitle}>Select Date</Text>
//           </View>

//           {/* iOS Date Picker */}
//           {showPicker && (
//             <DateTimePicker
//               value={date}
//               mode="date"
//               display="inline"
//               onChange={onChange}
//               accentColor="#0A66C2"
//               style={styles.datePicker}
//             />
//           )}

//           {/* Footer buttons for iOS */}
//           <View style={styles.footer}>
//             <TouchableOpacity
//               style={styles.cancelButton}
//               onPress={handleIOSCancel}>
//               <Text style={styles.cancelButtonText}>CANCEL</Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={styles.okButton}
//               onPress={handleIOSConfirm}>
//               <Text style={styles.okButtonText}>OK</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );
// };
import React, {useState, useEffect} from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const CalendarModal = ({visible, current, onDateSelected, onClose}) => {
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  // Initialize date only when modal first opens
  useEffect(() => {
    if (visible) {
      // Only set date when modal opens, not on every render
      if (current) {
        const dateStr = current.includes('T') ? current.split('T')[0] : current;
        setDate(new Date(dateStr));
      } else {
        setDate(new Date());
      }
      setShowPicker(true);
    } else {
      setShowPicker(false);
    }
  }, [visible]); // Remove 'current' from dependency array

  const onChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);

      if (event.type === 'set' && selectedDate) {
        // User clicked OK
        onDateSelected(selectedDate.toISOString().split('T')[0]);
        onClose();
      } else if (event.type === 'dismissed') {
        // User clicked Cancel
        onClose();
      }
    } else {
      // iOS - update the local state immediately
      if (selectedDate) {
        setDate(selectedDate);
      }
    }
  };

  const handleIOSConfirm = () => {
    onDateSelected(date.toISOString().split('T')[0]);
    setShowPicker(false);
    onClose();
  };

  const handleIOSCancel = () => {
    setShowPicker(false);
    onClose();
  };

  // For Android, the picker handles its own modal
  if (Platform.OS === 'android') {
    return (
      <>
        {visible && showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="calendar"
            onChange={onChange}
            accentColor="#0A66C2"
          />
        )}
      </>
    );
  }

  // For iOS, wrap in custom modal
  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Date</Text>
          </View>

          {/* iOS Date Picker */}
          {showPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="inline"
              onChange={onChange}
              accentColor="#0A66C2"
              style={styles.datePicker}
            />
          )}

          {/* Footer buttons for iOS */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleIOSCancel}>
              <Text style={styles.cancelButtonText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.okButton}
              onPress={handleIOSConfirm}>
              <Text style={styles.okButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: '#ffffff',
    borderRadius: 8,
    width: '85%',
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    backgroundColor: '#0A66C2',
    padding: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  datePicker: {
    width: '100%',
    backgroundColor: '#ffffff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  okButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#0A66C2',
    fontSize: 14,
    fontWeight: '600',
  },
  okButtonText: {
    color: '#0A66C2',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CalendarModal;
