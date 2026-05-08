// /* eslint-disable curly */
// /* eslint-disable react-hooks/exhaustive-deps */
// import React, {useState, useEffect, useRef, useCallback} from 'react';
// import {Modal, View, TouchableOpacity, Text, Platform} from 'react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';

// import styles from '../../styles/styles';

// const parseLocalDate = dateString => {
//   if (!dateString) return new Date();
//   const datePart = dateString.split('T')[0];
//   const [year, month, day] = datePart.split('-').map(Number);
//   return new Date(year, month - 1, day);
// };

// const formatLocalDate = date => {
//   const y = date.getFullYear();
//   const m = String(date.getMonth() + 1).padStart(2, '0');
//   const d = String(date.getDate()).padStart(2, '0');
//   return `${y}-${m}-${d}`;
// };

// const FrozenDatePicker = React.memo(
//   ({value, onChange, display, maximumDate}) => {
//     return (
//       <DateTimePicker
//         value={value}
//         mode="date"
//         display={display}
//         onChange={onChange}
//         accentColor="#0A66C2"
//         maximumDate={maximumDate} // ← add this
//       />
//     );
//   },
//   () => true,
// );

// const FrozenIOSPicker = React.memo(
//   ({value, onChange, style, maximumDate}) => {
//     return (
//       <DateTimePicker
//         value={value}
//         mode="date"
//         display="inline"
//         onChange={onChange}
//         accentColor="#0A66C2"
//         style={style}
//         maximumDate={maximumDate} // ← add this
//       />
//     );
//   },
//   () => true,
// );

// const CalendarModal = ({
//   visible,
//   initialDate,
//   onDateSelected,
//   onClose,
//   maxDate,
// }) => {
//   const dateRef = useRef(parseLocalDate(initialDate));
//   const [showPicker, setShowPicker] = useState(false);
//   const [iosDate, setIosDate] = useState(parseLocalDate(initialDate));
//   const maxDateObj = maxDate ? parseLocalDate(maxDate) : undefined;

//   useEffect(() => {
//     if (!visible) {
//       setShowPicker(false);
//       return;
//     }

//     const parsed = parseLocalDate(initialDate);
//     dateRef.current = parsed;
//     setIosDate(parsed);

//     if (Platform.OS === 'android') {
//       const timer = setTimeout(() => setShowPicker(true), 50);
//       return () => clearTimeout(timer);
//     }
//   }, [visible]);

//   const handleAndroidChange = useCallback((event, selectedDate) => {
//     setShowPicker(false);
//     if (event?.type === 'set' && selectedDate) {
//       onDateSelected(formatLocalDate(selectedDate));
//     }
//     onClose();
//   }, []);

//   const handleIOSChange = useCallback((event, selectedDate) => {
//     if (selectedDate) {
//       dateRef.current = selectedDate;
//       setIosDate(selectedDate);
//     }
//   }, []);

//   const handleIOSConfirm = () => {
//     onDateSelected(formatLocalDate(dateRef.current));
//     onClose();
//   };

//   const handleIOSCancel = () => {
//     onClose();
//   };

//   if (Platform.OS === 'android') {
//     if (!visible || !showPicker) return null;

//     return (
//       <FrozenDatePicker
//         value={dateRef.current}
//         onChange={handleAndroidChange}
//         display="calendar"
//         maximumDate={maxDateObj} // ← add this
//       />
//     );
//   }

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

//           <FrozenIOSPicker
//             value={iosDate}
//             onChange={handleIOSChange}
//             style={styles.CalModal_datePicker}
//             maximumDate={maxDateObj} // ← add this
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
import React from 'react';
import DatePicker from 'react-native-date-picker';

const parseLocalDate = dateString => {
  if (!dateString) {
    return new Date();
  }
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

const CalendarModal = ({
  visible,
  initialDate,
  onDateSelected,
  onClose,
  maxDate,
}) => {
  const date = parseLocalDate(initialDate);
  const max = maxDate ? parseLocalDate(maxDate) : undefined;

  return (
    <DatePicker
      modal
      open={visible}
      date={date}
      mode="date"
      maximumDate={max}
      onConfirm={selectedDate => {
        onDateSelected(formatLocalDate(selectedDate));
        onClose();
      }}
      onCancel={onClose}
    />
  );
};

export default CalendarModal;
