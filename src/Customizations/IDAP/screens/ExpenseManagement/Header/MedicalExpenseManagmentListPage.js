// export default MedicalExpenseManagmentListPage;
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

// import RetrieveMedicalHeaderReceipts from '../../../API/ExpenseManagement/Header/RetrieveMedicalHeaderReceipts';
import DynamicAttachmentModal from '../../../../../shared/DynamicAttachmentModal';
import {GetAllExpenseManagementHeaders} from '../../../API/ExpenseManagement/Header/GetAllExpenseManagementHeaders';
import {DeleteExpenseReports} from '../../../../../API/ExpenseManagment/Headers/DeleteExpenseReports';
import {SubmitExpenseManagementHeader} from '../../../API/ExpenseManagement/Header/SubmitExpenseManagementHeader';
import RecallWorkflowRecordGeneric from '../../../../../API/WorkflowTrackingStatusTable/RecallWorkflowRecordGeneric';
import {translate as t} from '../../../../../store/utils/translate';
import DynamicRequestCard from '../../../../../components/DynamicRequestCard';
import ActionPaneContainer from '../../../../../components/ActionPaneContainer';
import CustomIndicator from '../../../../../components/CustomIndicator/CustomIndicator';

import AlertModal from '../../../../../components/Alert/AlertModal';
import useAlertModal from '../../../../../hooks/useAlertModal';
import AlertDeleteModal from '../../../../../components/Alert/AlertDeleteModal';

import styles from '../../../../../styles/styles';
import useNotify from '../../../../../hooks/useNotify';
import useListFilters from '../../../../../hooks/useListFilters';
import usePalette from '../../../../../hooks/usePalette';
import WorkflowCommentModal from '../../../../../components/CommentModal/WorkflowCommentModal';

const EXPENSE_PURPOSE = 'Medical'; // single source of truth for this screen

