// /* eslint-disable no-unused-vars */
// /* eslint-disable react-hooks/exhaustive-deps */
// /* eslint-disable curly */
// /* eslint-disable react-native/no-inline-styles */
// import React, {useState, useCallback} from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   KeyboardAvoidingView,
//   ScrollView,
//   SafeAreaView,
//   Pressable,
// } from 'react-native';
// import {
//   useNavigation,
//   useRoute,
//   useFocusEffect,
// } from '@react-navigation/native';
// import {useSelector} from 'react-redux';
// import {Dropdown} from 'react-native-element-dropdown';
// import Icon from 'react-native-vector-icons/FontAwesome';

// import {CreateAdvanceRequest} from '../../API/EmployeeAdvanceRequest/CreateAdvanceRequest';
// import {SubmitAdvanceRequest} from '../../API/EmployeeAdvanceRequest/SubmitAdvanceRequest';
// import {UpdateAdvanceRequest} from '../../API/EmployeeAdvanceRequest/UpdateAdvanceRequest';
// import {RetrieveAllAdvanceTypeRequest} from '../../API/EmployeeAdvanceRequest/RetrieveAllAdvanceTypeRequest';
// import {FindFirstPayGroupPayPeriod} from '../../API/PayGroupPayPeriod/FindFirstPayGroupPayPeriod';

// import AlertModal from '../../components/Alert/AlertModal';
// import CalendarModal from '../../components/Leaves/CalendarModal';
// import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
// import ActionPaneContainer from '../../components/ActionPaneContainer';
// import styles from '../../styles/styles';

// // Helper function to format numbers
// const formatNumber = value => {
//   if (!value || value === '0') return '0';
//   const cleanValue = value.toString().replace(/,/g, '');
//   const num = parseFloat(cleanValue);
//   if (isNaN(num)) return '0';
//   return num.toLocaleString();
// };

// // Helper function to parse formatted numbers
// const parseNumber = value => {
//   if (!value) return 0;
//   const cleanValue = value.toString().replace(/,/g, '');
//   const num = parseFloat(cleanValue);
//   return isNaN(num) ? 0 : num;
// };

// const GenericAdvanceSaveScreen = () => {
//   const route = useRoute();
//   const navigation = useNavigation();

//   const {userData} = useSelector(state => state.user);

//   // Navigation params with safe defaults
//   const {
//     mode = 'create',
//     advanceData = {},
//     employeeId = advanceData.employeeId || userData?.employeeId || '',
//     employeeName = advanceData.employeeName || userData?.employeeName || '',
//     WorkerRecId = advanceData.WorkerRecId || userData?.WorkerRecId || '',
//     cameFrom = 'MainDashboard',
//     requestType = 'Loan', // 'Loan', 'Advance', 'Expense'
//     advanceType = 0, // 0 = Loan, 1 = Advance/Salary, 2 = Expense
//     screenName = 'Loan Request',
//   } = route.params || {};

//   // State declarations
//   const [advanceCodes, setAdvanceCodes] = useState([]);
//   const [advanceCodeDropDown, setAdvanceCodeDropDown] = useState([]);
//   const [showCalendar, setShowCalendar] = useState(false);
//   const [currentDateField, setCurrentDateField] = useState(null);
//   const [alertModal, setAlertModal] = useState(false);
//   const [alertMessage, setAlertMessage] = useState('');
//   const [processingButton, setProcessingButton] = useState('');
//   const [isLoading, setIsLoading] = useState(false);

//   // Create initial form data function
//   const createInitialFormData = () => ({
//     RecId:
//       !advanceData.RecId || advanceData.RecId === '0' ? '' : advanceData.RecId,
//     employeeId: employeeId,
//     employeeName: employeeName,
//     WorkerRecId: WorkerRecId,
//     AdvanceTypeCode: '',
//     AdvanceAmount: '0',
//     RequestedPaymentDate: '',
//     RecoveryStartDate: '',
//     RequestedInstallmentAmount: '',
//     RequestedInstallments: '',
//     AdvanceDescription: '',
//   });

//   // Form state
//   const [formData, setFormData] = useState(() => createInitialFormData());
//   const [selectedAdvanceTypeData, setSelectedAdvanceTypeData] = useState(null);

//   // Get advance type mapping based on API response
//   const getAdvanceTypeMapping = () => {
//     switch (requestType) {
//       case 'Loan':
//         return 'Loan';
//       case 'Advance':
//         return 'Salary';
//       // case 'Expense':
//       //   return 'Expense';
//       default:
//         return 'Loan';
//     }
//   };

//   const goBack = useCallback(() => {
//     if (cameFrom === 'MainDashboard') {
//       navigation.navigate('MainDashboard');
//     } else if (cameFrom === 'GenericAdvanceListScreen') {
//       navigation.navigate('GenericAdvanceListScreen', {
//         employeeId: formData.employeeId,
//         employeeName: employeeName,
//         WorkerRecId: WorkerRecId,
//         cameFrom: 'GenericAdvanceSaveScreen',
//       });
//     } else {
//       navigation.goBack();
//     }
//   }, [cameFrom, employeeId, employeeName, WorkerRecId, navigation]);

//   // Function to clear form data
//   const clearFormData = useCallback(() => {
//     const clearedForm = createInitialFormData();
//     setFormData(clearedForm);
//     setSelectedAdvanceTypeData(null);
//     setAdvanceCodeDropDown([]);
//     setAdvanceCodes([]);
//   }, []);

//   // Reset form data and fetch initial data on screen focus or parameter changes
//   useFocusEffect(
//     useCallback(() => {
//       // Always reset states when screen comes into focus
//       setAdvanceCodeDropDown([]);
//       setAdvanceCodes([]);
//       setSelectedAdvanceTypeData(null);
//       setProcessingButton(''); // Reset processing state

