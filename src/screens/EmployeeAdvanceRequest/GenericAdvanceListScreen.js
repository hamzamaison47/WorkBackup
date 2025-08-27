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
import RequestTypeSelectionModal from '../../components/EmployeeAdvanceRequest/RequestTypeSelectionModal';

import {DeleteAdvanceRequest} from '../../API/EmployeeAdvanceRequest/DeleteAdvanceRequest';
import {SubmitAdvanceRequest} from '../../API/EmployeeAdvanceRequest/SubmitAdvanceRequest';
import styles from '../../styles/styles';
import {FindByEmployeeAdvanceRequest} from '../../API/EmployeeAdvanceRequest/FindByEmployeeAdvanceRequest';

const GenericAdvanceListScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [allAdvanceData, setAllAdvanceData] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [highlightedRecId, setHighlightedRecId] = useState(null);
  const [processingButtons, setProcessingButtons] = useState({});
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [typeSelectionModal, setTypeSelectionModal] = useState(false);

  const navigation = useNavigation();
  const route = useRoute();
  const {employeeId, employeeName, WorkerRecId, cameFrom, highlightRecId} =
    route.params || {};

  /** Fetch all advance data (both loans and advances) */
  const fetchAllAdvanceData = useCallback(async () => {
    if (!employeeId) return;
    setIsLoading(true);

    try {
      // Fetch all advance records
      // const allResults = await fetchAdvances(employeeId);
      const allResults = await FindByEmployeeAdvanceRequest({employeeId});

      // Filter to show only Loan and Advance types (excluding Expense)
      const filteredResults = allResults.filter(item => {
        const type = item.AdvanceTypeCode?.toLowerCase() || '';
        return !type.includes('expense'); // filter OUT expenses
      });

      // Sort by RecId or RequestDate in descending order (latest first)
      const sortedResults = filteredResults.sort((a, b) => {
        // First try to sort by RecId (if it's numeric)
        const aRecId = parseInt(a.RecId, 10);
        const bRecId = parseInt(b.RecId, 10);

        if (!isNaN(aRecId) && !isNaN(bRecId)) {
          return bRecId - aRecId; // Descending order
        }

        // Fallback to sorting by RequestDate
        const aDate = new Date(a.RequestDate || 0);
        const bDate = new Date(b.RequestDate || 0);
        return bDate - aDate; // Latest first
      });

      setAllAdvanceData(sortedResults);
    } catch (error) {
      setAlertMessage('Failed to fetch data.');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  /** Refresh data when screen comes into focus */
  useFocusEffect(
    useCallback(() => {
      fetchAllAdvanceData();
    }, [fetchAllAdvanceData]),
  );

  /** Highlight record after create/update */
  useFocusEffect(
    useCallback(() => {
      if (
        highlightRecId &&
        (cameFrom === 'CreateSuccess' || cameFrom === 'UpdateSuccess')
      ) {
        setHighlightedRecId(highlightRecId);
        fetchAllAdvanceData();

        const timer = setTimeout(() => setHighlightedRecId(null), 3000);
        return () => clearTimeout(timer);
      }
    }, [highlightRecId, cameFrom, fetchAllAdvanceData]),
  );

  /** Back navigation */
  const handleGoBack = () => {
    if (cameFrom === 'MainDashboard') navigation.navigate('MainDashboard');
    else navigation.goBack();
  };

  /** Show type selection modal */
  const handleCreateRequest = () => {
    setTypeSelectionModal(true);
  };

  /** Handle type selection from modal */
  const handleTypeSelection = selectedType => {
    navigation.navigate('GenericAdvanceSaveScreen', {
      mode: 'create',
      employeeId,
      employeeName,
      WorkerRecId,
      cameFrom: 'GenericAdvanceListScreen',
      requestType: selectedType.type, // 'Loan', 'Advance', or 'Expense'
      advanceType: selectedType.advanceType, // 0, 1, or 2
      screenName: selectedType.title, // 'Loan Request', 'Advance Salary', etc.
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

  /** Determine request type from data */
  const getRequestTypeFromData = itemData => {
    // Based on your API response, determine the type
    // This is a mapping function that should match your API data structure
    const advanceTypeCode = itemData.AdvanceTypeCode?.toLowerCase() || '';

    if (
      advanceTypeCode.includes('loan') ||
      advanceTypeCode.includes('company loan')
    ) {
      return {
        type: 'Loan',
        advanceType: 0,
        screenName: 'Loan Request',
      };
    } else if (
      advanceTypeCode.includes('advance') ||
      advanceTypeCode.includes('salary')
    ) {
      return {
        type: 'Advance',
        advanceType: 1,
        screenName: 'Advance Salary',
      };
    }
    // else if (advanceTypeCode.includes('expense')) {
    //   return {
    //     type: 'Expense',
    //     advanceType: 2,
    //     screenName: 'Expense Request',
    //   };
    // }

    // Default fallback
    return {
      type: 'Loan',
      advanceType: 0,
      screenName: 'Loan Request',
    };
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
      {key: 'AdvanceRequestId', label: 'Request Id', type: 'text'},
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
      {key: 'RequestType', label: 'Type', type: 'text'}, // Added to show type
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

  const formatToISOWithTime = date => {
    if (!date) return '';
    const baseDate = new Date(date);
    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, '0');
    const day = String(baseDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T12:00:00`;
  };

  const handleEditPress = itemData => {
    // Determine the request type automatically
    const requestTypeInfo = getRequestTypeFromData(itemData);

    navigation.navigate('GenericAdvanceSaveScreen', {
      mode: 'edit',
      // employeeId: itemData.EmployeeId || employeeId,
      employeeId: employeeId,
      employeeName: itemData.employeeName || employeeName,
      cameFrom: 'GenericAdvanceListScreen',
      requestType: requestTypeInfo.type,
      advanceType: requestTypeInfo.advanceType,
      screenName: requestTypeInfo.screenName,
      advanceData: {
        RecId: itemData.RecId,
        // employeeId: itemData.EmployeeId || employeeId,
        employeeId: employeeId,
        employeeName: itemData.employeeName || employeeName,
        AdvanceTypeCode: itemData.AdvanceTypeCode,
        AdvanceAmount: itemData.AdvanceAmount,
        RequestedPaymentDate: formatToISOWithTime(
          itemData.RequestedPaymentDate,
        ),
        RecoveryStartDate: formatToISOWithTime(itemData.RecoveryStartDate),
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

      const recordResult = response.find(
        r => String(r.RecId) === String(itemToDelete.RecId),
      );

      if (recordResult && recordResult.IsSuccess === 'true') {
        setAlertMessage(
          `${itemToDelete.AdvanceTypeCode} Request Deleted Successfully.`,
        );
        setAllAdvanceData(prev =>
          prev.filter(adv => adv.RecId !== itemToDelete.RecId),
        );
      } else {
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
      setTimeout(() => fetchAllAdvanceData(), 1000);
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
      setTimeout(() => fetchAllAdvanceData(), 1000);
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
    const requestTypeInfo = getRequestTypeFromData(item);

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
        item.AdvanceRequestId ||
        `${requestTypeInfo.type.toUpperCase()}-${item.RecId}`,
      RequestType: requestTypeInfo.type, // Add type to display
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
      pageTitle="Loan & Advance Requests"
      isBackButton={cameFrom !== 'MainDashboard'}
      showFooter
      showFloatingButton
      isHeaderActive
      onBackPress={handleGoBack}
      onRefresh={fetchAllAdvanceData}
      onFloatingButtonPress={handleCreateRequest}>
      {isLoading ? (
        <CustomIndicator />
      ) : allAdvanceData.length > 0 ? (
        <FlatList
          data={allAdvanceData}
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

      {/* Type Selection Modal */}
      <RequestTypeSelectionModal
        visible={typeSelectionModal}
        onClose={() => setTypeSelectionModal(false)}
        onSelectType={handleTypeSelection}
      />

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

export default GenericAdvanceListScreen;
