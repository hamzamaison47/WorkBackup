import React, {useState, useEffect, useContext} from 'react';
import {View, Text, StyleSheet, FlatList} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {UserContext} from '../../context/UserContext';

import {createLeaveRequest} from '../../API/CreateLeaveRequest/CreateLeaveRequest';
import {submit} from '../../API/Leaves/submit';
import {update} from '../../API/Leaves/update';
import {deleteLeaveRequest} from '../../API/Leaves/deleteLeaveRequest';
import {AlertModal} from '../../components/Leaves/AlertModal';
import PageHeader from '../../components/PageHeader/PageHeader';
import LeaveCard from '../../components/Leaves/LeaveCard';
import LeaveModal from '../../components/Leaves/LeaveModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import {fetchLeaves} from '../../Controller/leaveRequestApiService';

const LeaveRequest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [leavesData, setLeavesData] = useState([]);

  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedLeave, setSelectedLeave] = useState(null);

  const navigation = useNavigation();
  const {userData} = useContext(UserContext);

  // Shows record on loading screen automatically
  useEffect(() => {
    const fetchEntitlementData = async () => {
      if (userData.employeeId) {
        setIsLoading(true);
        try {
          const LeaveData = await fetchLeaves(userData.employeeId);

          setLeavesData(LeaveData);
        } catch (error) {
          setAlertMessage('Failed to Fetch Data.');
          setAlertModal(true);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchEntitlementData();
  }, [userData.employeeId]);

  useEffect(() => {
    if (userData.employeeId) {
      fetchLeaves(userData.employeeId);
    }
  }, [userData.employeeId]);

  useEffect(() => {
    // Set header options using PageHeaderComponent
    const headerOptions = PageHeader({
      onGoBack: handleGoBack,
      onRefresh: handleRefresh,
      OnNewRecord: () => handleOpenModal('create'),
    });
    navigation.setOptions(headerOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const leaves = await fetchLeaves(userData.employeeId);
      setLeavesData(leaves);
    } catch (error) {
      setAlertMessage('Failed in Fetch Data.', error);
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getLeaveCategory = category => {
    switch (category) {
      case 0:
        return 'Full Leave';
      case 1:
        return 'Half Leave';
      default:
        return 'Invalid Category';
    }
  };

  const getLeaveCategoryCode = categoryName => {
    switch (categoryName) {
      case 'Full Leave':
        return 0;
      case 'Half Leave':
        return 1;
      default:
        return 2;
    }
  };

  const getStatusLabel = status => {
    switch (status) {
      case 0:
        return 'Draft';
      case 1:
        return 'Approved';
      case 2:
        return 'Cancelled';
      case 3:
        return 'Rejected';
      case 4:
        return 'Submitted';
      case 5:
        return 'Change Request';
      case 6:
        return 'Pending Cancellation';
      case 7:
        return 'Retured';
      case 8:
        return 'Pending Approval';
      case 9:
        return 'Pending Complete';
      case 10:
        return 'Workflow Completed';
      case 11:
        return 'Completed';
      case 12:
        return 'Failed';
      default:
        return 'Pending Complete';
    }
  };

  const handleDeleteLeave = async recId => {
    try {
      const response = await deleteLeaveRequest({recordsRecId: [recId]});
      // eslint-disable-next-line eqeqeq
      if (response[0].IsSuccess == true) {
        setAlertMessage('Leave Request Deleted Successfully.');
        setAlertModal(true);
        const updatedLeavesData = leavesData.filter(
          leave => leave.recId !== recId,
        );
        setLeavesData(updatedLeavesData);
      } else {
        setAlertMessage('Unable to Delete Leave Request.');
        setAlertModal(true);
      }
    } catch (error) {
      console.log('Error', error);
      setAlertMessage('Failed to Update Leave Request');
      setAlertModal(true);
    } finally {
      handleRefresh();
    }
  };

  const handleOpenModal = (mode, leaveData = null) => {
    if (mode === 'create') {
      leaveData = {
        recId: userData.WorkerRecId,
        employeeId: userData.employeeId,
        employeeName: userData.employeeName,
      };
    }
    setModalMode(mode);
    setSelectedLeave(leaveData);
    setIsModalVisible(true);
  };

  const renderLeavesCard = ({item}) => (
    <LeaveCard
      recId={item.recId}
      leaveReqId={item.leaveReqId}
      employeeId={item.employeeId}
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
      onPress={() =>
        handleOpenModal('edit', {
          recId: item.recId,
          employeeId: item.employeeId,
          employeeName: item.employeeName,
          leaveCode: item.leaveCode,
          leaveCategory: getLeaveCategory(item.leaveCategory),
          balance: item.balance,
          leaveStartDate: item.leaveStartDate,
          leaveEndDate: item.leaveEndDate,
          leaveDays: item.leaveDays,
          reason: item.reason,
        })
      }
      onDelete={() => handleDeleteLeave(item.recId)}
    />
  );

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const convertDateFormat = date => {
    const baseDate = new Date(date);
    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, '0');
    const day = String(baseDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}T12:00:00`;
  };

  // eslint-disable-next-line no-shadow
  const handleAction = async (actionType, modalMode, data = {}) => {
    try {
      const formattedLeaveReqDate = `${
        new Date().toISOString().split('T')[0]
      }T12:00:00`;

      // Validation
      if (!data.leaveCode && !data.selectedEditLeaveCode) {
        setAlertMessage('Leave Code is Required');
        setAlertModal(true);
        return;
      }

      if (
        !data.leaveEndDate &&
        !data.editableLeaveEndDate &&
        isNaN(
          new Date(data.leaveEndDate || data.editableLeaveEndDate).getTime(),
        )
      ) {
        setAlertMessage('Invalid or missing date');
        setAlertModal(true);
        return;
      }

      const leaveData = {
        LeaveCode: data.leaveCode,
        LeaveDays: Number(data.leaveDays),
        LeaveCategory: getLeaveCategoryCode(data.leaveCategory),
        Balance: data.balance,
        LeaveStartDate: data.leaveStartDate,
        LeaveEndDate:
          modalMode.toLowerCase() === 'create'.toLowerCase()
            ? convertDateFormat(data.leaveEndDate)
            : convertDateFormat(data.leaveEndDate),
        LeaveReqDate: formattedLeaveReqDate,
        Reason: data.reason,
        EmployeeId: data.employeeId,
        RecId: data.recId,
      };

      let response;

      // API Call Logic
      if (modalMode.toLowerCase() === 'create'.toLowerCase()) {
        response = await createLeaveRequest(leaveData);
        if (
          response.IsSuccess &&
          actionType.toLowerCase() === 'submit'.toLowerCase()
        ) {
          const submitResponse = await submit({recId: response.RecId});
          if (!submitResponse) {
            setAlertMessage('Failed to Submit Leave Request.');
            setAlertModal(true);
            return;
          }
        }
      } else {
        response = await update(leaveData);
        if (
          response.IsSuccess &&
          actionType.toLowerCase() === 'submit'.toLowerCase()
        ) {
          const submitResponse = await submit({recId: data.recId});
          if (!submitResponse) {
            setAlertMessage('Failed to Submit Leave Request.');
            setAlertModal(true);
            return;
          }
        }
      }

      // Success or Error Messages
      if (response.IsSuccess) {
        const successMessage =
          modalMode.toLowerCase() === 'create'.toLowerCase()
            ? actionType.toLowerCase() === 'save'.toLowerCase()
              ? 'Leave Request Created Successfully.'
              : 'Leave Request Created and Submitted Successfully.'
            : actionType.toLowerCase() === 'save'.toLowerCase()
            ? 'Leave Request Updated Successfully.'
            : 'Leave Request Updated and Submitted Successfully.';
        setAlertMessage(successMessage);
      } else {
        setAlertMessage(response.Message || 'Operation Failed.');
      }
    } catch (error) {
      setAlertMessage('An error occurred while processing the request.');
      console.error(error);
    } finally {
      setAlertModal(true);
      setIsModalVisible(false);
      handleRefresh();
    }
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <CustomIndicator />
      ) : leavesData.length > 0 ? (
        <FlatList
          data={leavesData}
          renderItem={renderLeavesCard}
          keyExtractor={(item, index) => index.toString()}
          // eslint-disable-next-line react-native/no-inline-styles
          contentContainerStyle={{flexGrow: 1}}
        />
      ) : (
        <Text style={styles.mainTxt}>No Data Found</Text>
      )}

      <LeaveModal
        visible={isModalVisible}
        onClose={handleCloseModal}
        mode={modalMode.toLowerCase()}
        onAction={handleAction}
        leaveData={selectedLeave}
      />

      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContainer: {
    flexGrow: 1,
  },
  indicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  mainTxt: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 16,

    fontWeight: 'bold',
    color: '#cccccc',
  },
});

export default LeaveRequest;
