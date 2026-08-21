/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useCallback, useState} from 'react';
import {
  Text,
  RefreshControl,
  ScrollView,
  FlatList,
  BackHandler,
  Animated,
  View,
  ActivityIndicator,
} from 'react-native';
import {useSelector} from 'react-redux';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';

import {FindEmployeeTravelRequisition} from '../../../API/TravelRequisition/Header/FindEmployeeTravelRequisition';
import {DeleteTravelRequisitions} from '../../../API/TravelRequisition/Header/DeleteTravelRequisitions';
import {SubmitTravelRequisition} from '../../../API/TravelRequisition/Header/SubmitTravelRequisition';
import {translate as t} from '../../../../../store/utils/translate';
import DynamicAttachmentModal from '../../../../../shared/DynamicAttachmentModal';

import AlertModal from '../../../../../components/Alert/AlertModal';
import useAlertModal from '../../../../../hooks/useAlertModal';
import DynamicRequestCard from '../../../../../components/DynamicRequestCard';
import ActionPaneContainer from '../../../../../components/ActionPaneContainer';
import CustomIndicator from '../../../../../components/CustomIndicator/CustomIndicator';
import AlertDeleteModal from '../../../../../components/Alert/AlertDeleteModal';
import styles from '../../../../../styles/styles';
import useNotify from '../../../../../hooks/useNotify';
import useListFilters from '../../../../../hooks/useListFilters';
import usePalette from '../../../../../hooks/usePalette';
import WorkflowCommentModal from '../../../../../components/CommentModal/WorkflowCommentModal';

const TravelRequisitionListPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const P = usePalette();

  const {
    employeeId,
    employeeName,
    WorkerRecId,
    cameFrom,
    userData: routeUserData,
  } = route.params || {};

  // Redux
  const reduxUserData = useSelector(state => state.user.userData);
  const {selectedLegalEntity} = useSelector(state => state.company);

  const effectiveUserData = routeUserData || reduxUserData;
  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
  const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;
  const effectiveWorkerRecId = WorkerRecId || effectiveUserData?.WorkerRecId;
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [submitTargetItem, setSubmitTargetItem] = useState(null);

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const {showSuccess, showError, alertModalProps} = useAlertModal();
  const [travelData, setTravelData] = useState([]);
  const [processingButtons, setProcessingButtons] = useState({});
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptModal, setReceiptModal] = useState(false);
  const [selectedTravelItem, setSelectedTravelItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const {notifySuccess, notifyError, notifyDelete} =
    useNotify('Travel Requisition');

  // Card config — find returns only RequisitionNumber, Location,
  // RequisitionDate, ApprovalStatus, TotalEstimateWithCurrency, RecId.
  const CARD_CONFIG = {
    headerConfig: {
      title: {key: 'RequisitionNumber'},
    },
    fields: [
      {key: 'Location', label: 'Destination', type: 'text'},
      {key: 'RequisitionDate', label: 'Date', type: 'Date'},
      {key: 'TotalEstimateWithCurrency', label: 'Total estimate', type: 'text'},
      {key: 'ApprovalStatus', label: '', type: 'status'},
    ],
  };

  const STATUS_MAP = {
    Create: 'Create',
    Draft: 'Draft',
    Submitted: 'Submitted',
    Approved: 'Approved',
    Rejected: 'Rejected',
    Paid: 'Paid',
    Pending: 'Pending Approval',
  };

  const getStatusLabel = status => STATUS_MAP[status] || status || 'Create';

  const formatDate = dateString => {
    if (!dateString || dateString === '1900-01-01T00:00:00') return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const normalizeRecId = item => item.recId || item.RecId || '';

  const f = useListFilters({
    data: travelData,
    dateField: 'RequisitionDate',
    classifyPill: item => getStatusLabel(item.ApprovalStatus),
  });

  const setButtonProcessing = (recId, buttonType, isProcessingFlag) => {
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: isProcessingFlag
        ? [...(prev[recId] || []), buttonType]
        : (prev[recId] || []).filter(btn => btn !== buttonType),
    }));
  };

  const handleAttachmentPress = itemData => {
    console.log(
      '[TravelReq ATTACH] recId:',
      itemData.recId,
      'full:',
      JSON.stringify(itemData),
    );
    setSelectedTravelItem(itemData);
    setReceiptModal(true);
  };

  // Fetch data — scoped to the worker's travel requisitions
  const fetchTravelData = useCallback(async () => {
    if (!effectiveWorkerRecId) {
      setIsLoading(false);
      return;
    }

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();

    try {
      const headers = await FindEmployeeTravelRequisition(effectiveWorkerRecId);

      const sortedData = (headers || []).sort((a, b) => {
        const dateA = a.RequisitionDate ? new Date(a.RequisitionDate) : 0;
        const dateB = b.RequisitionDate ? new Date(b.RequisitionDate) : 0;
        return dateB - dateA;
      });

      setTravelData(sortedData);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      showError('Failed to fetch data.');
    } finally {
      setIsLoading(false);
    }
  }, [effectiveWorkerRecId]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchTravelData();
    }, [fetchTravelData]),
  );

  // Back handler
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

  const handleGoBack = useCallback(() => {
    let targetRoute = 'MainDashboard';
    switch (cameFrom) {
      case 'DisplayListPage':
        targetRoute = 'DisplayListPage';
        break;
      case 'WorkerAssignedToMe':
        targetRoute = 'WorkerAssignedToMe';
        break;
      case 'DrawerNavigator':
      case 'MainDashboard':
      default:
        break;
    }
    navigation.reset({index: 0, routes: [{name: targetRoute}]});
  }, [navigation, cameFrom]);

  // Card click - Navigate to Lines List
  const handleCardPress = itemData => {
    const itemRecId = normalizeRecId(itemData);

    // ── DIAGNOSTIC (instrumentation only — remove after wire shape confirmed) ──
    console.log('[TravelReq NAV→Lines] tapped item:', JSON.stringify(itemData));
    console.log(
      '[TravelReq NAV→Lines] params:',
      JSON.stringify({
        headerRecId: itemRecId,
        requisitionNumber: itemData.RequisitionNumber,
        WorkerRecId: effectiveWorkerRecId,
        legalEntity: selectedLegalEntity,
      }),
    );

    navigation.navigate('TravelRequisitionLinesListPage', {
      headerRecId: itemRecId,
      requisitionNumber: itemData.RequisitionNumber,
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      legalEntity: selectedLegalEntity,
      userData: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
      },
      travelRequisitionData: {
        ...itemData,
        recId: itemRecId,
      },
      cameFrom: 'TravelRequisitionListPage',
      originalCameFrom: cameFrom,
    });
  };

  const handleCreateTravel = useCallback(() => {
    navigation.navigate('TravelRequisitionSaveRecord', {
      mode: 'create',
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
      },
      legalEntity: selectedLegalEntity,
      cameFrom: 'TravelRequisitionListPage',
      originalCameFrom: cameFrom,
    });
  }, [
    navigation,
    effectiveEmployeeId,
    effectiveEmployeeName,
    effectiveWorkerRecId,
    selectedLegalEntity,
    cameFrom,
  ]);

  // Edit is only reachable while the requisition is still editable — same
  // status gate as the delete button ('Draft' OR 'Create'). Enforced both
  // here (button disabled below) and, ideally, server-side too — the current
  // updateRecord() in DFTravelRequisitionSvc does NOT itself check
  // ApprovalStatus before writing, so this client-side gate is the only
  // thing currently preventing an edit on a submitted/approved requisition.
  const handleEditTravel = useCallback(
    itemData => {
      const itemRecId = normalizeRecId(itemData);
      navigation.navigate('TravelRequisitionSaveRecord', {
        mode: 'edit',
        headerData: {
          ...itemData,
          RecId: itemRecId,
        },
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
        userData: {
          employeeId: effectiveEmployeeId,
          employeeName: effectiveEmployeeName,
          WorkerRecId: effectiveWorkerRecId,
        },
        legalEntity: selectedLegalEntity,
        cameFrom: 'TravelRequisitionListPage',
        originalCameFrom: cameFrom,
      });
    },
    [
      navigation,
      effectiveEmployeeId,
      effectiveEmployeeName,
      effectiveWorkerRecId,
      selectedLegalEntity,
      cameFrom,
    ],
  );

  const getButtonConfig = item => {
    // Submit is allowed only while ApprovalStatus is 'Create'. Delete/Edit are
    // allowed while the requisition is still editable — 'Draft' OR 'Create' —
    // and locked once it is 'Submitted'/'Approved'.
    const isCreate =
      item.ApprovalStatus === 'Create' || item.ApprovalStatus === 'Draft';
    const isEditable =
      item.ApprovalStatus === 'Draft' || item.ApprovalStatus === 'Create';

    return {
      edit: {
        show: true,
        position: 'header',
        style: 'icon',
        icon: 'edit',
        iconSize: 20,
        iconColor: '#fff',
        backgroundColor: P.primary,
        disabled: !isEditable,
        customStyle: !isEditable ? {backgroundColor: '#BDBDBD'} : {},
      },
      delete: {
        show: true,
        position: 'header',
        style: 'icon',
        icon: 'trash',
        iconSize: 20,
        iconColor: '#fff',
        backgroundColor: P.primary,
        disabled: !isEditable,
        customStyle: !isEditable ? {backgroundColor: '#BDBDBD'} : {},
      },
      attachment: {
        show: false,
        position: 'header',
        style: 'icon',
        icon: 'paperclip',
        iconSize: 20,
        iconColor: '#fff',
        backgroundColor: P.primary,
        customStyle: {},
      },
      approval: {
        show: true,
        position: 'bottom',
        style: 'approval_dropdown',
        text: 'Approval',
        icon: 'check-square',
        textColor: P.primary,
        disabled: false,
        actions: [
          ...(isCreate
            ? [
                {
                  key: 'submit',
                  label: 'Submit',
                  icon: 'send',
                },
              ]
            : [
                {
                  key: 'viewHistory',
                  label: 'View History',
                  icon: 'clock',
                },
              ]),
        ],
      },
    };
  };

  const handleButtonPress = (buttonType, item) => {
    if (buttonType === 'delete') handleDeletePress(item);
    else if (buttonType === 'edit') handleEditTravel(item);
    else if (buttonType === 'attachment') handleAttachmentPress(item);
    else if (buttonType === 'submit') openSubmitCommentModal(item);
    else if (buttonType === 'viewHistory') handleViewHistory(item);
  };

  const handleDeletePress = itemData => {
    setItemToDelete(itemData);
    setDeleteModal(true);
  };

  const openSubmitCommentModal = itemData => {
    setSubmitTargetItem(itemData);
    setCommentModalVisible(true);
  };

  const closeSubmitCommentModal = () => {
    if (isProcessing) return;
    setCommentModalVisible(false);
    setSubmitTargetItem(null);
  };

  const handleCommentModalCancel = () => {
    setCommentModalVisible(false);
    setSubmitTargetItem(null);
  };

  const handleCommentModalSubmit = comment => {
    const item = submitTargetItem;
    setCommentModalVisible(false);
    setSubmitTargetItem(null);
    if (item) handleSubmitPress(item, comment);
  };

  const handleSubmitPress = async (itemData, comment = '') => {
    setTimeout(async () => {
      setIsProcessing(true);
      setButtonProcessing(itemData.RecId, 'submit', true);

      try {
        const result = await SubmitTravelRequisition(
          normalizeRecId(itemData),
          comment,
        );

        if (result.success) {
          notifySuccess('Request submitted successfully.');
          showSuccess('Travel requisition submitted succesfully');
          setTimeout(() => fetchTravelData(), 1000);
        } else {
          notifyError(result.message);
          showError(result.message);
        }
      } catch (error) {
        showError(`Failed to submit request: ${error.message}`);
      } finally {
        setIsProcessing(false);
        setButtonProcessing(itemData.RecId, 'submit', false);
      }
    }, 100);
  };

  const handleViewHistory = item => {
    navigation.navigate('WorkflowHistoryScreen', {
      recId: normalizeRecId(item),
      tableId: item.TableId,
      cameFrom: 'TravelRequisitionListPage',
    });
  };

  const handleDeleteConfirm = async () => {
    const itemRecId = normalizeRecId(itemToDelete);

    // Keep the confirmation modal open and let its own processing state render
    // the spinner (proper dimmed backdrop); it is closed in `finally`.
    setIsDeleting(true);

    try {
      const result = await DeleteTravelRequisitions([itemRecId]);

      if (result.IsSuccess) {
        notifyDelete('Travel requistion deleted successfully');
        showSuccess(result.Message || 'Travel requistion deleted successfully');
        setTravelData(prev =>
          prev.filter(item => normalizeRecId(item) !== itemRecId),
        );
      } else {
        showError(result.Message || 'Unable to delete record.');
      }
    } catch (error) {
      showError('Failed to delete Travel requistion. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeleteModal(false);
      setItemToDelete(null);

      setTimeout(() => {
        fetchTravelData();
      }, 800);
    }
  };

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    fetchTravelData();
  }, [fetchTravelData]);

  const renderTravelCard = ({item}) => {
    const itemRecId = normalizeRecId(item);

    const processedItem = {
      ...item,
      recId: itemRecId,
      Location: item.Location || 'N/A',
      TotalEstimateWithCurrency: item.TotalEstimateWithCurrency || 'N/A',
      ApprovalStatus: getStatusLabel(item.ApprovalStatus),
      RequisitionDate: formatDate(item.RequisitionDate),
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
    };

    return (
      <DynamicRequestCard
        data={processedItem}
        headerConfig={CARD_CONFIG.headerConfig}
        fields={CARD_CONFIG.fields}
        buttons={getButtonConfig(item)}
        // Bind directly to the RAW item, not processedItem — mirrors the
        // pattern used on the Medical Expense list page, so Edit receives the
        // unformatted RequisitionDate/etc. rather than display-formatted text.
        onButtonPress={buttonType => handleButtonPress(buttonType, item)}
        onPress={() => handleCardPress(processedItem)}
        isExpandable={true}
        gradientColors={['#b8f5d4', '#d4f0e8', '#dff4ff']}
        processingButtons={processingButtons[item.RecId] || []}
        showNavigationArrow={true}
        searchQuery={f.searchQuery}
      />
    );
  };

  return (
    <ActionPaneContainer
      pageTitle="Travel requisition"
      isBackButton={false}
      showFooter={true}
      showFloatingButton={true}
      isHeaderActive={true}
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={handleCreateTravel}
      showPageTitleRow={true}
      showSearchBar={true}
      {...f.actionPaneProps}>
      {isProcessing && (
        <View style={styles.DLP_ProcessingOverlay}>
          <View style={styles.DLP_ProcessingContainer}>
            <ActivityIndicator size="large" color={P.primary} />
            <Text style={styles.DLP_ProcessingText}>
              {t('common.processing')}
            </Text>
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
          {f.filteredData.length > 0 ? (
            <FlatList
              data={f.filteredData}
              renderItem={renderTravelCard}
              keyExtractor={(item, index) =>
                normalizeRecId(item)?.toString() ||
                item.RequisitionNumber?.toString() ||
                index.toString()
              }
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
              {f.searchQuery.trim() ? (
                <Text style={styles.DLP_NoDataSubText}>
                  No records match "{f.searchQuery}"
                </Text>
              ) : travelData.length === 0 && f.activeFilter === 'All' ? (
                <>
                  <Text style={styles.DLP_NoDataText}>Get started</Text>
                  <Text style={styles.DLP_NoDataSubText}>
                    Tap + to add a new record
                  </Text>
                </>
              ) : (
                <Text style={styles.DLP_NoDataText}>
                  {`${f.activeFilter} record not found.`}
                </Text>
              )}
            </ScrollView>
          )}
        </Animated.View>
      )}

      <DynamicAttachmentModal
        visible={receiptModal}
        recordData={selectedTravelItem}
        recordIdKey="recId"
        tableName="TrvRequisitionTable"
        legalEntity={selectedLegalEntity}
        employeeId={effectiveEmployeeId}
        employeeName={effectiveEmployeeName}
        modalTitle="Travel Requisition Attachments"
        onClose={() => {
          setReceiptModal(false);
          setSelectedTravelItem(null);
        }}
        onSave={() => {
          fetchTravelData();
        }}
        showDetails={true}
        detailFields={[
          {key: 'RequisitionNumber', label: 'Requisition Number'},
          {key: 'Location', label: 'Location'},
          {key: 'TotalEstimateWithCurrency', label: 'Total Estimate'},
        ]}
        detailData={selectedTravelItem || {}}
        showTakePhoto={true}
        showChooseFile={true}
        showDownload={true}
        showDelete={true}
        showView={true}
      />

      <AlertModal {...alertModalProps} />
      <AlertDeleteModal
        visible={deleteModal}
        heading="Confirm Deletion"
        text="Are you sure you want to delete this travel requisition?"
        onPress={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModal(false);
          setItemToDelete(null);
        }}
        isProcessing={isDeleting}
      />

      <WorkflowCommentModal
        visible={commentModalVisible}
        title="Submit Travel Requisition"
        message="Add a comment for the approver, or cancel to close the dialog."
        onCancel={handleCommentModalCancel}
        onSubmit={handleCommentModalSubmit}
        onRequestClose={closeSubmitCommentModal}
        isProcessing={isProcessing}
      />
    </ActionPaneContainer>
  );
};

export default TravelRequisitionListPage;
