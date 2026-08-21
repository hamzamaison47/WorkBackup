/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  Text,
  View,
  TextInput,
  ScrollView,
  SafeAreaView,
  BackHandler,
  Platform,
  Animated,
  ActivityIndicator,
  Keyboard,
  TouchableOpacity,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {Dropdown} from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/FontAwesome';
import {translate as t} from '../../../../../store/utils/translate';

import {CreateTravelRequisition} from '../../../API/TravelRequisition/Header/CreateTravelRequisition';
import {UpdateTravelRequisition} from '../../../API/TravelRequisition/Header/UpdateTravelRequisition';

import AlertModal from '../../../../../components/Alert/AlertModal';
import useAlertModal from '../../../../../hooks/useAlertModal';
import DatePicker from 'react-native-date-picker';
import CustomIndicator from '../../../../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../../../../components/ActionPaneContainer';
import SaveRecordButtons, {
  BUTTON_TYPES,
} from '../../../../../components/Buttons/SaveRecordButtons';
import {AppTokens} from '../../../../../components/AppComponentsDesign/Tokens';
import styles from '../../../../../styles/styles';
import useNotify from '../../../../../hooks/useNotify';
import usePalette from '../../../../../hooks/usePalette';
import useAppStyles from '../../../../../hooks/useAppStyles';

const TRAVEL_TYPE_OPTIONS = [
  {label: 'Local', value: 'Local'},
  {label: 'International', value: 'International'},
];

// ─── FIX: module-level stable reference ─────────────────────────────────────
// The inline `headerData = {}` default in destructuring creates a NEW object
// every render, which makes useFocusEffect/useCallback deps change every
// render → infinite re-render loop ("Maximum update depth exceeded") when
// the screen is opened in create mode (where route.params.headerData is
// undefined). A module-level constant has a stable identity across renders,
// breaking the loop entirely. Same pattern used for EMPTY_LINE_DATA on the
// TravelRequisitionLinesListPage screen.
const EMPTY_HEADER_DATA = {};
// ─────────────────────────────────────────────────────────────────────────────