//       if (mode === 'create') {
//         // For create mode, always start fresh
//         const freshFormData = createInitialFormData();
//         setFormData(freshFormData);
//       } else if (mode === 'edit' && advanceData?.RecId) {
//         // For edit mode, populate with existing data
//         const editFormData = {
//           ...createInitialFormData(),
//           ...advanceData,
//           employeeId: advanceData.employeeId || employeeId,
//           employeeName: advanceData.employeeName || employeeName,
//           WorkerRecId: advanceData.WorkerRecId || WorkerRecId,
//           AdvanceAmount: formatNumber(advanceData.AdvanceAmount || '0'),
//           RequestedInstallmentAmount: formatNumber(
//             advanceData.RequestedInstallmentAmount || '',
//           ),
//           RequestedInstallments:
//             advanceData.RequestedInstallments?.toString() || '',
//         };
//         setFormData(editFormData);
//       }

//       // Fetch initial data
//       fetchInitialData();
//     }, [
//       mode,
//       advanceData?.RecId,
//       employeeId,
//       employeeName,
//       WorkerRecId,
//       requestType,
//     ]),
//   );

//   const fetchInitialData = async () => {
//     try {
//       setIsLoading(true);

//       // Fetch advance codes
//       const allAdvanceCodes = await RetrieveAllAdvanceTypeRequest();

//       // Filter based on the request type (using the mapping from API response)
//       const expectedAdvanceType = getAdvanceTypeMapping();
//       const filteredAdvanceType = allAdvanceCodes.filter(
//         type => type.AdvanceType === expectedAdvanceType,
//       );

//       const dropdownData = Array.from(
//         new Set(filteredAdvanceType.map(item => item.AdvanceTypeCode)),
//       ).map(code => ({
//         label: code,
//         value: code,
//       }));

//       setAdvanceCodeDropDown(dropdownData);
//       setAdvanceCodes(filteredAdvanceType);

//       // Auto-select first option for Advance type in create mode
//       if (
//         mode === 'create' &&
//         requestType === 'Advance' &&
//         dropdownData.length > 0
//       ) {
//         const firstAdvanceType = filteredAdvanceType.find(
//           type => type.AdvanceTypeCode === dropdownData[0].value,
//         );

//         setFormData(prev => ({
//           ...prev,
//           AdvanceTypeCode: dropdownData[0].value,
//         }));
//         setSelectedAdvanceTypeData(firstAdvanceType);
//       }

//       // For edit mode, set the selected advance type data if AdvanceTypeCode exists
//       if (mode === 'edit' && formData.AdvanceTypeCode) {
//         const selectedType = filteredAdvanceType.find(
//           type => type.AdvanceTypeCode === formData.AdvanceTypeCode,
//         );
//         if (selectedType) {
//           setSelectedAdvanceTypeData(selectedType);
//         }
//       }

//       // Fetch PayGroupPayPeriod data if EmployeeId is available
//       if (employeeId) {
//         // const response = await PayGroupPayperiodByEmployeeId({
//         //   employeeId: userData.employeeId,
//         // });
//         const response = await FindFirstPayGroupPayPeriod();
//         const filteredPayGroupPayPeriod = response.filter(
//           a => a.PayPeriodStatus === 'Active',
//         );

//         if (filteredPayGroupPayPeriod && filteredPayGroupPayPeriod.length > 0) {
//           if (mode === 'create') {
//             setFormData(prev => ({
//               ...prev,
//               RecoveryStartDate: formatToISOWithTime(
//                 filteredPayGroupPayPeriod[0]?.EndDate,
//               ),
//             }));
//           }
//         }
//       }
//     } catch (error) {
//       console.error('Error fetching initial data:', error);
//       setAlertMessage('Failed to fetch initial data.');
//       setAlertModal(true);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleRefresh = async () => {
//     setIsLoading(true);
//     try {
//       clearFormData();
//       await fetchInitialData();
//     } catch (error) {
//       console.error('Error in Save Record Screen', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleInputChange = (field, value) => {
//     setFormData(prev => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   // Format date functions
//   const formatDate = date =>
//     date
//       ? new Date(date).toLocaleDateString('en-US', {
//           year: 'numeric',
//           month: '2-digit',
//           day: '2-digit',
//         })
//       : '';

//   const formatToISOWithTime = date => {
//     if (!date) return '';
//     const baseDate = new Date(date);
//     const year = baseDate.getFullYear();
//     const month = String(baseDate.getMonth() + 1).padStart(2, '0');
//     const day = String(baseDate.getDate()).padStart(2, '0');
//     return `${year}-${month}-${day}T12:00:00`;
//   };

//   // Handle date changes
//   const handleDateChange = async (date, fieldName) => {
//     const formatted = formatToISOWithTime(date);

//     setFormData(prev => ({
//       ...prev,
//       [fieldName]: formatted,
//     }));

//     setShowCalendar(false);
//   };

//   // Handle Advance Amount Change
//   const handleAdvanceAmountChange = value => {
//     const cleanedValue = value.replace(/[^0-9.]/g, '');
//     const formattedValue = formatNumber(cleanedValue);
//     handleInputChange('AdvanceAmount', formattedValue);
//   };

//   // Handle Advance Type Code Change
//   const handleAdvanceTypeCodeChange = async item => {
//     const newAdvanceTypeCode = item.value;
//     const selectedType = advanceCodes.find(
//       type => type.AdvanceTypeCode === newAdvanceTypeCode,
//     );

//     // Reset form but keep employee info and selected type code
//     const resetForm = {
//       ...createInitialFormData(),
//       employeeId: formData.employeeId,
//       employeeName: formData.employeeName,
//       WorkerRecId: formData.WorkerRecId,
//       AdvanceTypeCode: newAdvanceTypeCode,
//       RecoveryStartDate: formData.RecoveryStartDate, // Keep recovery start date
//     };

//     setFormData(resetForm);
//     setSelectedAdvanceTypeData(selectedType);

