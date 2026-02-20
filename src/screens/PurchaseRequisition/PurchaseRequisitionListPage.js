// /* eslint-disable react-native/no-inline-styles */
// /* eslint-disable react-hooks/exhaustive-deps */
// /* eslint-disable curly */
// import React, {useState, useCallback} from 'react';
// import {
//   Text,
//   FlatList,
//   BackHandler,
//   RefreshControl,
//   View,
//   ActivityIndicator,
// } from 'react-native';
// import {
//   useNavigation,
//   useRoute,
//   useFocusEffect,
// } from '@react-navigation/native';

// import AlertModal from '../../components/Alert/AlertModal';
// import AlertDeleteModal from '../../components/Alert/AlertDeleteModal';
// import AlertSubmitModal from '../../components/PurchaseRequisition/AlertSubmitModal';
// import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
// import ActionPaneContainer from '../../components/ActionPaneContainer';
// import PRHeaderList from '../../components/PurchaseRequisition/PRHeaderList';
// import styles from '../../styles/styles';

// import {retrievePurchaseRequisitionByMe} from '../../API/PurchaseRequisition/PurchaseRequisitionListPage';
// import deletePurchaseRequisition from '../../API/PurchaseRequisition/PurchaseRequisitionDeleteRecord';
// import {submitPurchaseRequisition} from '../../API/PurchaseRequisition/PurchaseRequisitionSubmitRecord';
// import {updatePurchaseRequisition} from '../../API/PurchaseRequisition/PurchaseRequisitionUpdateRecord';

// import {useSelector} from 'react-redux';
// import {ScrollView} from 'react-native-gesture-handler';

// const PurchaseRequisitionListPage = () => {
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
//   const effectiveUserData = routeUserData || reduxUserData;

//   // Use effective user data for all operations
//   const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
//   const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;
//   const effectiveWorkerRecId = WorkerRecId || effectiveUserData?.WorkerRecId;

//   const [isLoading, setIsLoading] = useState(false);
//   const [purchaseRequisitiondata, setPurchaseRequisitionData] = useState([]);
//   const [alertModal, setAlertModal] = useState(false);
//   const [alertMessage, setAlertMessage] = useState('');
//   const [deleteModal, setDeleteModal] = useState(false);
//   const [highlightedRecId, setHighlightedRecId] = useState(null);
//   const [itemToDelete, setItemToDelete] = useState(null);
//   const [submitModal, setSubmitModal] = useState(false);
//   const [itemToSubmit, setItemToSubmit] = useState(null);
//   const [processingButtons, setProcessingButtons] = useState({});
//   const [isProcessing, setIsProcessing] = useState(false);

//   const fetchPurchaseRequisitionData = useCallback(async () => {
//     if (!effectiveEmployeeId) return;

//     setIsLoading(true);
//     try {
//       const PurchaseRequisitiondata = await retrievePurchaseRequisitionByMe({
//         employeeId: effectiveEmployeeId,
//       });

//       // // ✅ Sort newest record on top
//       // BankAccountData.sort((a, b) => (b.recId || 0) - (a.recId || 0));

//       setPurchaseRequisitionData(PurchaseRequisitiondata);
//     } catch (error) {
//       setAlertMessage('Failed to fetch data.');
//       setAlertModal(true);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [effectiveEmployeeId]);

//   // Refresh data when screen comes into focus
//   useFocusEffect(
//     useCallback(() => {
//       fetchPurchaseRequisitionData();
//     }, [fetchPurchaseRequisitionData]),
//   );

//   useFocusEffect(
//     useCallback(() => {
//       if (highlightRecId) {
//         setHighlightedRecId(highlightRecId);
//         fetchPurchaseRequisitionData();

//         const timer = setTimeout(() => {
//           setHighlightedRecId(null);
//         }, 3000);

//         return () => clearTimeout(timer);
//       }
//     }, [highlightRecId, fetchPurchaseRequisitionData]),
//   );

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

//   const setButtonProcessing = (recId, action, isProcessing) => {
//     setProcessingButtons(prev => {
//       const updated = {...prev};

//       if (isProcessing) {
//         // Add this action for this RecId
//         updated[recId] = [...(updated[recId] || []), action];
//       } else {
//         // Remove the action from this RecId
//         updated[recId] = (updated[recId] || []).filter(a => a !== action);

//         // Clean up if empty
//         if (updated[recId].length === 0) delete updated[recId];
//       }

//       return updated;
//     });
//   };

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

