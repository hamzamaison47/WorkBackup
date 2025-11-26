// /* eslint-disable react-hooks/exhaustive-deps */
// /* eslint-disable curly */
// /* eslint-disable react-native/no-inline-styles */
// import React, {useState, useCallback, useRef} from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   KeyboardAvoidingView,
//   ScrollView,
//   SafeAreaView,
//   BackHandler,
//   Platform,
// } from 'react-native';
// import {
//   useNavigation,
//   useRoute,
//   useFocusEffect,
// } from '@react-navigation/native';
// import {useSelector} from 'react-redux';
// import {Dropdown} from 'react-native-element-dropdown';
// import Icon from 'react-native-vector-icons/FontAwesome';

// import {ExpenseCategoryLookup} from '../../../API/ExpenseManagment/Lines/ExpenseCategoryLookup';
// import {RetrieveAllCurrency} from '../../../API/ExpenseManagment/Lines/RetrieveAllCurrency';
// import {CreateExpenseLine} from '../../../API/ExpenseManagment/Lines/CreateExpenseLine';
// import {UpdateExpenseLine} from '../../../API/ExpenseManagment/Lines/UpdateExpenseLine';

// import AlertModal from '../../../components/Alert/AlertModal';
// import CalendarModal from '../../../components/Leaves/CalendarModal';
// import CustomIndicator from '../../../components/CustomIndicator/CustomIndicator';
// import ActionPaneContainer from '../../../components/ActionPaneContainer';
// import SaveRecordButtons, {
//   BUTTON_TYPES,
// } from '../../../components/Buttons/SaveRecordButtons';
// import styles from '../../../styles/styles';
// import ConfirmationAlert from '../../../components/Alert/ConfirmationAlert';

// const ExpenseManagmentLinesSaveRecord = () => {
//   const route = useRoute();
//   const navigation = useNavigation();
//   const scrollViewRef = useRef(null);

//   const userData = useSelector(state => state.user.userData);
//   const {selectedLegalEntity, defaultLegalEntity} = useSelector(
//     state => state.company,
//   );

//   const effectiveUserData = route.params?.userData || userData || {};
//   const effectiveLegalEntity =
//     selectedLegalEntity ||
//     defaultLegalEntity ||
//     effectiveUserData?.defaultLegalEntity ||
//     '';

//   const {
//     mode = 'create',
//     expenseData = {},
//     employeeId = expenseData.employeeId || effectiveUserData?.employeeId || '',
//     employeeName = expenseData.employeeName ||
//       effectiveUserData?.employeeName ||
//       '',
//     WorkerRecId = expenseData.WorkerRecId ||
//       effectiveUserData?.WorkerRecId ||
//       '',
//     cameFrom = 'MainDashboard',
//     originalCameFrom = null,
//   } = route.params || {};

//   const [categoryOptions, setCategoryOptions] = useState([]);
//   const [currencyOptions, setCurrencyOptions] = useState([]);
//   const [showCalendar, setShowCalendar] = useState(false);
//   const [alertModal, setAlertModal] = useState(false);
//   const [alertMessage, setAlertMessage] = useState('');
//   const [processingButton, setProcessingButton] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [dataFetched, setDataFetched] = useState(false);

//   // NEW: State for confirmation alert
//   const [showCreateNewConfirm, setShowCreateNewConfirm] = useState(false);
//   const [lastCreatedData, setLastCreatedData] = useState(null);

//   // CORRECTED: Proper form data initialization for both create and edit modes
//   const createInitialFormData = () => ({
//     // For CREATE mode
//     recId: expenseData.recId || expenseData.RecId || '',
//     employeeId: employeeId,
//     employeeName: employeeName,
//     WorkerRecId: WorkerRecId,
//     legalEntity: effectiveLegalEntity,
//     transactionDate: new Date().toISOString().split('T')[0] + 'T12:00:00',
//     expenseCategory: '',
//     transactionAmount: '',
//     currency: '',
//     ExpenseReportNumber: expenseData.ExpenseReportNumber || '',

//     // CORRECTED: For UPDATE mode - this is required
//     expenseTransactionNumber: expenseData.expenseTransactionNumber || '',
//   });

//   const [formData, setFormData] = useState(() => createInitialFormData());