//     // Set default values based on the selected advance type
//     if (
//       selectedType &&
//       selectedType.Recoveries &&
//       parseNumber(selectedType.Recoveries) > 0
//     ) {
//       setFormData(prev => ({
//         ...prev,
//         RequestedInstallments: selectedType.Recoveries,
//         RequestedInstallmentAmount: '',
//       }));
//     }
//   };

//   // Handle Recovery Amount Change
//   const handleRecoveryAmountChange = value => {
//     const cleanedValue = value.replace(/[^0-9.]/g, '');
//     const formattedValue = formatNumber(cleanedValue);

//     setFormData(prev => ({
//       ...prev,
//       RequestedInstallmentAmount: formattedValue,
//       RequestedInstallments:
//         formattedValue !== '' && formattedValue !== '0'
//           ? ''
//           : prev.RequestedInstallments,
//     }));
//   };

//   // Handle Recoveries Change
//   const handleRecoveriesChange = value => {
//     const cleanedValue = value.replace(/[^0-9]/g, '');

//     setFormData(prev => ({
//       ...prev,
//       RequestedInstallments: cleanedValue,
//       RequestedInstallmentAmount:
//         cleanedValue !== '' && cleanedValue !== '0'
//           ? ''
//           : prev.RequestedInstallmentAmount,
//     }));
//   };

//   // Main action handler
//   const handleAction = async (actionType, modalMode, data = {}) => {
//     try {
//       const formattedRequestDate = `${
//         new Date().toISOString().split('T')[0]
//       }T12:00:00`;

//       const advanceRequestData = {
//         AdvanceTypeCode: data.AdvanceTypeCode,
//         AdvanceAmount: parseNumber(data.AdvanceAmount).toString(),
//         RequestedPaymentDate: data.RequestedPaymentDate,
//         RecoveryStartDate: data.RecoveryStartDate,
//         RequestedInstallmentAmount: parseNumber(
//           data.RequestedInstallmentAmount,
//         ).toString(),
//         RequestedInstallments: data.RequestedInstallments || '0',
//         AdvanceDescription: data.AdvanceDescription,
//         EmployeeId: WorkerRecId,
//         RecId: data.RecId === '' ? '0' : data.RecId,
//         RequestDate: formattedRequestDate,
//       };

//       let response;

//       if (modalMode === 'create') {
//         response = await CreateAdvanceRequest({
//           advanceData: advanceRequestData,
//         });
//         if (actionType === 'submit') {
//           await SubmitAdvanceRequest({
//             recId: response.RecId,
//           });
//         }
//       } else {
//         response = await UpdateAdvanceRequest({
//           advanceData: advanceRequestData,
//         });
//         if (actionType === 'submit') {
//           await SubmitAdvanceRequest({
//             recId: response.RecId,
//           });
//         }
//       }

//       const isSuccess =
//         response.IsSuccess === true || response.IsSuccess === 'true';

//       if (isSuccess) {
//         const actionText = modalMode === 'create' ? 'Created' : 'Updated';
//         const submitText = actionType === 'submit' ? ' and Submitted' : '';
//         setAlertMessage(
//           `${data.AdvanceTypeCode} is ${actionText}${submitText} Successfully`,
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

//   // Validate all fields - returns validation result without showing alert
//   const validateFields = () => {
//     const errors = [];

//     // Validate Advance Type Code
//     if (!formData.AdvanceTypeCode) {
//       errors.push('Advance Type Code is required');
//     }

//     // Validate Advance Amount
//     const advanceAmount = parseNumber(formData.AdvanceAmount);
//     if (!advanceAmount || advanceAmount === 0) {
//       errors.push('Advance Amount is required');
//     } else {
//       // Check if amount exceeds maximum allowed
//       if (selectedAdvanceTypeData && selectedAdvanceTypeData.MaxAdanceAmount) {
//         const maxAmount = parseNumber(selectedAdvanceTypeData.MaxAdanceAmount);
//         if (maxAmount > 0 && advanceAmount > maxAmount) {
//           errors.push(
//             `Advance Amount cannot exceed ${formatNumber(
//               maxAmount.toString(),
//             )}`,
//           );
//         }
//       }
//     }

//     // Validate Payment Date
//     if (!formData.RequestedPaymentDate) {
//       errors.push('Payment Date is required');
//     }

//     // Validate Recovery Start Date vs Payment Date
//     if (formData.RequestedPaymentDate && formData.RecoveryStartDate) {
//       const paymentDate = new Date(formData.RequestedPaymentDate);
//       const recoveryDate = new Date(formData.RecoveryStartDate);
//       if (paymentDate > recoveryDate) {
//         errors.push(
//           `Payment Date cannot be greater than Recovery Start Date ${formatDate(
//             recoveryDate,
//           )}`,
//         );
//       }
//     }

//     // Validate Recovery fields for Loan requests
//     if (requestType === 'Loan') {
//       const recoveryAmount = parseNumber(formData.RequestedInstallmentAmount);
//       const recoveries = parseNumber(formData.RequestedInstallments);

//       // Either recovery amount or recoveries must be filled
//       if (!recoveryAmount && !recoveries) {
//         errors.push('Either Recovery Amount or Recoveries must be filled');
//       }

//       // Recovery amount cannot exceed advance amount
//       if (recoveryAmount > 0 && recoveryAmount > advanceAmount) {
//         errors.push('Recovery Amount cannot exceed Advance Amount');
//       }

//       // Recoveries cannot exceed max recoveries
//       if (selectedAdvanceTypeData && selectedAdvanceTypeData.Recoveries) {
//         const maxRecoveries = parseNumber(selectedAdvanceTypeData.Recoveries);
//         if (recoveries > maxRecoveries) {
//           errors.push(`Recoveries cannot exceed ${maxRecoveries}`);
//         }
//       }
//     }

//     return {
//       isValid: errors.length === 0,
//       errors: errors,
//     };
//   };

//   const handleSave = async actionType => {
//     if (processingButton) return;

//     const validation = validateFields();
//     if (!validation.isValid) {
//       setAlertMessage(validation.errors.join('\n'));
//       setAlertModal(true);
//       return;
//     }