const TravelRequisitionSaveRecord = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const P = usePalette();
  const styles = useAppStyles();

  const userData = useSelector(state => state.user.userData);
  const {selectedLegalEntity, defaultLegalEntity} = useSelector(
    state => state.company,
  );

  const effectiveUserData = route.params?.userData || userData || {};
  const effectiveLegalEntity =
    route.params?.legalEntity ||
    selectedLegalEntity ||
    defaultLegalEntity ||
    effectiveUserData?.defaultLegalEntity ||
    '';

  const {
    mode = 'create',
    // Use EMPTY_HEADER_DATA (stable reference) instead of inline `= {}`
    // to avoid a new object identity on every render in create mode.
    headerData = EMPTY_HEADER_DATA,
    employeeId = effectiveUserData?.employeeId || '',
    employeeName = effectiveUserData?.employeeName || '',
    WorkerRecId = effectiveUserData?.WorkerRecId || '',
    cameFrom = 'TravelRequisitionListPage',
    originalCameFrom = null,
  } = route.params || {};

  const isEditMode = mode === 'edit';

  const {showSuccess, showError, showWarning, hide, alertModalProps} =
    useAlertModal();
  const [processingButton, setProcessingButton] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [dateTimeField, setDateTimeField] = useState(null);
  const [errors, setErrors] = useState({});
  const {notifySuccess, notifyError} = useNotify('Travel Requisition');

  const normalizeHeaderRecId = data => data?.RecId || data?.recId || '';

  const createInitialFormData = useCallback(() => {
    if (isEditMode) {
      return {
        recId: normalizeHeaderRecId(headerData),
        employeeId,
        employeeName,
        WorkerRecId,
        legalEntity: effectiveLegalEntity,
        Location: headerData.Location || '',
        Description: headerData.Description || '',
        TravelType: headerData.TravelType || 'Local',
        NumberofDays: headerData.NumberofDays || '',
        FromDate: headerData.FromDate || '',
        ToDate: headerData.ToDate || '',
        Person: '',
      };
    }
    return {
      employeeId,
      employeeName,
      WorkerRecId,
      legalEntity: effectiveLegalEntity,
      Location: '',
      Description: '',
      TravelType: 'Local',
      NumberofDays: '',
      FromDate: '',
      ToDate: '',
      Person: '',
    };
  }, [
    isEditMode,
    headerData,
    employeeId,
    employeeName,
    WorkerRecId,
    effectiveLegalEntity,
  ]);

  const [formData, setFormData] = useState(() => createInitialFormData());

  // Keep Number of Days in sync with the selected date range (inclusive).
  useEffect(() => {
    setFormData(prev => {
      const computed = computeInclusiveDays(prev.FromDate, prev.ToDate);
      if (computed === prev.NumberofDays) return prev;
      return {...prev, NumberofDays: computed};
    });
  }, [formData.FromDate, formData.ToDate]);

  const clearAllStates = useCallback(() => {
    setFormData(createInitialFormData());
    setErrors({});
    hide();
    setProcessingButton('');
  }, [createInitialFormData]);

  useEffect(() => {
    return () => {
      clearAllStates();
    };
  }, []);

  const goBack = useCallback(() => {
    clearAllStates();
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'TravelRequisitionListPage',
          params: {
            employeeId,
            employeeName,
            WorkerRecId,
            userData: {employeeId, employeeName, WorkerRecId},
            cameFrom: originalCameFrom || 'DrawerNavigator',
          },
        },
      ],
    });
  }, [navigation, originalCameFrom, employeeId, employeeName, WorkerRecId]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        goBack();
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [goBack]),
  );

  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({y: 0, animated: false});
    }, []),
  );

  // No async lookups needed — reveal the form immediately.
  // Deps: headerData (stable once EMPTY_HEADER_DATA fix is applied in create
  // mode; a real object in edit mode, changes only on navigation).
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      setFormData(createInitialFormData());
      setErrors({});
      hide();
      setProcessingButton('');
      setIsLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, [createInitialFormData]),
  );

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false),
    );
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    setFormData(createInitialFormData());
    setErrors({});
    setIsLoading(false);
  }, [createInitialFormData]);

  const clearFieldError = field =>
    setErrors(prev => {
      if (!prev[field]) return prev;
      const next = {...prev};
      delete next[field];
      return next;
    });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
    clearFieldError(field);
  };

  // Manually parses YYYY-MM-DDTHH:MM:SS strings as local time components.
  // new Date(string) is deliberately avoided — on Hermes, a no-offset
  // datetime string is parsed as UTC, so reading it back with getHours()
  // (local) shifts by the timezone offset (e.g. +5 hours in Pakistan).
  const parseLocalDateTimeString = str => {
    if (!str) return null;
    const [datePart, timePart = '00:00:00'] = str.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds || 0);
  };

  const formatDateTime = date => {
    const d = parseLocalDateTimeString(date);
    if (!d) return '';
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    let hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${day}/${month}/${year} ${hours}:${mins} ${ampm}`;
  };

  const toLocalDateTimeString = date => {
    const pad = n => String(n).padStart(2, '0');
    return (
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
        date.getDate(),
      )}` +
      `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
        date.getSeconds(),
      )}`
    );
  };

  const handleDateTimeConfirm = date => {
    const field = dateTimeField;
    setDateTimeField(null);
    if (!field) return;
    setFormData(prev => ({...prev, [field]: toLocalDateTimeString(date)}));
    clearFieldError(field);
  };

  const pickerInitialDate = () => {
    const current = dateTimeField ? formData[dateTimeField] : '';
    const d = parseLocalDateTimeString(current);
    return d && !isNaN(d.getTime()) ? d : new Date();
  };

  const pickerMinDate = () =>
    dateTimeField === 'ToDate' && formData.FromDate
      ? parseLocalDateTimeString(formData.FromDate)
      : undefined;

  const pickerMaxDate = () =>
    dateTimeField === 'FromDate' && formData.ToDate
      ? parseLocalDateTimeString(formData.ToDate)
      : undefined;

  const validate = () => {
    const nextErrors = {};
    const missing = [];

    if (!formData.Location?.trim()) {
      nextErrors.Location = 'Destination is required';
      missing.push('Destination');
    }
    if (!formData.Description?.trim()) {
      nextErrors.Description = 'Purpose of Travel is required';
      missing.push('Purpose of Travel');
    }
    if (!formData.TravelType) {
      nextErrors.TravelType = 'Travel Type is required';
      missing.push('Travel Type');
    }
    if (!formData.FromDate) {
      nextErrors.FromDate = 'Travel from date is required';
      missing.push('Travel from date');
    }
    if (!formData.ToDate) {
      nextErrors.ToDate = 'Travel to date is required';
      missing.push('Travel to date');
    }

    let dateOrderError = null;
    if (formData.FromDate && formData.ToDate) {
      const from = parseLocalDateTimeString(formData.FromDate);
      const to = parseLocalDateTimeString(formData.ToDate);
      if (to.getTime() < from.getTime()) {
        dateOrderError = 'To Date cannot be earlier than From Date';
        nextErrors.ToDate = dateOrderError;
      }
    }

    setErrors(nextErrors);
    return {
      valid: Object.keys(nextErrors).length === 0,
      missing,
      dateOrderError,
    };
  };

  const computeInclusiveDays = (fromDate, toDate) => {
    if (!fromDate || !toDate) return '';
    const from = parseLocalDateTimeString(fromDate);
    const to = parseLocalDateTimeString(toDate);
    if (!from || !to || isNaN(from.getTime()) || isNaN(to.getTime())) return '';
    const fromMidnight = new Date(
      from.getFullYear(),
      from.getMonth(),
      from.getDate(),
    );
    const toMidnight = new Date(to.getFullYear(), to.getMonth(), to.getDate());
    const days =
      Math.round((toMidnight.getTime() - fromMidnight.getTime()) / 86400000) +
      1;
    return days > 0 ? String(days) : '';
  };

  const handleAction = async (actionType, data = {}) => {
    try {
      const response = isEditMode
        ? await UpdateTravelRequisition({
            recId: data.recId,
            Location: data.Location,
            Description: data.Description,
            FromDate: data.FromDate,
            ToDate: data.ToDate,
            NumberofDays: data.NumberofDays,
            TravelType: data.TravelType,
          })
        : await CreateTravelRequisition({
            Location: data.Location,
            Description: data.Description,
            FromDate: data.FromDate,
            ToDate: data.ToDate,
            NumberofDays: data.NumberofDays,
            TravelType: data.TravelType,
            PersonnelNumber: data.employeeId || employeeId || '',
          });

      if (response?.IsSuccess) {
        const successMsg =
          response?.Message ||
          (isEditMode
            ? 'Travel requisition updated successfully'
            : 'Record created successfully');
        notifySuccess(successMsg);
        showSuccess(successMsg);
        return {success: true, recId: response?.RecId || data.recId || ''};
      }

      const errorMessage =
        response?.Message ||
        (isEditMode ? 'Error updating Record' : 'Error creating Record');
      notifyError(errorMessage);
      showError(errorMessage);
      return {success: false, message: errorMessage};
    } catch (error) {
      console.error('Error in handleAction:', error);
      showError('An error occurred while processing the request.');
      return {success: false, message: 'Network or server error'};
    }
  };

  const handleSave = async actionType => {
    if (processingButton) return;

    const {valid, missing, dateOrderError} = validate();
    if (!valid) {
      const lines = [];
      if (missing.length > 0) {
        lines.push('Please fill in the following required fields:');
        lines.push(...missing);
      }
      if (dateOrderError) {
        if (lines.length > 0) lines.push('');
        lines.push(dateOrderError);
      }
      showWarning(
        lines.length > 0
          ? lines.join('\n')
          : 'Please correct the highlighted fields before saving.',
      );
      return;
    }

    setProcessingButton(actionType);
    setIsProcessing(true);

    try {
      const result = await handleAction(actionType, formData);
      if (result.success) {
        setTimeout(() => {
          clearAllStates();
          goBack();
        }, 1500);
      }
    } catch (error) {
      console.error('Error saving travel requisition:', error);
      showError('Failed to save record. Please try again.');
    } finally {
      setProcessingButton('');
      setIsProcessing(false);
    }
  };

  const renderError = field =>
    errors[field] ? (
      <Text style={{color: AppTokens.red, fontSize: 12, marginTop: 4}}>
        {errors[field]}
      </Text>
    ) : null;

  return (
    <ActionPaneContainer
      pageTitle={
        isEditMode ? 'Edit travel requisition' : 'New travel requisition'
      }
      isBackButton={true}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={!isKeyboardVisible}
      onBackPress={goBack}
      onRefresh={handleRefresh}
      showPageTitleRow={true}>
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <Animated.View style={{flex: 1, opacity: fadeAnim}}>
          <SafeAreaView style={styles.DSR_SafeArea}>
            {isProcessing && (
              <View style={styles.DSR_ProcessingOverlay}>
                <View style={styles.DSR_ProcessingContainer}>
                  <ActivityIndicator size="large" color={P.primary} />
                  <Text style={styles.DSR_ProcessingText}>
                    {t('common.processing')}
                  </Text>
                </View>
              </View>
            )}
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={styles.DSR_FormContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}>
              <Text style={styles.DSR_Label}>Destination *</Text>
              <TextInput
                style={styles.DSR_Input}
                value={formData.Location}
                onChangeText={value => handleInputChange('Location', value)}
                placeholder="Enter destination"
                placeholderTextColor={AppTokens.subtitleText}
              />
              {renderError('Location')}

              <Text style={styles.DSR_Label}>Purpose of travel *</Text>
              <TextInput
                style={[
                  styles.DSR_Input,
                  {minHeight: 90, textAlignVertical: 'top'},
                ]}
                value={formData.Description}
                onChangeText={value => handleInputChange('Description', value)}
                placeholder="Enter purpose of travel"
                placeholderTextColor={AppTokens.subtitleText}
                multiline
                numberOfLines={4}
              />
              {renderError('Description')}

              <Text style={styles.DSR_Label}>Travel type</Text>
              <Dropdown
                style={styles.DSR_Input}
                data={TRAVEL_TYPE_OPTIONS}
                labelField="label"
                valueField="value"
                placeholder="Select Travel Type"
                value={formData.TravelType}
                onChange={item => handleInputChange('TravelType', item.value)}
                placeholderStyle={styles.DSR_DropdownPlaceholder}
                selectedTextStyle={styles.DSR_DropdownSelectedText}
                itemTextStyle={styles.DSR_DropdownItemText}
                activeColor={P.tint}
                containerStyle={[
                  styles.DSR_DropdownContainer,
                  {marginTop: Platform.OS === 'ios' ? 5 : 2, zIndex: 1000},
                ]}
                itemContainerStyle={styles.DSR_DropdownItemContainer}
                maxHeight={280}
                dropdownPosition="auto"
                iconStyle={styles.DSR_DropdownIcon}
                keyboardAvoiding={true}
              />
              {renderError('TravelType')}

              <Text style={styles.DSR_Label}>Number of days</Text>
              <TextInput
                style={[styles.DSR_Input, {opacity: 0.6}]}
                value={String(formData.NumberofDays ?? '')}
                editable={false}
                placeholder="0"
                placeholderTextColor={AppTokens.subtitleText}
              />

              <Text style={styles.DSR_Label}>Travel from date *</Text>
              <TouchableOpacity
                style={styles.DSR_DateSelector}
                onPress={() => setDateTimeField('FromDate')}>
                <View style={{flex: 1}}>
                  <Text style={styles.DSR_DateText}>
                    {formData.FromDate
                      ? formatDateTime(formData.FromDate)
                      : 'Select from date/time'}
                  </Text>
                </View>
                <Icon name="calendar" size={20} color={P.primary} />
              </TouchableOpacity>
              {renderError('FromDate')}

              <Text style={styles.DSR_Label}>Travel to date *</Text>
              <TouchableOpacity
                style={[
                  styles.DSR_DateSelector,
                  !formData.FromDate && {opacity: 0.5},
                ]}
                disabled={!formData.FromDate}
                onPress={() => setDateTimeField('ToDate')}>
                <View style={{flex: 1}}>
                  <Text style={styles.DSR_DateText}>
                    {formData.ToDate
                      ? formatDateTime(formData.ToDate)
                      : formData.FromDate
                      ? 'Select to date/time'
                      : 'Select from date first'}
                  </Text>
                </View>
                <Icon name="calendar" size={20} color={P.primary} />
              </TouchableOpacity>
              {renderError('ToDate')}
            </ScrollView>

            <SaveRecordButtons
              mode={isEditMode ? 'edit' : 'create'}
              processingButton={processingButton}
              onSave={handleSave}
              onCancel={goBack}
              isDisabled={
                processingButton === 'create' || processingButton === 'submit'
              }
              showButtons={[BUTTON_TYPES.CREATE, BUTTON_TYPES.CANCEL]}
            />

            <AlertModal {...alertModalProps} />
          </SafeAreaView>
        </Animated.View>
      )}

      <DatePicker
        modal
        open={dateTimeField !== null}
        date={pickerInitialDate()}
        mode="datetime"
        is24hourSource="locale"
        locale="en-US"
        minimumDate={pickerMinDate()}
        maximumDate={pickerMaxDate()}
        onConfirm={handleDateTimeConfirm}
        onCancel={() => setDateTimeField(null)}
      />
    </ActionPaneContainer>
  );
};

export default TravelRequisitionSaveRecord;
