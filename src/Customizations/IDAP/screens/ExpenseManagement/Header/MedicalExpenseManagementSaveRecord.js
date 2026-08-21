// export default MedicalExpenseManagementSaveRecord;
/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
// Create/Edit screen for a Medical Expense report header.
//
// EDIT MODE FIELD SOURCE — UNVERIFIED KEY NAMES:
// This screen prefills `expenseCategory`/`date` from `headerData` using
// `headerData.expenseCategory ?? headerData.SLD_CostType` and
// `headerData.date ?? headerData.SLD_MonthOfYear` as a defensive fallback.
// The X++ contract (DFExpenseManagementHeaderContract) does now expose these
// via parmCostType()/parmMonthOfYear() (DataMember names "SLD_CostType" /
// "SLD_MonthOfYear"), but GetAllExpenseManagementHeaders.js — the API layer
// that turns the SOAP response into the JS list item — was not available to
// confirm what key it exposes those under. If the edit form opens with
// Category/Date blank, check that file's field-picking logic first.
//
// UPDATE PAYLOAD: on save, edit mode sends only SLD_CostType and
// SLD_MonthOfYear via UpdateExpenseReport — NOT Purpose, since Purpose is
// fixed at 'Medical' for the life of the record and should not be
// re-submitted on every edit.
//
// Edit is only reachable for Draft-status records — see the
// `disabled: !isDraft` gate on the Edit icon in
// MedicalExpenseManagmentListPage.getButtonConfig().
import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  Text,
  View,
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

import {RetrieveExpenseCategory} from '../../../API/ExpenseManagement/Header/RetrieveExpenseCategory';
import {CreateExpenseReport} from '../../../../../API/ExpenseManagment/Headers/CreateExpenseReport';
import {UpdateExpenseReport} from '../../../../../API/ExpenseManagment/Headers/UpdateExpenseReport';

import AlertModal from '../../../../../components/Alert/AlertModal';
import useAlertModal from '../../../../../hooks/useAlertModal';
import CalendarModal from '../../../../../components/Leaves/CalendarModal';
import CustomIndicator from '../../../../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../../../../components/ActionPaneContainer';
import SaveRecordButtons, {
  BUTTON_TYPES,
} from '../../../../../components/Buttons/SaveRecordButtons';
import styles from '../../../../../styles/styles';
import useNotify from '../../../../../hooks/useNotify';
import useAppStyles from '../../../../../hooks/useAppStyles';

// Confirmed against the TrvExpTable X++ extension.
// SLD_CostType is a plain String field.
// SLD_MonthOfYear is built on the TransDate EDT, so despite its name it takes
// a real date value (MM/dd/yyyy, matching str2Date(..., 321) on the service
// side) rather than a month label.
const EXPENSE_MONTH_FIELD = 'SLD_MonthOfYear';
const EXPENSE_CATEGORY_FIELD = 'SLD_CostType';
const EXPENSE_PURPOSE = 'Medical';

// Module scope — stable references, created once
const EMPTY_EXPENSE_DATA = {};
const EMPTY_HEADER_DATA = {};

