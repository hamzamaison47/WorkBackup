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
//       <View style={styles.CalModal_modalContainer}>
//         <View style={styles.CalModal_modalContent}>
//           {/* Header */}
//           <View style={styles.CalModal_header}>
//             <Text style={styles.CalModal_headerTitle}>Select Date</Text>
//           </View>

//           {/* iOS Date Picker */}
//           {showPicker && (
//             <DateTimePicker
//               value={date}
//               mode="date"
//               display="inline"
//               onChange={onChange}
//               accentColor="#0A66C2"
//               style={styles.CalModal_datePicker}
//             />
//           )}

//           {/* Footer buttons for iOS */}
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

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// import React, {useState, useEffect} from 'react';
// import {Modal, View, TouchableOpacity, Text, Platform} from 'react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';

// import styles from '../../styles/styles';

// const CalendarModal = ({visible, current, onDateSelected, onClose}) => {
//   const [date, setDate] = useState(new Date());
//   const [showPicker, setShowPicker] = useState(false);

//   useEffect(() => {
//     if (!visible) {
//       setShowPicker(false);
//       return;
//     }

//     if (current) {
//       const normalized =
//         typeof current === 'string' && current.includes('T')
//           ? current.split('T')[0]
//           : current;

//       setDate(new Date(normalized));
//     } else {
//       setDate(new Date());
//     }

//     setShowPicker(true);
//   }, [visible]);

//   const handleChange = (event, selectedDate) => {
//     if (Platform.OS === 'android') {
//       setShowPicker(false);

//       if (event?.type === 'set' && selectedDate) {
//         onDateSelected(selectedDate.toISOString().split('T')[0]);
//       }

//       onClose();
//       return;
//     }

//     if (selectedDate) {
//       setDate(selectedDate);
//     }
//   };

//   const handleIOSConfirm = () => {
//     onDateSelected(date.toISOString().split('T')[0]);
//     setShowPicker(false);
//     onClose();
//   };

//   const handleIOSCancel = () => {
//     setShowPicker(false);
//     onClose();
//   };

//   if (Platform.OS === 'android') {
//     return (
//       <>
//         {visible && showPicker && (
//           <DateTimePicker
//             value={date}
//             mode="date"
//             display="calendar"
//             onChange={handleChange}
//             accentColor="#0A66C2"
//           />
//         )}
//       </>
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

//           {showPicker && (
//             <DateTimePicker
//               value={date}
//               mode="date"
//               display="inline"
//               onChange={handleChange}
//               accentColor="#0A66C2"
//               style={styles.CalModal_datePicker}
//             />
//           )}

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

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

import React, {useState, useEffect, useRef} from 'react';
import {Modal, View, TouchableOpacity, Text, Platform} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import styles from '../../styles/styles';

const CalendarModal = ({visible, current, onDateSelected, onClose}) => {
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const initialDateRef = useRef(null);

  useEffect(() => {
    if (visible) {
      const newDate = current ? new Date(current.split('T')[0]) : new Date();

      const shouldUpdate =
        !initialDateRef.current ||
        initialDateRef.current.toDateString() !== newDate.toDateString();

      if (shouldUpdate) {
        setDate(newDate);
        initialDateRef.current = newDate;
      }

      // Show picker after a brief delay to ensure modal is ready
      setTimeout(() => setShowPicker(true), 100);
    } else {
      setShowPicker(false);
    }
  }, [visible]);

  const handleChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);

      if (event?.type === 'set' && selectedDate) {
        onDateSelected(selectedDate.toISOString().split('T')[0]);
      }

      // Always close on any interaction (set or dismiss)
      onClose();
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

  // Android: wrap picker in modal to prevent background touches
  if (Platform.OS === 'android') {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}>
        <TouchableOpacity
          style={styles.CalModal_modalContainer}
          activeOpacity={1}
          onPress={onClose}>
          <View
            style={styles.CalModal_androidPickerContainer}
            onStartShouldSetResponder={() => true}>
            {showPicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="calendar"
                onChange={handleChange}
                accentColor="#0A66C2"
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }

  // iOS: render modal with picker
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