//   const goBack = useCallback(() => {
//     if (cameFrom === 'MainDashboard') {
//       navigation.reset({
//         index: 0,
//         routes: [
//           {
//             name: 'TabNavigator',
//             params: {screen: 'MainDashboard'},
//           },
//         ],
//       });
//     } else if (cameFrom === 'ExpenseManagmentLinesListPage') {
//       const targetCameFrom = originalCameFrom || 'DisplayListPage';
//       navigation.reset({
//         index: 0,
//         routes: [
//           {
//             name: 'ExpenseManagmentLinesListPage',
//             params: {
//               employeeId,
//               employeeName,
//               WorkerRecId,
//               cameFrom: targetCameFrom,
//             },
//           },
//         ],
//       });
//     } else {
//       navigation.goBack();
//     }
//   }, [
//     navigation,
//     cameFrom,
//     originalCameFrom,
//     employeeId,
//     employeeName,
//     WorkerRecId,
//   ]);

//   const clearAllStates = useCallback(() => {
//     setCategoryOptions([]);
//     setCurrencyOptions([]);
//     setDataFetched(false);
//     setFormData(createInitialFormData());
//   }, []);

//   const clearFormData = useCallback(() => {
//     setFormData(createInitialFormData());
//   }, []);

//   // NEW: Handle "Yes" from confirmation alert - create new line
//   const handleCreateNewLine = () => {
//     setShowCreateNewConfirm(false);
//     // Clear form for new entry
//     clearFormData();
//     // The user stays on the same page to create another line
//   };

//   // NEW: Handle "No" from confirmation alert - navigate back
//   const handleNavigateBack = () => {
//     setShowCreateNewConfirm(false);
//     if (lastCreatedData) {
//       navigation.navigate('ExpenseManagmentLinesListPage', {
//         expenseReportNumber: lastCreatedData.ExpenseReportNumber,
//         employeeId: lastCreatedData.employeeId,
//         employeeName: lastCreatedData.employeeName,
//         WorkerRecId: lastCreatedData.WorkerRecId,
//         legalEntity: lastCreatedData.legalEntity,
//         userData: route.params?.userData || {
//           employeeId: lastCreatedData.employeeId,
//           employeeName: lastCreatedData.employeeName,
//           WorkerRecId: lastCreatedData.WorkerRecId,
//         },
//         highlightRecId: lastCreatedData.highlightRecId,
//         cameFrom: originalCameFrom || 'ExpenseManagmentLinesSaveRecord',
//       });
//     }
//   };

//   useFocusEffect(
//     useCallback(() => {
//       const onBackPress = () => {
//         goBack();
//         return true;
//       };

//       BackHandler.addEventListener('hardwareBackPress', onBackPress);

//       return () =>
//         BackHandler.removeEventListener('hardwareBackPress', onBackPress);
//     }, [goBack]),
//   );

//   useFocusEffect(
//     useCallback(() => {
//       scrollViewRef.current?.scrollTo({y: 0, animated: false});
//     }, []),
//   );

//   useFocusEffect(
//     useCallback(() => {
//       const initializeData = async () => {
//         if (!dataFetched) {
//           setIsLoading(true);
//           try {
//             await Promise.all([fetchCategoryOptions(), fetchCurrencyOptions()]);
//             setDataFetched(true);
//           } catch (error) {
//             console.error('Error initializing data:', error);
//             setAlertMessage('Failed to initialize data.');
//             setAlertModal(true);
//           } finally {
//             setIsLoading(false);
//           }
//         }

//         // CORRECTED: Proper data initialization for both modes
//         if (mode === 'create') {
//           setFormData(createInitialFormData());
//         } else if (mode === 'edit') {
//           // For edit mode, populate all fields from expenseData
//           setFormData({
//             ...createInitialFormData(),
//             // CORRECTED: Map expense line fields properly
//             transactionDate:
//               expenseData.transactionDate ||
//               new Date().toISOString().split('T')[0] + 'T12:00:00',
//             expenseCategory:
//               expenseData.expenseCategory || expenseData.CostType || '',
//             transactionAmount:
//               expenseData.transactionAmount?.toString() ||
//               expenseData.AmountCurr?.toString() ||
//               '',
//             currency: expenseData.currency || expenseData.ExchangeCode || '',
//             ExpenseReportNumber: expenseData.ExpenseReportNumber || '',
//             // CORRECTED: This is CRITICAL for update
//             expenseTransactionNumber:
//               expenseData.expenseTransactionNumber || '',
//             employeeId: expenseData.employeeId || employeeId,
//             employeeName: expenseData.employeeName || employeeName,
//             WorkerRecId: expenseData.WorkerRecId || WorkerRecId,
//           });
//         }
//       };