//     setProcessingButton(actionType);

//     try {
//       const result = await handleAction(
//         actionType,
//         mode === 'edit' ? 'update' : 'create',
//         formData,
//       );

//       if (result.success) {
//         setTimeout(() => {
//           setAlertModal(false);
//           clearFormData();

//           // Navigate back to list page after successful create/update
//           navigation.navigate('GenericAdvanceListScreen', {
//             employeeId: formData.employeeId,
//             employeeName: formData.employeeName,
//             WorkerRecId: formData.WorkerRecId,
//             highlightRecId: result.recId,
//             cameFrom: mode === 'create' ? 'CreateSuccess' : 'UpdateSuccess',
//           });
//         }, 2000);
//       }
//     } catch (error) {
//       console.error('Error saving advance request:', error);
//       setAlertMessage('Failed to save advance request. Please try again.');
//       setAlertModal(true);
//     } finally {
//       setProcessingButton('');
//     }
//   };

//   const today = new Date().toISOString().split('T')[0];

//   // Determine if recovery fields should be shown based on request type
//   const showRecoveryFields = requestType === 'Loan';

//   // Check if recovery amount field should be disabled
//   const isRecoveryAmountDisabled =
//     formData.RequestedInstallments &&
//     parseNumber(formData.RequestedInstallments) > 0;

//   // Check if recoveries field should be disabled
//   const isRecoveriesDisabled =
//     formData.RequestedInstallmentAmount &&
//     parseNumber(formData.RequestedInstallmentAmount) > 0;

//   return (
//     <ActionPaneContainer
//       pageTitle={
//         mode === 'edit' ? `Edit ${screenName}` : `Create ${screenName}`
//       }
//       isBackButton={true}
//       showFooter={false}
//       showFloatingButton={false}
//       isHeaderActive={true}
//       onBackPress={goBack}
//       onRefresh={handleRefresh}
//       onFloatingButtonPress={{}}>
//       {isLoading ? (
//         <CustomIndicator />
//       ) : (
//         <SafeAreaView style={styles.LReqSR_SafeArea}>
//           <KeyboardAvoidingView
//             behavior="padding"
//             style={styles.LReqSR_ContentWrapper}>
//             <ScrollView contentContainerStyle={styles.LReqSR_FormContainer}>
//               <Text style={styles.LReqSR_Label}>Employee Name</Text>
//               <Text style={[styles.LReqSR_Input, styles.LReqSR_Disabled]}>
//                 {formData.employeeName}
//               </Text>

//               <Text style={styles.LReqSR_Label}>Request Date</Text>
//               <Text style={[styles.LReqSR_Input, styles.LReqSR_Disabled]}>
//                 {formatDate(today)}
//               </Text>

//               <Text style={styles.LReqSR_Label}>Advance Type Code *</Text>
//               <Dropdown
//                 style={[
//                   styles.LReqSR_Input,
//                   requestType === 'Advance' && styles.LReqSR_Disabled,
//                 ]}
//                 data={advanceCodeDropDown}
//                 labelField="label"
//                 valueField="value"
//                 placeholder="Select Advance Type Code"
//                 value={formData.AdvanceTypeCode}
//                 onChange={handleAdvanceTypeCodeChange}
//                 placeholderStyle={{color: '#444'}}
//                 selectedTextStyle={{color: '#444'}}
//                 itemTextStyle={{color: '#444'}}
//                 search
//                 searchPlaceholder="Search Advance Type Code..."
//                 disable={requestType === 'Advance'}
//               />

//               <Text style={styles.LReqSR_Label}>Advance Amount *</Text>
//               <TextInput
//                 style={[
//                   styles.LReqSR_Input,
//                   !formData.AdvanceTypeCode && styles.LReqSR_Disabled,
//                 ]}
//                 value={formData.AdvanceAmount}
//                 onChangeText={handleAdvanceAmountChange}
//                 keyboardType="numeric"
//                 placeholder="Enter advance amount"
//                 editable={!!formData.AdvanceTypeCode}
//               />

//               <Text style={styles.LReqSR_Label}>Payment Date *</Text>
//               <TouchableOpacity
//                 style={styles.LReqSR_DateSelector}
//                 onPress={() => {
//                   setCurrentDateField('RequestedPaymentDate');
//                   setShowCalendar(true);
//                 }}>
//                 <View style={{flex: 1}}>
//                   <Text style={styles.LReqSR_DateText}>
//                     {formData.RequestedPaymentDate
//                       ? formatDate(formData.RequestedPaymentDate)
//                       : 'Select Payment Date'}
//                   </Text>
//                 </View>
//                 <Icon name="calendar" size={20} color="#0A66C2" />
//               </TouchableOpacity>

//               {/* Recovery fields - only show for Loan requests */}
//               {showRecoveryFields && (
//                 <>
//                   <Text style={styles.LReqSR_Label}>Recovery Start Date</Text>
//                   <TouchableOpacity
//                     style={styles.LReqSR_DateSelector}
//                     onPress={() => {
//                       setCurrentDateField('RecoveryStartDate');
//                       setShowCalendar(true);
//                     }}>
//                     <View style={{flex: 1}}>
//                       <Text style={styles.LReqSR_DateText}>
//                         {formData.RecoveryStartDate
//                           ? formatDate(formData.RecoveryStartDate)
//                           : 'Select Recovery Start Date'}
//                       </Text>
//                     </View>
//                     <Icon name="calendar" size={20} color="#0A66C2" />
//                   </TouchableOpacity>

//                   <Text style={styles.LReqSR_Label}>Recovery Amount *</Text>
//                   <TextInput
//                     style={[
//                       styles.LReqSR_Input,
//                       isRecoveryAmountDisabled && styles.LReqSR_Disabled,
//                     ]}
//                     value={formData.RequestedInstallmentAmount}
//                     onChangeText={handleRecoveryAmountChange}
//                     keyboardType="numeric"
//                     placeholder="Enter recovery amount"
//                     editable={!isRecoveryAmountDisabled}
//                   />

