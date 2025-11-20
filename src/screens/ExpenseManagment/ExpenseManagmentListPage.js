/* eslint-disable curly */
/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
import React, {useCallback, useState} from 'react';
import {
  Text,
  RefreshControl,
  ScrollView,
  StyleSheet,
  FlatList,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';

import {GetAllExpenseReports} from '../../API/ExpenseManagment/GetAllExpenseReports';

import AlertModal from '../../components/Alert/AlertModal';
import DynamicRequestCard from '../../components/DynamicRequestCard';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';

const ExpenseManagmentListPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [expenseData, setExpenseData] = useState([]);
  const [processingButtons, setProcessingButtons] = useState({});

  const navigation = useNavigation();
  const {userData} = useSelector(state => state.user);
  const {selectedLegalEntity, defaultLegalEntity, legalEntities} = useSelector(
    state => state.company,
  );

  const fetchEntitlementData = useCallback(async () => {
    if (!userData?.employeeId) {
      console.log('No employee ID found');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Fetching expense reports for:', {
        employeeId: userData.employeeId,
        legalEntity: selectedLegalEntity,
      });

      const myExpenseHeaderData = await GetAllExpenseReports({
        employeeId: userData.employeeId,
        legalEntity: selectedLegalEntity,
      });

      //   console.log('Expense reports data:', myExpenseHeaderData);
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

  // Helper function to set button processing state
  const setButtonProcessing = (recId, buttonType, isProcessing) => {
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: isProcessing
        ? [...(prev[recId] || []), buttonType]
        : (prev[recId] || []).filter(btn => btn !== buttonType),
    }));
  };

  // Handle button presses
  const handleButtonPress = (buttonType, itemData) => {
    switch (buttonType) {
      case 'edit':
        handleEditPress(itemData);
        break;
      case 'view':
        handleViewPress(itemData);
        break;
      case 'delete':
        handleDeletePress(itemData);
        break;
      default:
        console.log('Unknown button pressed:', buttonType);
    }
  };

  const handleEditPress = itemData => {
    // Navigate to edit expense report screen
    navigation.navigate('ExpenseSaveRecord', {
      mode: 'edit',
      expenseData: itemData,
      userData: userData,
    });
  };

  const handleViewPress = itemData => {
    // Navigate to view expense report details screen
    navigation.navigate('ExpenseDetails', {
      expenseData: itemData,
      userData: userData,
    });
  };

  const handleDeletePress = itemData => {
    // Implement delete functionality
    setAlertMessage(`Delete functionality for ${itemData.ExpenseReportNumber}`);
    setAlertModal(true);
  };

  // Card Configuration for Expense Reports
  const cardConfig = {
    // Header configuration
    headerConfig: {
      title: {key: 'ExpenseReportNumber'},
      subtitle: {key: 'Purpose'},
    },

    // Main fields to display (always visible)
    fields: [
      {key: 'Location', label: 'Location', type: 'text'},
      {key: 'AmountTotal', label: 'Total Amount', type: 'currency'},
      {key: 'DocumentStatus', label: '', type: 'status'}, // No label for status
    ],

    // Expandable fields (shown when expanded)
    expandableFields: [
      {key: 'ExpenseReportNumber', label: 'Report Number', type: 'text'},
      {key: 'PaymentDate', label: 'Payment Date', type: 'date'},
      {key: 'createdDateTime', label: 'Created Date', type: 'date'},
    ],
  };

  // Define button configuration based on document status
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
      view: {
        show: isSubmitted,
        position: 'bottom',
        style: 'text',
        icon: 'eye',
        iconSize: 16,
        text: 'View Details',
        textColor: '#0A66C2',
        iconColor: '#0A66C2',
      },
    };
  };

  // Get status label with proper formatting
  const getStatusLabel = status => {
    const statusMap = {
      Draft: 'Draft',
      Submitted: 'Submitted',
      Approved: 'Approved',
      Rejected: 'Rejected',
      Paid: 'Paid',
      Pending: 'Pending Approval',
    };
    return statusMap[status] || status || 'Draft';
  };

  // Format date for display
  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  };

  // Render expense card
  const renderExpenseCard = ({item}) => {
    const itemProcessingButtons = processingButtons[item.recId] || [];

    // Process item data for display
    const processedItem = {
      ...item,
      DocumentStatus: getStatusLabel(item.DocumentStatus),
      AmountTotal: item.AmountTotal
        ? `$${parseFloat(item.AmountTotal).toFixed(2)}`
        : '$0.00',
      PaymentDate: formatDate(item.PaymentDate),
      createdDateTime: formatDate(item.createdDateTime),
    };

    return (
      <DynamicRequestCard
        data={processedItem}
        headerConfig={cardConfig.headerConfig}
        fields={cardConfig.fields}
        expandableFields={cardConfig.expandableFields}
        buttons={getButtonConfig(item)}
        onButtonPress={handleButtonPress}
        isExpandable={true}
        gradientColors={['#6ee0ff', '#bddeff', '#cce6ff']}
        highlightGradientColors={['#E8F5E8', '#F0FFF0']}
        processingButtons={itemProcessingButtons}
      />
    );
  };

  // Handle back navigation
  const handleGoBack = () => {
    navigation.goBack();
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchEntitlementData();
  };

  return (
    <ActionPaneContainer
      pageTitle="Expense Management"
      showFooter
      showFloatingButton={false}
      isHeaderActive
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}>
      {/* Main content */}
      {isLoading ? (
        <CustomIndicator />
      ) : expenseData.length > 0 ? (
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
      ) : (
        <ScrollView
          contentContainerStyle={{flexGrow: 1}}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }>
          <Text style={styles.noDataText}>No Expense Reports Found</Text>
        </ScrollView>
      )}

      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
    </ActionPaneContainer>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 10,
  },
  noDataText: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#cccccc',
  },
});

export default ExpenseManagmentListPage;
