/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
import React, {useState, useCallback} from 'react';
import {Text, FlatList, BackHandler} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';

import {SubmitIdentificationRequest} from '../../../../API/PersonalInformation/Identification/SubmitIdentificationRequest';
import {isWorkflowConfigured} from '../../../../API/PersonalInformation/Identification/IsIdentificationWorkflowEnabled';
import {IdentificationFindRequest} from '../../../../API/PersonalInformation/Identification/IdentificationFindRequest';
import {DeleteIdentityRequest} from '../../../../API/PersonalInformation/Identification/DeleteIdentityRequest';

import IdentificationRequestCard from '../../../../components/IdentificationRequestCard';
import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';
import AlertDeleteModal from '../../../../components/Alert/AlertDeleteModal';
import ActionPaneContainer from '../../../../components/ActionPaneContainer';
import AlertModal from '../../../../components/Alert/AlertModal';
import styles from '../../../../styles/styles';

const IdentificationNumberListPage = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    employeeId,
    employeeName,
    WorkerRecId,
    cameFrom,
    userData: routeUserData,
  } = route.params || {};

  const reduxUserData = useSelector(state => state.user.userData);
  const effectiveUserData = routeUserData || reduxUserData;

  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
  const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;
  const effectiveWorkerRecId = WorkerRecId || effectiveUserData?.WorkerRecId;

  const [isLoading, setIsLoading] = useState(false);
  const [identificationsData, setIdentificationsData] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [workflowEnabled, setWorkflowEnabled] = useState(false);
  const [processingButtons, setProcessingButtons] = useState({});

  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  // Fetch Identification Data
  const fetchIdentifications = useCallback(async () => {
    if (!effectiveEmployeeId) return;

    setIsLoading(true);
    try {
      const data = await IdentificationFindRequest({
        employeeId: effectiveEmployeeId,
      });
      setIdentificationsData(data);
    } catch (error) {
      console.error('Failed to fetch identification data:', error);
      setAlertMessage('Failed to fetch identification data.');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveEmployeeId]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchIdentifications();
    }, [fetchIdentifications]),
  );

  useFocusEffect(
    useCallback(() => {
      const checkWorkflow = async () => {
        const configured = await isWorkflowConfigured();
        setWorkflowEnabled(configured);
      };
      checkWorkflow();
    }, []),
  );

  // Handle hardware back button
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

  // Navigation handling
  const handleGoBack = () => {
    let targetRoute = 'MainDashboard';

    switch (cameFrom) {
      case 'MainDashboard':
      case 'DrawerNavigator':
        targetRoute = 'MainDashboard';
        break;
      case 'DisplayListPage':
        targetRoute = 'DisplayListPage';
        break;
      default:
        navigation.goBack();
        return;
    }

    navigation.reset({
      index: 0,
      routes: [{name: 'TabNavigator', params: {screen: targetRoute}}],
    });
  };

  // Refresh handler
  const handleRefresh = () => {
    fetchIdentifications();
  };

  // Card Configuration
  const cardConfig = {
    headerConfig: {
      title: {key: 'IdentificationTypeId'},
      subtitle: {key: 'IdentificationNumber'},
    },
    fields: [
      {key: 'IssuedDate', label: 'Issued Date', type: 'date'},
      {key: 'ExpirationDate', label: 'Expiration Date', type: 'date'},
      //   {key: 'IssuingCountry', label: 'Issuing Agency', type: 'text'},
      {key: 'ApprovalStatus', label: '', type: 'status'},
    ],
    expandableFields: [],
  };
  const getStatusLabel = status => {
    const statusMap = {
      Draft: 'Draft',
      InReview: 'In Review',
      Approved: 'Approved Waiting',
      Waiting: 'Waiting',
      Canceled: 'Cancelled',
      Rejected: 'Rejected',
      Processing: 'Processing action',
      WorkFlowComplete: 'WorkFlow Complete',
      Failed: 'Failed',
      Completed: 'Completed',
      Error: 'Error',
      Denied: 'Denied',
      ChangeRequested: 'Change Requested',
      TaskInReview: 'Task In Review',
      TaskCompleted: 'Task Completed',
      NoWorkflow: '',
    };
    return statusMap[status] || '';
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
    navigation.navigate('IdentificationNumberSaveRecord', {
      mode: 'edit',
      employeeId: itemData.employeeId || employeeId,
      employeeName: itemData.employeeName || employeeName,
      WorkerRecId: itemData.WorkerRecId || WorkerRecId,
      userData: route.params?.userData || {
        employeeId,
        employeeName,
        WorkerRecId,
      }, // Ensure userData is passed
      cameFrom: 'IdentificationListPage',
      originalCameFrom: cameFrom,
      identityData: {
        recId: itemData.RecId,
        employeeId: itemData.employeeId || employeeId,
        employeeName: itemData.employeeName || employeeName,
        WorkerRecId: itemData.WorkerRecId || WorkerRecId,
        IdentificationNumber: itemData.IdentificationNumber,
        IdentificationType: itemData.IdentificationType,
        IdentificationTypeId: itemData.IdentificationTypeId,
        Description: itemData.Description,
        IsPrimary: itemData.IsPrimary,
        ExpirationDate: itemData.ExpirationDate,
        IssueDate: itemData.IssuedDate,
        IssuingAgency: itemData.IssuingAgency,
        IssuingAgencyId: itemData.IssuingAgencyId,
        WorkflowOperation: itemData.WorkflowOperation,
      },
    });
  };

  const handleDeletePress = itemData => {
    setItemToDelete(itemData);
    setDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setButtonProcessing(itemToDelete.RecId, 'delete', true);

    try {
      const response = await DeleteIdentityRequest({
        recordsRecId: [itemToDelete.RecId],
      });

      if (response[0].IsSuccess) {
        setAlertMessage('Identification Request Deleted Successfully.');
        setIdentificationsData(prev =>
          prev.filter(
            identification => identification.recId !== itemToDelete.recId,
          ),
        );
      } else {
        setAlertMessage('Unable to Delete Identification Request.');
      }
    } catch (error) {
      setAlertMessage('Failed to Delete Identification Request');
      console.log('Delete Identification Request response', error);
    } finally {
      setButtonProcessing(itemToDelete.recId, 'delete', false);
      setDeleteModal(false);
      setItemToDelete(null);
      setAlertModal(true);
      setTimeout(() => {
        fetchIdentifications();
      }, 1000);
    }
  };

  const handleSubmitPress = async itemData => {
    setButtonProcessing(itemData.RecId, 'submit', true);

    try {
      // Call the Submit API
      const response = await SubmitIdentificationRequest({
        recId: itemData.RecId,
      });

      if (
        response &&
        (Array.isArray(response) ? response[0] : response) &&
        String(
          (Array.isArray(response) ? response[0] : response).IsSuccess,
        ).toLowerCase() === 'true'
      ) {
        setAlertMessage(
          `${itemData.IdentificationTypeId} is Submitted Successfully.`,
        );
        setAlertModal(true);

        setTimeout(() => {
          fetchIdentifications();
        }, 1000);
      } else {
        const resObj = Array.isArray(response) ? response[0] : response;
        const errorMessage =
          resObj && resObj.Message
            ? resObj.Message
            : 'Failed to Submit Identification Request';
        setAlertMessage(errorMessage);
        setAlertModal(true);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setAlertMessage('Failed to Submit Identification Request');
      setAlertModal(true);
    } finally {
      setButtonProcessing(itemData.recId, 'submit', false);
    }
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
  // Define button configuration
  const getButtonConfig = item => {
    const isDraft = getStatusLabel(item.ApprovalStatus) === 'Draft';
    const isCancelled = getStatusLabel(item.ApprovalStatus) === 'Cancelled';
    return {
      edit: {
        show: workflowEnabled,
        position: 'header',
        style: 'icon',
        icon: 'edit',
        iconSize: 20,
        iconColor: '#fff',
        disabled: !isDraft,
        customStyle: false ? {backgroundColor: '#BDBDBD'} : {},
      },
      delete: {
        show: workflowEnabled,
        position: 'header',
        style: 'icon',
        icon: 'trash',
        iconSize: 20,
        iconColor: '#fff',
        disabled: !(isDraft || isCancelled),
        customStyle: !(isDraft || isCancelled)
          ? {backgroundColor: '#BDBDBD'}
          : {},
      },
      submit: {
        show: isDraft,
        position: 'bottom',
        style: 'text',
        icon: 'send',
        iconSize: 16,
        text: 'Submit',
        textColor: '#fff',
        iconColor: '#fff',
      },
    };
  };

  // Render identification card
  const renderIdentificationCard = ({item}) => {
    const itemProcessingButtons = processingButtons[item.recId] || [];
    return (
      <IdentificationRequestCard
        data={item}
        headerConfig={cardConfig.headerConfig}
        fields={cardConfig.fields}
        expandableFields={cardConfig.expandableFields}
        buttons={getButtonConfig(item)}
        onButtonPress={handleButtonPress}
        isExpandable={false}
        gradientColors={['#6ee0ff', '#bddeff', '#cce6ff']}
        processingButtons={itemProcessingButtons}
      />
    );
  };

  // Handle create leave
  const handleCreateRequest = () => {
    navigation.navigate('IdentificationNumberSaveRecord', {
      mode: 'create',
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: effectiveUserData,
      cameFrom: 'IdentificationListPage',
      originalCameFrom: cameFrom,
      identityData: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
        recId: '',
        IdentificationNumber: '',
        IdentificationType: '',
        IdentificationTypeId: '',
        Description: '',
        IsPrimary: '',
        ExpirationDate: '',
        IssueDate: '',
        IssuingAgency: '',
        IssuingAgencyId: '',
        WorkflowOperation: '',
      },
    });
  };

  return (
    <ActionPaneContainer
      pageTitle="Employee Identifications"
      isBackButton={false}
      showFooter={true}
      showFloatingButton={workflowEnabled}
      isHeaderActive={true}
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={handleCreateRequest}>
      {isLoading ? (
        <CustomIndicator />
      ) : identificationsData.length > 0 ? (
        <FlatList
          data={identificationsData}
          renderItem={renderIdentificationCard}
          keyExtractor={(item, index) =>
            item.RecId?.toString() || index.toString()
          }
          contentContainerStyle={styles.LReqLP_ListContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <Text style={styles.LReqLP_NoDataText}>No Data Found</Text>
      )}
      {/* Delete Confirmation Modal */}
      <AlertDeleteModal
        visible={deleteModal}
        heading="Confirm Deletion"
        text="Are you sure you want to delete this request?"
        onPress={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModal(false);
          setItemToDelete(null);
        }}
      />
      {/* Alert Modal */}
      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
    </ActionPaneContainer>
  );
};

export default IdentificationNumberListPage;
