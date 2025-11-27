// /* eslint-disable curly */
// /* eslint-disable no-unused-vars */
// /* eslint-disable react-hooks/exhaustive-deps */
// import React, {useCallback, useState} from 'react';
// import {
//   Text,
//   RefreshControl,
//   ScrollView,
//   StyleSheet,
//   FlatList,
//   Pressable,
//   BackHandler,
// } from 'react-native';
// import {useSelector} from 'react-redux';
// import {
//   useFocusEffect,
//   useNavigation,
//   useRoute,
// } from '@react-navigation/native';

// import {GetAllExpenseReports} from '../../../API/ExpenseManagment/Headers/GetAllExpenseReports';
// import {DeleteExpenseReports} from '../../../API/ExpenseManagment/Headers/DeleteExpenseReports';
// import SubmitExpenseReportsToWorkflow from '../../../API/ExpenseManagment/Headers/SubmitExpenseReportsToWorkflow';

// import AlertModal from '../../../components/Alert/AlertModal';
// import DynamicRequestCard from '../../../components/DynamicRequestCard';
// import ActionPaneContainer from '../../../components/ActionPaneContainer';
// import CustomIndicator from '../../../components/CustomIndicator/CustomIndicator';
// import AlertDeleteModal from '../../../components/Alert/AlertDeleteModal';

// const ExpenseManagmentListPage = () => {
//   const navigation = useNavigation();
//   const route = useRoute();

//   const {
//     employeeId,
//     employeeName,
//     WorkerRecId,
//     cameFrom,
//     highlightRecId,
//     userData: routeUserData,
//   } = route.params || {};

//   // Get userData from Redux as fallback
//   const reduxUserData = useSelector(state => state.user.userData);
//   const {selectedLegalEntity} = useSelector(state => state.company);

//   const effectiveUserData = routeUserData || reduxUserData;

//   // Use effective user data for all operations
//   const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
//   const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;
//   const effectiveWorkerRecId = WorkerRecId || effectiveUserData?.WorkerRecId;

//   // State Management
//   const [isLoading, setIsLoading] = useState(false);
//   const [alertModal, setAlertModal] = useState(false);
//   const [alertMessage, setAlertMessage] = useState('');
//   const [expenseData, setExpenseData] = useState([]);
//   const [processingButtons, setProcessingButtons] = useState({});
//   const [deleteModal, setDeleteModal] = useState(false);
//   const [itemToDelete, setItemToDelete] = useState(null);
//   const [highlightedRecId, setHighlightedRecId] = useState(null);

//   // Constants
//   const CARD_CONFIG = {
//     headerConfig: {
//       title: {key: 'ExpenseReportNumber'},
//       subtitle: {key: 'Purpose'},
//     },
//     fields: [
//       {key: 'Location', label: 'Location', type: 'text'},
//       {key: 'AmountTotal', label: 'Total Amount', type: 'currency'},
//       {key: 'DocumentStatus', label: '', type: 'status'},
//     ],
//     expandableFields: [
//       {key: 'ExpenseReportNumber', label: 'Report Number', type: 'text'},
//       {key: 'PaymentDate', label: 'Payment Date', type: 'date'},
//       {key: 'createdDateTime', label: 'Created Date', type: 'date'},
//     ],
//   };

//   const STATUS_MAP = {
//     Draft: 'Draft',
//     Submitted: 'Submitted',
//     Approved: 'Approved',
//     Rejected: 'Rejected',
//     Paid: 'Paid',
//     Pending: 'Pending Approval',
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

//   const getStatusLabel = status => {
//     return STATUS_MAP[status] || status || 'Draft';
//   };

//   const formatDate = dateString => {
//     if (!dateString || dateString === '1900-01-01T00:00:00') return 'N/A';
//     try {
//       const date = new Date(dateString);
//       return date.toLocaleDateString();
//     } catch (error) {
//       return dateString;
//     }
//   };

