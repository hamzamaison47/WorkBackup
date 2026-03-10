import {createSlice} from '@reduxjs/toolkit';
import moment from 'moment-timezone';

export const DATE_FORMAT_OPTIONS = [
  {label: 'MMM DD, YYYY', dateFormat: 'MMM dd, yyyy', example: 'Mar 06, 2026'},
  {label: 'MM/DD/YYYY', dateFormat: 'MM/dd/yyyy', example: '03/06/2026'},
  {label: 'DD/MM/YYYY', dateFormat: 'dd/MM/yyyy', example: '06/03/2026'},
  {label: 'YYYY-MM-DD', dateFormat: 'yyyy-MM-dd', example: '2026-03-06'},
  {label: 'DD MMM YYYY', dateFormat: 'dd MMM yyyy', example: '06 Mar 2026'},
];

export const TIME_FORMAT_OPTIONS = [
  {label: '12 Hour', timeFormat: 'hh:mm a', example: '02:30 PM'},
  {label: '24 Hour', timeFormat: 'HH:mm', example: '14:30'},
];

// Auto-generate from moment-timezone's full IANA database
export const TIMEZONE_OPTIONS = [
  // Device default always first
  {label: 'Device Default', value: 'local', offset: ''},
  // All IANA timezones sorted alphabetically
  ...moment.tz.names().map(tz => ({
    label: tz.replace(/_/g, ' '), // "Asia/Kuala_Lumpur" → "Asia/Kuala Lumpur"
    value: tz,
    offset: `UTC${moment.tz(tz).format('Z')}`, // e.g. "UTC+05:00"
    region: tz.includes('/') ? tz.split('/')[0] : 'Other',
  })),
];

const dateFormatSlice = createSlice({
  name: 'dateFormat',
  initialState: {
    selectedFormat: DATE_FORMAT_OPTIONS[0],
    selectedTimeFormat: TIME_FORMAT_OPTIONS[0],
    selectedTimezone: TIMEZONE_OPTIONS[0],
  },
  reducers: {
    setDateFormat: (state, action) => {
      state.selectedFormat = action.payload;
    },
    setTimeFormat: (state, action) => {
      state.selectedTimeFormat = action.payload;
    },
    setTimezone: (state, action) => {
      state.selectedTimezone = action.payload;
    },
  },
});

export const {setDateFormat, setTimeFormat, setTimezone} =
  dateFormatSlice.actions;
export default dateFormatSlice.reducer;
