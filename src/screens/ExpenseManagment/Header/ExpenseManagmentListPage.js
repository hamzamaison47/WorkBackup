/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useCallback, useState, useMemo, useEffect} from 'react';
import {
  Text,
  RefreshControl,
  ScrollView,
  FlatList,
  Pressable,
  BackHandler,
  Animated,
  View,
  ActivityIndicator,
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
import {translate as t} from '../../../store/utils/translate';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [rawData, setRawData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [sortOrder, setSortOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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

      console.log('here is the data', myExpenseHeaderData);

      const sortedData = (myExpenseHeaderData || []).sort((a, b) => {
        const dateA = new Date(a.createdDateTime || a.CreatedDate || 0);
        const dateB = new Date(b.createdDateTime || b.CreatedDate || 0);
        return dateB - dateA;
      });

      setExpenseData(sortedData);
      setRawData(sortedData); // ← here
      setDisplayData(sortedData); // ← here

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      setAlertMessage('Failed to fetch data.');
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
      routes: [{name: targetRoute}],
    });
  };

  const getFilteredData = () => {
    const base = searchQuery.trim() ? displayData : rawData;
    if (activeFilter === 'All') return base;
    return base.filter(
      item => getStatusLabel(item.DocumentStatus) === activeFilter,
    ); // ← fix
  };

  const getFilterCounts = () => {
    const counts = {All: expenseData.length};
    [
      ...new Set(expenseData.map(item => getStatusLabel(item.DocumentStatus))),
    ].forEach(status => {
      // ← fix
      counts[status] = expenseData.filter(
        item => getStatusLabel(item.DocumentStatus) === status,
      ).length;
    });
    return counts;
  };

  const visiblePills = useMemo(() => {
    if (!expenseData.length) return ['All'];
    const unique = [
      ...new Set(expenseData.map(item => getStatusLabel(item.DocumentStatus))), // ← fix
    ];
    return ['All', ...unique];
  }, [expenseData]);

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

  const getButtonConfig = item => {
    const isDraft = item.DocumentStatus === 'Draft';
    const isRejected = getStatusLabel(item.DocumentStatus) === 'Rejected';

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
      approval: {
        show: true, // ← always visible
        position: 'bottom',
        style: 'approval_dropdown',
        text: isRejected ? 'Re-submit' : 'Approval',
        icon: 'check-square',
        textColor: '#0A66C2',
        disabled: false,
        actions: [
          // Submit: only on Draft or Rejected
          ...(isDraft || isRejected
            ? [
                {
                  key: 'submit',
                  label: isRejected ? 'Re-submit' : 'Submit',
                  icon: 'send',
                },
              ]
            : []),

          // View History: every status except Draft
          ...(!isDraft
            ? [
                {
                  key: 'viewHistory',
                  label: 'View History',
                  icon: 'clock',
                },
              ]
            : []),
        ],
      },
    };
  };

  const handleButtonPress = (buttonType, item) => {
    if (buttonType === 'edit') handleEditPress(item);
    else if (buttonType === 'delete') handleDeletePress(item);
    else if (buttonType === 'submit') handleSubmitPress(item);
    else if (buttonType === 'viewHistory') handleViewHistory(item); // ← add
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

    setTimeout(async () => {
      setIsProcessing(true);
      setButtonProcessing(itemData.RecId, 'submit', true);

      try {
        const result = await SubmitExpenseReportsToWorkflow({
          expenseReportNumberList: [itemData.ExpenseReportNumber],
          legalEntity: selectedLegalEntity,
        });
        console.log('here is theresult', result);

        if (result.success) {
          setAlertMessage('Request submitted successfully.');
          setAlertModal(true); // ADD THIS - Show the alert modal
          setTimeout(() => fetchExpenseData(), 1000);
        } else {
          // This will show exactly what the API sent
          setAlertMessage(result.message);
          setAlertModal(true); // ADD THIS - Show the alert modal
          console.log('API error message:', result.message);
        }
      } catch (error) {
        setAlertMessage(`Failed to submit request: ${error.message}`);
        setAlertModal(true); // ADD THIS - Show the alert modal
      } finally {
        setIsProcessing(false);
        setButtonProcessing(itemData.recId, 'submit', false);
      }
    }, 100);
  };

  const handleViewHistory = item => {
    navigation.navigate('WorkflowHistoryScreen', {
      recId: normalizeRecId(item),
      tableId: item.TableId,
      cameFrom: 'ExpenseManagmentListPage',
    });
    console.log('Here is the Sending data', item.recId, item.TableId);
  };

  const handleDeleteConfirm = async () => {
    const itemRecId = normalizeRecId(itemToDelete);
    // setButtonProcessing(itemRecId, 'delete', true);

    setDeleteModal(false);

    // Small delay to ensure modal is closed before showing processing overlay
    setTimeout(async () => {
      setIsProcessing(true); // Show processing overlay
      setButtonProcessing(itemToDelete.recId, 'delete', true);

      try {
        const result = await DeleteExpenseReports({
          employeeId: effectiveEmployeeId,
          expenseReportNumbers: [itemToDelete.ExpenseReportNumber],
          legalEntity: selectedLegalEntity,
        });

        if (result.success) {
          setAlertMessage('Record deleted successfully');
          setExpenseData(prev =>
            prev.filter(exp => normalizeRecId(exp) !== itemRecId),
          );
        } else {
          setAlertMessage('Unable to delete record. Please try again.');
        }
      } catch (error) {
        setAlertMessage('Failed to delete record. Please try again.');
      } finally {
        setIsProcessing(false); // Hide processing overlay
        setButtonProcessing(itemToDelete.recId, 'delete', false);
        setItemToDelete(null);
        setAlertModal(true);

        setTimeout(() => {
          fetchExpenseData();
        }, 800);
      }
    }, 100); // Small delay to ensure modal closes first
  };

  const handleRefresh = () => {
    setIsLoading(true);
    fetchExpenseData();
  };

  const applySearchAndSort = useCallback((data, query, sort) => {
    let result = [...data];

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(item =>
        Object.values(item).some(val =>
          String(val ?? '')
            .toLowerCase()
            .includes(q),
        ),
      );
    }

    if (sort) {
      result.sort((a, b) => {
        const getDate = obj => {
          for (const val of Object.values(obj)) {
            const d = new Date(val);
            if (!isNaN(d.getTime())) return d;
          }
          return new Date(0);
        };
        const diff = getDate(a) - getDate(b);
        return sort === 'asc' ? diff : -diff;
      });
    }

    setDisplayData(result);
  }, []);

  const handleSearch = query => {
    setSearchQuery(query);
    applySearchAndSort(rawData, query, sortOrder);
  };

  const handleSort = sort => {
    setSortOrder(sort);
    applySearchAndSort(rawData, searchQuery, sort);
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
      <DynamicRequestCard
        data={processedItem}
        headerConfig={CARD_CONFIG.headerConfig}
        fields={CARD_CONFIG.fields}
        buttons={getButtonConfig(item)}
        onButtonPress={handleButtonPress}
        onPress={() => handleCardPress(processedItem)}
        isExpandable={true}
        gradientColors={['#b8f5d4', '#d4f0e8', '#dff4ff']}
        processingButtons={processingButtons[item.RecId] || []}
        showNavigationArrow={true}
        searchQuery={searchQuery}
      />
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
      onFloatingButtonPress={handleCreateExpense}
      showFilterPills={true} // ← this is missing
      filterPills={visiblePills} // ← add this
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      filterCounts={getFilterCounts()}
      showPageTitleRow={true}
      showSearchBar={true}
      onSearchChange={handleSearch}
      onSortChange={handleSort}
      activeSortOrder={sortOrder}>
      {isProcessing && (
        <View style={styles.DLP_ProcessingOverlay}>
          <View style={styles.DLP_ProcessingContainer}>
            <ActivityIndicator size="large" color="#0A66C2" />
            <Text style={styles.DLP_ProcessingText}>
              {t('common.processing')}
            </Text>
          </View>
        </View>
      )}
      {isLoading ? (
        <View style={styles.DLP_LoadingContainer}>
          <CustomIndicator />
        </View>
      ) : (
        <Animated.View
          style={[styles.DLP_AnimatedContainer, {opacity: fadeAnim}]}>
          {getFilteredData().length > 0 ? (
            <FlatList
              data={getFilteredData()}
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
              {searchQuery.trim() ? (
                <>
                  {/* <Text style={styles.DLP_NoDataText}>No results found</Text> */}
                  <Text style={styles.DLP_NoDataSubText}>
                    No records match "{searchQuery}"
                  </Text>
                </>
              ) : rawData.length === 0 && activeFilter === 'All' ? (
                <>
                  <Text style={styles.DLP_NoDataText}>Get started</Text>
                  <Text style={styles.DLP_NoDataSubText}>
                    Tap + to add a new record
                  </Text>
                </>
              ) : (
                <Text style={styles.DLP_NoDataText}>
                  {`${activeFilter} record not found.`}
                </Text>
              )}
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
