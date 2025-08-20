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

// import {
//   fetchEntitlementCodes,
//   fetchEntitlementBalance,
// } from '../../Controller/entitlementApiService';
// import {createEntitlementRequest} from '../../API/Entitlement/CreateEntitlementRequest';
// import {SubmitEntitlementRequest} from '../../API/Entitlement/SubmitEntitlementRequest';
// import {UpdateEntitlementRequest} from '../../API/Entitlement/UpdateEntitlementRequest';

import {AlertModal} from '../../components/Alert/AlertModal';
import CalendarModal from '../../components/Leaves/CalendarModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import {styles} from '../../styles/styles';

const GenericAdvanceSaveScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();

  const {userData} = useSelector(state => state.user);

  // Navigation params with safe defaults
  const {
    mode = 'create',
    entitlementData = {},
    employeeId = entitlementData.employeeId || userData?.employeeId || '',
    employeeName = entitlementData.employeeName || userData?.employeeName || '',
    WorkerRecId = entitlementData.WorkerRecId || userData?.WorkerRecId || '',
    cameFrom = 'MainDashboard',
  } = route.params || {};

  // State declarations
  const [EntitlementCodesForEmployee, setEntitlementCodesForEmployee] =
    useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMode, setCalendarMode] = useState('startDate'); // 'startDate' or 'endDate'
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [processingButton, setProcessingButton] = useState(''); // Track which button is processing
  const [isLoading, setIsLoading] = useState(false);

  // Create initial form data function
  const createInitialFormData = () => ({
    recId:
      !entitlementData.recId || entitlementData.recId === '0'
        ? ''
        : entitlementData.recId,
    employeeId: employeeId,
    employeeName: employeeName,
    WorkerRecId: WorkerRecId,
    entitlementCode: '',
    entitlementType: '',
    entitlementAmount: '0.00',
    entitlementStartDate: '',
    entitlementEndDate: '',
    balance: '0.00',
    description: '',
    currency: 'USD', // Default currency
  });

  // Form state - Initialize by calling the function
  const [formData, setFormData] = useState(() => createInitialFormData());

  const goBack = useCallback(() => {
    if (cameFrom === 'MainDashboard') {
      navigation.navigate('MainDashboard');
    } else if (cameFrom === 'EntitlementListPage') {
      navigation.navigate('EntitlementListPage', {
        employeeId: employeeId,
        employeeName: employeeName,
        WorkerRecId: WorkerRecId,
        cameFrom: 'EntitlementSaveRecord',
      });
    } else {
      navigation.goBack();
    }
  }, [cameFrom, employeeId, employeeName, WorkerRecId, navigation]);

  // Function to clear form data
  const clearFormData = useCallback(() => {
    const clearedForm = createInitialFormData();
    setFormData(clearedForm);
  }, []);

  // Reset form data when screen comes into focus and mode changes
  //   useFocusEffect(
  //     React.useCallback(() => {
  //       if (mode === 'create') {
  //         // Always reset form data for create mode
  //         const freshFormData = createInitialFormData();
  //         setFormData(freshFormData);
  //       } else if (mode === 'edit' && entitlementData?.recId) {
  //         const editFormData = {
  //           ...createInitialFormData(),
  //           ...entitlementData,
  //           employeeId: entitlementData.employeeId || employeeId,
  //           employeeName: entitlementData.employeeName || employeeName,
  //           WorkerRecId: entitlementData.WorkerRecId || WorkerRecId,
  //         };

  //         console.log('Setting edit form data:', editFormData);
  //         setFormData(editFormData);

  //         // Fetch entitlement codes first, then balance
  //         fetchEntitlementCodesForEmployee().then(() => {
  //           // Fetch balance for the existing record if needed
  //           if (
  //             (entitlementData?.employeeId || employeeId) &&
  //             entitlementData?.entitlementCode
  //           ) {
  //             fetchEntitlementBalance(
  //               entitlementData?.employeeId || employeeId,
  //               entitlementData?.entitlementCode,
  //             )
  //               .then(balance => {
  //                 setFormData(prev => ({
  //                   ...prev,
  //                   balance: balance || '0.00',
  //                 }));
  //               })
  //               .catch(error => {
  //                 console.error('Error fetching balance for edit mode:', error);
  //                 setFormData(prev => ({
  //                   ...prev,
  //                   balance: '0.00',
  //                 }));
  //               });
  //           }
  //         });
  //       }
  //     }, [mode, entitlementData?.recId, employeeId, employeeName, WorkerRecId]),
  //   );

  const handleRefresh = async () => {
    setIsLoading(true);

    try {
      clearFormData();

      //   const codes = await fetchEntitlementCodes(formData.employeeId);
      //   setEntitlementCodesForEmployee(codes);
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

  const entitlementTypeOptions = [
    {label: 'Annual', value: 'Annual'},
    {label: 'Monthly', value: 'Monthly'},
    {label: 'One-time', value: 'One-time'},
    {label: 'Quarterly', value: 'Quarterly'},
  ];

  const currencyOptions = [
    {label: 'USD', value: 'USD'},
    {label: 'EUR', value: 'EUR'},
    {label: 'GBP', value: 'GBP'},
    {label: 'PKR', value: 'PKR'},
  ];

  const formatToISOWithTime = date => {
    const baseDate = new Date(date);
    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, '0');
    const day = String(baseDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T12:00:00`;
  };

  const handleDateChange = async (date, dateType) => {
    const formatted = formatToISOWithTime(date);

    if (dateType === 'startDate') {
      setFormData(prev => ({
        ...prev,
        entitlementStartDate: formatted,
      }));
    } else if (dateType === 'endDate') {
      setFormData(prev => ({
        ...prev,
        entitlementEndDate: formatted,
      }));
    }

    // Fetch balance when start date changes
    if (
      dateType === 'startDate' &&
      formData.employeeId &&
      formData.entitlementCode
    ) {
      try {
        // const balanceData = await fetchEntitlementBalance(
        //   formData.employeeId,
        //   formData.entitlementCode,
        // );
        // setFormData(prev => ({
        //   ...prev,
        //   balance: balanceData || '0.00',
        // }));
      } catch (error) {
        console.error('Error fetching entitlement balance:', error);
        setFormData(prev => ({
          ...prev,
          balance: '0.00',
        }));
      }
    }
  };

  const handleEntitlementCodeChange = async item => {
    const newEntitlementCode = item.value;

    const resetForm = {
      ...createInitialFormData(),
      employeeId: formData.employeeId,
      employeeName: formData.employeeName,
      WorkerRecId: formData.WorkerRecId,
      entitlementCode: newEntitlementCode,
      entitlementType: formData.entitlementType,
      currency: formData.currency,
    };

    setFormData(resetForm);

    try {
      //   const balanceData = await fetchEntitlementBalance(
      //     formData.employeeId,
      //     newEntitlementCode,
      //   );
      //   setFormData(prev => ({
      //     ...prev,
      //     balance: balanceData || '0.00',
      //   }));
    } catch (error) {
      console.error('Error fetching entitlement balance:', error);
      setFormData(prev => ({
        ...prev,
        balance: '0.00',
      }));
    }
  };

  const fetchEntitlementCodesForEmployee = async () => {
    try {
      //   const codes = await fetchEntitlementCodes(
      //     entitlementData?.employeeId || employeeId,
      //   );
      //   setEntitlementCodesForEmployee(codes);
    } catch (error) {
      setAlertMessage('Failed to fetch entitlement codes.');
      setAlertModal(true);
    }
  };

  const formatDate = date =>
    date
      ? new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
      : '';

  const convertDateFormat = date => {
    const d = new Date(date);
    return `${d.getFullYear()}-${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}T12:00:00`;
  };

  //   const handleAction = async (actionType, modalMode, data = {}) => {
  //     try {
  //       const formattedRequestDate = `${
  //         new Date().toISOString().split('T')[0]
  //       }T12:00:00`;

  //       const entitlementRequestData = {
  //         EntitlementCode: data.entitlementCode,
  //         EntitlementType: data.entitlementType,
  //         EntitlementAmount: data.entitlementAmount.toString(),
  //         EntitlementStartDate: data.entitlementStartDate,
  //         EntitlementEndDate: convertDateFormat(data.entitlementEndDate),
  //         Balance: data.balance.toString(),
  //         Description: data.description,
  //         Currency: data.currency,
  //         RequestDate: formattedRequestDate,
  //         EmployeeId: data.employeeId,
  //         RecId: data.recId === '' ? '0' : data.recId,
  //       };

  //       if (
  //         !entitlementRequestData.EntitlementCode ||
  //         !entitlementRequestData.EntitlementStartDate
  //       ) {
  //         setAlertMessage('Entitlement Code and Start Date are required.');
  //         setAlertModal(true);
  //         return false;
  //       }

  //       let response;
  //       if (modalMode === 'create') {
  //         response = await createEntitlementRequest({
  //           entitlementData: entitlementRequestData,
  //         });
  //         if (actionType === 'submit') {
  //           await SubmitEntitlementRequest({
  //             recId: response.RecId,
  //           });
  //         }
  //       } else {
  //         response = await UpdateEntitlementRequest({
  //           entitlementData: entitlementRequestData,
  //         });
  //         if (actionType === 'submit') {
  //           await SubmitEntitlementRequest({
  //             recId: response.RecId,
  //           });
  //         }
  //       }

  //       console.log('API Response:', response);

  //       const isSuccess =
  //         response.IsSuccess === true || response.IsSuccess === 'true';

  //       if (isSuccess) {
  //         const actionText = modalMode === 'create' ? 'Created' : 'Updated';
  //         const submitText = actionType === 'submit' ? ' and Submitted' : '';
  //         setAlertMessage(
  //           `${data.entitlementCode} is ${actionText}${submitText} Successfully`,
  //         );
  //         setAlertModal(true);
  //         return {success: true, recId: response.RecId};
  //       } else {
  //         const errorMessage = response.Message || 'Operation Failed';
  //         setAlertMessage(errorMessage);
  //         setAlertModal(true);
  //         return {success: false, message: errorMessage};
  //       }
  //     } catch (error) {
  //       console.error('Error in handleAction:', error);
  //       setAlertMessage('An error occurred while processing the request.');
  //       setAlertModal(true);
  //       return {success: false, message: 'Network or server error'};
  //     }
  //   };

  const handleSave = async actionType => {
    if (processingButton) return; // Prevent multiple clicks

    const missingFields = [];

    if (!formData.entitlementCode) missingFields.push('Entitlement Code');
    if (!formData.entitlementType) missingFields.push('Entitlement Type');
    if (!formData.entitlementStartDate) missingFields.push('Start Date');
    if (
      !formData.entitlementAmount ||
      Number(formData.entitlementAmount) === 0
    ) {
      missingFields.push('Entitlement Amount');
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

    try {
      //   const result = await handleAction(
      //     actionType,
      //     mode === 'edit' ? 'update' : 'create',
      //     formData,
      //   );
      //   if (result.success) {
      //     // Clear form data after successful operation
      //     setTimeout(() => {
      //       setAlertModal(false);
      //       // Clear the form data
      //       clearFormData();
      //       // Navigate to EntitlementListPage after successful create/update
      //       navigation.navigate('EntitlementListPage', {
      //         employeeId: formData.employeeId,
      //         employeeName: formData.employeeName,
      //         WorkerRecId: formData.WorkerRecId,
      //         highlightRecId: result.recId,
      //         cameFrom: mode === 'create' ? 'CreateSuccess' : 'UpdateSuccess',
      //       });
      //     }, 2000);
      //   }
    } catch (error) {
      console.error('Error saving entitlement request:', error);
      setAlertMessage('Failed to save entitlement request. Please try again.');
      setAlertModal(true);
    } finally {
      setProcessingButton('');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const openCalendar = mode => {
    setCalendarMode(mode);
    setShowCalendar(true);
  };

  return (
    <ActionPaneContainer
      pageTitle={mode === 'edit' ? 'Edit Entitlement' : 'Create Entitlement'}
      isBackButton={true}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      onBackPress={goBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={{}}>
      {/* Show loading indicator when isLoading is true */}
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

              <Text style={styles.LReqSR_Label}>Entitlement Code *</Text>
              <Dropdown
                style={styles.LReqSR_Input}
                data={EntitlementCodesForEmployee}
                labelField="label"
                valueField="value"
                placeholder="Select Entitlement Code"
                value={formData.entitlementCode}
                onFocus={fetchEntitlementCodesForEmployee}
                onChange={handleEntitlementCodeChange}
                placeholderStyle={{color: '#444'}}
                selectedTextStyle={{color: '#444'}}
                itemTextStyle={{color: '#444'}}
                search
                searchPlaceholder="Search Entitlement Code..."
              />

              <Text style={styles.LReqSR_Label}>Entitlement Type *</Text>
              <Dropdown
                style={styles.LReqSR_Input}
                data={entitlementTypeOptions}
                labelField="label"
                valueField="value"
                placeholder="Select Entitlement Type"
                value={formData.entitlementType}
                onChange={item =>
                  handleInputChange('entitlementType', item.value)
                }
                placeholderStyle={{color: '#444'}}
                selectedTextStyle={{color: '#444'}}
                itemTextStyle={{color: '#444'}}
                search
                searchPlaceholder="Search Entitlement Type..."
              />

              <Text style={styles.LReqSR_Label}>Currency</Text>
              <Dropdown
                style={styles.LReqSR_Input}
                data={currencyOptions}
                labelField="label"
                valueField="value"
                placeholder="Select Currency"
                value={formData.currency}
                onChange={item => handleInputChange('currency', item.value)}
                placeholderStyle={{color: '#444'}}
                selectedTextStyle={{color: '#444'}}
                itemTextStyle={{color: '#444'}}
              />

              <Text style={styles.LReqSR_Label}>Entitlement Amount *</Text>
              <TextInput
                style={styles.LReqSR_Input}
                value={formData.entitlementAmount.toString()}
                onChangeText={value =>
                  handleInputChange('entitlementAmount', value)
                }
                keyboardType="numeric"
                placeholder="Enter entitlement amount"
              />

              <Text style={styles.LReqSR_Label}>Balance</Text>
              <Text style={[styles.LReqSR_Input, styles.LReqSR_Disabled]}>
                {formData.balance}
              </Text>

              <Text style={styles.LReqSR_Label}>Start Date *</Text>
              <TouchableOpacity
                style={styles.LReqSR_DateSelector}
                onPress={() => openCalendar('startDate')}>
                <View style={{flex: 1}}>
                  <Text style={styles.LReqSR_DateText}>
                    {formData.entitlementStartDate
                      ? formatDate(formData.entitlementStartDate)
                      : 'Select Start Date'}
                  </Text>
                </View>
                <Icon name="calendar" size={20} color="#0A66C2" />
              </TouchableOpacity>

              <Text style={styles.LReqSR_Label}>End Date</Text>
              <TouchableOpacity
                style={styles.LReqSR_DateSelector}
                onPress={() => openCalendar('endDate')}>
                <View style={{flex: 1}}>
                  <Text style={styles.LReqSR_DateText}>
                    {formData.entitlementEndDate
                      ? formatDate(formData.entitlementEndDate)
                      : 'Select End Date'}
                  </Text>
                </View>
                <Icon name="calendar" size={20} color="#0A66C2" />
              </TouchableOpacity>

              <CalendarModal
                visible={showCalendar}
                current={
                  calendarMode === 'startDate'
                    ? formData.entitlementStartDate
                    : formData.entitlementEndDate
                }
                onDateSelected={date => {
                  handleDateChange(date, calendarMode);
                  setShowCalendar(false);
                }}
                onClose={() => setShowCalendar(false)}
              />

              <Text style={styles.LReqSR_Label}>Description</Text>
              <TextInput
                style={[styles.LReqSR_Input, styles.LReqSR_TextArea]}
                value={formData.description}
                onChangeText={value => handleInputChange('description', value)}
                placeholder="Enter description"
                multiline
                numberOfLines={6}
              />
            </ScrollView>

            <View style={styles.LReqSR_Footer}>
              <Pressable
                style={({pressed}) => [
                  styles.LReqSR_Button,
                  pressed && styles.LReqSR_PressedButton,
                  (processingButton === 'save' ||
                    processingButton === 'submit') &&
                    styles.LReqSR_DisabledButton,
                ]}
                onPress={() => handleSave('save')}
                disabled={
                  processingButton === 'save' || processingButton === 'submit'
                }>
                {({pressed}) => (
                  <Text
                    style={[
                      styles.LReqSR_ButtonText,
                      pressed && styles.LReqSR_pressedText,
                    ]}>
                    {processingButton === 'save'
                      ? 'Processing...'
                      : mode === 'edit'
                      ? 'Update'
                      : 'Create'}
                  </Text>
                )}
              </Pressable>

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
