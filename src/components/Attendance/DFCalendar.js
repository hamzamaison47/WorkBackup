import React, {useMemo} from 'react';
import {StyleSheet} from 'react-native';
import {format} from 'date-fns';
import brand from '../../theme/brand';

// Resilient import
const RNCalendars = require('react-native-calendars');
const CalendarImpl = RNCalendars.Calendar || RNCalendars.default || RNCalendars;
// LocaleConfig lives on the module namespace
const {LocaleConfig} = RNCalendars;

/** One-time locale init with unique weekday abbreviations */
if (LocaleConfig && !LocaleConfig.locales?.df) {
  LocaleConfig.locales.df = {
    monthNames: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    monthNamesShort: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],
    // IMPORTANT: make these unique so keys never collide
    dayNames: [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ],
    dayNamesShort: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'], // <- unique keys
    today: 'Today',
  };
  LocaleConfig.defaultLocale = 'df';
}

/**
 * DFCalendar – presentational wrapper around react-native-calendars
 */
const DFCalendar = ({
  currentDate = new Date(),
  markedDates = {},
  onDayPress,
  onMonthChange,
  enableSwipeMonths = true,
  themeOverrides = {},
  hideDayNames = false, // still supported
  style,
  ...rest // forward any other Calendar props
}) => {
  if (typeof CalendarImpl !== 'function' && typeof CalendarImpl !== 'object') {
    throw new Error(
      "[DFCalendar] Couldn't resolve 'Calendar' from 'react-native-calendars'. " +
        'Check that the package is installed and its version matches the import style.',
    );
  }

  const currentStr = useMemo(
    () => format(currentDate, 'yyyy-MM-dd'),
    [currentDate],
  );

  return (
    <CalendarImpl
      current={currentStr}
      markedDates={markedDates}
      markingType="custom"
      onDayPress={onDayPress}
      onMonthChange={onMonthChange}
      enableSwipeMonths={enableSwipeMonths}
      hideDayNames={hideDayNames}
      style={[styles.calendar, style]}
      theme={{
        backgroundColor: '#ffffff',
        calendarBackground: '#ffffff',
        textSectionTitleColor: '#b6c1cd',
        selectedDayBackgroundColor: brand.primary,
        selectedDayTextColor: '#ffffff',
        todayTextColor: brand.primaryStrong,
        dayTextColor: '#2d4150',
        textDisabledColor: '#d9e1e8',
        dotColor: brand.primaryStrong,
        selectedDotColor: '#ffffff',
        arrowColor: brand.primaryStrong,
        monthTextColor: '#2d4150',
        textDayFontWeight: '400',
        textMonthFontWeight: 'bold',
        textDayHeaderFontWeight: '500',
        textDayFontSize: 16,
        textMonthFontSize: 18,
        textDayHeaderFontSize: 14,
        ...themeOverrides,
      }}
      {...rest}
    />
  );
};

const styles = StyleSheet.create({
  calendar: {borderRadius: 12},
});

export default DFCalendar;
