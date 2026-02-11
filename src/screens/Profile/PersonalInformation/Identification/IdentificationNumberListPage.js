/* eslint-disable react-native/no-inline-styles */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
import React, {useState, useCallback} from 'react';
import {Text, FlatList, BackHandler, RefreshControl} from 'react-native';
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
import { canEnableEditButton } from '../../../../API/PersonalInformation/Identification/canEnableEditButton';

import IdentificationRequestCard from '../../../../components/IdentificationRequestCard';
import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';
import AlertDeleteModal from '../../../../components/Alert/AlertDeleteModal';
import ActionPaneContainer from '../../../../components/ActionPaneContainer';
import AlertModal from '../../../../components/Alert/AlertModal';
import styles from '../../../../styles/styles';
import DynamicRequestCard from '../../../../components/DynamicRequestCard';
import {ScrollView} from 'react-native-gesture-handler';
import { itemModifiedforPurchaseRequisitionLines } from '../../../../API/PurchaseRequisitionLines/PurchaseRequisitionLinesItemModified';

const IdentificationNumberListPage = () => {
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
  const [highlightedRecId, setHighlightedRecId] = useState(null);
  const [processingButtons, setProcessingButtons] = useState({});

  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editEnabled, setEditEnabled] = useState(true);
  // Fetch Identification Data
  const fetchIdentifications = useCallback(async () => {
    if (!effectiveEmployeeId) return;

    setIsLoading(true);
    try {
      const data = await IdentificationFindRequest({
        employeeId: effectiveEmployeeId,
      });
      // ✅ Sort newest record on top
      data.sort(
        (a, b) =>
          new Date(b.CreatedDateTime).getTime() -
          new Date(a.CreatedDateTime).getTime(),
      );

     const dataWithPermissions = await Promise.all(
        data.map(async item => {
          let canEdit = false;
          try {
            canEdit = await canEnableEditButton(item.RecId, item.PersonIdentificationNumberRecVersion);
          } catch {
            canEdit = false;
          }
          return {...item, canEdit};
        })
      );

      setIdentificationsData(dataWithPermissions);
   
    } catch (error) {
      console.error('Failed to fetch identification data:', error);
      setAlertMessage('Failed to fetch identification data.');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveEmployeeId]);

 





  // const checkEditButton = async (recId, recVersion) => {
  //   try {
  //     const enabled = await canEnableEditButton(recId, recVersion);
  //     setEditButtonEnabledMap(prev => ({
  //       ...prev,
  //       [recId]: enabled,
  //     }));
  //   } catch (error) {
  //     console.error('Failed to check Edit permission:', error);
  //     setEditButtonEnabledMap(prev => ({
  //       ...prev,
  //       [recId]: false, // disable on error
  //     }));
  //   }
  // };

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

  // Handle highlighting of records
  useFocusEffect(
    useCallback(() => {
      if (highlightRecId) {
        setHighlightedRecId(highlightRecId);
        fetchIdentifications();

        const timer = setTimeout(() => {
          setHighlightedRecId(null);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }, [highlightRecId, fetchIdentifications]),
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
  const handleGoBack = () => {
    navigation.navigate('DisplayPersonalInfo');
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
      {
        key: 'IssuedDate',
        label: identificationsData[0]?.IssuedDatelbl || 'Issued Date',
        type: 'date',
      },
      {
        key: 'ExpirationDate',
        label: identificationsData[0]?.ExpirationDatelbl || 'Expiration Date',
        type: 'date',
      },
      //   {key: 'IssuingCountry', label: 'Issuing Agency', type: 'text'},
      {key: 'ApprovalStatus', label: '', type: 'status'},
    ],
    expandableFields: [],
  };
  const getStatusLabel = status => {
    if (!status) return '';
    const normalizedStatus = status.replace(/\s+/g, '').toLowerCase(); // remove spaces & lowercase

    const statusMap = {
      draft: 'Draft',
      inreview: 'In review',
      approved: 'Approved Waiting',
      waiting: 'Waiting',
      cancelled: 'Canceled',
      canceled: 'Cancelled',
      rejected: 'Rejected',
      processing: 'Processing action',
      workflowcomplete: 'WorkFlow Complete',
      failed: 'Failed',
      completed: 'Completed',
      error: 'Error',
      denied: 'Denied',
      changerequested: 'Change Requested',
      taskinreview: 'Task In Review',
      taskcompleted: 'Task Completed',
      noworkflow: '',
    };

    return statusMap[normalizedStatus] ?? '';
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
        setHighlightedRecId(itemData.recId);

        setTimeout(() => {
          setHighlightedRecId(null);
        }, 3000);

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

  const getButtonConfig = item => {
    console.log("Item Data: ",item);
    const isDraft = getStatusLabel(item.ApprovalStatus) === 'Draft';
    const isHCMRecord = getStatusLabel(item.ApprovalStatus) === '';
   // const apiEditEnabled = canEnableEditButton(item.RecId, item.PersonIdentificationNumberRecVersion);
    // console.log("Item Number : ", item.ApprovalStatus);
    // console.log("apiEditEnabled : ", apiEditEnabled);
    // console.log(
    //   item.ApprovalStatus +
    //     ' ' +
    //     getStatusLabel(item.ApprovalStatus) +
    //     ' ' +
    //     isHCMRecord,
    // );
    const isCancelled = getStatusLabel(item.ApprovalStatus) === 'Cancelled';
    return {
      edit: {
        show: workflowEnabled,
        position: 'header',
        style: 'icon',
        icon: 'edit',
        iconSize: 20,
        iconColor: '#fff',
        backgroundColor: '#0A66C2',
        disabled: isHCMRecord ? !item.canEdit : !isDraft,
          customStyle: !item.canEdit ? {backgroundColor: '#BDBDBD'} : {},
      },
      delete: {
        show: workflowEnabled,
        position: 'header',
        style: 'icon',
        icon: 'trash',
        iconSize: 20,
        iconColor: '#fff',
        backgroundColor: '#0A66C2',
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
        textColor: '#0A66C2',
        iconColor: '#0A66C2',
        customStyle: {
          transform: [{translateY: -30}],
        },
      },
    };
  };

  // Render identification card
  const renderIdentificationCard = ({item}) => {
    // const isHighlighted = highlightedRecId === item.recId;
    const isHighlighted = highlightedRecId === item.RecId;
    const itemProcessingButtons = processingButtons[item.recId] || [];

    const processedItem = {
      ...item,
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
      pageTitle="My Identification Numebrs"
      isBackButton={false}
      showFooter={true}
      showFloatingButton={workflowEnabled}
      isHeaderActive={true}
      onRefresh={fetchIdentifications}
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
          <Text style={styles.noDataText}>No Data Found</Text>
        </ScrollView>
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
