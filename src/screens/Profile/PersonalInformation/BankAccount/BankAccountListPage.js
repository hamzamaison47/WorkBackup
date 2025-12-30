/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
import React, {useState, useCallback} from 'react';
import {Text, FlatList, BackHandler, RefreshControl} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';

import AlertModal from '../../../../components/Alert/AlertModal';
import AlertDeleteModal from '../../../../components/Alert/AlertDeleteModal';
import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../../../components/ActionPaneContainer';
import DynamicRequestCard from '../../../../components/DynamicRequestCard';
import styles from '../../../../styles/styles';

import {retrieveAllBankAccounts} from '../../../../API/PersonalInformation/BankAccounts/BankAccountfindbyEmployee';
import {DeletBankAccount} from '../../../../API/PersonalInformation/BankAccounts/BankAccountDelete';
import {useSelector} from 'react-redux';
import SubmitBankAccountRecord from '../../../../API/PersonalInformation/BankAccounts/BankAccountSubmit';
import {ScrollView} from 'react-native-gesture-handler';

const BankAccountListPage = () => {
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
  const reduxUserData = useSelector(state => state.user.userData);
  const effectiveUserData = routeUserData || reduxUserData;

  // Use effective user data for all operations
  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
  const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;
  const effectiveWorkerRecId = WorkerRecId || effectiveUserData?.WorkerRecId;

  const [isLoading, setIsLoading] = useState(false);
  const [banksaccountdata, setbankaccountdata] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [highlightedRecId, setHighlightedRecId] = useState(null);
  const [processingButtons, setProcessingButtons] = useState({});

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Fetch Bank Account data
  const fetchBankAccountData = useCallback(async () => {
    if (!effectiveEmployeeId) return;

    setIsLoading(true);
    try {
      const BankAccountData = await retrieveAllBankAccounts({
        employeeId: effectiveEmployeeId, // ✅
      });

      // ✅ Sort newest record on top
      BankAccountData.sort((a, b) => (b.recId || 0) - (a.recId || 0));

      setbankaccountdata(BankAccountData);
    } catch (error) {
      setAlertMessage('Failed to fetch data.');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveEmployeeId]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchBankAccountData();
    }, [fetchBankAccountData]),
  );

  // Handle highlighting of records
  useFocusEffect(
    useCallback(() => {
      if (highlightRecId) {
        setHighlightedRecId(highlightRecId);
        fetchBankAccountData();

        const timer = setTimeout(() => {
          setHighlightedRecId(null);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }, [highlightRecId, fetchBankAccountData]),
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

  // Handle back navigation
  // const handleGoBack = () => {
  //   let targetRoute = 'MainDashboard'; // default

  //   switch (cameFrom) {
  //     case 'MainDashboard':
  //       targetRoute = 'MainDashboard';
  //       break;
  //     case 'DisplayListPage':
  //       targetRoute = 'DisplayListPage';
  //       break;
  //     case 'DrawerNavigator':
  //       targetRoute = 'MainDashboard';
  //       break;
  //     case 'WorkerAssignedToMe':
  //       targetRoute = 'WorkerAssignedToMe';
  //       break;
  //     default:
  //       navigation.goBack();
  //       return; // exit early
  //   }

  //   navigation.reset({
  //     index: 0, // top of the stack
  //     routes: [{name: 'TabNavigator', params: {screen: targetRoute}}],
  //   });
  // };
  const handleGoBack = () => {
    navigation.navigate('DisplayPersonalInfo');
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchBankAccountData();
  };

  // Handle create Bank Account Record
  const handleBankAccountRecordCreation = () => {
    navigation.navigate('BankAccountSaveRecord', {
      mode: 'create',
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: effectiveUserData,
      cameFrom: 'BankAccountListPage',
      originalCameFrom: cameFrom,
      bankaccountdata: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
        recId: '',
        AccountId: '',
        AccountNum: '',
        BankIBAN: '',
        Name: '',
        BranchNumber: '',
        BranchName: '',
        AccountHolder: '',
      },
    });
  };

  const getStatusLabel = status => {
    const statusMap = {
      NotSubmitted: 'Draft',
      Submitted: 'Submitted',
      Approved: 'Approved',
      Rejected: 'Rejected',
      Cancelled: 'Cancelled',
      ChangeRequest: 'Change Request',
      PendingCancellation: 'Pending Cancellation',
      Returned: 'Returned',
      PendingApproval: 'Pending Approval', // ← now matches the enum
      PendingComplete: 'Pending Complete',
      WorkflowCompleted: 'Workflow Completed',
      Completed: 'Completed',
    };
    return statusMap[status] || 'Draft';
  };

  // Card Configuration
  const cardConfig = {
    headerConfig: {
      title: {key: 'AccountId'},
    },

    fields: [
      {key: 'Name', label: 'Account Name', type: 'text'},
      {key: 'AccountNum', label: 'Account Number', type: 'text'},
      {key: 'AccountHolder', label: 'Account Holder', type: 'text'},
      {key: 'WFStatus', label: '', type: 'status'},
    ],

    expandableFields: [
      {key: 'AccountId', label: 'Account Type', type: 'text'},
      {key: 'BankIBAN', label: 'IBAN', type: 'text'},
      {key: 'BranchNumber', label: 'Branch Number', type: 'text'},
      {key: 'BranchName', label: 'Branch Name', type: 'text'},
      // {key: 'CreatedBy', label: 'Created By', type: 'text'},
    ],
  };

  // Define button configuration
  const getButtonConfig = item => {
    const isDraft = getStatusLabel(item.WFStatus) === 'Draft';

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

  const setButtonProcessing = (recId, buttonType, isProcessing) => {
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: isProcessing
        ? [...(prev[recId] || []), buttonType]
        : (prev[recId] || []).filter(btn => btn !== buttonType),
    }));
  };

  const handleButtonPress = (buttonType, itemData) => {
    console.log(itemData);
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
    navigation.navigate('BankAccountSaveRecord', {
      mode: 'edit',
      employeeId: itemData.employeeId || employeeId,
      employeeName: itemData.employeeName || employeeName,
      WorkerRecId: itemData.WorkerRecId || WorkerRecId,
      userData: route.params?.userData || {
        employeeId,
        employeeName,
        WorkerRecId,
      }, // Ensure userData is passed
      cameFrom: 'BankAccountListPage',
      originalCameFrom: cameFrom,
      bankaccountdata: {
        recId: itemData.recId,
        employeeId: itemData.employeeId || employeeId,
        employeeName: itemData.employeeName || employeeName,
        WorkerRecId: itemData.WorkerRecId || WorkerRecId,
        AccountHolder: itemData.AccountHolder,
        AccountId: itemData.AccountId,
        AccountNum: itemData.AccountNum,
        BankIBAN: itemData.BankIBAN,
        BranchNumber: itemData.BranchNumber,
        BranchName: itemData.BranchName,
        Name: itemData.Name,
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

    try {
      const response = await DeletBankAccount({
        recordsRecId: [itemToDelete.recId],
      });

      if (response[0].IsSuccess) {
        setAlertMessage('Bank Account Record Deleted Successfully.');
        setbankaccountdata(prev =>
          prev.filter(bank => bank.recId !== itemToDelete.recId),
        );
      } else {
        setAlertMessage('Unable to Delete Bank Account Record.');
      }
    } catch (error) {
      setAlertMessage('Failed to Delete Bank Account Record');
      console.log('Delete Bank Account response', error);
    } finally {
      setButtonProcessing(itemToDelete.recId, 'delete', false);
      setDeleteModal(false);
      setItemToDelete(null);
      setAlertModal(true);
      setTimeout(() => {
        fetchBankAccountData();
      }, 1000);
    }
  };

  const handleSubmitPress = async itemData => {
    setButtonProcessing(itemData.recId, 'submit', true);

    try {
      const response = await SubmitBankAccountRecord({
        recId: itemData.recId,
      });

      // console.log('itemData-0-0-0--0-0-0-0-0-0--', itemData);
      // console.log({response});

      if (
        response &&
        (Array.isArray(response) ? response[0] : response) &&
        String(
          (Array.isArray(response) ? response[0] : response).IsSuccess,
        ).toLowerCase() === 'true'
      ) {
        setAlertMessage(`${itemData.AccountId} is Submitted Successfully.`);
        setAlertModal(true);
        setHighlightedRecId(itemData.recId);

        setTimeout(() => {
          setHighlightedRecId(null);
        }, 3000);

        setTimeout(() => {
          fetchBankAccountData();
        }, 1000);
      } else {
        const resObj = Array.isArray(response) ? response[0] : response;
        const errorMessage =
          resObj && resObj.Message
            ? resObj.Message
            : 'Failed to Submit Bank Account Record';
        setAlertMessage(errorMessage);
        setAlertModal(true);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setAlertMessage('Failed to Submit Bank Account Record');
      setAlertModal(true);
    } finally {
      setButtonProcessing(itemData.recId, 'submit', false);
    }
  };

  const renderBankAccountCard = ({item}) => {
    const isHighlighted = highlightedRecId === item.recId;
    const itemProcessingButtons = processingButtons[item.recId] || [];

    const processedItem = {
      ...item,
      employeeId: item.employeeId || employeeId,
      employeeName: item.employeeName || employeeName,
      WFStatus: getStatusLabel(item.WFStatus), // ✅ map enum → display label here
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
      pageTitle="Bank Accounts"
      isBackButton={false}
      showFooter={true}
      showFloatingButton={true}
      isHeaderActive={true}
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={handleBankAccountRecordCreation}>
      {isLoading ? (
        <CustomIndicator />
      ) : banksaccountdata.length > 0 ? (
        <FlatList
          data={banksaccountdata}
          renderItem={renderBankAccountCard}
          keyExtractor={(item, index) =>
            item.recId?.toString() || index.toString()
          }
          contentContainerStyle={styles.LReqLP_ListContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={{flexGrow: 1}}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }>
          <Text style={styles.LReqLP_NoDataText}>No Data Found</Text>
        </ScrollView>
      )}

      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />

      <AlertDeleteModal
        visible={deleteModal}
        heading="Confirm Deletion"
        text="Are you sure you want to delete this bank account record?"
        onPress={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModal(false);
          setItemToDelete(null);
        }}
      />
    </ActionPaneContainer>
  );
};

export {BankAccountListPage};
