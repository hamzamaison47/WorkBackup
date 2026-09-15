/* eslint-disable no-unused-vars */
/* eslint-disable curly */
import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import moment from 'moment';
import {useSelector} from 'react-redux';
import {useIsFocused, useNavigation} from '@react-navigation/native';

import DFCalendar from '../../components/Attendance/DFCalendar';
import {getRegisterDetailsByDate} from '../../API/Attendance/getRegisterDetailsByDate';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import AlertModal from '../../components/Alert/AlertModal';
import brand from '../../theme/brand';
import {AppTokens} from '../../components/AppComponentsDesign/Tokens';

/* ---------------- helpers (outside component) ---------------- */
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

/** Normalize any date-ish value to "YYYY-MM-DD" (local) */
const normalizeDateISO = v => {
  if (!v) return '';
  // If already YYYY-MM-DD
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  // ISO with time or other → moment
  const m =
    typeof v === 'string' && v.length >= 10 ? moment(v) : moment(parseISO(v));
  if (!m || !m.isValid()) return '';
  return m.local().format('YYYY-MM-DD');
};

/** Normalize mixed time formats to strict "HH:mm" (24h) */
const normalizeTimeTo24h = v => {
  if (!v && v !== 0) return '';
  // seconds (number or numeric string)
  if (/^\d{1,5}$/.test(String(v))) {
    const sec = Number(v);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  const sv = String(v).trim();
  // 12h like "9:05 AM" / "09:05 pm"
  const t12 = moment(sv, ['h:mm A', 'hh:mm A'], true);
  if (t12.isValid()) return t12.format('HH:mm');
  // 24h "HH:mm" or "HH:mm:ss"
  const t24 = moment(sv, ['HH:mm', 'HH:mm:ss'], true);
  if (t24.isValid()) return t24.format('HH:mm');
  // Last resort: parse loosely
  const mx = moment(sv);
  return mx.isValid() ? mx.format('HH:mm') : '';
};

const parseISO = iso =>
  iso ? moment.parseZone(iso, moment.ISO_8601, true).utc() : null;
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
/* ---------------------------------------------------------------- */

const AttendanceCalendarScreen = () => {
  const {userData} = useSelector(state => state.user || {});
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState('');
  const [attendanceData, setAttendanceData] = useState({});
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDayDetails, setSelectedDayDetails] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [alert, setAlert] = useState({visible: false, text: ''});
  const isFocused = useIsFocused();

  const employeeId = userData?.employeeId;
  const selectedLegalEntity = useSelector(
    state => state.company.selectedLegalEntity,
  );
  const getStatusDescription = useCallback((color, details) => {
    if (!details) return 'No Data';
    const apiStatus = pick(details, 'Status', 'status');
    if (apiStatus) return apiStatus;

    const offDay = bool(pick(details, 'offDay', 'OffDay'));
    const gazettedDay = bool(pick(details, 'gazettedDay', 'GazettedDay'));
    const absent = bool(pick(details, 'absent', 'Absent'));
    const leaveCode = pick(details, 'leaveCode', 'LeaveCode');
    const lateDed =
      Number(
        pick(details, 'lateArrivalTimeDeduction', 'LateArrivalTimeDeduction'),
      ) || 0;
    const earlyDed =
      Number(pick(details, 'earlyOutTimeDeduction', 'EarlyOutTimeDeduction')) ||
      0;
    const totalDed =
      Number(pick(details, 'totalTimeDeduction', 'TotalTimeDeduction')) || 0;

    if (offDay || gazettedDay) return 'Holiday/Off Day';
    if (absent && !leaveCode) return 'Absent';
    if (lateDed > 0 || earlyDed > 0 || totalDed > 0) {
      if (lateDed > 0 && earlyDed > 0) return 'Late Arrival & Early Out';
      if (lateDed > 0) return 'Late Arrival';
      if (earlyDed > 0) return 'Early Out';
      return 'Time Deductions';
    }
    if (!absent && leaveCode) return 'On Leave';
    return 'Present';
  }, []);

  // Determine if record is absent/off day or needs editing
  const getRecordActionType = useCallback(details => {
    if (!details) return 'none';

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
      isBlankTime(details.ClockIn) || looksLikeMissingDate(details.ClockInDate);
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
  }, []);

  const processAttendanceData = useCallback(rows => {
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

    setMarkedDates(marked);
    setAttendanceData(map);
  }, []);

  const fetchAttendanceData = useCallback(async () => {
    if (!employeeId) {
      console.warn('No employeeId available');
      return;
    }

    try {
      setLoading(true);
      const fromDate = moment(currentMonth)
        .startOf('month')
        .format('YYYY-MM-DD');
      const toDate = moment(currentMonth).endOf('month').format('YYYY-MM-DD');

      const rows = await getRegisterDetailsByDate({
        employeeId,
        fromDate,
        toDate,
      });
      processAttendanceData(rows);
    } catch (err) {
      console.error('Attendance fetch error:', err?.message || err);
      setAlert({
        visible: true,
        text: 'Failed to fetch data.',
      });
    } finally {
      setLoading(false);
    }
  }, [employeeId, currentMonth, processAttendanceData]);
  // Add this useEffect to refresh when legal entity changes
  useEffect(() => {
    if (employeeId) {
      // Clear all attendance data
      setAttendanceData({});
      setMarkedDates({});
      setSelectedDayDetails(null);

      // Refresh calendar data
      fetchAttendanceData();
    }
  }, [employeeId, fetchAttendanceData, selectedLegalEntity]); // Add selectedLegalEntity as dependency
  useEffect(() => {
    if (isFocused && employeeId) fetchAttendanceData();
  }, [currentMonth, fetchAttendanceData, isFocused, employeeId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchAttendanceData();
    } finally {
      setRefreshing(false);
    }
  }, [fetchAttendanceData]);

  const handleDateSelect = day => {
    const key = day?.dateString;
    setSelectedDate(key);
    setSelectedDayDetails(attendanceData[key]);
    setModalVisible(true);
  };

  const handleMonthChange = month => {
    setCurrentMonth(moment(month.dateString));
  };

  const handleMarkPresent = () => {
    if (!selectedDate || !selectedDayDetails) return;

    const selectedDateISO = normalizeDateISO(selectedDate);

    navigation.navigate('MarkPresentScreen', {
      employeeId: userData?.employeeId,
      employeeName: userData?.employeeName,
      attendanceDate: selectedDateISO,
      sourceScreen: 'AttendanceCalendarScreen',
    });

    setModalVisible(false);
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
      sourceScreen: 'AttendanceCalendarScreen',
    });

    setModalVisible(false);
  };

  // New function to handle Short Leave
  const handleShortLeave = () => {
    if (!selectedDate || !selectedDayDetails) return;

    const selectedDateISO = normalizeDateISO(selectedDate);

    // Navigate to LeaveRequestSaveRecord with edit attendance scenario
    navigation.navigate('LeaveSaveRecord', {
      mode: 'create',
      employeeId: userData?.employeeId,
      employeeName: userData?.employeeName,
      WorkerRecId: userData?.WorkerRecId,
      cameFrom: 'AttendanceCalendarScreen',
      isShortLeave: true,
      attendanceDate: selectedDateISO,
      prefillData: {
        leaveCategory: 'Half Day Leave',
      },
    });

    setModalVisible(false);
  };

  // New function to handle Leave Request
  const handleLeaveRequest = () => {
    if (!selectedDate) return;

    const selectedDateISO = normalizeDateISO(selectedDate);

    // Navigate to LeaveRequestSaveRecord with mark present scenario
    navigation.navigate('LeaveSaveRecord', {
      mode: 'create',
      employeeId: userData?.employeeId,
      employeeName: userData?.employeeName,
      WorkerRecId: userData?.WorkerRecId,
      cameFrom: 'AttendanceCalendarScreen',
      isLeaveRequest: true,
      attendanceDate: selectedDateISO,
      prefillData: {
        leaveStartDate: selectedDateISO,
      },
    });

    setModalVisible(false);
  };

  // --- ensure "today" is visibly highlighted ---
  const todayStr = useMemo(() => moment().format('YYYY-MM-DD'), []);
  const withTodayMarked = useMemo(() => {
    const base = {...markedDates};
    const isSameMonth = currentMonth.isSame(moment(), 'month');

    if (isSameMonth) {
      // If the API already marked today, keep its fill but add a blue ring.
      const existing = base[todayStr]?.customStyles || {};
      const prevContainer = existing.container || {};
      const prevText = existing.text || {};

      base[todayStr] = {
        customStyles: {
          container: {
            ...prevContainer,
            borderWidth: 2, // blue ring around the day
            borderColor: brand.primaryStrong,
            borderRadius: 50,
            margin: 2,
            paddingVertical: 2,
            aspectRatio: 1,
            justifyContent: 'center',
            alignItems: 'center',
          },
          text: {
            ...prevText,
            fontWeight: '800',
            color: prevText.color || brand.text,
          },
        },
      };
    }
    return base;
  }, [markedDates, currentMonth, todayStr]);
  // ---------------------------------------------------

  const headerSubtitle = useMemo(
    () => currentMonth.format('MMMM YYYY'),
    [currentMonth],
  );

  const actionType = useMemo(
    () => getRecordActionType(selectedDayDetails),
    [selectedDayDetails, getRecordActionType],
  );

  return (
    <ActionPaneContainer
      pageTitle="Attendance Calendar"
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}>
      <View style={styles.container}>
        {!employeeId ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              Please log in to view attendance data
            </Text>
          </View>
        ) : (
          <>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={brand.primaryStrong} />
                <Text style={styles.loadingText}>
                  Loading attendance data...
                </Text>
              </View>
            ) : (
              <ScrollView
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                  />
                }>
                {/* Modern Calendar Card */}
                <View style={styles.calendarCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardNav}>
                      <TouchableOpacity
                        accessibilityLabel="Previous month"
                        onPress={() =>
                          setCurrentMonth(m => moment(m).subtract(1, 'month'))
                        }>
                        <Text style={styles.navBtn}>{'‹'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityLabel="Next month"
                        onPress={() =>
                          setCurrentMonth(m => moment(m).add(1, 'month'))
                        }>
                        <Text style={styles.navBtn}>{'›'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <DFCalendar
                    currentDate={currentMonth.toDate()}
                    // use the merged marks that include "today"
                    markedDates={withTodayMarked}
                    onDayPress={handleDateSelect}
                    onMonthChange={handleMonthChange}
                    enableSwipeMonths
                    hideArrows
                    hideExtraDays={false}
                    firstDay={1}
                    hideDayNames={false}
                    markingType="custom"
                    themeOverrides={{
                      backgroundColor: '#F5F7FB',
                      calendarBackground: '#FFFFFF',
                      textSectionTitleColor: '#8E99A4',
                      monthTextColor: brand.text,
                      arrowColor: brand.primaryStrong,
                      todayTextColor: brand.primaryStrong, // also tint today's number
                      dayTextColor: brand.text,
                      textDisabledColor: '#C7CED6',
                      selectedDayTextColor: brand.text,
                      textMonthFontWeight: '800',
                      textMonthFontSize: 30,
                      textDayFontSize: 14,
                      textDayHeaderFontSize: 12,
                    }}
                    style={styles.calendar}
                  />
                </View>

                {/* Legend */}
                <View style={styles.legendContainer}>
                  <Text style={styles.legendTitle}>Status Legend</Text>
                  <View style={styles.legendItems}>
                    <View style={styles.legendItem}>
                      <View
                        style={[styles.legendColor, styles.legendPresent]}
                      />
                      <Text style={styles.legendText}>Present</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendColor, styles.legendAbsent]} />
                      <Text style={styles.legendText}>Absent</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendColor, styles.legendLate]} />
                      <Text style={styles.legendText}>Late/Early Out</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendColor, styles.legendLeave]} />
                      <Text style={styles.legendText}>On Leave</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View
                        style={[styles.legendColor, styles.legendHoliday]}
                      />
                      <Text style={styles.legendText}>Holiday/Off Day</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendColor, styles.legendNoData]} />
                      <Text style={styles.legendText}>No Data</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            )}
          </>
        )}

        {/* Bottom Sheet Modal */}
        <Modal
          animationType="slide"
          transparent
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedDate
                    ? moment(selectedDate).format('dddd, MMMM Do, YYYY')
                    : ''}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              {selectedDayDetails ? (
                <ScrollView
                  contentContainerStyle={styles.detailsContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled">
                  <View style={styles.detailsGrid}>
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
                        pick(
                          selectedDayDetails,
                          'earlyOutTime',
                          'EarlyOutTime',
                        ),
                      )}
                    />
                    {pick(selectedDayDetails, 'leaveCode', 'LeaveCode') && (
                      <DetailRow
                        label="Leave Code"
                        value={pick(
                          selectedDayDetails,
                          'leaveCode',
                          'LeaveCode',
                        )}
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
                  <View style={styles.actionButtonsContainer}>
                    {actionType === 'markPresent' && (
                      <>
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            styles.markPresentButton,
                          ]}
                          onPress={handleMarkPresent}>
                          <Text style={styles.actionButtonText}>
                            Mark Present
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            styles.leaveRequestButton,
                          ]}
                          onPress={handleLeaveRequest}>
                          <Text style={styles.actionButtonText}>
                            Leave Request
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {actionType === 'edit' && (
                      <>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.editButton]}
                          onPress={handleEditAttendance}>
                          <Text
                            style={[
                              styles.actionButtonText,
                              {color: brand.onPrimary},
                            ]}>
                            Edit Attendance
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.shortLeaveButton]}
                          onPress={handleShortLeave}>
                          <Text style={styles.actionButtonText}>
                            Short Leave
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {(actionType === 'markPresent' ||
                      actionType === 'edit') && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton]}
                        onPress={() => setModalVisible(false)}>
                        <Text
                          style={[
                            styles.actionButtonText,
                            styles.cancelButtonText,
                          ]}>
                          Cancel
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </ScrollView>
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>
                    No attendance data for this date
                  </Text>
                  <View style={styles.noDataButtons}>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        styles.markPresentButton,
                        styles.fullWidthButton,
                      ]}
                      onPress={handleMarkPresent}>
                      <Text style={styles.actionButtonText}>Mark Present</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        styles.leaveRequestButton,
                        styles.fullWidthButton,
                      ]}
                      onPress={handleLeaveRequest}>
                      <Text style={styles.actionButtonText}>Leave Request</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </View>

      <AlertModal
        visible={alert.visible}
        heading="Error"
        text={alert.text}
        onPress={() => setAlert(s => ({...s, visible: false}))}
      />
    </ActionPaneContainer>
  );
};

