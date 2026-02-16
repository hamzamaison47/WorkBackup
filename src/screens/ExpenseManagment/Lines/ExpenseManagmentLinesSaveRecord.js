/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  ScrollView,
  SafeAreaView,
  BackHandler,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {Dropdown} from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/FontAwesome';
import {translate as t} from '../../../store/utils/translate';

import {ExpenseCategoryLookup} from '../../../API/ExpenseManagment/Lines/ExpenseCategoryLookup';
import {RetrieveAllCurrency} from '../../../API/ExpenseManagment/Lines/RetrieveAllCurrency';
import {CreateExpenseLine} from '../../../API/ExpenseManagment/Lines/CreateExpenseLine';
import {UpdateExpenseLine} from '../../../API/ExpenseManagment/Lines/UpdateExpenseLine';

import AlertModal from '../../../components/Alert/AlertModal';
import CalendarModal from '../../../components/Leaves/CalendarModal';
import CustomIndicator from '../../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../../components/ActionPaneContainer';
import ConfirmationAlert from '../../../components/Alert/ConfirmationAlert';
import SaveRecordButtons, {
  BUTTON_TYPES,
} from '../../../components/Buttons/SaveRecordButtons';
import styles from '../../../styles/styles';

const ExpenseManagmentLinesSaveRecord = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);

  const userData = useSelector(state => state.user.userData);
  const {selectedLegalEntity, defaultLegalEntity} = useSelector(
    state => state.company,
  );
  const isRTL = useSelector(state => state.language.isRTL);

  const effectiveUserData = route.params?.userData || userData || {};
  const effectiveLegalEntity =
    route.params?.legalEntity ||
    selectedLegalEntity ||
    defaultLegalEntity ||
    effectiveUserData?.defaultLegalEntity ||
    '';

  const {
    mode = 'create',
    expenseData = {},
    employeeId = expenseData.employeeId || effectiveUserData?.employeeId || '',
    employeeName = expenseData.employeeName ||
      effectiveUserData?.employeeName ||
      '',
    WorkerRecId = expenseData.WorkerRecId ||
      effectiveUserData?.WorkerRecId ||
      '',
    cameFrom = 'MainDashboard',
    originalCameFrom = null,
  } = route.params || {};

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [currencyOptions, setCurrencyOptions] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [processingButton, setProcessingButton] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showCreateNewConfirm, setShowCreateNewConfirm] = useState(false);
  const [lastCreatedData, setLastCreatedData] = useState(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const createInitialFormData = () => ({
    recId: expenseData.recId || expenseData.RecId || '',
    employeeId: employeeId,
    employeeName: employeeName,
    WorkerRecId: WorkerRecId,
    legalEntity: effectiveLegalEntity,
    transactionDate: new Date().toISOString().split('T')[0] + 'T12:00:00',
    expenseCategory: '',
    transactionAmount: '',
    currency: '',
    merchant: '',
    ExpenseReportNumber: expenseData.ExpenseReportNumber || '',
    expenseTransactionNumber: expenseData.expenseTransactionNumber || '',
  });

  const [formData, setFormData] = useState(() => createInitialFormData());

  // Clear all states when component unmounts
  useEffect(() => {
    return () => {
      clearAllStates();
    };
  }, []);

  const goBack = useCallback(() => {
    clearAllStates();

    console.log(
      'Navigating back - ExpenseReportNumber:',
      expenseData.ExpenseReportNumber,
    );

    if (cameFrom === 'ExpenseManagementHeaderSaveRecord') {
      navigation.navigate('ExpenseManagmentLinesListPage', {
        expenseReportNumber: expenseData.ExpenseReportNumber,
        expenseReportRecId: expenseData.recId || expenseData.RecId,
        employeeId,
        employeeName,
        WorkerRecId,
        legalEntity: effectiveLegalEntity,
        userData: {
          employeeId,
          employeeName,
          WorkerRecId,
        },
        cameFrom: 'ExpenseManagmentListPage',
        originalCameFrom: originalCameFrom,
      });
    } else if (cameFrom === 'ExpenseManagmentLinesListPage') {
      navigation.navigate('ExpenseManagmentLinesListPage', {
        expenseReportNumber: expenseData.ExpenseReportNumber,
        expenseReportRecId: expenseData.recId || expenseData.RecId,
        employeeId,
        employeeName,
        WorkerRecId,
        legalEntity: effectiveLegalEntity,
        userData: {
          employeeId,
          employeeName,
          WorkerRecId,
        },
        cameFrom: 'ExpenseManagmentListPage',
        originalCameFrom: originalCameFrom,
      });
    } else {
      navigation.goBack();
    }
  }, [
    navigation,
    cameFrom,
    originalCameFrom,
    employeeId,
    employeeName,
    WorkerRecId,
    expenseData.ExpenseReportNumber,
    expenseData.recId,
    expenseData.RecId,
    effectiveLegalEntity,
  ]);

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

  const clearAllStates = useCallback(() => {
    setCategoryOptions([]);
    setCurrencyOptions([]);
    setDataFetched(false);
    setFormData(createInitialFormData());
    setAlertModal(false);
    setAlertMessage('');
    setProcessingButton('');
    setShowCalendar(false);
    setShowCreateNewConfirm(false);
    setLastCreatedData(null);
  }, []);

  const clearFormData = useCallback(() => {
    setFormData(prev => ({
      ...createInitialFormData(),
      ExpenseReportNumber: prev.ExpenseReportNumber,
      employeeId: prev.employeeId,
      employeeName: prev.employeeName,
      WorkerRecId: prev.WorkerRecId,
      legalEntity: prev.legalEntity,
    }));
  }, []);

  const handleCreateNewLine = () => {
    setShowCreateNewConfirm(false);

    setFormData(prev => ({
      ...createInitialFormData(),
      ExpenseReportNumber: prev.ExpenseReportNumber,
      employeeId: prev.employeeId,
      employeeName: prev.employeeName,
      WorkerRecId: prev.WorkerRecId,
      legalEntity: prev.legalEntity,
    }));
  };

  const handleNavigateBack = () => {
    setShowCreateNewConfirm(false);
    if (lastCreatedData) {
      clearAllStates();
      navigation.navigate('ExpenseManagmentLinesListPage', {
        expenseReportNumber: lastCreatedData.ExpenseReportNumber,
        expenseReportRecId: lastCreatedData.recId || lastCreatedData.RecId,
        employeeId: lastCreatedData.employeeId,
        employeeName: lastCreatedData.employeeName,
        WorkerRecId: lastCreatedData.WorkerRecId,
        legalEntity: lastCreatedData.legalEntity,
        userData: {
          employeeId: lastCreatedData.employeeId,
          employeeName: lastCreatedData.employeeName,
          WorkerRecId: lastCreatedData.WorkerRecId,
        },
        cameFrom: 'ExpenseManagmentListPage',
        originalCameFrom: originalCameFrom,
      });
    }
  };

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
        if (mode === 'create') {
          setFormData(createInitialFormData());
        } else if (mode === 'edit') {
          setFormData({
            recId: expenseData.recId || expenseData.RecId || '',
            employeeId: expenseData.employeeId || employeeId,
            employeeName: expenseData.employeeName || employeeName,
            WorkerRecId: expenseData.WorkerRecId || WorkerRecId,
            legalEntity: expenseData.legalEntity || effectiveLegalEntity,
            transactionDate:
              expenseData.transactionDate ||
              new Date().toISOString().split('T')[0] + 'T12:00:00',
            expenseCategory:
              expenseData.expenseCategory || expenseData.CostType || '',
            transactionAmount:
              expenseData.transactionAmount?.toString() ||
              expenseData.AmountCurr?.toString() ||
              '',
            currency: expenseData.currency || expenseData.ExchangeCode || '',
            merchant: expenseData.merchant || expenseData.MerchantId || '',
            ExpenseReportNumber: expenseData.ExpenseReportNumber || '',
            expenseTransactionNumber:
              expenseData.expenseTransactionNumber || '',
          });
        }

        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start();

        if (!dataFetched) {
          try {
            await Promise.all([fetchCategoryOptions(), fetchCurrencyOptions()]);
            setDataFetched(true);
          } catch (error) {
            console.error('Error fetching lookup data:', error);
          } finally {
            setIsLoading(false);
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }).start();
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
        // Minimal cleanup
      };
    }, [mode, dataFetched, expenseData]),
  );

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      setCategoryOptions([]);
      setCurrencyOptions([]);
      setDataFetched(false);
      clearFormData();

      await fetchCategoryOptions(true);
      await fetchCurrencyOptions(true);
      setDataFetched(true);
    } catch (error) {
      console.error('Error in Save Record Screen', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategoryOptions = async (forceRefresh = false) => {
    try {
      if (categoryOptions.length > 0 && !forceRefresh) {
        return;
      }

      const categories = await ExpenseCategoryLookup({
        legalEntity: effectiveLegalEntity,
      });

      const formatted = categories.map(cat => ({
        label: cat.categoryId || 'Unknown Category',
        value: cat.categoryId || '',
      }));

      setCategoryOptions(formatted);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setAlertMessage('Failed to fetch data.');
      setAlertModal(true);
    }
  };

  const fetchCurrencyOptions = async (forceRefresh = false) => {
    try {
      if (currencyOptions.length > 0 && !forceRefresh) {
        return;
      }

      const response = await RetrieveAllCurrency();

      const formatted = response.map(curr => ({
        label: curr.CurrencyCode || 'Unknown Currency',
        value: curr.CurrencyCode || '',
      }));

      setCurrencyOptions(formatted);
    } catch (error) {
      console.error('Error fetching currencies:', error);
      setAlertMessage('Failed to fetch data.');
      setAlertModal(true);
    }
  };

  const handleCategoryDropdownFocus = () => {
    if (categoryOptions.length === 0) {
      fetchCategoryOptions();
    }
  };

  const handleCurrencyDropdownFocus = () => {
    if (currencyOptions.length === 0) {
      fetchCurrencyOptions();
    }
  };

  const handleCategoryChange = item => {
    setFormData(prev => ({...prev, expenseCategory: item.value}));
  };

  const handleCurrencyChange = item => {
    setFormData(prev => ({...prev, currency: item.value}));
  };

  const formatToISOWithTime = date => {
    const baseDate = new Date(date);
    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, '0');
    const day = String(baseDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T12:00:00`;
  };

  const handleDateChange = date => {
    const formatted = formatToISOWithTime(date);
    setFormData(prev => ({
      ...prev,
      transactionDate: formatted,
    }));
  };

  const formatDate = date => {
    if (!date) return '';
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAction = async (actionType, modalMode, data = {}) => {
    try {
      const expenseLineFields = [
        {
          FieldName: 'TransDate',
          FieldValue: data.transactionDate.split('T')[0],
          FieldType: 'Date',
        },
        {
          FieldName: 'AmountCurr',
          FieldValue: String(data.transactionAmount),
          FieldType: 'Real',
        },
        {
          FieldName: 'CostType',
          FieldValue: data.expenseCategory,
          FieldType: 'String',
        },
        {
          FieldName: 'ExchangeCode',
          FieldValue: data.currency,
          FieldType: 'String',
        },
        {
          FieldName: 'ExpenseReportNumber',
          FieldValue: data.ExpenseReportNumber,
          FieldType: 'String',
        },
        {
          FieldName: 'MerchantId',
          FieldValue: data.merchant || '',
          FieldType: 'String',
        },
      ];

      let response;

      if (modalMode === 'create') {
        response = await CreateExpenseLine({
          expenseLineFields: expenseLineFields,
          employeeId: data.employeeId || employeeId,
          legalEntity: data.legalEntity || effectiveLegalEntity,
        });

        // console.log({response});
      } else {
        if (!data.expenseTransactionNumber) {
          const errorMsg =
            'Error: Expense Transaction Number is required for update.';
          console.error(errorMsg);
          setAlertMessage(errorMsg);
          setAlertModal(true);
          return {
            success: false,
            message: errorMsg,
          };
        }

        response = await UpdateExpenseLine({
          expenseLineFields: expenseLineFields,
          employeeId: data.employeeId || employeeId,
          legalEntity: data.legalEntity || effectiveLegalEntity,
          expenseTransactionNumber: data.expenseTransactionNumber,
        });
      }

      const isSuccess =
        response?.IsSuccess === true || response?.AlertType === 'Success';

      if (isSuccess) {
        const successAction = modalMode === 'create' ? 'created' : 'updated';
        const message =
          response?.Message || `Record ${successAction} successfully`;

        setAlertMessage(message);
        setAlertModal(true);

        return {
          success: true,
          recId: response.RecId || response.recId,
          RecId: response.RecId || response.recId,
          expenseLineNum: response.ExpenseLineNumber || '',
          expenseReportNum:
            response.ExpenseReportNumber || data.ExpenseReportNumber,
          lineNumber: response.LineNumber || '',
        };
      } else {
        const actionText = modalMode === 'create' ? 'Creating' : 'Updating';
        const errorMessage = response?.Message || `Error ${actionText} request`;

        setAlertMessage(errorMessage);
        setAlertModal(true);
        return {success: false, message: errorMessage};
      }
    } catch (error) {
      console.error('Error in handleAction:', error);
      setAlertMessage('An error occurred while processing the request.');
      setAlertModal(true);
      return {success: false, message: 'Network or server error'};
    }
  };

  const handleSave = async actionType => {
    if (processingButton) return;

    if (mode === 'edit' && !formData.expenseTransactionNumber) {
      setAlertMessage(
        'Error: Cannot update record. Missing transaction number.',
      );
      setAlertModal(true);
      return;
    }

    const missingFields = [];

    if (!formData.transactionDate) missingFields.push('Transaction Date');
    if (!formData.expenseCategory) missingFields.push('Expense Category');
    if (!formData.transactionAmount) missingFields.push('Transaction Amount');
    if (!formData.currency) missingFields.push('Currency');
    if (!formData.ExpenseReportNumber)
      missingFields.push('Expense Report Number');

    // Validate that amount is not 0
    const amountValue = parseFloat(formData.transactionAmount);
    if (amountValue === 0) {
      setAlertMessage(
        'Transaction amount cannot be zero. Please enter a valid amount.',
      );
      setAlertModal(true);
      return;
    }

    // Validate that amount is a positive number
    if (amountValue < 0) {
      setAlertMessage(
        'Transaction amount cannot be negative. Please enter a positive amount.',
      );
      setAlertModal(true);
      return;
    }

    // Validate that amount is a valid number
    if (isNaN(amountValue)) {
      setAlertMessage('Please enter a valid transaction amount.');
      setAlertModal(true);
      return;
    }

    if (missingFields.length > 0) {
      const message =
        'Please fill in the following required fields:\n' +
        missingFields.join('\n');
      setAlertMessage(message);
      setAlertModal(true);
      return;
    }

    setProcessingButton(actionType);
    setIsProcessing(true);

    try {
      const result = await handleAction(
        actionType,
        mode === 'edit' ? 'update' : 'create',
        formData,
      );

      if (result.success) {
        if (mode === 'create') {
          setLastCreatedData({
            ...formData,
            recId: expenseData.recId || expenseData.RecId,
            RecId: expenseData.recId || expenseData.RecId,
            ExpenseReportNumber: formData.ExpenseReportNumber,
          });
          setTimeout(() => {
            setAlertModal(false);
            setShowCreateNewConfirm(true);
          }, 1500);
        } else {
          setTimeout(() => {
            setAlertModal(false);
            clearAllStates();
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: 'ExpenseManagmentLinesListPage',
                  params: {
                    expenseReportNumber: formData.ExpenseReportNumber,
                    expenseReportRecId: formData.recId,
                    employeeId: formData.employeeId,
                    employeeName: formData.employeeName,
                    WorkerRecId: formData.WorkerRecId,
                    legalEntity: formData.legalEntity,
                    userData: {
                      employeeId: formData.employeeId,
                      employeeName: formData.employeeName,
                      WorkerRecId: formData.WorkerRecId,
                    },
                    cameFrom: 'ExpenseManagmentListPage',
                    originalCameFrom: originalCameFrom,
                  },
                },
              ],
            });
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      setAlertMessage('Failed to save record. Please try again.');
      setAlertModal(true);
    } finally {
      setProcessingButton('');
      setIsProcessing(false);
    }
  };

  return (
    <ActionPaneContainer
      pageTitle={
        mode === 'edit' ? 'Update Expense Line' : 'Create Expense Line'
      }
      isBackButton={true}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={!isKeyboardVisible}
      onBackPress={goBack}
      onRefresh={handleRefresh}>
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <Animated.View style={{flex: 1, opacity: fadeAnim}}>
          <SafeAreaView style={styles.DSR_SafeArea}>
            {/* <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.DSR_ContentWrapper}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}> */}
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
              <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
                Transaction Date *
              </Text>
              <TouchableOpacity
                style={styles.DSR_DateSelector}
                onPress={() => setShowCalendar(true)}>
                <View style={{flex: 1}}>
                  <Text style={styles.DSR_DateText}>
                    {formData.transactionDate
                      ? formatDate(formData.transactionDate)
                      : 'Select Transaction Date'}
                  </Text>
                </View>
                <Icon name="calendar" size={20} color="#0A66C2" />
              </TouchableOpacity>

              <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
                Expense Category *
              </Text>
              <Dropdown
                style={styles.DSR_Input}
                data={categoryOptions}
                labelField="label"
                valueField="value"
                placeholder="Select Expense Category"
                value={formData.expenseCategory}
                onFocus={handleCategoryDropdownFocus}
                onChange={handleCategoryChange}
                placeholderStyle={styles.DSR_DropdownPlaceholder}
                selectedTextStyle={styles.DSR_DropdownSelectedText}
                itemTextStyle={styles.DSR_DropdownItemText}
                activeColor="#E6F0FF"
                containerStyle={[
                  styles.DSR_DropdownContainer,
                  {marginTop: Platform.OS === 'ios' ? 5 : 2, zIndex: 1000},
                ]}
                itemContainerStyle={styles.DSR_DropdownItemContainer}
                maxHeight={280}
                dropdownPosition="auto"
                search
                searchPlaceholder="Search Expense Category"
                inputSearchStyle={styles.DSR_DropdownSearchInput}
                iconStyle={styles.DSR_DropdownIcon}
                keyboardAvoiding={true}
              />

              <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
                Transaction Amount *
              </Text>
              <TextInput
                style={styles.DSR_Input}
                value={formData.transactionAmount}
                onChangeText={value =>
                  handleInputChange('transactionAmount', value)
                }
                keyboardType="numeric"
                placeholder="Enter transaction amount"
                placeholderTextColor="#888"
              />

              <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
                Currency *
              </Text>
              <Dropdown
                style={styles.DSR_Input}
                data={currencyOptions}
                labelField="label"
                valueField="value"
                placeholder="Select Currency"
                value={formData.currency}
                onFocus={handleCurrencyDropdownFocus}
                onChange={handleCurrencyChange}
                placeholderStyle={styles.DSR_DropdownPlaceholder}
                selectedTextStyle={styles.DSR_DropdownSelectedText}
                itemTextStyle={styles.DSR_DropdownItemText}
                activeColor="#E6F0FF"
                containerStyle={[
                  styles.DSR_DropdownContainer,
                  {marginTop: Platform.OS === 'ios' ? 5 : 2, zIndex: 999},
                ]}
                itemContainerStyle={styles.DSR_DropdownItemContainer}
                maxHeight={280}
                dropdownPosition="auto"
                search
                searchPlaceholder="Search Currency"
                inputSearchStyle={styles.DSR_DropdownSearchInput}
                iconStyle={styles.DSR_DropdownIcon}
                keyboardAvoiding={true}
              />
            </ScrollView>

            <SaveRecordButtons
              mode={mode}
              processingButton={processingButton}
              onSave={handleSave}
              onCancel={goBack}
              isDisabled={
                processingButton === 'create' || processingButton === 'submit'
              }
              showButtons={[BUTTON_TYPES.CREATE, BUTTON_TYPES.CANCEL]}
            />
            {/* </KeyboardAvoidingView> */}

            <CalendarModal
              visible={showCalendar}
              current={formData.transactionDate}
              onDateSelected={handleDateChange}
              onClose={() => setShowCalendar(false)}
            />

            <AlertModal
              visible={alertModal}
              heading="Alert"
              text={alertMessage}
              onPress={() => setAlertModal(false)}
            />

            <ConfirmationAlert
              visible={showCreateNewConfirm}
              heading="Create Another Expense Line?"
              text="Do you want to create another expense line for this report?"
              primaryButtonText="Create New"
              secondaryButtonText="Cancel"
              onPrimaryPress={handleCreateNewLine}
              onSecondaryPress={handleNavigateBack}
              type="info"
            />
          </SafeAreaView>
        </Animated.View>
      )}
    </ActionPaneContainer>
  );
};

export default ExpenseManagmentLinesSaveRecord;
