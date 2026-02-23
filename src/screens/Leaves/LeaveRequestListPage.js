/* eslint-disable no-shadow */
/* eslint-disable curly */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useCallback} from 'react';
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
import {translate as t} from '../../store/utils/translate';

import AlertModal from '../../components/Alert/AlertModal';
import AlertDeleteModal from '../../components/Alert/AlertDeleteModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import DynamicRequestCard, {
  BUTTON_TYPES,
} from '../../components/DynamicRequestCard';
import styles from '../../styles/styles';

import {RetrieveAllLeaves} from '../../API/Leaves/RetrieveAllLeaves';
import DeleteLeaveRequest from '../../API/Leaves/deleteLeaveRequest';
import SubmitLeaveRequest from '../../API/Leaves/SubmitLeaveRequest';
import DynamicAttachmentModal from '../../shared/DynamicAttachmentModal';
import {isLeaveWorkflowConfigured} from '../../API/Leaves/isLeaveWorkflowEnabled';

const LeaveRequestListPage = () => {
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
  const {menuItems} = useSelector(state => state.menuItem);
  const reduxUserData = useSelector(state => state.user.userData);
  const {selectedLegalEntity, defaultLegalEntity, legalEntities} = useSelector(
    state => state.company,
  );
  const effectiveUserData = routeUserData || reduxUserData;
  const isRTL = I18nManager.isRTL;

  // Use effective user data for all operations
  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
  const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;
  const effectiveWorkerRecId = WorkerRecId || effectiveUserData?.WorkerRecId;

  const [isLoading, setIsLoading] = useState(false);
  const [leavesData, setLeavesData] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [highlightedRecId, setHighlightedRecId] = useState(null);
  const [processingButtons, setProcessingButtons] = useState({});
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [selectedLeaveItem, setSelectedLeaveItem] = useState(null);
  const [isWorkflowConfigured, setIsWorkflowConfigured] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [rawData, setRawData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [sortOrder, setSortOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Function to get the page label
  const getPageLabel = () => {
    const currentMenuItem = menuItems.find(
      item => item.MenuId === 'LeavesListPage',
    );
    return currentMenuItem?.Label || t('leaveRequest.pageTitle'); // Fallback to default if not found
  };

  // Fetch leaves data
  const fetchLeavesData = useCallback(async () => {
    if (!effectiveEmployeeId) return;

    setIsLoading(true);
    try {
      const LeaveData = await RetrieveAllLeaves({
        employeeId: effectiveEmployeeId,
      });

      setLeavesData(LeaveData);
      setRawData(LeaveData); // ← here
      setDisplayData(LeaveData); // ← here
    } catch (error) {
      setAlertMessage(t('leaveRequest.fetchFailed'));
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveEmployeeId]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchLeavesData();
    }, [fetchLeavesData]),
  );

  // Handle highlighting of records
  useFocusEffect(
    useCallback(() => {
      if (highlightRecId) {
        setHighlightedRecId(highlightRecId);
        fetchLeavesData();

        const timer = setTimeout(() => {
          setHighlightedRecId(null);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }, [highlightRecId, fetchLeavesData]),
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
    }, [handleGoBack, navigation]),
  );

  // Handle back navigation
  const handleGoBack = () => {
    let targetRoute = 'MainDashboard'; // default

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
        if (navigation.canGoBack()) {
          navigation.goBack();
          return;
        } else {
          targetRoute = 'MainDashboard';
        }
        return; // exit early
    }

    navigation.reset({
      index: 0, // top of the stack
      routes: [{name: 'TabNavigator', params: {screen: targetRoute}}],
    });
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchLeavesData();
  };

  // Handle create leave
  const handleCreateLeave = () => {
    navigation.navigate('LeaveSaveRecord', {
      mode: 'create',
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: effectiveUserData,
      cameFrom: 'LeavesListPage',
      originalCameFrom: cameFrom,
      leaveData: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
        recId: '',
        leaveCode: '',
        leaveCategory: '',
        balance: '0.00',
        leaveStartDate: '',
        leaveEndDate: '',
        leaveDays: '',
        reason: '',
      },
    });
  };

  // Utility functions
  const getLeaveCategory = category => {
    return category === 'FullLeave'
      ? 'Full Day Leave'
      : category === 'HalfLeave'
      ? 'Half Day Leave'
      : 'Invalid Category';
  };

  const getStatusLabel = status => {
    const statusMap = {
      NotSubmitted: 'Draft',
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
    return statusMap[status] || 'Draft';
  };

  const handleReceiptAttachmentPress = async itemData => {
    try {
      const formatDateOnly = date => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0]; // YYYY-MM-DD
      };

      const cleanedItem = {
        ...itemData,
        LeaveStartDate: formatDateOnly(itemData.LeaveStartDate),
        LeaveEndDate: formatDateOnly(itemData.LeaveEndDate),
      };

      setSelectedLeaveItem(cleanedItem);
      setAttachmentModalVisible(true);
    } catch (error) {
      setAlertMessage(t('leaveRequest.attachmentFailed'));
      setAlertModal(true);
    }
  };

  // Card Configuration
  const cardConfig = {
    // Header configuration
    headerConfig: {
      title: {key: 'LeaveCode'},
      subtitle: {key: 'EmployeeName'},
    },

    // Main fields to display (always visible)
    fields: [
      {
        key: 'LeaveStartDate',
        label: leavesData[0]?.LeaveStartDateLabel || 'Leave Start Date',
        type: 'date',
      },
      {
        key: 'LeaveEndDate',
        label: leavesData[0]?.LeaveEndDateLabel || 'Leave End Date',
        type: 'date',
      },
      {
        key: 'LeaveDays',
        label: leavesData[0]?.LeaveDaysLabel || 'Leave Days',
        type: 'text',
      },
      {key: 'WFStatus', label: '', type: 'status'},
    ],

    // Expandable fields (shown when expanded)
    expandableFields: [
      {
        key: 'LeaveReqId',
        label: leavesData[0]?.LeaveReqIdLabel || 'Leave Request ID',
        type: 'text',
      },
      // {
      //   key: 'LeaveCategory',
      //   label: leavesData[0]?.LeaveCategoryLabel || 'Leave Category',
      //   type: 'text',
      // },
      {
        key: 'LeaveReqDate',
        label: leavesData[0]?.LeaveReqDateLabel || 'Leave Request Date',
        type: 'date',
      },
      {
        key: 'Balance',
        label: leavesData[0]?.BalanceLabel || 'Balance',
        type: 'currency',
      },
      // {
      //   key: 'Quota',
      //   label: leavesData[0]?.QuotaLabel || 'Quota',
      //   type: 'text',
      // },
      // {
      //   key: 'Eligibility',
      //   label: leavesData[0]?.EligibilityLabel || 'Eligibility',
      //   type: 'text',
      // },
      {
        key: 'Reason',
        label: leavesData[0]?.ReasonLabel || 'Reason',
        type: 'text',
      },
    ],
    isRTL: isRTL,
  };

  // const getFilteredData = () => {
  //   if (activeFilter === 'All') return leavesData;

  //   return leavesData.filter(item => {
  //     const status = getStatusLabel(item.WFStatus);

  //     // Special handling for Pending filter - include any status that contains "Pending"
  //     if (activeFilter === 'Pending') {
  //       return status.includes('Pending'); // This will match "Pending Approval", "Pending", etc.
  //     }

  //     return status === activeFilter;
  //   });
  // };

  // Replace getFilteredData() with this
  const getFilteredData = () => {
    const base = displayData.length > 0 ? displayData : rawData;
    if (activeFilter === 'All') return base;
    return base.filter(item => {
      const status = getStatusLabel(item.WFStatus);
      if (activeFilter === 'Pending') return status.includes('Pending');
      return status === activeFilter;
    });
  };

  const getFilterCounts = () => {
    const counts = {All: leavesData.length};

    ['Draft', 'Pending', 'Approved', 'Rejected', 'Completed'].forEach(pill => {
      if (pill === 'Pending') {
        // Count any status that includes "Pending"
        counts[pill] = leavesData.filter(item =>
          getStatusLabel(item.WFStatus).includes('Pending'),
        ).length;
      } else {
        counts[pill] = leavesData.filter(
          item => getStatusLabel(item.WFStatus) === pill,
        ).length;
      }
    });

    console.log('Filter counts:', counts); // Debug
    return counts;
  };

  // Define button configuration
  const getButtonConfig = item => {
    const isDraft = getStatusLabel(item.WFStatus) === 'Draft';
    const isRejected = getStatusLabel(item.WFStatus) === 'Rejected';

    return {
      edit: {
        show: true,
        position: 'header',
        style: 'icon',
        icon: 'edit',
        iconSize: 20,
        iconColor: '#fff',
        backgroundColor: '#0A66C2',
        disabled: !isDraft && !isRejected,
        customStyle:
          !isDraft && !isRejected ? {backgroundColor: '#BDBDBD'} : {},
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
        show: isDraft || isRejected, // only visible when action is possible
        position: 'bottom',
        style: 'approval_dropdown',
        text: isRejected ? 'Re-submit' : 'Approval',
        icon: 'check-square-o',
        textColor: '#0A66C2',
        disabled: false,
        actions: [
          {
            key: 'submit',
            label: isRejected ? 'Re-submit' : 'Submit',
            icon: 'paper-plane',
          },
        ],
      },
    };
  };

  const checkWorkflowConfig = useCallback(async () => {
    try {
      const res = await isLeaveWorkflowConfigured();
      setIsWorkflowConfigured(res === true || res === 1);
    } catch (e) {
      setIsWorkflowConfigured(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkWorkflowConfig();
    }, [checkWorkflowConfig]),
  );

  // Helper function to set button processing state
  const setButtonProcessing = (recId, buttonType, isProcessing) => {
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: isProcessing
        ? [...(prev[recId] || []), buttonType]
        : (prev[recId] || []).filter(btn => btn !== buttonType),
    }));
  };

  // Handle button presses
  const handleButtonPress = (buttonType, itemData) => {
    switch (buttonType) {
      case BUTTON_TYPES.EDIT:
        handleEditPress(itemData);
        break;
      case BUTTON_TYPES.DELETE:
        handleDeletePress(itemData);
        break;
      case BUTTON_TYPES.SUBMIT:
        itemData.WFStatus === 'submit'
          ? handleSubmitPress(itemData)
          : handleSubmitPress(itemData);
        break;
      case BUTTON_TYPES.ATTACHMENT:
        handleReceiptAttachmentPress(itemData);
        break;
      default:
        console.log('Unknown button pressed:', buttonType);
    }
  };

  const handleEditPress = itemData => {
    navigation.navigate('LeaveSaveRecord', {
      mode: 'edit',
      employeeId: itemData.EmployeeId || employeeId,
      employeeName: itemData.EmployeeName || employeeName,
      WorkerRecId: itemData.WorkerRecId || WorkerRecId,
      userData: route.params?.userData || {
        employeeId,
        employeeName,
        WorkerRecId,
      },
      cameFrom: 'LeavesListPage',
      originalCameFrom: cameFrom,
      leaveData: {
        recId: itemData.RecId,
        employeeId: itemData.EmployeeId || employeeId,
        employeeName: itemData.EmployeeName || employeeName,
        WorkerRecId: itemData.WorkerRecId || WorkerRecId,
        leaveCode: itemData.LeaveCode,
        leaveCategory: itemData.LeaveCategory,
        balance: itemData.Balance,
        leaveStartDate: itemData.LeaveStartDate,
        leaveEndDate: itemData.LeaveEndDate,
        leaveDays: itemData.LeaveDays,
        reason: itemData.Reason,
        leaveReqId: itemData.LeaveReqId,
      },
    });
  };

  const handleDeletePress = itemData => {
    setItemToDelete(itemData);
    setDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    // First close the delete modal
    setDeleteModal(false);

    // Small delay to ensure modal is closed
    setTimeout(async () => {
      setIsProcessing(true); // Show processing overlay
      setButtonProcessing(itemToDelete.RecId, 'delete', true);

      try {
        const response = await DeleteLeaveRequest({
          recordsRecId: [itemToDelete.RecId],
        });

        if (response[0].IsSuccess) {
          setAlertMessage(t('leaveRequest.deleteSuccess'));
          setLeavesData(prev =>
            prev.filter(leave => leave.RecId !== itemToDelete.RecId),
          );
        } else {
          setAlertMessage(t('leaveRequest.deleteFailed'));
        }
      } catch (error) {
        setAlertMessage(t('leaveRequest.deleteFailed'));
        console.log('Delete Leave Request response', error);
      } finally {
        setIsProcessing(false); // Hide processing overlay
        setButtonProcessing(itemToDelete.RecId, 'delete', false);
        setItemToDelete(null);
        setAlertModal(true);
        setTimeout(() => {
          fetchLeavesData();
        }, 1000);
      }
    }, 100); // Small delay to ensure modal closes first
  };

  /** Enhanced submit handler with highlighting support */
  const handleSubmitPress = async itemData => {
    setIsProcessing(true);
    setButtonProcessing(itemData.RecId, 'submit', true);

    try {
      const response = await SubmitLeaveRequest({
        recId: Number(itemData.RecId),
      });
      const resObj = Array.isArray(response) ? response[0] : response;

      if (resObj && String(resObj.IsSuccess).toLowerCase() === 'true') {
        setAlertMessage(
          t('leaveRequest.submitSuccess', {leaveCode: itemData.LeaveCode}),
        );
        setAlertModal(true);

        setHighlightedRecId(itemData.RecId);

        setTimeout(() => {
          setHighlightedRecId(null);
        }, 3000);

        setTimeout(() => {
          fetchLeavesData();
        }, 1000);
      } else {
        const errorMessage =
          resObj && resObj.Message
            ? resObj.Message
            : `Failed to Submit ${itemData.LeaveCode} Request`;
        setAlertMessage(errorMessage);
        setAlertModal(true);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setAlertMessage(`Failed to Submit ${itemData.LeaveCode} Request`);
      setAlertModal(true);
    } finally {
      setIsProcessing(false);
      setButtonProcessing(itemData.RecId, 'submit', false);
    }
  };

  const handleReSubmitPress = async itemData => {
    setIsProcessing(true);
    setButtonProcessing(itemData.RecId, 'submit', true);

    try {
      // const response = await SubmitLeaveRequest({
      //   recId: Number(itemData.RecId),
      // });
      const response = 'Resubmit in progress';
      const resObj = Array.isArray(response) ? response[0] : response;

      if (resObj && String(resObj.IsSuccess).toLowerCase() === 'true') {
        setAlertMessage(
          t('leaveRequest.submitSuccess', {leaveCode: itemData.LeaveCode}),
        );
        setAlertModal(true);

        setHighlightedRecId(itemData.RecId);

        setTimeout(() => {
          setHighlightedRecId(null);
        }, 3000);

        setTimeout(() => {
          fetchLeavesData();
        }, 1000);
      } else {
        const errorMessage =
          resObj && resObj.Message
            ? resObj.Message
            : `Failed to Submit ${itemData.LeaveCode} Request`;
        setAlertMessage(errorMessage);
        setAlertModal(true);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setAlertMessage(`Failed to Submit ${itemData.LeaveCode} Request`);
      setAlertModal(true);
    } finally {
      setIsProcessing(false);
      setButtonProcessing(itemData.RecId, 'submit', false);
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

  const renderLeavesCard = ({item}) => {
    const isHighlighted = highlightedRecId === item.RecId;
    const itemProcessingButtons = processingButtons[item.RecId] || [];

    const processedItem = {
      ...item,
      WFStatus: getStatusLabel(item.WFStatus),
    };

    // Get button configuration
    const buttonConfig = getButtonConfig(item);

    return (
      <DynamicRequestCard
        data={processedItem}
        headerConfig={cardConfig.headerConfig}
        fields={cardConfig.fields}
        expandableFields={cardConfig.expandableFields}
        buttons={buttonConfig} // Only this prop needed now!
        isHighlighted={isHighlighted}
        onButtonPress={handleButtonPress}
        isExpandable={true} // Can set to false to disable
        gradientColors={['#6ee0ff', '#bddeff', '#cce6ff']}
        highlightGradientColors={['#E8F5E8', '#F0FFF0']}
        processingButtons={itemProcessingButtons}
        isRTL={isRTL}
      />
    );
  };

  return (
    <ActionPaneContainer
      pageTitle={getPageLabel()}
      isBackButton={false}
      showFooter={true}
      showFloatingButton={true}
      isHeaderActive={true}
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={handleCreateLeave}
      showFilterPills={true}
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
      ) : getFilteredData().length > 0 ? (
        <FlatList
          data={getFilteredData()}
          renderItem={renderLeavesCard}
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
          {/* Show different messages based on filter and data availability */}
          {rawData.length === 0 && activeFilter === 'All' ? (
            // No data at all AND "All" filter is active - show "Get started" message
            <>
              <Text style={styles.DLP_NoDataText}>Get started</Text>
              <Text style={styles.DLP_NoDataSubText}>
                Tap + to add a new record
              </Text>
            </>
          ) : (
            // Either data exists but filtered out, or "All" filter shows no data (shouldn't happen)
            // Show filter-specific message
            <>
              <Text style={styles.DLP_NoDataText}>
                {`${activeFilter} record not found.`}
              </Text>
            </>
          )}
        </ScrollView>
      )}

      {/* Attachment Modal */}
      <DynamicAttachmentModal
        visible={attachmentModalVisible}
        recordData={selectedLeaveItem}
        tableName="PREmployeeLeaveRequest"
        onClose={() => {
          setAttachmentModalVisible(false);
          setSelectedLeaveItem(null);
        }}
        onSave={() => {
          fetchLeavesData();
        }}
        legalEntity={selectedLegalEntity}
        employeeId={effectiveEmployeeId}
        employeeName={effectiveEmployeeName}
        modalTitle={t('leaveRequest.pageTitle') + ' Attachments'}
        showDetails={true}
        detailFields={[
          {key: 'LeaveCode', label: 'Leave Type'},
          // {key: 'LeaveCategory', label: 'Category'},
          {key: 'LeaveStartDate', label: 'Start Date'},
          {key: 'LeaveEndDate', label: 'End Date'},
        ]}
        detailData={selectedLeaveItem || {}}
        showTakePhoto={selectedLeaveItem?.WFStatus === 'Draft'}
        showChooseFile={selectedLeaveItem?.WFStatus === 'Draft'}
        showDownload={true}
        showDelete={selectedLeaveItem?.WFStatus === 'Draft'}
      />

      {/* Alert Modal */}
      <AlertModal
        visible={alertModal}
        heading={t('common.alert')}
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />

      {/* Delete Confirmation Modal */}
      <AlertDeleteModal
        visible={deleteModal}
        heading={t('leaveRequest.deleteConfirmTitle')}
        text={t('leaveRequest.deleteConfirmMessage')}
        onPress={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModal(false);
          setItemToDelete(null);
        }}
      />
    </ActionPaneContainer>
  );
};

export default LeaveRequestListPage;
