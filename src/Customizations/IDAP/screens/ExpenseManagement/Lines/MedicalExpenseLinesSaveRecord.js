/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  BackHandler,
  Platform,
  Keyboard,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
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

import {RetrieveExpenseSubCategory} from '../../../API/ExpenseManagement/Lines/RetrieveExpenseSubCategory';
import {RetrievePatientName} from '../../../API/ExpenseManagement/Lines/RetrievePatientName';
import {CreateMedicalExpenseLine} from '../../../API/ExpenseManagement/Lines/CreateMedicalExpenseLine';
import {UpdateMedicalExpenseLine} from '../../../API/ExpenseManagement/Lines/UpdateMedicalExpenseLine';

import AlertModal from '../../../../../components/Alert/AlertModal';
import useAlertModal from '../../../../../hooks/useAlertModal';
import CalendarModal from '../../../../../components/Leaves/CalendarModal';
import CustomIndicator from '../../../../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../../../../components/ActionPaneContainer';
import SaveRecordButtons, {
  BUTTON_TYPES,
} from '../../../../../components/Buttons/SaveRecordButtons';
import {AppTokens} from '../../../../../components/AppComponentsDesign/Tokens';
import styles from '../../../../../styles/styles';
import useNotify from '../../../../../hooks/useNotify';
import usePalette from '../../../../../hooks/usePalette';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import useAppStyles from '../../../../../hooks/useAppStyles';

// Module-level, stable-across-renders default for lineData. Using an inline
// `lineData = {}` default in the destructure below would create a NEW object
// reference on every render, which — when depended on inside useFocusEffect —
// causes an infinite update loop in create mode (new lineData reference ->
// effect re-fires -> setState -> re-render -> new lineData reference -> ...).
// A shared module-level constant fixes that: it's the same reference every
// time route.params.lineData is genuinely absent. (Same fix as the sibling
// TravelRequisitionLinesSaveRecord screen.)
const EMPTY_LINE_DATA = {};

