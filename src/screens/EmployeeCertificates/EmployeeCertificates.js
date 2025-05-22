/* eslint-disable react-native/no-inline-styles */
/* eslint-disable eqeqeq */
/* eslint-disable no-shadow */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useContext} from 'react';
import {View, Text, StyleSheet, FlatList} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {UserContext} from '../../context/UserContext';

import {AlertModal} from '../../components/Leaves/AlertModal';
import PageHeader from '../../components/PageHeader/PageHeader';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import CertificateCard from '../../components/EmployeeCertificates/CertificateCard';
import CertificateModal from '../../components/EmployeeCertificates/CertificateModal';

import {RetrieveAllCertificates} from '../../API/EmployeeCertificates/RetrieveAllCertificates';
import {DeleteCertificate} from '../../API/EmployeeCertificates/DeleteCertificate';
import {CreateEmployeeCertificate} from '../../API/EmployeeCertificates/CreateEmployeeCertificate';
import {SubmitEmployeeCertificate} from '../../API/EmployeeCertificates/SubmitEmployeeCertificate';
import {UpdateEmployeeCertificate} from '../../API/EmployeeCertificates/UpdateEmployeeCertificate';

const EmployeeCertificates = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [certificateData, setCertificateData] = useState([]);

  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  const navigation = useNavigation();
  const {userData} = useContext(UserContext);

  // Shows record on loading screen automatically
  useEffect(() => {
    const fetchCertificateData = async () => {
      if (userData.employeeId) {
        setIsLoading(true);
        try {
          const allCertificates = await RetrieveAllCertificates();

          const filteredAllCertificates = allCertificates.filter(
            item => item.EmpId === userData.WorkerRecId,
          );

          setCertificateData(filteredAllCertificates);
        } catch (error) {
          setAlertMessage('Failed to Fetch Data.');
          setAlertModal(true);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchCertificateData();
  }, [userData.employeeId]);

  // Set header options using PageHeaderComponent
  useEffect(() => {
    const headerOptions = PageHeader({
      onGoBack: handleGoBack,
      onRefresh: handleRefresh,
      OnNewRecord: () => handleOpenModal('create'),
    });
    navigation.setOptions(headerOptions);
  }, [navigation]);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const allCertificates = await RetrieveAllCertificates();

      const filteredAllCertificates = allCertificates.filter(
        item => item.EmpId === userData.WorkerRecId,
      );

      setCertificateData(filteredAllCertificates);
    } catch (error) {
      setAlertMessage('Failed in Fetch Data.', error);
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getCertificateType = category => {
    switch (category) {
      case 1:
        return 'Clearance';
      case 2:
        return 'Salary Certificate';
      case 3:
        return 'Employment Salary';
      case 4:
        return 'Warning Salary';
      case 5:
        return 'Salary Transfer Letter';
      case 6:
        return 'Appointment';
      case 7:
        return 'Confirmation';
      case 8:
        return 'Work Experiance';
      case 9:
        return 'Termination';
      default:
        return 'Invalid Category';
    }
  };

  const getCertificateTypeCode = certificateType => {
    switch (certificateType) {
      case 'Clearance':
        return 1;
      case 'Salary Certificate':
        return 2;
      case 'Employment Salary':
        return 3;
      case 'Warning Salary':
        return 4;
      case 'Salary Transfer Leyter':
        return 5;
      case 'Appointment':
        return 6;
      case 'Confirmation':
        return 7;
      case 'Work Experience':
        return 8;
      case 'Termination':
        return 9;
      default:
        return 0;
    }
  };

  // ESSWorkFlowStatus
  const getStatusLabel = status => {
    switch (status) {
      case 0:
        return 'Not Submitted';
      case 1:
        return 'Submitted';
      case 2:
        return 'Pending Approval';
      case 3:
        return 'Approved';
      case 4:
        return 'Retured';
      case 5:
        return 'Change Request';
      case 6:
        return 'Completed';
      case 7:
        return 'Pending Cancellation';
      case 8:
        return 'Canceled';
      case 9:
        return 'Rejected';
      default:
        return 'Pending Complete';
    }
  };

  const handleDeleteCertificate = async recId => {
    try {
      const response = await DeleteCertificate({recordsRecId: [recId]});

      if (response[0].IsSuccess == true) {
        setAlertMessage('Employee Certificate Request Deleted Successfully.');
        setAlertModal(true);

        const updatedCertificateData = certificateData.filter(
          item => item.recId !== recId,
        );

        setCertificateData(updatedCertificateData);
      } else {
        setAlertMessage('Unable to Delete Employee Certificate Request.');
        setAlertModal(true);
      }
    } catch (error) {
      console.log('Error', error);
      setAlertMessage('Failed to Update Employee Certificate Request');
      setAlertModal(true);
    } finally {
      handleRefresh();
    }
  };

  const handleOpenModal = (mode, certificateData = null) => {
    if (mode === 'create') {
      certificateData = {
        employeeId: userData.employeeId,
        employeeName: userData.employeeName,
      };
    }
    setModalMode(mode);
    setSelectedCertificate(certificateData);
    setIsModalVisible(true);
  };

  const renderCertificateCard = ({item}) => (
    <CertificateCard
      recId={item.RecId}
      employeeID={item.EmployeeID}
      employeeName={item.EmployeeName}
      certificateId={item.CertificateId}
      CertificateType={getCertificateType(item.CertificateType)}
      department={item.Department}
      reason={item.Reason}
      jobId={item.JobId}
      reqestedFor={item.ReqestedFor}
      requestedDate={item.RequestedDate}
      remarks={item.Remarks}
      wfStatus={getStatusLabel(item.WorkflowState)}
      onPress={() =>
        handleOpenModal('edit', {
          recId: item.RecId,
          employeeID: item.EmployeeId,
          employeeName: item.EmployeeName,
          certificateId: item.CertificateId,
          CertificateType: getCertificateType(item.CertificateType),
          department: item.Department,
          jobId: item.JobId,
          reason: item.Reason,
          remarks: item.Remarks,
          reqestedFor: item.ReqestedFor,
          requestedDate: item.RequestedDate,
          wfStatus: item.WorkflowState,
        })
      }
      onDelete={() => handleDeleteCertificate(item.RecId)}
    />
  );

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const handleAction = async (actionType, modalMode, data = {}) => {
    try {
      const formattedReqDate = `${
        new Date().toISOString().split('T')[0]
      }T12:00:00`;

      // Validation
      if (!data.CertificateType) {
        setAlertMessage('Certificate Type is Required');
        setAlertModal(true);
        return false; // Indicate failure
      }

      const employeeCertificateData = {
        CertificateType: getCertificateTypeCode(data.CertificateType),
        Department: userData.department,
        JobId: userData.jobId,
        Reason: data.reason,
        Remarks: data.remarks,
        ReqestedFor: data.reqestedFor,
        RequestedDate: formattedReqDate,
        EmployeeName: data.employeeName,
        EmployeeId: data.employeeId,
        EmpId: userData.WorkerRecId,
        RecId: data.recId,
      };

      if (modalMode.toLowerCase() !== 'create') {
        employeeCertificateData.CertificateId = data.certificateId;
      }

      let response;

      // API Call Logic
      if (modalMode.toLowerCase() === 'create'.toLowerCase()) {
        response = await CreateEmployeeCertificate(employeeCertificateData);
        if (
          response.IsSuccess &&
          actionType.toLowerCase() === 'submit'.toLowerCase()
        ) {
          const submitResponse = await SubmitEmployeeCertificate({
            recId: response.RecId,
          });
          if (!submitResponse) {
            setAlertMessage('Failed to Submit Employee Certificate Request.');
            setAlertModal(true);
            return false; // Indicate failure
          }
        }
      } else {
        response = await UpdateEmployeeCertificate(employeeCertificateData);
        if (
          response.IsSuccess &&
          actionType.toLowerCase() === 'submit'.toLowerCase()
        ) {
          const submitResponse = await SubmitEmployeeCertificate({
            recId: data.recId,
          });
          if (!submitResponse) {
            setAlertMessage('Failed to Submit Employee Certificate Request.');
            setAlertModal(true);
            return false; // Indicate failure
          }
        }
      }
      // Success or Error Messages
      if (response.IsSuccess) {
        const successMessage =
          modalMode.toLowerCase() === 'create'.toLowerCase()
            ? actionType.toLowerCase() === 'save'.toLowerCase()
              ? 'Employee Certificate Created Successfully.'
              : 'Employee Certificate Created and Submitted Successfully.'
            : actionType.toLowerCase() === 'save'.toLowerCase()
            ? 'Employee Certificate Updated Successfully.'
            : 'Employee Certificate Updated and Submitted Successfully.';
        setAlertMessage(successMessage);
        return true; // Indicate success
      } else {
        setAlertMessage(response.Message || 'Operation Failed.');
        return false; // Indicate failure
      }
    } catch (error) {
      setAlertMessage('An error occurred while processing the request.');
      console.error(error);
      return false; // Indicate failure
    } finally {
      setAlertModal(true);
      handleRefresh();
    }
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <CustomIndicator />
      ) : certificateData.length > 0 ? (
        <FlatList
          data={certificateData}
          renderItem={renderCertificateCard}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{flexGrow: 1}}
        />
      ) : (
        <Text style={styles.mainTxt}>No Data Found</Text>
      )}

      <CertificateModal
        visible={isModalVisible}
        onClose={handleCloseModal}
        mode={modalMode.toLowerCase()}
        onAction={handleAction}
        certificateData={selectedCertificate}
        userData={userData}
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

export default EmployeeCertificates;
