/* eslint-disable react-native/no-inline-styles */
/* eslint-disable no-unused-vars */
/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useCallback, useMemo} from 'react';
import {
  Text,
  FlatList,
  BackHandler,
  RefreshControl,
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Image,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';

import {useSelector, useDispatch} from 'react-redux';
import FeatherIcon from 'react-native-vector-icons/Feather';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import AlertModal from '../../components/Alert/AlertModal';
import useAlertModal from '../../hooks/useAlertModal';
import useNotify from '../../hooks/useNotify';
import DynamicRequestCard from '../../components/DynamicRequestCard';
import DynamicAttachmentModal from '../../shared/DynamicAttachmentModal';

import {RetrieveByEmail} from '../../API/WorkflowTrackingStatusTable/retrieveByEmail';
import WorkflowItemAction from '../../API/WorkflowTrackingStatusTable/WorkflowItemAction';
import useListFilters from '../../hooks/useListFilters';
import ListFilterBar from '../../components/Filters/ListFilterBar';
import useAppTokens from '../../components/AppComponentsDesign/useAppTokens';
import styles from '../../styles/styles';
import usePallete from '../../hooks/usePalette';
import {setPendingWorkItemsCount} from '../../store/slices/workItemsSlice';
import WorkflowCommentModal from '../../components/CommentModal/WorkflowCommentModal';
import useExtraWorkflowFields from '../../hooks/useExtraWorkflowFields';
import {TABLE_EXTRA_FIELDS} from '../../Controller/workflowExtraFields';

/* ==============================
   Card field config (module scope — doesn't need to be redefined
   every render since it doesn't depend on component state)
============================== */

const CARD_HEADER_CONFIG = {
  title: {key: 'documentType'},
};

const DOCUMENT_TYPE_OVERRIDES = {
  HRMCourseAttendee: 'Training Calendar', // was "Course Participants"
  SLD_HRTrainingRequests: 'Employee Course Request', // was "Course Request"
};

// TrvExpTable and TrvRequisitionTable both get a fixed title instead of
// showing the raw Subject text.
const getFixedCardTitle = item => {
  if (item.TableName === 'TrvExpTable') {
    const subject = item.Subject || '';
    if (/med exp/i.test(subject)) return 'Medical Expense';
    if (/^exp:/i.test(subject)) return 'Expense Report';
    return null;
  }
  if (item.TableName === 'TrvRequisitionTable') {
    return 'Travel Requisition';
  }
  if (item.TableName === 'PurchTable') {
    return 'Purchase Order';
  }
  if (item.TableName === 'IDAP_EmpClearanceTable') {
    return 'Employee Clearance';
  }
  if (item.TableName === 'HcmGoal') {
    return 'Performance Goals';
  }
  return null;
};

const getCardFields = item => {
  const fixedTitle = getFixedCardTitle(item);

  let fields;

  if (item.TableName === 'LedgerJournalTable') {
    fields = [];
  } else if (item.TableName === 'SLD_HRPenaltyLeave') {
    fields = [];
  } else if (item.TableName === 'PurchTable') {
    // From only (no Subject, no Title). Vendor Name / Net Amount appended
    // below via TABLE_EXTRA_FIELDS.
    fields = [{key: 'From', label: 'From', type: 'text'}];
  } else if (item.TableName === 'IDAP_EmpClearanceTable') {
    // No Title. Description + Worker Name appended below via TABLE_EXTRA_FIELDS.
    fields = [];
  } else if (fixedTitle) {
    // TrvExpTable, TrvRequisitionTable, HcmGoal — fixed title only.
    fields = [{key: '__fixedCardTitle', label: 'Title', type: 'text'}];
  } else if (item.TableName === 'SLD_HRTrainingRequests') {
    fields = [];
  } else {
    fields = [
      {key: 'Subject', label: 'Subject', type: 'text'},
      {key: 'From', label: 'From', type: 'text'},
    ];
  }

  const configs = TABLE_EXTRA_FIELDS[item.TableName] || [];
  configs.forEach(({targetKey, cardLabel}) => {
    if (item[targetKey]) {
      fields.push({key: targetKey, label: cardLabel, type: 'text'});
    }
  });

  return fields;
};

/* ==============================
   WorkItemCard — its own component so useExtraWorkflowFields gets a
   stable per-row component instance (hooks can't safely live inside
   a FlatList renderItem callback function directly).
============================== */

const getInitialsFromType = typeStr =>
  (typeStr || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('') || '?';

const WorkItemCard = ({
  item,
  isSelected,
  selectionMode,
  onLongPress,
  onPress,
  buttonConfig,
  onButtonPress,
  processingButtons,
  searchQuery,
}) => {
  const fieldConfigs = TABLE_EXTRA_FIELDS[item.TableName] || [];
  const sourceLabels = fieldConfigs.map(f => f.sourceLabel);

  const result = useExtraWorkflowFields(item, sourceLabels);
  const extractedFields = result?.fields;
  const photoUri = result?.imageUri;
  const initials = getInitialsFromType(item.documentType);

  const cardData = extractedFields
    ? fieldConfigs.reduce(
        (acc, {sourceLabel, targetKey}) => {
          if (extractedFields[sourceLabel] !== undefined) {
            acc[targetKey] = extractedFields[sourceLabel];
          }
          return acc;
        },
        {...item},
      )
    : {...item};

  const fixedTitle = getFixedCardTitle(item);
  if (fixedTitle) {
    cardData.__fixedCardTitle = fixedTitle;
  }

  return (
    <Pressable
      onLongPress={onLongPress}
      onPress={onPress}
      style={[
        styles.Page_CardWrapper,
        isSelected && styles.Page_CardWrapperSelected,
      ]}>
      {selectionMode && (
        <View style={styles.Page_CheckboxContainer}>
          <View
            style={[
              styles.Page_Checkbox,
              isSelected && styles.Page_CheckboxSelected,
            ]}>
            {isSelected && <Text style={styles.Page_Checkmark}>✓</Text>}
          </View>
        </View>
      )}

      <DynamicRequestCard
        data={cardData}
        headerConfig={CARD_HEADER_CONFIG}
        fields={getCardFields(cardData)}
        buttons={buttonConfig}
        onButtonPress={onButtonPress}
        onPress={onPress}
        onLongPress={onLongPress}
        isExpandable={false}
        processingButtons={processingButtons}
        showNavigationArrow={false}
        isHighlighted={isSelected}
        searchQuery={searchQuery}
        avatar={{uri: photoUri, initials}}
      />
    </Pressable>
  );
};

const WorkItemsAssignedToMePage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const P = usePallete();
  const T = useAppTokens();
  const bulkAllStyles = useMemo(() => createBulkAllStyles(T), [T]);
  const dispatch = useDispatch();

  const {userData: routeUserData} = route.params || {};
  const reduxUserData = useSelector(state => state.user.userData);
  const effectiveUserData = routeUserData || reduxUserData;

  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const {showSuccess, showError, hide, alertModalProps} = useAlertModal();
  const {notifySuccess, notifyError} = useNotify('Work Item');

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedRecIds, setSelectedRecIds] = useState([]);

  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [selectedWorkItem, setSelectedWorkItem] = useState(null);
  const {selectedLegalEntity} = useSelector(state => state.company);

  const effectiveEmployeeId = effectiveUserData?.employeeId;
  const effectiveEmployeeName = effectiveUserData?.employeeName;
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { actionType, recIds }

  const [activeFilter, setActiveFilter] = useState('All');
  const [processingButtons, setProcessingButtons] = useState({});
  const [rawData, setRawData] = useState([]);

  const f = useListFilters({
    data: rawData,
    dateField: 'createdDateTime',
    searchFields: [
      'documentType',
      'documentId',
      'requester',
      'Subject',
      'From',
      'Document',
    ],
    pills: ['All'],
    classifyPill: () => null,
  });

  /* ==============================
     Fetch Data
  ============================== */

  const fetchWorkItems = useCallback(async () => {
    if (!effectiveUserData?.email) return;

    setIsLoading(true);
    try {
      const data = await RetrieveByEmail({email: effectiveUserData.email});

      const formattedData = (data || []).map((item, index) => {
        const documentStr = item.Document || '';

        const documentIdMatch = documentStr.match(/:\s*([^,]+)/);
        const documentId = documentIdMatch
          ? documentIdMatch[1].trim()
          : documentStr;

        const requesterMatch = documentStr.match(/,?\s*([^,]+)$/);
        const requester = requesterMatch ? requesterMatch[1].trim() : '';

        let documentType = item.DocumentType || '';
        documentType = documentType.replace(/\b\w/g, l => l.toUpperCase());
        documentType =
          documentType
            .replace(/^\s*Employee\s+Self\s+Service\s*[-:]?\s*/i, '')
            .trim() || documentType;

        documentType = DOCUMENT_TYPE_OVERRIDES[item.TableName] || documentType;

        return {
          id: item.workflowWorkItemRecId ?? index,
          recId: item.workflowWorkItemRecId,
          documentId: documentId,
          documentType: documentType,
          requester: requester,
          ContextTableId: item.ContextTableId,
          ContextRecId: item.ContextRecId,
          TableName: item.TableName,
          workflowWorkItemType: item.workflowWorkItemType,
          Document: item.Document,
          createdDateTime: item.createdDateTime,
          From: item.From,
          Subject: item.Subject,
        };
      });

      setRawData(formattedData);

      const pendingCount = formattedData.filter(
        item => item.workflowWorkItemType === 'WorkItem',
      ).length;
      dispatch(setPendingWorkItemsCount(pendingCount));
    } catch (error) {
      showError('Failed to fetch work items.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [dispatch, effectiveUserData.email]);

  const handleRefresh = () => fetchWorkItems();

  useFocusEffect(
    useCallback(() => {
      fetchWorkItems();
    }, [fetchWorkItems]),
  );

  const clearAllStates = useCallback(() => {
    setIsLoading(false);
    setIsActionLoading(false);
    setRefreshing(false);
    hide();
    setSelectionMode(false);
    setSelectedRecIds([]);
    setAttachmentModalVisible(false);
    setSelectedWorkItem(null);
    setCommentModalVisible(false);
    setPendingAction(null);
    setActiveFilter('All');
    setProcessingButtons({});
    setRawData([]);
    f.resetFilters();
  }, [f.resetFilters, hide]);

  useFocusEffect(
    useCallback(() => {
      return () => clearAllStates();
    }, [clearAllStates]),
  );

  /* ==============================
     Back Handling
  ============================== */

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (!navigation.isFocused()) return false;
        if (selectionMode) {
          exitSelectionMode();
          return true;
        }
        navigation.goBack();
        return true;
      };
      const sub = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => sub.remove();
    }, [navigation, selectionMode]),
  );

  /* ==============================
     Selection Logic
  ============================== */

  const enterSelectionMode = recId => {
    setSelectionMode(true);
    setSelectedRecIds([recId]);
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedRecIds([]);
  };

  const toggleSelection = recId => {
    setSelectedRecIds(prev =>
      prev.includes(recId) ? prev.filter(id => id !== recId) : [...prev, recId],
    );
  };

  const selectAll = () => {
    const currentData = f.filteredData;
    if (selectedRecIds.length === currentData.length) {
      setSelectedRecIds([]);
    } else {
      setSelectedRecIds(currentData.map(item => item.recId));
    }
  };

  /* ==============================
     Per-card button processing
  ============================== */

  const setCardButtonProcessing = (recId, buttonType, isProc) => {
    setProcessingButtons(prev => {
      const updated = {...prev};
      if (isProc) {
        updated[recId] = [...(updated[recId] || []), buttonType];
      } else {
        updated[recId] = (updated[recId] || []).filter(b => b !== buttonType);
        if (updated[recId].length === 0) delete updated[recId];
      }
      return updated;
    });
  };

  /* ==============================
     Actions
  ============================== */

  const handleSingleAction = async (recId, actionType, comment = '') => {
    if (isActionLoading) return;

    const buttonKey = actionType.toLowerCase();
    try {
      setIsActionLoading(true);
      setCardButtonProcessing(recId, buttonKey, true);

      const response = await WorkflowItemAction({
        recId: [recId],
        action: actionType,
        memo: comment,
      });

      if (!response?.IsSuccess) throw new Error(`Failed to ${actionType}`);

      const PAST_TENSE = {
        Approve: 'Approved',
        Reject: 'Rejected',
        RequestChange: 'Change requested',
        Delegate: 'Delegated',
        Recall: 'Recalled',
        Resubmit: 'Resubmitted',
      };
      const message = `Workitem ${PAST_TENSE[actionType] || `${actionType}d`}`;
      notifySuccess(message);
      showSuccess(message);
      await fetchWorkItems();
    } catch (error) {
      const message = error.message || `Error during ${actionType}`;
      notifyError(message);
      showError(message);
    } finally {
      setIsActionLoading(false);
      setCardButtonProcessing(recId, buttonKey, false);
    }
  };

  const handleViewHistory = (ContextRecId, ContextTableId) => {
    navigation.navigate('WorkflowHistoryScreen', {
      recId: ContextRecId,
      tableId: ContextTableId,
      cameFrom: 'WorkItemsAssignedToMePage',
    });
  };

  const handleWorkflowDetail = (ContextRecId, ContextTableId, item) => {
    navigation.navigate('WorkflowDetailScreen', {
      tableId: ContextTableId,
      contextRecId: ContextRecId,
      recId: item?.recId,
      workflowWorkItemType: item?.workflowWorkItemType,
    });
  };

  const handleBulkAction = async (
    actionType,
    recIdsOverride = null,
    comment = '',
  ) => {
    const targetRecIds = recIdsOverride ?? selectedRecIds;
    if (targetRecIds.length === 0 || isActionLoading) return;

    try {
      setIsActionLoading(true);

      const response = await WorkflowItemAction({
        recId: targetRecIds,
        action: actionType,
        memo: comment,
      });

      if (!response?.IsSuccess) throw new Error(`Failed to ${actionType}`);

      const message = `${actionType} successful for ${targetRecIds.length} item(s)`;
      notifySuccess(message);
      showSuccess(message);
      exitSelectionMode();
      f.setSelectedDocumentTypes([]);
      f.setActiveFilter('All');
      await fetchWorkItems();
    } catch (error) {
      const msg = error.message || `Error during ${actionType}`;
      notifyError(msg);
      showError(msg);
    } finally {
      setIsActionLoading(false);
    }
  };

  /* ==============================
     Bulk actions on the current view
  ============================== */

  const bulkEligibleRecIds = useMemo(
    () =>
      f.filteredData
        .filter(item => item.workflowWorkItemType === 'WorkItem')
        .map(item => item.recId),
    [f.filteredData],
  );

  const isFiltered =
    f.activeFilter !== 'All' ||
    f.selectedDocumentTypes.length > 0 ||
    f.searchQuery.trim().length > 0;

  const confirmBulkActionOnVisible = actionType => {
    if (bulkEligibleRecIds.length === 0 || isActionLoading) return;
    openCommentModal(actionType, bulkEligibleRecIds);
  };

  const openCommentModal = (actionType, recIds) => {
    setPendingAction({actionType, recIds});
    setCommentModalVisible(true);
  };

  const closeCommentModal = () => {
    if (isActionLoading) return;
    setCommentModalVisible(false);
    setPendingAction(null);
  };

  const handleCommentModalCancel = () => {
    setCommentModalVisible(false);
    setPendingAction(null);
  };

  const handleCommentModalSubmit = comment => {
    const action = pendingAction;
    setCommentModalVisible(false);
    setPendingAction(null);
    if (!action) return;

    if (action.recIds.length === 1) {
      handleSingleAction(action.recIds[0], action.actionType, comment);
    } else {
      handleBulkAction(action.actionType, action.recIds, comment);
    }
  };

  const getButtonConfig = Item => ({
    attachment: {
      show: true,
      position: 'header',
      style: 'icon',
      icon: 'paperclip',
      iconSize: 20,
      iconColor: P.onPrimary,
      backgroundColor: P.primary,
      disabled: false,
    },
    approval: {
      show: !selectionMode,
      position: 'bottom',
      style: 'approval_dropdown',
      text: 'Workflow',
      textColor: P.primaryStrong,
      disabled: isActionLoading,
      actions:
        Item.workflowWorkItemType === 'WorkItem'
          ? [
              {key: 'approve', label: 'Approve', icon: 'check'},
              {key: 'reject', label: 'Reject', icon: 'x'},
              {key: 'viewHistory', label: 'View History', icon: 'clock'},
            ]
          : [{key: 'viewHistory', label: 'View History', icon: 'clock'}],
    },
  });

  const handleButtonPress = (buttonType, item) => {
    if (buttonType === 'approve') openCommentModal('Approve', [item.recId]);
    else if (buttonType === 'reject') openCommentModal('Reject', [item.recId]);
    else if (buttonType === 'requestChange')
      handleSingleAction(item.recId, 'RequestChange');
    else if (buttonType === 'delegate')
      handleSingleAction(item.recId, 'Delegate');
    else if (buttonType === 'recall') handleSingleAction(item.recId, 'Recall');
    else if (buttonType === 'viewHistory')
      handleViewHistory(item.ContextRecId, item.ContextTableId);
    else if (buttonType === 'attachment') handleAttachmentPress(item);
  };

  const handleAttachmentPress = item => {
    setSelectedWorkItem(item);
    setAttachmentModalVisible(true);
  };

  /* ==============================
     Render Card
  ============================== */

  const renderWorkItemCard = ({item}) => {
    const isSelected = selectedRecIds.includes(item.recId);

    return (
      <WorkItemCard
        item={item}
        isSelected={isSelected}
        selectionMode={selectionMode}
        onLongPress={() => enterSelectionMode(item.recId)}
        onPress={() => {
          if (selectionMode) {
            toggleSelection(item.recId);
          } else {
            handleWorkflowDetail(item.ContextRecId, item.ContextTableId, item);
          }
        }}
        buttonConfig={getButtonConfig(item)}
        onButtonPress={handleButtonPress}
        processingButtons={processingButtons[item.recId] || []}
        searchQuery={f.searchQuery}
      />
    );
  };

  /* ==============================
     UI
  ============================== */

  const filteredData = f.filteredData;

  const areSelectedItemsSameType = () => {
    if (selectedRecIds.length === 0) return true;
    const items = rawData.filter(item => selectedRecIds.includes(item.recId));
    const firstType = items[0]?.workflowWorkItemType;
    return items.every(item => item.workflowWorkItemType === firstType);
  };

  const isUniformSelection = areSelectedItemsSameType();
  const selectedItems = rawData.filter(t => selectedRecIds.includes(t.recId));
  const firstSelectedType = selectedItems[0]?.workflowWorkItemType;

  return (
    <ActionPaneContainer
      pageTitle={
        selectionMode ? `${selectedRecIds.length} selected` : 'Work Items'
      }
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={true}
      onRefresh={handleRefresh}
      showPageTitleRow={true}
      showSearchBar={true}
      {...f.actionPaneProps}
      onFilterChange={filter => {
        f.setActiveFilter(filter);
        exitSelectionMode();
      }}>
      <ListFilterBar filters={f} showDocumentTypeFilter />

      {!selectionMode && bulkEligibleRecIds.length > 0 && (
        <View style={bulkAllStyles.card}>
          <View style={bulkAllStyles.headerRow}>
            <Text style={bulkAllStyles.headerText}>
              Work items assigned to me
            </Text>
          </View>

          <View style={bulkAllStyles.divider} />

          <View style={bulkAllStyles.buttonRow}>
            <TouchableOpacity
              disabled={isActionLoading}
              onPress={() => confirmBulkActionOnVisible('Approve')}
              activeOpacity={0.85}
              style={[
                bulkAllStyles.approveBtn,
                isActionLoading && bulkAllStyles.btnDisabled,
              ]}>
              {isActionLoading ? (
                <ActivityIndicator size="small" color={T.onPrimary ?? '#fff'} />
              ) : (
                <>
                  <FeatherIcon
                    name="check-circle"
                    size={16}
                    color={T.onPrimary ?? '#fff'}
                  />
                  <Text style={bulkAllStyles.approveBtnText}>
                    Approve All ({bulkEligibleRecIds.length})
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              disabled={isActionLoading}
              onPress={() => confirmBulkActionOnVisible('Reject')}
              activeOpacity={0.85}
              style={[
                bulkAllStyles.rejectBtn,
                isActionLoading && bulkAllStyles.btnDisabled,
              ]}>
              {isActionLoading ? (
                <ActivityIndicator size="small" color={T.red} />
              ) : (
                <>
                  <FeatherIcon name="x-circle" size={16} color={T.red} />
                  <Text style={bulkAllStyles.rejectBtnText}>
                    Reject All ({bulkEligibleRecIds.length})
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isActionLoading && (
        <View style={styles.DSR_ProcessingOverlay}>
          <View style={styles.DSR_ProcessingContainer}>
            <ActivityIndicator size="large" color={P.primaryStrong} />
            <Text style={styles.DSR_ProcessingText}>Processing...</Text>
          </View>
        </View>
      )}

      <DynamicAttachmentModal
        visible={attachmentModalVisible}
        recordData={selectedWorkItem}
        recordIdKey="ContextRecId"
        tableName={selectedWorkItem?.TableName || ''}
        onClose={() => {
          setAttachmentModalVisible(false);
          setSelectedWorkItem(null);
        }}
        onSave={() => fetchWorkItems()}
        legalEntity={selectedLegalEntity}
        employeeId={effectiveEmployeeId}
        employeeName={effectiveEmployeeName}
        modalTitle="Work Item Attachments"
        showTakePhoto={false}
        showChooseFile={false}
        showDownload={true}
        showView={true}
        showDelete={false}
      />

      {selectionMode && (
        <View style={styles.BulkToolbar_Container}>
          {selectedRecIds.length === 0 ? (
            <View style={{paddingVertical: 10}}>
              <Text
                style={{
                  textAlign: 'center',
                  color: '#555',
                  fontWeight: '600',
                }}>
                Please select at least one record.
              </Text>
            </View>
          ) : !isUniformSelection ? (
            <View style={{paddingVertical: 10}}>
              <Text
                style={{
                  textAlign: 'center',
                  color: '#C62828',
                  fontWeight: '600',
                }}>
                Selected items must be of the same type.
              </Text>
            </View>
          ) : (
            <View style={styles.BulkToolbar_ActionRow}>
              {firstSelectedType === 'WorkItem' ? (
                <>
                  <TouchableOpacity
                    disabled={isActionLoading}
                    onPress={() => openCommentModal('Approve', selectedRecIds)}
                    style={styles.BulkToolbar_ApproveButton}>
                    {isActionLoading ? (
                      <ActivityIndicator size="small" />
                    ) : (
                      <Text style={styles.BulkToolbar_ApproveText}>
                        Approve Selected
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={isActionLoading}
                    onPress={() => openCommentModal('Reject', selectedRecIds)}
                    style={styles.BulkToolbar_RejectButton}>
                    {isActionLoading ? (
                      <ActivityIndicator size="small" />
                    ) : (
                      <Text style={styles.BulkToolbar_RejectText}>
                        Reject Selected
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  disabled={isActionLoading}
                  onPress={() => handleBulkAction('Resubmit')}
                  style={styles.BulkToolbar_ApproveButton}>
                  {isActionLoading ? (
                    <ActivityIndicator size="small" />
                  ) : (
                    <Text style={styles.BulkToolbar_ApproveText}>
                      Resubmit All
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
          <View style={styles.BulkToolbar_ControlRow}>
            <TouchableOpacity
              onPress={selectAll}
              style={styles.BulkToolbar_TextButton}>
              <Text style={styles.BulkToolbar_PrimaryButtonText}>
                {selectedRecIds.length === filteredData.length &&
                filteredData.length > 0
                  ? 'Unselect all'
                  : 'Select all'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={exitSelectionMode}
              style={styles.BulkToolbar_TextButton}>
              <Text style={styles.BulkToolbar_SecondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isLoading ? (
        <CustomIndicator />
      ) : filteredData.length > 0 ? (
        <FlatList
          data={filteredData}
          renderItem={renderWorkItemCard}
          keyExtractor={item => item.recId?.toString()}
          contentContainerStyle={styles.Page_ListContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchWorkItems}
            />
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}>
          {f.searchQuery.trim() ? (
            <Text style={styles.LReqLP_NoDataText}>
              No records match "{f.searchQuery}"
            </Text>
          ) : (
            <Text style={styles.LReqLP_NoDataText}>
              {f.activeFilter === 'All'
                ? 'No work items found'
                : `No ${f.activeFilter.toLowerCase()} items found`}
            </Text>
          )}
        </ScrollView>
      )}

      <AlertModal {...alertModalProps} />

      <WorkflowCommentModal
        visible={commentModalVisible}
        title={
          pendingAction
            ? `${pendingAction.actionType} ${
                pendingAction.recIds.length > 1
                  ? `${pendingAction.recIds.length} Work Items`
                  : 'Work Item'
              }`
            : ''
        }
        message="Add a comment for the workflow, or cancel to close the dialog."
        onCancel={handleCommentModalCancel}
        onSubmit={handleCommentModalSubmit}
        onRequestClose={closeCommentModal}
        isProcessing={isActionLoading}
      />
    </ActionPaneContainer>
  );
};

const createBulkAllStyles = T =>
  StyleSheet.create({
    card: {
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 4,
      backgroundColor: T.cardBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: T.cardDivider,
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 14,
      shadowColor: T.shadowColor,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    headerRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
    countBadge: {
      minWidth: 24,
      height: 24,
      paddingHorizontal: 6,
      borderRadius: 12,
      backgroundColor: T.blueBg,
      borderWidth: 1,
      borderColor: T.blueStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    countBadgeText: {fontSize: 12, fontWeight: '700', color: T.blueStrong},
    headerText: {
      fontSize: 13,
      fontWeight: '600',
      color: T.titleText,
      flexShrink: 1,
    },
    divider: {
      height: 1,
      backgroundColor: T.cardDivider,
      marginTop: 10,
      marginBottom: 12,
    },
    buttonRow: {flexDirection: 'row', gap: 10},
    approveBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: T.green,
      paddingVertical: 11,
      borderRadius: 10,
      shadowColor: T.green,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.2,
      shadowRadius: 5,
      elevation: 2,
    },
    approveBtnText: {
      fontSize: 13.5,
      fontWeight: '700',
      color: T.onPrimary ?? '#FFFFFF',
    },
    rejectBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: T.redBg,
      borderWidth: 1.5,
      borderColor: T.red,
      paddingVertical: 11,
      borderRadius: 10,
    },
    rejectBtnText: {fontSize: 13.5, fontWeight: '700', color: T.red},
    btnDisabled: {opacity: 0.55},
  });

export default WorkItemsAssignedToMePage;
