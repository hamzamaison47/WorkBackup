// AttendanceCalendar.js
/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import moment from 'moment';
import DFCalendar from '../../components/Attendance/DFCalendar';
import {getRegisterDetailsByDate} from '../../API/Attendance/getRegisterDetailsByDate';
import {useSelector} from 'react-redux';

// Helper functions for calendar (moved here as they are calendar-specific)
const pick = (obj, ...keys) =>
  keys.map(k => obj?.[k]).find(v => v !== undefined);
const bool = v => v === true || v === 'true' || v === 1 || v === '1';
const determineColor = item => {
  if (!item) return '#f0f0f0';
  const apiColor = pick(item, 'Color', 'color');
  if (apiColor && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(apiColor))
    return apiColor;
  return '#f0f0f0';
};
const getTextColor = hex => {
  try {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.5 ? '#000000' : '#FFFFFF';
  } catch {
    return '#000000';
  }
};
const normalizeArray = payload => {
  try {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (typeof payload === 'string') {
      const parsed = JSON.parse(payload);
      return Array.isArray(parsed) ? parsed : [];
    }
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.value)) return payload.value;
    return [];
  } catch {
    return [];
  }
};
// Convert seconds to 12-hour format
const secondsTo12Hour = seconds => {
  if (!seconds && seconds !== 0) return 'N/A';
  const sec = Number(seconds);
  if (!Number.isFinite(sec)) return 'N/A';
  if (sec === 0) return '12:00 AM';
  const totalSeconds = Math.abs(sec);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  let period = 'AM';
  let displayHours = hours;
  if (hours >= 12) {
    period = 'PM';
    displayHours = hours > 12 ? hours - 12 : hours;
  }
  if (hours === 0) displayHours = 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
};
const fmtTime12Hour = value => {
  if (!value && value !== 0) return 'N/A';
  if (!isNaN(value)) return secondsTo12Hour(Number(value));
  if (typeof value === 'string' && value.includes(':')) {
    const parts = value.split(':');
    if (parts.length >= 2) {
      const hours = parseInt(parts[0], 10) || 0;
      const minutes = parseInt(parts[1], 10) || 0;
      const totalSeconds = hours * 3600 + minutes * 60;
      return secondsTo12Hour(totalSeconds);
    }
  }
  if (String(value).includes('T')) {
    try {
      const timeStr = String(value).split('T')[1];
      return moment(`2000-01-01T${timeStr}`).format('hh:mm a');
    } catch {
      return value;
    }
  }
  return 'N/A';
};
const secondsToHours = seconds => {
  if (!seconds && seconds !== 0) return 'N/A';
  const sec = Number(seconds);
  if (!Number.isFinite(sec)) return 'N/A';
  if (sec === 0) return '0.00 hrs';
  const hours = sec / 3600;
  return `${hours.toFixed(2)} hrs`;
};
const fmtHours = value => {
  if (!value && value !== 0) return 'N/A';
  if (!isNaN(value)) return secondsToHours(Number(value));
  if (typeof value === 'string' && value.includes(':')) {
    const parts = value.split(':');
    if (parts.length >= 2) {
      const hours = parseInt(parts[0], 10) || 0;
      const minutes = parseInt(parts[1], 10) || 0;
      const seconds = parseInt(parts[2], 10) || 0;
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      return secondsToHours(totalSeconds);
    }
  }
  return 'N/A';
};
const normalizeDateISO = v => {
  if (!v) return '';
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = typeof v === 'string' && v.length >= 10 ? moment(v) : moment(v);
  if (!m || !m.isValid()) return '';
  return m.local().format('YYYY-MM-DD');
};
const normalizeTimeTo24h = v => {
  if (!v && v !== 0) return '';
  if (/^\d{1,5}$/.test(String(v))) {
    const sec = Number(v);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  const sv = String(v).trim();
  const t12 = moment(sv, ['h:mm A', 'hh:mm A'], true);
  if (t12.isValid()) return t12.format('HH:mm');
  const t24 = moment(sv, ['HH:mm', 'HH:mm:ss'], true);
  if (t24.isValid()) return t24.format('HH:mm');
  const mx = moment(sv);
  return mx.isValid() ? mx.format('HH:mm') : '';
};
const isBlankTime = v =>
  v === null ||
  v === undefined ||
  v === '' ||
  v === 0 ||
  v === '0' ||
  v === '00:00' ||
  v === '00:00:00';
const looksLikeMissingDate = iso =>
  !iso || String(iso).startsWith('1900-01-01');

// Reusable Detail Row Component
const DetailRow = ({label, value}) => (
  <View style={detailStyles.detailRow}>
    <Text style={detailStyles.detailLabel}>{label}:</Text>
    <Text style={detailStyles.detailValue}>{value || 'N/A'}</Text>
  </View>
);

// Helpers for month cache/keys
const monthKeyFromMoment = m => m.format('YYYY-MM');
const monthKeyFromAny = v => moment(v).format('YYYY-MM');

const AttendanceCalendar = ({userData, navigation, screenWidth, H_PADDING}) => {
  // Calendar states
  const [attendanceData, setAttendanceData] = useState({});
  const [markedDates, setMarkedDates] = useState({});
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDayDetails, setSelectedDayDetails] = useState(null);
  const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);
  // NEW: per-month cache to avoid stale flashes + speed up back/forward
  const [markedDatesCache, setMarkedDatesCache] = useState({}); // { 'YYYY-MM': markedDates }
  const [dataCache, setDataCache] = useState({}); // { 'YYYY-MM': attendanceMap }
  const latestRequestId = useRef(0);
  // Computed keys
  const monthKey = useMemo(
    () => monthKeyFromMoment(currentMonth),
    [currentMonth],
  );
  const selectedLegalEntity = useSelector(
    state => state.company.selectedLegalEntity,
  );
  useEffect(() => {
    if (userData?.employeeId) {
      // Clear caches and reload current month
      setMarkedDatesCache({});
      setDataCache({});
      setMarkedDates({});
      setAttendanceData({});
      warmLoadMonth(currentMonth);
    }
  }, [selectedLegalEntity]);
  // initial month fetch
  useEffect(() => {
    warmLoadMonth(currentMonth);
  }, []); // run once on mount

  // Build markedDates + map for one month
  const buildMonthMaps = useCallback(rows => {
    const marked = {};
    const map = {};
    const normalizedRows = normalizeArray(rows);
    normalizedRows.forEach(item => {
      const dateSrc = pick(
        item,
        'attendaceDate',
        'attendanceDate',
        'AttendaceDate',
        'AttendanceDate',
      );
      if (!dateSrc) return;
      try {
        const dateStr = moment(dateSrc).format('YYYY-MM-DD');
        const color = determineColor(item);
        marked[dateStr] = {
          customStyles: {
            container: {
              backgroundColor: color,
              borderRadius: 50,
              margin: 2,
              paddingVertical: 2,
              aspectRatio: 1,
              justifyContent: 'center',
              alignItems: 'center',
            },
            text: {color: getTextColor(color), fontWeight: 'bold'},
          },
        };
        map[dateStr] = {...item, color};
      } catch {
        /* ignore row */
      }
    });
    return {marked, map};
  }, []);

  // Cancel-safe fetch for a given month
  const fetchMonth = useCallback(
    async targetMoment => {
      if (!userData?.employeeId) return {marked: {}, map: {}};
      const reqId = ++latestRequestId.current; // only latest can update
      setCalendarLoading(true);
      try {
        const fromDate = moment(targetMoment)
          .startOf('month')
          .format('YYYY-MM-DD');
        const toDate = moment(targetMoment).endOf('month').format('YYYY-MM-DD');
        const rows = await getRegisterDetailsByDate({
          employeeId: userData.employeeId,
          fromDate,
          toDate,
        });
        // If a newer request started meanwhile, ignore this result
        if (reqId !== latestRequestId.current) return null;
        const {marked, map} = buildMonthMaps(rows);
        return {marked, map};
      } catch (err) {
        console.error('Attendance fetch error:', err?.message || err);
        return {marked: {}, map: {}};
      } finally {
        if (reqId === latestRequestId.current) setCalendarLoading(false);
      }
    },
    [userData?.employeeId, buildMonthMaps],
  );

  // Warm-load current month: use cache if present; fetch and update cache/state
  const warmLoadMonth = useCallback(
    async m => {
      const key = monthKeyFromAny(m);
      // If we already have the month cached, show it immediately
      if (markedDatesCache[key]) {
        setMarkedDates(markedDatesCache[key]);
        setAttendanceData(dataCache[key] || {});
      } else {
        // Otherwise, clear to avoid flashing previous month
        setMarkedDates({});
        setAttendanceData({});
      }
      const result = await fetchMonth(m);
      if (!result) return; // cancelled/older request
      const {marked, map} = result;
      // Update caches
      setMarkedDatesCache(prev => ({...prev, [key]: marked}));
      setDataCache(prev => ({...prev, [key]: map}));
      // Apply to screen (still latest month thanks to cancel guard)
      setMarkedDates(marked);
      setAttendanceData(map);
    },
    [markedDatesCache, dataCache, fetchMonth],
  );

  // Month changed by user
  const handleMonthChange = month => {
    const nextMoment = moment(month.dateString);
    setCurrentMonth(nextMoment);
    const nextKey = monthKeyFromAny(nextMoment);
    // Show cached instantly if we have it; otherwise clear to prevent stale flash
    if (markedDatesCache[nextKey]) {
      setMarkedDates(markedDatesCache[nextKey]);
      setAttendanceData(dataCache[nextKey] || {});
    } else {
      setMarkedDates({});
      setAttendanceData({});
    }
    // Fetch (cancel-safe); only latest request will land
    warmLoadMonth(nextMoment);
  };

  // Check if date has color (attendance record exists)
  const hasColor = useCallback(
    dateKey => {
      const details = attendanceData[dateKey];
      if (!details) return false;

      const color = details.color || determineColor(details);
      // Check if color exists and is not the default #f0f0f0
      return color && color.toLowerCase() !== '#f0f0f0';
    },
    [attendanceData],
  );

  const getRecordActionType = useCallback(
    details => {
      if (!details) return 'noRecord'; // No attendance record at all

      const hasRecordColor = hasColor(
        moment(details.attendanceDate || details.AttendanceDate).format(
          'YYYY-MM-DD',
        ),
      );

      if (!hasRecordColor) {
        return 'noRecord'; // No color means no attendance record
      }

      // If we have color (attendance record exists), check status
      const rawStatus = (details.Status ?? '').toString().trim().toLowerCase();
      const ABSENT_ALIASES = [
        'absent',
        'a',
        'no in/out',
        'no in out',
        'missing',
        'abs',
        'leave without pay',
      ];
      const offDay = bool(pick(details, 'offDay', 'OffDay'));
      const gazettedDay = bool(pick(details, 'gazettedDay', 'GazettedDay'));
      const noIn =
        isBlankTime(details.ClockIn) ||
        looksLikeMissingDate(details.ClockInDate);
      const noOut =
        isBlankTime(details.ClockOut) ||
        looksLikeMissingDate(details.ClockOutDate);
      const computedAbsent = noIn && noOut;
      const isAbsent = computedAbsent || ABSENT_ALIASES.includes(rawStatus);
      const isPresent =
        rawStatus === 'present' || (!noIn && !noOut && rawStatus === '');

      if (offDay || gazettedDay || isAbsent) {
        return 'markPresent';
      } else if (!isPresent) {
        return 'edit';
      }
      return 'none';
    },
    [hasColor],
  );

  // Check if date should be clickable
  const isDateClickable = useCallback(
    dateKey => {
      const details = attendanceData[dateKey];
      if (!details) return true; // No data - allow click to show "No attendance data"

      const color = details.color || determineColor(details);

      // Don't open modal for records with no color or #6ce66c color
      if (!color || color.toLowerCase() === '#6ce66c') {
        return false;
      }

      return true;
    },
    [attendanceData],
  );

  const handleDateSelect = day => {
    const key = day?.dateString;

    // Check if date should be clickable
    if (!isDateClickable(key)) {
      return; // Don't open modal for records with no color or #6ce66c color
    }

    setSelectedDate(key);
    setSelectedDayDetails(attendanceData[key]);
    setAttendanceModalVisible(true);
  };

  const handleMarkPresent = () => {
    if (!selectedDate) return;
    const selectedDateISO = normalizeDateISO(selectedDate);
    navigation.navigate('MarkPresentScreen', {
      employeeId: userData?.employeeId,
      employeeName: userData?.employeeName,
      attendanceDate: selectedDateISO,
      sourceScreen: 'MainDashboard',
    });
    setAttendanceModalVisible(false);
  };

  const handleEditAttendance = () => {
    if (!selectedDate || !selectedDayDetails) return;
    const selectedDateISO = normalizeDateISO(selectedDate);
    const normalizedClockIn = normalizeTimeTo24h(selectedDayDetails.ClockIn);
    const normalizedClockOut = normalizeTimeTo24h(selectedDayDetails.ClockOut);
    navigation.navigate('EditAttendanceScreen', {
      employeeId: userData?.employeeId,
      employeeName: userData?.employeeName,
      attendanceDate: selectedDateISO,
      clockIn: normalizedClockIn,
      clockOut: normalizedClockOut,
      remarks: selectedDayDetails?.Remarks || '',
      sourceScreen: 'MainDashboard',
    });
    setAttendanceModalVisible(false);
  };

  const handleShortLeave = () => {
    if (!selectedDate) return;
    const selectedDateISO = normalizeDateISO(selectedDate);
    navigation.navigate('LeaveSaveRecord', {
      mode: 'create',
      employeeId: userData?.employeeId,
      employeeName: userData?.employeeName,
      WorkerRecId: userData?.WorkerRecId,
      cameFrom: 'MainDashboard',
      isShortLeave: true,
      attendanceDate: selectedDateISO,
      prefillData: {leaveCategory: 'Half Day Leave'},
    });
    setAttendanceModalVisible(false);
  };

  const handleLeaveRequest = () => {
    if (!selectedDate) return;
    const selectedDateISO = normalizeDateISO(selectedDate);
    navigation.navigate('LeaveSaveRecord', {
      mode: 'create',
      employeeId: userData?.employeeId,
      employeeName: userData?.employeeName,
      WorkerRecId: userData?.WorkerRecId,
      cameFrom: 'MainDashboard',
      isLeaveRequest: true,
      attendanceDate: selectedDateISO,
      prefillData: {leaveStartDate: selectedDateISO},
    });
    setAttendanceModalVisible(false);
  };

  // Calendar marked dates with today highlight (kept lightweight)
  const todayStr = moment().format('YYYY-MM-DD');
  const withTodayMarked = useMemo(() => {
    const base = {...markedDates};
    base[todayStr] = {
      customStyles: {
        container: {
          borderWidth: 2,
          borderColor: '#0EA5E9',
          borderRadius: 50,
          margin: 2,
          paddingVertical: 2,
          aspectRatio: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor:
            markedDates[todayStr]?.customStyles?.container?.backgroundColor ||
            '#FFFFFF',
        },
        text: {
          fontWeight: '800',
          color: markedDates[todayStr]?.customStyles?.text?.color || '#0F172A',
        },
      },
    };
    return base;
  }, [markedDates, todayStr]);

  // Get responsive styles (extracted calendar-specific styles)
  const getResponsiveStyles = () => ({
    calendarSection: {
      marginTop: getResponsivePadding(16, screenWidth),
      paddingHorizontal: H_PADDING,
    },
    calendarCard: {
      borderRadius: getResponsiveSize(16, screenWidth),
      backgroundColor: '#FFFFFF',
      shadowColor: '#0F172A',
      shadowOffset: {width: 0, height: 8},
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 6,
      overflow: 'hidden',
      marginBottom: getResponsivePadding(16, screenWidth),
    },
    calendarContainer: {
      paddingHorizontal: getResponsivePadding(6, screenWidth),
      paddingBottom: getResponsivePadding(12, screenWidth),
      position: 'relative',
      minHeight: 340,
      justifyContent: 'center',
    },
    calendarLoadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.6)',
    },
  });

  const styles = getResponsiveStyles();

  return (
    <>
      {/* Calendar Section */}
      <View style={styles.calendarSection}>
        <View style={styles.calendarCard}>
          <View style={styles.calendarContainer}>
            {/* Force calendar to reset internal state on month switch */}
            <DFCalendar
              key={monthKey}
              currentDate={currentMonth.toDate()}
              markedDates={withTodayMarked}
              onDayPress={handleDateSelect}
              onMonthChange={handleMonthChange}
              enableSwipeMonths
              hideArrows={false}
              hideExtraDays={false}
              firstDay={1}
              hideDayNames={false}
              markingType="custom"
              themeOverrides={{
                backgroundColor: '#F5F7FB',
                calendarBackground: '#FFFFFF',
                textSectionTitleColor: '#8E99A4',
                monthTextColor: '#0F172A',
                arrowColor: '#0EA5E9',
                todayTextColor: '#0EA5E9',
                dayTextColor: '#0F172A',
                textDisabledColor: '#C7CED6',
                selectedDayTextColor: '#0F172A',
                textMonthFontWeight: '800',
                textMonthFontSize: 30,
                textDayFontSize: 14,
                textDayHeaderFontSize: 12,
              }}
            />
            {/* Subtle overlay while the next month is loading */}
            {calendarLoading && (
              <View style={styles.calendarLoadingOverlay}>
                <ActivityIndicator size="large" />
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Attendance Details Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={attendanceModalVisible}
        onRequestClose={() => setAttendanceModalVisible(false)}>
        <View style={detailStyles.modalContainer}>
          <View style={detailStyles.modalContent}>
            <View style={detailStyles.modalHeader}>
              <Text style={detailStyles.modalTitle}>
                {selectedDate
                  ? moment(selectedDate).format('dddd, MMMM Do, YYYY')
                  : ''}
              </Text>
              <TouchableOpacity
                style={detailStyles.closeButton}
                onPress={() => setAttendanceModalVisible(false)}>
                <Text style={detailStyles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            {selectedDayDetails ? (
              <ScrollView
                contentContainerStyle={detailStyles.detailsContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled">
                <View style={detailStyles.detailsGrid}>
                  <DetailRow
                    label="Clock In"
                    value={fmtTime12Hour(
                      pick(selectedDayDetails, 'clockIn', 'ClockIn'),
                    )}
                  />
                  <DetailRow
                    label="Clock Out"
                    value={fmtTime12Hour(
                      pick(selectedDayDetails, 'clockOut', 'ClockOut'),
                    )}
                  />
                  <DetailRow
                    label="Total Working Time"
                    value={fmtHours(
                      pick(
                        selectedDayDetails,
                        'totalWorkingTime',
                        'TotalWorkingTime',
                      ),
                    )}
                  />
                  <DetailRow
                    label="Overtime"
                    value={fmtHours(
                      pick(
                        selectedDayDetails,
                        'totalOvertime',
                        'TotalOvertime',
                      ),
                    )}
                  />
                  <DetailRow
                    label="Late Arrival"
                    value={fmtHours(
                      pick(
                        selectedDayDetails,
                        'lateArrivalTime',
                        'LateArrivalTime',
                      ),
                    )}
                  />
                  <DetailRow
                    label="Early Out"
                    value={fmtHours(
                      pick(selectedDayDetails, 'earlyOutTime', 'EarlyOutTime'),
                    )}
                  />
                  {pick(selectedDayDetails, 'leaveCode', 'LeaveCode') && (
                    <DetailRow
                      label="Leave Code"
                      value={pick(selectedDayDetails, 'leaveCode', 'LeaveCode')}
                    />
                  )}
                  {pick(selectedDayDetails, 'remarks', 'Remarks') && (
                    <DetailRow
                      label="Remarks"
                      value={pick(selectedDayDetails, 'remarks', 'Remarks')}
                    />
                  )}
                  {Number(
                    pick(
                      selectedDayDetails,
                      'lateArrivalTimeDeduction',
                      'LateArrivalTimeDeduction',
                    ),
                  ) > 0 && (
                    <DetailRow
                      label="Late Arrival Deduction"
                      value={fmtHours(
                        pick(
                          selectedDayDetails,
                          'lateArrivalTimeDeduction',
                          'LateArrivalTimeDeduction',
                        ),
                      )}
                    />
                  )}
                  {Number(
                    pick(
                      selectedDayDetails,
                      'earlyOutTimeDeduction',
                      'EarlyOutTimeDeduction',
                    ),
                  ) > 0 && (
                    <DetailRow
                      label="Early Out Deduction"
                      value={fmtHours(
                        pick(
                          selectedDayDetails,
                          'earlyOutTimeDeduction',
                          'EarlyOutTimeDeduction',
                        ),
                      )}
                    />
                  )}
                  {Number(
                    pick(
                      selectedDayDetails,
                      'totalTimeDeduction',
                      'TotalTimeDeduction',
                    ),
                  ) > 0 && (
                    <DetailRow
                      label="Total Deduction"
                      value={fmtHours(
                        pick(
                          selectedDayDetails,
                          'totalTimeDeduction',
                          'TotalTimeDeduction',
                        ),
                      )}
                    />
                  )}
                  {pick(selectedDayDetails, 'shiftId', 'ShiftId') && (
                    <DetailRow
                      label="Shift ID"
                      value={pick(selectedDayDetails, 'shiftId', 'ShiftId')}
                    />
                  )}
                </View>
                {/* Action Buttons */}
                <View style={detailStyles.actionButtonsContainer}>
                  {getRecordActionType(selectedDayDetails) === 'noRecord' && (
                    <>
                      {/* No color - only Leave Request button */}
                      <TouchableOpacity
                        style={[
                          detailStyles.actionButton,
                          detailStyles.leaveRequestButton,
                        ]}
                        onPress={handleLeaveRequest}>
                        <Text style={detailStyles.actionButtonText}>
                          Leave Request
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {getRecordActionType(selectedDayDetails) ===
                    'markPresent' && (
                    <>
                      {/* Has color - show Mark Present and Leave Request */}
                      <TouchableOpacity
                        style={[
                          detailStyles.actionButton,
                          detailStyles.markPresentButton,
                        ]}
                        onPress={handleMarkPresent}>
                        <Text style={detailStyles.actionButtonText}>
                          Mark Present
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          detailStyles.actionButton,
                          detailStyles.leaveRequestButton,
                        ]}
                        onPress={handleLeaveRequest}>
                        <Text style={detailStyles.actionButtonText}>
                          Leave Request
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {getRecordActionType(selectedDayDetails) === 'edit' && (
                    <>
                      {/* Has color with existing data - show Edit and Short Leave */}
                      <TouchableOpacity
                        style={[
                          detailStyles.actionButton,
                          detailStyles.editButton,
                        ]}
                        onPress={handleEditAttendance}>
                        <Text style={detailStyles.actionButtonText}>
                          Edit Attendance
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          detailStyles.actionButton,
                          detailStyles.shortLeaveButton,
                        ]}
                        onPress={handleShortLeave}>
                        <Text style={detailStyles.actionButtonText}>
                          Short Leave
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {(getRecordActionType(selectedDayDetails) === 'noRecord' ||
                    getRecordActionType(selectedDayDetails) === 'markPresent' ||
                    getRecordActionType(selectedDayDetails) === 'edit') && (
                    <TouchableOpacity
                      style={[
                        detailStyles.actionButton,
                        detailStyles.cancelButton,
                      ]}
                      onPress={() => setAttendanceModalVisible(false)}>
                      <Text
                        style={[
                          detailStyles.actionButtonText,
                          detailStyles.cancelButtonText,
                        ]}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            ) : (
              <View style={detailStyles.noDataContainer}>
                <Text style={detailStyles.noDataText}>
                  No attendance data for this date
                </Text>
                <View style={detailStyles.noDataButtons}>
                  {/* No record at all - only Leave Request button */}
                  <TouchableOpacity
                    style={[
                      detailStyles.actionButton,
                      detailStyles.leaveRequestButton,
                      detailStyles.fullWidthButton,
                    ]}
                    onPress={handleLeaveRequest}>
                    <Text style={detailStyles.actionButtonText}>
                      Leave Request
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

// Detail Modal Styles (moved here)
const detailStyles = {
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  modalTitle: {fontSize: 18, fontWeight: 'bold', color: '#1c1c1e', flex: 1},
  closeButton: {padding: 4, marginLeft: 10},
  closeButtonText: {fontSize: 20, color: '#8e8e93', fontWeight: 'bold'},
  detailsContent: {padding: 20, paddingBottom: 10},
  detailsGrid: {gap: 12},
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  detailLabel: {fontSize: 14, fontWeight: '500', color: '#8e8e93', flex: 1},
  detailValue: {
    fontSize: 14,
    fontWeight: '400',
    color: '#1c1c1e',
    flex: 1,
    textAlign: 'right',
  },
  actionButtonsContainer: {
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markPresentButton: {
    backgroundColor: '#6ce66c',
  },
  editButton: {
    backgroundColor: '#0EA5E9',
  },
  shortLeaveButton: {
    backgroundColor: '#FFA500',
  },
  leaveRequestButton: {
    backgroundColor: '#9370DB',
  },
  cancelButton: {
    backgroundColor: '#f1f1f1',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButtonText: {
    color: '#666666',
  },
  fullWidthButton: {
    marginTop: 8,
  },
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#8e8e93',
    textAlign: 'center',
    marginBottom: 20,
  },
  noDataButtons: {
    width: '100%',
    gap: 12,
  },
};

// Responsive utility functions (duplicated here if not shared; otherwise import from a utils file)
const getResponsiveSize = (baseSize, screenWidth) => {
  const scale = screenWidth / 375; // Base width (iPhone X)
  const newSize = baseSize * scale;
  return Math.max(Math.min(newSize, baseSize * 1.5), baseSize * 0.8);
};
const getResponsivePadding = (basePadding, screenWidth) => {
  if (screenWidth < 360) return basePadding * 0.7; // Small phones
  if (screenWidth > 414) return basePadding * 1.2; // Large phones
  return basePadding;
};

export default AttendanceCalendar;
