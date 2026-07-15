/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useCallback, useEffect, useMemo} from 'react';
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
import {useSelector} from 'react-redux';

import {SubmitIdentificationRequest} from '../../../../API/PersonalInformation/Identification/SubmitIdentificationRequest';
import {isWorkflowConfigured} from '../../../../API/PersonalInformation/Identification/IsIdentificationWorkflowEnabled';
import {IdentificationFindRequest} from '../../../../API/PersonalInformation/Identification/IdentificationFindRequest';
import {DeleteIdentityRequest} from '../../../../API/PersonalInformation/Identification/DeleteIdentityRequest';
import {canEnableEditButton} from '../../../../API/PersonalInformation/Identification/canEnableEditButton';
import {translate as t} from '../../../../store/utils/translate';
import {retrieveESSIdentificationtableTableRecId} from '../../../../API/PersonalInformation/Identification/retrieveESSIdentificationtableTableRecId&TableId';

import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';
import AlertDeleteModal from '../../../../components/Alert/AlertDeleteModal';
import ActionPaneContainer from '../../../../components/ActionPaneContainer';
import AlertModal from '../../../../components/Alert/AlertModal';
import DynamicRequestCard from '../../../../components/DynamicRequestCard';
import DynamicAttachmentModal from '../../../../shared/DynamicAttachmentModal';
import useNotify from '../../../../hooks/useNotify';
import useListFilters from '../../../../hooks/useListFilters';
import styles from '../../../../styles/styles';
import usePalette from '../../../../hooks/usePalette';

// D365 boundary dates — defined at module level, not inside render
const D365_MAX_DATE = '2154-12-31T12:00:00';
const D365_MIN_DATE = '1900-01-01T12:00:00';

const IdentificationNumberListPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const isRTL = I18nManager.isRTL;
  const P = usePalette();

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
  const [identificationsData, setIdentificationsData] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [workflowEnabled, setWorkflowEnabled] = useState(false);
  const [highlightedRecId, setHighlightedRecId] = useState(null);
  const [processingButtons, setProcessingButtons] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const {notifySuccess, notifyError, notifyDelete} = useNotify(
    'My Identification Numbers',
  );

  // Attachment modal state
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [selectedIdentityItem, setSelectedIdentityItem] = useState(null);

  // Fetch Identification Data
  const fetchIdentifications = useCallback(async () => {
    if (!effectiveEmployeeId) return;

    setIsLoading(true);
    try {
      const data = await IdentificationFindRequest({
        employeeId: effectiveEmployeeId,
      });

      // console.log('here is the data for identification', data);

      // Sort newest record on top
      data.sort(
        (a, b) =>
          new Date(b.CreatedDateTime).getTime() -
          new Date(a.CreatedDateTime).getTime(),
      );

      const dataWithPermissions = await Promise.all(
        data.map(async item => {
          let canEdit = false;
          try {
            canEdit = await canEnableEditButton(
              item.RecId,
              item.PersonIdentificationNumberRecVersion,
            );
          } catch {
            canEdit = false;
          }
          return {...item, canEdit};
        }),
      );

      setIdentificationsData(dataWithPermissions);
    } catch (error) {
      console.error('Failed to fetch identification data:', error);
      setAlertMessage('Failed to fetch data');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveEmployeeId]);

  const fetchTableIdAndRecId = async itemData => {
    try {
      const result = await retrieveESSIdentificationtableTableRecId({
        person: effectiveWorkerRecId,
      });
      console.log('TableId and RecId result:', result);

      // Adjust field names based on what your API actually returns
      return {
        tableId: result?.TableId || result?.tableId || itemData.TableId,
        recId: result?.RecId || result?.recId || itemData.RecId,
      };
    } catch (error) {
      console.error('Failed to fetch TableId/RecId:', error);
      // Fallback to item's own values
      return {
        tableId: itemData.TableId,
        recId: itemData.RecId,
      };
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchIdentifications();
    }, [fetchIdentifications]),
  );

  useFocusEffect(
    useCallback(() => {
      const checkWorkflow = async () => {
        const configured = await isWorkflowConfigured();
        setWorkflowEnabled(configured);
      };
      checkWorkflow();
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      if (highlightRecId) {
        setHighlightedRecId(highlightRecId);
        fetchIdentifications();

        const timer = setTimeout(() => {
          setHighlightedRecId(null);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }, [highlightRecId, fetchIdentifications]),
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
    navigation.navigate('DisplayPersonalInfo');
  };

  // Consistent refresh handler used everywhere
  const handleRefresh = () => {
    fetchIdentifications();
  };

  const handleViewHistory = async itemData => {
    setIsProcessing(true);
    try {
      const {tableId, recId} = await fetchTableIdAndRecId(itemData);

      console.log('Navigating to history with:', recId, tableId);

      navigation.navigate('WorkflowHistoryScreen', {
        recId: recId,
        tableId: tableId,
        cameFrom: 'IdentificationListPage',
      });
    } catch (error) {
      setAlertMessage('Failed to load workflow history.');
      setAlertModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusLabel = status => {
    if (!status) return 'Approved'; // ← empty = Approved
    const normalizedStatus = status.replace(/\s+/g, '').toLowerCase();

    const statusMap = {
      draft: 'Draft',
      inreview: 'In Review',
      approved: 'Approved Waiting',
      waiting: 'Waiting',
      cancelled: 'Canceled',
      canceled: 'Cancelled',
      rejected: 'Rejected',
      processing: 'Processing action',
      workflowcomplete: 'WorkFlow Complete',
      failed: 'Failed',
      completed: 'Completed',
      error: 'Error',
      denied: 'Denied',
      changerequested: 'Change Requested',
      taskinreview: 'Task In Review',
      taskcompleted: 'Task Completed',
      noworkflow: '',
    };

    return statusMap[normalizedStatus] ?? '';
  };

  // Filter/sort/search now owned by useListFilters. Derived status pills off
  // getStatusLabel(ApprovalStatus) — empty status (HCM/no-workflow records) maps
  // to '' and is dropped from the pill row exactly as before (the hook filters
  // falsy labels). Date filter + sort key off CreatedDateTime, resolved case-
  // insensitively. No documentType field → header Date+Sort trigger only.
  const f = useListFilters({
    data: identificationsData,
    dateField: 'CreatedDateTime',
    classifyPill: item => getStatusLabel(item.ApprovalStatus),
  });

  // Card Configuration
  const cardConfig = {
    headerConfig: {
      title: {key: 'IdentificationTypeId'},
      subtitle: {key: 'IdentificationNumber'},
    },
    fields: [
      {
        key: 'IssuedDate',
        label: identificationsData[0]?.IssuedDatelbl || 'Issued Date',
        type: 'date',
      },
      {
        key: 'ExpirationDate',
        label: identificationsData[0]?.ExpirationDatelbl || 'Expiration Date',
        type: 'date',
      },
      {key: 'ApprovalStatus', label: '', type: 'status'},
    ],
    expandableFields: [],
    isRTL: isRTL,
  };

  const getButtonConfig = item => {
    const statusLabel = getStatusLabel(item.ApprovalStatus);
    const isDraft = statusLabel === 'Draft';
    const isHCMRecord = statusLabel === '';
    const isRejected = statusLabel === 'Rejected';
    const isCancelled = statusLabel === 'Cancelled';

    return {
      edit: {
        show: workflowEnabled,
        position: 'header',
        style: 'icon',
        icon: 'edit',
        iconSize: 20,
        iconColor: '#fff',
        backgroundColor: P.primary,
        disabled: isHCMRecord ? !item.canEdit : !isDraft,
        customStyle: !item.canEdit ? {backgroundColor: '#BDBDBD'} : {},
      },
      delete: {
        show: workflowEnabled,
        position: 'header',
        style: 'icon',
        icon: 'trash',
        iconSize: 20,
        iconColor: '#fff',
        backgroundColor: P.primary,
        disabled: !(isDraft || isCancelled),
        customStyle: !(isDraft || isCancelled)
          ? {backgroundColor: '#BDBDBD'}
          : {},
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
        show: true, // ← always visible
        position: 'bottom',
        style: 'approval_dropdown',
        text: isRejected ? 'Re-submit' : 'Approval',
        icon: 'check-square',
        textColor: P.primary,
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

          // View History: every status except Draft and HCM records (empty status)
          ...(!isDraft && !isHCMRecord
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

  // Helper function to set button processing state
  const setButtonProcessing = (recId, buttonType, isProcessingState) => {
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: isProcessingState
        ? [...(prev[recId] || []), buttonType]
        : (prev[recId] || []).filter(btn => btn !== buttonType),
    }));
  };

  // Handle button presses
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
      case 'attachment':
        handleReceiptAttachmentPress(itemData);
        break;
      case 'viewHistory': // ← add this
        handleViewHistory(itemData);
        break;
      default:
        console.log('Unknown button pressed:', buttonType);
    }
  };

  const handleEditPress = itemData => {
    navigation.navigate('IdentificationNumberSaveRecord', {
      mode: 'edit',
      employeeId: itemData.employeeId || employeeId,
      employeeName: itemData.employeeName || employeeName,
      WorkerRecId: itemData.WorkerRecId || WorkerRecId,
      userData: route.params?.userData || {
        employeeId,
        employeeName,
        WorkerRecId,
      },
      cameFrom: 'IdentificationListPage',
      originalCameFrom: cameFrom,
      identityData: {
        recId: itemData.RecId,
        employeeId: itemData.employeeId || employeeId,
        employeeName: itemData.employeeName || employeeName,
        WorkerRecId: itemData.WorkerRecId || WorkerRecId,
        IdentificationNumber: itemData.IdentificationNumber,
        IdentificationType: itemData.IdentificationType,
        IdentificationTypeId: itemData.IdentificationTypeId,
        Description: itemData.Description,
        IsPrimary: itemData.IsPrimary,
        ExpirationDate:
          itemData.ExpirationDate === 'Never'
            ? D365_MAX_DATE
            : itemData.ExpirationDate === '-'
            ? D365_MIN_DATE
            : itemData.ExpirationDate,
        IssueDate:
          itemData.IssuedDate === 'Never'
            ? D365_MAX_DATE
            : itemData.IssuedDate === '-'
            ? D365_MIN_DATE
            : itemData.IssuedDate,
        IssuingAgency: itemData.IssuingAgency,
        IssuingAgencyId: itemData.IssuingAgencyId,
        WorkflowOperation: itemData.WorkflowOperation,
      },
    });
  };

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
        const response = await DeleteIdentityRequest({
          recordsRecId: [itemToDelete.RecId],
        });

        if (response[0].IsSuccess) {
          notifyDelete('Record deleted successfully');
          setAlertMessage('Record deleted successfully');
          setIdentificationsData(prev =>
            prev.filter(item => item.RecId !== itemToDelete.RecId),
          );
        } else {
          setAlertMessage('Unable to delete record. Please try again.');
        }
      } catch (error) {
        setAlertMessage('Failed to delete record');
        console.log('Delete Identification Request response', error);
      } finally {
        setIsProcessing(false);
        setButtonProcessing(itemToDelete.RecId, 'delete', false);
        setItemToDelete(null);
        setAlertModal(true);

        setTimeout(() => {
          fetchIdentifications();
        }, 800);
      }
    }, 100);
  };

  const handleSubmitPress = async itemData => {
    setTimeout(async () => {
      setIsProcessing(true);
      setButtonProcessing(itemData.RecId, 'submit', true);

      try {
        const response = await SubmitIdentificationRequest({
          recId: itemData.RecId,
        });

        const resObj = Array.isArray(response) ? response[0] : response;

        if (resObj && String(resObj.IsSuccess).toLowerCase() === 'true') {
          notifySuccess('Request submitted successfully');
          setAlertMessage('Request submitted successfully');
          setAlertModal(true);
          setHighlightedRecId(itemData.RecId);

          setTimeout(() => {
            setHighlightedRecId(null);
          }, 3000);

          setTimeout(() => {
            fetchIdentifications();
          }, 1000);
        } else {
          const errorMessage =
            resObj && resObj.Message
              ? resObj.Message
              : 'Failed to submit request';
          setAlertMessage(errorMessage);
          setAlertModal(true);
        }
      } catch (error) {
        console.error('Submit error:', error);
        setAlertMessage('Failed to submit request');
        setAlertModal(true);
      } finally {
        setIsProcessing(false);
        // Fix: use RecId (uppercase) consistently
        setButtonProcessing(itemData.RecId, 'submit', false);
      }
    }, 100);
  };

  const handleReceiptAttachmentPress = async itemData => {
    try {
      setSelectedIdentityItem(itemData);
      setAttachmentModalVisible(true);
    } catch (error) {
      setAlertMessage('Failed to open attachments');
      setAlertModal(true);
    }
  };

  // Search + sort now handled by useListFilters via f.actionPaneProps.

  const renderIdentificationCard = ({item}) => {
    // Fix: use RecId (uppercase) consistently
    const isHighlighted = highlightedRecId === item.RecId;
    const itemProcessingButtons = processingButtons[item.RecId] || [];

    const processedItem = {
      ...item,
      employeeId: item.employeeId || employeeId,
      employeeName: item.employeeName || employeeName,
      // Fix: use optional chaining to avoid crash if date is null/undefined
      ExpirationDate: item.ExpirationDate?.startsWith(D365_MAX_DATE)
        ? 'Never'
        : item.ExpirationDate === D365_MIN_DATE
        ? '-'
        : item.ExpirationDate,
      IssuedDate: item.IssuedDate?.startsWith(D365_MAX_DATE)
        ? 'Never'
        : item.IssuedDate === D365_MIN_DATE
        ? '-'
        : item.IssuedDate,
    };

    return (
      <DynamicRequestCard
        data={processedItem}
        headerConfig={cardConfig.headerConfig}
        fields={cardConfig.fields}
        expandableFields={cardConfig.expandableFields}
        buttons={getButtonConfig(item)}
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

  const handleCreateRequest = () => {
    navigation.navigate('IdentificationNumberSaveRecord', {
      mode: 'create',
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: effectiveUserData,
      cameFrom: 'IdentificationListPage',
      originalCameFrom: cameFrom,
      identityData: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
        recId: '',
        IdentificationNumber: '',
        IdentificationType: '',
        IdentificationTypeId: '',
        Description: '',
        IsPrimary: '',
        ExpirationDate: '',
        IssueDate: '',
        IssuingAgency: '',
        IssuingAgencyId: '',
        WorkflowOperation: '',
      },
    });
  };

  return (
    <ActionPaneContainer
      pageTitle="My Identification Numbers"
      isBackButton={false}
      showFooter={true}
      showFloatingButton={workflowEnabled}
      isHeaderActive={true}
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={handleCreateRequest}
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
      ) : f.filteredData.length > 0 ? (
        <FlatList
          data={f.filteredData}
          renderItem={renderIdentificationCard}
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
            <>
              {/* <Text style={styles.DLP_NoDataText}>No results found</Text> */}
              <Text style={styles.DLP_NoDataSubText}>
                No records match "{f.searchQuery}"
              </Text>
            </>
          ) : identificationsData.length === 0 && f.activeFilter === 'All' ? (
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

      {/* Attachment Modal */}
      <DynamicAttachmentModal
        visible={attachmentModalVisible}
        recordData={selectedIdentityItem}
        recordIdKey="RecId"
        tableName="HcmPersonIdentificationNumber"
        onClose={() => {
          setAttachmentModalVisible(false);
          setSelectedIdentityItem(null);
        }}
        onSave={() => {
          fetchIdentifications();
        }}
        legalEntity={selectedLegalEntity}
        employeeId={effectiveEmployeeId}
        employeeName={effectiveEmployeeName}
        modalTitle="Identification Attachments"
        showDetails={true}
        detailFields={[
          {key: 'IdentificationTypeId', label: 'ID Type'},
          {key: 'IdentificationNumber', label: 'ID Number'},
        ]}
        detailData={selectedIdentityItem || {}}
        showTakePhoto={
          getStatusLabel(selectedIdentityItem?.ApprovalStatus) === 'Draft' ||
          getStatusLabel(selectedIdentityItem?.ApprovalStatus) === ''
        }
        showChooseFile={
          getStatusLabel(selectedIdentityItem?.ApprovalStatus) === 'Draft' ||
          getStatusLabel(selectedIdentityItem?.ApprovalStatus) === ''
        }
        showDownload={true}
        showDelete={
          getStatusLabel(selectedIdentityItem?.ApprovalStatus) === 'Draft' ||
          getStatusLabel(selectedIdentityItem?.ApprovalStatus) === ''
        }
      />

      <AlertDeleteModal
        visible={deleteModal}
        heading="Confirm Deletion"
        text="Are you sure you want to delete this request?"
        onPress={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModal(false);
          setItemToDelete(null);
        }}
      />

      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
    </ActionPaneContainer>
  );
};

export default IdentificationNumberListPage;