//       initializeData();
//     }, [mode, expenseData, employeeId, employeeName, WorkerRecId, dataFetched]),
//   );

//   const handleRefresh = async () => {
//     setIsLoading(true);
//     try {
//       clearFormData();
//       await fetchCategoryOptions(true);
//       await fetchCurrencyOptions(true);
//       setDataFetched(true);
//     } catch (error) {
//       console.error('Error in Save Record Screen', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const fetchCategoryOptions = async (forceRefresh = false) => {
//     try {
//       if (categoryOptions.length > 0 && !forceRefresh) {
//         return;
//       }

//       const categories = await ExpenseCategoryLookup({
//         legalEntity: effectiveLegalEntity,
//       });

//       const formatted = categories.map(cat => ({
//         label: cat.categoryId || 'Unknown Category',
//         value: cat.categoryId || '',
//       }));

//       setCategoryOptions(formatted);
//     } catch (error) {
//       console.error('Error fetching categories:', error);
//       setAlertMessage('Failed to fetch expense category options.');
//       setAlertModal(true);
//     }
//   };

//   const fetchCurrencyOptions = async (forceRefresh = false) => {
//     try {
//       if (currencyOptions.length > 0 && !forceRefresh) {
//         return;
//       }

//       const response = await RetrieveAllCurrency();

//       const formatted = response.map(curr => ({
//         label: curr.CurrencyCode || 'Unknown Currency',
//         value: curr.CurrencyCode || '',
//       }));

//       setCurrencyOptions(formatted);
//     } catch (error) {
//       console.error('Error fetching currencies:', error);
//       setAlertMessage('Failed to fetch currency options.');
//       setAlertModal(true);
//     }
//   };

//   const handleCategoryDropdownFocus = () => {
//     if (categoryOptions.length === 0) {
//       fetchCategoryOptions();
//     }
//   };

//   const handleCurrencyDropdownFocus = () => {
//     if (currencyOptions.length === 0) {
//       fetchCurrencyOptions();
//     }
//   };

//   const handleCategoryChange = item => {
//     setFormData(prev => ({...prev, expenseCategory: item.value}));
//   };

//   const handleCurrencyChange = item => {
//     setFormData(prev => ({...prev, currency: item.value}));
//   };

//   const formatToISOWithTime = date => {
//     const baseDate = new Date(date);
//     const year = baseDate.getFullYear();
//     const month = String(baseDate.getMonth() + 1).padStart(2, '0');
//     const day = String(baseDate.getDate()).padStart(2, '0');
//     return `${year}-${month}-${day}T12:00:00`;
//   };

//   const handleDateChange = date => {
//     const formatted = formatToISOWithTime(date);
//     setFormData(prev => ({
//       ...prev,
//       transactionDate: formatted,
//     }));
//   };

//   const formatDate = date => {
//     if (!date) return '';
//     const d = new Date(date);
//     const month = String(d.getMonth() + 1).padStart(2, '0');
//     const day = String(d.getDate()).padStart(2, '0');
//     const year = d.getFullYear();
//     return `${month}/${day}/${year}`;
//   };

//   const handleInputChange = (field, value) => {
//     setFormData(prev => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   // CORRECTED: handleAction function with proper update logic
//   const handleAction = async (actionType, modalMode, data = {}) => {
//     try {
//       // CRITICAL FIX: Use the exact field names from the .NET code
//       const expenseLineFields = [
//         {
//           FieldName: 'TransDate', // EXACT field name from .NET
//           FieldValue: data.transactionDate.split('T')[0],
//           FieldType: 'Date',
//         },
//         {
//           FieldName: 'AmountCurr', // EXACT field name from .NET
//           FieldValue: String(data.transactionAmount),
//           FieldType: 'Real',
//         },
//         {
//           FieldName: 'CostType', // EXACT field name from .NET
//           FieldValue: data.expenseCategory,
//           FieldType: 'String',
//         },
//         {
//           FieldName: 'ExchangeCode', // EXACT field name from .NET
//           FieldValue: data.currency,
//           FieldType: 'String',
//         },
//         {
//           FieldName: 'ExpenseReportNumber', // EXACT field name from .NET
//           FieldValue: data.ExpenseReportNumber, // Make sure this is provided
//           FieldType: 'String',
//         },
//         {
//           FieldName: 'MerchantId', // EXACT field name from .NET
//           FieldValue: data.merchant || '',
//           FieldType: 'String',
//         },
//         // Optional project fields
//         {
//           FieldName: 'ProjId',
//           FieldValue: data.projId || '',
//           FieldType: 'String',
//         },
//         {
//           FieldName: 'ProjActivityNumber',
//           FieldValue: data.projActivityNumber || '',
//           FieldType: 'String',
//         },
//         {
//           FieldName: 'ProjStatusId',
//           FieldValue: data.projStatusId || '',
//           FieldType: 'String',
//         },
//       ];

