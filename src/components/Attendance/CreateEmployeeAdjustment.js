/* eslint-disable no-unused-vars */
/* eslint-disable no-useless-escape */
/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {
  Text,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView,
  Platform,
  View,
  TouchableOpacity,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import AttendanceFormButtons from '../../components/Buttons/AttendanceFormButtons';
import AlertModal from '../../components/Alert/AlertModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import TimeFlicker from '../../components/Attendance/TimeFlicker';
import styles from '../../styles/styles';

import {CreateAdjustment} from '../../API/Attendance/CreateAdjustment';
import {SubmitAdjustment} from '../../API/Attendance/SubmitAdjustment';
import retrieveEmployeeShiftIds from '../../API/Attendance/retrieveEmployeeShiftIds';

const TIME_HINT = 'hh:mm AM/PM or HH:mm';

/* ---------------- helpers ---------------- */
const isBlank = v =>
  v === null || v === undefined || v === '' || v === '0' || v === 0;
const pad2 = n => String(n).padStart(2, '0');
const valOf = v => (v && typeof v === 'object' && 'value' in v ? v.value : v);

/** Convert time input to ISO datetime string */
const toISODateTime = (dateStr, timeInput) => {
  if (!dateStr || !timeInput) return null;

  const date = new Date(dateStr);
  if (isNaN(date)) return null;

  const timeStr = String(timeInput).trim();

  // Handle seconds input (if it's just numbers)
  if (/^\d+$/.test(timeStr)) {
    const totalSeconds = parseInt(timeStr, 10);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString();
  }

  // Handle 24h format (HH:mm or HH:mm:ss)
  let match = timeStr.match(/^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString();
  }

  // Handle 12h format (h:mm AM/PM)
  match = timeStr.match(/^(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridian = match[3].toUpperCase();

    if (meridian === 'PM' && hours !== 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;

    date.setHours(hours, minutes, 0, 0);
    return date.toISOString();
  }

  return null;
};

const normalizeAxDateTime = (raw, fallbackIso) => {
  const s = String(valOf(raw) ?? '').trim();
  if (!s) return fallbackIso || '';

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([+\-]\d{2}:\d{2})$/.test(s))
    return s;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([+\-]\d{4})$/.test(s)) return s;

  if (
    /^\d{1,2}:[0-5]\d(\s*[AP]M)?$/i.test(s) ||
    /^\d{1,2}:[0-5]\d:[0-5]\d$/.test(s)
  ) {
    return fallbackIso || '';
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.split('T')[0];

  return fallbackIso || '';
};

const cleanRemarks = txt =>
  String(txt ?? '')
    .replace(/\\n/g, ' ')
    .replace(/\/n/g, ' ')
    .replace(/\r?\n/g, ' ')
    .trim();

// Simplified response parser for GeneralContract structure
const parseSOAPResponse = response => {
  console.log('Raw SOAP Response:', JSON.stringify(response, null, 2));

  if (!response) {
    return {isSuccess: false, message: 'No response received'};
  }

  try {
    // Handle GeneralContract structure directly
    if (
      response.IsSuccess !== undefined ||
      response.RecId !== undefined ||
      response.Message !== undefined
    ) {
      return {
        isSuccess: response.IsSuccess === true || response.IsSuccess === 'true',
        recId: response.RecId,
        message: response.Message || '',
      };
    }
    // Handle CreateResponse -> CreateResult structure
    else if (response.CreateResponse && response.CreateResponse.CreateResult) {
      const result = response.CreateResponse.CreateResult;
      return {
        isSuccess: result.IsSuccess === true || result.IsSuccess === 'true',
        recId: result.RecId,
        message: result.Message || '',
      };
    }
    // Handle direct CreateResult
    else if (response.CreateResult) {
      const result = response.CreateResult;
      return {
        isSuccess: result.IsSuccess === true || result.IsSuccess === 'true',
        recId: result.RecId,
        message: result.Message || '',
      };
    }
    // Handle already parsed structure (camelCase)
    else if (response.isSuccess !== undefined) {
      return {
        isSuccess: response.isSuccess === true || response.isSuccess === 'true',
        recId: response.recId,
        message: response.message || '',
      };
    }
    // Fallback
    else {
      return {
        isSuccess: false,
        recId: null,
        message: 'Unknown response format from server',
      };
    }
  } catch (error) {
    console.error('Error parsing SOAP response:', error);
    return {
      isSuccess: false,
      message: `Failed to parse response: ${error.message}`,
    };
  }
};

/**
 * CreateEmployeeAdjustment Component
 */
const CreateEmployeeAdjustment = ({
  onSuccess,
  onCancel,
  initialData = {},
  employeeId,
  employeeName,
  showHeader = true,
}) => {
  const navigation = useNavigation();
  const {userData} = useSelector(state => state.user || {});
  const selectedLegalEntity = useSelector(
    state => state.company.selectedLegalEntity,
  );

  const today = new Date();
  const todayISO = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(
    today.getDate(),
  )}`;

  const defaultClockIn = '09:00 AM';
  const defaultClockOut = '05:00 PM';

  const [form, setForm] = useState({
    employeeName: employeeName || userData?.employeeName || '',
    attendanceDate: initialData.attendanceDate || todayISO,
    clockIn: initialData.clockIn || defaultClockIn,
    clockOut: initialData.clockOut || defaultClockOut,
    remarks: initialData.remarks || '',
    shiftId: initialData.shiftId || '',
  });

  const [shiftOptions, setShiftOptions] = useState([]);
  const [processing, setProcessing] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingShifts, setFetchingShifts] = useState(false);
  const [alert, setAlert] = useState({visible: false, text: ''});
  const [hasFetchedShifts, setHasFetchedShifts] = useState(false);
  const [showShiftDropdown, setShowShiftDropdown] = useState(false);

  const targetEmployeeId = employeeId || userData?.employeeId;

  // Memoized: is form ready to enable buttons?
  const isFormValid = useMemo(() => {
    return (
      targetEmployeeId &&
      form.attendanceDate &&
      form.clockIn &&
      form.clockOut &&
      form.shiftId
      // Remarks is now optional based on X++ method
    );
  }, [targetEmployeeId, form]);

  // Cancel handler
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      navigation.navigate('EmployeeAdjustmentScreen');
    }
  }, [navigation, onCancel]);

  // Fetch shifts
  const fetchEmployeeShiftIds = useCallback(async () => {
    if (!targetEmployeeId) {
      console.log('No employee ID available for fetching shifts');
      return;
    }

    console.log('Fetching shifts for employee:', targetEmployeeId);
    setFetchingShifts(true);

    try {
      const shiftIds = await retrieveEmployeeShiftIds({
        employeeId: targetEmployeeId,
      });
      console.log('Retrieved shifts:', shiftIds);
      setShiftOptions(shiftIds || []);
      setHasFetchedShifts(true);

      // Auto-select first shift only if form.shiftId is empty
      if (shiftIds?.length > 0 && !form.shiftId) {
        setForm(prev => ({...prev, shiftId: shiftIds[0]}));
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
      setAlert({
        visible: true,
        text: `Failed to fetch shifts: ${error.message || 'Unknown error'}`,
      });
    } finally {
      setFetchingShifts(false);
    }
  }, [targetEmployeeId, form.shiftId]);

  // Fetch shifts on mount
  useEffect(() => {
    setHasFetchedShifts(false);
    fetchEmployeeShiftIds();
  }, [fetchEmployeeShiftIds, targetEmployeeId]);

  // Also fetch when the component becomes visible again
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (!hasFetchedShifts || targetEmployeeId) {
        fetchEmployeeShiftIds();
      }
    });

    return unsubscribe;
  }, [navigation, hasFetchedShifts, targetEmployeeId, fetchEmployeeShiftIds]);

  // Handle legal entity change
  // useEffect(() => {
  //   if (selectedLegalEntity) {
  //     handleCancel();
  //   }
  // }, [selectedLegalEntity, handleCancel]);

  // Handlers
  const onDateChange = v => {
    const normalized = normalizeAxDateTime(v, form.attendanceDate);
    setForm(prev => ({...prev, attendanceDate: normalized}));
  };

  const onTimeChange = (field, v) => {
    setForm(prev => ({...prev, [field]: valOf(v)}));
  };

  const onChangeText = (field, v) => {
    setForm(prev => ({...prev, [field]: v}));
  };

  const onShiftChange = v => {
    setForm(prev => ({...prev, shiftId: v}));
    setShowShiftDropdown(false);
  };

  const toggleShiftDropdown = () => {
    setShowShiftDropdown(!showShiftDropdown);
  };

  // Updated validation to match X++ method requirements
  const validateForm = () => {
    const missing = [];

    if (!targetEmployeeId) missing.push('Employee ID');
    if (!form.attendanceDate) missing.push('Attendance Date');
    if (!form.clockIn) missing.push('Clock In');
    if (!form.clockOut) missing.push('Clock Out');
    if (!form.shiftId) missing.push('Shift');

    const clockInISO = toISODateTime(form.attendanceDate, form.clockIn);
    const clockOutISO = toISODateTime(form.attendanceDate, form.clockOut);

    if (!clockInISO) missing.push('Valid Clock In time');
    if (!clockOutISO) missing.push('Valid Clock Out time');
    if (clockInISO && clockOutISO && clockInISO >= clockOutISO) {
      missing.push('Clock Out must be after Clock In');
    }

    return missing;
  };

  // Enhanced submit handler with better error handling
  const handleCreateAndSubmit = async actionType => {
    if (processing) return;

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setAlert({
        visible: true,
        text: `Please fix the following errors:\n• ${validationErrors.join(
          '\n• ',
        )}`,
      });
      return;
    }

    setProcessing(actionType);
    setLoading(true);

    try {
      const clockInISO = toISODateTime(form.attendanceDate, form.clockIn);
      const clockOutISO = toISODateTime(form.attendanceDate, form.clockOut);

      if (!clockInISO || !clockOutISO) {
        throw new Error(
          'Invalid time format. Please use HH:mm or hh:mm AM/PM format.',
        );
      }

      const payload = {
        employeeId: targetEmployeeId,
        shiftId: form.shiftId,
        attendanceDate: form.attendanceDate,
        clockIn: clockInISO,
        clockOut: clockOutISO,
        remarks: cleanRemarks(form.remarks) || '', // Remarks can be empty
      };

      console.log('Sending payload:', payload);

      const createResponse = await CreateAdjustment(payload);
      console.log('Create API Response:', createResponse);

      // Parse the SOAP response
      const createResult = parseSOAPResponse(createResponse);
      console.log('Parsed create result:', createResult);

      if (!createResult.isSuccess) {
        // Handle clock out time validation error from server
        if (
          createResult.message &&
          createResult.message.includes(
            'Clock Out time must be after Clock In time',
          )
        ) {
          throw new Error(
            'Clock Out time must be after Clock In time. Please adjust your times.',
          );
        }
        throw new Error(createResult.message || 'Failed to create adjustment');
      }

      // Handle success for save only
      if (actionType === 'save') {
        setAlert({
          visible: true,
          text: createResult.message || 'Adjustment created successfully!',
        });
        setTimeout(() => {
          setAlert({visible: false});
          onSuccess?.(createResult);
          navigation.navigate('EmployeeAdjustmentScreen', {refresh: true});
        }, 1500);
        return;
      }

      // Handle create and submit
      const recId = createResult.recId;
      if (!recId) {
        throw new Error(
          'Record ID missing after creation. Adjustment was created but cannot be submitted.',
        );
      }

      console.log('Submitting adjustment with RecId:', recId);
      const submitResponse = await SubmitAdjustment({recIds: [recId]});
      console.log('Submit API Response:', submitResponse);

      const submitResult = parseSOAPResponse(submitResponse);

      if (submitResult.isSuccess) {
        setAlert({visible: true, text: 'Created and submitted successfully!'});
      } else {
        setAlert({
          visible: true,
          text: `Adjustment created, but submission failed: ${
            submitResult.message || 'Unknown error'
          }`,
        });
      }

      setTimeout(() => {
        setAlert({visible: false});
        onSuccess?.({...createResult, submitted: true, submitResult});
        navigation.navigate('EmployeeAdjustmentScreen', {refresh: true});
      }, 1500);
    } catch (error) {
      console.error('Error in handleCreateAndSubmit:', error);
      setAlert({visible: true, text: `Error: ${error.message}`});
    } finally {
      setLoading(false);
      setProcessing('');
    }
  };

  const handleBack = () => handleCancel();

  const renderContent = () => (
    <SafeAreaView style={styles.LReqSR_SafeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.LReqSR_ContentWrapper}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
        <ScrollView
          contentContainerStyle={styles.LReqSR_FormContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled>
          {/* Employee Name */}
          <Text style={styles.LReqSR_Label}>Employee</Text>
          <Text style={[styles.LReqSR_Input, styles.LReqSR_Disabled]}>
            {form.employeeName || targetEmployeeId || 'Not available'}
          </Text>

          {/* Shift Selection */}
          <Text style={styles.LReqSR_Label}>Shift *</Text>
          {fetchingShifts ? (
            <CustomIndicator size="small" />
          ) : (
            <View>
              <TouchableOpacity
                // style={[styles.LReqSR_Input, styles.LReqSR_Disabled]}
                style={[
                  styles.LReqSR_Input,
                  {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 12,
                    backgroundColor: '#f1f1f1',
                    color: '#999',
                  },
                ]}
                onPress={toggleShiftDropdown}
                // disabled={shiftOptions.length === 0}>s
                disabled={true}>
                <Text
                  style={{
                    color: form.shiftId ? '#000' : '#999',
                    fontSize: 16,
                  }}>
                  {form.shiftId || 'Select Shift'}
                </Text>
                {/* <Text style={{color: '#999', fontSize: 16}}>▼</Text> */}
              </TouchableOpacity>

              {showShiftDropdown && shiftOptions.length > 0 && (
                <View
                  style={{
                    backgroundColor: 'white',
                    borderWidth: 1,
                    borderColor: '#CCC',
                    borderTopWidth: 0,
                    borderRadius: 4,
                    marginTop: 2,
                    maxHeight: 200,
                    elevation: 3,
                    shadowColor: '#000',
                    shadowOffset: {width: 0, height: 2},
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                    zIndex: 1000,
                  }}>
                  <ScrollView nestedScrollEnabled>
                    {shiftOptions.map((shift, index) => (
                      <TouchableOpacity
                        key={shift}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 12,
                          borderBottomWidth:
                            index < shiftOptions.length - 1 ? 1 : 0,
                          borderBottomColor: '#F0F0F0',
                          backgroundColor:
                            form.shiftId === shift ? '#F0F8FF' : 'white',
                        }}
                        onPress={() => onShiftChange(shift)}>
                        <Text
                          style={{
                            color: form.shiftId === shift ? '#007AFF' : '#000',
                            fontSize: 16,
                          }}>
                          {shift}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {shiftOptions.length === 0 && targetEmployeeId && (
                <Text
                  style={{color: '#999', paddingVertical: 12, fontSize: 14}}>
                  No shifts available
                </Text>
              )}

              {!targetEmployeeId && (
                <Text
                  style={{color: '#999', paddingVertical: 12, fontSize: 14}}>
                  Employee ID required
                </Text>
              )}
            </View>
          )}

          {/* Date & Time Pickers */}
          <TimeFlicker
            mode="date"
            label="Attendance Date *"
            value={form.attendanceDate}
            onChange={onDateChange}
            uiFormat="12h"
          />

          <TimeFlicker
            mode="time"
            label="Clock In *"
            value={form.clockIn}
            onChange={v => onTimeChange('clockIn', v)}
            uiFormat="12h"
            placeholder={TIME_HINT}
          />

          <TimeFlicker
            mode="time"
            label="Clock Out *"
            value={form.clockOut}
            onChange={v => onTimeChange('clockOut', v)}
            uiFormat="12h"
            placeholder={TIME_HINT}
          />

          {/* Remarks - Now optional */}
          <Text style={[styles.LReqSR_Label, {marginTop: 12}]}>Remarks</Text>
          <TextInput
            style={[styles.LReqSR_Input, styles.LReqSR_TextArea]}
            value={form.remarks}
            onChangeText={v => onChangeText('remarks', v)}
            placeholder="Enter remarks (optional)"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </ScrollView>

        <AttendanceFormButtons
          mode="create"
          processingButton={processing}
          onSave={handleCreateAndSubmit}
          onCancel={handleCancel}
          isDisabled={!isFormValid || !!processing}
          isCancelDisabled={false}
        />
      </KeyboardAvoidingView>

      <AlertModal
        visible={alert.visible}
        heading="Alert"
        text={alert.text}
        onPress={() => setAlert({visible: false})}
      />

      {loading && <CustomIndicator />}
    </SafeAreaView>
  );

  if (showHeader) {
    return (
      <ActionPaneContainer
        pageTitle="Create Adjustment"
        isBackButton
        showFooter={false}
        showFloatingButton={false}
        isHeaderActive
        onBackPress={handleBack}
        onRefresh={fetchEmployeeShiftIds}
        onFloatingButtonPress={{}}>
        {renderContent()}
      </ActionPaneContainer>
    );
  }

  return renderContent();
};

export default CreateEmployeeAdjustment;