const MedicalExpenseLinesSaveRecord = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const P = usePalette();
  const {notifySuccess, notifyError} = useNotify('Medical Expense Line');
  const styles = useAppStyles();

  const reduxUserData = useSelector(state => state.user.userData);
  const {selectedLegalEntity, defaultLegalEntity} = useSelector(
    state => state.company,
  );

  const {
    mode = 'create',
    lineData = EMPTY_LINE_DATA,
    headerRecId,
    expenseReportNumber,
    workerRecId,
    userData: routeUserData,
    cameFrom,
    originalCameFrom,
  } = route.params || {};

  const isEdit = mode === 'edit';

  const effectiveUserData = routeUserData || reduxUserData || {};
  const effectiveWorkerRecId =
    workerRecId || effectiveUserData?.WorkerRecId || '';
  const effectiveEmployeeId = effectiveUserData?.employeeId || '';
  const effectiveEmployeeName = effectiveUserData?.employeeName || '';
  const effectiveLegalEntity = selectedLegalEntity || defaultLegalEntity || '';

  const today = new Date().toISOString().split('T')[0] + 'T12:00:00';

  // Defensively coerce any date value (string OR Date object) into an ISO
  // string. lineData comes from the SOAP response via GetAllMedicalExpenseLines,
  // and depending on parsing, date fields can arrive as JS Date instances
  // instead of strings — CalendarModal (and other consumers) assume strings
  // and crash on Date objects.
  const toDateString = value => {
    if (!value) return '';
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      const hours = String(value.getHours()).padStart(2, '0');
      const minutes = String(value.getMinutes()).padStart(2, '0');
      const seconds = String(value.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }
    return String(value);
  };

  const createInitialFormData = () => ({
    RecId: isEdit ? lineData.RecId : '',
    SubCategory: isEdit ? lineData.SubCategory || '' : '',
    Name: isEdit ? lineData.Name || '' : '',
    Relation: isEdit ? lineData.Relation || '' : '',
    ReceiptNum: isEdit ? lineData.ReceiptNum || '' : '',
    TransDate: isEdit ? toDateString(lineData.TransDate) || today : today,
    ClaimedAmount: isEdit
      ? lineData.ClaimedAmount != null
        ? String(lineData.ClaimedAmount)
        : ''
      : '',
    TransAmount: isEdit
      ? lineData.TransAmount != null
        ? String(lineData.TransAmount)
        : ''
      : '',
    AuthAmount: isEdit
      ? lineData.AuthAmount != null
        ? String(lineData.AuthAmount)
        : ''
      : '',
    Remarks: isEdit ? lineData.Remarks || '' : '',
    IsReceiptAttached: isEdit ? !!lineData.IsReceiptAttached : false,
    TrvExpTable: isEdit ? lineData.TrvExpTable || headerRecId : headerRecId,
  });

  const [subCategoryOptions, setSubCategoryOptions] = useState([]);
  const [patientOptions, setPatientOptions] = useState([]);
  const [formData, setFormData] = useState(() => createInitialFormData());
  const [errors, setErrors] = useState({});
  const [showCalendar, setShowCalendar] = useState(false);
  const {showSuccess, showError, showWarning, hide, alertModalProps} =
    useAlertModal();
  const [processingButton, setProcessingButton] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const clearAllStates = useCallback(() => {
    setSubCategoryOptions([]);
    setPatientOptions([]);
    setFormData(createInitialFormData());
    setErrors({});
    setShowCalendar(false);
    hide(); // was: setAlertModal(false); setAlertMessage('');
    setProcessingButton('');
    setDataFetched(false);
  }, []);

  useEffect(() => {
    return () => {
      clearAllStates();
    };
  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Always return to the Medical Expense Lines list — never the general Expense
  // module.
  const goBack = useCallback(() => {
    clearAllStates();
    navigation.navigate('MedicalExpenseLinesListPage', {
      headerRecId,
      expenseReportNumber,
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      legalEntity: effectiveLegalEntity,
      userData: effectiveUserData,
      cameFrom: originalCameFrom || cameFrom || 'DrawerNavigator',
      forceShowAddButton: true,
    });
  }, [
    clearAllStates,
    navigation,
    headerRecId,
    expenseReportNumber,
    effectiveEmployeeId,
    effectiveEmployeeName,
    effectiveWorkerRecId,
    effectiveLegalEntity,
  ]);

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
      if (typeof scrollViewRef.current?.scrollToPosition === 'function') {
        scrollViewRef.current.scrollToPosition(0, 0, false);
      }
    }, []),
  );

  const fetchSubCategoryOptions = async (forceRefresh = false) => {
    if (subCategoryOptions.length > 0 && !forceRefresh) return;
    const subCategories = await RetrieveExpenseSubCategory();
    const unique = [...new Set((subCategories || []).filter(Boolean))];
    const opdOnly = unique.filter(sub =>
      String(sub).toUpperCase().includes('OPD'),
    );
    setSubCategoryOptions(opdOnly.map(sub => ({label: sub, value: sub})));
  };

  // Relation is now folded into the dropdown label (e.g. "John Doe (Son)"),
  // so the picker itself shows the relationship without the user needing to
  // check the separate read-only Relation field below. `value` stays the
  // plain Name — unchanged downstream contract for handlePatientChange,
  // formData.Name, and the Create/Update API payloads.
  const fetchPatientOptions = async (forceRefresh = false) => {
    if (patientOptions.length > 0 && !forceRefresh) return;
    const patients = await RetrievePatientName(effectiveWorkerRecId);
    setPatientOptions(
      (patients || []).map(p => ({
        label: p.Relation ? `${p.Name} (${p.Relation})` : p.Name,
        value: p.Name,
        relation: p.Relation || '',
      })),
    );
  };

  useFocusEffect(
    useCallback(() => {
      const initializeData = async () => {
        setIsLoading(true);
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start();

        if (!dataFetched) {
          try {
            await Promise.all([
              fetchSubCategoryOptions(),
              fetchPatientOptions(),
            ]);
            setDataFetched(true);

            if (isEdit && lineData?.RecId) {
              setFormData(createInitialFormData());
            }
          } catch (error) {
            console.error('Error fetching lookup data:', error);
            showError('Failed to fetch data.');
          }
        }

        setIsLoading(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      };

      initializeData();
    }, [dataFetched]),
  );

  useFocusEffect(
    useCallback(() => {
      setFormData(createInitialFormData());
      setErrors({});
    }, [isEdit, lineData]),
  );

  const handleRefresh = useCallback(async () => {
    if (isEdit) return; // nothing to reset in edit mode
    setIsLoading(true);
    try {
      setSubCategoryOptions([]);
      setPatientOptions([]);
      setDataFetched(false);
      setFormData(createInitialFormData());
      setErrors({});
      await Promise.all([
        fetchSubCategoryOptions(true),
        fetchPatientOptions(true),
      ]);
      setDataFetched(true);
    } catch (error) {
      console.error('Error refreshing lookup data:', error);
      showError('Failed to fetch data.');
    } finally {
      setIsLoading(false);
    }
  }, [isEdit, effectiveWorkerRecId]);

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

  const handleClaimedAmountChange = rawInput => {
    const unformatted = stripThousands(rawInput);
    let cleaned = unformatted.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    setFormData(prev => ({
      ...prev,
      ClaimedAmount: cleaned,
      TransAmount: cleaned,
    }));
    clearFieldError('ClaimedAmount');
    clearFieldError('TransAmount');
  };

  const handleSubCategoryChange = item => {
    setFormData(prev => ({...prev, SubCategory: item.value}));
    clearFieldError('SubCategory');
  };

  // On patient select, auto-fill Relation from the chosen item's Relation. The
  // backend now always returns Relation, so it is the single source of truth:
  // selecting a patient overwrites Relation (no manual-entry fallback), and the
  // Relation field itself is read-only (see the disabled TextInput below).
  const handlePatientChange = item => {
    setFormData(prev => ({
      ...prev,
      Name: item.value,
      Relation: item.relation || '',
    }));
    clearFieldError('Name');
    clearFieldError('Relation');
  };

  const formatDisplayDate = date => {
    if (!date) return '';
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatThousands = value => {
    if (value === '' || value === null || value === undefined) return '';
    const [intPart, decPart] = String(value).split('.');
    const sign = intPart.startsWith('-') ? '-' : '';
    const digitsOnly = intPart.replace('-', '');
    const formattedInt = digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decPart !== undefined
      ? `${sign}${formattedInt}.${decPart}`
      : `${sign}${formattedInt}`;
  };

  const stripThousands = value => value.replace(/,/g, '');

  const formatToISOWithTime = dateInput => {
    let year;
    let month;
    let day;
    if (typeof dateInput === 'string') {
      const datePart = dateInput.split('T')[0];
      [year, month, day] = datePart.split('-').map(Number);
    } else {
      year = dateInput.getFullYear();
      month = dateInput.getMonth() + 1;
      day = dateInput.getDate();
    }
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(
      2,
      '0',
    )}T12:00:00`;
  };

  const handleDateChange = date => {
    setFormData(prev => ({...prev, TransDate: formatToISOWithTime(date)}));
    setShowCalendar(false);
    clearFieldError('TransDate');
  };

  // Required + amount validation. Amounts must be numeric and non-negative.
  // const validate = () => {
  //   const nextErrors = {};

  //   if (!formData.SubCategory)
  //     nextErrors.SubCategory = 'Sub Category is required';
  //   if (!formData.Name) nextErrors.Name = 'Patient name is required';
  //   if (!formData.Relation?.trim())
  //     nextErrors.Relation = 'Relation is required';
  //   if (!formData.TransDate)
  //     nextErrors.TransDate = 'Transaction date is required';

  //   const amountFields = [
  //     {key: 'ClaimedAmount', label: 'Claimed Amount'},
  //     {key: 'TransAmount', label: 'Transaction Amount'},
  //   ];

  //   amountFields.forEach(({key, label}) => {
  //     const raw = formData[key];
  //     if (raw === '' || raw === null || raw === undefined) {
  //       nextErrors[key] = `${label} is required`;
  //       return;
  //     }
  //     const num = parseFloat(raw);
  //     if (isNaN(num)) {
  //       nextErrors[key] = `${label} must be a valid number`;
  //     } else if (num < 0) {
  //       nextErrors[key] = `${label} cannot be negative`;
  //     }
  //   });

  //   setErrors(nextErrors);
  //   return Object.keys(nextErrors).length === 0;
  // };

  const validate = () => {
    const nextErrors = {};
    const missing = [];

    if (!formData.SubCategory) {
      nextErrors.SubCategory = 'Sub Category is required';
      missing.push('Expense subcategory');
    }
    if (!formData.Name) {
      nextErrors.Name = 'Patient name is required';
      missing.push('Patient name');
    }
    if (!formData.Relation?.trim()) {
      nextErrors.Relation = 'Relation is required';
      missing.push('Relation with employee');
    }
    if (!formData.TransDate) {
      nextErrors.TransDate = 'Transaction date is required';
      missing.push('Transaction date');
    }

    const raw = formData.ClaimedAmount;
    if (raw === '' || raw === null || raw === undefined) {
      nextErrors.ClaimedAmount = 'Claimed amount is required';
      missing.push('Claimed amount');
    } else {
      const num = parseFloat(raw);
      if (isNaN(num)) {
        nextErrors.ClaimedAmount = 'Claimed amount must be a valid number';
        missing.push('Claimed amount (must be a valid number)');
      } else if (num < 0) {
        nextErrors.ClaimedAmount = 'Claimed amount cannot be negative';
        missing.push('Claimed amount (cannot be negative)');
      }
    }

    setErrors(nextErrors);
    return {valid: Object.keys(nextErrors).length === 0, missing};
  };

  const handleSave = async actionType => {
    if (processingButton) return;

    const {valid, missing} = validate();
    if (!valid) {
      showWarning(`Please fill the following fields:\n${missing.join('\n')}`);
      return;
    }

    setProcessingButton(actionType);
    setIsProcessing(true);

    try {
      let response;

      if (isEdit) {
        response = await UpdateMedicalExpenseLine({
          RecId: formData.RecId,
          SubCategory: formData.SubCategory,
          Name: formData.Name,
          Relation: formData.Relation,
          ReceiptNum: formData.ReceiptNum,
          TransDate: formData.TransDate,
          ClaimedAmount: parseFloat(formData.ClaimedAmount),
          TransAmount: parseFloat(formData.TransAmount),
          // AuthAmount is set by finance/approval, not the employee — carry the
          // existing value forward untouched so edit never resets it to 0.
          AuthAmount: formData.AuthAmount ? parseFloat(formData.AuthAmount) : 0,
          Remarks: formData.Remarks,
          // Carried forward from lineData, never edited on this screen — see
          // the comment on createInitialFormData for why this matters.
          IsReceiptAttached: formData.IsReceiptAttached,
          TrvExpTable: formData.TrvExpTable,
        });
      } else {
        response = await CreateMedicalExpenseLine(headerRecId, {
          SubCategory: formData.SubCategory,
          Name: formData.Name,
          Relation: formData.Relation,
          ReceiptNum: formData.ReceiptNum,
          TransDate: formData.TransDate,
          ClaimedAmount: parseFloat(formData.ClaimedAmount),
          TransAmount: parseFloat(formData.TransAmount),
        });
      }

      if (response?.IsSuccess) {
        const message =
          response.Message ||
          (isEdit
            ? 'Record updated successfully'
            : 'Record created successfully');
        notifySuccess(message);
        showSuccess(message);

        setTimeout(() => {
          hide();
          clearAllStates();
          navigation.navigate('MedicalExpenseLinesListPage', {
            headerRecId,
            expenseReportNumber,
            employeeId: effectiveEmployeeId,
            employeeName: effectiveEmployeeName,
            WorkerRecId: effectiveWorkerRecId,
            legalEntity: effectiveLegalEntity,
            userData: effectiveUserData,
            cameFrom: originalCameFrom || cameFrom || 'DrawerNavigator',
            refresh: Date.now(),
            forceShowAddButton: true,
          });
        }, 1200);
      } else {
        const message =
          response?.Message ||
          (isEdit ? 'Error updating record' : 'Error creating record');
        notifyError(message);
        showError(message);
      }
    } catch (error) {
      console.error('Error saving medical expense line:', error);
      notifyError('Failed to save record. Please try again.');
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
        isEdit ? 'Edit Medical Expense Line' : 'Create Medical Expense Line'
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
            <KeyboardAvoidingView
              style={{flex: 1}}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
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

              <KeyboardAwareScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.DSR_FormContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
                enableOnAndroid={true}
                extraScrollHeight={Platform.OS === 'ios' ? 20 : 0}
                keyboardOpeningTime={0}>
                {/* Sub Category */}
                <Text style={styles.DSR_Label}>Expense subcategory *</Text>
                <Dropdown
                  style={styles.DSR_Input}
                  data={subCategoryOptions}
                  labelField="label"
                  valueField="value"
                  placeholder="Select subcategory"
                  value={formData.SubCategory}
                  onChange={handleSubCategoryChange}
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
                  search
                  searchPlaceholder="Search subcategory"
                  inputSearchStyle={styles.DSR_DropdownSearchInput}
                  iconStyle={styles.DSR_DropdownIcon}
                  keyboardAvoiding={true}
                />
                {renderError('SubCategory')}

                {/* Patient Name — label now shows "Name (Relation)" so the
                    relationship is visible directly in the dropdown/list. */}
                <Text style={styles.DSR_Label}>Patient Name *</Text>
                <Dropdown
                  style={styles.DSR_Input}
                  data={patientOptions}
                  labelField="label"
                  valueField="value"
                  placeholder="Select Patient"
                  value={formData.Name}
                  onChange={handlePatientChange}
                  placeholderStyle={styles.DSR_DropdownPlaceholder}
                  selectedTextStyle={styles.DSR_DropdownSelectedText}
                  itemTextStyle={styles.DSR_DropdownItemText}
                  activeColor={P.tint}
                  containerStyle={[
                    styles.DSR_DropdownContainer,
                    {marginTop: Platform.OS === 'ios' ? 5 : 2, zIndex: 999},
                  ]}
                  itemContainerStyle={styles.DSR_DropdownItemContainer}
                  maxHeight={280}
                  dropdownPosition="auto"
                  search
                  searchPlaceholder="Search Patient"
                  inputSearchStyle={styles.DSR_DropdownSearchInput}
                  iconStyle={styles.DSR_DropdownIcon}
                  keyboardAvoiding={true}
                />
                {renderError('Name')}

                {/* Relation — read-only, auto-filled from the selected patient.
                  Still required for validation, but the user cannot type here. */}
                <Text style={styles.DSR_Label}>Relation with Employee *</Text>
                <TextInput
                  style={[styles.DSR_Input, {opacity: 0.6}]}
                  value={formData.Relation}
                  editable={false}
                  placeholder="Auto-filled from patient"
                  placeholderTextColor={AppTokens.subtitleText}
                />
                {renderError('Relation')}

                {/* Receipt Number */}
                <Text style={styles.DSR_Label}>Receipt number</Text>
                <TextInput
                  style={styles.DSR_Input}
                  value={formData.ReceiptNum}
                  onChangeText={value => handleInputChange('ReceiptNum', value)}
                  placeholder="Enter receipt number"
                  placeholderTextColor={AppTokens.subtitleText}
                />

                {/* Transaction Date */}
                <Text style={styles.DSR_Label}>Transaction date *</Text>
                <TouchableOpacity
                  style={styles.DSR_DateSelector}
                  onPress={() => setShowCalendar(true)}>
                  <View style={{flex: 1}}>
                    <Text style={styles.DSR_DateText}>
                      {formData.TransDate
                        ? formatDisplayDate(formData.TransDate)
                        : 'Select Transaction Date'}
                    </Text>
                  </View>
                  <Icon name="calendar" size={20} color={P.primary} />
                </TouchableOpacity>
                {renderError('TransDate')}

                {/* Claimed Amount */}
                <Text style={styles.DSR_Label}>Claimed amount *</Text>
                <TextInput
                  style={styles.DSR_Input}
                  value={formatThousands(formData.ClaimedAmount)}
                  onChangeText={handleClaimedAmountChange}
                  keyboardType="numeric"
                  placeholder="Enter claimed amount"
                  placeholderTextColor={AppTokens.subtitleText}
                />
                {renderError('ClaimedAmount')}

                {/* Transaction Amount — auto-filled, read-only */}
                <Text style={styles.DSR_Label}>Transaction amount *</Text>
                <TextInput
                  style={[styles.DSR_Input, {opacity: 0.6}]}
                  value={formatThousands(formData.TransAmount)}
                  editable={false}
                  placeholder="Auto-filled from claimed amount"
                  placeholderTextColor={AppTokens.subtitleText}
                />
                {renderError('TransAmount')}
              </KeyboardAwareScrollView>

              <SaveRecordButtons
                mode={mode}
                processingButton={processingButton}
                onSave={handleSave}
                onCancel={goBack}
                isDisabled={
                  processingButton === 'create' || processingButton === 'submit'
                }
                showButtons={[
                  BUTTON_TYPES.CREATE, // component relabels to "Update" when mode === 'edit'
                  BUTTON_TYPES.CANCEL,
                ]}
              />
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Animated.View>
      )}

      {showCalendar && (
        <CalendarModal
          visible={showCalendar}
          initialDate={formData.TransDate}
          onDateSelected={handleDateChange}
          onClose={() => setShowCalendar(false)}
        />
      )}

      <AlertModal {...alertModalProps} />
    </ActionPaneContainer>
  );
};

export default MedicalExpenseLinesSaveRecord;
