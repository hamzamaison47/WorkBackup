/* eslint-disable curly */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
  BackHandler,
  Platform,
  ActivityIndicator,
  Keyboard,
  StyleSheet,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome';
import {translate as t} from '../../store/utils/translate';

import createovertimePlan from '../../API/OvertimePlanner/CreateOvertimePlanner';

import AlertModal from '../../components/Alert/AlertModal';
import CalendarModal from '../../components/Leaves/CalendarModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import styles from '../../styles/styles';
import usePalette from '../../hooks/usePalette';

// ─── Time helpers ────────────────────────────────────────────────────────────

/**
 * Convert { hours (1-12), minutes (0-59), seconds (0-59), period ('AM'|'PM') }
 * → total seconds from midnight (0–86399).
 */
const timePartsToSeconds = ({hours, minutes, seconds, period}) => {
  let h = parseInt(hours, 10) % 12;
  if (period === 'PM') h += 12;
  return h * 3600 + parseInt(minutes, 10) * 60 + parseInt(seconds, 10);
};

/**
 * Format time parts as display string, e.g. "09:05:00 AM"
 */
const formatTimeParts = ({hours, minutes, seconds, period}) => {
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${hh}:${mm}:${ss} ${period}`;
};

/**
 * Parse seconds-from-midnight back to time parts (for edit pre-fill).
 */
const secondsToTimeParts = totalSeconds => {
  const h24 = Math.floor(totalSeconds / 3600) % 24;
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const hours = h24 % 12 === 0 ? 12 : h24 % 12;
  return {hours, minutes, seconds, period};
};

const DEFAULT_TIME = {hours: 8, minutes: 0, seconds: 0, period: 'AM'};

// ─── Scroll Picker ───────────────────────────────────────────────────────────

const ITEM_HEIGHT = 44;

const ScrollPicker = ({items, selectedValue, onChange}) => {
  const scrollRef = useRef(null);
  const P = usePalette();
  const styles = tpStyles(P);

  // items: array of numbers or strings; selectedValue is the current value
  const index = items.indexOf(selectedValue);

  useEffect(() => {
    if (scrollRef.current && index >= 0) {
      scrollRef.current.scrollTo({y: index * ITEM_HEIGHT, animated: false});
    }
  }, []);

  return (
    <ScrollView
      ref={scrollRef}
      style={{height: ITEM_HEIGHT * 3, width: 56}}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      onMomentumScrollEnd={e => {
        const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
        if (idx >= 0 && idx < items.length) onChange(items[idx]);
      }}
      contentContainerStyle={{paddingVertical: ITEM_HEIGHT}}>
      {items.map(item => (
        <TouchableOpacity
          key={item}
          style={{
            height: ITEM_HEIGHT,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => onChange(item)}>
          <Text
            style={{
              fontSize: 20,
              fontWeight:
                String(item) === String(selectedValue) ? '700' : '400',
              color:
                String(item) === String(selectedValue) ? P.primary : '#555',
            }}>
            {String(item).padStart(2, '0')}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ─── TimePickerModal ─────────────────────────────────────────────────────────

// ─── TimePickerModal ─────────────────────────────────────────────────────────

const HOURS = Array.from({length: 12}, (_, i) => i + 1);
const MINUTES = Array.from({length: 60}, (_, i) => i);
const SECONDS = Array.from({length: 60}, (_, i) => i);
const PERIODS = ['AM', 'PM'];

const TimePickerModal = ({visible, initialTime, onConfirm, onClose}) => {
  const [local, setLocal] = useState(initialTime || DEFAULT_TIME);

  useEffect(() => {
    if (visible) {
      setLocal(initialTime || DEFAULT_TIME);
    }
  }, [visible, initialTime]);

  // ✅ renamed helper
  const updateField = field => value => {
    setLocal(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={tpStyles.overlay}>
        <View style={tpStyles.container}>
          {/* Title */}
          <Text style={tpStyles.title}>Select Time</Text>

          {/* Headers */}
          <View style={tpStyles.headerRow}>
            {['HH', 'MM', 'SS', ''].map((h, i) => (
              <Text key={i} style={tpStyles.colHeader}>
                {h}
              </Text>
            ))}
          </View>

          {/* Pickers */}
          <View style={tpStyles.pickersRow}>
            {/* Hours */}
            <ScrollPicker
              items={HOURS}
              selectedValue={local.hours}
              onChange={updateField('hours')}
            />

            <Text style={tpStyles.colon}>:</Text>

            {/* Minutes */}
            <ScrollPicker
              items={MINUTES}
              selectedValue={local.minutes}
              onChange={updateField('minutes')}
            />

            <Text style={tpStyles.colon}>:</Text>

            {/* Seconds */}
            <ScrollPicker
              items={SECONDS}
              selectedValue={local.seconds}
              onChange={updateField('seconds')}
            />

            {/* AM / PM */}
            <View style={tpStyles.periodCol}>
              {PERIODS.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[
                    tpStyles.periodBtn,
                    local.period === p && tpStyles.periodBtnActive,
                  ]}
                  // ✅ FIXED HERE
                  onPress={() => updateField('period')(p)}>
                  <Text
                    style={[
                      tpStyles.periodText,
                      local.period === p && tpStyles.periodTextActive,
                    ]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Highlight bar */}
          <View style={tpStyles.highlightBar} pointerEvents="none" />

          {/* Buttons */}
          <View style={tpStyles.btnRow}>
            <TouchableOpacity style={tpStyles.cancelBtn} onPress={onClose}>
              <Text style={tpStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tpStyles.okBtn}
              onPress={() => onConfirm(local)}>
              <Text style={tpStyles.okText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// const tpStyles = StyleSheet.create({
const tpStyles = P =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      backgroundColor: '#fff',
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingVertical: 18,
      width: 320,
      alignItems: 'center',
      elevation: 10,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 12,
    },
    title: {
      fontSize: 17,
      fontWeight: '600',
      color: '#1a1a1a',
      marginBottom: 10,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
      gap: 4,
    },
    colHeader: {
      width: 56,
      textAlign: 'center',
      fontSize: 12,
      color: '#888',
      fontWeight: '600',
      letterSpacing: 1,
    },
    pickersRow: {
      flexDirection: 'row',
      alignItems: 'center',
      position: 'relative',
    },
    colon: {
      fontSize: 22,
      fontWeight: '700',
      color: '#333',
      marginHorizontal: 2,
      marginBottom: 4,
    },
    periodCol: {
      marginLeft: 10,
      justifyContent: 'center',
      gap: 8,
    },
    periodBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: '#f0f0f0',
    },
    periodBtnActive: {
      backgroundColor: P.primary,
    },
    periodText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#555',
    },
    periodTextActive: {
      color: P.onPrimary,
    },
    highlightBar: {
      position: 'absolute',
      top: '50%',
      left: 0,
      right: 0,
      height: ITEM_HEIGHT,
      backgroundColor: P.tint,
      borderRadius: 8,
      transform: [{translateY: 22}], // rough centering; adjust if needed
      zIndex: -1,
    },
    btnRow: {
      flexDirection: 'row',
      marginTop: 16,
      gap: 12,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#ddd',
      alignItems: 'center',
    },
    cancelText: {
      fontSize: 15,
      color: '#555',
      fontWeight: '500',
    },
    okBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: P.primary,
      alignItems: 'center',
    },
    okText: {
      fontSize: 15,
      color: P.onPrimary,
      fontWeight: '600',
    },
  });

// ─── Main Screen ─────────────────────────────────────────────────────────────

const OvertimePlanner_Create = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const P = usePalette();
  const styles = localStyles(P);

  const isRTL = useSelector(state => state.language.isRTL);
  const userData = useSelector(state => state.user.userData);
  const {menuItems} = useSelector(state => state.menuItem);

  const routeUserData = route.params?.userData;
  const effectiveUserData = routeUserData || userData || {};

  const {
    mode = 'create',
    overtimeData = {},
    employeeId = overtimeData.employeeId || effectiveUserData?.employeeId || '',
    employeeName = overtimeData.employeeName ||
      effectiveUserData?.employeeName ||
      '',
    WorkerRecId = overtimeData.WorkerRecId ||
      effectiveUserData?.WorkerRecId ||
      '',
    cameFrom = 'MainDashboard',
  } = route.params || {};

  // ── today string ──
  const todayISO = new Date().toISOString().split('T')[0]; // "2025-06-01"

  const formatDate = dateStr => {
    if (!dateStr) return '';

    const d = new Date(dateStr);

    // Validate date
    if (isNaN(d.getTime())) {
      return '';
    }

    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();

    return `${mm}/${dd}/${yyyy}`;
  };

  // ── form state ──
  const [formData, setFormData] = useState({
    employeeId,
    employeeName,
    WorkerRecId,
    requestDate: todayISO,
    planDate: '',
    startTime: null, // will hold time-parts object
    endTime: null, // will hold time-parts object
  });

  const [showPlanCalendar, setShowPlanCalendar] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // ── keyboard listener ──
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // ── hardware back ──
  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        goBack();
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBack);
    }, []),
  );

  // ── scroll to top on focus ──
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({y: 0, animated: false});
    }, []),
  );

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('MainDashboard');
  };

  const getPageLabel = () => {
    const item = menuItems?.find(m => m.MenuId === 'OvertimePlannerCreate');
    const base = item?.Label || 'Overtime Planner';
    return `${t('common.create') || 'Create'} ${base}`;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  // ── plan date ──
  const handlePlanDateChange = selectedDate => {
    // Convert to proper Date object
    const date = new Date(selectedDate);

    // Validate date
    if (isNaN(date.getTime())) {
      setAlertMessage('Invalid date selected.');
      setAlertModal(true);
      return;
    }

    const formatted = `${date.getFullYear()}-${String(
      date.getMonth() + 1,
    ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    setShowPlanCalendar(false);

    setFormData(prev => ({
      ...prev,
      planDate: formatted,
    }));
  };

  // ── time confirm ──
  const handleStartTimeConfirm = timeParts => {
    setShowStartTimePicker(false);
    setFormData(prev => ({...prev, startTime: timeParts}));
  };

  const handleEndTimeConfirm = timeParts => {
    setShowEndTimePicker(false);

    // Validate end > start
    if (formData.startTime) {
      const startSec = timePartsToSeconds(formData.startTime);
      const endSec = timePartsToSeconds(timeParts);
      if (endSec <= startSec) {
        setAlertMessage('End time must be after start time.');
        setAlertModal(true);
        return;
      }
    }

    setFormData(prev => ({...prev, endTime: timeParts}));
  };

  // ── submit ──
  const handleCreate = async () => {
    // Validation
    const missing = [];
    if (!formData.planDate) missing.push('Plan Date');
    if (!formData.startTime) missing.push('Start Time');
    if (!formData.endTime) missing.push('End Time');

    if (missing.length > 0) {
      setAlertMessage(
        `Please fill in the required fields:\n${missing.join('\n')}`,
      );
      setAlertModal(true);
      return;
    }

    setIsProcessing(true);

    try {
      const payload = {
        EmployeeId: formData.employeeId,
        EmployeeName: formData.employeeName,
        WorkerRecId: formData.WorkerRecId,
        RequestDate: `${formData.requestDate}T12:00:00`,
        RecId: '0', // New record
        PlanDate: `${formData.planDate}T12:00:00`,
        // ↓ Seconds from midnight, as required by API contract
        StartTime: timePartsToSeconds(formData.startTime),
        EndTime: timePartsToSeconds(formData.endTime),
      };

      const response = await createovertimePlan({overtimeData: payload});

      if (response?.IsSuccess === 'true' || response?.IsSuccess === true) {
        setAlertMessage('Overtime plan created successfully.');
        setAlertModal(true);

        setTimeout(() => {
          setAlertModal(false);
          goBack();
        }, 2000);
      } else {
        setAlertMessage(response?.Message || 'Failed to create overtime plan.');
        setAlertModal(true);
      }
    } catch (error) {
      console.error('Error creating overtime plan:', error);
      setAlertMessage('A network or server error occurred. Please try again.');
      setAlertModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <ActionPaneContainer
      pageTitle={getPageLabel()}
      isBackButton={true}
      showFooter={false}
      showTabNavigator={!isKeyboardVisible}
      showFloatingButton={false}
      isHeaderActive={true}
      onBackPress={goBack}
      showPageTitleRow={true}>
      <SafeAreaView style={styles.DSR_SafeArea}>
        {isProcessing && (
          <View style={styles.DSR_ProcessingOverlay}>
            <View style={styles.DSR_ProcessingContainer}>
              <ActivityIndicator size="large" color={P.primaryStrong} />
              <Text style={styles.DSR_ProcessingText}>
                {t('common.processing') || 'Processing...'}
              </Text>
            </View>
          </View>
        )}

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.DSR_FormContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* ── Employee ID ── */}
          <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
            Employee ID
          </Text>
          <Text
            style={[
              styles.DSR_Input,
              styles.DSR_Disabled,
              isRTL && {textAlign: 'left'},
            ]}>
            {formData.employeeId}
          </Text>

          {/* ── Employee Name ── */}
          <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
            Employee Name
          </Text>
          <Text
            style={[
              styles.DSR_Input,
              styles.DSR_Disabled,
              isRTL && {textAlign: 'left'},
            ]}>
            {formData.employeeName}
          </Text>

          {/* ── Request Date (today, read-only) ── */}
          <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
            Request Date
          </Text>
          <Text
            style={[
              styles.DSR_Input,
              styles.DSR_Disabled,
              isRTL && {textAlign: 'left'},
            ]}>
            {formatDate(formData.requestDate)}
          </Text>

          {/* ── Plan Date (selectable) ── */}
          <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
            Plan Date *
          </Text>
          <TouchableOpacity
            style={[styles.DSR_DateSelector, isRTL && {flexDirection: 'row'}]}
            onPress={() => setShowPlanCalendar(true)}>
            <View style={{flex: 1}}>
              <Text
                style={[
                  styles.DSR_DateText,
                  isRTL && {textAlign: 'left'},
                  !formData.planDate && {color: '#999'},
                ]}>
                {formData.planDate
                  ? formatDate(formData.planDate)
                  : 'Select Plan Date'}
              </Text>
            </View>
            <Icon name="calendar" size={20} color={P.primaryStrong} />
          </TouchableOpacity>

          {/* ── Start Time (selectable) ── */}
          <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
            Start Time *
          </Text>
          <TouchableOpacity
            style={[styles.DSR_DateSelector, isRTL && {flexDirection: 'row'}]}
            onPress={() => setShowStartTimePicker(true)}>
            <View style={{flex: 1}}>
              <Text
                style={[
                  styles.DSR_DateText,
                  isRTL && {textAlign: 'left'},
                  !formData.startTime && {color: '#999'},
                ]}>
                {formData.startTime
                  ? formatTimeParts(formData.startTime)
                  : 'Select Start Time'}
              </Text>
            </View>
            <Icon name="clock-o" size={20} color={P.primaryStrong} />
          </TouchableOpacity>

          {/* ── End Time (selectable) ── */}
          <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
            End Time *
          </Text>
          <TouchableOpacity
            style={[styles.DSR_DateSelector, isRTL && {flexDirection: 'row'}]}
            onPress={() => setShowEndTimePicker(true)}>
            <View style={{flex: 1}}>
              <Text
                style={[
                  styles.DSR_DateText,
                  isRTL && {textAlign: 'left'},
                  !formData.endTime && {color: '#999'},
                ]}>
                {formData.endTime
                  ? formatTimeParts(formData.endTime)
                  : 'Select End Time'}
              </Text>
            </View>
            <Icon name="clock-o" size={20} color={P.primaryStrong} />
          </TouchableOpacity>
        </ScrollView>

        {/* ── Footer buttons ── */}
        <View style={localStyles.footer}>
          <TouchableOpacity
            style={[localStyles.btn, localStyles.cancelBtn]}
            onPress={goBack}
            disabled={isProcessing}>
            <Text style={localStyles.cancelText}>
              {t('common.cancel') || 'Cancel'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              localStyles.btn,
              localStyles.createBtn,
              isProcessing && {opacity: 0.6},
            ]}
            onPress={handleCreate}
            disabled={isProcessing}>
            {isProcessing ? (
              <ActivityIndicator color={P.onPrimary} size="small" />
            ) : (
              <Text style={localStyles.createText}>
                {t('common.create') || 'Create'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ── Plan Date Calendar ── */}
      {showPlanCalendar && (
        <CalendarModal
          visible={showPlanCalendar}
          initialDate={formData.planDate || todayISO}
          onDateSelected={handlePlanDateChange}
          onClose={() => setShowPlanCalendar(false)}
        />
      )}

      {/* ── Start Time Picker ── */}
      <TimePickerModal
        visible={showStartTimePicker}
        initialTime={formData.startTime || DEFAULT_TIME}
        onConfirm={handleStartTimeConfirm}
        onClose={() => setShowStartTimePicker(false)}
      />

      {/* ── End Time Picker ── */}
      <TimePickerModal
        visible={showEndTimePicker}
        initialTime={formData.endTime || DEFAULT_TIME}
        onConfirm={handleEndTimeConfirm}
        onClose={() => setShowEndTimePicker(false)}
      />

      {/* ── Alert ── */}
      <AlertModal
        visible={alertModal}
        heading={t('common.alert') || 'Alert'}
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
    </ActionPaneContainer>
  );
};

// const localStyles = StyleSheet.create({
const localStyles = P =>
  StyleSheet.create({
    footer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: '#eee',
      backgroundColor: '#fff',
    },
    btn: {
      flex: 1,
      paddingVertical: 13,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelBtn: {
      borderWidth: 1,
      borderColor: '#ccc',
    },
    cancelText: {
      fontSize: 15,
      color: '#555',
      fontWeight: '500',
    },
    createBtn: {
      backgroundColor: P.primary,
    },
    createText: {
      fontSize: 15,
      color: P.onPrimary,
      fontWeight: '600',
    },
  });

export default OvertimePlanner_Create;