//       let response;

//       if (modalMode === 'create') {
//         // CREATE MODE - Use CreateExpenseLine
//         console.log('Calling CreateExpenseLine with correct field names:', {
//           employeeId: data.employeeId || employeeId,
//           legalEntity: data.legalEntity || effectiveLegalEntity,
//           expenseReportNumber: data.ExpenseReportNumber,
//         });

//         response = await CreateExpenseLine({
//           expenseLineFields: expenseLineFields,
//           employeeId: data.employeeId || employeeId,
//           legalEntity: data.legalEntity || effectiveLegalEntity,
//         });
//       } else {
//         // UPDATE MODE - Use UpdateExpenseLine
//         console.log('Calling UpdateExpenseLine with correct field names:', {
//           employeeId: data.employeeId || employeeId,
//           legalEntity: data.legalEntity || effectiveLegalEntity,
//           expenseReportNumber: data.ExpenseReportNumber,
//           expenseTransactionNumber: data.expenseTransactionNumber, // Required for update
//         });

//         // CORRECTED: Better validation for update mode
//         if (!data.expenseTransactionNumber) {
//           const errorMsg =
//             'Error: Expense Transaction Number is required for update. Please provide expenseTransactionNumber in the data.';
//           console.error(errorMsg);
//           setAlertMessage(errorMsg);
//           setAlertModal(true);
//           return {
//             success: false,
//             message: errorMsg,
//           };
//         }

//         response = await UpdateExpenseLine({
//           expenseLineFields: expenseLineFields,
//           employeeId: data.employeeId || employeeId,
//           legalEntity: data.legalEntity || effectiveLegalEntity,
//           expenseTransactionNumber: data.expenseTransactionNumber, // REQUIRED for update
//         });
//       }

//       console.log('API Response:', response);

//       const isSuccess =
//         response?.IsSuccess === true || response?.AlertType === 'Success';

//       if (isSuccess) {
//         const actionText = modalMode === 'create' ? 'Created' : 'Updated';
//         const message =
//           response?.Message || `Expense Line ${actionText} Successfully`;

//         setAlertMessage(message);
//         setAlertModal(true);

//         return {
//           success: true,
//           recId: response.RecId,
//           RecId: response.RecId,
//           expenseLineNum: response.ExpenseLineNumber || '',
//           expenseReportNum:
//             response.ExpenseReportNumber || data.ExpenseReportNumber,
//           lineNumber: response.LineNumber || '',
//         };
//       } else {
//         const actionText = modalMode === 'create' ? 'Creating' : 'Updating';
//         const errorMessage =
//           response?.Message || `Error ${actionText} Expense Line`;

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

//   const handleSave = async actionType => {
//     if (processingButton) return;

//     // CORRECTED: Additional validation for update mode
//     if (mode === 'edit' && !formData.expenseTransactionNumber) {
//       setAlertMessage(
//         'Error: Cannot update expense line. Missing transaction number.',
//       );
//       setAlertModal(true);
//       return;
//     }

//     const missingFields = [];

//     if (!formData.transactionDate) missingFields.push('Transaction Date');
//     if (!formData.expenseCategory) missingFields.push('Expense Category');
//     if (!formData.transactionAmount) missingFields.push('Transaction Amount');
//     if (!formData.currency) missingFields.push('Currency');
//     if (!formData.ExpenseReportNumber)
//       missingFields.push('Expense Report Number');