/* Reusable row */
const DetailRow = ({label, value}) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={styles.detailValue}>{value || 'N/A'}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F5F5F5', padding: 16},

  loadingContainer: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  loadingText: {marginTop: 10, fontSize: 16, color: '#8e8e93'},

  /* Modern calendar card */
  calendarCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: AppTokens.shadowColor,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEF2F6',
    backgroundColor: '#FFFFFF',
  },
  cardNav: {flexDirection: 'row', gap: 8},
  navBtn: {
    fontSize: 22,
    fontWeight: '700',
    color: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  calendar: {borderRadius: 16, paddingHorizontal: 6, paddingBottom: 12},

  /* Legend as a matching card */
  legendContainer: {
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: AppTokens.shadowColor,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1c1c1e',
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5EAF0',
  },
  legendText: {fontSize: 13, color: '#4B5563'},
  legendPresent: {backgroundColor: '#6ce66c'},
  legendAbsent: {backgroundColor: '#FF0000'},
  legendLate: {backgroundColor: '#FFFF00'},
  legendLeave: {backgroundColor: '#808080'},
  legendHoliday: {backgroundColor: '#FFB6C1'},
  legendNoData: {backgroundColor: '#f0f0f0'},

  /* Modal */
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

  /* Details */
  detailsContent: {padding: 20, paddingBottom: 10},
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  statusText: {fontSize: 14, fontWeight: 'bold'},
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

  /* Action Buttons */
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
    backgroundColor: brand.primary,
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
});

export default AttendanceCalendarScreen;
