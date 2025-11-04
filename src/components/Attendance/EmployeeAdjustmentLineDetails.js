/* eslint-disable no-unused-vars */
/* eslint-disable curly */
import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import moment from 'moment';
import AlertModal from '../Alert/AlertModal';
import retrieveEmployeeAdjustmentlines from '../../API/Attendance/retrieveEmployeeAdjustmentlines';
import {SubmitAdjustment} from '../../API/Attendance/SubmitAdjustment';

const parseISO = iso =>
  iso ? moment.parseZone(iso, moment.ISO_8601, true).utc() : null;

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

const isBlankTime = v =>
  v === null ||
  v === undefined ||
  v === '' ||
  v === 0 ||
  v === '0' ||
  v === '00:00' ||
  v === '00:00:00';

const to12h = (h24, m = 0) => {
  if (!Number.isFinite(h24) || !Number.isFinite(m)) return '--';
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const formatInOut12h = value => {
  if (isBlankTime(value)) return '--';
  if (typeof value === 'string' && value.includes(':')) {
    const [hStr, mStr] = value.split(':');
    const h = Number(hStr);
    const m = Number(mStr);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return '--';
    return to12h(h, m);
  }
  const sec = Number(value);
  if (!Number.isFinite(sec)) return '--';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return to12h(h, m);
};

const formatDuration = value => {
  if (isBlankTime(value)) return '--:--';
  if (typeof value === 'string' && value.includes(':')) {
    return value.length === 5 ? `${value}:00` : value;
  }
  const n = Number(value);
  const h = Math.floor(n / 3600);
  const m = Math.floor((n % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const EmployeeAdjustmentLineDetails = ({
  adjustmentData,
  employeeId,
  employeeName,
  attendanceDate,
}) => {
  const [lineData, setLineData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({visible: false, text: ''});

  const fetchLineData = useCallback(async () => {
    if (!employeeId || !attendanceDate) {
      console.log('Missing required parameters for line details');
      return;
    }
    try {
      setLoading(true);
      const apiParams = {
        employeeId,
        fromDate: attendanceDate,
        toDate: attendanceDate,
      };
      console.log('Fetching line details with:', apiParams);
      const list = await retrieveEmployeeAdjustmentlines(apiParams);

      let normalizedData = [];
      if (Array.isArray(list)) {
        normalizedData = list;
      } else if (list && typeof list === 'object') {
        if (Array.isArray(list.value)) {
          normalizedData = list.value;
        } else if (Array.isArray(list.items)) {
          normalizedData = list.items;
        } else if (Array.isArray(list.Result)) {
          normalizedData = list.Result;
        } else {
          normalizedData = [list];
        }
      }

      const processedData = normalizedData.filter(Boolean).map((item, idx) => ({
        ...item,
        AttendanceDate: item.AttendanceDate || item.attendanceDate,
        EmployeeId: item.EmployeeId || item.employeeId,
        ShiftId: item.ShiftId || item.shiftId,
        TimeIn: item.TimeIn || item.timeIn,
        TimeOut: item.TimeOut || item.timeOut,
        GenerationType: item.GenerationType || item.generationType,
        AttendanceRegisterStatus:
          item.AttendanceRegisterStatus || item.attendanceRegisterStatus,
        DateTimeIn: item.DateTimeIn || item.dateTimeIn,
        DateTimeOut: item.DateTimeOut || item.dateTimeOut,
        CalculatedWorkingHours:
          item.CalculatedWorkingHours || item.calculatedWorkingHours,
        TotalWorkingHours: item.TotalWorkingHours || item.totalWorkingHours,
        EmployeeName: item.EmployeeName || item.employeeName,
        ProfileType: item.ProfileType || item.profileType,
        Remarks: item.Remarks || item.remarks,
        WFSTATUS: item.WFSTATUS || item.wfstatus || item.WFStatus,
        RecId: item.RecId || item.recId || item.ID || item.id || null,
        _key: `line_${idx}_${
          item.RecId || item.recId || item.ID || item.id || idx
        }`,
      }));
      setLineData(processedData);
    } catch (e) {
      console.error('Error fetching adjustment lines:', e);
      setAlert({
        visible: true,
        text: e?.message || 'Failed to load adjustment details.',
      });
      setLineData([]);
    } finally {
      setLoading(false);
    }
  }, [employeeId, attendanceDate]);

  useEffect(() => {
    fetchLineData();
  }, [fetchLineData]);

  const handleSubmit = async () => {
    const recIds = lineData
      .filter(
        item =>
          (item.WFSTATUS || '').toString().toLowerCase() === 'notsubmitted',
      )
      .map(it => it.RecId)
      .filter(id => id != null && !isNaN(Number(id)));

    if (recIds.length === 0) {
      setAlert({
        visible: true,
        text: 'No unsubmitted records to submit.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await SubmitAdjustment({recIds});
      setAlert({
        visible: true,
        text:
          result.Message ||
          (result.isSuccess ? 'Submitted successfully!' : 'Submission failed.'),
      });

      if (result.isSuccess) {
        await fetchLineData(); // Refresh to update WFSTATUS
      }
    } catch (err) {
      setAlert({
        visible: true,
        text: err?.message || 'An error occurred while submitting.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = status => {
    const statusStr = (status || '').toString().toLowerCase();
    switch (statusStr) {
      case 'approved':
      case 'completed':
        return '#4CAF50';
      case 'pending':
      case 'submitted':
        return '#FF9800';
      case 'rejected':
      case 'cancelled':
        return '#F44336';
      default:
        return '#455A64';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#2196F3" />
        <Text style={styles.loadingText}>Loading details...</Text>
      </View>
    );
  }

  if (lineData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No adjustment details found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Adjustment Details</Text>
      </View>

      {lineData.map(item => {
        const statusColor = getStatusColor(item.AttendanceRegisterStatus);
        const isNotSubmitted =
          (item.WFSTATUS || '').toString().toLowerCase() === 'notsubmitted';

        return (
          <View key={item._key} style={styles.detailCard}>
            {/* Time Section */}
            <View style={styles.timeSection}>
              <View style={styles.timeRow}>
                <View style={styles.timeItem}>
                  <Text style={styles.timeLabel}>Time In</Text>
                  <Text style={styles.timeValue}>
                    {formatInOut12h(item.TimeIn)}
                  </Text>
                </View>
                <View style={styles.timeItem}>
                  <Text style={styles.timeLabel}>Time Out</Text>
                  <Text style={styles.timeValue}>
                    {formatInOut12h(item.TimeOut)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Hours Section */}
            <View style={styles.hoursSection}>
              <View style={styles.hoursRow}>
                <View style={styles.hoursItem}>
                  <Text style={styles.hoursLabel}>Calculated Hours</Text>
                  <Text style={styles.hoursValue}>
                    {formatDuration(item.CalculatedWorkingHours)}
                  </Text>
                </View>
                <View style={styles.hoursItem}>
                  <Text style={styles.hoursLabel}>Total Hours</Text>
                  <Text style={styles.hoursValue}>
                    {formatDuration(item.TotalWorkingHours)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Details */}
            <View style={styles.detailsSection}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Generation Type:</Text>
                <Text style={styles.detailValue}>
                  {item.GenerationType || '--'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Workflow Status:</Text>
                <Text style={[styles.detailValue, {color: statusColor}]}>
                  {item.WFSTATUS || '--'}
                </Text>
              </View>
              {item.Remarks && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Remarks:</Text>
                  <Text style={styles.detailValue}>{item.Remarks}</Text>
                </View>
              )}
            </View>

            {/* CONDITIONAL SUBMIT BUTTON */}
            {isNotSubmitted && (
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  submitting && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={submitting}>
                <Text style={styles.submitBtnText}>
                  {submitting ? 'Submitting...' : 'Submit'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      <AlertModal
        visible={alert.visible}
        heading="Alert"
        text={alert.text}
        onPress={() => setAlert(s => ({...s, visible: false}))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F8F9FA',
  },
  header: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#263238',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#607D8B',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#78909C',
    fontSize: 14,
  },
  detailCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  timeSection: {
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeItem: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: '#607D8B',
    marginBottom: 4,
    fontWeight: '600',
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#263238',
  },
  hoursSection: {
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hoursItem: {
    flex: 1,
    alignItems: 'center',
  },
  hoursLabel: {
    fontSize: 12,
    color: '#607D8B',
    marginBottom: 4,
    fontWeight: '600',
  },
  hoursValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#263238',
  },
  detailsSection: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: '#607D8B',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 12,
    color: '#263238',
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: 12,
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#90CAF9',
  },
  submitBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default EmployeeAdjustmentLineDetails;
