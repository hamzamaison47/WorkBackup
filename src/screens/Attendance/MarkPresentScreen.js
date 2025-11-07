/* eslint-disable no-unused-vars */
/* eslint-disable no-useless-escape */
/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState, useCallback} from 'react';
import {
  Text,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import SaveRecordButtons from '../../components/Buttons/SaveRecordButtons';
import AlertModal from '../../components/Alert/AlertModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import TimeFlicker from '../../components/Attendance/TimeFlicker';
import styles from '../../styles/styles';

import {MarkAdjustment} from '../../API/Attendance/MarkAdjustment';
import {SubmitAdjustment} from '../../API/Attendance/SubmitAdjustment';

const TIME_HINT = 'hh:mm AM/PM or HH:mm'; // UI hint; API expects seconds for times

/* ---------------- helpers ---------------- */
const isBlank = v =>
  v === null || v === undefined || v === '' || v === '0' || v === 0;
const pad2 = n => String(n).padStart(2, '0');
const valOf = v => (v && typeof v === 'object' && 'value' in v ? v.value : v);

/** Accepts seconds | HH:mm[:ss] | h:mm AM/PM -> returns seconds (number) or null */
const toSecondsFromAnyTime = raw => {
  if (isBlank(raw)) return null;
  const s = String(valOf(raw)).trim();

  if (/^\d+$/.test(s)) return Number(s); // already seconds

  // 24h with seconds
  let m = s.match(/^([01]?\d|2[0-3]):([0-5]\d):([0-5]\d)$/);
  if (m) return +m[1] * 3600 + +m[2] * 60 + +m[3];

  // 24h, no seconds
  m = s.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (m) return +m[1] * 3600 + +m[2] * 60;

  // 12h h:mm AM/PM
  m = s.match(/^(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i);
  if (m) {
    let h = +m[1];
    const min = +m[2];
    const mer = m[3].toUpperCase();
    if (mer === 'AM') {
      if (h === 12) h = 0;
    } else {
      if (h !== 12) h += 12;
    }
    return h * 3600 + min * 60;
  }

  return null;
};

/** Normalize date/datetime string for AX:
 * - keep 'YYYY-MM-DDTHH:mm:ssZ' (literal Z)
 * - accept pure 'YYYY-MM-DD'
 * - accept ISO with timezone offsets like '+05:00' or '+0500'
 * - if value looks like only time, keep previous ISO date/datetime
 */
const normalizeAxDateTime = (raw, fallbackIso) => {
  const s = String(valOf(raw) ?? '').trim();
  if (!s) return fallbackIso || '';

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(s)) return s; // full ISO Z
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; // date only
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([+\-]\d{2}:\d{2})$/.test(s))
    return s; // ISO with :offset
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([+\-]\d{4})$/.test(s)) return s; // ISO with compact offset

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

const extractRecId = res =>
  res?.RecId ||
  res?.recId ||
  res?.RecordId ||
  res?.recordId ||
  res?.Result?.RecId ||
  res?.result?.RecId ||
  res?.result?.recId ||
  res?.Data?.RecId ||
  res?.data?.RecId ||
  res?.raw?.RecId ||
  res?.raw?.recId ||
  null;

const MarkPresentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {userData} = useSelector(state => state.user || {});

  const {
    employeeId: paramEmpId,
    employeeName = userData?.employeeName || '',
    attendanceDate: routeAttendanceDate = '', // e.g., 'YYYY-MM-DD' or ISO
    sourceScreen = 'AttendanceDetailsScreen',
  } = route.params || {};

  // Build a safe initial date/datetime
  const today = new Date();
  const todayISO = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(
    today.getDate(),
  )}`;
  const initialAxDate = normalizeAxDateTime(routeAttendanceDate, todayISO);
  const selectedLegalEntity = useSelector(
    state => state.company.selectedLegalEntity,
  );
  const [form, setForm] = useState({
    EmployeeName: employeeName,
    AttendanceDateUI: initialAxDate,
    ClockInUI: '',
    ClockOutUI: '',
    Remarks: '',
  });

  const [axDateTime, setAxDateTime] = useState(initialAxDate);
  // Add this useEffect to handle legal entity changes
  useEffect(() => {
    // When legal entity changes, navigate back to prevent data inconsistency
    if (sourceScreen) {
      navigation.navigate(sourceScreen, {refresh: true});
    } else {
      navigation.goBack();
    }
  }, [selectedLegalEntity, navigation, sourceScreen]);
  useEffect(() => {
    setForm(prev => ({...prev, EmployeeName: employeeName}));
    const normalized = normalizeAxDateTime(
      routeAttendanceDate,
      axDateTime || todayISO,
    );
    setAxDateTime(normalized || todayISO);
    setForm(prev => ({
      ...prev,
      AttendanceDateUI: normalized || prev.AttendanceDateUI,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeName, routeAttendanceDate]);

  const [processing, setProcessing] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({visible: false, text: ''});

  const onDateChange = v => {
    const next = normalizeAxDateTime(v, axDateTime);
    setAxDateTime(next);
    setForm(prev => ({
      ...prev,
      AttendanceDateUI: next || prev.AttendanceDateUI,
    }));
  };

  const onTimeChange = (field, v) =>
    setForm(prev => ({...prev, [field]: valOf(v)}));
  const onChangeText = (field, v) => setForm(prev => ({...prev, [field]: v}));

  const doCreate = async () => {
    const employeeId = userData?.employeeId || paramEmpId || '';

    const clockInSec = toSecondsFromAnyTime(form.ClockInUI);
    const clockOutSec = toSecondsFromAnyTime(form.ClockOutUI);

    const payload = {
      EmployeeId: userData?.employeeId,
      EmployeeName: form.EmployeeName || '',
      ClockIn: clockInSec ?? '',
      ClockOut: clockOutSec ?? '',
      AttendanceDate: axDateTime,
      Remarks: cleanRemarks(form.Remarks),
    };

    const res = await MarkAdjustment({contract: payload});
    const ok =
      res?.isSuccess === true ||
      res?.IsSuccess === true ||
      String(res?.IsSuccess).toLowerCase() === 'true';
    return {res, ok};
  };

  const onSave = async actionType => {
    if (processing) return;

    const employeeId = userData?.employeeId || paramEmpId || '';
    const missing = [];
    if (!employeeId) missing.push('EmployeeId (not found in userData)');
    if (!axDateTime) missing.push('Attendance Date');

    const cin = toSecondsFromAnyTime(form.ClockInUI);
    const cout = toSecondsFromAnyTime(form.ClockOutUI);
    if (cin === null) missing.push('Clock In (' + TIME_HINT + ' → seconds)');
    if (cout === null) missing.push('Clock Out (' + TIME_HINT + ' → seconds)');
    if (!cleanRemarks(form.Remarks)) missing.push('Remarks');

    if (missing.length) {
      setAlert({
        visible: true,
        text: 'Please fill:\n' + missing.join('\n'),
      });
      return;
    }

    setProcessing(actionType);
    setLoading(true);

    try {
      const {res, ok} = await doCreate();
      if (!ok) {
        setAlert({
          visible: true,
          text: res?.message || res?.Message || 'Create failed',
        });
        return;
      }

      if (actionType === 'save') {
        setAlert({visible: true, text: 'Attendance created successfully.'});
      } else if (actionType === 'submit') {
        const recId = extractRecId(res);
        if (!recId) {
          setAlert({
            visible: true,
            text: 'Created, but recId not returned — cannot submit.',
          });
          return;
        }
        const submitRes = await SubmitAdjustment({recIds: [recId]});
        const submitOk =
          submitRes?.IsSuccess === true ||
          String(submitRes?.IsSuccess).toLowerCase() === 'true' ||
          submitRes?.isSuccess === true;
        if (!submitOk) {
          setAlert({
            visible: true,
            text: submitRes?.Message || submitRes?.message || 'Submit failed',
          });
          return;
        }
        setAlert({
          visible: true,
          text: 'Attendance created & submitted successfully.',
        });
      }

      setTimeout(() => {
        setAlert(s => ({...s, visible: false}));
        if (sourceScreen) navigation.navigate(sourceScreen, {refresh: true});
        else navigation.goBack();
      }, 900);
    } catch (e) {
      setAlert({visible: true, text: e?.message || 'Network error'});
    } finally {
      setLoading(false);
      setProcessing('');
    }
  };

  const onBack = useCallback(() => {
    if (sourceScreen) navigation.navigate(sourceScreen);
    else navigation.goBack();
  }, [navigation, sourceScreen]);

  return (
    <ActionPaneContainer
      pageTitle="Mark Present"
      isBackButton
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive
      onBackPress={onBack}
      onRefresh={() => {}}
      onFloatingButtonPress={{}}>
      {loading ? (
        <CustomIndicator />
      ) : (
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
              <Text style={styles.LReqSR_Label}>Employee</Text>
              <Text style={[styles.LReqSR_Input, styles.LReqSR_Disabled]}>
                {form.EmployeeName || (userData?.employeeId ?? '')}
              </Text>

              <TimeFlicker
                mode="date"
                label="Attendance Date *"
                value={form.AttendanceDateUI}
                onChange={onDateChange}
                uiFormat="12h"
              />

              <TimeFlicker
                mode="time"
                label="Clock In *"
                value={form.ClockInUI}
                onChange={v => onTimeChange('ClockInUI', v)}
                uiFormat="12h"
              />
              <TimeFlicker
                mode="time"
                label="Clock Out *"
                value={form.ClockOutUI}
                onChange={v => onTimeChange('ClockOutUI', v)}
                uiFormat="12h"
              />

              <Text style={[styles.LReqSR_Label, {marginTop: 12}]}>
                Remarks *
              </Text>
              <TextInput
                style={[styles.LReqSR_Input, styles.LReqSR_TextArea]}
                value={form.Remarks}
                onChangeText={v => onChangeText('Remarks', v)}
                placeholder="Enter remarks (required)"
                multiline
                numberOfLines={6}
              />
            </ScrollView>

            <SaveRecordButtons
              mode="create"
              processingButton={processing}
              onSave={onSave}
              onCancel={onBack}
              isDisabled={processing === 'save' || processing === 'submit'}
            />
          </KeyboardAvoidingView>

          <AlertModal
            visible={alert.visible}
            heading="Alert"
            text={alert.text}
            onPress={() => setAlert(s => ({...s, visible: false}))}
          />
        </SafeAreaView>
      )}
    </ActionPaneContainer>
  );
};

export default MarkPresentScreen;
