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
import {useIsFocused} from '@react-navigation/native';
import DFCalendar from '../../components/Attendance/DFCalendar';
import {getRegisterDetailsByDate} from '../../API/Attendance/getRegisterDetailsByDate';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import AlertModal from '../../components/Alert/AlertModal';
import {MonthFilter} from '../../components/Attendance/AttendanceDetailsComponents';

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
/* ---------------------------------------------------------------- */

const AttendanceCalendarScreen = () => {
  const {userData} = useSelector(state => state.user || {});
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
            container: {backgroundColor: color, borderRadius: 8},
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
        text: 'Failed to fetch attendance data. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [employeeId, currentMonth, processAttendanceData]);

  useEffect(() => {
    if (isFocused && employeeId) {
      fetchAttendanceData();
    }
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

  // eslint-disable-next-line no-unused-vars
  const headerSubtitle = useMemo(
    () => currentMonth.format('MMMM YYYY'),
    [currentMonth],
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
            <View style={styles.headerRow}>
              <Text style={styles.title}>Attendance Calendar</Text>
              <MonthFilter
                month={currentMonth}
                onPrev={() =>
                  setCurrentMonth(m => m.clone().subtract(1, 'month'))
                }
                onNext={() => setCurrentMonth(m => m.clone().add(1, 'month'))}
              />
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
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
                {/* Calendar */}
                <View style={styles.calendarContainer}>
                  <DFCalendar
                    currentDate={currentMonth.toDate()}
                    markedDates={markedDates}
                    onDayPress={handleDateSelect}
                    onMonthChange={handleMonthChange}
                    hideDayNames={true} // <-- prevents duplicate-key warning from weekday letters ("S","T")
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
                  style={styles.detailsContainer}
                  showsVerticalScrollIndicator={false}>
                  <View
                    style={[
                      styles.statusBadge,
                      {backgroundColor: selectedDayDetails.color},
                    ]}>
                    <Text
                      style={[
                        styles.statusText,
                        {color: getTextColor(selectedDayDetails.color)},
                      ]}>
                      {getStatusDescription(
                        selectedDayDetails.color,
                        selectedDayDetails,
                      )}
                    </Text>
                  </View>
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
                    {pick(
                      selectedDayDetails,
                      'employeeName',
                      'EmployeeName',
                    ) && (
                      <DetailRow
                        label="Employee"
                        value={pick(
                          selectedDayDetails,
                          'employeeName',
                          'EmployeeName',
                        )}
                      />
                    )}
                  </View>
                </ScrollView>
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>
                    No attendance data for this date
                  </Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  title: {fontSize: 18, fontWeight: '800', color: '#263238'},
  loadingContainer: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  loadingText: {marginTop: 10, fontSize: 16, color: '#8e8e93'},
  calendarContainer: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  calendar: {borderRadius: 12},
  legendContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
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
    marginBottom: 8,
  },
  legendColor: {width: 12, height: 12, borderRadius: 6, marginRight: 8},
  legendText: {fontSize: 12, color: '#8e8e93'},
  legendPresent: {backgroundColor: '#6ce66c'},
  legendAbsent: {backgroundColor: '#FF0000'},
  legendLate: {backgroundColor: '#FFFF00'},
  legendLeave: {backgroundColor: '#808080'},
  legendHoliday: {backgroundColor: '#FFB6C1'},
  legendNoData: {backgroundColor: '#f0f0f0'},
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
  detailsContainer: {padding: 20},
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
  noDataContainer: {padding: 40, alignItems: 'center'},
  noDataText: {fontSize: 16, color: '#8e8e93', textAlign: 'center'},
});

export default AttendanceCalendarScreen;
