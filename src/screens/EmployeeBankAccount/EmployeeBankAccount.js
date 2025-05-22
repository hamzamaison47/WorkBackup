/* eslint-disable no-shadow */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable eqeqeq */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useContext} from 'react';
import {View, Text, StyleSheet, FlatList} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {UserContext} from '../../context/UserContext';

import {AlertModal} from '../../components/Leaves/AlertModal';
import PageHeader from '../../components/PageHeader/PageHeader';
import EmployeeBankCard from '../../components/EmployeeBankAccount/EmployeeBankCard';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';

import {FindEmployeeBankAccount} from '../../API/EmployeeBankAccount/FindEmployeeBankAccount';
import {DeleteEmployeeBankAccount} from '../../API/EmployeeBankAccount/DeleteEmployeeBankAccount';
import EmployeeBankModal from '../../components/EmployeeBankAccount/EmployeeBankModal';
import {CreateEmployeeBankAccount} from '../../API/EmployeeBankAccount/CreateEmployeeBankAccount';
import {UpdateEmployeeBankAccount} from '../../API/EmployeeBankAccount/UpdateEmployeeBankAccount';
import {SubmitEmployeeBankAccount} from '../../API/EmployeeBankAccount/SubmitEmployeeBankAccount';

const EmployeeBankAccount = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [bankAccountData, setBankAccountData] = useState([]);

  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedBank, setSelectedBank] = useState(null);

  const navigation = useNavigation();
  const {userData} = useContext(UserContext);

  // Shows record on loading screen automatically
  useEffect(() => {
    const fetchEntitlementData = async () => {
      if (userData.employeeId) {
        setIsLoading(true);
        try {
          const BankData = await FindEmployeeBankAccount({
            employeeId: userData.employeeId,
          });

          setBankAccountData(BankData);
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
    // Set header options using PageHeaderComponent
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
      const employeeAccount = await FindEmployeeBankAccount({
        employeeId: userData.employeeId,
      });

      setBankAccountData(employeeAccount);
    } catch (error) {
      setAlertMessage('Failed in Fetch Data.', error);
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getWFOperationLabel = status => {
    switch (status) {
      case 0:
        return 'Insert';
      case 1:
        return 'Update';
      case 2:
        return 'Delete';
      default:
        return 'N/A';
    }
  };

  const getWFStatusLabel = status => {
    switch (status) {
      case 0:
        return 'Not Submitted';
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
      default:
        return 'Pending Complete';
    }
  };

  const handleDeleteBankAccount = async recId => {
    try {
      const response = await DeleteEmployeeBankAccount({recordsRecId: [recId]});
      if (response[0].IsSuccess == true) {
        setAlertMessage('Employee Bank Account Request Deleted Successfully.');
        setAlertModal(true);
        const updatedBankData = bankAccountData.filter(
          bank => bank.RecId !== recId,
        );
        setBankAccountData(updatedBankData);
      } else {
        setAlertMessage('Unable to Delete Employee Bank Account Request.');
        setAlertModal(true);
      }
    } catch (error) {
      console.log('Error', error);
      setAlertMessage('Failed to Update Employee Bank Account Request');
      setAlertModal(true);
    } finally {
      handleRefresh();
    }
  };

  const handleOpenModal = (mode, bankData = null) => {
    if (mode === 'create') {
      bankData = {
        RecId: userData.WorkerRecId,
        employeeId: userData.employeeId,
        employeeName: userData.employeeName,
      };
    }
    setModalMode(mode);
    setSelectedBank(bankData);
    setIsModalVisible(true);
  };

  const renderBankCard = ({item}) => (
    <EmployeeBankCard
      recId={item.RecId}
      accountId={item.AccountId}
      name={item.Name}
      accountNum={item.AccountNum}
      accountHolder={item.AccountHolder}
      bankIBAN={item.BankIBAN}
      branchNumber={item.BranchNumber}
      branchName={item.BranchName}
      wfOperation={getWFOperationLabel(item.WFOperation)}
      wfStatus={getWFStatusLabel(item.WFStatus)}
      onPress={() =>
        handleOpenModal('edit', {
          recId: item.RecId,
          employeeId: userData.employeeId,
          employeeName: userData.employeeName,
          accountId: item.AccountId,
          name: item.Name,
          accountNum: item.AccountNum,
          accountHolder: item.AccountHolder,
          bankIBAN: item.BankIBAN,
          branchNumber: item.BranchNumber,
          branchName: item.BranchName,
        })
      }
      onDelete={() => handleDeleteBankAccount(item.RecId)}
    />
  );

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const handleAction = async (actionType, modalMode, data = {}) => {
    try {
      // Validation
      if (!data.accountId) {
        setAlertMessage('Account ID is Required');
        setAlertModal(true);
        return false; // Indicate failure
      }

      const empBankData = {
        RecId: data.recId,
        AccountId: data.accountId,
        Name: data.name,
        AccountNum: data.accountNum,
        AccountHolder: data.accountHolder,
        Worker: userData.WorkerRecId,
        BankIBAN: data.bankIBAN,
        BranchNumber: data.branchNumber,
        BranchName: data.branchName,
        EmployeeId: data.employeeId,
      };

      let response;

      // API Call Logic
      if (modalMode.toLowerCase() === 'create'.toLowerCase()) {
        response = await CreateEmployeeBankAccount(empBankData);
        if (
          response.IsSuccess &&
          actionType.toLowerCase() === 'submit'.toLowerCase()
        ) {
          const submitResponse = await SubmitEmployeeBankAccount({
            recId: response.RecId,
          });
          if (!submitResponse) {
            setAlertMessage('Failed to Submit Employee Bank Account Request.');
            setAlertModal(true);
            return false; // Indicate failure
          }
        }
      } else {
        response = await UpdateEmployeeBankAccount(empBankData);
        if (
          response.IsSuccess &&
          actionType.toLowerCase() === 'submit'.toLowerCase()
        ) {
          const submitResponse = await SubmitEmployeeBankAccount({
            recId: data.recId,
          });
          if (!submitResponse) {
            setAlertMessage('Failed to Submit Employee Bank Account Request.');
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
              ? 'Employee Bank Account Request Created Successfully.'
              : 'Employee Bank Account Request Created and Submitted Successfully.'
            : actionType.toLowerCase() === 'save'.toLowerCase()
            ? 'Employee Bank Account Request Updated Successfully.'
            : 'Employee Bank Account Request Updated and Submitted Successfully.';
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
      ) : bankAccountData.length > 0 ? (
        <FlatList
          data={bankAccountData}
          renderItem={renderBankCard}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{flexGrow: 1}}
        />
      ) : (
        <>
          <Text style={styles.mainTxt}>No Data Found</Text>
        </>
      )}

      <EmployeeBankModal
        visible={isModalVisible}
        onClose={handleCloseModal}
        mode={modalMode.toLowerCase()}
        onAction={handleAction}
        bankAccountData={selectedBank}
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

export default EmployeeBankAccount;
