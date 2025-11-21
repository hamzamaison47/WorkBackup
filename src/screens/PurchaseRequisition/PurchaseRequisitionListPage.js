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
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import PRHeaderList from '../../components/PurchaseRequisition/PRHeaderList';
import styles from '../../styles/styles';

import {retrievePurchaseRequisitionByMe} from '../../API/PurchaseRequisition/PurchaseRequisitionListPage';

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
  const [PurchaseRequisitiondata, setPurchaseRequisitionData] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [highlightedRecId, setHighlightedRecId] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

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

  const handleGoBack = () => {
    navigation.navigate('Employee History');
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchPurchaseRequisitionData();
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
      bankaccountdata: {
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
    'CreatedDateTime',
  ];
  const rightFields = ['RequisitionStatus'];

  const labels = {
    PurchReqId: 'Requisition ID',
    PurchReqName: 'Title',
    Originator: 'Preparer',
    RequisitionPurpose: 'Purpose',
    CreatedDateTime: 'Created On',
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
        labels={labels}
        onEdit={item => {
          // Handle edit action
          console.log('Edit item:', item);
          navigation.navigate('PurchaseRequisitionSaveRecord', {
            mode: 'edit',
            PurchaseRequisitiondata: item,
            employeeId: effectiveEmployeeId,
            employeeName: effectiveEmployeeName,
            WorkerRecId: effectiveWorkerRecId,
          });
        }}
        onDelete={item => {
          // Handle delete action
          console.log('Delete item:', item);
          setItemToDelete(item);
          setDeleteModal(true);
        }}
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
          data={PurchaseRequisitiondata}
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
        onPress={() => {
          // deletion logic
        }}
        onCancel={() => {
          setDeleteModal(false);
          setItemToDelete(null);
        }}
      />
    </ActionPaneContainer>
  );
};

export default PurchaseRequisitionListPage;
