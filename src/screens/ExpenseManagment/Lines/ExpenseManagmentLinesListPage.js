/* eslint-disable no-unused-vars */
/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useCallback, useState, useEffect} from 'react';
import {
  Text,
  RefreshControl,
  ScrollView,
  StyleSheet,
  FlatList,
  View,
  BackHandler,
  Animated,
} from 'react-native';
import {useSelector} from 'react-redux';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';

import {GetAllExpenseLines} from '../../../API/ExpenseManagment/Lines/GetAllExpenseLines';
import {DeleteExpenseLines} from '../../../API/ExpenseManagment/Lines/DeleteExpenseLines';
import {GetAllExpenseReports} from '../../../API/ExpenseManagment/Headers/GetAllExpenseReports';

import AlertModal from '../../../components/Alert/AlertModal';
import DynamicRequestCard, {
  BUTTON_TYPES,
} from '../../../components/DynamicRequestCard';
import ActionPaneContainer from '../../../components/ActionPaneContainer';
import CustomIndicator from '../../../components/CustomIndicator/CustomIndicator';
import AlertDeleteModal from '../../../components/Alert/AlertDeleteModal';
import ReceiptDetailsModal from '../../../components/ExpenseManagment/ReceiptDetailsModal';

const ExpenseManagmentLinesListPage = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    expenseReportNumber,
    expenseReportRecId,
    employeeId,
    employeeName,
    legalEntity,
    WorkerRecId,
    cameFrom,
    originalCameFrom,
    expenseReportData,
    userData: routeUserData,
  } = route.params || {};

  const reduxUserData = useSelector(state => state.user.userData);
  const {selectedLegalEntity} = useSelector(state => state.company);
  const {menuItems} = useSelector(state => state.menuItem);

  // console.log(menuItems);

  const effectiveUserData = routeUserData || reduxUserData;
  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
  const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;
  const effectiveWorkerRecId = WorkerRecId || effectiveUserData?.WorkerRecId;
  const effectiveLegalEntity = legalEntity || selectedLegalEntity;
  const effectiveRecId =
    expenseReportRecId ||
    expenseReportData?.recId ||
    expenseReportData?.RecId ||
    '';

  const [isLoading, setIsLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [expenseLinesData, setExpenseLinesData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [processingButtons, setProcessingButtons] = useState({});

  const [receiptModal, setReceiptModal] = useState(false);
  const [selectedExpenseLine, setSelectedExpenseLine] = useState(null);

  const CARD_CONFIG = {
    headerConfig: {
      title: {key: 'ExpenseType', label: 'Expense Type'},
      subtitle: {key: 'Description', label: 'Description'},
    },
    fields: [
      {key: 'TransDate', label: 'Transaction Date', type: 'date'},
      {key: 'AmountCurr', label: 'Amount', type: 'currency'},
      {key: 'ExchangeCode', label: 'Currency', type: 'text'},
      {key: 'ApprovalStatus', label: '', type: 'status'},
    ],
    expandableFields: [
      {key: 'LineNumber', label: 'Line Number', type: 'text'},
      {key: 'PayMethod', label: 'Payment Method', type: 'text'},
      {key: 'MerchantId', label: 'Merchant', type: 'text'},
      {
        key: 'ExpenseTransactionNumber',
        label: 'Transaction Number',
        type: 'text',
      },
    ],
  };

  // Clear all states when component unmounts
  useEffect(() => {
    return () => {
      setExpenseLinesData([]);
      setExpenseData([]);
      setProcessingButtons({});
      setItemToDelete(null);
      setAlertModal(false);
      setDeleteModal(false);
      setReceiptModal(false);
    };
  }, []);

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
    if (!amount || amount === '0') return '0.00';
    try {
      const numericAmount = parseFloat(amount);
      return `${numericAmount.toFixed(2)}`;
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

  const normalizeRecId = item => item.recId || item.RecId || '';

  const fetchExpenseLinesData = useCallback(async () => {
    if (!effectiveEmployeeId || !expenseReportNumber) {
      const errorMsg = 'Missing required parameters to fetch expense lines';
      setAlertMessage(errorMsg);
      setAlertModal(true);
      setIsLoading(false);
      return;
    }

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();

    try {
      const expenseLines = await GetAllExpenseLines({
        employeeId: effectiveEmployeeId,
        expenseReportNumber: expenseReportNumber,
        legalEntity: effectiveLegalEntity,
      });

      const sortedExpenseLines = (expenseLines || []).sort((a, b) => {
        const dateA = new Date(a.createdDateTime || a.CreatedDate || 0);
        const dateB = new Date(b.createdDateTime || b.CreatedDate || 0);
        return dateB - dateA;
      });

      setExpenseLinesData(sortedExpenseLines);

      const myExpenseHeaderData = await GetAllExpenseReports({
        employeeId: effectiveEmployeeId,
        legalEntity: effectiveLegalEntity,
      });

      const sortedData = (myExpenseHeaderData || []).sort((a, b) => {
        const dateA = new Date(a.createdDateTime || a.CreatedDate || 0);
        const dateB = new Date(b.createdDateTime || b.CreatedDate || 0);
        return dateB - dateA;
      });

      setExpenseData(sortedData);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      if (!sortedExpenseLines || sortedExpenseLines.length === 0) {
        console.log(`No expense lines found for report ${expenseReportNumber}`);
      }
    } catch (error) {
      console.error('Failed to fetch Expense Lines data:', error);
      const errorMsg = `Failed to fetch expense lines: ${error.message}`;
      setAlertMessage(errorMsg);
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveEmployeeId, expenseReportNumber, effectiveLegalEntity]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchExpenseLinesData();
    }, [fetchExpenseLinesData]),
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

  const handleGoBack = () => {
    if (cameFrom === 'ExpenseManagmentListPage') {
      navigation.navigate('ExpenseManagmentListPage', {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
        userData: {
          employeeId: effectiveEmployeeId,
          employeeName: effectiveEmployeeName,
          WorkerRecId: effectiveWorkerRecId,
        },
        cameFrom: originalCameFrom || cameFrom,
      });
    } else {
      navigation.goBack();
    }
  };

  const getButtonConfig = item => {
    const isDraft = item.ApprovalStatus === 'Draft';

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
      attachment: {
        show: true,
        position: 'header',
        style: 'icon',
        icon: 'paperclip',
        iconSize: 20,
        iconColor: '#FFFFFF',
        customStyle: {},
      },
    };
  };

  const handleButtonPress = (buttonType, itemData) => {
    switch (buttonType) {
      case 'edit':
        handleEditPress(itemData);
        break;
      case 'delete':
        handleDeletePress(itemData);
        break;
      case 'attachment':
        handleReceiptPress(itemData);
        break;
      default:
        console.log('Unknown button pressed:', buttonType);
    }
  };

  const handleCreateExpense = () => {
    navigation.navigate('ExpenseManagmentLinesSaveRecord', {
      mode: 'create',
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
      },
      legalEntity: effectiveLegalEntity,
      cameFrom: 'ExpenseManagmentLinesListPage',
      originalCameFrom: originalCameFrom || cameFrom,
      expenseData: {
        recId: effectiveRecId,
        RecId: effectiveRecId,
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
        ExpenseReportNumber: expenseReportNumber,
        legalEntity: effectiveLegalEntity,
        transactionDate: new Date().toISOString().split('T')[0],
        transactionAmount: '',
        expenseCategory: '',
        currency: '',
        merchant: '',
        description: '',
      },
    });
  };

  const handleEditPress = itemData => {
    const itemRecId = normalizeRecId(itemData);

    const extractNumericValue = currencyString => {
      if (!currencyString) return '0';

      const numericString = currencyString.replace(/[^\d.-]/g, '');
      const numericValue = parseFloat(numericString);

      return isNaN(numericValue) ? '0' : numericValue.toString();
    };

    const transactionAmount = extractNumericValue(itemData.AmountCurr);

    navigation.navigate('ExpenseManagmentLinesSaveRecord', {
      mode: 'edit',
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
      },
      legalEntity: effectiveLegalEntity,
      cameFrom: 'ExpenseManagmentLinesListPage',
      originalCameFrom: originalCameFrom || cameFrom,
      expenseData: {
        recId: itemRecId,
        RecId: itemRecId,
        expenseTransactionNumber: itemData.ExpenseTransactionNumber,
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
        ExpenseReportNumber: expenseReportNumber,
        legalEntity: effectiveLegalEntity,
        transactionDate:
          itemData.TransDate || new Date().toISOString().split('T')[0],
        transactionAmount: transactionAmount,
        expenseCategory: itemData.CostType || '',
        currency: itemData.ExchangeCode || 'USD',
        merchant: itemData.MerchantId || '',
        description: itemData.Description || '',
        lineNumber: itemData.LineNumber,
      },
    });
  };

  const handleDeletePress = itemData => {
    setItemToDelete(itemData);
    setDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    const itemId = normalizeRecId(itemToDelete);
    setButtonProcessing(itemId, 'delete', true);

    try {
      const result = await DeleteExpenseLines({
        employeeId: effectiveEmployeeId,
        expenseTransactionNumbers: [itemToDelete.ExpenseTransactionNumber],
        legalEntity: effectiveLegalEntity,
      });

      if (result.success) {
        setAlertMessage(
          `Expense line ${itemToDelete.ExpenseTransactionNumber} deleted successfully`,
        );
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
      setButtonProcessing(itemId, 'delete', false);
      setDeleteModal(false);
      setItemToDelete(null);
      setAlertModal(true);
      setTimeout(() => {
        fetchExpenseLinesData();
      }, 1000);
    }
  };

  const handleReceiptPress = itemData => {
    setSelectedExpenseLine(itemData);
    setReceiptModal(true);
  };

  const handleReceiptModalClose = () => {
    setReceiptModal(false);
    setSelectedExpenseLine(null);
  };

  const handleReceiptsSaved = () => {
    setAlertMessage('Receipts saved successfully');
    setAlertModal(true);
    setReceiptModal(false);
    setSelectedExpenseLine(null);
  };

  const renderExpenseLineCard = ({item, index}) => {
    const itemRecId = normalizeRecId(item);
    const itemProcessingButtons = processingButtons[itemRecId] || [];

    const buttonConfig = getButtonConfig(item);

    const headerButtons = [];
    if (buttonConfig.edit?.show) headerButtons.push(BUTTON_TYPES.EDIT);
    if (buttonConfig.delete?.show) headerButtons.push(BUTTON_TYPES.DELETE);
    if (buttonConfig.attachment?.show)
      headerButtons.push(BUTTON_TYPES.ATTACHMENT);

    const processedItem = {
      ...item,
      recId: itemRecId,
      Description: cleanJsonPlaceholder(item.Description),
      ExpenseType: cleanJsonPlaceholder(item.ExpenseType),
      CostType: cleanJsonPlaceholder(item.CostType),
      MerchantId: cleanJsonPlaceholder(item.MerchantId),
      PayMethod: cleanJsonPlaceholder(item.PayMethod),
      AmountCurr: formatCurrency(item.AmountCurr, item.ExchangeCode),
      AmountMST: formatCurrency(item.AmountMST, item.ExchangeCode),
      TransDate: formatDate(item.TransDate),
      ExchangeCode: item.ExchangeCode || 'USD',
      ApprovalStatus: getStatusLabel(item.ApprovalStatus),
      LineNumber: item.LineNumber || `Line ${index + 1}`,
      createdDateTime: formatDate(item.createdDateTime),
      modifiedDateTime: formatDate(item.modifiedDateTime),
    };

    return (
      <DynamicRequestCard
        data={processedItem}
        headerConfig={CARD_CONFIG.headerConfig}
        fields={CARD_CONFIG.fields}
        expandableFields={CARD_CONFIG.expandableFields}
        headerButtons={headerButtons}
        buttons={buttonConfig}
        onButtonPress={handleButtonPress}
        isExpandable={true}
        gradientColors={['#6ee0ff', '#bddeff', '#cce6ff']}
        processingButtons={itemProcessingButtons}
      />
    );
  };

  const handleRefresh = () => {
    setIsLoading(true);
    fetchExpenseLinesData();
  };

  const getPageTitle = () => {
    return `Expense Lines - ${expenseReportNumber || 'Report'}`;
  };

  const getTotalAmount = () => {
    const currentReport = expenseData.find(
      report => report.ExpenseReportNumber === expenseReportNumber,
    );

    if (currentReport && currentReport.AmountTotal) {
      return formatCurrency(currentReport.AmountTotal);
    }

    const total = expenseLinesData.reduce((sum, line) => {
      return sum + (parseFloat(line.AmountCurr) || 0);
    }, 0);

    return formatCurrency(total);
  };

  return (
    <ActionPaneContainer
      pageTitle={getPageTitle()}
      showFooter
      showFloatingButton={
        expenseLinesData.length === 0 ||
        expenseLinesData.some(item => item.ApprovalStatus === 'Draft')
      }
      isHeaderActive
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={handleCreateExpense}>
      {isLoading && <CustomIndicator />}

      {!isLoading && (
        <Animated.View style={{flex: 1, opacity: fadeAnim}}>
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>
              Total Amount: {getTotalAmount()}
            </Text>
          </View>

          {expenseLinesData.length > 0 && (
            <FlatList
              data={expenseLinesData}
              renderItem={renderExpenseLineCard}
              keyExtractor={(item, index) => {
                const itemRecId = normalizeRecId(item);
                return (
                  itemRecId?.toString() ||
                  item.ExpenseTransactionNumber?.toString() ||
                  `line-${index}`
                );
              }}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isLoading}
                  onRefresh={handleRefresh}
                />
              }
            />
          )}

          {expenseLinesData.length === 0 && (
            <ScrollView
              contentContainerStyle={styles.noDataContainer}
              refreshControl={
                <RefreshControl
                  refreshing={isLoading}
                  onRefresh={handleRefresh}
                />
              }>
              <Text style={styles.noDataText}>No Expense Lines</Text>
              <Text style={styles.noDataSubText}>
                Tap the + button to add your first expense line
              </Text>
            </ScrollView>
          )}
        </Animated.View>
      )}

      <ReceiptDetailsModal
        visible={receiptModal}
        expenseLine={selectedExpenseLine}
        legalEntity={effectiveLegalEntity}
        employeeId={effectiveEmployeeId}
        onCancel={handleReceiptModalClose}
        onSave={handleReceiptsSaved}
      />

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
    backgroundColor: '#bfe3ffff',
    padding: 12,
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0A66C2',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
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
    fontWeight: '600',
    color: '#0A66C2',
    textAlign: 'center',
    marginBottom: 8,
  },
  noDataSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default ExpenseManagmentLinesListPage;
