/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
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

import {
  fetchAdvances,
  retrieveAdvanceTypeCode,
} from '../../Controller/advanceRequestApiService';
import {DeleteAdvanceRequest} from '../../API/EmployeeAdvanceRequest/DeleteAdvanceRequest';
import {SubmitAdvanceRequest} from '../../API/EmployeeAdvanceRequest/SubmitAdvanceRequest';
import styles from '../../styles/styles';

const GenericAdvanceScreen = ({advanceType, screenName}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [advanceData, setAdvanceData] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [highlightedRecId, setHighlightedRecId] = useState(null);
  const [processingButtons, setProcessingButtons] = useState({});
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const navigation = useNavigation();
  const route = useRoute();
  const {employeeId, employeeName, WorkerRecId, cameFrom, highlightRecId} =
    route.params || {};

  /** Fetch advance data */
  const fetchAdvanceData = useCallback(async () => {
    if (!employeeId) return;
    setIsLoading(true);

    try {
      const advanceResults = await fetchAdvances(employeeId);

      const advanceTypeRequest = await retrieveAdvanceTypeCode();
      console.log('advance Type code Request: ', advanceTypeRequest);

      setAdvanceData(advanceResults);
    } catch (error) {
      setAlertMessage('Failed to fetch data.');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, advanceType]);

  /** Refresh data when screen comes into focus */
  useFocusEffect(
    useCallback(() => {
      fetchAdvanceData();
    }, [fetchAdvanceData]),
  );

  /** Highlight record after create/update */
  useFocusEffect(
    useCallback(() => {
      if (
        highlightRecId &&
        (cameFrom === 'CreateSuccess' || cameFrom === 'UpdateSuccess')
      ) {
        setHighlightedRecId(highlightRecId);
        fetchAdvanceData();

        const timer = setTimeout(() => setHighlightedRecId(null), 3000);
        return () => clearTimeout(timer);
      }
    }, [highlightRecId, cameFrom, fetchAdvanceData]),
  );

  /** Back navigation */
  const handleGoBack = () => {
    if (cameFrom === 'MainDashboard') navigation.navigate('MainDashboard');
    else navigation.navigate('DisplayListPage');
  };

  /** Create advance */
  const handleCreateAdvance = () => {
    navigation.navigate('GenericAdvanceSaveScreen', {
      mode: 'create',
      employeeId,
      employeeName,
      WorkerRecId,
      cameFrom: `${screenName}ListPage`,
      advanceType,
      screenName,
      advanceData: {
        employeeId,
        employeeName,
        WorkerRecId,
        RecId: '',
        AdvanceTypeCode: '',
        AdvanceAmount: '0.00',
        RequestedPaymentDate: '',
        RecoveryStartDate: '',
        RequestedInstallmentAmount: '0.00',
        RequestedInstallments: '0',
        AdvanceDescription: '',
      },
    });
  };

  /** Status label mapper */
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

  const formatDate = dateString =>
    dateString ? new Date(dateString).toLocaleDateString() : '';

  /** Card configuration */
  const cardConfig = {
    headerConfig: {
      title: {key: 'AdvanceTypeCode'},
      subtitle: {key: 'employeeName'},
    },
    fields: [
      {key: 'AdvanceAmount', label: 'Amount', type: 'currency'},
      {key: 'RequestedPaymentDate', label: 'Payment Date', type: 'date'},
      {key: 'RequestDate', label: 'Request Date', type: 'date'},
      {key: 'WFStatus', label: '', type: 'status'},
    ],
    expandableFields: [
      {key: 'AdvanceRequestId', label: 'Advance Request Id', type: 'text'},
      {key: 'RecoveryStartDate', label: 'Recovery Start Date', type: 'text'},
      {
        key: 'RequestedInstallmentAmount',
        label: 'Installment Amount',
        type: 'text',
      },
      {key: 'RequestedInstallments', label: 'Installments', type: 'text'},
      {key: 'AdvanceDescription', label: 'Description', type: 'text'},
      {key: 'Currency', label: 'Currency', type: 'text'},
      {key: 'Guarantor1', label: 'Guarantor 1', type: 'text'},
      {key: 'Guarantor2', label: 'Guarantor 2', type: 'text'},
    ],
  };

  /** Button configuration */
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

  /** Track button processing state */
  const setButtonProcessing = (recId, buttonType, isProcessing) => {
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: isProcessing
        ? [...(prev[recId] || []), buttonType]
        : (prev[recId] || []).filter(btn => btn !== buttonType),
    }));
  };

  /** Button handlers */
  const handleButtonPress = (buttonType, itemData) => {
    if (buttonType === 'edit') handleEditPress(itemData);
    if (buttonType === 'delete') handleDeletePress(itemData);
    if (buttonType === 'submit') handleSubmitPress(itemData);
  };

  const handleEditPress = itemData => {
    navigation.navigate('GenericAdvanceSaveScreen', {
      mode: 'edit',
      employeeId: itemData.EmployeeId || employeeId,
      employeeName: itemData.employeeName || employeeName,
      cameFrom: `${screenName}ListPage`,
      advanceType,
      screenName,
      advanceData: {
        RecId: itemData.RecId,
        employeeId: itemData.EmployeeId || employeeId,
        employeeName: itemData.employeeName || employeeName,
        AdvanceTypeCode: itemData.AdvanceTypeCode,
        AdvanceAmount: itemData.AdvanceAmount,
        RequestedPaymentDate: itemData.RequestedPaymentDate,
        RecoveryStartDate: itemData.RecoveryStartDate,
        RequestedInstallmentAmount: itemData.RequestedInstallmentAmount,
        RequestedInstallments: itemData.RequestedInstallments,
        AdvanceDescription: itemData.AdvanceDescription,
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
      const response = await DeleteAdvanceRequest({
        recordsRecId: [itemToDelete.RecId],
      });

      // Find the record related to the current RecId
      const recordResult = response.find(
        r => String(r.RecId) === String(itemToDelete.RecId),
      );

      if (recordResult && recordResult.IsSuccess === 'true') {
        setAlertMessage(
          `${itemToDelete.AdvanceTypeCode} Request Deleted Successfully.`,
        );
        setAdvanceData(prev =>
          prev.filter(adv => adv.RecId !== itemToDelete.RecId),
        );
      } else {
        // If failed, show the actual API message
        setAlertMessage(
          recordResult?.Message ||
            `Unable to Delete ${itemToDelete.AdvanceTypeCode} Request.`,
        );
      }
    } catch (error) {
      setAlertMessage(
        `Failed to Delete ${itemToDelete.AdvanceTypeCode} Request.`,
      );
    } finally {
      setButtonProcessing(itemToDelete.RecId, 'delete', false);
      setDeleteModal(false);
      setItemToDelete(null);
      setAlertModal(true);
      setTimeout(() => fetchAdvanceData(), 1000);
    }
  };

  const handleSubmitPress = async itemData => {
    setButtonProcessing(itemData.RecId, 'submit', true);
    try {
      const response = await SubmitAdvanceRequest({recId: itemData.RecId});
      const resObj = Array.isArray(response) ? response[0] : response;

      if (resObj?.IsSuccess?.toString().toLowerCase() === 'true') {
        setAlertMessage(
          `${itemData.AdvanceTypeCode} Request Submitted Successfully.`,
        );
      } else {
        setAlertMessage(
          resObj?.Message ||
            `Failed to Submit ${itemData.AdvanceTypeCode} Request`,
        );
      }
      setAlertModal(true);
      setTimeout(() => fetchAdvanceData(), 1000);
    } catch (error) {
      setAlertMessage(`Failed to Submit ${itemData.AdvanceTypeCode} Request`);
      setAlertModal(true);
    } finally {
      setButtonProcessing(itemData.RecId, 'submit', false);
    }
  };

  /** Render card */
  const renderAdvanceCard = ({item}) => {
    const isHighlighted = highlightedRecId === item.RecId;
    const itemProcessingButtons = processingButtons[item.RecId] || [];

    const processedItem = {
      ...item,
      WFStatus: getStatusLabel(item.WFStatus),
      AdvanceAmount: item.AdvanceAmount,
      RequestedInstallmentAmount: item.RequestedInstallmentAmount,
      RequestedPaymentDate: formatDate(item.RequestedPaymentDate),
      RequestDate: formatDate(item.RequestDate),
      RecoveryStartDate: formatDate(item.RecoveryStartDate),
      employeeId: item.EmployeeId || employeeId,
      employeeName: item.employeeName || employeeName,
      AdvanceRequestId:
        item.AdvanceRequestId || `${screenName.toUpperCase()}-${item.RecId}`,
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
      pageTitle={screenName}
      isBackButton={false}
      showFooter
      showFloatingButton
      isHeaderActive
      onBackPress={handleGoBack}
      onRefresh={fetchAdvanceData}
      onFloatingButtonPress={handleCreateAdvance}>
      {isLoading ? (
        <CustomIndicator />
      ) : advanceData.length > 0 ? (
        <FlatList
          data={advanceData}
          renderItem={renderAdvanceCard}
          keyExtractor={(item, index) =>
            item.RecId?.toString() || index.toString()
          }
          contentContainerStyle={styles.LReqLP_ListContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <Text style={styles.LReqLP_NoDataText}>No Data Found</Text>
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
        text={`Are you sure you want to delete this ${
          itemToDelete?.AdvanceTypeCode || ''
        } request?`}
        onPress={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModal(false);
          setItemToDelete(null);
        }}
      />
    </ActionPaneContainer>
  );
};

export default GenericAdvanceScreen;