//   // Handle refresh
//   const handleRefresh = () => {
//     fetchPurchaseRequisitionData();
//   };

//   const handleSubmitRequest = item => {
//     setItemToSubmit(item);
//     setSubmitModal(true);
//   };

//   const handleConfirmSubmit = async () => {
//     if (!itemToSubmit?.PurchReqId) {
//       setAlertMessage('Invalid record selected for submission');
//       setAlertModal(true);
//       setSubmitModal(false);
//       setItemToSubmit(null);
//       return;
//     }

//     setSubmitModal(false); // ✅ Close modal first
//     setIsProcessing(true); // ✅ Show processing overlay

//     try {
//       // Start processing on the submit button for this record
//       setButtonProcessing(itemToSubmit.RecId, 'submit', true);
//       const response = await submitPurchaseRequisition({
//         _requestList: [itemToSubmit.PurchReqId], // string[]
//       });

//       console.log('PR-Submit-Item -->', itemToSubmit);
//       console.log('PR-Submit-Response -->', response);

//       // Normalize the result
//       const resObj = Array.isArray(response) ? response[0] : response;

//       // ✔ Success Condition (like your BankAccount code)
//       if (resObj && String(resObj.IsSuccess).toLowerCase() === 'true') {
//         setAlertMessage('Request submitted successfully.');
//         setAlertModal(true);

//         // highlight the row (UI feedback)
//         setHighlightedRecId(itemToSubmit.RecId);

//         setTimeout(() => {
//           setHighlightedRecId(null);
//         }, 3000);

//         // Refresh the list after short delay
//         setTimeout(() => {
//           fetchPurchaseRequisitionData();
//         }, 1000);
//       } else {
//         // Failed — show server message if exists
//         const errorMessage = resObj?.Message || 'Failed to submit request.';

//         setAlertMessage(errorMessage);
//         setAlertModal(true);
//       }
//     } catch (error) {
//       console.error('Submit error:', error);
//       setAlertMessage('Failed to submit request.');
//       setAlertModal(true);
//     } finally {
//       setButtonProcessing(itemToSubmit.RecId, 'submit', false); // stop button spinner
//       setIsProcessing(false); // ✅ Hide processing overlay
//       setItemToSubmit(null);
//     }
//   };

//   // Handle create Bank Account Record
//   const handlePurchaseRequisitionHeaderRecordCreation = () => {
//     navigation.navigate('PurchaseRequisitionSaveRecord', {
//       mode: 'create',
//       employeeId: effectiveEmployeeId,
//       employeeName: effectiveEmployeeName,
//       WorkerRecId: effectiveWorkerRecId,
//       userData: effectiveUserData,
//       cameFrom: 'PurchaseRequisitionListPage',
//       originalCameFrom: cameFrom,
//       purchaseRequisitiondata: {
//         employeeId: effectiveEmployeeId,
//         employeeName: effectiveEmployeeName,
//         WorkerRecId: effectiveWorkerRecId,
//         PurchReqId: '',
//         PurchReqName: '',
//         TransDate: '',
//         RequiredDate: '',
//       },
//     });
//   };
//   const leftFields = [
//     'PurchReqId',
//     'PurchReqName',
//     'Originator',
//     'RequisitionPurpose',
//     'RequiredDate',
//   ];
//   const rightFields = ['RequisitionStatus'];

//   const labels = {
//     PurchReqId: 'Requisition ID',
//     PurchReqName: 'Title',
//     Originator: 'Preparer',
//     RequisitionPurpose: 'Purpose',
//     RequiredDate: 'Requested date',
//     RequisitionStatus: 'Status',
//   };

//   const renderPurchaseRequisitionCard = ({item}) => {
//     const isHighlighted = highlightedRecId === item.RecId;
//     const processedItem = {
//       ...item,
//       employeeId: item.employeeId || employeeId,
//       employeeName: item.employeeName || employeeName,
//     };

