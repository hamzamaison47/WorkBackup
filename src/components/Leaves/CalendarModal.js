/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
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

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import React, {useState, useEffect, useRef, useCallback} from 'react';
import {Modal, View, TouchableOpacity, Text, Platform} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import styles from '../../styles/styles';

const parseLocalDate = dateString => {
  if (!dateString) return new Date();
  const datePart = dateString.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatLocalDate = date => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// ✅ THE KEY: This picker NEVER re-renders after mount
// Custom comparison always returns true = React.memo never re-renders it
const FrozenDatePicker = React.memo(
  ({value, onChange, display}) => {
    return (
      <DateTimePicker
        value={value}
        mode="date"
        display={display}
        onChange={onChange}
        accentColor="#0A66C2"
      />
    );
  },
  () => true, // Always return true = never re-render
);

const FrozenIOSPicker = React.memo(
  ({value, onChange, style}) => {
    return (
      <DateTimePicker
        value={value}
        mode="date"
        display="inline"
        onChange={onChange}
        accentColor="#0A66C2"
        style={style}
      />
    );
  },
  () => true, // Always return true = never re-render
);

const CalendarModal = ({visible, initialDate, onDateSelected, onClose}) => {
  // Use a ref for the date so updates don't trigger re-renders of FrozenDatePicker
  const dateRef = useRef(parseLocalDate(initialDate));
  const [showPicker, setShowPicker] = useState(false);
  // Separate state just for iOS confirm (needs current date value)
  const [iosDate, setIosDate] = useState(parseLocalDate(initialDate));

  useEffect(() => {
    if (!visible) {
      setShowPicker(false);
      return;
    }

    // Re-initialize date when modal opens
    const parsed = parseLocalDate(initialDate);
    dateRef.current = parsed;
    setIosDate(parsed);

    if (Platform.OS === 'android') {
      const timer = setTimeout(() => setShowPicker(true), 50);
      return () => clearTimeout(timer);
    }
  }, [visible]); // intentionally omit initialDate

  // useCallback so the function reference never changes
  // This prevents FrozenDatePicker from even being offered a re-render
  const handleAndroidChange = useCallback((event, selectedDate) => {
    setShowPicker(false);
    if (event?.type === 'set' && selectedDate) {
      onDateSelected(formatLocalDate(selectedDate));
    }
    onClose();
  }, []); // empty deps — stable reference forever

  const handleIOSChange = useCallback((event, selectedDate) => {
    if (selectedDate) {
      dateRef.current = selectedDate;
      setIosDate(selectedDate); // only iOS needs this for confirm
    }
  }, []);

  const handleIOSConfirm = () => {
    onDateSelected(formatLocalDate(dateRef.current));
    onClose();
  };

  const handleIOSCancel = () => {
    onClose();
  };

  // Android
  if (Platform.OS === 'android') {
    if (!visible || !showPicker) return null;

    return (
      <FrozenDatePicker
        value={dateRef.current}
        onChange={handleAndroidChange}
        display="calendar"
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

          <FrozenIOSPicker
            value={iosDate}
            onChange={handleIOSChange}
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