//                   <Text style={styles.LReqSR_Label}>Recoveries</Text>
//                   <TextInput
//                     style={[
//                       styles.LReqSR_Input,
//                       isRecoveriesDisabled && styles.LReqSR_Disabled,
//                     ]}
//                     value={formData.RequestedInstallments}
//                     onChangeText={handleRecoveriesChange}
//                     keyboardType="numeric"
//                     placeholder="Enter number of recoveries"
//                     editable={!isRecoveriesDisabled}
//                   />
//                 </>
//               )}

//               <Text style={styles.LReqSR_Label}>{requestType} Description</Text>
//               <TextInput
//                 style={[styles.LReqSR_Input, styles.LReqSR_TextArea]}
//                 value={formData.AdvanceDescription}
//                 onChangeText={value =>
//                   handleInputChange('AdvanceDescription', value)
//                 }
//                 placeholder={`Enter ${requestType.toLowerCase()} description`}
//                 multiline
//                 numberOfLines={4}
//               />
//             </ScrollView>

//             <View style={styles.LReqSR_Footer}>
//               {/* Create/Update Button */}
//               <Pressable
//                 style={({pressed}) => [
//                   styles.LReqSR_Button,
//                   // styles.LReqSR_SaveButton,
//                   pressed && styles.LReqSR_PressedButton,
//                   (processingButton === 'save' ||
//                     processingButton === 'submit') &&
//                     styles.LReqSR_DisabledButton,
//                 ]}
//                 onPress={() => handleSave('save')}
//                 disabled={
//                   processingButton === 'save' || processingButton === 'submit'
//                 }>
//                 {({pressed}) => (
//                   <Text
//                     style={[
//                       styles.LReqSR_ButtonText,
//                       pressed && styles.LReqSR_pressedText,
//                     ]}>
//                     {processingButton === 'save'
//                       ? 'Processing...'
//                       : mode === 'edit'
//                       ? 'Update'
//                       : 'Create'}
//                   </Text>
//                 )}
//               </Pressable>

//               {/* Create & Submit / Update & Submit Button */}
//               <Pressable
//                 style={({pressed}) => [
//                   styles.LReqSR_Button,
//                   styles.LReqSR_SubmitButton,
//                   pressed && styles.LReqSR_pressedSubmitButton,
//                   (processingButton === 'save' ||
//                     processingButton === 'submit') &&
//                     styles.LReqSR_DisabledButton,
//                 ]}
//                 onPress={() => handleSave('submit')}
//                 disabled={
//                   processingButton === 'save' || processingButton === 'submit'
//                 }>
//                 {({pressed}) => (
//                   <Text
//                     style={[
//                       styles.LReqSR_SubmitButtonText,
//                       pressed && styles.LReqSR_pressedText,
//                     ]}>
//                     {processingButton === 'submit'
//                       ? 'Processing...'
//                       : mode === 'edit'
//                       ? 'Update & Submit'
//                       : 'Create & Submit'}
//                   </Text>
//                 )}
//               </Pressable>
//             </View>
//           </KeyboardAvoidingView>

//           <CalendarModal
//             visible={showCalendar}
//             current={
//               currentDateField === 'RequestedPaymentDate'
//                 ? formData.RequestedPaymentDate
//                 : formData.RecoveryStartDate
//             }
//             onDateSelected={date => handleDateChange(date, currentDateField)}
//             onClose={() => setShowCalendar(false)}
//           />

//           <AlertModal
//             visible={alertModal}
//             heading="Alert"
//             text={alertMessage}
//             onPress={() => {
//               setAlertModal(false);
//             }}
//           />
//         </SafeAreaView>
//       )}
//     </ActionPaneContainer>
//   );
// };

// export default GenericAdvanceSaveScreen;

/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useCallback, useRef, useEffect} from 'react';
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

import {CreateAdvanceRequest} from '../../API/EmployeeAdvanceRequest/CreateAdvanceRequest';
import {SubmitAdvanceRequest} from '../../API/EmployeeAdvanceRequest/SubmitAdvanceRequest';
import {UpdateAdvanceRequest} from '../../API/EmployeeAdvanceRequest/UpdateAdvanceRequest';
import {RetrieveAllAdvanceTypeRequest} from '../../API/EmployeeAdvanceRequest/RetrieveAllAdvanceTypeRequest';
import {FindFirstPayGroupPayPeriod} from '../../API/PayGroupPayPeriod/FindFirstPayGroupPayPeriod';

import AlertModal from '../../components/Alert/AlertModal';
import CalendarModal from '../../components/Leaves/CalendarModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import styles from '../../styles/styles';

// Helper function to format numbers
const formatNumber = value => {
  if (!value || value === '0') return '0';
  const cleanValue = value.toString().replace(/,/g, '');
  const num = parseFloat(cleanValue);
  if (isNaN(num)) return '0';
  return num.toLocaleString();
};