//     if (missingFields.length > 0) {
//       const message =
//         'Please fill in the following required fields:\n' +
//         missingFields.join('\n');
//       setAlertMessage(message);
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
//         // NEW: Different behavior for create vs update
//         if (mode === 'create') {
//           // For create mode: Show confirmation alert after success
//           setLastCreatedData({
//             ...formData,
//             highlightRecId: result.recId || result.RecId,
//           });
//           setTimeout(() => {
//             setAlertModal(false);
//             setShowCreateNewConfirm(true); // Show the confirmation alert
//           }, 1000);
//         } else {
//           // For update mode: Navigate back immediately (existing behavior)
//           setTimeout(() => {
//             setAlertModal(false);
//             clearAllStates();
//             const highlightRecId = result.recId || result.RecId;
//             navigation.navigate('ExpenseManagmentLinesListPage', {
//               expenseReportNumber: formData.ExpenseReportNumber,
//               employeeId: formData.employeeId,
//               employeeName: formData.employeeName,
//               WorkerRecId: formData.WorkerRecId,
//               legalEntity: formData.legalEntity,
//               userData: route.params?.userData || {
//                 employeeId: formData.employeeId,
//                 employeeName: formData.employeeName,
//                 WorkerRecId: formData.WorkerRecId,
//               },
//               highlightRecId: highlightRecId,
//               cameFrom: originalCameFrom || 'ExpenseManagmentLinesSaveRecord',
//             });
//           }, 2000);
//         }
//       }
//     } catch (error) {
//       console.error('Error saving expense:', error);
//       setAlertMessage('Failed to save expense. Please try again.');
//       setAlertModal(true);
//     } finally {
//       setProcessingButton('');
//     }
//   };

//   return (
//     <ActionPaneContainer
//       pageTitle={
//         mode === 'edit' ? 'Update Expense Line' : 'Create Expense Line'
//       }
//       isBackButton={true}
//       showFooter={false}
//       showFloatingButton={false}
//       isHeaderActive={true}
//       onBackPress={goBack}
//       onRefresh={handleRefresh}>
//       {isLoading ? (
//         <CustomIndicator />
//       ) : (
//         <SafeAreaView style={styles.LReqSR_SafeArea}>
//           <KeyboardAvoidingView
//             behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//             style={styles.LReqSR_ContentWrapper}
//             keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
//             <ScrollView
//               ref={scrollViewRef}
//               contentContainerStyle={styles.LReqSR_FormContainer}
//               showsVerticalScrollIndicator={false}
//               keyboardShouldPersistTaps="handled"
//               nestedScrollEnabled={true}>
//               {/* Debug info for development - shows if we have the required transaction number for update */}
//               {mode === 'edit' && __DEV__ && (
//                 <View
//                   style={{
//                     backgroundColor: '#fff3cd',
//                     padding: 8,
//                     marginBottom: 10,
//                     borderRadius: 4,
//                   }}>
//                   <Text style={{fontSize: 12, color: '#856404'}}>
//                     Update Mode - Transaction Number:{' '}
//                     {formData.expenseTransactionNumber || 'MISSING!'}
//                   </Text>
//                 </View>
//               )}

//               <Text style={styles.LReqSR_Label}>Transaction Date *</Text>
//               <TouchableOpacity
//                 style={styles.LReqSR_DateSelector}
//                 onPress={() => setShowCalendar(true)}>
//                 <View style={{flex: 1}}>
//                   <Text style={styles.LReqSR_DateText}>
//                     {formData.transactionDate
//                       ? formatDate(formData.transactionDate)
//                       : 'Select Transaction Date'}
//                   </Text>
//                 </View>
//                 <Icon name="calendar" size={20} color="#0A66C2" />
//               </TouchableOpacity>
//               <CalendarModal
//                 visible={showCalendar}
//                 current={formData.transactionDate}
//                 onDateSelected={handleDateChange}
//                 onClose={() => setShowCalendar(false)}
//               />

//               <Text style={styles.LReqSR_Label}>Expense Category *</Text>
//               <Dropdown
//                 style={styles.LReqSR_Input}
//                 data={categoryOptions}
//                 labelField="label"
//                 valueField="value"
//                 placeholder="Select Expense Category"
//                 value={formData.expenseCategory}
//                 onFocus={handleCategoryDropdownFocus}
//                 onChange={handleCategoryChange}
//                 placeholderStyle={styles.LReqSR_DropdownPlaceholder}
//                 selectedTextStyle={styles.LReqSR_DropdownSelectedText}
//                 itemTextStyle={styles.LReqSR_DropdownItemText}
//                 activeColor="#E6F0FF"
//                 containerStyle={[
//                   styles.LReqSR_DropdownContainer,
//                   {
//                     marginTop: Platform.OS === 'ios' ? 5 : 2,
//                     zIndex: 1000,
//                   },
//                 ]}
//                 itemContainerStyle={styles.LReqSR_DropdownItemContainer}
//                 maxHeight={280}
//                 dropdownPosition="auto"
//                 search
//                 searchPlaceholder="Search Expense Category"
//                 inputSearchStyle={styles.LReqSR_DropdownSearchInput}
//                 iconStyle={styles.LReqSR_DropdownIcon}
//                 keyboardAvoiding={true}
//               />