const MedicalExpenseManagementSaveRecord = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
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
    expenseData = EMPTY_EXPENSE_DATA,
    headerData = EMPTY_HEADER_DATA,
    employeeId = expenseData.employeeId || effectiveUserData?.employeeId || '',
    employeeName = expenseData.employeeName ||
      effectiveUserData?.employeeName ||
      '',
    WorkerRecId = expenseData.WorkerRecId ||
      effectiveUserData?.WorkerRecId ||
      '',
    cameFrom = 'MedicalExpenseManagmentListPage',
    originalCameFrom = null,
  } = route.params || {};

  const isEditMode = mode === 'edit';

  // State Management
  const [categoryOptions, setCategoryOptions] = useState([]);
  const {showSuccess, showError, showWarning, hide, alertModalProps} =
    useAlertModal();
  const [processingButton, setProcessingButton] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const {notifySuccess, notifyError} = useNotify('Medical Expense Report');

  const today = new Date().toISOString().split('T')[0];
  // near the top, alongside `today`
  const MIN_VALID_YEAR = 1950;
  const isSentinelOrInvalidDate = value => {
    if (!value) return true;
    const d = new Date(value);
    if (isNaN(d.getTime())) return true;
    return d.getFullYear() < MIN_VALID_YEAR;
  };

  // See file header note — key names for the category/date prefill are
  // unverified against GetAllExpenseManagementHeaders.js's actual output.
  const createInitialFormData = useCallback(() => {
    if (isEditMode) {
      return {
        recId:
          headerData.HeaderRecId || headerData.recId || headerData.RecId || '',
        expenseReportNumber: headerData.ExpenseNumber || '',
        employeeId,
        employeeName,
        WorkerRecId,
        legalEntity: effectiveLegalEntity,
        expenseCategory:
          headerData.expenseCategory || headerData.SLD_CostType || '',
        date: isSentinelOrInvalidDate(
          headerData.date ?? headerData.SLD_MonthOfYear,
        )
          ? today
          : headerData.date || headerData.SLD_MonthOfYear,
        ExpenseReportNumber: headerData.ExpenseNumber || '',
      };
    }
    return {
      recId: expenseData.recId || expenseData.RecId || '',
      employeeId,
      employeeName,
      WorkerRecId,
      legalEntity: effectiveLegalEntity,
      expenseCategory: '',
      date: today,
      ExpenseReportNumber: '',
    };
  }, [
    isEditMode,
    headerData,
    expenseData,
    employeeId,
    employeeName,
    WorkerRecId,
    effectiveLegalEntity,
  ]);

  const [formData, setFormData] = useState(() => createInitialFormData());

  // Clear all states when component unmounts
  useEffect(() => {
    return () => {
      clearAllStates();
    };
  }, []);

  const clearAllStates = useCallback(() => {
    setCategoryOptions([]);
    setDataFetched(false);
    setFormData(createInitialFormData());
    hide();
    setProcessingButton('');
  }, [createInitialFormData]);

  const goBack = useCallback(() => {
    clearAllStates();

    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'MedicalExpenseManagmentListPage',
          params: {
            employeeId,
            employeeName,
            WorkerRecId,
            userData: {
              employeeId,
              employeeName,
              WorkerRecId,
            },
            cameFrom: originalCameFrom || 'DrawerNavigator',
          },
        },
      ],
    });
  }, [navigation, originalCameFrom, employeeId, employeeName, WorkerRecId]);

  const clearFormData = useCallback(() => {
    setFormData(createInitialFormData());
  }, [createInitialFormData]);

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

  useFocusEffect(
    useCallback(() => {
      const initializeData = async () => {
        setIsLoading(true);
        setFormData(createInitialFormData());

        hide();
        setProcessingButton('');

        if (!dataFetched) {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start();

          try {
            await fetchExpenseCategoryOptions();
            setDataFetched(true);
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }).start();
          } catch (error) {
            console.error('Error fetching lookup data:', error);
          } finally {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      };

      initializeData();

      return () => {
        // Cleanup only what's necessary
      };
    }, [dataFetched, expenseData, headerData]),
  );

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setCategoryOptions([]);
      setDataFetched(false);
      clearFormData();
      await fetchExpenseCategoryOptions(true);
      setDataFetched(true);
    } catch (error) {
      console.error('Error in Save Record Screen', error);
    } finally {
      setIsLoading(false);
    }
  }, [WorkerRecId]);

  const fetchExpenseCategoryOptions = async (forceRefresh = false) => {
    try {
      if (categoryOptions.length > 0 && !forceRefresh) {
        return;
      }

      const categories = await RetrieveExpenseCategory({
        workerRecId: WorkerRecId,
      });

      const formatted = (categories || []).map(cat => ({
        label: cat.expenseCategory || 'Unknown Category',
        value: cat.expenseCategory || '',
      }));

      setCategoryOptions(formatted);
    } catch (error) {
      console.error('Error fetching expense categories:', error);
      showError('Failed to fetch data.');
    }
  };

  const handleCategoryDropdownFocus = () => {
    if (categoryOptions.length === 0 && !dataFetched) {
      fetchExpenseCategoryOptions();
    }
  };

  const handleCategoryChange = item => {
    setFormData(prev => ({...prev, expenseCategory: item.value}));
  };

  const DATE_RANGE_ERROR = 'For the month cannot be greater than current date';

  const isFutureDate = dateInput => {
    if (!dateInput) return false;
    const d = new Date(dateInput);
    const now = new Date();
    // Compare by day only, ignore time component
    d.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return d.getTime() > now.getTime();
  };

  // Display formatting, same convention as the leave form's formatDate()
  const formatDate = date => {
    if (!date) return '';
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Same ISO-with-noon-time convention used by the leave form, so CalendarModal
  // behaves identically across both screens.
  const formatToISOWithTime = dateInput => {
    let year, month, day;
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
    const formatted = formatToISOWithTime(date);
    setShowCalendar(false);
    setFormData(prev => ({...prev, date: formatted}));
  };

  // X++ parses this field with str2Date(value, 321). The digits 3-2-1 mean
  // year, then month, then day — NOT month/day/year. Sending MM/DD/YYYY here
  // causes str2Date to fail silently and the date never gets stored.
  const formatDateForSubmit = date => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // YYYY-MM-DD, matches the 321 sequence
  };

  const handleAction = async (actionType, data = {}) => {
    try {
      let response;

      if (isEditMode) {
        // Update path: only the two fields the user can actually change —
        // Purpose is fixed at 'Medical' for the record's lifetime and is
        // deliberately NOT resent here.
        const expenseReportFields = [
          {
            FieldName: EXPENSE_CATEGORY_FIELD,
            FieldValue: data.expenseCategory,
            FieldType: 'String',
          },
          {
            FieldName: EXPENSE_MONTH_FIELD,
            FieldValue: formatDateForSubmit(data.date),
            FieldType: 'Date',
          },
        ];

        response = await UpdateExpenseReport({
          expenseReportFields,
          employeeId: data.employeeId || employeeId,
          legalEntity: data.legalEntity || effectiveLegalEntity,
          expenseReportNumber: data.expenseReportNumber,
        });
      } else {
        const expenseReportFields = [
          {
            FieldName: 'Purpose',
            FieldValue: EXPENSE_PURPOSE,
            FieldType: 'String',
          },
          {
            FieldName: EXPENSE_CATEGORY_FIELD,
            FieldValue: data.expenseCategory,
            FieldType: 'String',
          },
          {
            FieldName: EXPENSE_MONTH_FIELD,
            FieldValue: formatDateForSubmit(data.date),
            FieldType: 'Date',
          },
        ];

        response = await CreateExpenseReport({
          expenseReportFields,
          employeeId: data.employeeId || employeeId,
          legalEntity: data.legalEntity || effectiveLegalEntity,
        });
      }

      const isSuccess =
        response?.IsSuccess === true ||
        response?.IsSuccess === 'true' ||
        response?.AlertType === 'Success';

      if (isSuccess) {
        const successMsg = isEditMode
          ? 'Medical expense report updated successfully'
          : 'Medical expense report created successfully';
        notifySuccess(successMsg);
        showSuccess(successMsg);

        const recId = response?.RecId || response?.recId || data.recId || '';
        const expenseReportNumber =
          response?.ExpenseReportNumber ||
          data.ExpenseReportNumber ||
          data.expenseReportNumber ||
          '';

        return {
          success: true,
          recId: recId,
          RecId: recId,
          expenseReportNum: expenseReportNumber,
          ExpenseReportNumber: expenseReportNumber,
        };
      } else {
        const errorMessage =
          response?.Message ||
          (isEditMode ? 'Error updating Record' : 'Error creating Record');
        notifyError(errorMessage);
        showError(errorMessage);
        return {success: false, message: errorMessage};
      }
    } catch (error) {
      console.error('Error in handleAction:', error);
      showError('An error occurred while processing the request.');
      return {success: false, message: 'Network or server error'};
    }
  };

  const handleSave = async actionType => {
    if (processingButton) return;

    const missingFields = [];
    if (!formData.expenseCategory) missingFields.push('Expense category');
    if (!formData.date) missingFields.push('Date');
    if (isEditMode && !formData.expenseReportNumber) {
      // Should never happen if navigation always passes headerData, but
      // fails loud rather than silently sending an update with no target.
      missingFields.push('Expense Report Number (missing from navigation)');
    }

    if (missingFields.length > 0) {
      showWarning(
        'Please fill in the following required fields:\n' +
          missingFields.join('\n'),
      );
      return;
    }
    if (isFutureDate(formData.date)) {
      showWarning(DATE_RANGE_ERROR);
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
        return; // keep button disabled / overlay up until the delayed nav fires
      }

      setProcessingButton('');
      setIsProcessing(false);
    } catch (error) {
      console.error('Error saving medical expense:', error);
      showError('Failed to save record. Please try again.');
    } finally {
      setProcessingButton('');
      setIsProcessing(false);
    }
  };

  return (
    <ActionPaneContainer
      pageTitle={isEditMode ? 'Edit expense report' : 'New expense report'}
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
                  <ActivityIndicator size="large" color="#0A66C2" />
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
              <Text style={styles.DSR_Label}>Expense category</Text>
              <Dropdown
                style={styles.DSR_Input}
                data={categoryOptions}
                labelField="label"
                valueField="value"
                placeholder="Select expense category"
                value={formData.expenseCategory}
                onFocus={handleCategoryDropdownFocus}
                onChange={handleCategoryChange}
                placeholderStyle={styles.DSR_DropdownPlaceholder}
                selectedTextStyle={styles.DSR_DropdownSelectedText}
                itemTextStyle={styles.DSR_DropdownItemText}
                activeColor="#E6F0FF"
                containerStyle={[
                  styles.DSR_DropdownContainer,
                  {
                    marginTop: Platform.OS === 'ios' ? 5 : 2,
                    zIndex: 1000,
                  },
                ]}
                itemContainerStyle={styles.DSR_DropdownItemContainer}
                maxHeight={280}
                dropdownPosition="auto"
                search
                searchPlaceholder="Search Category"
                inputSearchStyle={styles.DSR_DropdownSearchInput}
                iconStyle={styles.DSR_DropdownIcon}
                keyboardAvoiding={true}
              />

              <Text style={styles.DSR_Label}>For the month</Text>
              <TouchableOpacity
                style={styles.DSR_DateSelector}
                onPress={() => setShowCalendar(true)}>
                <View style={{flex: 1}}>
                  <Text style={styles.DSR_DateText}>
                    {formData.date ? formatDate(formData.date) : 'Select Date'}
                  </Text>
                </View>
                <Icon name="calendar" size={20} color="#0A66C2" />
              </TouchableOpacity>
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

      {showCalendar && (
        <CalendarModal
          visible={showCalendar}
          initialDate={
            formData.date && !isSentinelOrInvalidDate(formData.date)
              ? formData.date
              : today
          }
          onDateSelected={handleDateChange}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </ActionPaneContainer>
  );
};

export default MedicalExpenseManagementSaveRecord;