//   const setButtonProcessing = (recId, buttonType, isProcessing) => {
//     setProcessingButtons(prev => ({
//       ...prev,
//       [recId]: isProcessing
//         ? [...(prev[recId] || []), buttonType]
//         : (prev[recId] || []).filter(btn => btn !== buttonType),
//     }));
//   };

//   // Data Fetching
//   const fetchExpenseData = useCallback(async () => {
//     if (!effectiveEmployeeId) {
//       console.log('No employee ID found');
//       return;
//     }

//     setIsLoading(true);
//     try {
//       const myExpenseHeaderData = await GetAllExpenseReports({
//         employeeId: effectiveEmployeeId,
//         legalEntity: selectedLegalEntity,
//       });

//       // Sort by createdDateTime descending (newest first)
//       const sortedData = (myExpenseHeaderData || []).sort((a, b) => {
//         const dateA = new Date(a.createdDateTime || a.CreatedDate || 0);
//         const dateB = new Date(b.createdDateTime || b.CreatedDate || 0);
//         return dateB - dateA; // Descending order
//       });

//       setExpenseData(sortedData);

//       if (!myExpenseHeaderData || myExpenseHeaderData.length === 0) {
//         console.log('No expense reports found for this user');
//       }
//     } catch (error) {
//       console.error('Failed to fetch Expense Management data:', error);
//       setAlertMessage(`Failed to fetch data: ${error.message}`);
//       setAlertModal(true);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [effectiveEmployeeId, selectedLegalEntity]);

//   // Refresh data when screen comes into focus
//   useFocusEffect(
//     useCallback(() => {
//       fetchExpenseData();
//     }, [fetchExpenseData]),
//   );

//   // Handle highlighting of records
//   // Handle highlighting of records
//   useFocusEffect(
//     useCallback(() => {
//       if (highlightRecId) {
//         setHighlightedRecId(highlightRecId);
//         fetchExpenseData();

//         const timer = setTimeout(() => {
//           setHighlightedRecId(null);
//         }, 3000);

//         return () => clearTimeout(timer);
//       }
//     }, [highlightRecId, fetchExpenseData]),
//   );

//   // Handle back navigation
//   useFocusEffect(
//     useCallback(() => {
//       const onBackPress = () => {
//         handleGoBack();
//         return true;
//       };

//       BackHandler.addEventListener('hardwareBackPress', onBackPress);

//       return () =>
//         BackHandler.removeEventListener('hardwareBackPress', onBackPress);
//     }, [navigation]),
//   );

//   // Handle back navigation
//   const handleGoBack = () => {
//     let targetRoute = 'MainDashboard'; // default

//     switch (cameFrom) {
//       case 'MainDashboard':
//         targetRoute = 'MainDashboard';
//         break;
//       case 'DisplayListPage':
//         targetRoute = 'DisplayListPage';
//         break;
//       case 'DrawerNavigator':
//         targetRoute = 'MainDashboard';
//         break;
//       case 'WorkerAssignedToMe':
//         targetRoute = 'WorkerAssignedToMe';
//         break;
//       default:
//         navigation.goBack();
//         return; // exit early
//     }

//     navigation.reset({
//       index: 0, // top of the stack
//       routes: [{name: 'TabNavigator', params: {screen: targetRoute}}],
//     });
//   };

//   // Card Click Handler
//   const handleCardPress = itemData => {
//     // Navigate to ExpenseManagmentLinesListPage with the selected expense report data
//     navigation.navigate('ExpenseManagmentLinesListPage', {
//       expenseReportNumber: itemData.ExpenseReportNumber,
//       employeeId: effectiveEmployeeId,
//       employeeName: effectiveEmployeeName,
//       WorkerRecId: effectiveWorkerRecId,
//       legalEntity: selectedLegalEntity,
//       expenseReportData: itemData,
//       userData: effectiveUserData,
//       cameFrom: 'ExpenseManagmentListPage',
//       originalCameFrom: cameFrom,
//     });
//   };