//               <Text style={styles.LReqSR_Label}>Transaction Amount *</Text>
//               <TextInput
//                 style={styles.LReqSR_Input}
//                 value={formData.transactionAmount}
//                 onChangeText={value =>
//                   handleInputChange('transactionAmount', value)
//                 }
//                 keyboardType="numeric"
//                 placeholder="Enter transaction amount"
//                 placeholderTextColor="#888"
//               />

//               <Text style={styles.LReqSR_Label}>Currency *</Text>
//               <Dropdown
//                 style={styles.LReqSR_Input}
//                 data={currencyOptions}
//                 labelField="label"
//                 valueField="value"
//                 placeholder="Select Currency"
//                 value={formData.currency}
//                 onFocus={handleCurrencyDropdownFocus}
//                 onChange={handleCurrencyChange}
//                 placeholderStyle={styles.LReqSR_DropdownPlaceholder}
//                 selectedTextStyle={styles.LReqSR_DropdownSelectedText}
//                 itemTextStyle={styles.LReqSR_DropdownItemText}
//                 activeColor="#E6F0FF"
//                 containerStyle={[
//                   styles.LReqSR_DropdownContainer,
//                   {
//                     marginTop: Platform.OS === 'ios' ? 5 : 2,
//                     zIndex: 999,
//                   },
//                 ]}
//                 itemContainerStyle={styles.LReqSR_DropdownItemContainer}
//                 maxHeight={280}
//                 dropdownPosition="auto"
//                 search
//                 searchPlaceholder="Search Currency"
//                 inputSearchStyle={styles.LReqSR_DropdownSearchInput}
//                 iconStyle={styles.LReqSR_DropdownIcon}
//                 keyboardAvoiding={true}
//               />

//               {/* Display Expense Report Number (read-only) */}
//               <Text style={styles.LReqSR_Label}>Expense Report Number</Text>
//               <TextInput
//                 style={[
//                   styles.LReqSR_Input,
//                   {backgroundColor: '#f5f5f5', color: '#666'},
//                 ]}
//                 value={formData.ExpenseReportNumber}
//                 editable={false}
//                 placeholder="Will be auto-filled from parent report"
//                 placeholderTextColor="#888"
//               />
//             </ScrollView>

//             <SaveRecordButtons
//               mode={mode}
//               processingButton={processingButton}
//               onSave={handleSave}
//               onCancel={goBack}
//               isDisabled={
//                 processingButton === 'save' || processingButton === 'submit'
//               }
//               showButtons={[BUTTON_TYPES.CREATE, BUTTON_TYPES.CANCEL]}
//             />
//           </KeyboardAvoidingView>

//           <AlertModal
//             visible={alertModal}
//             heading="Alert"
//             text={alertMessage}
//             onPress={() => setAlertModal(false)}
//           />

//           {/* NEW: Confirmation Alert - Only shows after successful create */}
//           <ConfirmationAlert
//             visible={showCreateNewConfirm}
//             heading="Create Another Expense Line?"
//             text="Do you want to create another expense line for this report?"
//             primaryButtonText="Yes, Create New"
//             secondaryButtonText="No, Go Back"
//             onPrimaryPress={handleCreateNewLine}
//             onSecondaryPress={handleNavigateBack}
//             type="info"
//           />
//         </SafeAreaView>
//       )}
//     </ActionPaneContainer>
//   );
// };

// export default ExpenseManagmentLinesSaveRecord;

