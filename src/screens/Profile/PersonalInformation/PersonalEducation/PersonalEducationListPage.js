// export default PersonalEducationListPage;
/* eslint-disable curly */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useCallback, useEffect, useMemo} from 'react';
import {
  Text,
  FlatList,
  RefreshControl,
  BackHandler,
  ScrollView,
  I18nManager,
  View,
  ActivityIndicator,
} from 'react-native';
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';

// Components
import ActionPaneContainer from '../../../../components/ActionPaneContainer';
import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';
import DynamicRequestCard from '../../../../components/DynamicRequestCard';
import AlertModal from '../../../../components/Alert/AlertModal';
import useAlertModal from '../../../../hooks/useAlertModal';
import AlertDeleteModal from '../../../../components/Alert/AlertDeleteModal';
import DynamicAttachmentModal from '../../../../shared/DynamicAttachmentModal';
import WorkflowCommentModal from '../../../../components/CommentModal/WorkflowCommentModal';
import {translate as t} from '../../../../store/utils/translate';
import {EmployeePersonalEducation} from '../../../../API/PersonalInformation/Education/PersonalEducation';
import {DeleteEducationDetails} from '../../../../API/PersonalInformation/Education/PersonalEducationDelete';
import {SubmitEducationRequest} from '../../../../API/PersonalInformation/Education/SubmitEducationRequest';
import {isEducationWorkflowConfigured} from '../../../../API/PersonalInformation/Education/isEducationWorkflowEnabled';
import {GetPersonalEducationLabel} from '../../../../API/PersonalInformation/Education/GetPersonalEducationLabel';
import RecallWorkflowRecordGeneric from '../../../../API/WorkflowTrackingStatusTable/RecallWorkflowRecordGeneric';
import useNotify from '../../../../hooks/useNotify';
import useListFilters from '../../../../hooks/useListFilters';
import usePalette from '../../../../hooks/usePalette';

import styles from '../../../../styles/styles';

const PersonalEducationListPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const P = usePalette();
  const isRTL = I18nManager.isRTL;

  /* ---------- redux ---------- */
  const reduxUserData = useSelector(state => state.user.userData);
  const {selectedLegalEntity} = useSelector(state => state.company);
  const effectiveUserData = reduxUserData || {};

  const effectiveEmployeeId = effectiveUserData?.employeeId;
  const effectiveEmployeeName = effectiveUserData?.employeeName;
  const effectiveWorkerRecId = effectiveUserData?.WorkerRecId;

  const routeParams = route.params || {};
  const cameFrom = routeParams.cameFrom;

  /* ---------- state ---------- */
  const [isLoading, setIsLoading] = useState(false);
  const [educationData, setEducationData] = useState([]);
  const {showSuccess, showError, showWarning, hide, alertModalProps} =
    useAlertModal();
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [highlightedRecId, setHighlightedRecId] = useState(null);
  const [processingButtons, setProcessingButtons] = useState({});
  const [isWorkflowEnabled, setIsWorkflowEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const {notifySuccess, notifyError, notifyDelete} =
    useNotify('Education Details');

  // Attachment modal state
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [selectedEducationItem, setSelectedEducationItem] = useState(null);

  // Submit-comment modal state — submit opens this to collect an optional
  // comment for the approver before calling the API, same pattern as
  // DFEmployeeLeaveRequestListPage / IdentificationNumberListPage.
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [submitTargetItem, setSubmitTargetItem] = useState(null);
  // Recall-comment modal state — recall opens this to collect an optional
  // comment before calling the API, same pattern as the submit comment flow.
  const [recallCommentModalVisible, setRecallCommentModalVisible] =
    useState(false);
  const [recallTargetItem, setRecallTargetItem] = useState(null);

  /* ---------- fetch ---------- */
  const fetchEducationData = useCallback(async () => {
    if (!effectiveEmployeeId) return;
    setIsLoading(true);
    try {
      const data = await EmployeePersonalEducation({
        employeeId: effectiveEmployeeId,
      });
      console.log('Here is the data', data);
      // Newest record on top
      data.sort((a, b) => (b.RecId || 0) - (a.RecId || 0));
      setEducationData(data);
    } catch (error) {
      console.log('Failed to fetch education details:', error);
      showError('Failed to fetch data.');
    } finally {
      setIsLoading(false);
    }
  }, [effectiveEmployeeId]);

  useFocusEffect(
    useCallback(() => {
      fetchEducationData();
    }, [fetchEducationData]),
  );

  /* ---------- workflow ---------- */
  const checkWorkflowConfig = useCallback(async () => {
    try {
      const res = await isEducationWorkflowConfigured();
      setIsWorkflowEnabled(res === true || res === 1);
    } catch (e) {
      setIsWorkflowEnabled(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkWorkflowConfig();
    }, [checkWorkflowConfig]),
  );

  /* ---------- highlight ---------- */
  // Copy route param into state once
  useFocusEffect(
    useCallback(() => {
      const id = route.params?.highlightRecId;
      if (id && id !== highlightedRecId) {
        setHighlightedRecId(id);
        navigation.setParams({highlightRecId: undefined});
      }
    }, [route.params?.highlightRecId, highlightedRecId, navigation]),
  );

  // Auto-clear highlight after 3s
  useFocusEffect(
    useCallback(() => {
      if (!highlightedRecId) return;
      const timer = setTimeout(() => setHighlightedRecId(null), 3000);
      return () => clearTimeout(timer);
    }, [highlightedRecId]),
  );

  /* ---------- back handler ---------- */
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

  const handleRefresh = () => {
    fetchEducationData();
  };

  const handleViewHistory = itemData => {
    navigation.navigate('WorkflowHistoryScreen', {
      recId: itemData.RecId,
      tableId: itemData.TableId,
      cameFrom: 'PersonalEducationListPage',
    });
  };

  const handleRecallPress = async (itemData, comment = '') => {
    setIsProcessing(true);
    setButtonProcessing(itemData.RecId, 'recall', true);

    try {
      const result = await RecallWorkflowRecordGeneric({
        tableId: Number(itemData.TableId),
        recId: itemData.RecId,
        comment,
      });

      if (String(result?.IsSuccess).toLowerCase() === 'true') {
        notifySuccess('Education record recalled successfully.');
        showSuccess('Education record recalled successfully.');
        setHighlightedRecId(itemData.RecId);
        setTimeout(() => setHighlightedRecId(null), 3000);
        setTimeout(() => fetchEducationData(), 1000);
      } else {
        showError(result?.Message || 'Failed to recall request.');
      }
    } catch (error) {
      console.error('Recall error:', error);
      showError('Failed to recall request.');
    } finally {
      setIsProcessing(false);
      setButtonProcessing(itemData.RecId, 'recall', false);
    }
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

  /* ---------- status ---------- */
  const getStatusLabel = status => {
    if (!status) return 'HR';
    const normalizedStatus = status.replace(/\s+/g, '').toLowerCase();
    const map = {
      draft: 'Draft',
      inreview: 'In review',
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
      noworkflow: 'HR',
    };
    return map[normalizedStatus] ?? '';
  };

  // Filter/sort/search now owned by useListFilters. Derived status pills off
  // getStatusLabel(ApprovalStatus) — empty status (HCM/no-workflow records) maps
  // to '' and is dropped from the pill row exactly as before. Date filter + sort
  // key off CreatedDateTime, resolved case-insensitively. No documentType field →
  // header Date+Sort trigger only.
  const f = useListFilters({
    data: educationData,
    dateField: 'CreatedDateTime',
    classifyPill: item => getStatusLabel(item.ApprovalStatus),
  });

  /* ---------- buttons ---------- */
  // Fix: rename param to avoid shadowing isProcessing state
  const setButtonProcessing = (recId, buttonType, isProcessingState) => {
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: isProcessingState
        ? [...(prev[recId] || []), buttonType]
        : (prev[recId] || []).filter(btn => btn !== buttonType),
    }));
  };

  const getButtonConfig = item => {
    const statusLabel = getStatusLabel(item.ApprovalStatus);
    const isDraft = statusLabel === 'Draft';
    const isCancelled =
      statusLabel === 'Cancelled' || statusLabel === 'Canceled';
    const canDelete = isDraft || isCancelled;
    const isHCMRecord = statusLabel === 'HR';
    const isRejected = statusLabel === 'Rejected';
    const isInReview = statusLabel === 'In review'; // ← add this

    return {
      edit: {
        show: true,
        position: 'header',
        style: 'icon',
        icon: 'edit',
        iconSize: 20,
        iconColor: P.onPrimary,
        backgroundColor: P.primary,
        disabled: isHCMRecord ? false : !isDraft,
        customStyle:
          !isDraft && !isHCMRecord ? {backgroundColor: '#BDBDBD'} : {},
      },
      delete: {
        show: true,
        position: 'header',
        style: 'icon',
        icon: 'trash',
        iconSize: 20,
        iconColor: P.onPrimary,
        backgroundColor: P.primary,
        disabled: !canDelete,
        customStyle: !canDelete ? {backgroundColor: '#BDBDBD'} : {},
      },
      attachment: {
        show: true,
        position: 'header',
        style: 'icon',
        icon: 'paperclip',
        iconSize: 20,
        iconColor: P.onPrimary,
        backgroundColor: P.primary,
        disabled: isRejected,
        customStyle: isRejected ? {backgroundColor: '#BDBDBD'} : {},
      },
      approval: {
        show: !isHCMRecord, // ← always visible
        position: 'bottom',
        style: 'approval_dropdown',
        text: 'Workflow',
        icon: 'check-square',
        textColor: P.primaryStrong,
        disabled: false,
        actions: [
          // Submit: Draft only. Resubmit on Rejected records is intentionally
          // disabled for now — re-enable by adding `|| isRejected` back to
          // this condition (and restoring the isRejected ? 'Re-submit' label
          // on the button `text` above) once resubmit is ready.
          ...(isDraft
            ? [
                {
                  key: 'submit',
                  label: 'Submit',
                  icon: 'send',
                },
              ]
            : []),

          // View History: every status except Draft and HCM records
          ...(!isDraft && !isHCMRecord
            ? [
                {
                  key: 'viewHistory',
                  label: 'View History',
                  icon: 'clock',
                },
              ]
            : []),
          // Recall: In review only, placed right after View History
          ...(isInReview
            ? [{key: 'recall', label: 'Recall', icon: 'rotate-ccw'}]
            : []),
        ],
      },
    };
  };

  /* ---------- actions ---------- */
  const handleButtonPress = (buttonType, itemData) => {
    switch (buttonType) {
      case 'edit':
        navigation.navigate('PersonalEducationSaveRecord', {
          mode: 'edit',
          employeeId: effectiveEmployeeId,
          employeeName: effectiveEmployeeName,
          WorkerRecId: effectiveWorkerRecId,
          userData: effectiveUserData,
          cameFrom: 'PersonalEducationListPage',
          originalCameFrom: 'PersonalEducationListPage',
          educationData: itemData,
        });
        break;
      case 'delete':
        setItemToDelete(itemData);
        setDeleteModal(true);
        break;
      case 'submit':
        openSubmitCommentModal(itemData);
        break;
      case 'attachment':
        handleReceiptAttachmentPress(itemData);
        break;
      case 'viewHistory': // ← add this
        handleViewHistory(itemData);
        break;
      case 'recall': // ← add this
        openRecallCommentModal(itemData);
        break;
      default:
        console.log('Unknown button type:', buttonType);
    }
  };

  /* ---------- create ---------- */
  const handleCreateEducation = () => {
    navigation.navigate('PersonalEducationSaveRecord', {
      mode: 'create',
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: effectiveUserData,
      cameFrom: 'PersonalEducationListPage',
      originalCameFrom: 'PersonalEducationListPage',
      educationData: {
        Education: '',
        Description: '',
        DurationUnit: '',
        Duration: '',
        StartDate: '',
        EndDate: '',
        Notes: '',
      },
    });
  };

  /* ---------- delete ---------- */
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setDeleteModal(false);

    setTimeout(async () => {
      setIsProcessing(true);
      setButtonProcessing(itemToDelete.RecId, 'delete', true);

      try {
        const response = await DeleteEducationDetails({
          recordsRecId: [itemToDelete.RecId],
        });
        if (response[0]?.IsSuccess) {
          notifyDelete('Education detail deleted successfully.');
          showSuccess('Education detail deleted successfully.');
          setEducationData(prev =>
            prev.filter(ed => ed.RecId !== itemToDelete.RecId),
          );
        } else {
          showError('Failed to delete record.');
        }
      } catch (error) {
        console.error('DeleteEducationDetails error:', error);
        showError('Failed to delete record');
      } finally {
        setIsProcessing(false);
        setButtonProcessing(itemToDelete.RecId, 'delete', false);
        setItemToDelete(null);

        setTimeout(() => {
          fetchEducationData();
        }, 800);
      }
    }, 100);
  };

  /* ---------- submit ---------- */
  const handleSubmitPress = async (itemData, comment = '') => {
    setIsProcessing(true);
    setButtonProcessing(itemData.RecId, 'submit', true);

    try {
      const response = await SubmitEducationRequest({
        recId: itemData.RecId,
        comment,
      });

      const contracts = Array.isArray(response?.GeneralContract)
        ? response.GeneralContract
        : response?.GeneralContract
        ? [response.GeneralContract]
        : [];

      const res = contracts[0];

      if (String(res?.IsSuccess).toLowerCase() === 'true') {
        notifySuccess('Education record submitted successfully.');
        showSuccess('Education record submitted successfully.');
        setHighlightedRecId(itemData.RecId);

        setTimeout(() => setHighlightedRecId(null), 3000);
        setTimeout(() => fetchEducationData(), 1000);
      } else {
        showError(res?.Message || 'Failed to submit request.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      showError('Failed to submit request.');
    } finally {
      setIsProcessing(false);
      setButtonProcessing(itemData.RecId, 'submit', false);
    }
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

  /* ---------- attachment ---------- */
  const handleReceiptAttachmentPress = async itemData => {
    try {
      setSelectedEducationItem(itemData);
      setAttachmentModalVisible(true);
    } catch (error) {
      showError('Failed to open attachments');
    }
  };

  /* ---------- card ---------- */
  const cardConfig = {
    headerConfig: {title: {key: 'EducationDisciplineId', label: 'Education'}},
    fields: [
      {
        key: 'Description',
        label: educationData[0]?.Descriptionlbl || 'Description',
        type: 'text',
      },
      {
        key: 'DurationUnit',
        label: educationData[0]?.DurationUnitlbl || 'Duration Unit',
        type: 'text',
      },
      {
        key: 'Duration',
        label: educationData[0]?.Durationlbl || 'Duration',
        type: 'number',
      },
      // Note: keys/labels here mirror the WSDL's HcmPersonEducationSvcContract
      // exactly — including "Insitutionlbl" (missing the "t"), which is the
      // WSDL's own spelling, not a typo introduced here.
      {
        key: 'EducationLevelID',
        label: educationData[0]?.EducationLevellbl || 'Education Level',
        type: 'text',
      },
      {
        key: 'InstitutionID',
        label: educationData[0]?.Insitutionlbl || 'Institution',
        type: 'text',
      },
      {key: 'ApprovalStatus', label: '', type: 'status'},
    ],
    expandableFields: [
      {
        key: 'StartDate',
        label: educationData[0]?.StartDatelbl || 'Start Date',
        type: 'date',
      },
      {
        key: 'EndDate',
        label: educationData[0]?.EndDatelbl || 'End Date',
        type: 'date',
      },
      {key: 'Notes', label: 'Notes', type: 'text'},
    ],
    isRTL: isRTL,
  };

  // Search + sort now handled by useListFilters via f.actionPaneProps.

  const renderEducationCard = ({item}) => {
    const updatedItem = {
      ...item,
      EducationTitle: 'Education',
      ApprovalStatus: getStatusLabel(item.ApprovalStatus),
    };
    return (
      <DynamicRequestCard
        data={updatedItem}
        headerConfig={cardConfig.headerConfig}
        fields={cardConfig.fields}
        expandableFields={cardConfig.expandableFields}
        buttons={getButtonConfig(item)}
        onButtonPress={handleButtonPress}
        isExpandable
        highlightGradientColors={['#E8F5E8', '#F0FFF0']}
        isHighlighted={highlightedRecId === item.RecId}
        processingButtons={processingButtons[item.RecId] || []}
        isRTL={isRTL}
        searchQuery={f.searchQuery}
      />
    );
  };

  return (
    <ActionPaneContainer
      pageTitle="Education Details"
      isBackButton={false}
      showFooter={true}
      showFloatingButton={true}
      isHeaderActive={true}
      showTabNavigator={true}
      onFloatingButtonPress={handleCreateEducation}
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
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
          renderItem={renderEducationCard}
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
          ) : educationData.length === 0 && f.activeFilter === 'All' ? (
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
        recordData={selectedEducationItem}
        recordIdKey="RecId"
        tableName="EssPersonEducation"
        onClose={() => {
          setAttachmentModalVisible(false);
          setSelectedEducationItem(null);
        }}
        onSave={() => {
          fetchEducationData();
        }}
        legalEntity={selectedLegalEntity}
        employeeId={effectiveEmployeeId}
        employeeName={effectiveEmployeeName}
        modalTitle="Education Attachments"
        showDetails={true}
        detailFields={[
          {key: 'EducationDisciplineId', label: 'Education'},
          {key: 'Description', label: 'Description'},
        ]}
        detailData={selectedEducationItem || {}}
        showTakePhoto={
          getStatusLabel(selectedEducationItem?.ApprovalStatus) === 'Draft' ||
          getStatusLabel(selectedEducationItem?.ApprovalStatus) === 'HR'
        }
        showChooseFile={
          getStatusLabel(selectedEducationItem?.ApprovalStatus) === 'Draft' ||
          getStatusLabel(selectedEducationItem?.ApprovalStatus) === 'HR'
        }
        showDownload={true}
        showDelete={
          getStatusLabel(selectedEducationItem?.ApprovalStatus) === 'Draft' ||
          getStatusLabel(selectedEducationItem?.ApprovalStatus) === 'HR'
        }
      />

      <AlertModal {...alertModalProps} />

      <AlertDeleteModal
        visible={deleteModal}
        heading="Confirm Deletion"
        text="Are you sure you want to delete this record?"
        onPress={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModal(false);
          setItemToDelete(null);
        }}
      />

      <WorkflowCommentModal
        visible={commentModalVisible}
        title="Submit Education Details"
        message="Add a comment for the approver, or cancel to close the dialog."
        onCancel={handleCommentModalCancel}
        onSubmit={handleCommentModalSubmit}
        onRequestClose={closeSubmitCommentModal}
        isProcessing={isProcessing}
      />

      <WorkflowCommentModal
        visible={recallCommentModalVisible}
        title="Recall Education Details"
        message="Add a comment for the recall, or cancel to close the dialog."
        onCancel={handleRecallCommentModalCancel}
        onSubmit={handleRecallCommentModalSubmit}
        onRequestClose={closeRecallCommentModal}
        isProcessing={isProcessing}
      />
    </ActionPaneContainer>
  );
};

export default PersonalEducationListPage;
