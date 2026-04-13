/* eslint-disable curly */
/* eslint-disable no-shadow */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useCallback, useMemo, useEffect} from 'react';
import {
  Text,
  FlatList,
  BackHandler,
  RefreshControl,
  ScrollView,
  I18nManager,
  View,
  ActivityIndicator,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {translate as t} from '../../store/utils/translate';
import {useSelector} from 'react-redux';

import {DeleteAdvanceRequest} from '../../API/EmployeeAdvanceRequest/DeleteAdvanceRequest';
import {SubmitAdvanceRequest} from '../../API/EmployeeAdvanceRequest/SubmitAdvanceRequest';
import {FindByEmployeeAdvanceRequest} from '../../API/EmployeeAdvanceRequest/FindByEmployeeAdvanceRequest';

import AlertModal from '../../components/Alert/AlertModal';
import AlertDeleteModal from '../../components/Alert/AlertDeleteModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import DynamicRequestCard, {
  BUTTON_TYPES,
} from '../../components/DynamicRequestCard';
import DynamicAttachmentModal from '../../shared/DynamicAttachmentModal';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [rawData, setRawData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [sortOrder, setSortOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  // const [typeSelectionModal, setTypeSelectionModal] = useState(false);

  // Attachment modal state
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [selectedAdvanceItem, setSelectedAdvanceItem] = useState(null);

  const navigation = useNavigation();
  const route = useRoute();
  const isRTL = I18nManager.isRTL;

  const {selectedLegalEntity} = useSelector(state => state.company);

  const {
    employeeId,
    employeeName,
    WorkerRecId,
    cameFrom = 'MainDashboard',
    highlightRecId = null,
    userData: routeUserData,
  } = route.params || {};

  const reduxUserData = useSelector(state => state.user.userData);
  const effectiveUserData = routeUserData || reduxUserData;

  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
  const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;
  const effectiveWorkerRecId = WorkerRecId || effectiveUserData?.WorkerRecId;

  /** Fetch all advance data */
  const fetchAllAdvanceData = useCallback(async () => {
    if (!effectiveEmployeeId) return;
    setIsLoading(true);

    try {
      const allResults = await FindByEmployeeAdvanceRequest({employeeId});

      const filteredResults = allResults.filter(item => {
        const type = item.AdvanceTypeCode?.toLowerCase() || '';
        return !type.includes('expense');
      });

      const sortedResults = filteredResults.sort((a, b) => {
        const aCreated = new Date(a.CreatedDateTime || a.RequestDate || 0);
        const bCreated = new Date(b.CreatedDateTime || b.RequestDate || 0);

        if (!isNaN(aCreated.getTime()) && !isNaN(bCreated.getTime())) {
          if (bCreated.getTime() !== aCreated.getTime()) {
            return bCreated - aCreated;
          }
        }

        const aRecId = parseInt(a.RecId, 10);
        const bRecId = parseInt(b.RecId, 10);

        if (!isNaN(aRecId) && !isNaN(bRecId)) {
          return bRecId - aRecId;
        }

        return 0;
      });

      setAllAdvanceData(sortedResults);
      setRawData(allResults); // ← here
      setDisplayData(allResults); // ← here
    } catch (error) {
      console.error('Error fetching advance data:', error);
      setAlertMessage(
        'Unable to load data. Please check your connection and try again.',
      );
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveEmployeeId, employeeId]);

  useFocusEffect(
    useCallback(() => {
      fetchAllAdvanceData();
    }, [fetchAllAdvanceData]),
  );

  useFocusEffect(
    useCallback(() => {
      if (highlightRecId) {
        setHighlightedRecId(highlightRecId);
        fetchAllAdvanceData();

        const timer = setTimeout(() => {
          setHighlightedRecId(null);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }, [highlightRecId, fetchAllAdvanceData]),
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
    let targetRoute = 'MainDashboard';

    switch (cameFrom) {
      case 'MainDashboard':
        targetRoute = 'MainDashboard';
        break;
      case 'DisplayListPage':
        targetRoute = 'DisplayListPage';
        break;
      case 'DrawerNavigation':
      case 'DrawerNavigator':
        targetRoute = 'MainDashboard';
        break;
      case 'WorkerAssignedToMe':
        targetRoute = 'WorkerAssignedToMe';
        break;
      default:
        navigation.goBack();
        return;
    }

    navigation.reset({
      index: 0,
      routes: [{name: targetRoute}],
    });
  };

  // const getFilteredData = () => {
  //   if (activeFilter === 'All') return allAdvanceData;

  //   return allAdvanceData.filter(item => {
  //     const status = getStatusLabel(item.WFStatus);

  //     // Special handling for Pending filter - include any status that contains "Pending"
  //     if (activeFilter === 'Pending') {
  //       return status.includes('Pending'); // This will match "Pending Approval", "Pending", etc.
  //     }

  //     return status === activeFilter;
  //   });
  // };

  const handleRefresh = () => {
    fetchAllAdvanceData();
  };

  const handleCreateRequest = () => {
    navigation.navigate('GenericAdvanceSaveScreen', {
      mode: 'create',
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: effectiveUserData,
      cameFrom: 'GenericAdvanceListScreen',
      requestType: 'Loan',
      advanceType: 0,
      screenName: 'Loan Request',
      advanceData: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
        RecId: '',
        AdvanceTypeCode: '',
        AdvanceAmount: '0.00',
        RequestedPaymentDate: '',
        RecoveryStartDate: '',
        RequestedInstallmentAmount: '0.00',
        RequestedInstallments: '0',
        AdvanceDescription: '',
        Guarantor1: '',
        Guarantor2: '',
      },
    });
  };

  const getRequestTypeFromData = itemData => {
    if (!itemData || !itemData.AdvanceTypeCode) {
      return {type: 'Loan', advanceType: 0, screenName: 'Loan Request'};
    }

    const advanceTypeCode = itemData.AdvanceTypeCode.toLowerCase();

    if (
      advanceTypeCode.includes('loan') ||
      advanceTypeCode.includes('company loan')
    ) {
      return {type: 'Loan', advanceType: 0, screenName: 'Loan Request'};
    } else if (
      advanceTypeCode.includes('advance') ||
      advanceTypeCode.includes('salary')
    ) {
      return {type: 'Advance', advanceType: 1, screenName: 'Advance Salary'};
    }

    return {type: 'Loan', advanceType: 0, screenName: 'Loan Request'};
  };

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

  const getFilteredData = () => {
    const base = searchQuery.trim() ? displayData : rawData;
    if (activeFilter === 'All') return base;
    return base.filter(item => getStatusLabel(item.WFStatus) === activeFilter);
  };

  const getFilterCounts = () => {
    const counts = {All: allAdvanceData.length};
    [
      ...new Set(allAdvanceData.map(item => getStatusLabel(item.WFStatus))),
    ].forEach(status => {
      counts[status] = allAdvanceData.filter(
        item => getStatusLabel(item.WFStatus) === status,
      ).length;
    });
    return counts;
  };

  const visiblePills = useMemo(() => {
    if (!allAdvanceData.length) return ['All'];
    const unique = [
      ...new Set(allAdvanceData.map(item => getStatusLabel(item.WFStatus))),
    ];
    return ['All', ...unique];
  }, [allAdvanceData]);

  // Handle attachment button press (mirrors LeaveRequestListPage logic)
  const handleReceiptAttachmentPress = async itemData => {
    try {
      const formatDateOnly = date => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
      };

      const cleanedItem = {
        ...itemData,
        RequestedPaymentDate: formatDateOnly(itemData.RequestedPaymentDate),
        RecoveryStartDate: formatDateOnly(itemData.RecoveryStartDate),
        RequestDate: formatDateOnly(itemData.RequestDate),
      };

      setSelectedAdvanceItem(cleanedItem);
      setAttachmentModalVisible(true);
    } catch (error) {
      setAlertMessage('Failed to open attachments');
      setAlertModal(true);
    }
  };

  const cardConfig = {
    headerConfig: {
      title: {key: 'AdvanceTypeCode'},
      subtitle: {key: 'employeeName'},
    },
    fields: [
      {
        key: 'AdvanceAmount',
        label: allAdvanceData[0]?.AdvanceAmountlbl || 'Amount',
        type: 'currency',
      },
      {
        key: 'RequestedPaymentDate',
        label: allAdvanceData[0]?.RequestedPaymentDatelbl || 'Payment Date',
        type: 'date',
      },
      {
        key: 'RecoveryStartDate',
        label: allAdvanceData[0]?.RecoveryStartDatelbl || 'Recovery Start Date',
        type: 'date',
      },
      {
        key: 'WFStatus',
        label: allAdvanceData[0]?.WFStatuslbl || 'Workflow status',
        type: 'status',
      },
    ],
    expandableFields: [
      {
        key: 'AdvanceRequestId',
        label: allAdvanceData[0]?.AdvanceRequestIdlbl || 'Request Id',
        type: 'text',
      },
      {
        key: 'RequestDate',
        label: allAdvanceData[0]?.RequestDatelbl || 'Request Date',
        type: 'date',
      },
      {
        key: 'RequestedInstallmentAmount',
        label:
          allAdvanceData[0]?.RequestedInstallmentAmountlbl || 'Recovery Amount',
        type: 'text',
      },
      {
        key: 'RequestedInstallments',
        label: allAdvanceData[0]?.recoverieslbl || 'Recoveries',
        type: 'text',
      },
    ],
    isRTL: isRTL,
  };

  const getButtonConfig = item => {
    const statusLabel = getStatusLabel(item.WFStatus);
    const isDraft = statusLabel === 'Draft';
    const isRejected = statusLabel === 'Rejected';

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
      attachment: {
        show: true,
        position: 'header',
        style: 'icon',
        icon: 'paperclip',
        iconSize: 20,
        iconColor: '#fff',
        backgroundColor: '#0A66C2',
        disabled: false,
        customStyle: {},
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

  const setButtonProcessing = (recId, buttonType, isProcessing) => {
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: isProcessing
        ? [...(prev[recId] || []), buttonType]
        : (prev[recId] || []).filter(btn => btn !== buttonType),
    }));
  };

  const handleButtonPress = (buttonType, itemData) => {
    if (!itemData) {
      setAlertMessage('Invalid item data. Please refresh and try again.');
      setAlertModal(true);
      return;
    }

    switch (buttonType) {
      case BUTTON_TYPES.EDIT:
      case 'edit':
        handleEditPress(itemData);
        break;
      case BUTTON_TYPES.DELETE:
      case 'delete':
        handleDeletePress(itemData);
        break;
      case BUTTON_TYPES.SUBMIT:
      case 'submit':
        handleSubmitPress(itemData);
        break;
      case BUTTON_TYPES.ATTACHMENT:
      case 'attachment':
        handleReceiptAttachmentPress(itemData);
        break;
      case 'viewHistory': // ← add this
        handleViewHistory(itemData);
        break;
      default:
    }
  };

  const handleViewHistory = itemData => {
    navigation.navigate('WorkflowHistoryScreen', {
      recId: itemData.RecId,
      tableId: itemData.TableId,
      cameFrom: 'GenericAdvanceListScreen',
    });
  };

  const formatDate = date => {
    if (!date) return '';
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
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
    const num = Number(value.toString().replace(/,/g, ''));
    if (isNaN(num)) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleEditPress = itemData => {
    const requestTypeInfo = getRequestTypeFromData(itemData);

    navigation.navigate('GenericAdvanceSaveScreen', {
      mode: 'edit',
      employeeId: itemData.employeeId || effectiveEmployeeId,
      employeeName: itemData.employeeName || effectiveEmployeeName,
      WorkerRecId: itemData.WorkerRecId || effectiveWorkerRecId,
      userData: effectiveUserData,
      cameFrom: 'GenericAdvanceListScreen',
      originalCameFrom: cameFrom,
      requestType: requestTypeInfo.type,
      advanceType: requestTypeInfo.advanceType,
      screenName: requestTypeInfo.screenName,
      advanceData: {
        RecId: itemData.RecId,
        employeeId: itemData.employeeId || effectiveEmployeeId,
        employeeName: itemData.employeeName || effectiveEmployeeName,
        WorkerRecId: itemData.WorkerRecId || effectiveWorkerRecId,
        AdvanceTypeCode: itemData.AdvanceTypeCode,
        AdvanceAmount: itemData.AdvanceAmount,
        RequestedPaymentDate: formatToISOWithTime(
          itemData.RequestedPaymentDate,
        ),
        RecoveryStartDate: formatToISOWithTime(itemData.RecoveryStartDate),
        RequestedInstallmentAmount: itemData.RequestedInstallmentAmount,
        RequestedInstallments: itemData.RequestedInstallments,
        AdvanceDescription: itemData.AdvanceDescription,
        Guarantor1: itemData.Guarantor1,
        Guarantor2: itemData.Guarantor2,
      },
    });
  };

  const handleDeletePress = itemData => {
    setItemToDelete(itemData);
    setDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setDeleteModal(false);

    setTimeout(async () => {
      setIsProcessing(true);
      setButtonProcessing(itemToDelete.RecId, 'delete', true);

      try {
        const response = await DeleteAdvanceRequest({
          recordsRecId: [itemToDelete.RecId],
        });

        const recordResult = response.find(
          r => String(r.RecId) === String(itemToDelete.RecId),
        );

        if (recordResult && recordResult.IsSuccess === 'true') {
          setAlertMessage('Record deleted successfully');
          setAllAdvanceData(prev =>
            prev.filter(adv => adv.RecId !== itemToDelete.RecId),
          );
        } else {
          setAlertMessage('Unable to delete record. Please try again.');
        }
      } catch (error) {
        setAlertMessage('Failed to delete record');
      } finally {
        setIsProcessing(false);
        setButtonProcessing(itemToDelete.RecId, 'delete', false);
        setItemToDelete(null);
        setAlertModal(true);

        setTimeout(() => {
          fetchAllAdvanceData();
        }, 800);
      }
    }, 100);
  };

  const handleSubmitPress = async itemData => {
    setTimeout(async () => {
      setIsProcessing(true);
      setButtonProcessing(itemData.RecId, 'submit', true);
      try {
        const response = await SubmitAdvanceRequest({recId: itemData.RecId});
        const resObj = Array.isArray(response) ? response[0] : response;

        if (resObj && String(resObj.IsSuccess).toLowerCase() === 'true') {
          setAlertMessage('Request submitted successfully');
          setAlertModal(true);

          setHighlightedRecId(itemData.RecId);

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
              : 'Failed to submit request';
          setAlertMessage(errorMessage);
          setAlertModal(true);
        }
      } catch (error) {
        console.error('Submit error:', error);
        setAlertMessage('Failed to submit request');
        setAlertModal(true);
      } finally {
        setIsProcessing(false);
        setButtonProcessing(itemData.RecId, 'submit', false);
      }
    }, 100);
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
        isRTL={isRTL}
        searchQuery={searchQuery}
      />
    );
  };

  return (
    <ActionPaneContainer
      pageTitle="Loan Requests"
      showFooter
      showFloatingButton
      isHeaderActive
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={handleCreateRequest}
      showFilterPills={true}
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
      ) : getFilteredData().length > 0 ? (
        <FlatList
          data={getFilteredData()}
          renderItem={renderAdvanceCard}
          keyExtractor={(item, index) =>
            item.RecId?.toString() || index.toString()
          }
          contentContainerStyle={styles.DLP_ListContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.DLP_NoDataContainer}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }>
          {searchQuery.trim() ? (
            // Search returned no results
            <>
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
            <>
              <Text style={styles.DLP_NoDataText}>
                {`${activeFilter} record not found.`}
              </Text>
            </>
          )}
        </ScrollView>
      )}

      {/* Attachment Modal */}
      <DynamicAttachmentModal
        visible={attachmentModalVisible}
        recordData={selectedAdvanceItem}
        recordIdKey="RecId"
        tableName="PREmployeeAdvanceRequests"
        onClose={() => {
          setAttachmentModalVisible(false);
          setSelectedAdvanceItem(null);
        }}
        onSave={() => {
          fetchAllAdvanceData();
        }}
        legalEntity={selectedLegalEntity}
        employeeId={effectiveEmployeeId}
        employeeName={effectiveEmployeeName}
        modalTitle="Loan Request Attachments"
        showDetails={true}
        detailFields={[
          {
            key: 'AdvanceRequestId',
            label: allAdvanceData[0]?.AdvanceRequestIdlbl || 'Request Id',
          },
        ]}
        detailData={selectedAdvanceItem || {}}
        showTakePhoto={selectedAdvanceItem?.WFStatus === 'Draft'}
        showChooseFile={selectedAdvanceItem?.WFStatus === 'Draft'}
        showDownload={true}
        showDelete={selectedAdvanceItem?.WFStatus === 'Draft'}
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
        text={'Are you sure you want to delete this record?'}
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