const MedicalExpenseManagmentListPage = () => {
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
  // Recall-comment modal state — recall opens this to collect an optional
  // comment before calling the API, same pattern as the submit comment flow.
  const [recallCommentModalVisible, setRecallCommentModalVisible] =
    useState(false);
  const [recallTargetItem, setRecallTargetItem] = useState(null);

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const {showSuccess, showError, alertModalProps} = useAlertModal();
  const [expenseData, setExpenseData] = useState([]);
  const [processingButtons, setProcessingButtons] = useState({});
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [attachmentModal, setAttachmentModal] = useState(false);
  const [selectedHeaderItem, setSelectedHeaderItem] = useState(null);
  const {notifySuccess, notifyError, notifyDelete} = useNotify(
    'Medical Expense Report',
  );

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
  };
  const cleanJsonPlaceholder = value => {
    if (!value) return '';
    const pattern =
      /{"@_i:type":"c:string","@_xmlns:c":"http:\/\/www\.w3\.org\/2001\/XMLSchema"}/;
    return typeof value === 'string' && pattern.test(value) ? '' : value;
  };

  const getStatusLabel = status => STATUS_MAP[status] || status || 'Draft';

  const formatDate = dateString => {
    if (!dateString || dateString.startsWith('1900-01-01')) return 'N/A';
    const datePart = dateString.split('T')[0]; // "2026-08-16"
    const [year, month, day] = datePart.split('-').map(Number);
    if (!year || !month || !day) return dateString;
    return `${String(day).padStart(2, '0')}/${String(month).padStart(
      2,
      '0',
    )}/${year}`;
  };

  const formatPaymentDate = dateString => {
    if (!dateString || dateString.startsWith('1900-01-01')) return '';
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    if (!year || !month || !day) return dateString;
    return `${String(day).padStart(2, '0')}/${String(month).padStart(
      2,
      '0',
    )}/${year}`;
  };

  const normalizeRecId = item => item.HeaderRecId || '';

  const f = useListFilters({
    data: expenseData,
    dateField: 'CreatedDateTime',
    classifyPill: item => getStatusLabel(item.ApprovalStatus),
  });

  const setButtonProcessing = (recId, buttonType, isProcessing) => {
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: isProcessing
        ? [...(prev[recId] || []), buttonType]
        : (prev[recId] || []).filter(btn => btn !== buttonType),
    }));
  };

  const handleAttachmentPress = itemData => {
    setSelectedHeaderItem(itemData);
    setAttachmentModal(true);
  };

  // Fetch data — scoped to Medical purpose only
  const fetchExpenseData = useCallback(async () => {
    if (!effectiveEmployeeId) {
      setIsLoading(false);
      return;
    }

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();

    try {
      const myExpenseHeaderData = await GetAllExpenseManagementHeaders({
        personnelNumber: effectiveEmployeeId,
        purpose: 'Medical',
      });
      console.log('here is the required data', myExpenseHeaderData);

      const sortedData = (myExpenseHeaderData || []).sort((a, b) => {
        const dateA = new Date(a.CreatedDateTime || 0);
        const dateB = new Date(b.CreatedDateTime || 0);
        return dateB - dateA;
      });

      setExpenseData(sortedData);

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
  }, [effectiveEmployeeId, selectedLegalEntity]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchExpenseData();
    }, [fetchExpenseData]),
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

  // Back handler
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        console.log(
          '[BACK] HEADER handler, isFocused:',
          navigation.isFocused(),
        );
        if (!navigation.isFocused()) return false; // ← add this
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

  const handleCardPress = itemData => {
    const itemRecId = normalizeRecId(itemData);

    navigation.navigate('MedicalExpenseLinesListPage', {
      headerRecId: itemRecId,
      expenseReportNumber: itemData.ExpenseNumber,
      expenseReportRecId: itemRecId,
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      legalEntity: selectedLegalEntity,
      userData: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
      },
      expenseReportData: {
        ...itemData,
        recId: itemRecId,
      },
      cameFrom: 'MedicalExpenseManagmentListPage',
      originalCameFrom: cameFrom,
    });
  };

  const handleCreateExpense = useCallback(() => {
    navigation.navigate('MedicalExpenseManagementSaveRecord', {
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
      cameFrom: 'MedicalExpenseManagmentListPage',
      originalCameFrom: cameFrom,
      expenseData: {purpose: EXPENSE_PURPOSE},
    });
  }, [
    navigation,
    effectiveEmployeeId,
    effectiveEmployeeName,
    effectiveWorkerRecId,
    selectedLegalEntity,
    cameFrom,
  ]);

  // Edit is only reachable for Draft-status records — enforced both here
  // (button disabled below) and expected server-side, same defense-in-depth
  // pattern as the delete button on this same card.
  const handleEditExpense = useCallback(
    itemData => {
      const itemRecId = normalizeRecId(itemData);
      navigation.navigate('MedicalExpenseManagementSaveRecord', {
        mode: 'edit',
        headerData: {
          ...itemData,
          HeaderRecId: itemRecId,
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
        cameFrom: 'MedicalExpenseManagmentListPage',
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
    const isDraft = item.ApprovalStatus === 'Draft';
    const isRejected = getStatusLabel(item.ApprovalStatus) === 'Rejected';
    const isPending = item.ApprovalStatus === 'In review';

    return {
      edit: {
        show: true,
        position: 'header',
        style: 'icon',
        icon: 'edit',
        iconSize: 20,
        iconColor: P.onPrimary,
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
        iconColor: P.onPrimary,
        backgroundColor: P.primary,
        disabled: !isDraft,
        customStyle: !isDraft ? {backgroundColor: '#BDBDBD'} : {},
      },
      attachment: {
        show: false,
        position: 'header',
        style: 'icon',
        icon: 'paperclip',
        iconSize: 20,
        iconColor: P.onPrimary,
        backgroundColor: P.primary,
        customStyle: {},
      },
      approval: {
        show: true,
        position: 'bottom',
        style: 'approval_dropdown',
        text: isRejected ? 'Re-submit' : 'Approval',
        icon: 'check-square',
        textColor: P.primaryStrong,
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
          ...(isPending
            ? [{key: 'recall', label: 'Recall', icon: 'rotate-ccw'}]
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
    else if (buttonType === 'recall') openRecallCommentModal(item);
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
    const recId = normalizeRecId(itemData); // itemData.HeaderRecId

    setTimeout(async () => {
      setIsProcessing(true);
      setButtonProcessing(recId, 'submit', true);

      try {
        const result = await SubmitExpenseManagementHeader({recId, comment});

        if (result.IsSuccess) {
          notifySuccess('Request submitted successfully.');
          showSuccess(
            result.Message || 'Medical expense report submitted successfully.',
          );
          setTimeout(() => fetchExpenseData(), 1000);
        } else {
          notifyError(result.Message);
          showError(result.Message); // was: setAlertMessage + setAlertModal(true)
        }
      } catch (error) {
        showError(extractErrorMessage(error.message));
      } finally {
        setIsProcessing(false);
        setButtonProcessing(recId, 'submit', false);
      }
    }, 100);
  };

  const handleRecallPress = (itemData, comment = '') => {
    const recId = normalizeRecId(itemData);

    setTimeout(async () => {
      setIsProcessing(true);
      setButtonProcessing(recId, 'recall', true);

      try {
        const result = await RecallWorkflowRecordGeneric({
          tableId: Number(itemData.TableId),
          recId,
          comment,
        });

        if (String(result?.IsSuccess).toLowerCase() === 'true') {
          notifySuccess('Medical expense report recalled successfully.');
          showSuccess('Medical expense report recalled successfully.');
          setTimeout(() => fetchExpenseData(), 1000);
        } else {
          notifyError(result?.Message);
          showError(result?.Message || 'Failed to recall request.');
        }
      } catch (error) {
        showError(extractErrorMessage(error.message));
      } finally {
        setIsProcessing(false);
        setButtonProcessing(recId, 'recall', false);
      }
    }, 100);
  };

  const openRecallCommentModal = itemData => {
    setRecallTargetItem(itemData);
    setRecallCommentModalVisible(true);
  };

  const closeRecallCommentModal = () => {
    if (isProcessing) return;
    setRecallCommentModalVisible(false);
    setRecallTargetItem(null);
  };

  const handleRecallCommentModalCancel = () => {
    setRecallCommentModalVisible(false);
    setRecallTargetItem(null);
  };

  const handleRecallCommentModalSubmit = comment => {
    const item = recallTargetItem;
    setRecallCommentModalVisible(false);
    setRecallTargetItem(null);
    if (item) handleRecallPress(item, comment);
  };

  const extractErrorMessage = rawMessage => {
    if (!rawMessage || typeof rawMessage !== 'string') {
      return 'Failed to submit request. Please try again.';
    }

    // D365 SOAP fault: prefer <ExceptionMessage>, fall back to <faultstring>
    const exceptionMatch = rawMessage.match(
      /<ExceptionMessage>(.*?)<\/ExceptionMessage>/,
    );
    if (exceptionMatch) return exceptionMatch[1];

    const faultStringMatch = rawMessage.match(
      /<faultstring>(.*?)<\/faultstring>/,
    );
    if (faultStringMatch) return faultStringMatch[1];

    // Not a SOAP fault we recognize — if it looks like raw XML/HTML, don't dump
    // it on the user; otherwise it's probably already a clean message.
    if (rawMessage.trim().startsWith('<')) {
      return 'Failed to submit request. Please try again.';
    }

    return rawMessage;
  };

  const handleViewHistory = item => {
    navigation.navigate('WorkflowHistoryScreen', {
      recId: normalizeRecId(item),
      tableId: item.TableId,
      cameFrom: 'MedicalExpenseManagmentListPage',
    });
  };

  const handleDeleteConfirm = async () => {
    const itemRecId = normalizeRecId(itemToDelete);

    setDeleteModal(false);
    setTimeout(async () => {
      setIsProcessing(true);
      setButtonProcessing(itemToDelete.HeaderRecId, 'delete', true);

      try {
        const result = await DeleteExpenseReports({
          employeeId: effectiveEmployeeId,
          expenseReportNumbers: [itemToDelete.ExpenseNumber],
          legalEntity: selectedLegalEntity,
        });

        if (result.success) {
          notifyDelete('Medical expense report deleted successfully');
          showSuccess('Medical expense deleted successfully'); // was: setAlertMessage(...)
          setExpenseData(prev =>
            prev.filter(exp => normalizeRecId(exp) !== itemRecId),
          );
        } else {
          showError('Unable to delete Medical expense. Please try again.'); // was: setAlertMessage(...)
        }
      } catch (error) {
        showError('Failed to delete Medical expense. Please try again.'); // was: setAlertMessage(...)
      } finally {
        setIsProcessing(false);
        setButtonProcessing(itemToDelete.HeaderRecId, 'delete', false);
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
      Location: cleanJsonPlaceholder(item.Location) || 'N/A',
      InvoiceId: cleanJsonPlaceholder(item.InvoiceId) || 'N/A',
      PaymentVoucher: cleanJsonPlaceholder(item.PaymentVoucher) || 'N/A',
      ApprovalStatus: getStatusLabel(item.ApprovalStatus),
      Amount: item.Amount || 'N/A',
      PaymentDate: formatPaymentDate(item.PaymentDate),
      HasReceiptAttached:
        item.HasReceiptAttached === 'true' || item.HasReceiptAttached === true
          ? 'Yes'
          : 'No',
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
        // Bind directly to the RAW item from this closure — DynamicRequestCard's
        // onButtonPress callback may only echo back a filtered subset of
        // processedItem (whatever's declared in CARD_CONFIG fields), dropping
        // fields like TableId that aren't shown on the card itself.
        //
        // NOTE: this means handleEditExpense receives the RAW item, not
        // processedItem — so Location/InvoiceId/etc. won't have the
        // cleanJsonPlaceholder() treatment applied. expenseCategory/date
        // (whatever key GetAllExpenseManagementHeaders actually returns them
        // under) should still be intact on the raw item either way.
        onButtonPress={buttonType => handleButtonPress(buttonType, item)}
        onPress={() => handleCardPress(processedItem)}
        isExpandable={true}
        processingButtons={processingButtons[itemRecId] || []}
        showNavigationArrow={true}
        searchQuery={f.searchQuery}
      />
    );
  };
  return (
    <ActionPaneContainer
      pageTitle="Medical Expense Reports"
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
            <ActivityIndicator size="large" color={P.primaryStrong} />
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
                item.ExpenseReportNumber?.toString() ||
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

      <DynamicAttachmentModal
        visible={attachmentModal}
        recordData={selectedHeaderItem}
        recordIdKey="HeaderRecId"
        tableName="TrvExpTable"
        legalEntity={selectedLegalEntity}
        employeeId={effectiveEmployeeId}
        employeeName={effectiveEmployeeName}
        modalTitle="Medical Expense Receipts"
        showDetails={true}
        detailFields={[{key: 'ExpenseNumber', label: 'Medical Expense Number'}]}
        detailData={selectedHeaderItem || {}}
        onClose={() => {
          setAttachmentModal(false);
          setSelectedHeaderItem(null);
        }}
        onSave={() => {
          fetchExpenseData();
        }}
      />

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
        title="Submit Medical Expense Report"
        message="Add a comment for the approver, or cancel to close the dialog."
        onCancel={handleCommentModalCancel}
        onSubmit={handleCommentModalSubmit}
        onRequestClose={closeSubmitCommentModal}
        isProcessing={isProcessing}
      />

      <WorkflowCommentModal
        visible={recallCommentModalVisible}
        title="Recall Medical Expense Report"
        message="Add a comment for the recall, or cancel to close the dialog."
        onCancel={handleRecallCommentModalCancel}
        onSubmit={handleRecallCommentModalSubmit}
        onRequestClose={closeRecallCommentModal}
        isProcessing={isProcessing}
      />
    </ActionPaneContainer>
  );
};

export default MedicalExpenseManagmentListPage;
