/* eslint-disable curly */
/* eslint-disable no-shadow */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useCallback, useMemo} from 'react';
import {
  Text,
  FlatList,
  BackHandler,
  RefreshControl,
  ScrollView,
  I18nManager,
  View,
  ActivityIndicator,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {translate as t} from '../../store/utils/translate';
import {useSelector} from 'react-redux';

import {FindByEmployeeHRHelpDesk} from '../../API/HRHelpDeskRequest/FindByEmployeeHRHelpDesk';
import {DeleteHRHelpDeskRequest} from '../../API/HRHelpDeskRequest/DeleteHRHelpDeskRequest';
import {SubmitHRHelpDeskRequest} from '../../API/HRHelpDeskRequest/SubmitHRHelpDeskRequest';

import AlertModal from '../../components/Alert/AlertModal';
import AlertDeleteModal from '../../components/Alert/AlertDeleteModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import DynamicRequestCard, {
  BUTTON_TYPES,
} from '../../components/DynamicRequestCard';
import DynamicAttachmentModal from '../../shared/DynamicAttachmentModal';
import useNotify from '../../hooks/useNotify';
import useListFilters from '../../hooks/useListFilters';
import styles from '../../styles/styles';
import usePalette from '../../hooks/usePalette';

const HRHelpDeskListScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [allHelpDeskData, setAllHelpDeskData] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [highlightedRecId, setHighlightedRecId] = useState(null);
  const [processingButtons, setProcessingButtons] = useState({});
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const {notifySuccess, notifyError, notifyDelete} =
    useNotify('Help Desk Request');

  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [selectedHelpDeskItem, setSelectedHelpDeskItem] = useState(null);

  const navigation = useNavigation();
  const route = useRoute();
  const P = usePalette(); // Custom hook to get the color palette
  const isRTL = I18nManager.isRTL;

  const {selectedLegalEntity} = useSelector(state => state.company);

  const {
    employeeId,
    employeeName,
    WorkerRecId,
    cameFrom = 'MainDashboard',
    highlightRecId = null,
    userData: routeUserData,
  } = route.params || {};

  const reduxUserData = useSelector(state => state.user.userData);
  const effectiveUserData = routeUserData || reduxUserData;

  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
  const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;
  const effectiveWorkerRecId = WorkerRecId || effectiveUserData?.WorkerRecId;

  // ─── Fetch ────────────────────────────────────────────────────
  const fetchAllHelpDeskData = useCallback(async () => {
    if (!effectiveEmployeeId) return;
    setIsLoading(true);

    try {
      const allResults = await FindByEmployeeHRHelpDesk({
        employeeId: effectiveEmployeeId,
      });

      const sortedResults = [...allResults].sort((a, b) => {
        const aDate = new Date(a.ESSDate || a.CreatedDateTime || 0);
        const bDate = new Date(b.ESSDate || b.CreatedDateTime || 0);

        if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
          if (bDate.getTime() !== aDate.getTime()) return bDate - aDate;
        }

        const aRecId = parseInt(a.RecId, 10);
        const bRecId = parseInt(b.RecId, 10);
        if (!isNaN(aRecId) && !isNaN(bRecId)) return bRecId - aRecId;

        return 0;
      });

      setAllHelpDeskData(sortedResults);
    } catch (error) {
      console.error('Error fetching HR HelpDesk data:', error);
      setAlertMessage(
        'Unable to load data. Please check your connection and try again.',
      );
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveEmployeeId]);

  useFocusEffect(
    useCallback(() => {
      fetchAllHelpDeskData();
    }, [fetchAllHelpDeskData]),
  );

  useFocusEffect(
    useCallback(() => {
      if (highlightRecId) {
        setHighlightedRecId(highlightRecId);
        fetchAllHelpDeskData();
        const timer = setTimeout(() => setHighlightedRecId(null), 3000);
        return () => clearTimeout(timer);
      }
    }, [highlightRecId, fetchAllHelpDeskData]),
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
    switch (cameFrom) {
      case 'DisplayListPage':
        // ✅ Navigate into DrawerNavigator first, then to DisplayListPage inside it
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'DrawerNavigator',
            },
          ],
        });
        break;
      case 'WorkerAssignedToMe':
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'DrawerNavigator',
            },
          ],
        });
        break;
      case 'MainDashboard':
      case 'DrawerNavigation':
      case 'DrawerNavigator':
      default:
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'DrawerNavigator',
            },
          ],
        });
        break;
    }
  };

  // ─── Status ───────────────────────────────────────────────────
  // ✅ ESSWorkFlowStatus is the actual field from API
  const getStatusLabel = status => {
    if (!status) return 'Not Submitted';
    const statusMap = {
      NotSubmitted: 'Not Submitted',
      Approved: 'Approved',
      Cancelled: 'Cancelled',
      Rejected: 'Rejected',
      Submitted: 'Submitted',
      ChangeRequest: 'Change Request',
      PendingCancellation: 'Pending Cancellation',
      Returned: 'Returned',
      PendingApproval: 'Pending Approval',
      PendingComplete: 'Pending Complete',
      WorkflowCompleted: 'Workflow Completed',
      Completed: 'Completed',
      Failed: 'Failed',
    };
    return statusMap[status] || status;
  };

  // ─── Filter / search / sort ───────────────────────────────────
  // Now owned by useListFilters. Derived status pills off
  // getStatusLabel(ESSWorkFlowStatus); date filter + sort key off CreatedDateTime,
  // resolved case-insensitively. No documentType field → header Date+Sort only.
  const f = useListFilters({
    data: allHelpDeskData,
    dateField: 'CreatedDateTime',
    classifyPill: item => getStatusLabel(item.ESSWorkFlowStatus),
  });

  // ─── Handlers ─────────────────────────────────────────────────
  const handleRefresh = () => fetchAllHelpDeskData();

  const handleCreateRequest = () => {
    navigation.push('HRHelpDeskSaveScreen', {
      // ✅ push instead of navigate
      mode: 'create',
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: effectiveUserData,
      cameFrom: 'HRHelpDeskListScreen',
      helpDeskData: {
        EmployeeId: effectiveEmployeeId,
        Detail: '',
        ESSDate: '',
        RecId: '',
        ESSHRHelpDeskRequestId: '',
        ESSTypeOfProblem: '',
        ESSWorkFlowStatus: '',
      },
    });
  };

  const handleReceiptAttachmentPress = async itemData => {
    try {
      const formatDateOnly = date => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
      };
      setSelectedHelpDeskItem({
        ...itemData,
        ESSDate: formatDateOnly(itemData.ESSDate),
      });
      setAttachmentModalVisible(true);
    } catch (error) {
      setAlertMessage('Failed to open attachments');
      setAlertModal(true);
    }
  };

  const handleButtonPress = (buttonType, itemData) => {
    if (!itemData) {
      setAlertMessage('Invalid item data. Please refresh and try again.');
      setAlertModal(true);
      return;
    }
    switch (buttonType) {
      case BUTTON_TYPES.EDIT:
      case 'edit':
        handleEditPress(itemData);
        break;
      case BUTTON_TYPES.DELETE:
      case 'delete':
        handleDeletePress(itemData);
        break;
      case BUTTON_TYPES.SUBMIT:
      case 'submit':
        handleSubmitPress(itemData);
        break;
      case BUTTON_TYPES.ATTACHMENT:
      case 'attachment':
        handleReceiptAttachmentPress(itemData);
        break;
      case 'viewHistory':
        handleViewHistory(itemData);
        break;
      default:
        break;
    }
  };

  const handleViewHistory = itemData => {
    navigation.navigate('WorkflowHistoryScreen', {
      recId: itemData.RecId,
      tableId: itemData.tableId,
      cameFrom: 'HRHelpDeskListScreen',
    });
  };

  // ─── Date helpers ─────────────────────────────────────────────
  const formatDate = date => {
    if (!date) return '';
    try {
      let datePart = date;
      if (typeof date === 'string' && date.includes('T'))
        datePart = date.split('T')[0];
      if (
        typeof datePart === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(datePart)
      ) {
        const [year, month, day] = datePart.split('-');
        return `${month}/${day}/${year}`;
      }
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return `${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(
        d.getUTCDate(),
      ).padStart(2, '0')}/${d.getUTCFullYear()}`;
    } catch {
      return '';
    }
  };

  const formatToISOWithTime = date => {
    if (!date) return '';
    try {
      let datePart = date;
      if (typeof date === 'string' && date.includes('T'))
        datePart = date.split('T')[0];
      if (typeof datePart === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(datePart))
        return `${datePart}T12:00:00`;
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${day}T12:00:00`;
    } catch {
      return '';
    }
  };

  // ─── Edit ─────────────────────────────────────────────────────
  // ✅ map API fields → save screen fields correctly
  const handleEditPress = itemData => {
    navigation.push('HRHelpDeskSaveScreen', {
      // ✅ push instead of navigate
      mode: 'edit',
      employeeId: itemData.EmployeeID || effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: effectiveUserData,
      cameFrom: 'HRHelpDeskListScreen',
      helpDeskData: {
        RecId: itemData.RecId,
        EmployeeID: itemData.EmployeeID || effectiveEmployeeId, // ✅ AX field name
        ESSTypeOfProblem: itemData.ESSTypeOfProblem || '', // ✅ AX field name
        ESSDate: formatToISOWithTime(itemData.ESSDate), // ✅ AX field name
        Detail: itemData.Detail || '', // ✅ AX field name
        ESSHRHelpDeskRequestId: itemData.ESSHRHelpDeskRequestId || '', // ✅ AX field name
        ESSWorkFlowStatus: itemData.ESSWorkFlowStatus || '', // ✅ AX field name
        ESSDivision: itemData.ESSDivision || '', // ✅ AX field name
      },
    });
  };

  // ─── Delete ───────────────────────────────────────────────────
  const handleDeletePress = itemData => {
    setItemToDelete(itemData);
    setDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setDeleteModal(false);

    setTimeout(async () => {
      setIsProcessing(true);
      setButtonProcessing(itemToDelete.RecId, 'delete', true);

      try {
        const response = await DeleteHRHelpDeskRequest({
          recordsRecId: [itemToDelete.RecId],
        });

        const recordResult = response.find(
          r => String(r.RecId) === String(itemToDelete.RecId),
        );

        if (recordResult && recordResult.IsSuccess === 'true') {
          notifyDelete('Record deleted successfully');
          setAlertMessage('Record deleted successfully');
          setAllHelpDeskData(prev =>
            prev.filter(item => item.RecId !== itemToDelete.RecId),
          );
        } else {
          setAlertMessage('Unable to delete record. Please try again.');
        }
      } catch (error) {
        notifyError('Failed to delete record');
        setAlertMessage('Failed to delete record');
      } finally {
        setIsProcessing(false);
        setButtonProcessing(itemToDelete.RecId, 'delete', false);
        setItemToDelete(null);
        setAlertModal(true);
        setTimeout(() => fetchAllHelpDeskData(), 800);
      }
    }, 100);
  };

  // ─── Submit ───────────────────────────────────────────────────
  const handleSubmitPress = async itemData => {
    setTimeout(async () => {
      setIsProcessing(true);
      setButtonProcessing(itemData.RecId, 'submit', true);

      try {
        const response = await SubmitHRHelpDeskRequest({recId: itemData.RecId});

        const isSuccess =
          response?.IsSuccess === true ||
          response?.IsSuccess === 'true' ||
          String(response?.IsSuccess).toLowerCase() === 'true';

        if (isSuccess) {
          notifySuccess(response?.Message || 'Record submitted successfully');
          setAlertMessage(response?.Message || 'Record submitted successfully');
          setAlertModal(true);
          setHighlightedRecId(itemData.RecId);
          setTimeout(() => setHighlightedRecId(null), 3000);
          setTimeout(() => fetchAllHelpDeskData(), 1000);
        } else {
          setAlertMessage(response?.Message || 'Failed to submit request');
          setAlertModal(true);
        }
      } catch (error) {
        console.error('HR HelpDesk submit error:', error);
        setAlertMessage('Failed to submit request. Please try again.');
        setAlertModal(true);
      } finally {
        setIsProcessing(false);
        setButtonProcessing(itemData.RecId, 'submit', false);
      }
    }, 100);
  };

  // ─── Button processing tracker ────────────────────────────────
  const setButtonProcessing = (recId, buttonType, processing) => {
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: processing
        ? [...(prev[recId] || []), buttonType]
        : (prev[recId] || []).filter(btn => btn !== buttonType),
    }));
  };

  // ─── Card config ──────────────────────────────────────────────
  const cardConfig = {
    headerConfig: {
      title: {key: 'ESSTypeOfProblem'},
    },
    fields: [
      {key: 'ESSDate', label: 'Problem Started On', type: 'date'},
      {key: 'ESSWorkFlowStatus', label: 'Status', type: 'text'}, // ✅ displayed after transform
    ],
    expandableFields: [
      {key: 'ESSHRHelpDeskRequestId', label: 'Request Id', type: 'text'},
      {key: 'Detail', label: 'Detail Problem', type: 'text'},
    ],
    isRTL: isRTL,
  };

  // ✅ getButtonConfig receives raw item — use raw ESSWorkFlowStatus for logic
  const getButtonConfig = item => {
    const statusLabel = getStatusLabel(item.ESSWorkFlowStatus);
    const isDraft = statusLabel === 'Not Submitted';
    const isRejected = statusLabel === 'Rejected';

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
        show: true,
        position: 'header',
        style: 'icon',
        icon: 'paperclip',
        iconSize: 20,
        iconColor: P.onPrimary,
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
        ],
      },
    };
  };

  // ─── Render card ──────────────────────────────────────────────
  const renderHelpDeskCard = ({item}) => {
    if (!item) return null;

    const isHighlighted = highlightedRecId === item.RecId;
    const itemProcessingButtons = processingButtons[item.RecId] || [];

    // ✅ processedItem transforms display values only
    // getButtonConfig(item) still receives raw item for correct logic
    const processedItem = {
      ...item,
      ESSWorkFlowStatus: getStatusLabel(item.ESSWorkFlowStatus), // ✅ human-readable
      ESSDate: formatDate(item.ESSDate), // ✅ formatted date
    };

    return (
      <DynamicRequestCard
        data={processedItem}
        headerConfig={cardConfig.headerConfig}
        fields={cardConfig.fields}
        expandableFields={cardConfig.expandableFields}
        buttons={getButtonConfig(item)} // ✅ raw item for button logic
        isHighlighted={isHighlighted}
        onButtonPress={handleButtonPress}
        isExpandable={true}
        gradientColors={['#6ee0ff', '#bddeff', '#cce6ff']}
        highlightGradientColors={['#E8F5E8', '#F0FFF0']}
        processingButtons={itemProcessingButtons}
        isRTL={isRTL}
        searchQuery={f.searchQuery}
      />
    );
  };

  // ─── Render ───────────────────────────────────────────────────
  return (
    <ActionPaneContainer
      pageTitle="HR HelpDesk Requests"
      showFooter
      showFloatingButton
      isHeaderActive
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={handleCreateRequest}
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
      ) : f.filteredData.length > 0 ? (
        <FlatList
          data={f.filteredData}
          renderItem={renderHelpDeskCard}
          keyExtractor={(item, index) =>
            item.RecId?.toString() || index.toString()
          }
          contentContainerStyle={styles.DLP_ListContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.DLP_NoDataContainer}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }>
          {f.searchQuery.trim() ? (
            <Text style={styles.DLP_NoDataSubText}>
              No records match "{f.searchQuery}"
            </Text>
          ) : allHelpDeskData.length === 0 && f.activeFilter === 'All' ? (
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

      <DynamicAttachmentModal
        visible={attachmentModalVisible}
        recordData={selectedHelpDeskItem}
        recordIdKey="RecId"
        tableName="ESSHRHelpDeskRequest"
        onClose={() => {
          setAttachmentModalVisible(false);
          setSelectedHelpDeskItem(null);
        }}
        onSave={() => fetchAllHelpDeskData()}
        legalEntity={selectedLegalEntity}
        employeeId={effectiveEmployeeId}
        employeeName={effectiveEmployeeName}
        modalTitle="HR HelpDesk Attachments"
        showDetails={true}
        detailFields={[{key: 'ESSHRHelpDeskRequestId', label: 'Request Id'}]}
        detailData={selectedHelpDeskItem || {}}
        showTakePhoto={
          getStatusLabel(selectedHelpDeskItem?.ESSWorkFlowStatus) ===
          'Not Submitted'
        }
        showChooseFile={
          getStatusLabel(selectedHelpDeskItem?.ESSWorkFlowStatus) ===
          'Not Submitted'
        }
        showDownload={true}
        showDelete={
          getStatusLabel(selectedHelpDeskItem?.ESSWorkFlowStatus) ===
          'Not Submitted'
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
        text={'Are you sure you want to delete this record?'}
        onPress={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModal(false);
          setItemToDelete(null);
        }}
      />
    </ActionPaneContainer>
  );
};

export default HRHelpDeskListScreen;