//     return (
//       <PRHeaderList
//         item={processedItem}
//         leftFields={leftFields}
//         rightFields={rightFields}
//         onPress={selectedItem => {
//           navigation.navigate('PurchaseRequisitionLinesListPage', {
//             PurchReqId: selectedItem.PurchReqId,
//             PurchReqName: selectedItem.PurchReqName,
//             RequiredDate: selectedItem.RequiredDate,
//             RequisitionStatus: selectedItem.RequisitionStatus,
//             RecId: selectedItem.RecId,
//             item: selectedItem,
//             employeeId: effectiveEmployeeId,
//             employeeName: effectiveEmployeeName,
//             WorkerRecId: effectiveWorkerRecId,
//           });
//           console.log('navigate to lines', selectedItem.PurchReqId);
//         }}
//         onSubmit={handleSubmitRequest} // ✅ Add this
//         labels={labels}
//         onEdit={itemToEdit => {
//           // Navigate to the save screen in "edit" mode
//           navigation.navigate('PurchaseRequisitionSaveRecord', {
//             mode: 'edit',
//             employeeId: effectiveEmployeeId,
//             employeeName: effectiveEmployeeName,
//             WorkerRecId: effectiveWorkerRecId,
//             userData: effectiveUserData,
//             cameFrom: 'PurchaseRequisitionListPage',
//             purchaseRequisitiondata: {
//               RecId: itemToEdit.RecId,
//               PurchReqId: itemToEdit.PurchReqId,
//               PurchReqName: itemToEdit.PurchReqName,
//               Originator: itemToEdit.Originator,
//               RequisitionPurpose: itemToEdit.RequisitionPurpose,
//               CreatedDateTime: itemToEdit.CreatedDateTime,
//               RequisitionStatus: itemToEdit.RequisitionStatus,
//               TransDate: itemToEdit.TransDate,
//               RequiredDate: itemToEdit.RequiredDate,
//               // Include any other fields your save screen expects
//             },
//           });
//         }}
//         onDelete={item => {
//           console.log('Delete item:', item);
//           setItemToDelete(item);
//           setDeleteModal(true);
//         }}
//         processingButtons={processingButtons}
//       />
//     );
//   };

//   return (
//     <ActionPaneContainer
//       pageTitle="Purchase requisitions prepared by me"
//       isBackButton={false}
//       showFooter={true}
//       showFloatingButton={true}
//       isHeaderActive={true}
//       onBackPress={handleGoBack}
//       onRefresh={handleRefresh}
//       onFloatingButtonPress={handlePurchaseRequisitionHeaderRecordCreation}>
//       {/* ✅ ADD PROCESSING OVERLAY HERE */}
//       {isProcessing && (
//         <View
//           style={{
//             position: 'absolute',
//             top: 0,
//             left: 0,
//             right: 0,
//             bottom: 0,
//             backgroundColor: 'rgba(0, 0, 0, 0.5)',
//             justifyContent: 'center',
//             alignItems: 'center',
//             zIndex: 9999,
//           }}>
//           <View
//             style={{
//               backgroundColor: '#fff',
//               padding: 30,
//               borderRadius: 10,
//               alignItems: 'center',
//               elevation: 5,
//               shadowColor: '#000',
//               shadowOffset: {width: 0, height: 2},
//               shadowOpacity: 0.25,
//               shadowRadius: 4,
//             }}>
//             <ActivityIndicator size="large" color="#0A66C2" />
//             <Text
//               style={{
//                 marginTop: 15,
//                 fontSize: 16,
//                 color: '#333',
//                 fontWeight: '600',
//               }}>
//               Processing...
//             </Text>
//           </View>
//         </View>
//       )}
//       {isLoading ? (
//         <CustomIndicator />
//       ) : (
//         <FlatList
//           data={purchaseRequisitiondata}
//           keyExtractor={item => item.RecId?.toString()}
//           renderItem={renderPurchaseRequisitionCard}
//           refreshControl={
//             <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
//           }
//           ListEmptyComponent={
//             <View style={{paddingTop: 350, alignItems: 'center'}}>
//               <Text style={styles.DLP_NoDataText}>Get started</Text>
//               <Text style={styles.DLP_NoDataSubText}>
//                 Tap + to add a new record
//               </Text>
//             </View>
//           }
//         />
//       )}
//       <AlertModal
//         visible={alertModal}
//         heading="Alert"
//         text={alertMessage}
//         onPress={() => setAlertModal(false)}
//       />
//       <AlertDeleteModal
//         visible={deleteModal}
//         heading="Confirm Deletion"
//         text="Are you sure you want to delete this record?"
//         onPress={async () => {
//           if (!itemToDelete?.RecId) {
//             setAlertMessage('Invalid record selected for deletion');
//             setAlertModal(true);
//             setDeleteModal(false);
//             setItemToDelete(null);
//             return;
//           }

//           setDeleteModal(false); // ✅ Close modal first
//           setIsProcessing(true); // ✅ Show processing overlay

//           try {
//             setButtonProcessing(itemToDelete.RecId, 'delete', true);

