import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {useSelector} from 'react-redux';
import moment from 'moment';
import {CreateAdjustment} from '../../API/Attendance/CreateAdjustment';
import {fetchEmployeeShiftIds} from '../../API/Attendance/retrieveEmployeeShiftIds';

const CreateEmployeeAdjustment = ({navigation}) => {
  const userData = useSelector(state => state?.user?.userData || {});
  const employeeId = userData?.employeeId;

  const [shiftId, setShiftId] = useState(''); // Will be selected from dropdown or auto-filled
  const [availableShifts, setAvailableShifts] = useState([]); // List of valid shifts
  const [clockIn, setClockIn] = useState('');
  const [clockOut, setClockOut] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingShifts, setFetchingShifts] = useState(true);

  // Fetch Shift IDs on mount
  useEffect(() => {
    const loadShiftIds = async () => {
      if (!employeeId) {
        setFetchingShifts(false);
        return;
      }

      try {
        setFetchingShifts(true);
        const shifts = await fetchEmployeeShiftIds(employeeId);
        setAvailableShifts(shifts);

        // Auto-select first shift if only one exists
        if (shifts.length === 1) {
          setShiftId(shifts[0]);
        } else if (shifts.length === 0) {
          Alert.alert(
            'No Shift Found',
            'No roster shift assigned to this employee.',
          );
        }
      } catch (err) {
        Alert.alert('Error', err.message || 'Failed to load employee shifts.');
      } finally {
        setFetchingShifts(false);
      }
    };

    loadShiftIds();
  }, [employeeId]);

  // Auto-fill current date + editable 9 AM to 5 PM
  useEffect(() => {
    const today = moment().format('YYYY-MM-DD');
    setClockIn(`${today}T09:00:00`);
    setClockOut(`${today}T17:00:00`);
  }, []);

  const handleCreate = async () => {
    if (!employeeId) {
      Alert.alert('Error', 'Employee ID not found. Please log in again.');
      return;
    }

    if (!shiftId) {
      Alert.alert('Validation', 'Please select a Shift ID.');
      return;
    }

    if (!remarks.trim()) {
      Alert.alert('Validation', 'Remarks is required.');
      return;
    }

    setLoading(true);
    try {
      const result = await CreateAdjustment({
        employeeId,
        shiftId: shiftId.trim(),
        attendanceDate: moment(clockIn).format('YYYY-MM-DD'), // Use selected date
        clockIn,
        clockOut,
        remarks: remarks.trim(),
      });

      if (result.isSuccess) {
        Alert.alert(
          'Success',
          `Adjustment created successfully!\nRecId: ${result.recId}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('EmployeeAdjustmentScreen'),
            },
          ],
        );
      } else {
        Alert.alert('Failed', result.message || 'Unknown error occurred.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create adjustment.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.navigate('EmployeeAdjustmentScreen');
  };

  const formatTime = isoString => {
    return moment(isoString).format('hh:mm A');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Create Employee Adjustment</Text>

        <View style={styles.infoCard}>
          <Text style={styles.label}>Employee ID</Text>
          <Text style={styles.value}>{employeeId || 'Not available'}</Text>
        </View>

        {/* Shift ID - Non-editable if only one, otherwise dropdown */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Shift ID *</Text>
          {fetchingShifts ? (
            <ActivityIndicator size="small" color="#2196F3" />
          ) : availableShifts.length === 0 ? (
            <Text style={styles.errorText}>No shift assigned</Text>
          ) : availableShifts.length === 1 ? (
            <Text style={styles.value}>{availableShifts[0]}</Text>
          ) : (
            <View style={styles.pickerPlaceholder}>
              {availableShifts.map((shift, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.shiftOption,
                    shiftId === shift && styles.shiftOptionSelected,
                  ]}
                  onPress={() => setShiftId(shift)}>
                  <Text
                    style={[
                      styles.shiftOptionText,
                      shiftId === shift && styles.shiftOptionTextSelected,
                    ]}>
                    {shift}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Editable Attendance Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Attendance Date *</Text>
          <TextInput
            style={styles.input}
            value={moment(clockIn).format('YYYY-MM-DD')}
            onChangeText={text => {
              const newDate = `${text}T${moment(clockIn).format('HH:mm:ss')}`;
              const newOut = `${text}T${moment(clockOut).format('HH:mm:ss')}`;
              setClockIn(newDate);
              setClockOut(newOut);
            }}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            editable={!loading}
          />
        </View>

        {/* Editable Clock In & Out */}
        <View style={styles.timeRow}>
          <View style={styles.timeItem}>
            <Text style={styles.label}>Clock In *</Text>
            <TextInput
              style={styles.timeInput}
              value={formatTime(clockIn)}
              onChangeText={text => {
                const [hours, minutes] = text.split(':');
                const timeStr = `${hours.padStart(2, '0')}:${
                  minutes?.padStart(2, '0') || '00'
                }:00`;
                const datePart = moment(clockIn).format('YYYY-MM-DD');
                setClockIn(`${datePart}T${timeStr}`);
              }}
              placeholder="09:00"
              keyboardType="numeric"
              editable={!loading}
            />
          </View>
          <View style={styles.timeItem}>
            <Text style={styles.label}>Clock Out *</Text>
            <TextInput
              style={styles.timeInput}
              value={formatTime(clockOut)}
              onChangeText={text => {
                const [hours, minutes] = text.split(':');
                const timeStr = `${hours.padStart(2, '0')}:${
                  minutes?.padStart(2, '0') || '00'
                }:00`;
                const datePart = moment(clockOut).format('YYYY-MM-DD');
                setClockOut(`${datePart}T${timeStr}`);
              }}
              placeholder="17:00"
              keyboardType="numeric"
              editable={!loading}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Remarks *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter reason for adjustment..."
            value={remarks}
            onChangeText={setRemarks}
            multiline
            numberOfLines={4}
            editable={!loading}
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.cancelBtn]}
            onPress={handleCancel}
            disabled={loading}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.createBtn,
              loading && styles.createBtnDisabled,
            ]}
            onPress={handleCreate}
            disabled={loading || !shiftId}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.createBtnText}>Create Adjustment</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#263238',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#455A64',
  },
  value: {
    fontSize: 15,
    color: '#263238',
    fontWeight: '500',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CFD8DC',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CFD8DC',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    fontSize: 15,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#CFD8DC',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    fontSize: 15,
    textAlign: 'center',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerPlaceholder: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shiftOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
    marginRight: 8,
    marginBottom: 8,
  },
  shiftOptionSelected: {
    backgroundColor: '#2196F3',
  },
  shiftOptionText: {
    color: '#263238',
    fontWeight: '600',
  },
  shiftOptionTextSelected: {
    color: '#FFF',
  },
  errorText: {
    color: '#D32F2F',
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelBtn: {
    backgroundColor: '#90A4AE',
  },
  cancelBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
  createBtn: {
    backgroundColor: '#4CAF50',
  },
  createBtnDisabled: {
    backgroundColor: '#A5D6A7',
  },
  createBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default CreateEmployeeAdjustment;
