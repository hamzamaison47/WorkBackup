import React, {useState, useEffect, useContext} from 'react';
import {View, Text, StyleSheet, FlatList} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {UserContext} from '../../context/UserContext';

import {AlertModal} from '../../components/Leaves/AlertModal';
import PageHeader from '../../components/PageHeader/PageHeader';
import {fetchAllServices} from '../../Controller/EndOfServiceApiService';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import EndOfServiceCard from '../../components/EOS/EndOfServiceCard';
import EOSModal from '../../components/EOS/EOSModal';

import {DeleteServiceRequest} from '../../API/EOS/DeleteServiceRequest';
import {Create} from '../../API/EOS/Create';
import {Update} from '../../API/EOS/Update';
import {SubmitRequest} from '../../API/EOS/SubmitRequest';

const EndOfService = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [serviceData, setServiceData] = useState([]);

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
          const ServiceData = await fetchAllServices(userData.employeeId);

          setServiceData(ServiceData);
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
      fetchAllServices(userData.employeeId);
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

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const service = await fetchAllServices(userData.employeeId);
      console.log('userData-0-0-0-0-0-0-0-0-', userData);
      setServiceData(service);
    } catch (error) {
      setAlertMessage('Failed in Fetch Data.', error);
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getEOSStatus = category => {
    switch (category) {
      case 0:
        return 'Pending';
      case 1:
        return 'Cleared';
      case 2:
        return 'Settled';
      case 3:
        return 'Approved';
      case 4:
        return 'Closed';
      case 5:
        return 'Canceled';
      case 6:
        return 'Interview';
      default:
        return 'Invalid Category';
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

  const handleDeleteLeave = async RecId => {
    try {
      const response = await DeleteServiceRequest({recordsRecId: [RecId]});
      // eslint-disable-next-line eqeqeq
      if (response[0].IsSuccess == true) {
        setAlertMessage('End of Service Request Deleted Successfully.');
        setAlertModal(true);
        const updatedLeavesData = serviceData.filter(
          service => service.RecId !== RecId,
        );
        setServiceData(updatedLeavesData);
      } else {
        setAlertMessage('Unable to Delete End of Service Request.');
        setAlertModal(true);
      }
    } catch (error) {
      console.log('Error', error);
      setAlertMessage('Failed to Delete End of Service Request');
      setAlertModal(true);
    } finally {
      handleRefresh();
    }
  };

  // eslint-disable-next-line no-shadow
  const handleOpenModal = (mode, serviceData = null) => {
    if (mode === 'create') {
      serviceData = {
        recId: userData.WorkerRecId,
        employeeId: userData.employeeId,
        employeeName: userData.employeeName,
      };
    }
    setModalMode(mode);
    setSelectedLeave(serviceData);
    setIsModalVisible(true);
  };

  const renderLeavesCard = ({item}) => (
    <EndOfServiceCard
      NoticePeriodCode={item.NoticePeriodCode}
      EOSNotificationDate={item.EOSNotificationDate}
      LastWorkingDate_Actual={item.LastWorkingDate_Actual}
      EOSStatus={getEOSStatus(item.EOSStatus)}
      WorkflowStatus={getStatusLabel(item.WorkflowStatus)}
      EOSReasonCode={item.EOSReasonCode}
      Remarks={item.Remarks}
      onPress={() =>
        handleOpenModal('edit', {
          recId: item.RecId,
          employeeId: userData.employeeId,
          employeeName: userData.employeeName,
          // employeeId: item.EmployeeId,
          // employeeName: item.EmployeeName,
          EOSType: item.EOSType,
          NoticePeriodCode: item.NoticePeriodCode,
          EOSReasonCode: item.EOSReasonCode,
          EOSNotificationDate: item.EOSNotificationDate,
          LastWorkingDate_Calculated: item.LastWorkingDate_Calculated,
          LastWorkingDate_Actual: item.LastWorkingDate_Actual,
          Remarks: item.Remarks,
        })
      }
      onDelete={() => handleDeleteLeave(item.RecId)}
    />
  );

  // eslint-disable-next-line no-shadow
  const handleAction = async (actionType, modalMode, data = {}) => {
    try {
      console.log('actionType-0-0-0-0-0-0-0-0-0-0-', actionType);
      console.log('modalMode-0-0-0-0-0-0-0-0-0-0-', modalMode);
      console.log('data-0-0-0-0-0-0-0-0-0-0-', data);
      const formattedNotificationDate = `${
        new Date().toISOString().split('T')[0]
      }T12:00:00`;

      // Validation
      if (!data.NoticePeriodCode && !data.selectedEditNoticePeriodCode) {
        setAlertMessage('Notice Period Codeis Required');
        setAlertModal(true);
        return;
      }

      if (
        !data.LastWorkingDate_Actual &&
        !data.editableLastWorkingDate_Actual &&
        isNaN(
          new Date(
            data.LastWorkingDate_Actual || data.editableLastWorkingDate_Actual,
          ).getTime(),
        )
      ) {
        setAlertMessage('Invalid or missing date');
        setAlertModal(true);
        return;
      }

      const eosData = {
        EOSType: data.EOSType,
        NoticePeriodCode: data.NoticePeriodCode,
        EOSReasonCode: data.EOSReasonCode,
        LastWorkingDate_Actual: data.LastWorkingDate_Actual,
        Remarks: data.Remarks,
        EOSNotificationDate: formattedNotificationDate,

        EmployeeId: userData.WorkerRecId,
        // EmployeeId: data.employeeId,
        RecId: data.recId,
      };

      console.log('eosData-0-0-0-0-0-0-0-0-', eosData);
      let response;

      // API Call Logic
      if (modalMode.toLowerCase() === 'create'.toLowerCase()) {
        response = await Create(eosData);
        if (
          response.IsSuccess &&
          actionType.toLowerCase() === 'submit'.toLowerCase()
        ) {
          const submitResponse = await SubmitRequest({recId: response.RecId});
          if (!submitResponse) {
            setAlertMessage('Failed to Submit Registeration Request.');
            setAlertModal(true);
            return;
          }
        }
      } else {
        response = await Update(eosData);
        if (
          response.IsSuccess &&
          actionType.toLowerCase() === 'submit'.toLowerCase()
        ) {
          const submitResponse = await SubmitRequest({recId: data.recId});
          if (!submitResponse) {
            setAlertMessage('Failed to Submit Registeration Request.');
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
              ? 'Registeration Request Created Successfully.'
              : 'Registeration Request Created and Submitted Successfully.'
            : actionType.toLowerCase() === 'save'.toLowerCase()
            ? 'Registeration Request Updated Successfully.'
            : 'Registeration Request Updated and Submitted Successfully.';
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
      ) : serviceData.length > 0 ? (
        <FlatList
          data={serviceData}
          renderItem={renderLeavesCard}
          keyExtractor={(item, index) => index.toString()}
          // eslint-disable-next-line react-native/no-inline-styles
          contentContainerStyle={{flexGrow: 1}}
        />
      ) : (
        <Text style={styles.mainTxt}>No Data Found</Text>
      )}

      <EOSModal
        visible={isModalVisible}
        onClose={handleCloseModal}
        mode={modalMode.toLowerCase()}
        onAction={handleAction}
        serviceData={selectedLeave}
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
  mainTxt: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    // fontSize: 16,

    fontSize: 18,
    fontWeight: 'bold',
    color: '#cccccc',
  },
});

export default EndOfService;
