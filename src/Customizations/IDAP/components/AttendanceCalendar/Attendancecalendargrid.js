/* eslint-disable curly */
import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {AppTokens} from '../../../../components/AppComponentsDesign/Tokens';
import {
  conditionalScale,
  conditionalVerticalScale,
  conditionalFontScale,
} from '../../../../store/utils/scaling';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
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
];

const pad = n => String(n).padStart(2, '0');
const toDateKey = d =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const startOfDay = d => {
  if (!d) return null;
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};

// Status → { bg, dot, text } mirrors DynamicRequestCard's status-pill palette
// so the calendar visually matches every other status indicator in the app.
const STATUS_COLORS = {
  onTime: {bg: AppTokens.greenBg, dot: AppTokens.green, text: '#065F46'},
  irregular: {bg: AppTokens.redBg, dot: AppTokens.red, text: '#991B1B'},
  // "missing" is the waiting/attention family — slate, not amber
  // (statusWaiting* in Tokens.js).
  missing: {
    bg: AppTokens.statusWaitingBg,
    dot: AppTokens.statusWaiting,
    text: AppTokens.statusWaitingText,
  },
  // "absent" uses the Draft family so it reads differently from "missing"
  // (waiting family) at a glance.
  absent: {
    bg: AppTokens.statusDraftBg,
    dot: AppTokens.statusDraft,
    text: AppTokens.statusDraftText,
  },
  leave: {bg: AppTokens.blueBg, dot: AppTokens.blue, text: AppTokens.blue},
};

// Priority order when a record could match more than one condition.
export const getDayStatus = record => {
  if (!record) return null;
  if (record.IsLeave) return 'leave';
  if (record.IsAbsent) return 'absent';
  if (record.IsLateArrival || record.IsEarlyDeparture) return 'irregular';
  if (!record.ClockIn || !record.ClockOut) return 'missing';
  return 'onTime';
};

const AttendanceCalendarGrid = ({
  year,
  month, // 0-indexed
  attendanceMap, // { 'YYYY-M-D': record }
  periodStart,
  periodEnd,
  tokens: T,
  primaryColor,
  onDayPress,
}) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const today = startOfDay(new Date());
  const pStart = startOfDay(periodStart);
  const pEnd = startOfDay(periodEnd);

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <View style={{marginBottom: conditionalVerticalScale(18, 20, 22, 24)}}>
      <Text
        style={{
          fontSize: conditionalFontScale(14, 15, 16, 16),
          fontWeight: '700',
          color: T.titleText,
          marginBottom: conditionalVerticalScale(10, 11, 12, 12),
          letterSpacing: 0.2,
        }}>
        {MONTH_NAMES[month]} {year}
      </Text>

      <View
        style={{
          flexDirection: 'row',
          marginBottom: conditionalVerticalScale(6, 7, 8, 8),
        }}>
        {WEEKDAY_LABELS.map((label, idx) => (
          <View key={idx} style={{flex: 1, alignItems: 'center'}}>
            <Text
              style={{
                fontSize: conditionalFontScale(10, 10.5, 11, 11),
                fontWeight: '700',
                color: T.subtitleText,
                letterSpacing: 0.5,
              }}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      {weeks.map((week, wIdx) => (
        <View
          key={wIdx}
          style={{
            flexDirection: 'row',
            marginBottom: conditionalVerticalScale(5, 6, 7, 7),
          }}>
          {week.map((day, dIdx) => {
            if (day === null) {
              return <View key={dIdx} style={{flex: 1, aspectRatio: 1}} />;
            }

            const dateObj = new Date(year, month, day);
            const dateKey = toDateKey(dateObj);
            const inPeriod =
              pStart && pEnd ? dateObj >= pStart && dateObj <= pEnd : true;
            const record = attendanceMap[dateKey];
            const status = getDayStatus(record);
            const colors = status ? STATUS_COLORS[status] : null;
            const isToday = today && dateObj.getTime() === today.getTime();

            const cellBg = colors ? colors.bg : 'transparent';
            const cellTextColor = !inPeriod
              ? T.subtitleText
              : colors
              ? colors.text
              : T.titleText;
            const cellOpacity = inPeriod ? 1 : 0.35;

            return (
              <View
                key={dIdx}
                style={{
                  flex: 1,
                  aspectRatio: 1,
                  padding: conditionalScale(2, 2, 3, 3),
                }}>
                <TouchableOpacity
                  activeOpacity={inPeriod && record ? 0.7 : 1}
                  disabled={!inPeriod || !record}
                  onPress={() =>
                    onDayPress && onDayPress({dateObj, dateKey, record, status})
                  }
                  style={{
                    flex: 1,
                    borderRadius: conditionalScale(9, 9.5, 10, 10),
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: cellBg,
                    opacity: cellOpacity,
                    borderWidth: isToday ? 2 : 0,
                    borderColor: primaryColor,
                  }}>
                  <Text
                    style={{
                      fontSize: conditionalFontScale(12, 12.5, 13, 13),
                      fontWeight: isToday ? '800' : status ? '700' : '500',
                      color: cellTextColor,
                    }}>
                    {day}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
};

export {STATUS_COLORS};
export default AttendanceCalendarGrid;