//   // Handle create Expense
//   const handleCreateExpense = () => {
//     navigation.navigate('ExpenseManagementHeaderSaveRecord', {
//       mode: 'create',
//       employeeId: effectiveEmployeeId,
//       employeeName: effectiveEmployeeName,
//       WorkerRecId: effectiveWorkerRecId,
//       userData: effectiveUserData,
//       cameFrom: 'ExpenseManagmentListPage',
//       originalCameFrom: cameFrom,
//       expenseData: {
//         employeeId: effectiveEmployeeId,
//         employeeName: effectiveEmployeeName,
//         WorkerRecId: effectiveWorkerRecId,
//         recId: '',
//         legalEntity: selectedLegalEntity || '',
//         location: '',
//         purpose: '',
//         expenseDate: '',
//         description: '',
//       },
//     });
//   };

//   // Button Handlers
//   const getButtonConfig = item => {
//     const isDraft = item.DocumentStatus === 'Draft';
//     const isSubmitted =
//       item.DocumentStatus === 'Submitted' || item.DocumentStatus === 'Approved';

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
//         show: true,
//         position: 'header',
//         style: 'icon',
//         icon: 'trash',
//         iconSize: 20,
//         iconColor: '#fff',
//         disabled: !isDraft,
//         customStyle: !isDraft ? {backgroundColor: '#BDBDBD'} : {},
//       },
//       submit: {
//         show: isDraft,
//         position: 'bottom',
//         style: 'text',
//         icon: 'send',
//         iconSize: 16,
//         text: 'Submit',
//         textColor: '#0A66C2',
//         iconColor: '#0A66C2',
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
//       case 'submit':
//         handleSubmitPress(itemData);
//         break;
//       default:
//         console.log('Unknown button pressed:', buttonType);
//     }
//   };

//   const handleEditPress = itemData => {
//     navigation.navigate('ExpenseManagementHeaderSaveRecord', {
//       mode: 'edit',
//       employeeId: itemData.employeeId || effectiveEmployeeId,
//       employeeName: itemData.employeeName || effectiveEmployeeName,
//       WorkerRecId: itemData.WorkerRecId || effectiveWorkerRecId,
//       userData: route.params?.userData || effectiveUserData,
//       cameFrom: 'ExpenseManagmentListPage',
//       originalCameFrom: cameFrom,
//       expenseData: {
//         recId: itemData.recId,
//         employeeId: itemData.employeeId || effectiveEmployeeId,
//         employeeName: itemData.employeeName || effectiveEmployeeName,
//         WorkerRecId: itemData.WorkerRecId || effectiveWorkerRecId,
//         legalEntity: itemData.LegalEntity || selectedLegalEntity,
//         location: itemData.Location,
//         purpose: itemData.Purpose,
//         ExpenseReportNumber: itemData.ExpenseReportNumber, // Important for update
//       },
//     });
//   };

//   const handleDeletePress = itemData => {
//     setItemToDelete(itemData);
//     setDeleteModal(true);
//   };

//   const handleSubmitPress = async itemData => {
//     setButtonProcessing(itemData.recId, 'submit', true);

//     try {
//       const result = await SubmitExpenseReportsToWorkflow({
//         expenseReportNumberList: [itemData.ExpenseReportNumber],
//         legalEntity: selectedLegalEntity,
//       });

//       if (result.success) {
//         setAlertMessage(
//           `Expense report ${itemData.ExpenseReportNumber} submitted successfully`,
//         );

//         // FIXED: Use correct recId field name
//         setHighlightedRecId(itemData.recId || itemData.RecId);

//         // Set a timer to remove highlighting after 3 seconds
//         setTimeout(() => {
//           setHighlightedRecId(null);
//         }, 3000);

//         setTimeout(() => fetchExpenseData(), 1000);
//       } else {
//         setAlertMessage(
//           result.message ||
//             `Failed to submit expense report ${itemData.ExpenseReportNumber}`,
//         );
//       }
//     } catch (error) {
//       console.error('Submit error:', error);
//       setAlertMessage(`Failed to submit expense report: ${error.message}`);
//     } finally {
//       setButtonProcessing(itemData.recId, 'submit', false);
//       setAlertModal(true);
//     }
//   };

