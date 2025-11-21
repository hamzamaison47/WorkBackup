/* eslint-disable no-shadow */
/* eslint-disable no-unused-vars */
/* eslint-disable curly */
import React, {useCallback, useState} from 'react';
import {
  Text,
  RefreshControl,
  ScrollView,
  StyleSheet,
  FlatList,
  View,
  BackHandler,
} from 'react-native';
import {useSelector} from 'react-redux';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';

import {GetAllExpenseLines} from '../../../API/ExpenseManagment/Lines/GetAllExpenseLines';
import {DeleteExpenseLines} from '../../../API/ExpenseManagment/Lines/DeleteExpenseLines';

import AlertModal from '../../../components/Alert/AlertModal';
import DynamicRequestCard from '../../../components/DynamicRequestCard';
import ActionPaneContainer from '../../../components/ActionPaneContainer';
import CustomIndicator from '../../../components/CustomIndicator/CustomIndicator';
import AlertDeleteModal from '../../../components/Alert/AlertDeleteModal';

const ExpenseManagmentLinesListPage = () => {
  // State Management
  const [isLoading, setIsLoading] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [expenseLinesData, setExpenseLinesData] = useState([]);
  const [debugInfo, setDebugInfo] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [processingButtons, setProcessingButtons] = useState({});

  // Navigation and Route
  const navigation = useNavigation();
  const route = useRoute();
  const {expenseReportNumber, employeeId, legalEntity, expenseReportData} =
    route.params || {};

  // Redux Selectors
  const {userData} = useSelector(state => state.user);
  const {selectedLegalEntity} = useSelector(state => state.company);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('ExpenseManagmentListPage');
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation]),
  );

  // Constants - Configure for expense lines display based on actual API response
  const CARD_CONFIG = {
    headerConfig: {
      title: {key: 'ExpenseType', label: 'Expense Type'},
      subtitle: {key: 'Description', label: 'Description'},
    },
    fields: [
      {key: 'TransDate', label: 'Date', type: 'date'},
      {key: 'AmountCurr', label: 'Amount', type: 'currency'},
      {key: 'ExchangeCode', label: 'Currency', type: 'text'},
    ],
    expandableFields: [
      {key: 'LineNumber', label: 'Line Number', type: 'text'},
      {key: 'ExpenseType', label: 'Expense Type', type: 'text'},
      {key: 'CostType', label: 'Cost Type', type: 'text'},
      {key: 'Description', label: 'Description', type: 'text'},
      {key: 'TransDate', label: 'Transaction Date', type: 'date'},
      {key: 'AmountCurr', label: 'Amount (Currency)', type: 'currency'},
      {key: 'AmountMST', label: 'Amount (Company)', type: 'currency'},
      {key: 'ExchangeCode', label: 'Currency', type: 'text'},
      {key: 'PayMethod', label: 'Payment Method', type: 'text'},
      {key: 'MerchantId', label: 'Merchant', type: 'text'},
      {key: 'ApprovalStatus', label: 'Status', type: 'text'},
      {key: 'ExpenseTransactionNumber', label: 'Transaction #', type: 'text'},
    ],
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

  const formatDate = dateString => {
    if (!dateString || dateString === '1900-01-01T00:00:00') return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount || amount === '0') return '$0.00';
    try {
      const numericAmount = parseFloat(amount);
      return `$${numericAmount.toFixed(2)}`;
    } catch (error) {
      return amount;
    }
  };

  const getStatusLabel = status => {
    const statusMap = {
      Draft: 'Draft',
      Submitted: 'Submitted',
      Approved: 'Approved',
      Rejected: 'Rejected',
      Paid: 'Paid',
    };
    return statusMap[status] || status || 'Draft';
  };

  const setButtonProcessing = (recId, buttonType, isProcessing) => {
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: isProcessing
        ? [...(prev[recId] || []), buttonType]
        : (prev[recId] || []).filter(btn => btn !== buttonType),
    }));
  };

  // Data Fetching - Get Expense Lines for the specific report
  const fetchExpenseLinesData = useCallback(async () => {
    if (!employeeId || !expenseReportNumber) {
      const errorMsg = 'Missing required parameters to fetch expense lines';
      console.log(errorMsg, {employeeId, expenseReportNumber});
      setAlertMessage(errorMsg);
      setDebugInfo(
        `Employee ID: ${employeeId}, Report: ${expenseReportNumber}`,
      );
      setAlertModal(true);
      return;
    }

    setIsLoading(true);
    setDebugInfo(
      `Fetching lines for report: ${expenseReportNumber}, employee: ${employeeId}`,
    );

    try {
      const expenseLines = await GetAllExpenseLines({
        employeeId: employeeId,
        expenseReportNumber: expenseReportNumber,
        legalEntity: legalEntity || selectedLegalEntity,
      });

      setExpenseLinesData(expenseLines || []);
      setDebugInfo(`Found ${expenseLines?.length || 0} expense lines`);

      if (!expenseLines || expenseLines.length === 0) {
        const noDataMsg = `No expense lines found for report ${expenseReportNumber}`;
        console.log(noDataMsg);
        setAlertMessage(noDataMsg);
        setAlertModal(true);
      }
    } catch (error) {
      console.error('Failed to fetch Expense Lines data:', error);
      const errorMsg = `Failed to fetch expense lines: ${error.message}`;
      setAlertMessage(errorMsg);
      setDebugInfo(`Error: ${error.message}`);
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, expenseReportNumber, legalEntity, selectedLegalEntity]);

  useFocusEffect(
    useCallback(() => {
      fetchExpenseLinesData();
    }, [fetchExpenseLinesData]),
  );

  // Button Handlers
  const getButtonConfig = item => {
    // Use ApprovalStatus for expense lines (not DocumentStatus)
    const isDraft = item.ApprovalStatus === 'Draft';

    return {
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
    };
  };

  const handleButtonPress = (buttonType, itemData) => {
    switch (buttonType) {
      case 'delete':
        handleDeletePress(itemData);
        break;
      default:
        console.log('Unknown button pressed:', buttonType);
    }
  };

  const handleDeletePress = itemData => {
    setItemToDelete(itemData);
    setDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    // Use RecId as the unique identifier for processing
    const itemId = itemToDelete.RecId || itemToDelete.ExpenseTransactionNumber;
    setButtonProcessing(itemId, 'delete', true);

    try {
      // CORRECTED: Use expenseTransactionNumbers instead of expenseReportNumbers
      const result = await DeleteExpenseLines({
        employeeId: employeeId || userData?.employeeId,
        expenseTransactionNumbers: [itemToDelete.ExpenseTransactionNumber], // Use transaction number, not report number
        legalEntity: legalEntity || selectedLegalEntity,
      });

      if (result.success) {
        setAlertMessage(
          `Expense line ${itemToDelete.ExpenseTransactionNumber} deleted successfully`,
        );
        // Remove from local state immediately - CORRECTED: use expenseLinesData
        setExpenseLinesData(prev =>
          prev.filter(
            line =>
              line.ExpenseTransactionNumber !==
              itemToDelete.ExpenseTransactionNumber,
          ),
        );
      } else {
        setAlertMessage('Unable to delete expense line. Please try again.');
      }
    } catch (error) {
      console.error('Delete expense line error:', error);
      setAlertMessage(`Failed to delete expense line: ${error.message}`);
    } finally {
      const itemId =
        itemToDelete.RecId || itemToDelete.ExpenseTransactionNumber;
      setButtonProcessing(itemId, 'delete', false);
      setDeleteModal(false);
      setItemToDelete(null);
      setAlertModal(true);
      setTimeout(() => {
        fetchExpenseLinesData();
      }, 1000);
    }
  };

  // Component Renderers
  const renderExpenseLineCard = ({item, index}) => {
    const itemProcessingButtons = processingButtons[item.RecId] || [];

    // Process the item data to clean and format values
    const processedItem = {
      ...item,
      // Clean JSON placeholder values
      Description: cleanJsonPlaceholder(item.Description),
      ExpenseType: cleanJsonPlaceholder(item.ExpenseType),
      CostType: cleanJsonPlaceholder(item.CostType),
      MerchantId: cleanJsonPlaceholder(item.MerchantId),
      PayMethod: cleanJsonPlaceholder(item.PayMethod),

      // Format values
      AmountCurr: formatCurrency(item.AmountCurr, item.ExchangeCode),
      AmountMST: formatCurrency(item.AmountMST, item.ExchangeCode),
      TransDate: formatDate(item.TransDate),
      ExchangeCode: item.ExchangeCode || 'USD',
      ApprovalStatus: getStatusLabel(item.ApprovalStatus),
      LineNumber: item.LineNumber || `Line ${index + 1}`,

      // Add any additional formatting needed
      createdDateTime: formatDate(item.createdDateTime),
      modifiedDateTime: formatDate(item.modifiedDateTime),
    };

    return (
      <DynamicRequestCard
        data={processedItem}
        headerConfig={CARD_CONFIG.headerConfig}
        fields={CARD_CONFIG.fields}
        expandableFields={CARD_CONFIG.expandableFields}
        buttons={getButtonConfig(item)}
        onButtonPress={handleButtonPress}
        isExpandable={true}
        gradientColors={['#f0f8ff', '#e6f3ff', '#d9edff']}
        isClickable={false} // Lines are not clickable
        processingButtons={itemProcessingButtons}
      />
    );
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleRefresh = () => {
    fetchExpenseLinesData();
  };

  // Get page title with report number
  const getPageTitle = () => {
    return `Expense Lines - ${expenseReportNumber || 'Report'}`;
  };

  // Calculate total amount
  const getTotalAmount = () => {
    const total = expenseLinesData.reduce((sum, line) => {
      return sum + (parseFloat(line.AmountCurr) || 0);
    }, 0);
    return formatCurrency(total);
  };

  // Main Render
  return (
    <ActionPaneContainer
      pageTitle={getPageTitle()}
      showFooter
      showFloatingButton={false}
      isHeaderActive
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}>
      {/* Summary Header */}
      {!isLoading && expenseLinesData.length > 0 && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>
            {expenseLinesData.length} line(s) • Total: {getTotalAmount()}
          </Text>
        </View>
      )}

      {/* Debug Info - Remove in production */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>{debugInfo}</Text>
        </View>
      )}

      {/* Loading State */}
      {isLoading && <CustomIndicator />}

      {/* Data State */}
      {!isLoading && expenseLinesData.length > 0 && (
        <FlatList
          data={expenseLinesData}
          renderItem={renderExpenseLineCard}
          keyExtractor={(item, index) =>
            item.RecId?.toString() ||
            item.ExpenseTransactionNumber?.toString() ||
            `line-${index}`
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }
        />
      )}

      {/* Empty State */}
      {!isLoading && expenseLinesData.length === 0 && (
        <ScrollView
          contentContainerStyle={styles.noDataContainer}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }>
          <Text style={styles.noDataText}>No Expense Lines Found</Text>
          <Text style={styles.noDataSubText}>
            {expenseReportNumber
              ? `No expense lines found for report ${expenseReportNumber}`
              : 'No expense report selected'}
          </Text>
          {__DEV__ && <Text style={styles.debugInfo}>{debugInfo}</Text>}
        </ScrollView>
      )}

      {/* Modals */}
      <AlertModal
        visible={alertModal}
        heading="Expense Lines"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />

      <AlertDeleteModal
        visible={deleteModal}
        heading="Confirm Deletion"
        text={`Are you sure you want to delete expense line ${
          itemToDelete?.ExpenseTransactionNumber || ''
        }?`}
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
  summaryContainer: {
    backgroundColor: '#e8f4fd',
    padding: 12,
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0A66C2',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A66C2',
    textAlign: 'center',
  },
  listContainer: {
    padding: 10,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  noDataSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 10,
  },
  debugContainer: {
    backgroundColor: '#f5f5f5',
    padding: 8,
    margin: 10,
    borderRadius: 4,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  debugInfo: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ExpenseManagmentLinesListPage;
