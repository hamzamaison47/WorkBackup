/* eslint-disable curly */
import React, {useState, useCallback} from 'react';
import {Text, FlatList} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';

import AlertModal from '../../components/Alert/AlertModal';
import AlertDeleteModal from '../../components/Alert/AlertDeleteModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import DynamicRequestCard from '../../components/DynamicRequestCard';
import styles from '../../styles/styles';

import {DeleteLeaveRequest} from '../../API/Leaves/DeleteLeaveRequest';
import {SubmitLeaveRequest} from '../../API/Leaves/SubmitLeaveRequest';
import {fetchLeaves} from '../../Controller/leaveRequestApiService';

const LeaveRequestListPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [leavesData, setLeavesData] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [highlightedRecId, setHighlightedRecId] = useState(null);
  const [processingButtons, setProcessingButtons] = useState({}); // Track processing buttons per card

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const navigation = useNavigation();

  const route = useRoute();
  const {employeeId, employeeName, WorkerRecId, cameFrom, highlightRecId} =
    route.params || {};

  // Fetch leaves data
  const fetchLeavesData = useCallback(async () => {
    if (!employeeId) return;

    setIsLoading(true);
    try {
      const LeaveData = await fetchLeaves(employeeId);
      setLeavesData(LeaveData);
    } catch (error) {
      setAlertMessage('Failed to fetch data.');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchLeavesData();
    }, [fetchLeavesData]),
  );

  // Handle highlighting of records
  useFocusEffect(
    useCallback(() => {
      if (
        highlightRecId &&
        (cameFrom === 'CreateSuccess' || cameFrom === 'UpdateSuccess')
      ) {
        setHighlightedRecId(highlightRecId);
        fetchLeavesData();

        const timer = setTimeout(() => {
          setHighlightedRecId(null);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }, [highlightRecId, cameFrom, fetchLeavesData]),
  );

  // Handle back navigation
  const handleGoBack = () => {
    if (cameFrom === 'DisplayListPage') {
      navigation.navigate('DisplayListPage');
    } else if (cameFrom === 'WorkerAssignedToMe') {
      navigation.navigate('WorkerAssignedToMe');
    } else {
      navigation.navigate('DisplayListPage');
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchLeavesData();
  };

  // Handle create leave
  const handleCreateLeave = () => {
    navigation.navigate('LeaveSaveRecord', {
      mode: 'create',
      employeeId,
      employeeName,
      WorkerRecId,
      cameFrom: 'LeavesListPage',
      leaveData: {
        employeeId,
        employeeName,
        WorkerRecId,
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
      ? 'Full Leave'
      : category === 'HalfLeave'
      ? 'Half Leave'
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

  // Card Configuration
  const cardConfig = {
    // Header configuration
    headerConfig: {
      title: {key: 'leaveCode'},
      subtitle: {key: 'employeeName'},
    },

    // Main fields to display (always visible)
    fields: [
      {key: 'leaveStartDate', label: 'Leave Start Date', type: 'date'},
      {key: 'leaveEndDate', label: 'Leave End Date', type: 'date'},
      {key: 'leaveDays', label: 'Leave Days', type: 'text'},
      {key: 'wfStatus', label: '', type: 'status'}, // No label for status
    ],

    // Expandable fields (shown when expanded)
    expandableFields: [
      {key: 'leaveReqId', label: 'Leave Request ID', type: 'text'},
      {key: 'leaveCategory', label: 'Leave Category', type: 'text'},
      {key: 'leaveReqDate', label: 'Leave Request Date', type: 'date'},
      {key: 'balance', label: 'Balance', type: 'currency'},
      {key: 'reason', label: 'Reason', type: 'text'},
    ],
  };

  // Define button configuration
  const getButtonConfig = item => {
    const isDraft = getStatusLabel(item.wfStatus) === 'Draft';

    return {
      edit: {
        show: true,
        position: 'header',
        style: 'icon',
        icon: 'edit',
        iconSize: 20,
        iconColor: '#fff',
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
        disabled: !isDraft,
        customStyle: !isDraft ? {backgroundColor: '#BDBDBD'} : {},
      },
      submit: {
        show: isDraft,
        position: 'bottom',
        style: 'text',
        icon: 'send',
        iconSize: 16,
        text: 'Submit',
        textColor: '#0A66C2',
        iconColor: '#0A66C2',
      },
    };
  };

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
      case 'edit':
        handleEditPress(itemData);
        break;
      case 'delete':
        handleDeletePress(itemData);
        break;
      case 'submit':
        handleSubmitPress(itemData);
        break;
      default:
        console.log('Unknown button pressed:', buttonType);
    }
  };

  const handleEditPress = itemData => {
    navigation.navigate('LeaveSaveRecord', {
      mode: 'edit',
      employeeId: itemData.employeeId || employeeId,
      employeeName: itemData.employeeName || employeeName,
      cameFrom: 'LeavesListPage',
      leaveData: {
        recId: itemData.recId,
        employeeId: itemData.employeeId || employeeId,
        employeeName: itemData.employeeName || employeeName,
        leaveCode: itemData.leaveCode,
        leaveCategory: itemData.leaveCategory,
        balance: itemData.balance,
        leaveStartDate: itemData.leaveStartDate,
        leaveEndDate: itemData.leaveEndDate,
        leaveDays: itemData.leaveDays,
        reason: itemData.reason,
      },
    });
  };

  const handleDeletePress = itemData => {
    setItemToDelete(itemData);
    setDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setButtonProcessing(itemToDelete.recId, 'delete', true);

    console.log('Delete Leave Request response', itemToDelete.recId);
    try {
      const response = await DeleteLeaveRequest({
        recordsRecId: [itemToDelete.recId],
      });

      console.log('Delete Leave Request response', response);

      if (response[0].IsSuccess) {
        setAlertMessage('Leave Request Deleted Successfully.');
        setLeavesData(prev =>
          prev.filter(leave => leave.recId !== itemToDelete.recId),
        );
      } else {
        setAlertMessage('Unable to Delete Leave Request.');
      }
    } catch (error) {
      setAlertMessage('Failed to Delete Leave Request');
      console.log('Delete Leave Request response', error);
    } finally {
      setButtonProcessing(itemToDelete.recId, 'delete', false);
      setDeleteModal(false);
      setItemToDelete(null);
      setAlertModal(true);
      setTimeout(() => {
        fetchLeavesData();
      }, 1000);
    }
  };

  const handleSubmitPress = async itemData => {
    setButtonProcessing(itemData.recId, 'submit', true);

    try {
      // Call the Submit API
      const response = await SubmitLeaveRequest({
        recId: itemData.recId,
      });

      if (
        response &&
        (Array.isArray(response) ? response[0] : response) &&
        String(
          (Array.isArray(response) ? response[0] : response).IsSuccess,
        ).toLowerCase() === 'true'
      ) {
        setAlertMessage(`${itemData.leaveCode} is Submitted Successfully.`);
        setAlertModal(true);

        setTimeout(() => {
          fetchLeavesData();
        }, 1000);
      } else {
        const resObj = Array.isArray(response) ? response[0] : response;
        const errorMessage =
          resObj && resObj.Message
            ? resObj.Message
            : 'Failed to Submit Leave Request';
        setAlertMessage(errorMessage);
        setAlertModal(true);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setAlertMessage('Failed to Submit Leave Request');
      setAlertModal(true);
    } finally {
      setButtonProcessing(itemData.recId, 'submit', false);
    }
  };

  // Render leave card
  const renderLeavesCard = ({item}) => {
    const isHighlighted = highlightedRecId === item.recId;
    const itemProcessingButtons = processingButtons[item.recId] || [];

    const processedItem = {
      ...item,
      leaveCategory: getLeaveCategory(item.leaveCategory),
      wfStatus: getStatusLabel(item.wfStatus),
      // Ensure employeeId and employeeName are available for edit functionality
      employeeId: item.employeeId || employeeId,
      employeeName: item.employeeName || employeeName,
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
      />
    );
  };

  return (
    <ActionPaneContainer
      pageTitle="Employee Leave Requests"
      isBackButton={false} // Use drawer instead of back button
      showFooter={true}
      showFloatingButton={true}
      isHeaderActive={true}
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={handleCreateLeave}>
      {/* Main content */}
      {isLoading ? (
        <CustomIndicator />
      ) : leavesData.length > 0 ? (
        <FlatList
          data={leavesData}
          renderItem={renderLeavesCard}
          keyExtractor={(item, index) =>
            item.recId?.toString() || index.toString()
          }
          contentContainerStyle={styles.LReqLP_ListContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <Text style={styles.LReqLP_NoDataText}>No Data Found</Text>
      )}

      {/* Alert Modal */}
      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />

      {/* Delete Confirmation Modal */}
      <AlertDeleteModal
        visible={deleteModal}
        heading="Confirm Deletion"
        text="Are you sure you want to delete this Leave request?"
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
