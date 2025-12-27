// import React from 'react';
// import {Modal, View, TouchableOpacity, Text} from 'react-native';
// import {Calendar} from 'react-native-calendars';
// import styles from '../../styles/styles';

// const CalendarModal = ({
//   visible,
//   current,
//   selectedDate,
//   markedDates,
//   onDateSelected,
//   onClose,
// }) => {
//   // Merge markedDates and customize the selected date with a circular highlight
//   const highlightedDates = {
//     ...markedDates,
//     ...(selectedDate && {
//       [selectedDate]: {
//         selected: true,
//         customStyles: {
//           container: {
//             backgroundColor: '#0A66C2',
//             borderRadius: 50,
//             width: 36,
//             height: 36,
//             justifyContent: 'center',
//             alignItems: 'center',
//           },
//           text: {
//             color: '#FFFFFF',
//             fontWeight: 'bold',
//           },
//         },
//       },
//     }),
//   };

//   return (
//     <Modal visible={visible} transparent={true} animationType="slide">
//       <View style={styles.CalMod_ModalContainer}>
//         <View style={styles.CalMod_ModalContent}>
//           <Calendar
//             current={current}
//             markedDates={highlightedDates}
//             markingType="custom" // Use custom marking
//             onDayPress={day => {
//               onDateSelected(day.dateString);
//               onClose();
//             }}
//           />
//           <TouchableOpacity style={styles.CalMod_CloseButton} onPress={onClose}>
//             <Text style={styles.CalMod_CloseButtonText}>Close</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </Modal>
//   );
// };

// export default CalendarModal;

import React from 'react';
import {Modal, View, TouchableOpacity, Text, I18nManager} from 'react-native';
import {Calendar} from 'react-native-calendars';
import {useTranslation} from 'react-i18next';
import styles from '../../styles/styles';

const CalendarModal = ({
  visible,
  current,
  selectedDate,
  markedDates,
  onDateSelected,
  onClose,
}) => {
  const {t, i18n} = useTranslation();
  const currentLanguage = i18n.language;
  const isRTL = currentLanguage === 'ur';

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

  // Configure calendar based on language
  const calendarConfig = {
    current: current,
    markedDates: highlightedDates,
    markingType: 'custom',
    onDayPress: day => {
      onDateSelected(day.dateString);
      onClose();
    },
    // RTL support for Urdu
    style: {
      direction: isRTL ? 'rtl' : 'ltr',
    },
  };

  // Add Urdu month and day names if language is Urdu
  if (currentLanguage === 'ur') {
    calendarConfig.monthNames = [
      'جنوری',
      'فروری',
      'مارچ',
      'اپریل',
      'مئی',
      'جون',
      'جولائی',
      'اگست',
      'ستمبر',
      'اکتوبر',
      'نومبر',
      'دسمبر',
    ];

    calendarConfig.monthNamesShort = [
      'جنو',
      'فرو',
      'مار',
      'اپر',
      'مئی',
      'جون',
      'جول',
      'اگس',
      'ستم',
      'اکت',
      'نوم',
      'دسم',
    ];

    calendarConfig.dayNames = [
      'اتوار',
      'پیر',
      'منگل',
      'بدھ',
      'جمعرات',
      'جمعہ',
      'ہفتہ',
    ];

    calendarConfig.dayNamesShort = ['ا', 'پ', 'م', 'ب', 'ج', 'ج', 'ہ'];
  }

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.CalMod_ModalContainer}>
        <View style={[styles.CalMod_ModalContent, isRTL && {direction: 'rtl'}]}>
          <Calendar {...calendarConfig} />
          <TouchableOpacity
            style={[
              styles.CalMod_CloseButton,
              isRTL && {alignSelf: 'flex-start'},
            ]}
            onPress={onClose}>
            <Text style={styles.CalMod_CloseButtonText}>
              {t('common.close')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default CalendarModal;