//             await deletePurchaseRequisition({
//               _contractList: [{RecId: itemToDelete.RecId}],
//             });

//             setPurchaseRequisitionData(prevData =>
//               prevData.filter(item => item.RecId !== itemToDelete.RecId),
//             );

//             setAlertMessage('Record deleted successfully.');
//             setAlertModal(true);
//           } catch (error) {
//             setAlertMessage('Failed to delete record.');
//             setAlertModal(true);
//           } finally {
//             setButtonProcessing(itemToDelete.RecId, 'delete', false);
//             setIsProcessing(false); // ✅ ADD THIS - Hide processing overlay
//             setItemToDelete(null);
//           }
//         }}
//         onCancel={() => {
//           setDeleteModal(false);
//           setItemToDelete(null);
//         }}
//       />
//       <AlertSubmitModal
//         visible={submitModal}
//         heading="Confirm Submission"
//         text={`Are you sure you want to submit "${itemToSubmit?.PurchReqId}"?`}
//         onPress={handleConfirmSubmit}
//         onCancel={() => {
//           setSubmitModal(false);
//           setIsProcessing(false); // ✅ Hide processing overlay
//           setItemToSubmit(null);
//         }}
//       />
//     </ActionPaneContainer>
//   );
// };

// export default PurchaseRequisitionListPage;
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
import React, {useState, useCallback} from 'react';
import {
  Text,
  FlatList,
  BackHandler,
  RefreshControl,
  View,
  ActivityIndicator,
  Pressable,
  Animated,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';

import AlertModal from '../../components/Alert/AlertModal';
import AlertDeleteModal from '../../components/Alert/AlertDeleteModal';
import AlertSubmitModal from '../../components/PurchaseRequisition/AlertSubmitModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import DynamicRequestCard from '../../components/DynamicRequestCard';
import styles from '../../styles/styles';

import {retrievePurchaseRequisitionByMe} from '../../API/PurchaseRequisition/PurchaseRequisitionListPage';
import deletePurchaseRequisition from '../../API/PurchaseRequisition/PurchaseRequisitionDeleteRecord';
import {submitPurchaseRequisition} from '../../API/PurchaseRequisition/PurchaseRequisitionSubmitRecord';

import {useSelector} from 'react-redux';
import {ScrollView} from 'react-native-gesture-handler';

const PurchaseRequisitionListPage = () => {
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

  // Get userData from Redux as fallback
  const reduxUserData = useSelector(state => state.user.userData);
  const effectiveUserData = routeUserData || reduxUserData;

  // Use effective user data for all operations
  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
  const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;
  const effectiveWorkerRecId = WorkerRecId || effectiveUserData?.WorkerRecId;

  const [isLoading, setIsLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [purchaseRequisitiondata, setPurchaseRequisitionData] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [highlightedRecId, setHighlightedRecId] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [submitModal, setSubmitModal] = useState(false);
  const [itemToSubmit, setItemToSubmit] = useState(null);
  const [processingButtons, setProcessingButtons] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Card config — mirrors Expense screen pattern
  const CARD_CONFIG = {
    headerConfig: {
      title: {key: 'PurchReqId'},
    },
    fields: [
      {key: 'PurchReqName', label: 'Title', type: 'text'},
      {key: 'Originator', label: 'Preparer', type: 'text'},
      {key: 'RequisitionPurpose', label: 'Purpose', type: 'text'},
      {key: 'RequiredDate', label: 'Required Date', type: 'text'},
      {key: 'RequisitionStatus', label: '', type: 'status'},
    ],
  };

  const STATUS_MAP = {
    Draft: 'Draft',
    Submitted: 'Submitted',
    Approved: 'Approved',
    Rejected: 'Rejected',
    InReview: 'In Review',
    Closed: 'Closed',
  };

  const getStatusLabel = status => STATUS_MAP[status] || status || 'Draft';

  const formatDate = dateString => {
    if (!dateString || dateString === '1900-01-01T00:00:00') return 'N/A';
    const date = new Date(dateString);
    return isNaN(date) ? dateString : date.toLocaleDateString();
  };

  const setButtonProcessing = (recId, action, isProc) => {
    setProcessingButtons(prev => {
      const updated = {...prev};
      if (isProc) {
        updated[recId] = [...(updated[recId] || []), action];
      } else {
        updated[recId] = (updated[recId] || []).filter(a => a !== action);
        if (updated[recId].length === 0) delete updated[recId];
      }
      return updated;
    });
  };

  const getButtonConfig = item => {
    const isDraft =
      item.RequisitionStatus === 'Draft' || !item.RequisitionStatus;

    return {
      edit: {
        show: true,
        position: 'header',
        style: 'icon',
        icon: 'edit',
        iconSize: 20,
        iconColor: '#fff',
        backgroundColor: '#0A66C2',
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
        backgroundColor: '#0A66C2',
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
      },
    };
  };

  const handleButtonPress = (buttonType, item) => {
    if (buttonType === 'edit') handleEditPress(item);
    else if (buttonType === 'delete') handleDeletePress(item);
    else if (buttonType === 'submit') handleSubmitRequest(item);
  };

  const handleEditPress = itemToEdit => {
    navigation.navigate('PurchaseRequisitionSaveRecord', {
      mode: 'edit',
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: effectiveUserData,
      cameFrom: 'PurchaseRequisitionListPage',
      purchaseRequisitiondata: {
        RecId: itemToEdit.RecId,
        PurchReqId: itemToEdit.PurchReqId,
        PurchReqName: itemToEdit.PurchReqName,
        Originator: itemToEdit.Originator,
        RequisitionPurpose: itemToEdit.RequisitionPurpose,
        CreatedDateTime: itemToEdit.CreatedDateTime,
        RequisitionStatus: itemToEdit.RequisitionStatus,
        TransDate: itemToEdit.TransDate,
        RequiredDate: itemToEdit.RequiredDate,
      },
    });
  };

  const handleDeletePress = item => {
    setItemToDelete(item);
    setDeleteModal(true);
  };

  const handleCardPress = item => {
    navigation.navigate('PurchaseRequisitionLinesListPage', {
      PurchReqId: item.PurchReqId,
      PurchReqName: item.PurchReqName,
      RequiredDate: item.RequiredDate,
      RequisitionStatus: item.RequisitionStatus,
      RecId: item.RecId,
      item: item,
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
    });
  };

  const fetchPurchaseRequisitionData = useCallback(async () => {
    if (!effectiveEmployeeId) return;

    setIsLoading(true);

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();

    try {
      const data = await retrievePurchaseRequisitionByMe({
        employeeId: effectiveEmployeeId,
      });
      setPurchaseRequisitionData(data);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      setAlertMessage('Failed to fetch data.');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveEmployeeId]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchPurchaseRequisitionData();
    }, [fetchPurchaseRequisitionData]),
  );

  useFocusEffect(
    useCallback(() => {
      if (highlightRecId) {
        setHighlightedRecId(highlightRecId);
        fetchPurchaseRequisitionData();

        const timer = setTimeout(() => {
          setHighlightedRecId(null);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }, [highlightRecId, fetchPurchaseRequisitionData]),
  );

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

  // Handle back navigation
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

  const handleRefresh = () => {
    fetchPurchaseRequisitionData();
  };

  const handleSubmitRequest = item => {
    setItemToSubmit(item);
    setSubmitModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!itemToSubmit?.PurchReqId) {
      setAlertMessage('Invalid record selected for submission');
      setAlertModal(true);
      setSubmitModal(false);
      setItemToSubmit(null);
      return;
    }

    setSubmitModal(false);
    setIsProcessing(true);

    try {
      setButtonProcessing(itemToSubmit.RecId, 'submit', true);
      const response = await submitPurchaseRequisition({
        _requestList: [itemToSubmit.PurchReqId],
      });

      const resObj = Array.isArray(response) ? response[0] : response;

      if (resObj && String(resObj.IsSuccess).toLowerCase() === 'true') {
        setAlertMessage('Request submitted successfully.');
        setAlertModal(true);

        setHighlightedRecId(itemToSubmit.RecId);
        setTimeout(() => setHighlightedRecId(null), 3000);
        setTimeout(() => fetchPurchaseRequisitionData(), 1000);
      } else {
        const errorMessage = resObj?.Message || 'Failed to submit request.';
        setAlertMessage(errorMessage);
        setAlertModal(true);
      }
    } catch (error) {
      setAlertMessage('Failed to submit request.');
      setAlertModal(true);
    } finally {
      setButtonProcessing(itemToSubmit.RecId, 'submit', false);
      setIsProcessing(false);
      setItemToSubmit(null);
    }
  };

  const handleCreateRecord = () => {
    navigation.navigate('PurchaseRequisitionSaveRecord', {
      mode: 'create',
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: effectiveUserData,
      cameFrom: 'PurchaseRequisitionListPage',
      originalCameFrom: cameFrom,
      purchaseRequisitiondata: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
        PurchReqId: '',
        PurchReqName: '',
        TransDate: '',
        RequiredDate: '',
      },
    });
  };

  // Render purchase requisition card — mirrors Expense screen pattern
  const renderPurchaseRequisitionCard = ({item}) => {
    const processedItem = {
      ...item,
      RecId: item.RecId,
      RequiredDate: formatDate(item.RequiredDate),
      CreatedDateTime: formatDate(item.CreatedDateTime),
      RequisitionStatus: getStatusLabel(item.RequisitionStatus),
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
    };

    return (
      <DynamicRequestCard
        data={processedItem}
        headerConfig={CARD_CONFIG.headerConfig}
        fields={CARD_CONFIG.fields}
        buttons={getButtonConfig(item)}
        onButtonPress={handleButtonPress}
        onPress={() => handleCardPress(processedItem)}
        isExpandable={true}
        gradientColors={['#b8f5d4', '#d4f0e8', '#dff4ff']}
        processingButtons={processingButtons[item.RecId] || []}
        showNavigationArrow={true}
      />
    );
  };

  return (
    <ActionPaneContainer
      pageTitle="Purchase requisitions prepared by me"
      isBackButton={false}
      showFooter={true}
      showFloatingButton={true}
      isHeaderActive={true}
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={handleCreateRecord}>
      {isProcessing && (
        <View style={styles.DLP_ProcessingOverlay}>
          <View style={styles.DLP_ProcessingContainer}>
            <ActivityIndicator size="large" color="#0A66C2" />
            <Text style={styles.DLP_ProcessingText}>Processing...</Text>
          </View>
        </View>
      )}

      {isLoading ? (
        <View style={styles.DLP_LoadingContainer}>
          <CustomIndicator />
        </View>
      ) : (
        <Animated.View
          style={[styles.DLP_AnimatedContainer, {opacity: fadeAnim}]}>
          {purchaseRequisitiondata.length > 0 ? (
            <FlatList
              data={purchaseRequisitiondata}
              keyExtractor={item => item.RecId?.toString()}
              renderItem={renderPurchaseRequisitionCard}
              contentContainerStyle={styles.DLP_ListContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isLoading}
                  onRefresh={handleRefresh}
                />
              }
            />
          ) : (
            <ScrollView
              contentContainerStyle={styles.DLP_NoDataContainer}
              refreshControl={
                <RefreshControl
                  refreshing={isLoading}
                  onRefresh={handleRefresh}
                />
              }>
              <Text style={styles.DLP_NoDataText}>Get started</Text>
              <Text style={styles.DLP_NoDataSubText}>
                Tap + to add a new record
              </Text>
            </ScrollView>
          )}
        </Animated.View>
      )}

      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />

      <AlertDeleteModal
        visible={deleteModal}
        heading="Confirm Deletion"
        text="Are you sure you want to delete this record?"
        onPress={async () => {
          if (!itemToDelete?.RecId) {
            setAlertMessage('Invalid record selected for deletion');
            setAlertModal(true);
            setDeleteModal(false);
            setItemToDelete(null);
            return;
          }

          setDeleteModal(false);
          setIsProcessing(true);

          try {
            setButtonProcessing(itemToDelete.RecId, 'delete', true);

            await deletePurchaseRequisition({
              _contractList: [{RecId: itemToDelete.RecId}],
            });

            setPurchaseRequisitionData(prevData =>
              prevData.filter(item => item.RecId !== itemToDelete.RecId),
            );

            setAlertMessage('Record deleted successfully.');
            setAlertModal(true);
          } catch (error) {
            setAlertMessage('Failed to delete record.');
            setAlertModal(true);
          } finally {
            setButtonProcessing(itemToDelete.RecId, 'delete', false);
            setIsProcessing(false);
            setItemToDelete(null);
          }
        }}
        onCancel={() => {
          setDeleteModal(false);
          setItemToDelete(null);
        }}
      />

      <AlertSubmitModal
        visible={submitModal}
        heading="Confirm Submission"
        text={`Are you sure you want to submit "${itemToSubmit?.PurchReqId}"?`}
        onPress={handleConfirmSubmit}
        onCancel={() => {
          setSubmitModal(false);
          setIsProcessing(false);
          setItemToSubmit(null);
        }}
      />
    </ActionPaneContainer>
  );
};

export default PurchaseRequisitionListPage;
