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
import usePalette from '../../../../../hooks/usePalette';
import useNotify from '../../../../../hooks/useNotify';
import useListFilters from '../../../../../hooks/useListFilters';
import ActionPaneContainer from '../../../../../components/ActionPaneContainer';
import {GetAllExpenseManagementHeaders} from '../../../API/ExpenseManagement/Header/GetAllExpenseManagementHeaders';
import {DeleteExpenseManagementHeader} from '../../../API/ExpenseManagement/Header/DeleteExpenseManagementHeader';
import {SubmitExpenseManagementHeader} from '../../../API/ExpenseManagement/Header/SubmitExpenseManagementHeader';
import {translate as t} from '../../../../../store/utils/translate';
import DynamicRequestCard from '../../../../../components/DynamicRequestCard';
import styles from '../../../../../styles/styles';
import AlertModal from '../../../../../components/Alert/AlertModal';
import useAlertModal from '../../../../../hooks/useAlertModal';
import AlertDeleteModal from '../../../../../components/Alert/AlertDeleteModal';
import CustomIndicator from '../../../../../components/CustomIndicator/CustomIndicator';
import DynamicAttachmentModal from '../../../../../shared/DynamicAttachmentModal';
import WorkflowCommentModal from '../../../../../components/CommentModal/WorkflowCommentModal';

