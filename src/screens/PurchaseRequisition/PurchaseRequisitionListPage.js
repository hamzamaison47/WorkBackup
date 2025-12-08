/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
import React, {useState, useCallback} from 'react';
import {Text, FlatList, BackHandler, RefreshControl, View} from 'react-native';
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
import PRHeaderList from '../../components/PurchaseRequisition/PRHeaderList';
import styles from '../../styles/styles';

import {retrievePurchaseRequisitionByMe} from '../../API/PurchaseRequisition/PurchaseRequisitionListPage';
import deletePurchaseRequisition from '../../API/PurchaseRequisition/PurchaseRequisitionDeleteRecord';
import {submitPurchaseRequisition} from '../../API/PurchaseRequisition/PurchaseRequisitionSubmitRecord';
import {updatePurchaseRequisition} from '../../API/PurchaseRequisition/PurchaseRequisitionUpdateRecord';

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
  const [purchaseRequisitiondata, setPurchaseRequisitionData] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [highlightedRecId, setHighlightedRecId] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [submitModal, setSubmitModal] = useState(false);
  const [itemToSubmit, setItemToSubmit] = useState(null);
  const [processingButtons, setProcessingButtons] = useState({});

  const fetchPurchaseRequisitionData = useCallback(async () => {
    if (!effectiveEmployeeId) return;

    setIsLoading(true);
    try {
      const PurchaseRequisitiondata = await retrievePurchaseRequisitionByMe({
        employeeId: effectiveEmployeeId,
      });

      // // ✅ Sort newest record on top
      // BankAccountData.sort((a, b) => (b.recId || 0) - (a.recId || 0));

      setPurchaseRequisitionData(PurchaseRequisitiondata);
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

  const setButtonProcessing = (recId, action, isProcessing) => {
    setProcessingButtons(prev => {
      const updated = {...prev};

      if (isProcessing) {
        // Add this action for this RecId
        updated[recId] = [...(updated[recId] || []), action];
      } else {
        // Remove the action from this RecId
        updated[recId] = (updated[recId] || []).filter(a => a !== action);

        // Clean up if empty
        if (updated[recId].length === 0) delete updated[recId];
      }

      return updated;
    });
  };

  // Handle back navigation
  const handleGoBack = () => {
    let targetRoute = 'MainDashboard'; // default

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
        return; // exit early
    }

    navigation.reset({
      index: 0, // top of the stack
      routes: [{name: 'TabNavigator', params: {screen: targetRoute}}],
    });
  };

  // Handle refresh
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

    // Start processing on the submit button for this record
    setButtonProcessing(itemToSubmit.RecId, 'submit', true);

    try {
      const response = await submitPurchaseRequisition({
        _requestList: [itemToSubmit.PurchReqId], // string[]
      });

      console.log('PR-Submit-Item -->', itemToSubmit);
      console.log('PR-Submit-Response -->', response);

      // Normalize the result
      const resObj = Array.isArray(response) ? response[0] : response;

      // ✔ Success Condition (like your BankAccount code)
      if (resObj && String(resObj.IsSuccess).toLowerCase() === 'true') {
        setAlertMessage(
          `Purchase requisition "${itemToSubmit.PurchReqId}" submitted successfully.`,
        );
        setAlertModal(true);

        // highlight the row (UI feedback)
        setHighlightedRecId(itemToSubmit.RecId);

        setTimeout(() => {
          setHighlightedRecId(null);
        }, 3000);

        // Refresh the list after short delay
        setTimeout(() => {
          fetchPurchaseRequisitionData();
        }, 1000);
      } else {
        // Failed — show server message if exists
        const errorMessage =
          resObj?.Message || 'Failed to submit purchase requisition';

        setAlertMessage(errorMessage);
        setAlertModal(true);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setAlertMessage('Failed to submit purchase requisition');
      setAlertModal(true);
    } finally {
      setButtonProcessing(itemToSubmit.RecId, 'submit', false); // stop button spinner
      setSubmitModal(false);
      setItemToSubmit(null);
    }
  };

  // Handle create Bank Account Record
  const handlePurchaseRequisitionHeaderRecordCreation = () => {
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
  const leftFields = [
    'PurchReqId',
    'PurchReqName',
    'Originator',
    'RequisitionPurpose',
    'RequiredDate',
  ];
  const rightFields = ['RequisitionStatus'];

  const labels = {
    PurchReqId: 'Requisition ID',
    PurchReqName: 'Title',
    Originator: 'Preparer',
    RequisitionPurpose: 'Purpose',
    RequiredDate: 'Requested date',
    RequisitionStatus: 'Status',
  };

  const renderPurchaseRequisitionCard = ({item}) => {
    const isHighlighted = highlightedRecId === item.RecId;
    const processedItem = {
      ...item,
      employeeId: item.employeeId || employeeId,
      employeeName: item.employeeName || employeeName,
    };

    return (
      <PRHeaderList
        item={processedItem}
        leftFields={leftFields}
        rightFields={rightFields}
        onPress={selectedItem => {
          navigation.navigate('PurchaseRequisitionLinesListPage', {
            PurchReqId: selectedItem.PurchReqId,
            PurchReqName: selectedItem.PurchReqName,
            RequiredDate: selectedItem.RequiredDate,
            RequisitionStatus: selectedItem.RequisitionStatus,
            RecId: selectedItem.RecId,
            item: selectedItem,
            employeeId: effectiveEmployeeId,
            employeeName: effectiveEmployeeName,
            WorkerRecId: effectiveWorkerRecId,
          });
          console.log('navigate to lines', selectedItem.PurchReqId);
        }}
        onSubmit={handleSubmitRequest} // ✅ Add this
        labels={labels}
        onEdit={itemToEdit => {
          // Navigate to the save screen in "edit" mode
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
              // Include any other fields your save screen expects
            },
          });
        }}
        onDelete={item => {
          console.log('Delete item:', item);
          setItemToDelete(item);
          setDeleteModal(true);
        }}
        processingButtons={processingButtons}
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
      onFloatingButtonPress={handlePurchaseRequisitionHeaderRecordCreation}>
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <FlatList
          data={purchaseRequisitiondata}
          keyExtractor={item => item.RecId?.toString()}
          renderItem={renderPurchaseRequisitionCard}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }
        />
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

          try {
            setButtonProcessing(itemToDelete.RecId, 'delete', true);

            await deletePurchaseRequisition({
              _contractList: [{RecId: itemToDelete.RecId}],
            });

            setPurchaseRequisitionData(prevData =>
              prevData.filter(item => item.RecId !== itemToDelete.RecId),
            );

            setAlertMessage(
              `Purchase requisition "${itemToDelete.PurchReqId}" deleted successfully`,
            );
            setAlertModal(true);
          } catch (error) {
            setAlertMessage('Failed to delete record');
            setAlertModal(true);
          } finally {
            setButtonProcessing(itemToDelete.RecId, 'delete', false);
            setDeleteModal(false);
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
          setItemToSubmit(null);
        }}
      />
    </ActionPaneContainer>
  );
};

export default PurchaseRequisitionListPage;
