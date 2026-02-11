/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useCallback, useState} from 'react';
import {
  Text,
  RefreshControl,
  ScrollView,
  FlatList,
  Pressable,
  BackHandler,
  Animated,
  View,
} from 'react-native';
import {useSelector} from 'react-redux';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';

import {GetAllExpenseReports} from '../../../API/ExpenseManagment/Headers/GetAllExpenseReports';
import {DeleteExpenseReports} from '../../../API/ExpenseManagment/Headers/DeleteExpenseReports';
import SubmitExpenseReportsToWorkflow from '../../../API/ExpenseManagment/Headers/SubmitExpenseReportsToWorkflow';

import AlertModal from '../../../components/Alert/AlertModal';
import DynamicRequestCard from '../../../components/DynamicRequestCard';
import ActionPaneContainer from '../../../components/ActionPaneContainer';
import CustomIndicator from '../../../components/CustomIndicator/CustomIndicator';
import AlertDeleteModal from '../../../components/Alert/AlertDeleteModal';
import styles from '../../../styles/styles';

const ExpenseManagmentListPage = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    employeeId,
    employeeName,
    WorkerRecId,
    cameFrom,
    userData: routeUserData,
  } = route.params || {};

  // Redux
  const reduxUserData = useSelector(state => state.user.userData);
  const {selectedLegalEntity} = useSelector(state => state.company);

  const effectiveUserData = routeUserData || reduxUserData;
  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
  const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;
  const effectiveWorkerRecId = WorkerRecId || effectiveUserData?.WorkerRecId;

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [expenseData, setExpenseData] = useState([]);
  const [processingButtons, setProcessingButtons] = useState({});
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Card config
  const CARD_CONFIG = {
    headerConfig: {
      title: {key: 'ExpenseReportNumber'},
    },
    fields: [
      {key: 'Location', label: 'Location', type: 'text'},
      {key: 'Purpose', label: 'Purpose', type: 'text'},
      {key: 'DocumentStatus', label: '', type: 'status'},
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

  const cleanJsonPlaceholder = value => {
    if (!value) return '';
    const pattern =
      /{"@_i:type":"c:string","@_xmlns:c":"http:\/\/www\.w3\.org\/2001\/XMLSchema"}/;
    return typeof value === 'string' && pattern.test(value) ? '' : value;
  };

  const getStatusLabel = status => STATUS_MAP[status] || status || 'Draft';

  const formatDate = dateString => {
    if (!dateString || dateString === '1900-01-01T00:00:00') return 'N/A';
    const date = new Date(dateString);
    return isNaN(date) ? dateString : date.toLocaleDateString();
  };

  const normalizeRecId = item => item.recId || item.RecId || '';

  const setButtonProcessing = (recId, buttonType, isProcessing) => {
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: isProcessing
        ? [...(prev[recId] || []), buttonType]
        : (prev[recId] || []).filter(btn => btn !== buttonType),
    }));
  };

  // Fetch data
  const fetchExpenseData = useCallback(async () => {
    if (!effectiveEmployeeId) {
      setIsLoading(false);
      return;
    }

    // setIsLoading(true);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();

    try {
      const myExpenseHeaderData = await GetAllExpenseReports({
        employeeId: effectiveEmployeeId,
        legalEntity: selectedLegalEntity,
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
    } catch (error) {
      setAlertMessage(`Failed to fetch data: ${error.message}`);
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveEmployeeId, selectedLegalEntity]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchExpenseData();
    }, [fetchExpenseData]),
  );

  // Back handler
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
    let targetRoute = 'MainDashboard';

    switch (cameFrom) {
      case 'DisplayListPage':
        targetRoute = 'DisplayListPage';
        break;
      case 'WorkerAssignedToMe':
        targetRoute = 'WorkerAssignedToMe';
        break;
      case 'DrawerNavigator':
      case 'MainDashboard':
      default:
        break;
    }

    navigation.reset({
      index: 0,
      routes: [{name: 'TabNavigator', params: {screen: targetRoute}}],
    });
  };

  // Card click - Navigate to Lines List
  const handleCardPress = itemData => {
    const itemRecId = normalizeRecId(itemData);

    navigation.navigate('ExpenseManagmentLinesListPage', {
      expenseReportNumber: itemData.ExpenseReportNumber,
      expenseReportRecId: itemRecId,
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      legalEntity: selectedLegalEntity,
      userData: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
      },
      expenseReportData: {
        ...itemData,
        recId: itemRecId,
      },
      cameFrom: 'ExpenseManagmentListPage',
      originalCameFrom: cameFrom,
    });
  };

  const handleCreateExpense = () => {
    navigation.navigate('ExpenseManagementHeaderSaveRecord', {
      mode: 'create',
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
      },
      legalEntity: selectedLegalEntity,
      cameFrom: 'ExpenseManagmentListPage',
      originalCameFrom: cameFrom,
      expenseData: {},
    });
  };

  // Buttons config
  const getButtonConfig = item => {
    const isDraft = item.DocumentStatus === 'Draft';

    return {
      edit: {
        show: true,
        position: 'header',
        style: 'icon',
        icon: 'edit',
        iconSize: 20,
        iconColor: '#fff',
        backgroundColor: '#0A66C2',
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
        backgroundColor: '#0A66C2',
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
        customStyle: {transform: [{translateY: -28}]},
      },
    };
  };

  const handleButtonPress = (buttonType, item) => {
    if (buttonType === 'edit') handleEditPress(item);
    else if (buttonType === 'delete') handleDeletePress(item);
    else if (buttonType === 'submit') handleSubmitPress(item);
  };

  const handleEditPress = itemData => {
    const itemRecId = normalizeRecId(itemData);

    navigation.navigate('ExpenseManagementHeaderSaveRecord', {
      mode: 'edit',
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
      },
      legalEntity: selectedLegalEntity,
      cameFrom: 'ExpenseManagmentListPage',
      originalCameFrom: cameFrom,
      expenseData: {
        recId: itemRecId,
        RecId: itemRecId,
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
        legalEntity: itemData.LegalEntity || selectedLegalEntity,
        location: itemData.Location,
        purpose: itemData.Purpose,
        ExpenseReportNumber: itemData.ExpenseReportNumber,
      },
    });
  };

  const handleDeletePress = itemData => {
    setItemToDelete(itemData);
    setDeleteModal(true);
  };

  const handleSubmitPress = async itemData => {
    const itemRecId = normalizeRecId(itemData);
    setButtonProcessing(itemRecId, 'submit', true);

    try {
      const result = await SubmitExpenseReportsToWorkflow({
        expenseReportNumberList: [itemData.ExpenseReportNumber],
        legalEntity: selectedLegalEntity,
      });

      if (result.success) {
        setAlertMessage(
          `Expense report ${itemData.ExpenseReportNumber} submitted successfully`,
        );
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
      setButtonProcessing(itemRecId, 'submit', false);
      setAlertModal(true);
    }
  };

  const handleDeleteConfirm = async () => {
    const itemRecId = normalizeRecId(itemToDelete);
    setButtonProcessing(itemRecId, 'delete', true);

    try {
      const result = await DeleteExpenseReports({
        employeeId: effectiveEmployeeId,
        expenseReportNumbers: [itemToDelete.ExpenseReportNumber],
        legalEntity: selectedLegalEntity,
      });

      if (result.success) {
        setAlertMessage(
          `Expense report ${itemToDelete.ExpenseReportNumber} deleted successfully`,
        );
        setExpenseData(prev =>
          prev.filter(exp => normalizeRecId(exp) !== itemRecId),
        );
      } else {
        setAlertMessage('Unable to delete expense report. Please try again.');
      }
    } catch (error) {
      setAlertMessage('Failed to delete expense report. Please try again.');
    } finally {
      setButtonProcessing(itemRecId, 'delete', false);
      setDeleteModal(false);
      setItemToDelete(null);
      setAlertModal(true);
      setTimeout(() => fetchExpenseData(), 1000);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    fetchExpenseData();
  };

  // Render expense card
  const renderExpenseCard = ({item}) => {
    const itemRecId = normalizeRecId(item);

    const processedItem = {
      ...item,
      recId: itemRecId,
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
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
    };

    return (
      <Pressable
        onPress={() => handleCardPress(processedItem)}
        style={({pressed}) => [
          styles.DLP_PressableCard,
          pressed && styles.DLP_PressableCardPressed,
        ]}>
        <DynamicRequestCard
          data={processedItem}
          headerConfig={CARD_CONFIG.headerConfig}
          fields={CARD_CONFIG.fields}
          buttons={getButtonConfig(item)}
          onButtonPress={handleButtonPress}
          isExpandable={true}
          gradientColors={['#6ee0ff', '#bddeff', '#cce6ff']}
          processingButtons={processingButtons[itemRecId] || []}
          isClickable={true}
          showNavigationArrow={true}
        />
      </Pressable>
    );
  };

  return (
    <ActionPaneContainer
      pageTitle="Expense Management"
      isBackButton={false}
      showFooter={true}
      showFloatingButton={true}
      isHeaderActive={true}
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={handleCreateExpense}>
      {isLoading ? (
        <View style={styles.DLP_LoadingContainer}>
          <CustomIndicator />
        </View>
      ) : (
        <Animated.View
          style={[styles.DLP_AnimatedContainer, {opacity: fadeAnim}]}>
          {expenseData.length > 0 ? (
            <FlatList
              data={expenseData}
              renderItem={renderExpenseCard}
              keyExtractor={(item, index) =>
                normalizeRecId(item)?.toString() ||
                item.ExpenseReportNumber?.toString() ||
                index.toString()
              }
              contentContainerStyle={styles.DLP_ListContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isLoading}
                  onRefresh={handleRefresh}
                />
              }
            />
          ) : (
            <ScrollView
              contentContainerStyle={styles.DLP_NoDataContainer}
              refreshControl={
                <RefreshControl
                  refreshing={isLoading}
                  onRefresh={handleRefresh}
                />
              }>
              <Text style={styles.DLP_NoDataText}>No Expense Reports</Text>
              <Text style={styles.DLP_NoDataSubText}>
                Tap the + button to create your first expense report
              </Text>
            </ScrollView>
          )}
        </Animated.View>
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

export default ExpenseManagmentListPage;