//   const handleDeleteConfirm = async () => {
//     if (!itemToDelete) return;

//     setButtonProcessing(itemToDelete.recId, 'delete', true);

//     try {
//       const result = await DeleteExpenseReports({
//         employeeId: effectiveEmployeeId,
//         expenseReportNumbers: [itemToDelete.ExpenseReportNumber],
//         legalEntity: selectedLegalEntity,
//       });

//       if (result.success) {
//         setAlertMessage(
//           `Expense report ${itemToDelete.ExpenseReportNumber} deleted successfully`,
//         );
//         // Remove from local state immediately
//         setExpenseData(prev =>
//           prev.filter(expense => expense.recId !== itemToDelete.recId),
//         );
//       } else {
//         setAlertMessage('Unable to delete expense report. Please try again.');
//       }
//     } catch (error) {
//       console.error('Delete expense report error:', error);
//       setAlertMessage('Failed to delete expense report. Please try again.');
//     } finally {
//       setButtonProcessing(itemToDelete.recId, 'delete', false);
//       setDeleteModal(false);
//       setItemToDelete(null);
//       setAlertModal(true);
//       setTimeout(() => {
//         fetchExpenseData();
//       }, 1000);
//     }
//   };

//   const handleRefresh = () => {
//     fetchExpenseData();
//   };

//   // Component Renderers
//   const renderExpenseCard = ({item}) => {
//     // FIXED: Handle both recId and RecId field names
//     const itemRecId = item.recId || item.RecId;
//     const itemProcessingButtons = processingButtons[itemRecId] || [];
//     const isHighlighted = highlightedRecId === itemRecId;

//     const processedItem = {
//       ...item,
//       Description: cleanJsonPlaceholder(item.Description),
//       Location: cleanJsonPlaceholder(item.Location),
//       Purpose: cleanJsonPlaceholder(item.Purpose),
//       Title: cleanJsonPlaceholder(item.Title),
//       CustomerAccount: cleanJsonPlaceholder(item.CustomerAccount),
//       Invoice: cleanJsonPlaceholder(item.Invoice),
//       PaymentVoucher: cleanJsonPlaceholder(item.PaymentVoucher),
//       PreApprovalNumber: cleanJsonPlaceholder(item.PreApprovalNumber),
//       VendorAccount: cleanJsonPlaceholder(item.VendorAccount),
//       DocumentStatus: getStatusLabel(item.DocumentStatus),
//       AmountTotal: item.AmountTotal
//         ? `$${parseFloat(item.AmountTotal).toFixed(2)}`
//         : '$0.00',
//       PaymentDate: formatDate(item.PaymentDate),
//       createdDateTime: formatDate(item.createdDateTime),
//       employeeId: item.employeeId || effectiveEmployeeId,
//       employeeName: item.employeeName || effectiveEmployeeName,
//       // FIXED: Ensure recId is consistently available
//       recId: itemRecId,
//     };

//     return (
//       <Pressable
//         onPress={() => handleCardPress(processedItem)}
//         style={({pressed}) => [
//           styles.cardContainer,
//           {opacity: pressed ? 0.8 : 1},
//         ]}>
//         <DynamicRequestCard
//           data={processedItem}
//           headerConfig={CARD_CONFIG.headerConfig}
//           fields={CARD_CONFIG.fields}
//           expandableFields={CARD_CONFIG.expandableFields}
//           buttons={getButtonConfig(item)}
//           onButtonPress={handleButtonPress}
//           isExpandable={true}
//           gradientColors={['#6ee0ff', '#bddeff', '#cce6ff']}
//           highlightGradientColors={['#E8F5E8', '#F0FFF0']}
//           processingButtons={itemProcessingButtons}
//           isHighlighted={isHighlighted}
//           isClickable={true}
//         />
//       </Pressable>
//     );
//   };

