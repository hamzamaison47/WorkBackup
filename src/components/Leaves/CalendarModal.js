import React from 'react';
import DatePicker from 'react-native-date-picker';

// CalendarModal.js - replace the parseLocalDate function
const parseLocalDate = dateString => {
  if (!dateString) return new Date();

  // Handle both YYYY-MM-DD and YYYY-MM-DDTHH:MM:SS formats
  let datePart = dateString;
  if (dateString.includes('T')) {
    datePart = dateString.split('T')[0];
  }

  const [year, month, day] = datePart.split('-').map(Number);

  // Validate the date components
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return new Date();
  }

  const date = new Date(year, month - 1, day);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return new Date();
  }

  return date;
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
  minDate, // ✅ add this
  mode = 'datetime',
}) => {
  const date = parseLocalDate(initialDate);
  const max = maxDate ? parseLocalDate(maxDate) : undefined;
  const min = minDate ? parseLocalDate(minDate) : undefined; // ✅ add this

  return (
    <DatePicker
      modal
      open={visible}
      date={date}
      mode="date"
      is24hourSource="locale"
      locale="en_GB" // forces 24-hour display regardless of device locale
      maximumDate={max}
      minimumDate={min} // ✅ add this
      onConfirm={selectedDate => {
        onDateSelected(formatLocalDate(selectedDate));
        onClose();
      }}
      onCancel={onClose}
    />
  );
};

export default CalendarModal;
