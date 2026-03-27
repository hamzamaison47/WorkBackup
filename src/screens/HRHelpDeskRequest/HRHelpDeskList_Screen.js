/* eslint-disable curly */
/* eslint-disable no-shadow */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useCallback, useMemo} from 'react';
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

import {FindByEmployeeHRHelpDesk} from '../../API/HRHelpDeskRequest/FindByEmployeeHRHelpDesk';
import {DeleteHRHelpDeskRequest} from '../../API/HRHelpDeskRequest/DeleteHRHelpDeskRequest';

import AlertModal from '../../components/Alert/AlertModal';
import AlertDeleteModal from '../../components/Alert/AlertDeleteModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import DynamicRequestCard, {
  BUTTON_TYPES,
} from '../../components/DynamicRequestCard';
import DynamicAttachmentModal from '../../shared/DynamicAttachmentModal';

import styles from '../../styles/styles';

const HRHelpDeskListScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [allHelpDeskData, setAllHelpDeskData] = useState([]);
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

  // Attachment modal state
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [selectedHelpDeskItem, setSelectedHelpDeskItem] = useState(null);

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

  /** Fetch all help desk data */
  const fetchAllHelpDeskData = useCallback(async () => {
    if (!effectiveEmployeeId) return;
    setIsLoading(true);

    try {
      const allResults = await FindByEmployeeHRHelpDesk({
        employeeId: effectiveEmployeeId,
      });

      const sortedResults = [...allResults].sort((a, b) => {
        const aCreated = new Date(a.ProblemStartedOn || 0);
        const bCreated = new Date(b.ProblemStartedOn || 0);

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

      setAllHelpDeskData(sortedResults);
      setRawData(allResults);
      setDisplayData(allResults);
    } catch (error) {
      console.error('Error fetching HR HelpDesk data:', error);
      setAlertMessage(
        'Unable to load data. Please check your connection and try again.',
      );
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveEmployeeId]);

  useFocusEffect(
    useCallback(() => {
      fetchAllHelpDeskData();
    }, [fetchAllHelpDeskData]),
  );

  useFocusEffect(
    useCallback(() => {
      if (highlightRecId) {
        setHighlightedRecId(highlightRecId);
        fetchAllHelpDeskData();

        const timer = setTimeout(() => {
          setHighlightedRecId(null);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }, [highlightRecId, fetchAllHelpDeskData]),
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
    switch (cameFrom) {
      case 'DisplayListPage':
        navigation.reset({
          index: 0,
          routes: [{name: 'DisplayListPage'}],
        });
        break;
      case 'WorkerAssignedToMe':
        navigation.reset({
          index: 0,
          routes: [{name: 'WorkerAssignedToMe'}],
        });
        break;
      case 'MainDashboard':
      case 'DrawerNavigation':
      case 'DrawerNavigator':
      default:
        navigation.reset({
          index: 0,
          routes: [{name: 'MainDashboard'}],
        });
        break;
    }
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
    const counts = {All: displayData.length};
    [
      ...new Set(displayData.map(item => getStatusLabel(item.WFStatus))),
    ].forEach(status => {
      counts[status] = displayData.filter(
        item => getStatusLabel(item.WFStatus) === status,
      ).length;
    });
    return counts;
  };

  const visiblePills = useMemo(() => {
    if (!displayData.length) return ['All'];
    const unique = [
      ...new Set(displayData.map(item => getStatusLabel(item.WFStatus))),
    ];
    return ['All', ...unique];
  }, [displayData]);

  const handleRefresh = () => {
    fetchAllHelpDeskData();
  };

  const handleCreateRequest = () => {
    navigation.navigate('HRHelpDeskSaveScreen', {
      mode: 'create',
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: effectiveUserData,
      cameFrom: 'HRHelpDeskListScreen',
      helpDeskData: {
        EmployeeId: effectiveEmployeeId,
        DetailProblem: '',
        Division: '',
        ProblemStartedOn: '',
        RecId: '',
        RequestId: '',
        TypeOfProblems: '',
        WFStatus: '',
      },
    });
  };

  const handleReceiptAttachmentPress = async itemData => {
    try {
      const formatDateOnly = date => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
      };

      const cleanedItem = {
        ...itemData,
        ProblemStartedOn: formatDateOnly(itemData.ProblemStartedOn),
      };

      setSelectedHelpDeskItem(cleanedItem);
      setAttachmentModalVisible(true);
    } catch (error) {
      setAlertMessage('Failed to open attachments');
      setAlertModal(true);
    }
  };

  const cardConfig = {
    headerConfig: {
      title: {key: 'ESSTypeOfProblem'},
    },
    fields: [
      {
        key: 'ESSDivision',
        label: 'Division',
        type: 'text',
      },
      {
        key: 'ESSDate',
        label: 'Problem Started On',
        type: 'date',
      },
      {
        key: 'WFStatus',
        label: 'Status',
        type: 'text',
      },
    ],
    expandableFields: [
      {
        key: 'ESSHRHelpDeskRequestId',
        label: 'Request Id',
        type: 'text',
      },
      {
        key: 'Detail',
        label: 'Detail Problem',
        type: 'text',
      },
    ],
    isRTL: isRTL,
  };

  const getButtonConfig = item => {
    const isDraft = getStatusLabel(item.WFStatus) === 'Draft';
    const isRejected = getStatusLabel(item.WFStatus) === 'Rejected';

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
        show: isDraft || isRejected,
        position: 'bottom',
        style: 'approval_dropdown',
        text: isRejected ? 'Re-submit' : 'Approval',
        textColor: '#0A66C2',
        disabled: false,
        actions: [
          {
            key: 'submit',
            label: isRejected ? 'Re-submit' : 'Submit',
            icon: 'paper-plane',
          },
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
        // Submit not implemented yet for HR HelpDesk
        setAlertMessage('Submit functionality coming soon.');
        setAlertModal(true);
        break;
      case BUTTON_TYPES.ATTACHMENT:
      case 'attachment':
        handleReceiptAttachmentPress(itemData);
        break;
      default:
    }
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

  const handleEditPress = itemData => {
    navigation.navigate('HRHelpDeskSave_Screen', {
      mode: 'edit',
      employeeId: itemData.EmployeeId || effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: effectiveUserData,
      cameFrom: 'HRHelpDeskList_Screen',
      helpDeskData: {
        RecId: itemData.RecId,
        EmployeeId: itemData.EmployeeId || effectiveEmployeeId,
        DetailProblem: itemData.DetailProblem || '',
        Division: itemData.Division || '',
        ProblemStartedOn: formatToISOWithTime(itemData.ProblemStartedOn),
        RequestId: itemData.RequestId || '',
        TypeOfProblems: itemData.TypeOfProblems || '',
        WFStatus: itemData.WFStatus || '',
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
        const response = await DeleteHRHelpDeskRequest({
          recordsRecId: [itemToDelete.RecId],
        });

        const recordResult = response.find(
          r => String(r.RecId) === String(itemToDelete.RecId),
        );

        if (recordResult && recordResult.IsSuccess === 'true') {
          setAlertMessage('Record deleted successfully');
          setAllHelpDeskData(prev =>
            prev.filter(item => item.RecId !== itemToDelete.RecId),
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
          fetchAllHelpDeskData();
        }, 800);
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

  const renderHelpDeskCard = ({item}) => {
    if (!item) return null;

    const isHighlighted = highlightedRecId === item.RecId;
    const itemProcessingButtons = processingButtons[item.RecId] || [];

    // processedItem is for display only — WFStatus shown as human-readable label
    // getButtonConfig(item) keeps the original raw WFStatus for logic
    const processedItem = {
      ...item,
      WFStatus: getStatusLabel(item.WFStatus),
      ProblemStartedOn: formatDate(item.ProblemStartedOn),
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
      />
    );
  };

  return (
    <ActionPaneContainer
      pageTitle="HR HelpDesk Requests"
      showFooter
      showFloatingButton
      isHeaderActive
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={handleCreateRequest}
      showFilterPills={true}
      filterPills={visiblePills}
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
          renderItem={renderHelpDeskCard}
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
          {rawData.length === 0 && activeFilter === 'All' ? (
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
        recordData={selectedHelpDeskItem}
        recordIdKey="RecId"
        tableName="ESSHRHelpDeskRequest"
        onClose={() => {
          setAttachmentModalVisible(false);
          setSelectedHelpDeskItem(null);
        }}
        onSave={() => {
          fetchAllHelpDeskData();
        }}
        legalEntity={selectedLegalEntity}
        employeeId={effectiveEmployeeId}
        employeeName={effectiveEmployeeName}
        modalTitle="HR HelpDesk Attachments"
        showDetails={true}
        detailFields={[
          {
            key: 'RequestId',
            label: allHelpDeskData[0]?.RequestIdlbl || 'Request Id',
          },
        ]}
        detailData={selectedHelpDeskItem || {}}
        showTakePhoto={selectedHelpDeskItem?.WFStatus === 'Draft'}
        showChooseFile={selectedHelpDeskItem?.WFStatus === 'Draft'}
        showDownload={true}
        showDelete={selectedHelpDeskItem?.WFStatus === 'Draft'}
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

export default HRHelpDeskListScreen;