//   // Main Render
//   return (
//     <ActionPaneContainer
//       pageTitle="Expense Management"
//       isBackButton={false}
//       showFooter={true}
//       showFloatingButton={true}
//       isHeaderActive={true}
//       onBackPress={handleGoBack}
//       onRefresh={handleRefresh}
//       onFloatingButtonPress={handleCreateExpense}>
//       {/* Loading State */}
//       {isLoading && <CustomIndicator />}

//       {/* Data State */}
//       {!isLoading && expenseData.length > 0 && (
//         <FlatList
//           data={expenseData}
//           renderItem={renderExpenseCard}
//           keyExtractor={(item, index) => {
//             const itemRecId = item.recId || item.RecId;
//             return (
//               itemRecId?.toString() ||
//               item.ExpenseReportNumber?.toString() ||
//               index.toString()
//             );
//           }}
//           contentContainerStyle={styles.listContainer}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
//           }
//         />
//       )}

//       {/* Empty State */}
//       {!isLoading && expenseData.length === 0 && (
//         <ScrollView
//           contentContainerStyle={styles.noDataContainer}
//           refreshControl={
//             <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
//           }>
//           <Text style={styles.noDataText}>No Data Found</Text>
//         </ScrollView>
//       )}

//       {/* Modals */}
//       <AlertModal
//         visible={alertModal}
//         heading="Alert"
//         text={alertMessage}
//         onPress={() => setAlertModal(false)}
//       />

//       <AlertDeleteModal
//         visible={deleteModal}
//         heading="Confirm Deletion"
//         text="Are you sure you want to delete this expense report?"
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
//   listContainer: {
//     padding: 10,
//   },
//   cardContainer: {
//     marginBottom: 10,
//   },
//   noDataContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   noDataText: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#cccccc',
//     textAlign: 'center',
//   },
// });

// export default ExpenseManagmentListPage;

/* eslint-disable curly */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useCallback, useState} from 'react';
import {
  Text,
  RefreshControl,
  ScrollView,
  StyleSheet,
  FlatList,
  Pressable,
  BackHandler,
  Animated,
} from 'react-native';
import {useSelector} from 'react-redux';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';

import {GetAllExpenseReports} from '../../../API/ExpenseManagment/Headers/GetAllExpenseReports';
import {DeleteExpenseReports} from '../../../API/ExpenseManagment/Headers/DeleteExpenseReports';
import SubmitExpenseReportsToWorkflow from '../../../API/ExpenseManagment/Headers/SubmitExpenseReportsToWorkflow';

import AlertModal from '../../../components/Alert/AlertModal';
import DynamicRequestCard from '../../../components/DynamicRequestCard';
import ActionPaneContainer from '../../../components/ActionPaneContainer';
import CustomIndicator from '../../../components/CustomIndicator/CustomIndicator';
import AlertDeleteModal from '../../../components/Alert/AlertDeleteModal';

