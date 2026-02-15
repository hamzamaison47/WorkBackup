// /* eslint-disable curly */
// /* eslint-disable react-hooks/exhaustive-deps */
// import React, {useState, useEffect, useRef} from 'react';
// import {Modal, View, TouchableOpacity, Text, Platform} from 'react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';

// import styles from '../../styles/styles';

// const CalendarModal = ({visible, current, onDateSelected, onClose}) => {
//   const [date, setDate] = useState(new Date());
//   const [showPicker, setShowPicker] = useState(false);
//   const hasInitialized = useRef(false);
//   const isClosing = useRef(false);

//   useEffect(() => {
//     if (visible && !hasInitialized.current) {
//       // Initialize date only once when modal opens
//       const newDate = current ? new Date(current.split('T')[0]) : new Date();
//       setDate(newDate);
//       hasInitialized.current = true;
//       isClosing.current = false;

//       // Show picker after brief delay
//       setTimeout(() => setShowPicker(true), 100);
//     } else if (!visible && hasInitialized.current) {
//       // Reset when modal closes
//       setShowPicker(false);
//       hasInitialized.current = false;
//       isClosing.current = false;
//     }
//   }, [visible]);

//   const handleChange = (event, selectedDate) => {
//     if (Platform.OS === 'android') {
//       // Prevent any updates while closing
//       if (isClosing.current) return;

//       if (event?.type === 'set' && selectedDate) {
//         isClosing.current = true;
//         // Update the date state immediately
//         setDate(selectedDate);

//         // Small delay to let the picker update visually before closing
//         setTimeout(() => {
//           setShowPicker(false);
//           onDateSelected(selectedDate.toISOString().split('T')[0]);
//           onClose();
//         }, 50);
//       } else if (event?.type === 'dismissed') {
//         isClosing.current = true;
//         setShowPicker(false);
//         onClose();
//       }
//       return;
//     }

//     // iOS: update date as user scrolls
//     if (selectedDate) {
//       setDate(selectedDate);
//     }
//   };

//   const handleIOSConfirm = () => {
//     onDateSelected(date.toISOString().split('T')[0]);
//     onClose();
//   };

//   const handleIOSCancel = () => {
//     onClose();
//   };

//   // Android: wrap picker in modal
//   if (Platform.OS === 'android') {
//     return (
//       <Modal
//         visible={visible}
//         transparent
//         animationType="fade"
//         onRequestClose={() => {
//           if (!isClosing.current) {
//             isClosing.current = true;
//             setShowPicker(false);
//             onClose();
//           }
//         }}>
//         <TouchableOpacity
//           style={styles.CalModal_modalContainer}
//           activeOpacity={1}
//           onPress={() => {
//             if (!isClosing.current) {
//               isClosing.current = true;
//               setShowPicker(false);
//               onClose();
//             }
//           }}>
//           <View
//             style={styles.CalModal_androidPickerContainer}
//             onStartShouldSetResponder={() => true}>
//             {showPicker && (
//               <DateTimePicker
//                 value={date}
//                 mode="date"
//                 display="calendar"
//                 onChange={handleChange}
//                 accentColor="#0A66C2"
//               />
//             )}
//           </View>
//         </TouchableOpacity>
//       </Modal>
//     );
//   }

//   // iOS
//   return (
//     <Modal
//       visible={visible}
//       transparent
//       animationType="slide"
//       onRequestClose={handleIOSCancel}>
//       <View style={styles.CalModal_modalContainer}>
//         <View style={styles.CalModal_modalContent}>
//           <View style={styles.CalModal_header}>
//             <Text style={styles.CalModal_headerTitle}>Select Date</Text>
//           </View>

//           <DateTimePicker
//             value={date}
//             mode="date"
//             display="inline"
//             onChange={handleChange}
//             accentColor="#0A66C2"
//             style={styles.CalModal_datePicker}
//           />

//           <View style={styles.CalModal_footer}>
//             <TouchableOpacity
//               style={styles.CalModal_cancelButton}
//               onPress={handleIOSCancel}>
//               <Text style={styles.CalModal_cancelButtonText}>CANCEL</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.CalModal_okButton}
//               onPress={handleIOSConfirm}>
//               <Text style={styles.CalModal_okButtonText}>OK</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );
// };

// export default CalendarModal;

/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import {Modal, View, TouchableOpacity, Text, Platform} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import styles from '../../styles/styles';

const CalendarModal = ({visible, initialDate, onDateSelected, onClose}) => {
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  // Only run once when component mounts
  useEffect(() => {
    const parsedDate = initialDate
      ? new Date(initialDate.split('T')[0])
      : new Date();
    setDate(parsedDate);

    if (Platform.OS === 'android') {
      setTimeout(() => setShowPicker(true), 100);
    }
  }, []); // Empty dependency array - only run on mount

  const handleChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      if (event?.type === 'set' && selectedDate) {
        onDateSelected(selectedDate.toISOString().split('T')[0]);
        setShowPicker(false);
        onClose();
      } else if (event?.type === 'dismissed') {
        setShowPicker(false);
        onClose();
      }
      return;
    }

    // iOS: update date as user scrolls
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleIOSConfirm = () => {
    onDateSelected(date.toISOString().split('T')[0]);
    onClose();
  };

  const handleIOSCancel = () => {
    onClose();
  };

  // Android
  if (Platform.OS === 'android') {
    if (!visible || !showPicker) {
      return null;
    }

    return (
      <DateTimePicker
        value={date}
        mode="date"
        display="calendar"
        onChange={handleChange}
        accentColor="#0A66C2"
      />
    );
  }

  // iOS
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleIOSCancel}>
      <View style={styles.CalModal_modalContainer}>
        <View style={styles.CalModal_modalContent}>
          <View style={styles.CalModal_header}>
            <Text style={styles.CalModal_headerTitle}>Select Date</Text>
          </View>

          <DateTimePicker
            value={date}
            mode="date"
            display="inline"
            onChange={handleChange}
            accentColor="#0A66C2"
            style={styles.CalModal_datePicker}
          />

          <View style={styles.CalModal_footer}>
            <TouchableOpacity
              style={styles.CalModal_cancelButton}
              onPress={handleIOSCancel}>
              <Text style={styles.CalModal_cancelButtonText}>CANCEL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.CalModal_okButton}
              onPress={handleIOSConfirm}>
              <Text style={styles.CalModal_okButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CalendarModal;
