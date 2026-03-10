/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
import React, {useState, useCallback} from 'react';
import {
  FlatList,
  BackHandler,
  RefreshControl,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';

import styles from '../../styles/styles';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import PRLinesList from '../../components/PurchaseRequisition/PRLinesList';
import AlertModal from '../../components/Alert/AlertModal';
import AlertDeleteModal from '../../components/Alert/AlertDeleteModal';
import AlertSubmitModal from '../../components/PurchaseRequisition/AlertSubmitModal';

import {retrievePurchaseRequisitionLines} from '../../API/PurchaseRequisitionLines/PurchaseRequisitionLinesRetrievebyPurchId';
import deletePurchaseRequisitionLineRecord from '../../API/PurchaseRequisitionLines/PurchaseRequisitionLinesDeleteRecord';

import {useSelector} from 'react-redux';

const PurchaseRequisitionLinesListPage = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    PurchReqId,
    PurchReqName,
    RequiredDate,
    RequisitionStatus,
    item,
    employeeId,
    employeeName,
    cameFrom,
    WorkerRecId,
    userData: routeUserData,
  } = route.params;

  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const reduxUserData = useSelector(state => state.user.userData);
  const effectiveUserData = routeUserData || reduxUserData;

  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
  const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;
  const effectiveWorkerRecId = WorkerRecId || effectiveUserData?.WorkerRecId;

  const [isLoading, setIsLoading] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [submitModal, setSubmitModal] = useState(false);
  const [itemToSubmit, setItemToSubmit] = useState(null);
  const [deletingItemId, setDeletingItemId] = useState(null); // Track which item is being deleted
  const isActionsDisabled = RequisitionStatus && RequisitionStatus !== 'Draft';
  const [rawData, setRawData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [sortOrder, setSortOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const leftFields = ['ItemId', 'ItemName'];
  const rightFields = [
    'PurchQty',
    'PurchUnitofMeasureCode',
    'PurchPrice',
    'LineAmount',
  ];
  const labels = {
    ItemId: 'Item Code',
    ItemName: 'Item Name',
    PurchQty: 'Qty',
    PurchUnitofMeasureCode: 'Unit',
    PurchPrice: 'Unit Price',
    LineAmount: 'Net Amount',
  };

  const fetchLines = useCallback(async () => {
    setLoading(true);
    try {
      const response = await retrievePurchaseRequisitionLines({
        _purchReqId: PurchReqId,
      });
      const data = Array.isArray(response) ? response : [];

      setLines(data);
      setRawData(data); // ✅ set raw data
      setDisplayData(data);
    } catch (error) {
      console.log('Error fetching PR lines:', error);
      setLines([]);
    } finally {
      setLoading(false);
    }
  }, [PurchReqId]); // Add PurchReqId as dependency

  useFocusEffect(
    useCallback(() => {
      console.log('PurchaseRequisitionLinesListPage focused');
      fetchLines();

      const onBackPress = () => {
        console.log('⬅️ Hardware Back Pressed');
        console.log('➡️ Calling handleGoBack()');
        handleGoBack();
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => {
        console.log('Cleaning up BackHandler in LinesListPage');
        subscription.remove();
      };
    }, [fetchLines, handleGoBack]),
  );

  const handleGoBack = useCallback(() => {
    console.log('🔙 handleGoBack TRIGGERED');

    console.log('🔙 Navigation Reset Payload:', {
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: effectiveUserData,
      cameFrom: cameFrom || 'MainDashboard',
    });

    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'PurchaseRequisitionListPage',
          params: {
            employeeId: effectiveEmployeeId,
            employeeName: effectiveEmployeeName,
            WorkerRecId: effectiveWorkerRecId,
            userData: effectiveUserData,
            cameFrom: cameFrom || 'MainDashboard',
          },
        },
      ],
    });
  }, [
    navigation,
    effectiveEmployeeId,
    effectiveEmployeeName,
    effectiveWorkerRecId,
    effectiveUserData,
    cameFrom,
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLines();
    setRefreshing(false);
  };

  const handleEdit = line => {
    if (isActionsDisabled) {
      return;
    }
    console.log('✏️ Navigating to SaveRecord for editing');
    navigation.navigate('PurchaseRequisitionLinesSaveRecord', {
      mode: 'edit',
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: effectiveUserData,
      cameFrom: 'PurchaseRequisitionLinesListPage',
      PurchReqId,
      PurchReqName,
      RequiredDate,
      lineToEdit: line,
      purchaseRequisitiondata: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
        RecId: line.RecId,
        ItemId: line.ItemId || '',
        PurchQty: line.PurchQty || '',
        InventBatchId: line.InventBatchId || '',
        WMSLocationId: line.WMSLocationId || '',
        InventSerialId: line.InventSerialId || '',
        ConfigId: line.ConfigId || '',
        InventSizeId: line.InventSizeId || '',
        InventColorId: line.InventColorId || '',
        InventStyle: line.InventStyle || '',
        WMSPalletId: line.WMSPalletId || '',
        InventSiteId: line.InventSiteId || '',
        InventLocationId: line.InventLocationId || '',
        PurchUnitofMeasureCode: line.PurchUnitofMeasureCode || '',
        PurchPrice: line.PurchPrice || '',
        LineAmount: line.LineAmount || '',
        ItemName: line.ItemName || '',
      },
    });
  };

  const handleDelete = line => {
    if (isActionsDisabled) {
      return;
    }
    setItemToDelete(line);
    setDeleteModal(true);
  };

  const handleCreate = () => {
    navigation.navigate('PurchaseRequisitionLinesFormPage', {
      mode: 'create',
      PurchReqId,
    });
  };

  const handlePurchaseRequisitionLinesRecordCreation = () => {
    if (isActionsDisabled) {
      return;
    }
    console.log('🔄 Navigating to SaveRecord');
    navigation.navigate('PurchaseRequisitionLinesSaveRecord', {
      mode: 'create',
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: effectiveUserData,
      cameFrom: 'PurchaseRequisitionLinesListPage',
      PurchReqId,
      PurchReqName,
      RequiredDate,
      purchaseRequisitiondata: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
        ItemId: '',
        PurchQty: '',
        InventBatchId: '',
        WMSLocationId: '',
        InventSerialId: '',
        ConfigId: '',
        InventSizeId: '',
        InventColorId: '',
        InventStyle: '',
        WMSPalletId: '',
        InventSiteId: '',
        InventLocationId: '',
      },
    });
  };

  const applySearchAndSort = useCallback((data, query, sort) => {
    let result = [...data];

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(item =>
        Object.values(item).some(val =>
          String(val ?? '')
            .toLowerCase()
            .includes(q),
        ),
      );
    }

    if (sort) {
      result.sort((a, b) => {
        const getDate = obj => {
          for (const val of Object.values(obj)) {
            const d = new Date(val);
            if (!isNaN(d.getTime())) return d;
          }
          return new Date(0);
        };
        const diff = getDate(a) - getDate(b);
        return sort === 'asc' ? diff : -diff;
      });
    }

    setDisplayData(result);
  }, []);

  const handleSearch = query => {
    setSearchQuery(query);
    applySearchAndSort(rawData, query, sortOrder);
  };

  const handleSort = sort => {
    setSortOrder(sort);
    applySearchAndSort(rawData, searchQuery, sort);
  };

  const renderLineCard = ({item, index}) => (
    <PRLinesList
      item={item}
      index={index}
      leftFields={leftFields}
      rightFields={rightFields}
      labels={labels}
      onPress={() => {}}
      onEdit={handleEdit}
      onDelete={handleDelete}
      isActionsDisabled={isActionsDisabled}
    />
  );

  return (
    <ActionPaneContainer
      pageTitle={`${PurchReqId || ''} : ${PurchReqName || ''}`}
      isBackButton
      showFooter={false}
      showFloatingButton
      isHeaderActive
      onBackPress={handleGoBack}
      onRefresh={onRefresh}
      onFloatingButtonPress={handlePurchaseRequisitionLinesRecordCreation}
      floatingButtonDisabled={isActionsDisabled}
      showPageTitleRow={true}
      showSearchBar={true}
      onSearchChange={handleSearch}
      onSortChange={handleSort}
      activeSortOrder={sortOrder} // Disable floating button
    >
      {/* ✅ ADD PROCESSING OVERLAY HERE */}
      {isLoading && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}>
          <View
            style={{
              backgroundColor: '#fff',
              padding: 30,
              borderRadius: 10,
              alignItems: 'center',
              elevation: 5,
              shadowColor: '#000',
              shadowOffset: {width: 0, height: 2},
              shadowOpacity: 0.25,
              shadowRadius: 4,
            }}>
            <ActivityIndicator size="large" color="#0A66C2" />
            <Text
              style={{
                marginTop: 15,
                fontSize: 16,
                color: '#333',
                fontWeight: '600',
              }}>
              Processing...
            </Text>
          </View>
        </View>
      )}
      {loading ? (
        <CustomIndicator />
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderLineCard}
          contentContainerStyle={{paddingBottom: 20}}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={{paddingTop: 250, alignItems: 'center'}}>
              {searchQuery.trim() ? (
                <>
                  {/* <Text style={styles.DLP_NoDataText}>No results found</Text> */}
                  <Text style={styles.DLP_NoDataSubText}>
                    No records match "{searchQuery}"
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.DLP_NoDataText}>Get started</Text>
                  <Text style={styles.DLP_NoDataSubText}>
                    Tap + to add a new record
                  </Text>
                </>
              )}
            </View>
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

          setDeleteModal(false); // ✅ Close modal first
          setIsLoading(true); // ✅ Show processing overlay

          try {
            await deletePurchaseRequisitionLineRecord({
              recordsRecId: [itemToDelete.RecId],
            });

            setLines(prev =>
              prev.filter(item => item.RecId !== itemToDelete.RecId),
            );

            setAlertMessage('Record deleted successfully.');
            setAlertModal(true);
          } catch (error) {
            console.error('Delete error:', error);
            setAlertMessage(error.response?.data || 'Failed to delete record.');
            setAlertModal(true);
          } finally {
            setIsLoading(false); // ✅ Hide processing overlay
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
        onPress={0}
        onCancel={() => {
          setSubmitModal(false);
          setItemToSubmit(null);
        }}
      />
    </ActionPaneContainer>
  );
};

export default PurchaseRequisitionLinesListPage;