/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView,
  BackHandler,
  Platform,
  Animated,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {Dropdown} from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/FontAwesome';

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

  // State Management
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [currencyOptions, setCurrencyOptions] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [processingButton, setProcessingButton] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Confirmation alert state
  const [showCreateNewConfirm, setShowCreateNewConfirm] = useState(false);
  const [lastCreatedData, setLastCreatedData] = useState(null);

  // Form Data Initialization
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

  const goBack = useCallback(() => {
    if (cameFrom === 'ExpenseManagmentLinesListPage') {
      navigation.navigate('ExpenseManagmentLinesListPage', {
        expenseReportNumber: expenseData.ExpenseReportNumber,
        employeeId,
        employeeName,
        WorkerRecId,
        legalEntity: effectiveLegalEntity,
        userData: effectiveUserData,
        cameFrom: originalCameFrom || 'ExpenseManagmentListPage',
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
  ]);

  const clearAllStates = useCallback(() => {
    setCategoryOptions([]);
    setCurrencyOptions([]);
    setDataFetched(false);
    setFormData(createInitialFormData());
  }, []);

  const clearFormData = useCallback(() => {
    setFormData(createInitialFormData());
  }, []);

  // Handle "Yes" from confirmation - create new line
  const handleCreateNewLine = () => {
    setShowCreateNewConfirm(false);
    clearFormData();
  };

  // Handle "No" from confirmation - navigate back
  const handleNavigateBack = () => {
    setShowCreateNewConfirm(false);
    if (lastCreatedData) {
      navigation.navigate('ExpenseManagmentLinesListPage', {
        expenseReportNumber: lastCreatedData.ExpenseReportNumber,
        employeeId: lastCreatedData.employeeId,
        employeeName: lastCreatedData.employeeName,
        WorkerRecId: lastCreatedData.WorkerRecId,
        legalEntity: lastCreatedData.legalEntity,
        userData: effectiveUserData,
        cameFrom: originalCameFrom || 'ExpenseManagmentLinesSaveRecord',
        originalCameFrom: originalCameFrom,
        highlightRecId: lastCreatedData.highlightRecId,
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
        if (!dataFetched) {
          setIsLoading(true);
          // Fade out
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start();

          try {
            await Promise.all([fetchCategoryOptions(), fetchCurrencyOptions()]);
            setDataFetched(true);

            // Fade in
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }).start();
          } catch (error) {
            console.error('Error initializing data:', error);
            setAlertMessage('Failed to initialize data.');
            setAlertModal(true);
          } finally {
            setIsLoading(false);
          }
        }

        if (mode === 'create') {
          setFormData(createInitialFormData());
        } else if (mode === 'edit') {
          setFormData({
            ...createInitialFormData(),
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
            employeeId: expenseData.employeeId || employeeId,
            employeeName: expenseData.employeeName || employeeName,
            WorkerRecId: expenseData.WorkerRecId || WorkerRecId,
          });
        }
      };

      initializeData();
    }, [mode, expenseData, employeeId, employeeName, WorkerRecId, dataFetched]),
  );

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
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
      setAlertMessage('Failed to fetch expense category options.');
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
      setAlertMessage('Failed to fetch currency options.');
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
        const actionText = modalMode === 'create' ? 'Created' : 'Updated';
        const message =
          response?.Message || `Expense Line ${actionText} Successfully`;

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
        const errorMessage =
          response?.Message || `Error ${actionText} Expense Line`;

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
        'Error: Cannot update expense line. Missing transaction number.',
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
      const result = await handleAction(
        actionType,
        mode === 'edit' ? 'update' : 'create',
        formData,
      );

      if (result.success) {
        if (mode === 'create') {
          // For create mode: Show confirmation alert
          setLastCreatedData({
            ...formData,
            highlightRecId: result.recId || result.RecId,
          });
          setTimeout(() => {
            setAlertModal(false);
            setShowCreateNewConfirm(true);
          }, 1500);
        } else {
          // For update mode: Navigate back immediately
          setTimeout(() => {
            setAlertModal(false);
            clearAllStates();
            navigation.navigate('ExpenseManagmentLinesListPage', {
              expenseReportNumber: formData.ExpenseReportNumber,
              employeeId: formData.employeeId,
              employeeName: formData.employeeName,
              WorkerRecId: formData.WorkerRecId,
              legalEntity: formData.legalEntity,
              userData: effectiveUserData,
              cameFrom: originalCameFrom || 'ExpenseManagmentLinesSaveRecord',
              originalCameFrom: originalCameFrom,
              highlightRecId: result.recId || result.RecId,
            });
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      setAlertMessage('Failed to save expense. Please try again.');
      setAlertModal(true);
    } finally {
      setProcessingButton('');
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
      onBackPress={goBack}
      onRefresh={handleRefresh}>
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <Animated.View style={{flex: 1, opacity: fadeAnim}}>
          <SafeAreaView style={styles.LReqSR_SafeArea}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.LReqSR_ContentWrapper}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
              <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.LReqSR_FormContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}>
                {/* <View style={styles.formHeader}>
                  <Text style={styles.formHeaderText}>
                    {mode === 'edit' ? 'Edit Line Details' : 'New Expense Line'}
                  </Text>
                  <Text style={styles.formHeaderSubtext}>
                    Report: {formData.ExpenseReportNumber || 'N/A'}
                  </Text>
                </View> */}

                <Text style={styles.LReqSR_Label}>Transaction Date *</Text>
                <TouchableOpacity
                  style={styles.LReqSR_DateSelector}
                  onPress={() => setShowCalendar(true)}>
                  <View style={{flex: 1}}>
                    <Text style={styles.LReqSR_DateText}>
                      {formData.transactionDate
                        ? formatDate(formData.transactionDate)
                        : 'Select Transaction Date'}
                    </Text>
                  </View>
                  <Icon name="calendar" size={20} color="#0A66C2" />
                </TouchableOpacity>
                <CalendarModal
                  visible={showCalendar}
                  current={formData.transactionDate}
                  onDateSelected={handleDateChange}
                  onClose={() => setShowCalendar(false)}
                />

                <Text style={styles.LReqSR_Label}>Expense Category *</Text>
                <Dropdown
                  style={styles.LReqSR_Input}
                  data={categoryOptions}
                  labelField="label"
                  valueField="value"
                  placeholder="Select Expense Category"
                  value={formData.expenseCategory}
                  onFocus={handleCategoryDropdownFocus}
                  onChange={handleCategoryChange}
                  placeholderStyle={styles.LReqSR_DropdownPlaceholder}
                  selectedTextStyle={styles.LReqSR_DropdownSelectedText}
                  itemTextStyle={styles.LReqSR_DropdownItemText}
                  activeColor="#E6F0FF"
                  containerStyle={[
                    styles.LReqSR_DropdownContainer,
                    {
                      marginTop: Platform.OS === 'ios' ? 5 : 2,
                      zIndex: 1000,
                    },
                  ]}
                  itemContainerStyle={styles.LReqSR_DropdownItemContainer}
                  maxHeight={280}
                  dropdownPosition="auto"
                  search
                  searchPlaceholder="Search Expense Category"
                  inputSearchStyle={styles.LReqSR_DropdownSearchInput}
                  iconStyle={styles.LReqSR_DropdownIcon}
                  keyboardAvoiding={true}
                />

                <Text style={styles.LReqSR_Label}>Transaction Amount *</Text>
                <TextInput
                  style={styles.LReqSR_Input}
                  value={formData.transactionAmount}
                  onChangeText={value =>
                    handleInputChange('transactionAmount', value)
                  }
                  keyboardType="numeric"
                  placeholder="Enter transaction amount"
                  placeholderTextColor="#888"
                />

                <Text style={styles.LReqSR_Label}>Currency *</Text>
                <Dropdown
                  style={styles.LReqSR_Input}
                  data={currencyOptions}
                  labelField="label"
                  valueField="value"
                  placeholder="Select Currency"
                  value={formData.currency}
                  onFocus={handleCurrencyDropdownFocus}
                  onChange={handleCurrencyChange}
                  placeholderStyle={styles.LReqSR_DropdownPlaceholder}
                  selectedTextStyle={styles.LReqSR_DropdownSelectedText}
                  itemTextStyle={styles.LReqSR_DropdownItemText}
                  activeColor="#E6F0FF"
                  containerStyle={[
                    styles.LReqSR_DropdownContainer,
                    {
                      marginTop: Platform.OS === 'ios' ? 5 : 2,
                      zIndex: 999,
                    },
                  ]}
                  itemContainerStyle={styles.LReqSR_DropdownItemContainer}
                  maxHeight={280}
                  dropdownPosition="auto"
                  search
                  searchPlaceholder="Search Currency"
                  inputSearchStyle={styles.LReqSR_DropdownSearchInput}
                  iconStyle={styles.LReqSR_DropdownIcon}
                  keyboardAvoiding={true}
                />

                {/* <Text style={styles.LReqSR_Label}>Merchant (Optional)</Text>
                <TextInput
                  style={styles.LReqSR_Input}
                  value={formData.merchant}
                  onChangeText={value => handleInputChange('merchant', value)}
                  placeholder="Enter merchant name"
                  placeholderTextColor="#888"
                /> */}
              </ScrollView>

              <SaveRecordButtons
                mode={mode}
                processingButton={processingButton}
                onSave={handleSave}
                onCancel={goBack}
                isDisabled={
                  processingButton === 'save' || processingButton === 'submit'
                }
                showButtons={[BUTTON_TYPES.CREATE, BUTTON_TYPES.CANCEL]}
              />
            </KeyboardAvoidingView>

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
              primaryButtonText="Yes, Create New"
              secondaryButtonText="No, Go Back"
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
