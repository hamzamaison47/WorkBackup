/* eslint-disable curly */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useCallback, useEffect, useMemo} from 'react';
import {
  Text,
  FlatList,
  BackHandler,
  RefreshControl,
  View,
  ActivityIndicator,
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
import MultiSelectActionBar from '../../components/MultiSelectActionBar'; // ← new
import styles from '../../styles/styles';

import {retrievePurchaseRequisitionByMe} from '../../API/PurchaseRequisition/PurchaseRequisitionListPage';
import deletePurchaseRequisition from '../../API/PurchaseRequisition/PurchaseRequisitionDeleteRecord';
import {submitPurchaseRequisition} from '../../API/PurchaseRequisition/PurchaseRequisitionSubmitRecord';

import {useSelector} from 'react-redux';
import {ScrollView} from 'react-native-gesture-handler';
import DynamicAttachmentModal from '../../shared/DynamicAttachmentModal';

// ── Height of your custom tab navigator — adjust if needed ──

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

  const reduxUserData = useSelector(state => state.user.userData);
  const {selectedLegalEntity} = useSelector(state => state.company);
  const effectiveUserData = routeUserData || reduxUserData;

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
  const [activeFilter, setActiveFilter] = useState('All');
  const [rawData, setRawData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [sortOrder, setSortOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Attachment modal state
  const [attachmentModal, setAttachmentModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // ── Multi-select state ──────────────────────────────────────
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  // ────────────────────────────────────────────────────────────

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
    const isRejected = getStatusLabel(item.RequisitionStatus) === 'Rejected';

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
      attachment: {
        show: true,
        position: 'header',
        style: 'icon',
        icon: 'paperclip',
        iconSize: 20,
        iconColor: '#fff',
        backgroundColor: '#0A66C2',
        disabled: false,
        customStyle: {},
      },
      approval: {
        show: true, // ← always visible
        position: 'bottom',
        style: 'approval_dropdown',
        text: isRejected ? 'Re-submit' : 'Approval',
        icon: 'check-square',
        textColor: '#0A66C2',
        disabled: false,
        actions: [
          // Submit: only on Draft or Rejected
          ...(isDraft || isRejected
            ? [
                {
                  key: 'submit',
                  label: isRejected ? 'Re-submit' : 'Submit',
                  icon: 'send',
                },
              ]
            : []),

          // View History: every status except Draft
          ...(!isDraft
            ? [
                {
                  key: 'viewHistory',
                  label: 'View History',
                  icon: 'clock',
                },
              ]
            : []),
        ],
      },
    };
  };

  const handleButtonPress = (buttonType, item) => {
    if (buttonType === 'edit') handleEditPress(item);
    else if (buttonType === 'delete') handleDeletePress(item);
    else if (buttonType === 'attachment') handleAttachmentPress(item);
    else if (buttonType === 'submit') handleSubmitRequest(item);
    else if (buttonType === 'viewHistory') handleViewHistory(item); // ← add this
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

  const handleAttachmentPress = item => {
    setSelectedItem(item);
    setAttachmentModal(true);
  };

  const handleViewHistory = item => {
    navigation.navigate('WorkflowHistoryScreen', {
      recId: item.RecId,
      tableId: item.TableId,
      cameFrom: 'PurchaseRequisitionListPage',
    });
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

  // ── Multi-select handlers ───────────────────────────────────

  const handleLongPress = useCallback(data => {
    setIsMultiSelectMode(true);
    setSelectedIds(new Set([data.RecId]));
  }, []);

  const handleSelectToggle = useCallback(data => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(data.RecId)) {
        next.delete(data.RecId);
      } else {
        next.add(data.RecId);
      }
      if (next.size === 0) setIsMultiSelectMode(false);
      return next;
    });
  }, []);

  const handleMultiSelectCancel = useCallback(() => {
    setSelectedIds(new Set());
    setIsMultiSelectMode(false);
  }, []);

  const handleSelectAll = useCallback(() => {
    const allIds = getFilteredData().map(item => item.RecId);
    setSelectedIds(new Set(allIds));
  }, [displayData, activeFilter, purchaseRequisitiondata]);

  // Bulk Submit — only submits Draft items from the selection
  const handleBulkSubmit = useCallback(async () => {
    const filteredData = getFilteredData();
    const selectedItems = filteredData.filter(
      item =>
        selectedIds.has(item.RecId) &&
        (item.RequisitionStatus === 'Draft' || !item.RequisitionStatus),
    );

    if (selectedItems.length === 0) {
      setAlertMessage('No draft records selected for submission.');
      setAlertModal(true);
      return;
    }

    setIsBulkSubmitting(true);
    try {
      const requestList = selectedItems.map(item => item.PurchReqId);
      const response = await submitPurchaseRequisition({
        _requestList: requestList,
      });

      const resObj = Array.isArray(response) ? response[0] : response;

      if (resObj && String(resObj.IsSuccess).toLowerCase() === 'true') {
        setAlertMessage(
          `${selectedItems.length} record(s) submitted successfully.`,
        );
        setAlertModal(true);
        fetchPurchaseRequisitionData();
      } else {
        setAlertMessage(resObj?.Message || 'Failed to submit records.');
        setAlertModal(true);
      }
    } catch (error) {
      setAlertMessage('Failed to submit records.');
      setAlertModal(true);
    } finally {
      setIsBulkSubmitting(false);
      handleMultiSelectCancel();
    }
  }, [selectedIds, fetchPurchaseRequisitionData, handleMultiSelectCancel]);

  // Bulk Delete — only deletes Draft items from the selection
  const handleBulkDelete = useCallback(async () => {
    const filteredData = getFilteredData();
    const selectedItems = filteredData.filter(
      item =>
        selectedIds.has(item.RecId) &&
        (item.RequisitionStatus === 'Draft' || !item.RequisitionStatus),
    );

    if (selectedItems.length === 0) {
      setAlertMessage('No draft records selected for deletion.');
      setAlertModal(true);
      return;
    }

    // Reuse existing delete confirmation modal for bulk too
    // Store all selected items temporarily
    setItemToDelete({_bulk: true, items: selectedItems});
    setDeleteModal(true);
  }, [selectedIds]);

  // ────────────────────────────────────────────────────────────

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
      setRawData(data);
      setDisplayData(data);
      console.log('Here is req data', data);

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
  }, [effectiveEmployeeId, fadeAnim]);

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

  // const getFilteredData = () => {
  //   const base = displayData.length > 0 ? displayData : purchaseRequisitiondata;

  //   if (activeFilter === 'All') return base;

  //   return base.filter(item => {
  //     const rawStatus = item.RequisitionStatus?.toLowerCase();

  //     if (activeFilter === 'Pending') {
  //       return (
  //         rawStatus === 'submitted' ||
  //         rawStatus === 'in review' ||
  //         rawStatus === 'inreview'
  //       );
  //     }

  //     if (activeFilter === 'Completed') {
  //       return rawStatus === 'closed';
  //     }

  //     return rawStatus === activeFilter.toLowerCase();
  //   });
  // };

  const getFilteredData = () => {
    const base = searchQuery.trim() ? displayData : purchaseRequisitiondata;
    if (activeFilter === 'All') return base;
    return base.filter(
      item => getStatusLabel(item.RequisitionStatus) === activeFilter,
    );
  };

  const getFilterCounts = () => {
    const counts = {All: purchaseRequisitiondata.length};
    [
      ...new Set(
        purchaseRequisitiondata.map(item =>
          getStatusLabel(item.RequisitionStatus),
        ),
      ),
    ].forEach(status => {
      counts[status] = purchaseRequisitiondata.filter(
        item => getStatusLabel(item.RequisitionStatus) === status,
      ).length;
    });
    return counts;
  };

  const visiblePills = useMemo(() => {
    if (!purchaseRequisitiondata.length) return ['All'];
    const unique = [
      ...new Set(
        purchaseRequisitiondata.map(item =>
          getStatusLabel(item.RequisitionStatus),
        ),
      ),
    ];
    return ['All', ...unique];
  }, [purchaseRequisitiondata]);

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
      routes: [{name: targetRoute}],
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
        searchQuery={searchQuery}
        // // ── Multi-select wiring ──
        // isMultiSelectMode={isMultiSelectMode}
        // isSelected={selectedIds.has(item.RecId)}
        // onLongPress={handleLongPress}
        // onSelectToggle={handleSelectToggle}
      />
    );
  };

  return (
    <ActionPaneContainer
      pageTitle="Purchase requisitions"
      isBackButton={false}
      showFooter={true}
      showFloatingButton={true}
      isHeaderActive={true}
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={handleCreateRecord}
      showFilterPills={true}
      filterPills={visiblePills} // ← add this
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      filterCounts={getFilterCounts()}
      showPageTitleRow={true}
      showSearchBar={true}
      onSearchChange={handleSearch}
      onSortChange={handleSort}
      activeSortOrder={sortOrder}>
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
          {getFilteredData().length > 0 ? (
            <FlatList
              data={getFilteredData()}
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
              {searchQuery.trim() ? (
                // Search returned no results
                <>
                  <Text style={styles.DLP_NoDataSubText}>
                    No records match "{searchQuery}"
                  </Text>
                </>
              ) : rawData.length === 0 && activeFilter === 'All' ? (
                <>
                  <Text style={styles.DLP_NoDataText}>Get started</Text>
                  <Text style={styles.DLP_NoDataSubText}>
                    Tap + to add a new record
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.DLP_NoDataText}>
                    {`${activeFilter} record not found.`}
                  </Text>
                </>
              )}
            </ScrollView>
          )}
        </Animated.View>
      )}

      {/* ── Floating multi-select action bar ──
      <MultiSelectActionBar
        visible={isMultiSelectMode}
        selectedCount={selectedIds.size}
        onSubmitAll={handleBulkSubmit}
        onDeleteAll={handleBulkDelete}
        onCancel={handleMultiSelectCancel}
        isSubmitting={isBulkSubmitting}
        isDeleting={isBulkDeleting}
        topOffset={8}
      /> */}

      <DynamicAttachmentModal
        visible={attachmentModal}
        recordData={selectedItem}
        recordIdKey="RecId"
        tableName="PurchReqTable"
        onClose={() => {
          setAttachmentModal(false);
          setSelectedItem(null);
        }}
        onSave={() => {
          fetchPurchaseRequisitionData();
        }}
        legalEntity={selectedLegalEntity}
        employeeId={effectiveEmployeeId}
        employeeName={effectiveEmployeeName}
        modalTitle={'Purchase Requisition Receipts'}
        showDetails={true}
        detailFields={[
          {key: 'PurchReqId', label: 'Requisition ID'},
          {key: 'PurchReqName', label: 'Title'},
          {key: 'RequiredDate', label: 'Required Date'},
        ]}
        detailData={selectedItem || {}}
        showTakePhoto={
          !selectedItem?.RequisitionStatus ||
          selectedItem?.RequisitionStatus === 'Draft'
        }
        showChooseFile={
          !selectedItem?.RequisitionStatus ||
          selectedItem?.RequisitionStatus === 'Draft'
        }
        showDownload={true}
        showDelete={
          !selectedItem?.RequisitionStatus ||
          selectedItem?.RequisitionStatus === 'Draft'
        }
      />

      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />

      <AlertDeleteModal
        visible={deleteModal}
        heading="Confirm Deletion"
        text={
          itemToDelete?._bulk
            ? `Are you sure you want to delete ${itemToDelete.items.length} selected record(s)?`
            : 'Are you sure you want to delete this record?'
        }
        onPress={async () => {
          // ── Bulk delete path ──
          if (itemToDelete?._bulk) {
            setDeleteModal(false);
            setIsBulkDeleting(true);
            try {
              const contractList = itemToDelete.items.map(i => ({
                RecId: i.RecId,
              }));
              await deletePurchaseRequisition({_contractList: contractList});

              const deletedIds = new Set(itemToDelete.items.map(i => i.RecId));
              setPurchaseRequisitionData(prev =>
                prev.filter(i => !deletedIds.has(i.RecId)),
              );
              setRawData(prev => prev.filter(i => !deletedIds.has(i.RecId)));
              setDisplayData(prev =>
                prev.filter(i => !deletedIds.has(i.RecId)),
              );

              setAlertMessage(
                `${itemToDelete.items.length} record(s) deleted successfully.`,
              );
              setAlertModal(true);
            } catch (error) {
              setAlertMessage('Failed to delete records.');
              setAlertModal(true);
            } finally {
              setIsBulkDeleting(false);
              setItemToDelete(null);
              handleMultiSelectCancel();
            }
            return;
          }

          // ── Single delete path (unchanged) ──
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