const ExpenseManagmentListPage = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    employeeId,
    employeeName,
    WorkerRecId,
    cameFrom,
    highlightRecId,
    userData: routeUserData,
  } = route.params || {};

  // Redux
  const reduxUserData = useSelector(state => state.user.userData);
  const {selectedLegalEntity} = useSelector(state => state.company);

  const effectiveUserData = routeUserData || reduxUserData;
  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
  const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;
  const effectiveWorkerRecId = WorkerRecId || effectiveUserData?.WorkerRecId;

  // State Management
  const [isLoading, setIsLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [expenseData, setExpenseData] = useState([]);
  const [processingButtons, setProcessingButtons] = useState({});
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [highlightedRecId, setHighlightedRecId] = useState(null);

  // Card Configuration
  const CARD_CONFIG = {
    headerConfig: {
      title: {key: 'ExpenseReportNumber'},
      // subtitle: {key: 'Purpose'},
    },
    fields: [
      {key: 'Location', label: 'Location', type: 'text'},
      {key: 'Purpose', label: 'Purpose', type: 'text'},
      {key: 'DocumentStatus', label: '', type: 'status'},
    ],
    // expandableFields: [
    //   {key: 'PaymentDate', label: 'Payment Date', type: 'date'},
    //   {key: 'createdDateTime', label: 'Created Date', type: 'date'},
    // ],
  };

  const STATUS_MAP = {
    Draft: 'Draft',
    Submitted: 'Submitted',
    Approved: 'Approved',
    Rejected: 'Rejected',
    Paid: 'Paid',
    Pending: 'Pending Approval',
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

  const getStatusLabel = status => STATUS_MAP[status] || status || 'Draft';

  const formatDate = dateString => {
    if (!dateString || dateString === '1900-01-01T00:00:00') return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  };

  const setButtonProcessing = (recId, buttonType, isProcessing) => {
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: isProcessing
        ? [...(prev[recId] || []), buttonType]
        : (prev[recId] || []).filter(btn => btn !== buttonType),
    }));
  };

  // Normalize RecId - handle both recId and RecId
  const normalizeRecId = item => item.recId || item.RecId || '';

  // Data Fetching with Animation
  const fetchExpenseData = useCallback(async () => {
    if (!effectiveEmployeeId) {
      console.log('No employee ID found');
      return;
    }

    setIsLoading(true);
    // Start fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();

    try {
      const myExpenseHeaderData = await GetAllExpenseReports({
        employeeId: effectiveEmployeeId,
        legalEntity: selectedLegalEntity,
      });

      // Sort by createdDateTime descending
      const sortedData = (myExpenseHeaderData || []).sort((a, b) => {
        const dateA = new Date(a.createdDateTime || a.CreatedDate || 0);
        const dateB = new Date(b.createdDateTime || b.CreatedDate || 0);
        return dateB - dateA;
      });

      setExpenseData(sortedData);

      // Fade in after data is loaded
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      if (!myExpenseHeaderData || myExpenseHeaderData.length === 0) {
        console.log('No expense reports found for this user');
      }
    } catch (error) {
      console.error('Failed to fetch Expense Management data:', error);
      setAlertMessage(`Failed to fetch data: ${error.message}`);
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveEmployeeId, selectedLegalEntity]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchExpenseData();
    }, [fetchExpenseData]),
  );

  // Handle highlighting of records
  useFocusEffect(
    useCallback(() => {
      if (highlightRecId) {
        setHighlightedRecId(highlightRecId);
        fetchExpenseData();

        const timer = setTimeout(() => {
          setHighlightedRecId(null);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }, [highlightRecId, fetchExpenseData]),
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
    let targetRoute = 'MainDashboard';

    switch (cameFrom) {
      case 'MainDashboard':
        targetRoute = 'MainDashboard';
        break;
      case 'DisplayListPage':
        targetRoute = 'DisplayListPage';
        break;
      case 'DrawerNavigator':
        targetRoute = 'MainDashboard';
        break;
      case 'WorkerAssignedToMe':
        targetRoute = 'WorkerAssignedToMe';
        break;
      default:
        navigation.goBack();
        return;
    }

    navigation.reset({
      index: 0,
      routes: [{name: 'TabNavigator', params: {screen: targetRoute}}],
    });
  };

  // FIXED: Card Click Handler - Navigate to Lines with all required params
  const handleCardPress = itemData => {
    const itemRecId = normalizeRecId(itemData);

    navigation.navigate('ExpenseManagmentLinesListPage', {
      expenseReportNumber: itemData.ExpenseReportNumber,
      expenseReportRecId: itemRecId, // Pass the RecId consistently
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      legalEntity: selectedLegalEntity,
      expenseReportData: {
        ...itemData,
        recId: itemRecId, // Normalize
      },
      userData: effectiveUserData,
      cameFrom: 'ExpenseManagmentListPage',
      originalCameFrom: cameFrom,
    });
  };

  // FIXED: Create Expense Handler
  const handleCreateExpense = () => {
    navigation.navigate('ExpenseManagementHeaderSaveRecord', {
      mode: 'create',
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: effectiveUserData,
      legalEntity: selectedLegalEntity,
      cameFrom: 'ExpenseManagmentListPage',
      originalCameFrom: cameFrom,
      expenseData: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
        legalEntity: selectedLegalEntity || '',
        location: '',
        purpose: '',
      },
    });
  };

  // Button Configuration
  const getButtonConfig = item => {
    const isDraft = item.DocumentStatus === 'Draft';
    const isSubmitted =
      item.DocumentStatus === 'Submitted' || item.DocumentStatus === 'Approved';

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
        show: true,
        position: 'header',
        style: 'icon',
        icon: 'trash',
        iconSize: 20,
        iconColor: '#fff',
        disabled: !isDraft,
        customStyle: !isDraft ? {backgroundColor: '#BDBDBD'} : {},
      },
      submit: {
        show: isDraft,
        position: 'bottom',
        style: 'text',
        icon: 'send',
        iconSize: 16,
        text: 'Submit',
        textColor: '#0A66C2',
        iconColor: '#0A66C2',
        customStyle: {
          transform: [{translateY: -30}],
        },
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
      case 'submit':
        handleSubmitPress(itemData);
        break;
      default:
        console.log('Unknown button pressed:', buttonType);
    }
  };

  // FIXED: Edit Handler with proper params
  const handleEditPress = itemData => {
    const itemRecId = normalizeRecId(itemData);

    navigation.navigate('ExpenseManagementHeaderSaveRecord', {
      mode: 'edit',
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: effectiveUserData,
      legalEntity: selectedLegalEntity,
      cameFrom: 'ExpenseManagmentListPage',
      originalCameFrom: cameFrom,
      expenseData: {
        recId: itemRecId,
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
        legalEntity: itemData.LegalEntity || selectedLegalEntity,
        location: itemData.Location,
        purpose: itemData.Purpose,
        ExpenseReportNumber: itemData.ExpenseReportNumber,
      },
    });
  };

  const handleDeletePress = itemData => {
    setItemToDelete(itemData);
    setDeleteModal(true);
  };

  const handleSubmitPress = async itemData => {
    const itemRecId = normalizeRecId(itemData);
    setButtonProcessing(itemRecId, 'submit', true);

    try {
      const result = await SubmitExpenseReportsToWorkflow({
        expenseReportNumberList: [itemData.ExpenseReportNumber],
        legalEntity: selectedLegalEntity,
      });

      if (result.success) {
        setAlertMessage(
          `Expense report ${itemData.ExpenseReportNumber} submitted successfully`,
        );
        setHighlightedRecId(itemRecId);

        setTimeout(() => {
          setHighlightedRecId(null);
        }, 3000);

        setTimeout(() => fetchExpenseData(), 1000);
      } else {
        setAlertMessage(
          result.message ||
            `Failed to submit expense report ${itemData.ExpenseReportNumber}`,
        );
      }
    } catch (error) {
      console.error('Submit error:', error);
      setAlertMessage(`Failed to submit expense report: ${error.message}`);
    } finally {
      setButtonProcessing(itemRecId, 'submit', false);
      setAlertModal(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    const itemRecId = normalizeRecId(itemToDelete);
    setButtonProcessing(itemRecId, 'delete', true);

    try {
      const result = await DeleteExpenseReports({
        employeeId: effectiveEmployeeId,
        expenseReportNumbers: [itemToDelete.ExpenseReportNumber],
        legalEntity: selectedLegalEntity,
      });

      if (result.success) {
        setAlertMessage(
          `Expense report ${itemToDelete.ExpenseReportNumber} deleted successfully`,
        );
        setExpenseData(prev =>
          prev.filter(expense => normalizeRecId(expense) !== itemRecId),
        );
      } else {
        setAlertMessage('Unable to delete expense report. Please try again.');
      }
    } catch (error) {
      console.error('Delete expense report error:', error);
      setAlertMessage('Failed to delete expense report. Please try again.');
    } finally {
      setButtonProcessing(itemRecId, 'delete', false);
      setDeleteModal(false);
      setItemToDelete(null);
      setAlertModal(true);
      setTimeout(() => {
        fetchExpenseData();
      }, 1000);
    }
  };

  const handleRefresh = () => {
    fetchExpenseData();
  };

  // Component Renderers
  const renderExpenseCard = ({item}) => {
    const itemRecId = normalizeRecId(item);
    const itemProcessingButtons = processingButtons[itemRecId] || [];
    const isHighlighted = highlightedRecId === itemRecId;

    const processedItem = {
      ...item,
      recId: itemRecId, // Normalize
      Description: cleanJsonPlaceholder(item.Description),
      Location: cleanJsonPlaceholder(item.Location),
      Purpose: cleanJsonPlaceholder(item.Purpose),
      Title: cleanJsonPlaceholder(item.Title),
      CustomerAccount: cleanJsonPlaceholder(item.CustomerAccount),
      Invoice: cleanJsonPlaceholder(item.Invoice),
      PaymentVoucher: cleanJsonPlaceholder(item.PaymentVoucher),
      PreApprovalNumber: cleanJsonPlaceholder(item.PreApprovalNumber),
      VendorAccount: cleanJsonPlaceholder(item.VendorAccount),
      DocumentStatus: getStatusLabel(item.DocumentStatus),
      AmountTotal: item.AmountTotal
        ? `$${parseFloat(item.AmountTotal).toFixed(2)}`
        : '$0.00',
      PaymentDate: formatDate(item.PaymentDate),
      createdDateTime: formatDate(item.createdDateTime),
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
    };

    return (
      <Pressable
        onPress={() => handleCardPress(processedItem)}
        style={({pressed}) => [
          styles.cardContainer,
          {opacity: pressed ? 0.85 : 1},
        ]}>
        <DynamicRequestCard
          data={processedItem}
          headerConfig={CARD_CONFIG.headerConfig}
          fields={CARD_CONFIG.fields}
          expandableFields={CARD_CONFIG.expandableFields}
          buttons={getButtonConfig(item)}
          onButtonPress={handleButtonPress}
          isExpandable={true}
          gradientColors={['#6ee0ff', '#bddeff', '#cce6ff']}
          highlightGradientColors={['#E8F5E8', '#F0FFF0']}
          processingButtons={itemProcessingButtons}
          isHighlighted={isHighlighted}
          isClickable={true}
          showNavigationArrow={true}
        />
      </Pressable>
    );
  };

  // Main Render
  return (
    <ActionPaneContainer
      pageTitle="Expense Management"
      isBackButton={false}
      showFooter={true}
      showFloatingButton={true}
      isHeaderActive={true}
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={handleCreateExpense}>
      {/* Loading State */}
      {isLoading && <CustomIndicator />}

      {/* Animated Data State */}
      {!isLoading && expenseData.length > 0 && (
        <Animated.View style={{flex: 1, opacity: fadeAnim}}>
          <FlatList
            data={expenseData}
            renderItem={renderExpenseCard}
            keyExtractor={(item, index) => {
              const itemRecId = normalizeRecId(item);
              return (
                itemRecId?.toString() ||
                item.ExpenseReportNumber?.toString() ||
                index.toString()
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
        </Animated.View>
      )}

      {/* Empty State with Animation */}
      {!isLoading && expenseData.length === 0 && (
        <Animated.View style={{flex: 1, opacity: fadeAnim}}>
          <ScrollView
            contentContainerStyle={styles.noDataContainer}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={handleRefresh}
              />
            }>
            <Text style={styles.noDataText}>No Expense Reports</Text>
            <Text style={styles.noDataSubText}>
              Tap the + button to create your first expense report
            </Text>
          </ScrollView>
        </Animated.View>
      )}

      {/* Modals */}
      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />

      <AlertDeleteModal
        visible={deleteModal}
        heading="Confirm Deletion"
        text="Are you sure you want to delete this expense report?"
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
  listContainer: {
    padding: 10,
  },
  cardContainer: {
    marginBottom: 10,
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

export default ExpenseManagmentListPage;
