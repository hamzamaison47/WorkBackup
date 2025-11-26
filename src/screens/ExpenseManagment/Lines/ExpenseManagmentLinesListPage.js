// /* eslint-disable curly */
// /* eslint-disable no-shadow */
// /* eslint-disable no-unused-vars */
// import React, {useCallback, useState} from 'react';
// import {
//   Text,
//   RefreshControl,
//   ScrollView,
//   StyleSheet,
//   FlatList,
//   View,
//   BackHandler,
// } from 'react-native';
// import {useSelector} from 'react-redux';
// import {
//   useFocusEffect,
//   useNavigation,
//   useRoute,
// } from '@react-navigation/native';

// import {GetAllExpenseLines} from '../../../API/ExpenseManagment/Lines/GetAllExpenseLines';
// import {DeleteExpenseLines} from '../../../API/ExpenseManagment/Lines/DeleteExpenseLines';

// import AlertModal from '../../../components/Alert/AlertModal';
// import DynamicRequestCard from '../../../components/DynamicRequestCard';
// import ActionPaneContainer from '../../../components/ActionPaneContainer';
// import CustomIndicator from '../../../components/CustomIndicator/CustomIndicator';
// import AlertDeleteModal from '../../../components/Alert/AlertDeleteModal';

// const ExpenseManagmentLinesListPage = () => {
//   // State Management
//   const [isLoading, setIsLoading] = useState(false);
//   const [alertModal, setAlertModal] = useState(false);
//   const [alertMessage, setAlertMessage] = useState('');
//   const [expenseLinesData, setExpenseLinesData] = useState([]);
//   const [deleteModal, setDeleteModal] = useState(false);
//   const [itemToDelete, setItemToDelete] = useState(null);
//   const [processingButtons, setProcessingButtons] = useState({});

//   // Navigation and Route
//   const navigation = useNavigation();
//   const route = useRoute();
//   const {
//     expenseReportNumber,
//     employeeId,
//     employeeName,
//     legalEntity,
//     WorkerRecId,
//     cameFrom,
//     expenseReportData,
//   } = route.params || {};

//   // Redux Selectors
//   const {userData} = useSelector(state => state.user);
//   const {selectedLegalEntity} = useSelector(state => state.company);

//   const effectiveUserData = expenseReportData || userData;

//   // Use effective user data for all operations
//   const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
//   const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;
//   const effectiveWorkerRecId = WorkerRecId || effectiveUserData?.WorkerRecId;

//   useFocusEffect(
//     useCallback(() => {
//       const onBackPress = () => {
//         navigation.navigate('ExpenseManagmentListPage');
//         return true;
//       };

//       BackHandler.addEventListener('hardwareBackPress', onBackPress);

//       return () =>
//         BackHandler.removeEventListener('hardwareBackPress', onBackPress);
//     }, [navigation]),
//   );

//   // Constants - Configure for expense lines display based on actual API response
//   const CARD_CONFIG = {
//     headerConfig: {
//       title: {key: 'ExpenseType', label: 'Expense Type'},
//       subtitle: {key: 'Description', label: 'Description'},
//     },
//     fields: [
//       {key: 'TransDate', label: 'Date', type: 'date'},
//       {key: 'AmountCurr', label: 'Amount', type: 'currency'},
//       {key: 'ExchangeCode', label: 'Currency', type: 'text'},
//     ],
//     expandableFields: [
//       {key: 'LineNumber', label: 'Line Number', type: 'text'},
//       {key: 'ExpenseType', label: 'Expense Type', type: 'text'},
//       {key: 'CostType', label: 'Cost Type', type: 'text'},
//       {key: 'Description', label: 'Description', type: 'text'},
//       {key: 'TransDate', label: 'Transaction Date', type: 'date'},
//       {key: 'AmountCurr', label: 'Amount (Currency)', type: 'currency'},
//       {key: 'AmountMST', label: 'Amount (Company)', type: 'currency'},
//       {key: 'ExchangeCode', label: 'Currency', type: 'text'},
//       {key: 'PayMethod', label: 'Payment Method', type: 'text'},
//       {key: 'MerchantId', label: 'Merchant', type: 'text'},
//       {key: 'ApprovalStatus', label: 'Status', type: 'text'},
//       {key: 'ExpenseTransactionNumber', label: 'Transaction #', type: 'text'},
//     ],
//   };