// Helper function to parse formatted numbers
const parseNumber = value => {
  if (!value) return 0;
  const cleanValue = value.toString().replace(/,/g, '');
  const num = parseFloat(cleanValue);
  return isNaN(num) ? 0 : num;
};

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
    requestType = 'Loan', // 'Loan', 'Advance', 'Expense'
    advanceType = 0, // 0 = Loan, 1 = Advance/Salary, 2 = Expense
    screenName = 'Loan Request',
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
  const [dataInitialized, setDataInitialized] = useState(false); // Track data initialization

  // Validation error states for real-time validation
  const [validationErrors, setValidationErrors] = useState({});

  // Create initial form data function
  const createInitialFormData = useCallback(
    () => ({
      RecId:
        !advanceData.RecId || advanceData.RecId === '0'
          ? ''
          : advanceData.RecId,
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
    }),
    [advanceData, employeeId, employeeName, WorkerRecId],
  );

  // Form state
  const [formData, setFormData] = useState(() => createInitialFormData());
  const [selectedAdvanceTypeData, setSelectedAdvanceTypeData] = useState(null);

  // Get advance type mapping based on API response
  const getAdvanceTypeMapping = () => {
    switch (requestType) {
      case 'Loan':
        return 'Loan';
      case 'Advance':
        return 'Salary';
      // case 'Expense':
      //   return 'Expense';
      default:
        return 'Loan';
    }
  };

  const goBack = useCallback(() => {
    if (cameFrom === 'MainDashboard') {
      navigation.navigate('MainDashboard');
    } else if (cameFrom === 'GenericAdvanceListScreen') {
      navigation.navigate('GenericAdvanceListScreen', {
        employeeId: formData.employeeId,
        employeeName: employeeName,
        WorkerRecId: WorkerRecId,
        cameFrom: 'GenericAdvanceSaveScreen',
      });
    } else {
      navigation.goBack();
    }
  }, [cameFrom, employeeId, employeeName, WorkerRecId, navigation]);

  // Function to clear form data
  const clearFormData = useCallback(() => {
    const clearedForm = createInitialFormData();
    setFormData(clearedForm);
    setSelectedAdvanceTypeData(null);
    setAdvanceCodeDropDown([]);
    setAdvanceCodes([]);
    setDataInitialized(false);
    setValidationErrors({});
  }, [createInitialFormData]);

  // Real-time validation function
  const validateField = useCallback(
    (fieldName, value, formDataToCheck = formData) => {
      const errors = {};
      const tempFormData = {...formDataToCheck, [fieldName]: value};

      // Validate Payment Date vs Recovery Start Date
      if (
        fieldName === 'RequestedPaymentDate' ||
        fieldName === 'RecoveryStartDate'
      ) {
        if (
          tempFormData.RequestedPaymentDate &&
          tempFormData.RecoveryStartDate
        ) {
          const paymentDate = new Date(tempFormData.RequestedPaymentDate);
          const recoveryDate = new Date(tempFormData.RecoveryStartDate);

          if (paymentDate > recoveryDate) {
            errors.dateComparison = `Payment Date cannot be greater than Recovery Start Date (${formatDate(
              recoveryDate,
            )})`;
          }
        }
      }

      // Validate Advance Amount against max amount
      if (fieldName === 'AdvanceAmount') {
        const advanceAmount = parseNumber(value);
        if (
          selectedAdvanceTypeData &&
          selectedAdvanceTypeData.MaxAdanceAmount
        ) {
          const maxAmount = parseNumber(
            selectedAdvanceTypeData.MaxAdanceAmount,
          );
          if (maxAmount > 0 && advanceAmount > maxAmount) {
            errors.advanceAmount = `Advance Amount cannot exceed ${formatNumber(
              maxAmount.toString(),
            )}`;
          }
        }
      }

      // Validate Recovery Amount vs Advance Amount
      if (fieldName === 'RequestedInstallmentAmount') {
        const recoveryAmount = parseNumber(value);
        const advanceAmount = parseNumber(tempFormData.AdvanceAmount);
        if (
          recoveryAmount > 0 &&
          advanceAmount > 0 &&
          recoveryAmount > advanceAmount
        ) {
          errors.recoveryAmount =
            'Recovery Amount cannot exceed Advance Amount';
        }
      }

      // Validate Recoveries against max recoveries
      if (fieldName === 'RequestedInstallments') {
        const recoveries = parseNumber(value);
        if (selectedAdvanceTypeData && selectedAdvanceTypeData.Recoveries) {
          const maxRecoveries = parseNumber(selectedAdvanceTypeData.Recoveries);
          if (recoveries > maxRecoveries) {
            errors.recoveries = `Recoveries cannot exceed ${maxRecoveries}`;
          }
        }
      }

      // Update validation errors
      setValidationErrors(prev => {
        const newErrors = {...prev};
        // Remove old errors for this field group
        delete newErrors.dateComparison;
        delete newErrors.advanceAmount;
        delete newErrors.recoveryAmount;
        delete newErrors.recoveries;

        // Add new errors
        return {...newErrors, ...errors};
      });

      // Show alert immediately if there are errors
      if (Object.keys(errors).length > 0) {
        const errorMessage = Object.values(errors).join('\n');
        setAlertMessage(errorMessage);
        setAlertModal(true);
      }

      return Object.keys(errors).length === 0;
    },
    [formData, selectedAdvanceTypeData],
  );

  // Initialize data properly on screen focus
  useEffect(() => {
    let isMounted = true;

    const initializeScreen = async () => {
      if (!dataInitialized) {
        setDataInitialized(true);
        setAdvanceCodeDropDown([]);
        setAdvanceCodes([]);
        setSelectedAdvanceTypeData(null);
        setProcessingButton('');
        setValidationErrors({});

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
            AdvanceAmount: formatNumber(advanceData.AdvanceAmount || '0'),
            RequestedInstallmentAmount: formatNumber(
              advanceData.RequestedInstallmentAmount || '',
            ),
            RequestedInstallments:
              advanceData.RequestedInstallments?.toString() || '',
          };
          if (isMounted) {
            setFormData(editFormData);
          }
        }

        if (isMounted) {
          await fetchInitialData();
        }
      }
    };

    initializeScreen();

    return () => {
      isMounted = false;
    };
  }, [mode, advanceData?.RecId, dataInitialized, createInitialFormData]);

  // Reset data initialization when key params change
  useEffect(() => {
    setDataInitialized(false);
  }, [mode, advanceData?.RecId, employeeId, requestType]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);

      // Fetch advance codes
      const allAdvanceCodes = await RetrieveAllAdvanceTypeRequest();

      // Filter based on the request type (using the mapping from API response)
      const expectedAdvanceType = getAdvanceTypeMapping();
      const filteredAdvanceType = allAdvanceCodes.filter(
        type => type.AdvanceType === expectedAdvanceType,
      );

      const dropdownData = Array.from(
        new Set(filteredAdvanceType.map(item => item.AdvanceTypeCode)),
      ).map(code => ({
        label: code,
        value: code,
      }));

      setAdvanceCodeDropDown(dropdownData);
      setAdvanceCodes(filteredAdvanceType);

      // Auto-select first option for Advance type in create mode
      if (
        mode === 'create' &&
        requestType === 'Advance' &&
        dropdownData.length > 0
      ) {
        const firstAdvanceType = filteredAdvanceType.find(
          type => type.AdvanceTypeCode === dropdownData[0].value,
        );

        setFormData(prev => ({
          ...prev,
          AdvanceTypeCode: dropdownData[0].value,
        }));
        setSelectedAdvanceTypeData(firstAdvanceType);
      }

      // For edit mode, set the selected advance type data if AdvanceTypeCode exists
      if (mode === 'edit' && formData.AdvanceTypeCode) {
        const selectedType = filteredAdvanceType.find(
          type => type.AdvanceTypeCode === formData.AdvanceTypeCode,
        );
        if (selectedType) {
          setSelectedAdvanceTypeData(selectedType);
        }
      }

      // Fetch PayGroupPayPeriod data if EmployeeId is available
      if (employeeId) {
        const response = await FindFirstPayGroupPayPeriod();
        const filteredPayGroupPayPeriod = response.filter(
          a => a.PayPeriodStatus === 'Active',
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
    } finally {
      setIsLoading(false);
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
    if (!date) return '';
    const baseDate = new Date(date);
    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, '0');
    const day = String(baseDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T12:00:00`;
  };

  // Handle date changes with validation
  const handleDateChange = async (date, fieldName) => {
    const formatted = formatToISOWithTime(date);

    setFormData(prev => ({
      ...prev,
      [fieldName]: formatted,
    }));

    // Validate the date field
    setTimeout(() => {
      validateField(fieldName, formatted);
    }, 100);

    setShowCalendar(false);
  };

  // Handle Advance Amount Change with validation
  const handleAdvanceAmountChange = value => {
    const cleanedValue = value.replace(/[^0-9.]/g, '');
    const formattedValue = formatNumber(cleanedValue);
    handleInputChange('AdvanceAmount', formattedValue);

    // Validate immediately
    setTimeout(() => {
      validateField('AdvanceAmount', formattedValue);
    }, 100);
  };

  // Handle Advance Type Code Change
  const handleAdvanceTypeCodeChange = async item => {
    const newAdvanceTypeCode = item.value;
    const selectedType = advanceCodes.find(
      type => type.AdvanceTypeCode === newAdvanceTypeCode,
    );

    // Reset form but keep employee info and selected type code
    const resetForm = {
      ...createInitialFormData(),
      employeeId: formData.employeeId,
      employeeName: formData.employeeName,
      WorkerRecId: formData.WorkerRecId,
      AdvanceTypeCode: newAdvanceTypeCode,
      RecoveryStartDate: formData.RecoveryStartDate, // Keep recovery start date
    };

    setFormData(resetForm);
    setSelectedAdvanceTypeData(selectedType);
    setValidationErrors({}); // Clear validation errors

    // Set default values based on the selected advance type
    if (
      selectedType &&
      selectedType.Recoveries &&
      parseNumber(selectedType.Recoveries) > 0
    ) {
      setFormData(prev => ({
        ...prev,
        RequestedInstallments: selectedType.Recoveries,
        RequestedInstallmentAmount: '',
      }));
    }
  };

  // Handle Recovery Amount Change with validation
  const handleRecoveryAmountChange = value => {
    const cleanedValue = value.replace(/[^0-9.]/g, '');
    const formattedValue = formatNumber(cleanedValue);

    setFormData(prev => ({
      ...prev,
      RequestedInstallmentAmount: formattedValue,
      RequestedInstallments:
        formattedValue !== '' && formattedValue !== '0'
          ? ''
          : prev.RequestedInstallments,
    }));

    // Validate immediately
    setTimeout(() => {
      validateField('RequestedInstallmentAmount', formattedValue);
    }, 100);
  };

  // Handle Recoveries Change with validation
  const handleRecoveriesChange = value => {
    const cleanedValue = value.replace(/[^0-9]/g, '');

    setFormData(prev => ({
      ...prev,
      RequestedInstallments: cleanedValue,
      RequestedInstallmentAmount:
        cleanedValue !== '' && cleanedValue !== '0'
          ? ''
          : prev.RequestedInstallmentAmount,
    }));

    // Validate immediately
    setTimeout(() => {
      validateField('RequestedInstallments', cleanedValue);
    }, 100);
  };

  // Main action handler
  const handleAction = async (actionType, modalMode, data = {}) => {
    try {
      const formattedRequestDate = `${
        new Date().toISOString().split('T')[0]
      }T12:00:00`;

      const advanceRequestData = {
        AdvanceTypeCode: data.AdvanceTypeCode,
        AdvanceAmount: parseNumber(data.AdvanceAmount).toString(),
        RequestedPaymentDate: data.RequestedPaymentDate,
        RecoveryStartDate: data.RecoveryStartDate,
        RequestedInstallmentAmount: parseNumber(
          data.RequestedInstallmentAmount,
        ).toString(),
        RequestedInstallments: data.RequestedInstallments || '0',
        AdvanceDescription: data.AdvanceDescription,
        EmployeeId: WorkerRecId,
        RecId: data.RecId === '' ? '0' : data.RecId,
        RequestDate: formattedRequestDate,
      };

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

  // Validate all fields - returns validation result without showing alert
  const validateFields = () => {
    const errors = [];

    // Validate Advance Type Code
    if (!formData.AdvanceTypeCode) {
      errors.push('Advance Type Code is required');
    }

    // Validate Advance Amount
    const advanceAmount = parseNumber(formData.AdvanceAmount);
    if (!advanceAmount || advanceAmount === 0) {
      errors.push('Advance Amount is required');
    } else {
      // Check if amount exceeds maximum allowed
      if (selectedAdvanceTypeData && selectedAdvanceTypeData.MaxAdanceAmount) {
        const maxAmount = parseNumber(selectedAdvanceTypeData.MaxAdanceAmount);
        if (maxAmount > 0 && advanceAmount > maxAmount) {
          errors.push(
            `Advance Amount cannot exceed ${formatNumber(
              maxAmount.toString(),
            )}`,
          );
        }
      }
    }

    // Validate Payment Date
    if (!formData.RequestedPaymentDate) {
      errors.push('Payment Date is required');
    }

    // Validate Recovery Start Date vs Payment Date
    if (formData.RequestedPaymentDate && formData.RecoveryStartDate) {
      const paymentDate = new Date(formData.RequestedPaymentDate);
      const recoveryDate = new Date(formData.RecoveryStartDate);
      if (paymentDate > recoveryDate) {
        errors.push(
          `Payment Date cannot be greater than Recovery Start Date ${formatDate(
            recoveryDate,
          )}`,
        );
      }
    }

    // Validate Recovery fields for Loan requests
    if (requestType === 'Loan') {
      const recoveryAmount = parseNumber(formData.RequestedInstallmentAmount);
      const recoveries = parseNumber(formData.RequestedInstallments);

      // Either recovery amount or recoveries must be filled
      if (!recoveryAmount && !recoveries) {
        errors.push('Either Recovery Amount or Recoveries must be filled');
      }

      // Recovery amount cannot exceed advance amount
      if (recoveryAmount > 0 && recoveryAmount > advanceAmount) {
        errors.push('Recovery Amount cannot exceed Advance Amount');
      }

      // Recoveries cannot exceed max recoveries
      if (selectedAdvanceTypeData && selectedAdvanceTypeData.Recoveries) {
        const maxRecoveries = parseNumber(selectedAdvanceTypeData.Recoveries);
        if (recoveries > maxRecoveries) {
          errors.push(`Recoveries cannot exceed ${maxRecoveries}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  };

  const handleSave = async actionType => {
    if (processingButton) return;

    const validation = validateFields();
    if (!validation.isValid) {
      setAlertMessage(validation.errors.join('\n'));
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

          // Navigate back to list page after successful create/update
          navigation.navigate('GenericAdvanceListScreen', {
            employeeId: formData.employeeId,
            employeeName: formData.employeeName,
            WorkerRecId: formData.WorkerRecId,
            highlightRecId: result.recId,
            cameFrom: mode === 'create' ? 'CreateSuccess' : 'UpdateSuccess',
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

  // Determine if recovery fields should be shown based on request type
  const showRecoveryFields = requestType === 'Loan';

  // Check if recovery amount field should be disabled
  const isRecoveryAmountDisabled =
    formData.RequestedInstallments &&
    parseNumber(formData.RequestedInstallments) > 0;

  // Check if recoveries field should be disabled
  const isRecoveriesDisabled =
    formData.RequestedInstallmentAmount &&
    parseNumber(formData.RequestedInstallmentAmount) > 0;

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

              <Text style={styles.LReqSR_Label}>Advance Type Code *</Text>
              <Dropdown
                style={[
                  styles.LReqSR_Input,
                  requestType === 'Advance' && styles.LReqSR_Disabled,
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
                disable={requestType === 'Advance'}
              />

              <Text style={styles.LReqSR_Label}>Advance Amount *</Text>
              <TextInput
                style={[
                  styles.LReqSR_Input,
                  !formData.AdvanceTypeCode && styles.LReqSR_Disabled,
                ]}
                value={formData.AdvanceAmount}
                onChangeText={handleAdvanceAmountChange}
                keyboardType="numeric"
                placeholder="Enter advance amount"
                editable={!!formData.AdvanceTypeCode}
              />

              <Text style={styles.LReqSR_Label}>Payment Date *</Text>
              <TouchableOpacity
                style={styles.LReqSR_DateSelector}
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

              {/* Recovery fields - only show for Loan requests */}
              {showRecoveryFields && (
                <>
                  <Text style={styles.LReqSR_Label}>Recovery Start Date</Text>
                  <TouchableOpacity
                    style={styles.LReqSR_DateSelector}
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

                  <Text style={styles.LReqSR_Label}>Recovery Amount *</Text>
                  <TextInput
                    style={[
                      styles.LReqSR_Input,
                      isRecoveryAmountDisabled && styles.LReqSR_Disabled,
                    ]}
                    value={formData.RequestedInstallmentAmount}
                    onChangeText={handleRecoveryAmountChange}
                    keyboardType="numeric"
                    placeholder="Enter recovery amount"
                    editable={!isRecoveryAmountDisabled}
                  />

                  <Text style={styles.LReqSR_Label}>Recoveries</Text>
                  <TextInput
                    style={[
                      styles.LReqSR_Input,
                      isRecoveriesDisabled && styles.LReqSR_Disabled,
                    ]}
                    value={formData.RequestedInstallments}
                    onChangeText={handleRecoveriesChange}
                    keyboardType="numeric"
                    placeholder="Enter number of recoveries"
                    editable={!isRecoveriesDisabled}
                  />
                </>
              )}

              <Text style={styles.LReqSR_Label}>{requestType} Description</Text>
              <TextInput
                style={[styles.LReqSR_Input, styles.LReqSR_TextArea]}
                value={formData.AdvanceDescription}
                onChangeText={value =>
                  handleInputChange('AdvanceDescription', value)
                }
                placeholder={`Enter ${requestType.toLowerCase()} description (max 60 characters)`}
                multiline
                numberOfLines={4}
                maxLength={60}
              />
              <Text style={styles.LReqSR_CharCount}>
                {formData.AdvanceDescription?.length || 0}/60
              </Text>
            </ScrollView>

            <View style={styles.LReqSR_Footer}>
              {/* Create/Update Button */}
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

              {/* Create & Submit / Update & Submit Button */}
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
