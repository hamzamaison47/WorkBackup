/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView,
  Pressable,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {Dropdown} from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/FontAwesome';

// import {RetrieveAdvanceType} from '../../API/Advance/RetrieveAdvanceType';
import {PayGroupPayperiodByEmployeeId} from '../../API/PayGroupPayPeriod/PayGroupPayperiodByEmployeeId';
import {CreateAdvanceRequest} from '../../API/EmployeeAdvanceRequest/CreateAdvanceRequest';
import {SubmitAdvanceRequest} from '../../API/EmployeeAdvanceRequest/SubmitAdvanceRequest';
import {UpdateAdvanceRequest} from '../../API/EmployeeAdvanceRequest/UpdateAdvanceRequest';

import AlertModal from '../../components/Alert/AlertModal';
import CalendarModal from '../../components/Leaves/CalendarModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import styles from '../../styles/styles';

const GenericAdvanceSaveScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();

  const {userData} = useSelector(state => state.user);

  // Navigation params with safe defaults
  const {
    mode = 'create',
    advanceData = {},
    employeeId = advanceData.employeeId || userData?.employeeId || '',
    employeeName = advanceData.employeeName || userData?.employeeName || '',
    WorkerRecId = advanceData.WorkerRecId || userData?.WorkerRecId || '',
    cameFrom = 'MainDashboard',
    advanceType = 'Loan',
    screenName = 'Loan',
  } = route.params || {};

  // State declarations
  const [advanceCodes, setAdvanceCodes] = useState([]);
  const [advanceCodeDropDown, setAdvanceCodeDropDown] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentDateField, setCurrentDateField] = useState(null);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [processingButton, setProcessingButton] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Validation states
  const [isAdvanceAmountValid, setIsAdvanceAmountValid] = useState(true);
  const [isAmountExceeds, setIsAmountExceeds] = useState(false);
  const [maxAdvanceAmount, setMaxAdvanceAmount] = useState(0);
  const [isAdvanceTypeCodeValid, setIsAdvanceTypeCodeValid] = useState(true);
  const [isPaymentDateValid, setIsPaymentDateValid] = useState(true);
  const [isRecoveryDateValid, setIsRecoveryDateValid] = useState(true);
  const [isRecoveryAmountValid, setIsRecoveryAmountValid] = useState(true);
  const [isRecoveriesValid, setIsRecoveriesValid] = useState(true);
  const [maxRecoveries, setMaxRecoveries] = useState(0);
  const [isFieldsDisabled, setIsFieldsDisabled] = useState(false);
  const [isAmountFieldsDisabled, setIsAmountFieldsDisabled] = useState(false);

  // Create initial form data function
  const createInitialFormData = () => ({
    RecId:
      !advanceData.RecId || advanceData.RecId === '0' ? '' : advanceData.RecId,
    employeeId: employeeId,
    employeeName: employeeName,
    WorkerRecId: WorkerRecId,
    AdvanceTypeCode: '',
    AdvanceAmount: '0',
    RequestedPaymentDate: '',
    RecoveryStartDate: '',
    RequestedInstallmentAmount: '',
    RequestedInstallments: '',
    AdvanceDescription: '',
  });

  // Form state
  const [formData, setFormData] = useState(() => createInitialFormData());

  const goBack = useCallback(() => {
    if (cameFrom === 'MainDashboard') {
      navigation.navigate('MainDashboard');
    } else if (cameFrom.includes('ListPage')) {
      navigation.navigate('GenericAdvanceScreen', {
        employeeId: employeeId,
        employeeName: employeeName,
        WorkerRecId: WorkerRecId,
        cameFrom: 'GenericAdvanceSaveScreen',
        advanceType: advanceType,
        screenName: screenName,
      });
    } else {
      navigation.goBack();
    }
  }, [
    cameFrom,
    employeeId,
    employeeName,
    WorkerRecId,
    navigation,
    advanceType,
    screenName,
  ]);

  // Function to clear form data
  const clearFormData = useCallback(() => {
    const clearedForm = createInitialFormData();
    setFormData(clearedForm);
  }, []);

  // Reset form data when screen comes into focus and mode changes
  useFocusEffect(
    React.useCallback(() => {
      if (mode === 'create') {
        const freshFormData = createInitialFormData();
        setFormData(freshFormData);
      } else if (mode === 'edit' && advanceData?.RecId) {
        const editFormData = {
          ...createInitialFormData(),
          ...advanceData,
          employeeId: advanceData.employeeId || employeeId,
          employeeName: advanceData.employeeName || employeeName,
          WorkerRecId: advanceData.WorkerRecId || WorkerRecId,
          AdvanceAmount: advanceData.AdvanceAmount
            ? advanceData.AdvanceAmount.toString()
            : '0',
          RequestedInstallmentAmount: advanceData.RequestedInstallmentAmount
            ? advanceData.RequestedInstallmentAmount.toString()
            : '',
          RequestedInstallments: advanceData.RequestedInstallments
            ? advanceData.RequestedInstallments.toString()
            : '',
        };

        setFormData(editFormData);
      }

      // Fetch initial data
      fetchInitialData();
    }, [mode, advanceData?.RecId, employeeId, employeeName, WorkerRecId]),
  );

  const fetchInitialData = async () => {
    try {
      // Fetch advance codes
      // const advanceCode = await RetrieveAdvanceType();
      // const filteredAdvanceType = advanceCode.filter(
      //   type => type.AdvanceType === 0,
      // );
      // const dropdownData = Array.from(
      //   new Set(filteredAdvanceType.map(item => item.AdvanceTypeCode)),
      // ).map(code => ({
      //   label: code,
      //   value: code,
      // }));

      // setAdvanceCodeDropDown(dropdownData);
      // setAdvanceCodes(filteredAdvanceType);

      // Fetch PayGroupPayPeriod data if EmployeeId is available
      if (employeeId) {
        // const response = await getPayGroupPayPeriod(employeeId);
        const response = await PayGroupPayperiodByEmployeeId({
          employeeId: userData.employeeId,
        });
        const filteredPayGroupPayPeriod = response.filter(
          a => a.PayPeriodStatus === 0,
        );

        if (filteredPayGroupPayPeriod && filteredPayGroupPayPeriod.length > 0) {
          if (mode === 'create') {
            setFormData(prev => ({
              ...prev,
              RecoveryStartDate: formatToISOWithTime(
                filteredPayGroupPayPeriod[0]?.EndDate,
              ),
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setAlertMessage('Failed to fetch initial data.');
      setAlertModal(true);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      clearFormData();
      await fetchInitialData();
    } catch (error) {
      console.error('Error in Save Record Screen', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Format date functions
  const formatDate = date =>
    date
      ? new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
      : '';

  const formatToISOWithTime = date => {
    const baseDate = new Date(date);
    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, '0');
    const day = String(baseDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T12:00:00`;
  };

  // Handle date changes
  const handleDateChange = async (date, fieldName) => {
    const formatted = formatToISOWithTime(date);

    setFormData(prev => ({
      ...prev,
      [fieldName]: formatted,
    }));

    setShowCalendar(false);

    // Validate dates
    if (fieldName === 'RequestedPaymentDate') {
      validatePaymentDate(formatted);
    } else if (fieldName === 'RecoveryStartDate') {
      validateRecoveryStartDate(formatted);
    }
  };

  // Validation functions
  const validatePaymentDate = date => {
    const selectedDate = new Date(date);
    const recoveryStartDateObj = new Date(formData.RecoveryStartDate);

    if (formData.RecoveryStartDate && selectedDate > recoveryStartDateObj) {
      setIsPaymentDateValid(false);
    } else {
      setIsPaymentDateValid(true);
    }
  };

  const validateRecoveryStartDate = date => {
    const selectedDate = new Date(date);
    const paymentDateObj = new Date(formData.RequestedPaymentDate);

    if (formData.RequestedPaymentDate && selectedDate < paymentDateObj) {
      setIsRecoveryDateValid(false);
    } else {
      setIsRecoveryDateValid(true);
    }
  };

  // Handle Advance Amount Change
  const handleAdvanceAmountChange = value => {
    const cleanedValue = value.replace(/[^0-9.]/g, '');
    const formattedValue = new Intl.NumberFormat().format(cleanedValue);
    handleInputChange('AdvanceAmount', formattedValue);
    setIsAdvanceAmountValid(true);
    setIsAmountExceeds(false);
  };

  // Validate Advance Amount
  const validateAdvanceAmount = () => {
    const advanceAmountStr = formData.AdvanceAmount || '0';
    const advanceAmountNum = Number(advanceAmountStr.replace(/,/g, ''));

    if (!advanceAmountNum || advanceAmountNum === 0) {
      setIsAdvanceAmountValid(false);
    } else {
      setIsAdvanceAmountValid(true);
    }
  };

  // Check if the Advance Amount exceeds the limit
  const checkAdvanceAmountLimit = () => {
    const advanceTypeCode = formData.AdvanceTypeCode;
    const advanceAmountStr = formData.AdvanceAmount || '0';
    const advanceAmountNum = Number(advanceAmountStr.replace(/,/g, ''));

    const filteredAdvances = advanceCodes.filter(
      a => a.AdvanceTypeCode === advanceTypeCode,
    );

    if (filteredAdvances.length > 0) {
      const maxAdvanceAmounts = filteredAdvances[0]?.MaxAdanceAmount || 0;
      if (advanceAmountNum > maxAdvanceAmounts && maxAdvanceAmounts !== 0) {
        setIsAmountExceeds(true);
        setMaxAdvanceAmount(maxAdvanceAmounts);
      } else {
        setIsAmountExceeds(false);
      }
    }
  };

  // Handle Advance Type Code Change
  const handleAdvanceTypeCodeChange = async item => {
    const newAdvanceTypeCode = item.value;

    // Reset form but keep employee info and selected type code
    const resetForm = {
      ...createInitialFormData(),
      employeeId: formData.employeeId,
      employeeName: formData.employeeName,
      WorkerRecId: formData.WorkerRecId,
      AdvanceTypeCode: newAdvanceTypeCode,
    };

    setFormData(resetForm);
    setIsAdvanceTypeCodeValid(true);

    // Fetch recoveries for the new advance type
    await fetchRecoveries(newAdvanceTypeCode);
  };

  // Handle Recovery Amount Change
  const handleRecoveryAmountChange = value => {
    const cleanedValue = value.replace(/[^0-9.]/g, '');
    const formattedValue = new Intl.NumberFormat().format(cleanedValue);

    setFormData(prev => ({
      ...prev,
      RequestedInstallmentAmount: formattedValue,
      RequestedInstallments:
        formattedValue !== '' && formattedValue !== '0'
          ? ''
          : prev.RequestedInstallments,
    }));

    validateRecoveryAmount(formattedValue);

    if (formattedValue !== '' && formattedValue !== '0') {
      setIsFieldsDisabled(true);
    } else {
      setIsFieldsDisabled(false);
    }
  };

  // Validate Recovery Amount
  const validateRecoveryAmount = value => {
    const advanceAmountStr = formData.AdvanceAmount || '0';
    const advanceAmountNum = Number(advanceAmountStr.replace(/,/g, ''));
    const recoveryAmountNum = Number(value.replace(/,/g, ''));

    if (recoveryAmountNum > advanceAmountNum) {
      setIsRecoveryAmountValid(false);
    } else {
      setIsRecoveryAmountValid(true);
    }
  };

  // Handle Recoveries Change
  const handleRecoveriesChange = value => {
    const cleanedValue = value.replace(/[^0-9]/g, '');

    setFormData(prev => ({
      ...prev,
      RequestedInstallments: cleanedValue,
      RequestedInstallmentAmount:
        cleanedValue !== '' ? '' : prev.RequestedInstallmentAmount,
    }));

    validateRecoveries(cleanedValue);

    if (cleanedValue !== '') {
      setIsAmountFieldsDisabled(true);
    } else {
      setIsAmountFieldsDisabled(false);
    }
  };

  // Validate Recoveries
  const validateRecoveries = value => {
    const recoveriesNum = Number(value);
    if (recoveriesNum > maxRecoveries) {
      setIsRecoveriesValid(false);
    } else {
      setIsRecoveriesValid(true);
    }
  };

  // Fetch recoveries based on the advance type code
  const fetchRecoveries = async (
    advanceTypeCode = formData.AdvanceTypeCode,
  ) => {
    try {
      const filteredAdvances = advanceCodes.filter(
        a => a.AdvanceTypeCode === advanceTypeCode,
      );

      if (filteredAdvances.length > 0) {
        const maxRecoverie = filteredAdvances[0]?.Recoveries || 0;
        setMaxRecoveries(maxRecoverie);

        // Set default values based on recoveries
        if (maxRecoverie > 0) {
          setFormData(prev => ({
            ...prev,
            RequestedInstallments: maxRecoverie.toString(),
            RequestedInstallmentAmount: '',
          }));
          setIsAmountFieldsDisabled(true);
        } else {
          setFormData(prev => ({
            ...prev,
            RequestedInstallments: '',
            RequestedInstallmentAmount: '',
          }));
          setIsFieldsDisabled(false);
          setIsAmountFieldsDisabled(false);
        }
      }
    } catch (error) {
      console.error('Error fetching recoveries:', error);
    }
  };

  // Main action handler
  const handleAction = async (actionType, modalMode, data = {}) => {
    try {
      const formattedRequestDate = `${
        new Date().toISOString().split('T')[0]
      }T12:00:00`;

      const advanceRequestData = {
        AdvanceTypeCode: data.AdvanceTypeCode,
        AdvanceAmount: data.AdvanceAmount.toString().replace(/,/g, ''),
        RequestedPaymentDate: data.RequestedPaymentDate,
        RecoveryStartDate: data.RecoveryStartDate,
        RequestedInstallmentAmount: data.RequestedInstallmentAmount
          ? data.RequestedInstallmentAmount.toString().replace(/,/g, '')
          : '0',
        RequestedInstallments: data.RequestedInstallments || '0',
        AdvanceDescription: data.AdvanceDescription,
        EmployeeId: data.employeeId,
        RecId: data.RecId === '' ? '0' : data.RecId,
        RequestDate: formattedRequestDate,
      };

      if (
        !advanceRequestData.AdvanceTypeCode ||
        !advanceRequestData.RequestedPaymentDate
      ) {
        setAlertMessage('Advance Type Code and Payment Date are required.');
        setAlertModal(true);
        return false;
      }

      let response;
      if (modalMode === 'create') {
        response = await CreateAdvanceRequest({
          advanceData: advanceRequestData,
        });
        if (actionType === 'submit') {
          await SubmitAdvanceRequest({
            recId: response.RecId,
          });
        }
      } else {
        response = await UpdateAdvanceRequest({
          advanceData: advanceRequestData,
        });
        if (actionType === 'submit') {
          await SubmitAdvanceRequest({
            recId: response.RecId,
          });
        }
      }

      const isSuccess =
        response.IsSuccess === true || response.IsSuccess === 'true';

      if (isSuccess) {
        const actionText = modalMode === 'create' ? 'Created' : 'Updated';
        const submitText = actionType === 'submit' ? ' and Submitted' : '';
        setAlertMessage(
          `${data.AdvanceTypeCode} is ${actionText}${submitText} Successfully`,
        );
        setAlertModal(true);
        return {success: true, recId: response.RecId};
      } else {
        const errorMessage = response.Message || 'Operation Failed';
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

  // Validate all fields
  const validateFields = () => {
    let isValid = true;
    const missingFields = [];

    // Validate Advance Type Code
    if (!formData.AdvanceTypeCode) {
      setIsAdvanceTypeCodeValid(false);
      missingFields.push('Advance Type Code');
      isValid = false;
    } else {
      setIsAdvanceTypeCodeValid(true);
    }

    // Validate Advance Amount
    const advanceAmountStr = formData.AdvanceAmount || '0';
    const advanceAmountNum = Number(advanceAmountStr.replace(/,/g, ''));
    if (!advanceAmountNum || advanceAmountNum === 0) {
      setIsAdvanceAmountValid(false);
      missingFields.push('Advance Amount');
      isValid = false;
    } else {
      setIsAdvanceAmountValid(true);
    }

    // Validate Payment Date
    if (!formData.RequestedPaymentDate) {
      setIsPaymentDateValid(false);
      missingFields.push('Payment Date');
      isValid = false;
    } else {
      setIsPaymentDateValid(true);
    }

    if (missingFields.length > 0) {
      const message =
        'Please fill in the following required fields:\n' +
        missingFields.join('\n');
      setAlertMessage(message);
      setAlertModal(true);
    }

    return isValid;
  };

  const handleSave = async actionType => {
    if (processingButton) return;

    if (!validateFields()) {
      return;
    }

    // Check for validation errors
    if (
      isAmountExceeds ||
      !isRecoveryAmountValid ||
      !isRecoveriesValid ||
      !isPaymentDateValid ||
      !isRecoveryDateValid
    ) {
      setAlertMessage('Please fix the validation errors before proceeding.');
      setAlertModal(true);
      return;
    }

    setProcessingButton(actionType);

    try {
      const result = await handleAction(
        actionType,
        mode === 'edit' ? 'update' : 'create',
        formData,
      );

      if (result.success) {
        setTimeout(() => {
          setAlertModal(false);
          clearFormData();

          // Navigate to list page after successful create/update
          navigation.navigate('GenericAdvanceScreen', {
            employeeId: formData.employeeId,
            employeeName: formData.employeeName,
            WorkerRecId: formData.WorkerRecId,
            highlightRecId: result.recId,
            cameFrom: mode === 'create' ? 'CreateSuccess' : 'UpdateSuccess',
            advanceType: advanceType,
            screenName: screenName,
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving advance request:', error);
      setAlertMessage('Failed to save advance request. Please try again.');
      setAlertModal(true);
    } finally {
      setProcessingButton('');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <ActionPaneContainer
      pageTitle={
        mode === 'edit' ? `Edit ${screenName}` : `Create ${screenName}`
      }
      isBackButton={true}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      onBackPress={goBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={{}}>
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <SafeAreaView style={styles.LReqSR_SafeArea}>
          <KeyboardAvoidingView
            behavior="padding"
            style={styles.LReqSR_ContentWrapper}>
            <ScrollView contentContainerStyle={styles.LReqSR_FormContainer}>
              <Text style={styles.LReqSR_Label}>Employee Name</Text>
              <Text style={[styles.LReqSR_Input, styles.LReqSR_Disabled]}>
                {formData.employeeName}
              </Text>

              <Text style={styles.LReqSR_Label}>Request Date</Text>
              <Text style={[styles.LReqSR_Input, styles.LReqSR_Disabled]}>
                {formatDate(today)}
              </Text>

              <Text style={styles.LReqSR_Label}>Advance Amount *</Text>
              <TextInput
                style={[
                  styles.LReqSR_Input,
                  !isAdvanceAmountValid && {borderColor: 'red'},
                  !formData.AdvanceTypeCode && styles.LReqSR_Disabled,
                ]}
                value={formData.AdvanceAmount}
                onChangeText={handleAdvanceAmountChange}
                onBlur={() => {
                  validateAdvanceAmount();
                  checkAdvanceAmountLimit();
                }}
                keyboardType="numeric"
                placeholder="Enter advance amount"
                editable={!!formData.AdvanceTypeCode}
              />
              {!isAdvanceAmountValid && (
                <Text style={{color: 'red', fontSize: 12, marginTop: 5}}>
                  Advance Amount is required
                </Text>
              )}
              {isAmountExceeds && maxAdvanceAmount > 0 && (
                <Text style={{color: 'red', fontSize: 12, marginTop: 5}}>
                  Advance Amount cannot exceed{' '}
                  {Number(maxAdvanceAmount).toLocaleString()}
                </Text>
              )}

              <Text style={styles.LReqSR_Label}>Advance Type Code *</Text>
              <Dropdown
                style={[
                  styles.LReqSR_Input,
                  !isAdvanceTypeCodeValid && {borderColor: 'red'},
                ]}
                data={advanceCodeDropDown}
                labelField="label"
                valueField="value"
                placeholder="Select Advance Type Code"
                value={formData.AdvanceTypeCode}
                onChange={handleAdvanceTypeCodeChange}
                placeholderStyle={{color: '#444'}}
                selectedTextStyle={{color: '#444'}}
                itemTextStyle={{color: '#444'}}
                search
                searchPlaceholder="Search Advance Type Code..."
              />
              {!isAdvanceTypeCodeValid && (
                <Text style={{color: 'red', fontSize: 12, marginTop: 5}}>
                  Advance Type Code is required
                </Text>
              )}

              <Text style={styles.LReqSR_Label}>Payment Date *</Text>
              <TouchableOpacity
                style={[
                  styles.LReqSR_DateSelector,
                  !isPaymentDateValid && {borderColor: 'red'},
                ]}
                onPress={() => {
                  setCurrentDateField('RequestedPaymentDate');
                  setShowCalendar(true);
                }}>
                <View style={{flex: 1}}>
                  <Text style={styles.LReqSR_DateText}>
                    {formData.RequestedPaymentDate
                      ? formatDate(formData.RequestedPaymentDate)
                      : 'Select Payment Date'}
                  </Text>
                </View>
                <Icon name="calendar" size={20} color="#0A66C2" />
              </TouchableOpacity>
              {!isPaymentDateValid && (
                <Text style={{color: 'red', fontSize: 12, marginTop: 5}}>
                  Payment Date is required
                </Text>
              )}

              <Text style={styles.LReqSR_Label}>Recovery Start Date</Text>
              <TouchableOpacity
                style={[
                  styles.LReqSR_DateSelector,
                  !isRecoveryDateValid && {borderColor: 'red'},
                ]}
                onPress={() => {
                  setCurrentDateField('RecoveryStartDate');
                  setShowCalendar(true);
                }}>
                <View style={{flex: 1}}>
                  <Text style={styles.LReqSR_DateText}>
                    {formData.RecoveryStartDate
                      ? formatDate(formData.RecoveryStartDate)
                      : 'Select Recovery Start Date'}
                  </Text>
                </View>
                <Icon name="calendar" size={20} color="#0A66C2" />
              </TouchableOpacity>
              {!isRecoveryDateValid && (
                <Text style={{color: 'red', fontSize: 12, marginTop: 5}}>
                  Recovery Start Date cannot be before Payment Date
                </Text>
              )}

              <Text style={styles.LReqSR_Label}>Recovery Amount</Text>
              <TextInput
                style={[
                  styles.LReqSR_Input,
                  isAmountFieldsDisabled && styles.LReqSR_Disabled,
                  !isRecoveryAmountValid && {borderColor: 'red'},
                ]}
                value={formData.RequestedInstallmentAmount}
                onChangeText={handleRecoveryAmountChange}
                keyboardType="numeric"
                placeholder="Enter recovery amount"
                editable={!isAmountFieldsDisabled}
              />
              {!isRecoveryAmountValid && (
                <Text style={{color: 'red', fontSize: 12, marginTop: 5}}>
                  Recovery Amount cannot exceed Advance Amount
                </Text>
              )}

              <Text style={styles.LReqSR_Label}>Recoveries</Text>
              <TextInput
                style={[
                  styles.LReqSR_Input,
                  isFieldsDisabled && styles.LReqSR_Disabled,
                  !isRecoveriesValid && {borderColor: 'red'},
                ]}
                value={formData.RequestedInstallments}
                onChangeText={handleRecoveriesChange}
                keyboardType="numeric"
                placeholder="Enter number of recoveries"
                editable={!isFieldsDisabled}
              />
              {!isRecoveriesValid && (
                <Text style={{color: 'red', fontSize: 12, marginTop: 5}}>
                  Recoveries cannot exceed {maxRecoveries}
                </Text>
              )}

              <Text style={styles.LReqSR_Label}>Advance Description</Text>
              <TextInput
                style={[styles.LReqSR_Input, styles.LReqSR_TextArea]}
                value={formData.AdvanceDescription}
                onChangeText={value =>
                  handleInputChange('AdvanceDescription', value)
                }
                placeholder="Enter advance description"
                multiline
                numberOfLines={4}
              />
            </ScrollView>

            <View style={styles.LReqSR_Footer}>
              <Pressable
                style={({pressed}) => [
                  styles.LReqSR_Button,
                  styles.LReqSR_SubmitButton,
                  pressed && styles.LReqSR_pressedSubmitButton,
                  (processingButton === 'save' ||
                    processingButton === 'submit') &&
                    styles.LReqSR_DisabledButton,
                ]}
                onPress={() => handleSave('submit')}
                disabled={
                  processingButton === 'save' || processingButton === 'submit'
                }>
                {({pressed}) => (
                  <Text
                    style={[
                      styles.LReqSR_SubmitButtonText,
                      pressed && styles.LReqSR_pressedText,
                    ]}>
                    {processingButton === 'submit'
                      ? 'Processing...'
                      : mode === 'edit'
                      ? 'Update & Submit'
                      : 'Create & Submit'}
                  </Text>
                )}
              </Pressable>
            </View>
          </KeyboardAvoidingView>

          <CalendarModal
            visible={showCalendar}
            current={
              currentDateField === 'RequestedPaymentDate'
                ? formData.RequestedPaymentDate
                : formData.RecoveryStartDate
            }
            onDateSelected={date => handleDateChange(date, currentDateField)}
            onClose={() => setShowCalendar(false)}
          />

          <AlertModal
            visible={alertModal}
            heading="Alert"
            text={alertMessage}
            onPress={() => {
              setAlertModal(false);
            }}
          />
        </SafeAreaView>
      )}
    </ActionPaneContainer>
  );
};

export default GenericAdvanceSaveScreen;
