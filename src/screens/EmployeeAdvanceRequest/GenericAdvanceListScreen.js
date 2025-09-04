/* eslint-disable curly */
import React, {useState, useCallback} from 'react';
import {Text, FlatList} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';

import {DeleteAdvanceRequest} from '../../API/EmployeeAdvanceRequest/DeleteAdvanceRequest';
import {SubmitAdvanceRequest} from '../../API/EmployeeAdvanceRequest/SubmitAdvanceRequest';
import {FindByEmployeeAdvanceRequest} from '../../API/EmployeeAdvanceRequest/FindByEmployeeAdvanceRequest';

import AlertModal from '../../components/Alert/AlertModal';
import AlertDeleteModal from '../../components/Alert/AlertDeleteModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import DynamicRequestCard from '../../components/DynamicRequestCard';
import RequestTypeSelectionModal from '../../components/EmployeeAdvanceRequest/RequestTypeSelectionModal';
import styles from '../../styles/styles';

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

  // Enhanced parameter handling with better validation and fallbacks
  const {
    employeeId = '',
    employeeName = '',
    WorkerRecId = '',
    cameFrom = 'MainDashboard',
    highlightRecId = null,
  } = route.params || {};

  /** Fetch all advance data (both loans and advances) */
  const fetchAllAdvanceData = useCallback(async () => {
    if (!employeeId) return;
    setIsLoading(true);

    try {
      const allResults = await FindByEmployeeAdvanceRequest({employeeId});

      // Filter to show only Loan and Advance types (excluding Expense)
      const filteredResults = allResults.filter(item => {
        const type = item.AdvanceTypeCode?.toLowerCase() || '';
        return !type.includes('expense'); // filter OUT expenses
      });

      // Sort by RecId or RequestDate in descending order (latest first)
      const sortedResults = filteredResults.sort((a, b) => {
        const aRecId = parseInt(a.RecId, 10);
        const bRecId = parseInt(b.RecId, 10);

        if (!isNaN(aRecId) && !isNaN(bRecId)) {
          return bRecId - aRecId; // Descending order
        }

        const aDate = new Date(a.RequestDate || 0);
        const bDate = new Date(b.RequestDate || 0);
        return bDate - aDate; // Latest first
      });

      setAllAdvanceData(sortedResults);
    } catch (error) {
      console.error('Error fetching advance data:', error);
      setAlertMessage('Failed to fetch data.');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  /** Enhanced refresh data when screen comes into focus */
  useFocusEffect(
    useCallback(() => {
      fetchAllAdvanceData();
    }, [fetchAllAdvanceData]),
  );

  /** Enhanced highlighting with SubmitSuccess support */
  useFocusEffect(
    useCallback(() => {
      if (
        highlightRecId &&
        (cameFrom === 'CreateSuccess' ||
          cameFrom === 'UpdateSuccess' ||
          cameFrom === 'SubmitSuccess') // FIXED: Added SubmitSuccess for highlighting submitted records
      ) {
        setHighlightedRecId(highlightRecId);
        fetchAllAdvanceData();

        const timer = setTimeout(() => {
          setHighlightedRecId(null);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }, [highlightRecId, cameFrom, fetchAllAdvanceData]),
  );

  /** Enhanced back navigation with better parameter handling */
  const handleGoBack = () => {
    if (cameFrom === 'DisplayListPage') {
      navigation.navigate('DisplayListPage');
    } else if (cameFrom === 'WorkerAssignedToMe') {
      navigation.navigate('WorkerAssignedToMe');
    } else if (cameFrom === 'MainDashboard') {
      navigation.navigate('MainDashboard');
    } else {
      navigation.navigate('MainDashboard'); // Default fallback
    }
  };

  /** Enhanced refresh handler */
  const handleRefresh = () => {
    fetchAllAdvanceData();
  };

  /** Show type selection modal */
  const handleCreateRequest = () => {
    setTypeSelectionModal(true);
  };

  /** Handle type selection from modal with enhanced validation */
  const handleTypeSelection = selectedType => {
    if (!selectedType || !selectedType.type) {
      setAlertMessage('Invalid selection. Please try again.');
      setAlertModal(true);
      return;
    }

    navigation.navigate('GenericAdvanceSaveScreen', {
      mode: 'create',
      employeeId,
      employeeName,
      WorkerRecId,
      cameFrom: 'GenericAdvanceListScreen',
      requestType: selectedType.type,
      advanceType: selectedType.advanceType,
      screenName: selectedType.title,
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

  /** Enhanced request type detection */
  const getRequestTypeFromData = itemData => {
    if (!itemData || !itemData.AdvanceTypeCode) {
      return {
        type: 'Loan',
        advanceType: 0,
        screenName: 'Loan Request',
      };
    }

    const advanceTypeCode = itemData.AdvanceTypeCode.toLowerCase();

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

    // Default fallback
    return {
      type: 'Loan',
      advanceType: 0,
      screenName: 'Loan Request',
    };
  };

  /** Enhanced status label mapper */
  const getStatusLabel = status => {
    if (!status) return 'Draft';

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

  /** Card configuration */
  const cardConfig = {
    headerConfig: {
      title: {key: 'AdvanceTypeCode'},
      subtitle: {key: 'employeeName'},
    },
    fields: [
      {key: 'AdvanceAmount', label: 'Amount', type: 'currency'},
      {key: 'RequestedPaymentDate', label: 'Payment Date', type: 'date'},
      {key: 'RecoveryStartDate', label: 'Recovery Start Date', type: 'text'},
      {key: 'WFStatus', label: '', type: 'status'},
    ],
    expandableFields: [
      {key: 'AdvanceRequestId', label: 'Request Id', type: 'text'},
      {key: 'RequestDate', label: 'Request Date', type: 'date'},
      {
        key: 'RequestedInstallmentAmount',
        label: 'Recovery Amount',
        type: 'text',
      },
      {key: 'RequestedInstallments', label: 'Recoveries', type: 'text'},
    ],
  };

  /** Enhanced button configuration */
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

  /** Enhanced processing state management */
  const setButtonProcessing = (recId, buttonType, isProcessing) => {
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: isProcessing
        ? [...(prev[recId] || []), buttonType]
        : (prev[recId] || []).filter(btn => btn !== buttonType),
    }));
  };

  /** Enhanced button handlers */
  const handleButtonPress = (buttonType, itemData) => {
    if (!itemData) {
      setAlertMessage('Invalid item data. Please refresh and try again.');
      setAlertModal(true);
      return;
    }

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

  const formatDate = date => {
    if (!date) return '';
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear(); // always 4 digits
    return `${month}/${day}/${year}`;
  };

  const formatToISOWithTime = date => {
    if (!date) return '';
    const baseDate = new Date(date);
    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, '0');
    const day = String(baseDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T12:00:00`;
  };

  const formatNumberForDisplay = value => {
    if (value === null || value === undefined) return '0';

    const num = Number(value.toString().replace(/,/g, '')); // clean commas if already present
    if (isNaN(num)) return '0';

    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  /** Enhanced edit handler */
  const handleEditPress = itemData => {
    const requestTypeInfo = getRequestTypeFromData(itemData);

    navigation.navigate('GenericAdvanceSaveScreen', {
      mode: 'edit',
      employeeId: itemData.employeeId || employeeId,
      employeeName: itemData.employeeName || employeeName,
      WorkerRecId: itemData.WorkerRecId || WorkerRecId,
      cameFrom: 'GenericAdvanceListScreen',
      requestType: requestTypeInfo.type,
      advanceType: requestTypeInfo.advanceType,
      screenName: requestTypeInfo.screenName,
      advanceData: {
        RecId: itemData.RecId,
        employeeId: itemData.employeeId || employeeId,
        employeeName: itemData.employeeName || employeeName,
        WorkerRecId: itemData.WorkerRecId || WorkerRecId,
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

  /** Enhanced delete confirmation with better error handling */
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setButtonProcessing(itemToDelete.RecId, 'delete', true);

    try {
      console.log('Delete Advance Request response', itemToDelete.RecId);
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
      console.log('Delete Advance Request error:', error);
      setAlertMessage(
        `Failed to Delete ${itemToDelete.AdvanceTypeCode} Request.`,
      );
    } finally {
      setButtonProcessing(itemToDelete.RecId, 'delete', false);
      setDeleteModal(false);
      setItemToDelete(null);
      setAlertModal(true);
      setTimeout(() => {
        fetchAllAdvanceData();
      }, 1000);
    }
  };

  /** FIXED: Enhanced submit handler with highlighting support */
  const handleSubmitPress = async itemData => {
    setButtonProcessing(itemData.RecId, 'submit', true);

    try {
      console.log('Submit Advance Request:', itemData.RecId);
      const response = await SubmitAdvanceRequest({recId: itemData.RecId});
      const resObj = Array.isArray(response) ? response[0] : response;

      if (resObj && String(resObj.IsSuccess).toLowerCase() === 'true') {
        setAlertMessage(
          `${itemData.AdvanceTypeCode} Request Submitted Successfully.`,
        );
        setAlertModal(true);

        // FIXED: Set highlighting for submitted record
        setHighlightedRecId(itemData.RecId);

        // Set a timer to remove highlighting after 3 seconds
        setTimeout(() => {
          setHighlightedRecId(null);
        }, 3000);

        setTimeout(() => {
          fetchAllAdvanceData();
        }, 1000);
      } else {
        const errorMessage =
          resObj && resObj.Message
            ? resObj.Message
            : `Failed to Submit ${itemData.AdvanceTypeCode} Request`;
        setAlertMessage(errorMessage);
        setAlertModal(true);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setAlertMessage(`Failed to Submit ${itemData.AdvanceTypeCode} Request`);
      setAlertModal(true);
    } finally {
      setButtonProcessing(itemData.RecId, 'submit', false);
    }
  };

  /** Enhanced render card with better data validation and comma formatting */
  const renderAdvanceCard = ({item}) => {
    if (!item) return null;

    const isHighlighted = highlightedRecId === item.RecId;
    const itemProcessingButtons = processingButtons[item.RecId] || [];
    const requestTypeInfo = getRequestTypeFromData(item);

    const processedItem = {
      ...item,
      WFStatus: getStatusLabel(item.WFStatus),
      AdvanceAmount: formatNumberForDisplay(item.AdvanceAmount || '0.00'),
      RequestedInstallmentAmount: formatNumberForDisplay(
        item.RequestedInstallmentAmount || '0.00',
      ),
      RequestedPaymentDate: formatDate(item.RequestedPaymentDate),
      RequestDate: formatDate(item.RequestDate),
      RecoveryStartDate: formatDate(item.RecoveryStartDate),
      employeeId: item.employeeId || employeeId,
      employeeName: item.employeeName || employeeName,
      WorkerRecId: item.WorkerRecId || WorkerRecId,
      AdvanceRequestId:
        item.AdvanceRequestId ||
        `${requestTypeInfo.type.toUpperCase()}-${item.RecId}`,
      RequestType: requestTypeInfo.type,
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
      showFooter
      showFloatingButton
      isHeaderActive
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
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

      {/* Alert Modal */}
      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />

      {/* Delete Confirmation Modal */}
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
