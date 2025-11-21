/* eslint-disable no-unused-vars */
/* eslint-disable curly */
import React, {useCallback, useState} from 'react';
import {
  Text,
  RefreshControl,
  ScrollView,
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useFocusEffect, useNavigation} from '@react-navigation/native';

import {GetAllExpenseReports} from '../../../API/ExpenseManagment/Headers/GetAllExpenseReports';
import {DeleteExpenseReports} from '../../../API/ExpenseManagment/Headers/DeleteExpenseReports';
import SubmitExpenseReportsToWorkflow from '../../../API/ExpenseManagment/Headers/SubmitExpenseReportsToWorkflow';

import AlertModal from '../../../components/Alert/AlertModal';
import DynamicRequestCard from '../../../components/DynamicRequestCard';
import ActionPaneContainer from '../../../components/ActionPaneContainer';
import CustomIndicator from '../../../components/CustomIndicator/CustomIndicator';
import AlertDeleteModal from '../../../components/Alert/AlertDeleteModal';

const ExpenseManagmentListPage = () => {
  // State Management
  const [isLoading, setIsLoading] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [expenseData, setExpenseData] = useState([]);
  const [processingButtons, setProcessingButtons] = useState({});
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [highlightedRecId, setHighlightedRecId] = useState(null);

  // Redux Selectors
  const navigation = useNavigation();
  const {userData} = useSelector(state => state.user);
  const {selectedLegalEntity} = useSelector(state => state.company);

  // Constants
  const CARD_CONFIG = {
    headerConfig: {
      title: {key: 'ExpenseReportNumber'},
      subtitle: {key: 'Purpose'},
    },
    fields: [
      {key: 'Location', label: 'Location', type: 'text'},
      {key: 'AmountTotal', label: 'Total Amount', type: 'currency'},
      {key: 'DocumentStatus', label: '', type: 'status'},
    ],
    expandableFields: [
      {key: 'ExpenseReportNumber', label: 'Report Number', type: 'text'},
      {key: 'PaymentDate', label: 'Payment Date', type: 'date'},
      {key: 'createdDateTime', label: 'Created Date', type: 'date'},
    ],
  };

  const STATUS_MAP = {
    Draft: 'Draft',
    Submitted: 'Submitted',
    Approved: 'Approved',
    Rejected: 'Rejected',
    Paid: 'Paid',
    Pending: 'Pending Approval',
  };

  // Helper Functions
  const cleanJsonPlaceholder = value => {
    if (!value) return '';
    const jsonPlaceholderPattern =
      /{"@_i:type":"c:string","@_xmlns:c":"http:\/\/www\.w3\.org\/2001\/XMLSchema"}/;
    if (typeof value === 'string' && jsonPlaceholderPattern.test(value)) {
      return '';
    }
    return value;
  };

  const getStatusLabel = status => {
    return STATUS_MAP[status] || status || 'Draft';
  };

  const formatDate = dateString => {
    if (!dateString || dateString === '1900-01-01T00:00:00') return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  };

  const setButtonProcessing = (recId, buttonType, isProcessing) => {
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: isProcessing
        ? [...(prev[recId] || []), buttonType]
        : (prev[recId] || []).filter(btn => btn !== buttonType),
    }));
  };

  // Data Fetching
  const fetchExpenseData = useCallback(async () => {
    if (!userData?.employeeId) {
      console.log('No employee ID found');
      return;
    }

    setIsLoading(true);
    try {
      const myExpenseHeaderData = await GetAllExpenseReports({
        employeeId: userData.employeeId,
        legalEntity: selectedLegalEntity,
      });

      setExpenseData(myExpenseHeaderData || []);

      if (!myExpenseHeaderData || myExpenseHeaderData.length === 0) {
        console.log('No expense reports found for this user');
      }
    } catch (error) {
      console.error('Failed to fetch Expense Management data:', error);
      setAlertMessage(`Failed to fetch data: ${error.message}`);
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [userData?.employeeId, selectedLegalEntity]);

  useFocusEffect(
    useCallback(() => {
      fetchExpenseData();
    }, [fetchExpenseData]),
  );

  // Card Click Handler
  const handleCardPress = itemData => {
    // Navigate to ExpenseManagmentLinesListPage with the selected expense report data
    navigation.navigate('ExpenseManagmentLinesListPage', {
      expenseReportNumber: itemData.ExpenseReportNumber,
      employeeId: userData.employeeId,
      legalEntity: selectedLegalEntity,
      expenseReportData: itemData, // Pass the entire item data if needed
    });
  };

  // Button Handlers
  const getButtonConfig = item => {
    const isDraft = item.DocumentStatus === 'Draft';
    const isSubmitted =
      item.DocumentStatus === 'Submitted' || item.DocumentStatus === 'Approved';

    return {
      edit: {
        show: isDraft,
        position: 'header',
        style: 'icon',
        icon: 'edit',
        iconSize: 20,
        iconColor: '#fff',
        disabled: !isDraft,
        customStyle: !isDraft ? {backgroundColor: '#BDBDBD'} : {},
      },
      delete: {
        show: isDraft,
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

  const handleButtonPress = (buttonType, itemData) => {
    switch (buttonType) {
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

  const handleDeletePress = itemData => {
    setItemToDelete(itemData);
    setDeleteModal(true);
  };

  const handleSubmitPress = async itemData => {
    setButtonProcessing(itemData.recId, 'submit', true);

    try {
      const result = await SubmitExpenseReportsToWorkflow({
        expenseReportNumberList: [itemData.ExpenseReportNumber],
        legalEntity: selectedLegalEntity,
      });

      if (result.success) {
        setAlertMessage(
          `Expense report ${itemData.ExpenseReportNumber} submitted successfully`,
        );

        if (itemData.recId) {
          setHighlightedRecId(itemData.recId);
        }

        setTimeout(() => setHighlightedRecId(null), 3000);
        setTimeout(() => fetchExpenseData(), 1000);
      } else {
        setAlertMessage(
          result.message ||
            `Failed to submit expense report ${itemData.ExpenseReportNumber}`,
        );
      }
    } catch (error) {
      setAlertMessage(`Failed to submit expense report: ${error.message}`);
    } finally {
      setButtonProcessing(itemData.recId, 'submit', false);
      setAlertModal(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setButtonProcessing(itemToDelete.recId, 'delete', true);

    try {
      const result = await DeleteExpenseReports({
        employeeId: userData.employeeId,
        expenseReportNumbers: [itemToDelete.ExpenseReportNumber],
        legalEntity: selectedLegalEntity,
      });

      if (result.success) {
        setAlertMessage(
          `Expense report ${itemToDelete.ExpenseReportNumber} deleted successfully`,
        );
        // Remove from local state immediately
        setExpenseData(prev =>
          prev.filter(expense => expense.recId !== itemToDelete.recId),
        );
      } else {
        setAlertMessage('Unable to delete expense report. Please try again.');
      }
    } catch (error) {
      console.error('Delete expense report error:', error);
      setAlertMessage('Failed to delete expense report. Please try again.');
    } finally {
      setButtonProcessing(itemToDelete.recId, 'delete', false);
      setDeleteModal(false);
      setItemToDelete(null);
      setAlertModal(true);
      setTimeout(() => {
        fetchExpenseData();
      }, 1000);
    }
  };

  // Component Renderers
  const renderExpenseCard = ({item}) => {
    const itemProcessingButtons = processingButtons[item.recId] || [];
    const isHighlighted = highlightedRecId === item.recId;

    const processedItem = {
      ...item,
      Description: cleanJsonPlaceholder(item.Description),
      Location: cleanJsonPlaceholder(item.Location),
      Purpose: cleanJsonPlaceholder(item.Purpose),
      Title: cleanJsonPlaceholder(item.Title),
      CustomerAccount: cleanJsonPlaceholder(item.CustomerAccount),
      Invoice: cleanJsonPlaceholder(item.Invoice),
      PaymentVoucher: cleanJsonPlaceholder(item.PaymentVoucher),
      PreApprovalNumber: cleanJsonPlaceholder(item.PreApprovalNumber),
      VendorAccount: cleanJsonPlaceholder(item.VendorAccount),
      DocumentStatus: getStatusLabel(item.DocumentStatus),
      AmountTotal: item.AmountTotal
        ? `$${parseFloat(item.AmountTotal).toFixed(2)}`
        : '$0.00',
      PaymentDate: formatDate(item.PaymentDate),
      createdDateTime: formatDate(item.createdDateTime),
    };

    return (
      <Pressable
        onPress={() => handleCardPress(item)}
        style={({pressed}) => [
          styles.cardContainer,
          {opacity: pressed ? 0.8 : 1},
        ]}>
        <DynamicRequestCard
          data={processedItem}
          headerConfig={CARD_CONFIG.headerConfig}
          fields={CARD_CONFIG.fields}
          expandableFields={CARD_CONFIG.expandableFields}
          buttons={getButtonConfig(item)}
          onButtonPress={handleButtonPress}
          isExpandable={true}
          gradientColors={['#6ee0ff', '#bddeff', '#cce6ff']}
          highlightGradientColors={['#E8F5E8', '#F0FFF0']}
          processingButtons={itemProcessingButtons}
          isHighlighted={isHighlighted}
          isClickable={true} // Make card clickable
        />
      </Pressable>
    );
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleRefresh = () => {
    fetchExpenseData();
  };

  // Main Render
  return (
    <ActionPaneContainer
      pageTitle="Expense Management"
      showFooter
      showFloatingButton={false}
      isHeaderActive
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}>
      {/* Loading State */}
      {isLoading && <CustomIndicator />}

      {/* Data State */}
      {!isLoading && expenseData.length > 0 && (
        <FlatList
          data={expenseData}
          renderItem={renderExpenseCard}
          keyExtractor={(item, index) =>
            item.recId?.toString() ||
            item.ExpenseReportNumber?.toString() ||
            index.toString()
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }
        />
      )}

      {/* Empty State */}
      {!isLoading && expenseData.length === 0 && (
        <ScrollView
          contentContainerStyle={styles.noDataContainer}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }>
          <Text style={styles.noDataText}>No Data Found</Text>
        </ScrollView>
      )}

      {/* Modals */}
      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />

      <AlertDeleteModal
        visible={deleteModal}
        heading="Confirm Deletion"
        text="Are you sure you want to delete this expense report?"
        onPress={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModal(false);
          setItemToDelete(null);
        }}
      />
    </ActionPaneContainer>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 10,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#cccccc',
    textAlign: 'center',
  },
});

export default ExpenseManagmentListPage;