//   // Helper Functions
//   const cleanJsonPlaceholder = value => {
//     if (!value) return '';
//     const jsonPlaceholderPattern =
//       /{"@_i:type":"c:string","@_xmlns:c":"http:\/\/www\.w3\.org\/2001\/XMLSchema"}/;
//     if (typeof value === 'string' && jsonPlaceholderPattern.test(value)) {
//       return '';
//     }
//     return value;
//   };

//   const formatDate = dateString => {
//     if (!dateString || dateString === '1900-01-01T00:00:00') return 'N/A';
//     try {
//       const date = new Date(dateString);
//       return date.toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: 'short',
//         day: 'numeric',
//       });
//     } catch (error) {
//       return dateString;
//     }
//   };

//   const formatCurrency = (amount, currency = 'USD') => {
//     if (!amount || amount === '0') return '$0.00';
//     try {
//       const numericAmount = parseFloat(amount);
//       return `$${numericAmount.toFixed(2)}`;
//     } catch (error) {
//       return amount;
//     }
//   };

//   const getStatusLabel = status => {
//     const statusMap = {
//       Draft: 'Draft',
//       Submitted: 'Submitted',
//       Approved: 'Approved',
//       Rejected: 'Rejected',
//       Paid: 'Paid',
//     };
//     return statusMap[status] || status || 'Draft';
//   };

//   const setButtonProcessing = (recId, buttonType, isProcessing) => {
//     setProcessingButtons(prev => ({
//       ...prev,
//       [recId]: isProcessing
//         ? [...(prev[recId] || []), buttonType]
//         : (prev[recId] || []).filter(btn => btn !== buttonType),
//     }));
//   };