const ExpenseManagementHeaderListPage = () => {
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

  const reduxUserData = useSelector(state => state.user.userData);
  const {selectedLegalEntity} = useSelector(state => state.company);

  const effectiveUserData = routeUserData || reduxUserData;
  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
  const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;
  const effectiveWorkerRecId = WorkerRecId || effectiveUserData?.WorkerRecId;
  // Personnel number: employeeId is the D365 HcmWorker personnel number.
  const effectivePersonnelNumber = effectiveEmployeeId;

  const [isLoading, setIsLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const {showSuccess, showError, alertModalProps} = useAlertModal();
  const [expenseData, setExpenseData] = useState([]);
  const [processingButtons, setProcessingButtons] = useState({});
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [selectedExpenseItem, setSelectedExpenseItem] = useState(null);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [submitTargetItem, setSubmitTargetItem] = useState(null);

  const {notifySuccess, notifyError, notifyDelete} =
    useNotify('Expense Management');

  const CARD_CONFIG = {
    headerConfig: {
      title: {key: 'ExpenseNumber'},
    },
    fields: [
      {key: 'HasReceiptAttached', label: 'Receipt attached', type: 'boolean'},
      {key: 'Location', label: 'Location', type: 'text'},
      {key: 'ApprovalStatus', label: 'Approval status', type: 'status'},
      {key: 'Amount', label: 'Amount', type: 'text'},
    ],
    expandableFields: [
      {
        key: 'CreatedDateTime',
        label: 'Created date and time',
        type: 'datetime',
      },
      {key: 'PaymentDate', label: 'Payment date', type: 'date'},
      {key: 'PaymentVoucher', label: 'Payment voucher', type: 'text'},
      {key: 'InvoiceId', label: 'Invoice', type: 'text'},
    ],
  };

  const STATUS_MAP = {
    Draft: 'Draft',
    Submitted: 'Submitted',
    Approved: 'Approved',
    Rejected: 'Rejected',
    Paid: 'Paid',
    Pending: 'Pending Approval',
    'Processed for payment': 'Processed for Payment',
  };

  const getStatusLabel = status => STATUS_MAP[status] || status || 'Draft';

  const formatDate = dateString => {
    if (!dateString || dateString === '1900-01-01T00:00:00') return 'N/A';
    const date = new Date(dateString);
    return isNaN(date) ? dateString : date.toLocaleDateString();
  };

  const normalizeRecId = item =>
    item.HeaderRecId || item.recId || item.RecId || '';

  const f = useListFilters({
    data: expenseData,
    dateField: 'CreatedDateTime',
    classifyPill: item => getStatusLabel(item.ApprovalStatus),
  });

  const setButtonProcessing = (recId, buttonType, isProc) => {
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: isProc
        ? [...(prev[recId] || []), buttonType]
        : (prev[recId] || []).filter(btn => btn !== buttonType),
    }));
  };

  const fetchExpenseData = useCallback(async () => {
    if (!effectivePersonnelNumber) {
      setIsLoading(false);
      return;
    }
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
    try {
      const data = await GetAllExpenseManagementHeaders({
        personnelNumber: effectivePersonnelNumber,
      });
      const sorted = (data || []).sort((a, b) => {
        const dateA = new Date(a.CreatedDateTime || 0);
        const dateB = new Date(b.CreatedDateTime || 0);
        return dateB - dateA;
      });
      setExpenseData(sorted);
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
  }, [effectivePersonnelNumber]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchExpenseData();
    }, [fetchExpenseData]),
  );

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (!navigation.isFocused()) return false;
        handleGoBack();
        return true;
      };
      const sub = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => sub.remove();
    }, [handleGoBack, navigation]),
  );

  const handleAttachmentPress = itemData => {
    try {
      const cleanedItem = {
        ...itemData,
        CreatedDateTime: formatDate(itemData.CreatedDateTime),
      };
      setSelectedExpenseItem(cleanedItem);
      setAttachmentModalVisible(true);
    } catch (error) {
      showError('Failed to open attachments.');
    }
  };

  const handleGoBack = useCallback(() => {
    let targetRoute = 'MainDashboard';
    switch (cameFrom) {
      case 'DisplayListPage':
        targetRoute = 'DisplayListPage';
        break;
      case 'WorkerAssignedToMe':
        targetRoute = 'WorkerAssignedToMe';
        break;
      default:
        break;
    }
    navigation.reset({index: 0, routes: [{name: targetRoute}]});
  }, [navigation, cameFrom]);

  const handleCardPress = itemData => {
    const itemRecId = normalizeRecId(itemData);
    navigation.navigate('ExpenseManagementLinesListPage', {
      headerRecId: itemRecId,
      expenseNumber: itemData.ExpenseNumber,
      approvalStatus: itemData.ApprovalStatus,
      personnelNumber: effectivePersonnelNumber,
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      legalEntity: selectedLegalEntity,
      userData: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
      },
      cameFrom: 'ExpenseManagementHeaderListPage',
      originalCameFrom: cameFrom,
    });
  };

  const handleCreateExpense = useCallback(() => {
    navigation.navigate('ExpenseManagementSaveRecord', {
      mode: 'create',
      personnelNumber: effectivePersonnelNumber,
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
      },
      legalEntity: selectedLegalEntity,
      cameFrom: 'ExpenseManagementHeaderListPage',
      originalCameFrom: cameFrom,
    });
  }, [
    navigation,
    effectivePersonnelNumber,
    effectiveEmployeeId,
    effectiveEmployeeName,
    effectiveWorkerRecId,
    selectedLegalEntity,
    cameFrom,
  ]);

  // Edit is only reachable for Draft/Create-status records — enforced both
  // here (button disabled) and by whatever server-side status guard
  // updateRecord() has, same defense-in-depth pattern as the delete button.
  const handleEditExpense = useCallback(
    itemData => {
      const itemRecId = normalizeRecId(itemData);
      navigation.navigate('ExpenseManagementSaveRecord', {
        mode: 'edit',
        headerData: {
          ...itemData,
          HeaderRecId: itemRecId,
        },
        personnelNumber: effectivePersonnelNumber,
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
        userData: {
          employeeId: effectiveEmployeeId,
          employeeName: effectiveEmployeeName,
          WorkerRecId: effectiveWorkerRecId,
        },
        legalEntity: selectedLegalEntity,
        cameFrom: 'ExpenseManagementHeaderListPage',
        originalCameFrom: cameFrom,
      });
    },
    [
      navigation,
      effectivePersonnelNumber,
      effectiveEmployeeId,
      effectiveEmployeeName,
      effectiveWorkerRecId,
      selectedLegalEntity,
      cameFrom,
    ],
  );

  const getButtonConfig = item => {
    const isDraft = item.ApprovalStatus === 'Draft';
    const isRejected = getStatusLabel(item.ApprovalStatus) === 'Rejected';
    return {
      edit: {
        show: true,
        position: 'header',
        style: 'icon',
        icon: 'edit',
        iconSize: 20,
        iconColor: '#fff',
        backgroundColor: P.primary,
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
        backgroundColor: P.primary,
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
        backgroundColor: P.primary,
        disabled: false,
        customStyle: {},
      },
      approval: {
        show: true,
        position: 'bottom',
        style: 'approval_dropdown',
        text: isRejected ? 'Re-submit' : 'Approval',
        icon: 'check-square',
        textColor: P.primary,
        disabled: false,
        actions: [
          ...(isDraft || isRejected
            ? [
                {
                  key: 'submit',
                  label: isRejected ? 'Re-submit' : 'Submit',
                  icon: 'send',
                },
              ]
            : []),
          ...(!isDraft
            ? [{key: 'viewHistory', label: 'View History', icon: 'clock'}]
            : []),
        ],
      },
    };
  };

  const handleButtonPress = (buttonType, item) => {
    if (buttonType === 'delete') handleDeletePress(item);
    else if (buttonType === 'edit') handleEditExpense(item);
    else if (buttonType === 'submit') openSubmitCommentModal(item);
    else if (buttonType === 'viewHistory') handleViewHistory(item);
    else if (buttonType === 'attachment') handleAttachmentPress(item);
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

  const handleSubmitPress = (itemData, comment = '') => {
    const recId = normalizeRecId(itemData);
    setTimeout(async () => {
      setIsProcessing(true);
      setButtonProcessing(recId, 'submit', true);
      try {
        const result = await SubmitExpenseManagementHeader({recId, comment});
        if (result.IsSuccess) {
          notifySuccess('Request submitted successfully.');
          showSuccess(result.Message || 'Request submitted successfully.');
          setTimeout(() => fetchExpenseData(), 1000);
        } else {
          notifyError(result.Message);
          showError(result.Message);
        }
      } catch (error) {
        showError(`Failed to submit request: ${error.message}`);
      } finally {
        setIsProcessing(false);
        setButtonProcessing(recId, 'submit', false);
      }
    }, 100);
  };

  const handleViewHistory = item => {
    navigation.navigate('WorkflowHistoryScreen', {
      recId: normalizeRecId(item),
      tableId: item.TableId,
      cameFrom: 'ExpenseManagementHeaderListPage',
    });
  };

  const handleDeleteConfirm = async () => {
    const itemRecId = normalizeRecId(itemToDelete);
    setDeleteModal(false);
    setTimeout(async () => {
      setIsProcessing(true);
      setButtonProcessing(itemRecId, 'delete', true);
      try {
        const result = await DeleteExpenseManagementHeader({
          recordsRecId: [itemRecId],
        });
        if (result.success) {
          notifyDelete('Record deleted successfully');
          showSuccess('Record deleted successfully');
          setExpenseData(prev =>
            prev.filter(exp => normalizeRecId(exp) !== itemRecId),
          );
        } else {
          showError(result.message || 'Unable to delete record.');
        }
      } catch (error) {
        showError('Failed to delete record. Please try again.');
      } finally {
        setIsProcessing(false);
        setButtonProcessing(itemRecId, 'delete', false);
        setItemToDelete(null);
        setTimeout(() => fetchExpenseData(), 800);
      }
    }, 100);
  };

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    fetchExpenseData();
  }, [fetchExpenseData]);

  const renderExpenseCard = ({item}) => {
    const itemRecId = normalizeRecId(item);
    const processedItem = {
      ...item,
      recId: itemRecId,
      ApprovalStatus: getStatusLabel(item.ApprovalStatus),
      Amount: item.Amount || 'N/A',
      InvoiceId: item.InvoiceId || 'N/A',
      // CreatedDateTime: formatDate(item.CreatedDateTime),
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
    };
    return (
      <DynamicRequestCard
        data={processedItem}
        headerConfig={CARD_CONFIG.headerConfig}
        fields={CARD_CONFIG.fields}
        expandableFields={CARD_CONFIG.expandableFields}
        buttons={getButtonConfig(item)}
        onButtonPress={handleButtonPress}
        onPress={() => handleCardPress(processedItem)}
        isExpandable={true}
        gradientColors={['#b8f5d4', '#d4f0e8', '#dff4ff']}
        processingButtons={processingButtons[itemRecId] || []}
        showNavigationArrow={true}
        searchQuery={f.searchQuery}
      />
    );
  };

  return (
    <ActionPaneContainer
      pageTitle="Expense reports"
      isBackButton={false}
      showFooter={true}
      showFloatingButton={true}
      isHeaderActive={true}
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={handleCreateExpense}
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
              renderItem={renderExpenseCard}
              keyExtractor={(item, index) =>
                normalizeRecId(item)?.toString() ||
                item.ExpenseNumber?.toString() ||
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
              ) : expenseData.length === 0 && f.activeFilter === 'All' ? (
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

      <AlertModal {...alertModalProps} />

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

      <WorkflowCommentModal
        visible={commentModalVisible}
        title="Submit Expense Report"
        message="Add a comment for the approver, or cancel to close the dialog."
        onCancel={handleCommentModalCancel}
        onSubmit={handleCommentModalSubmit}
        onRequestClose={closeSubmitCommentModal}
        isProcessing={isProcessing}
      />

      <DynamicAttachmentModal
        visible={attachmentModalVisible}
        recordData={selectedExpenseItem}
        recordIdKey="HeaderRecId"
        tableName="TrvExpTable"
        onClose={() => {
          setAttachmentModalVisible(false);
          setSelectedExpenseItem(null);
        }}
        onSave={() => {
          fetchExpenseData();
        }}
        legalEntity={selectedLegalEntity}
        employeeId={effectiveEmployeeId}
        employeeName={effectiveEmployeeName}
        modalTitle="Expense Attachments"
        showDetails={true}
        detailFields={[
          {key: 'ExpenseNumber', label: 'Expense Number'},
          {key: 'Amount', label: 'Amount'},
          {key: 'InvoiceId', label: 'Invoice'},
        ]}
        detailData={selectedExpenseItem || {}}
        showTakePhoto={selectedExpenseItem?.ApprovalStatus === 'Draft'}
        showChooseFile={selectedExpenseItem?.ApprovalStatus === 'Draft'}
        showDownload={true}
        showDelete={selectedExpenseItem?.ApprovalStatus === 'Draft'}
      />
    </ActionPaneContainer>
  );
};

export default ExpenseManagementHeaderListPage;
