/* eslint-disable curly */
import React, {useState, useCallback} from 'react';
import {useSelector} from 'react-redux';
import {Text, StyleSheet, FlatList, Dimensions} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';

// import {AlertModal} from '../../components/Alert/AlertModal';
import LeaveRequestCard from '../../components/Leaves/LeaveRequestCard';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';

import {DeleteLeaveRequest} from '../../API/Leaves/DeleteLeaveRequest';
import {fetchLeaves} from '../../Controller/leaveRequestApiService';

const {width, height} = Dimensions.get('window');

const LeaveRequestListPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [leavesData, setLeavesData] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [highlightedRecId, setHighlightedRecId] = useState(null);

  const navigation = useNavigation();

  // Redux selectors
  const {selectedLegalEntity, defaultLegalEntity} = useSelector(
    state => state.company,
  );

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

  // Handle delete leave
  const handleDeleteLeave = async recId => {
    try {
      const companyToUse = selectedLegalEntity || defaultLegalEntity;
      const response = await DeleteLeaveRequest({
        recordsRecId: [recId],
        defaultCompany: companyToUse,
      });
      if (response[0].IsSuccess) {
        setAlertMessage('Leave Request Deleted Successfully.');
        setLeavesData(prev => prev.filter(leave => leave.recId !== recId));
      } else {
        setAlertMessage('Unable to Delete Leave Request.');
      }
    } catch (error) {
      setAlertMessage('Failed to Delete Leave Request');
    } finally {
      setAlertModal(true);
      setTimeout(() => {
        fetchLeavesData();
      }, 1000);
    }
  };

  // Render leave card
  const renderLeavesCard = ({item}) => {
    const isHighlighted = highlightedRecId === item.recId;

    return (
      <LeaveRequestCard
        recId={item.recId}
        leaveReqId={item.leaveReqId}
        employeeId={employeeId}
        employeeName={item.employeeName}
        leaveCode={item.leaveCode}
        leaveCategory={getLeaveCategory(item.leaveCategory)}
        leaveReqDate={item.leaveReqDate}
        leaveDays={item.leaveDays}
        leaveStartDate={item.leaveStartDate}
        leaveEndDate={item.leaveEndDate}
        reason={item.reason}
        balance={item.balance}
        wfStatus={getStatusLabel(item.wfStatus)}
        onDelete={() => handleDeleteLeave(item.recId)}
        isHighlighted={isHighlighted}
      />
    );
  };

  return (
    <ActionPaneContainer
      pageTitle="Leaves"
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
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <Text style={styles.noDataText}>No Data Found</Text>
      )}

      {/* Alert Modal */}
      {/* <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      /> */}
    </ActionPaneContainer>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: height * 0.05,
    paddingHorizontal: width * 0.03,
    paddingTop: height * 0.01,
  },
  noDataText: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: width * 0.04,
    fontWeight: 'bold',
    color: '#999999',
  },
});

export default LeaveRequestListPage;