//   // Data Fetching - Get Expense Lines for the specific report
//   const fetchExpenseLinesData = useCallback(async () => {
//     if (!employeeId || !expenseReportNumber) {
//       const errorMsg = 'Missing required parameters to fetch expense lines';
//       console.log(errorMsg, {employeeId, expenseReportNumber});
//       setAlertMessage(errorMsg);
//       setAlertModal(true);
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const expenseLines = await GetAllExpenseLines({
//         employeeId: employeeId,
//         expenseReportNumber: expenseReportNumber,
//         legalEntity: legalEntity || selectedLegalEntity,
//       });

//       setExpenseLinesData(expenseLines || []);

//       if (!expenseLines || expenseLines.length === 0) {
//         const noDataMsg = `No expense lines found for report ${expenseReportNumber}`;
//         console.log(noDataMsg);
//         setAlertMessage(noDataMsg);
//         setAlertModal(true);
//       }
//     } catch (error) {
//       console.error('Failed to fetch Expense Lines data:', error);
//       const errorMsg = `Failed to fetch expense lines: ${error.message}`;
//       setAlertMessage(errorMsg);
//       setAlertModal(true);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [employeeId, expenseReportNumber, legalEntity, selectedLegalEntity]);

//   useFocusEffect(
//     useCallback(() => {
//       fetchExpenseLinesData();
//     }, [fetchExpenseLinesData]),
//   );

//   // Button Handlers
//   const getButtonConfig = item => {
//     // Use ApprovalStatus for expense lines (not DocumentStatus)
//     const isDraft = item.ApprovalStatus === 'Draft';

//     return {
//       edit: {
//         show: true,
//         position: 'header',
//         style: 'icon',
//         icon: 'edit',
//         iconSize: 20,
//         iconColor: '#fff',
//         disabled: !isDraft,
//         customStyle: !isDraft ? {backgroundColor: '#BDBDBD'} : {},
//       },
//       delete: {
//         show: isDraft,
//         position: 'header',
//         style: 'icon',
//         icon: 'trash',
//         iconSize: 20,
//         iconColor: '#fff',
//         disabled: !isDraft,
//         customStyle: !isDraft ? {backgroundColor: '#BDBDBD'} : {},
//       },
//     };
//   };

//   const handleButtonPress = (buttonType, itemData) => {
//     switch (buttonType) {
//       case 'edit':
//         handleEditPress(itemData);
//         break;
//       case 'delete':
//         handleDeletePress(itemData);
//         break;
//       default:
//         console.log('Unknown button pressed:', buttonType);
//     }
//   };

//   // CORRECTED: Handle create Expense Line
//   const handleCreateExpense = () => {
//     navigation.navigate('ExpenseManagmentLinesSaveRecord', {
//       mode: 'create',
//       employeeId: effectiveEmployeeId,
//       employeeName: effectiveEmployeeName,
//       WorkerRecId: effectiveWorkerRecId,
//       userData: effectiveUserData,
//       cameFrom: 'ExpenseManagmentLinesListPage',
//       expenseData: {
//         employeeId: effectiveEmployeeId,
//         employeeName: effectiveEmployeeName,
//         WorkerRecId: effectiveWorkerRecId,
//         ExpenseReportNumber: expenseReportNumber, // Pass the report number
//         legalEntity: legalEntity || selectedLegalEntity,
//         // Expense line specific fields
//         transactionDate: new Date().toISOString().split('T')[0],
//         transactionAmount: 0,
//         expenseCategory: '',
//         currency: 'USD',
//         merchant: '',
//         description: '',
//       },
//     });
//   };

//   // CORRECTED: Handle edit Expense Line
//   const handleEditPress = itemData => {
//     navigation.navigate('ExpenseManagmentLinesSaveRecord', {
//       mode: 'edit',
//       employeeId: effectiveEmployeeId,
//       employeeName: effectiveEmployeeName,
//       WorkerRecId: effectiveWorkerRecId,
//       userData: effectiveUserData,
//       cameFrom: 'ExpenseManagmentLinesListPage',
//       expenseData: {
//         // Expense line identifier for update
//         expenseTransactionNumber: itemData.ExpenseTransactionNumber,

//         // Required fields for the form
//         employeeId: effectiveEmployeeId,
//         employeeName: effectiveEmployeeName,
//         WorkerRecId: effectiveWorkerRecId,
//         ExpenseReportNumber: expenseReportNumber, // From parent report
//         legalEntity: legalEntity || selectedLegalEntity,

//         // Expense line data for pre-filling the form
//         transactionDate:
//           itemData.TransDate || new Date().toISOString().split('T')[0],
//         transactionAmount: parseFloat(itemData.AmountCurr) || 0,
//         expenseCategory: itemData.CostType || '',
//         currency: itemData.ExchangeCode || 'USD',
//         merchant: itemData.MerchantId || '',
//         description: itemData.Description || '',

//         // Additional fields if needed
//         recId: itemData.RecId,
//         lineNumber: itemData.LineNumber,
//       },
//     });
//   };

//   const handleDeletePress = itemData => {
//     setItemToDelete(itemData);
//     setDeleteModal(true);
//   };

//   const handleDeleteConfirm = async () => {
//     if (!itemToDelete) return;

//     // Use RecId as the unique identifier for processing
//     const itemId = itemToDelete.RecId || itemToDelete.ExpenseTransactionNumber;
//     setButtonProcessing(itemId, 'delete', true);

//     try {
//       const result = await DeleteExpenseLines({
//         employeeId: employeeId || userData?.employeeId,
//         expenseTransactionNumbers: [itemToDelete.ExpenseTransactionNumber],
//         legalEntity: legalEntity || selectedLegalEntity,
//       });

//       if (result.success) {
//         setAlertMessage(
//           `Expense line ${itemToDelete.ExpenseTransactionNumber} deleted successfully`,
//         );
//         // Remove from local state immediately
//         setExpenseLinesData(prev =>
//           prev.filter(
//             line =>
//               line.ExpenseTransactionNumber !==
//               itemToDelete.ExpenseTransactionNumber,
//           ),
//         );
//       } else {
//         setAlertMessage('Unable to delete expense line. Please try again.');
//       }
//     } catch (error) {
//       console.error('Delete expense line error:', error);
//       setAlertMessage(`Failed to delete expense line: ${error.message}`);
//     } finally {
//       const itemId =
//         itemToDelete.RecId || itemToDelete.ExpenseTransactionNumber;
//       setButtonProcessing(itemId, 'delete', false);
//       setDeleteModal(false);
//       setItemToDelete(null);
//       setAlertModal(true);
//       setTimeout(() => {
//         fetchExpenseLinesData();
//       }, 1000);
//     }
//   };

//   // Component Renderers
//   const renderExpenseLineCard = ({item, index}) => {
//     const itemProcessingButtons = processingButtons[item.RecId] || [];

//     // Process the item data to clean and format values
//     const processedItem = {
//       ...item,
//       // Clean JSON placeholder values
//       Description: cleanJsonPlaceholder(item.Description),
//       ExpenseType: cleanJsonPlaceholder(item.ExpenseType),
//       CostType: cleanJsonPlaceholder(item.CostType),
//       MerchantId: cleanJsonPlaceholder(item.MerchantId),
//       PayMethod: cleanJsonPlaceholder(item.PayMethod),

//       // Format values
//       AmountCurr: formatCurrency(item.AmountCurr, item.ExchangeCode),
//       AmountMST: formatCurrency(item.AmountMST, item.ExchangeCode),
//       TransDate: formatDate(item.TransDate),
//       ExchangeCode: item.ExchangeCode || 'USD',
//       ApprovalStatus: getStatusLabel(item.ApprovalStatus),
//       LineNumber: item.LineNumber || `Line ${index + 1}`,

//       // Add any additional formatting needed
//       createdDateTime: formatDate(item.createdDateTime),
//       modifiedDateTime: formatDate(item.modifiedDateTime),
//     };

//     return (
//       <DynamicRequestCard
//         data={processedItem}
//         headerConfig={CARD_CONFIG.headerConfig}
//         fields={CARD_CONFIG.fields}
//         expandableFields={CARD_CONFIG.expandableFields}
//         buttons={getButtonConfig(item)}
//         onButtonPress={handleButtonPress}
//         isExpandable={true}
//         gradientColors={['#f0f8ff', '#e6f3ff', '#d9edff']}
//         isClickable={false} // Lines are not clickable
//         processingButtons={itemProcessingButtons}
//       />
//     );
//   };

//   const handleGoBack = () => {
//     navigation.goBack();
//   };

//   const handleRefresh = () => {
//     fetchExpenseLinesData();
//   };

//   // Get page title with report number
//   const getPageTitle = () => {
//     return `Expense Lines - ${expenseReportNumber || 'Report'}`;
//   };

//   // Calculate total amount
//   const getTotalAmount = () => {
//     const total = expenseLinesData.reduce((sum, line) => {
//       return sum + (parseFloat(line.AmountCurr) || 0);
//     }, 0);
//     return formatCurrency(total);
//   };

//   // Main Render
//   return (
//     <ActionPaneContainer
//       pageTitle={getPageTitle()}
//       showFooter
//       showFloatingButton={true}
//       isHeaderActive
//       onBackPress={handleGoBack}
//       onRefresh={handleRefresh}
//       onFloatingButtonPress={handleCreateExpense}>
//       {/* Summary Header */}
//       {!isLoading && (
//         <View style={styles.summaryContainer}>
//           <Text style={styles.summaryText}>
//             Total Amount: {getTotalAmount()}
//           </Text>
//           <Text style={styles.reportInfo}>
//             Report: {expenseReportNumber} • {expenseLinesData.length} line(s)
//           </Text>
//         </View>
//       )}

//       {/* Loading State */}
//       {isLoading && <CustomIndicator />}

//       {/* Data State */}
//       {!isLoading && expenseLinesData.length > 0 && (
//         <FlatList
//           data={expenseLinesData}
//           renderItem={renderExpenseLineCard}
//           keyExtractor={(item, index) =>
//             item.RecId?.toString() ||
//             item.ExpenseTransactionNumber?.toString() ||
//             `line-${index}`
//           }
//           contentContainerStyle={styles.listContainer}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
//           }
//         />
//       )}

//       {/* Empty State */}
//       {!isLoading && expenseLinesData.length === 0 && (
//         <ScrollView
//           contentContainerStyle={styles.noDataContainer}
//           refreshControl={
//             <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
//           }>
//           <Text style={styles.noDataText}>No Expense Lines Found</Text>
//           <Text style={styles.noDataSubText}>
//             {expenseReportNumber
//               ? `No expense lines found for report ${expenseReportNumber}`
//               : 'No expense report selected'}
//           </Text>
//         </ScrollView>
//       )}

//       {/* Modals */}
//       <AlertModal
//         visible={alertModal}
//         heading="Expense Lines"
//         text={alertMessage}
//         onPress={() => setAlertModal(false)}
//       />

//       <AlertDeleteModal
//         visible={deleteModal}
//         heading="Confirm Deletion"
//         text={`Are you sure you want to delete expense line ${
//           itemToDelete?.ExpenseTransactionNumber || ''
//         }?`}
//         onPress={handleDeleteConfirm}
//         onCancel={() => {
//           setDeleteModal(false);
//           setItemToDelete(null);
//         }}
//       />
//     </ActionPaneContainer>
//   );
// };

// const styles = StyleSheet.create({
//   summaryContainer: {
//     backgroundColor: '#e8f4fd',
//     padding: 12,
//     marginHorizontal: 10,
//     marginTop: 10,
//     borderRadius: 8,
//     borderLeftWidth: 4,
//     borderLeftColor: '#0A66C2',
//   },
//   summaryText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#0A66C2',
//     textAlign: 'center',
//   },
//   reportInfo: {
//     fontSize: 12,
//     color: '#666',
//     textAlign: 'center',
//     marginTop: 4,
//   },
//   listContainer: {
//     padding: 10,
//   },
//   noDataContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   noDataText: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#666',
//     textAlign: 'center',
//     marginBottom: 10,
//   },
//   noDataSubText: {
//     fontSize: 14,
//     color: '#999',
//     textAlign: 'center',
//     marginBottom: 10,
//   },
// });

// export default ExpenseManagmentLinesListPage;

/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useCallback, useState} from 'react';
import {
  Text,
  RefreshControl,
  ScrollView,
  StyleSheet,
  FlatList,
  View,
  BackHandler,
  Animated,
} from 'react-native';
import {useSelector} from 'react-redux';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';

import {GetAllExpenseLines} from '../../../API/ExpenseManagment/Lines/GetAllExpenseLines';
import {DeleteExpenseLines} from '../../../API/ExpenseManagment/Lines/DeleteExpenseLines';

import AlertModal from '../../../components/Alert/AlertModal';
import DynamicRequestCard from '../../../components/DynamicRequestCard';
import ActionPaneContainer from '../../../components/ActionPaneContainer';
import CustomIndicator from '../../../components/CustomIndicator/CustomIndicator';
import AlertDeleteModal from '../../../components/Alert/AlertDeleteModal';

const ExpenseManagmentLinesListPage = () => {
  // Navigation and Route
  const navigation = useNavigation();
  const route = useRoute();

  const {
    expenseReportNumber,
    expenseReportRecId,
    employeeId,
    employeeName,
    legalEntity,
    WorkerRecId,
    cameFrom,
    originalCameFrom,
    expenseReportData,
    userData: routeUserData,
    highlightRecId,
  } = route.params || {};

  // Redux Selectors
  const reduxUserData = useSelector(state => state.user.userData);
  const {selectedLegalEntity} = useSelector(state => state.company);

  const effectiveUserData = routeUserData || expenseReportData || reduxUserData;
  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
  const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;
  const effectiveWorkerRecId = WorkerRecId || effectiveUserData?.WorkerRecId;
  const effectiveLegalEntity = legalEntity || selectedLegalEntity;

  // State Management
  const [isLoading, setIsLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [expenseLinesData, setExpenseLinesData] = useState([]);
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [processingButtons, setProcessingButtons] = useState({});
  const [highlightedRecId, setHighlightedRecId] = useState(null);

  // Card Configuration
  const CARD_CONFIG = {
    headerConfig: {
      title: {key: 'ExpenseType', label: 'Expense Type'},
      subtitle: {key: 'Description', label: 'Description'},
    },
    fields: [
      {key: 'TransDate', label: 'Date', type: 'date'},
      {key: 'AmountCurr', label: 'Amount', type: 'currency'},
      {key: 'ExchangeCode', label: 'Currency', type: 'text'},
    ],
    expandableFields: [
      {key: 'LineNumber', label: 'Line Number', type: 'text'},
      {key: 'ExpenseType', label: 'Expense Type', type: 'text'},
      {key: 'CostType', label: 'Cost Type', type: 'text'},
      {key: 'Description', label: 'Description', type: 'text'},
      {key: 'TransDate', label: 'Transaction Date', type: 'date'},
      {key: 'AmountCurr', label: 'Amount (Currency)', type: 'currency'},
      {key: 'AmountMST', label: 'Amount (Company)', type: 'currency'},
      {key: 'ExchangeCode', label: 'Currency', type: 'text'},
      {key: 'PayMethod', label: 'Payment Method', type: 'text'},
      {key: 'MerchantId', label: 'Merchant', type: 'text'},
      {key: 'ApprovalStatus', label: 'Status', type: 'text'},
      {key: 'ExpenseTransactionNumber', label: 'Transaction #', type: 'text'},
    ],
  };

  // Helper Functions
  const cleanJsonPlaceholder = value => {
    if (!value) return '';
    const jsonPlaceholderPattern =
      /{"@_i:type":"c:string","@_xmlns:c":"http:\/\/www\.w3\.org\/2001\/XMLSchema"}/;
    if (typeof value === 'string' && jsonPlaceholderPattern.test(value)) {
      return '';
    }
    return value;
  };

  const formatDate = dateString => {
    if (!dateString || dateString === '1900-01-01T00:00:00') return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount || amount === '0') return '$0.00';
    try {
      const numericAmount = parseFloat(amount);
      return `$${numericAmount.toFixed(2)}`;
    } catch (error) {
      return amount;
    }
  };

  const getStatusLabel = status => {
    const statusMap = {
      Draft: 'Draft',
      Submitted: 'Submitted',
      Approved: 'Approved',
      Rejected: 'Rejected',
      Paid: 'Paid',
    };
    return statusMap[status] || status || 'Draft';
  };

  const setButtonProcessing = (recId, buttonType, isProcessing) => {
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: isProcessing
        ? [...(prev[recId] || []), buttonType]
        : (prev[recId] || []).filter(btn => btn !== buttonType),
    }));
  };

  const normalizeRecId = item => item.recId || item.RecId || '';

  // Data Fetching with Animation
  const fetchExpenseLinesData = useCallback(async () => {
    if (!effectiveEmployeeId || !expenseReportNumber) {
      const errorMsg = 'Missing required parameters to fetch expense lines';
      console.log(errorMsg, {
        employeeId: effectiveEmployeeId,
        expenseReportNumber,
      });
      setAlertMessage(errorMsg);
      setAlertModal(true);
      return;
    }

    setIsLoading(true);
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();

    try {
      const expenseLines = await GetAllExpenseLines({
        employeeId: effectiveEmployeeId,
        expenseReportNumber: expenseReportNumber,
        legalEntity: effectiveLegalEntity,
      });

      setExpenseLinesData(expenseLines || []);

      // Fade in after data loaded
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      if (!expenseLines || expenseLines.length === 0) {
        console.log(`No expense lines found for report ${expenseReportNumber}`);
      }
    } catch (error) {
      console.error('Failed to fetch Expense Lines data:', error);
      const errorMsg = `Failed to fetch expense lines: ${error.message}`;
      setAlertMessage(errorMsg);
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveEmployeeId, expenseReportNumber, effectiveLegalEntity]);

  useFocusEffect(
    useCallback(() => {
      fetchExpenseLinesData();
    }, [fetchExpenseLinesData]),
  );

  // Handle highlighting
  useFocusEffect(
    useCallback(() => {
      if (highlightRecId) {
        setHighlightedRecId(highlightRecId);
        fetchExpenseLinesData();

        const timer = setTimeout(() => {
          setHighlightedRecId(null);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }, [highlightRecId, fetchExpenseLinesData]),
  );

  // Handle back navigation
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleGoBack();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation]),
  );

  const handleGoBack = () => {
    navigation.navigate('ExpenseManagmentListPage', {
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: effectiveUserData,
      cameFrom: originalCameFrom || cameFrom,
      // highlightRecId: expenseReportRecId,
    });
  };

  // Button Configuration
  const getButtonConfig = item => {
    const isDraft = item.ApprovalStatus === 'Draft';

    return {
      edit: {
        show: true,
        position: 'header',
        style: 'icon',
        icon: 'edit',
        iconSize: 20,
        iconColor: '#fff',
        disabled: !isDraft,
        customStyle: !isDraft ? {backgroundColor: '#BDBDBD'} : {},
      },
      delete: {
        show: isDraft,
        position: 'header',
        style: 'icon',
        icon: 'trash',
        iconSize: 20,
        iconColor: '#fff',
        disabled: !isDraft,
        customStyle: !isDraft ? {backgroundColor: '#BDBDBD'} : {},
      },
    };
  };

  const handleButtonPress = (buttonType, itemData) => {
    switch (buttonType) {
      case 'edit':
        handleEditPress(itemData);
        break;
      case 'delete':
        handleDeletePress(itemData);
        break;
      default:
        console.log('Unknown button pressed:', buttonType);
    }
  };

  // FIXED: Create Expense Line Handler
  const handleCreateExpense = () => {
    navigation.navigate('ExpenseManagmentLinesSaveRecord', {
      mode: 'create',
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: effectiveUserData,
      legalEntity: effectiveLegalEntity,
      cameFrom: 'ExpenseManagmentLinesListPage',
      originalCameFrom: originalCameFrom || cameFrom,
      expenseData: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
        ExpenseReportNumber: expenseReportNumber,
        legalEntity: effectiveLegalEntity,
        transactionDate: new Date().toISOString().split('T')[0],
        transactionAmount: 0,
        expenseCategory: '',
        currency: 'USD',
        merchant: '',
        description: '',
      },
    });
  };

  // FIXED: Edit Handler with all params
  const handleEditPress = itemData => {
    const itemRecId = normalizeRecId(itemData);

    navigation.navigate('ExpenseManagmentLinesSaveRecord', {
      mode: 'edit',
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: effectiveUserData,
      legalEntity: effectiveLegalEntity,
      cameFrom: 'ExpenseManagmentLinesListPage',
      originalCameFrom: originalCameFrom || cameFrom,
      expenseData: {
        recId: itemRecId,
        expenseTransactionNumber: itemData.ExpenseTransactionNumber,
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
        ExpenseReportNumber: expenseReportNumber,
        legalEntity: effectiveLegalEntity,
        transactionDate:
          itemData.TransDate || new Date().toISOString().split('T')[0],
        transactionAmount: parseFloat(itemData.AmountCurr) || 0,
        expenseCategory: itemData.CostType || '',
        currency: itemData.ExchangeCode || 'USD',
        merchant: itemData.MerchantId || '',
        description: itemData.Description || '',
        lineNumber: itemData.LineNumber,
      },
    });
  };

  const handleDeletePress = itemData => {
    setItemToDelete(itemData);
    setDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    const itemId = normalizeRecId(itemToDelete);
    setButtonProcessing(itemId, 'delete', true);

    try {
      const result = await DeleteExpenseLines({
        employeeId: effectiveEmployeeId,
        expenseTransactionNumbers: [itemToDelete.ExpenseTransactionNumber],
        legalEntity: effectiveLegalEntity,
      });

      if (result.success) {
        setAlertMessage(
          `Expense line ${itemToDelete.ExpenseTransactionNumber} deleted successfully`,
        );
        setExpenseLinesData(prev =>
          prev.filter(
            line =>
              line.ExpenseTransactionNumber !==
              itemToDelete.ExpenseTransactionNumber,
          ),
        );
      } else {
        setAlertMessage('Unable to delete expense line. Please try again.');
      }
    } catch (error) {
      console.error('Delete expense line error:', error);
      setAlertMessage(`Failed to delete expense line: ${error.message}`);
    } finally {
      setButtonProcessing(itemId, 'delete', false);
      setDeleteModal(false);
      setItemToDelete(null);
      setAlertModal(true);
      setTimeout(() => {
        fetchExpenseLinesData();
      }, 1000);
    }
  };

  // Component Renderers
  const renderExpenseLineCard = ({item, index}) => {
    const itemRecId = normalizeRecId(item);
    const itemProcessingButtons = processingButtons[itemRecId] || [];
    const isHighlighted = highlightedRecId === itemRecId;

    const processedItem = {
      ...item,
      recId: itemRecId,
      Description: cleanJsonPlaceholder(item.Description),
      ExpenseType: cleanJsonPlaceholder(item.ExpenseType),
      CostType: cleanJsonPlaceholder(item.CostType),
      MerchantId: cleanJsonPlaceholder(item.MerchantId),
      PayMethod: cleanJsonPlaceholder(item.PayMethod),
      AmountCurr: formatCurrency(item.AmountCurr, item.ExchangeCode),
      AmountMST: formatCurrency(item.AmountMST, item.ExchangeCode),
      TransDate: formatDate(item.TransDate),
      ExchangeCode: item.ExchangeCode || 'USD',
      ApprovalStatus: getStatusLabel(item.ApprovalStatus),
      LineNumber: item.LineNumber || `Line ${index + 1}`,
      createdDateTime: formatDate(item.createdDateTime),
      modifiedDateTime: formatDate(item.modifiedDateTime),
    };

    return (
      <DynamicRequestCard
        data={processedItem}
        headerConfig={CARD_CONFIG.headerConfig}
        fields={CARD_CONFIG.fields}
        expandableFields={CARD_CONFIG.expandableFields}
        buttons={getButtonConfig(item)}
        onButtonPress={handleButtonPress}
        isExpandable={true}
        gradientColors={['#f0f8ff', '#e6f3ff', '#d9edff']}
        highlightGradientColors={['#E8F5E8', '#F0FFF0']}
        isClickable={false}
        processingButtons={itemProcessingButtons}
        isHighlighted={isHighlighted}
      />
    );
  };

  const handleRefresh = () => {
    fetchExpenseLinesData();
  };

  const getPageTitle = () => {
    return `Expense Lines - ${expenseReportNumber || 'Report'}`;
  };

  const getTotalAmount = () => {
    const total = expenseLinesData.reduce((sum, line) => {
      return sum + (parseFloat(line.AmountCurr) || 0);
    }, 0);
    return formatCurrency(total);
  };

  // Main Render
  return (
    <ActionPaneContainer
      pageTitle={getPageTitle()}
      showFooter
      showFloatingButton={true}
      isHeaderActive
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={handleCreateExpense}>
      {/* Loading State */}
      {isLoading && <CustomIndicator />}

      {/* Animated Content */}
      {!isLoading && (
        <Animated.View style={{flex: 1, opacity: fadeAnim}}>
          {/* Summary Header */}
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>
              Total Amount: {getTotalAmount()}
            </Text>
            {/* <Text style={styles.reportInfo}>
              Report: {expenseReportNumber} • {expenseLinesData.length} line(s)
            </Text> */}
          </View>

          {/* Data State */}
          {expenseLinesData.length > 0 && (
            <FlatList
              data={expenseLinesData}
              renderItem={renderExpenseLineCard}
              keyExtractor={(item, index) => {
                const itemRecId = normalizeRecId(item);
                return (
                  itemRecId?.toString() ||
                  item.ExpenseTransactionNumber?.toString() ||
                  `line-${index}`
                );
              }}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isLoading}
                  onRefresh={handleRefresh}
                />
              }
            />
          )}

          {/* Empty State */}
          {expenseLinesData.length === 0 && (
            <ScrollView
              contentContainerStyle={styles.noDataContainer}
              refreshControl={
                <RefreshControl
                  refreshing={isLoading}
                  onRefresh={handleRefresh}
                />
              }>
              <Text style={styles.noDataText}>No Expense Lines</Text>
              <Text style={styles.noDataSubText}>
                Tap the + button to add your first expense line
              </Text>
            </ScrollView>
          )}
        </Animated.View>
      )}

      {/* Modals */}
      <AlertModal
        visible={alertModal}
        heading="Expense Lines"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />

      <AlertDeleteModal
        visible={deleteModal}
        heading="Confirm Deletion"
        text={`Are you sure you want to delete expense line ${
          itemToDelete?.ExpenseTransactionNumber || ''
        }?`}
        onPress={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModal(false);
          setItemToDelete(null);
        }}
      />
    </ActionPaneContainer>
  );
};

const styles = StyleSheet.create({
  summaryContainer: {
    backgroundColor: '#bfe3ffff',
    padding: 12,
    marginHorizontal: 10,
    marginTop: 10,
    // marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0A66C2',

    // *** Bottom Shadow ***
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3}, // pushes shadow downward
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4, // for Android
  },

  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A66C2',
    textAlign: 'center',
  },
  reportInfo: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  listContainer: {
    padding: 10,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0A66C2',
    textAlign: 'center',
    marginBottom: 8,
  },
  noDataSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default ExpenseManagmentLinesListPage;
