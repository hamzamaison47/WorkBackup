/* eslint-disable curly */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useCallback, useEffect, useMemo} from 'react';
import {
  Text,
  FlatList,
  RefreshControl,
  BackHandler,
  ScrollView,
  I18nManager,
  View,
  ActivityIndicator,
} from 'react-native';
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';

// Components
import ActionPaneContainer from '../../../../components/ActionPaneContainer';
import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';
import DynamicRequestCard from '../../../../components/DynamicRequestCard';
import AlertModal from '../../../../components/Alert/AlertModal';
import AlertDeleteModal from '../../../../components/Alert/AlertDeleteModal';
import DynamicAttachmentModal from '../../../../shared/DynamicAttachmentModal';
import {translate as t} from '../../../../store/utils/translate';

// API
import {EmployeePersonalEducation} from '../../../../API/PersonalInformation/Education/PersonalEducation';
import {DeleteEducationDetails} from '../../../../API/PersonalInformation/Education/PersonalEducationDelete';
import {SubmitEducationRequest} from '../../../../API/PersonalInformation/Education/SubmitEducationRequest';
import {isEducationWorkflowConfigured} from '../../../../API/PersonalInformation/Education/isEducationWorkflowEnabled';

import styles from '../../../../styles/styles';

const PersonalEducationListPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const isRTL = I18nManager.isRTL;

  /* ---------- redux ---------- */
  const reduxUserData = useSelector(state => state.user.userData);
  const {selectedLegalEntity} = useSelector(state => state.company);
  const effectiveUserData = reduxUserData || {};

  const effectiveEmployeeId = effectiveUserData?.employeeId;
  const effectiveEmployeeName = effectiveUserData?.employeeName;
  const effectiveWorkerRecId = effectiveUserData?.WorkerRecId;

  const routeParams = route.params || {};
  const cameFrom = routeParams.cameFrom;

  /* ---------- state ---------- */
  const [isLoading, setIsLoading] = useState(false);
  const [educationData, setEducationData] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [highlightedRecId, setHighlightedRecId] = useState(null);
  const [processingButtons, setProcessingButtons] = useState({});
  const [isWorkflowEnabled, setIsWorkflowEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [rawData, setRawData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [sortOrder, setSortOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Attachment modal state
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [selectedEducationItem, setSelectedEducationItem] = useState(null);

  /* ---------- fetch ---------- */
  const fetchEducationData = useCallback(async () => {
    if (!effectiveEmployeeId) return;
    setIsLoading(true);
    try {
      const data = await EmployeePersonalEducation({
        employeeId: effectiveEmployeeId,
      });
      console.log('Here is the data', data);
      // Newest record on top
      data.sort((a, b) => (b.RecId || 0) - (a.RecId || 0));
      setEducationData(data);
      setRawData(data); // ← here
      setDisplayData(data); // ← here
    } catch (error) {
      console.log('Failed to fetch education details:', error);
      setAlertMessage('Failed to fetch data.');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveEmployeeId]);

  useFocusEffect(
    useCallback(() => {
      fetchEducationData();
    }, [fetchEducationData]),
  );

  /* ---------- workflow ---------- */
  const checkWorkflowConfig = useCallback(async () => {
    try {
      const res = await isEducationWorkflowConfigured();
      setIsWorkflowEnabled(res === true || res === 1);
    } catch (e) {
      setIsWorkflowEnabled(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkWorkflowConfig();
    }, [checkWorkflowConfig]),
  );

  /* ---------- highlight ---------- */
  // Copy route param into state once
  useFocusEffect(
    useCallback(() => {
      const id = route.params?.highlightRecId;
      if (id && id !== highlightedRecId) {
        setHighlightedRecId(id);
        navigation.setParams({highlightRecId: undefined});
      }
    }, [route.params?.highlightRecId, highlightedRecId, navigation]),
  );

  // Auto-clear highlight after 3s
  useFocusEffect(
    useCallback(() => {
      if (!highlightedRecId) return;
      const timer = setTimeout(() => setHighlightedRecId(null), 3000);
      return () => clearTimeout(timer);
    }, [highlightedRecId]),
  );

  /* ---------- back handler ---------- */
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
    navigation.navigate('DisplayPersonalInfo');
  };

  const handleRefresh = () => {
    fetchEducationData();
  };

  /* ---------- status ---------- */
  const getStatusLabel = status => {
    if (!status) return 'Approved'; // ← empty = Approved
    const normalizedStatus = status.replace(/\s+/g, '').toLowerCase();
    const map = {
      draft: 'Draft',
      inreview: 'In review',
      approved: 'Approved Waiting',
      waiting: 'Waiting',
      cancelled: 'Canceled',
      canceled: 'Cancelled',
      rejected: 'Rejected',
      processing: 'Processing action',
      workflowcomplete: 'WorkFlow Complete',
      failed: 'Failed',
      completed: 'Completed',
      error: 'Error',
      denied: 'Denied',
      changerequested: 'Change Requested',
      taskinreview: 'Task In Review',
      taskcompleted: 'Task Completed',
      noworkflow: '',
    };
    // Fix: return '' instead of 'Unknown' for unrecognised statuses
    return map[normalizedStatus] ?? '';
  };

  const getFilteredData = () => {
    const base = searchQuery.trim() ? displayData : rawData;
    if (activeFilter === 'All') return base;
    return base.filter(
      item => getStatusLabel(item.ApprovalStatus) === activeFilter,
    ); // ← fix
  };

  const getFilterCounts = () => {
    const counts = {All: educationData.length};
    [
      ...new Set(
        educationData.map(item => getStatusLabel(item.ApprovalStatus)),
      ),
    ].forEach(status => {
      // ← fix
      counts[status] = educationData.filter(
        item => getStatusLabel(item.ApprovalStatus) === status,
      ).length;
    });
    return counts;
  };

  const visiblePills = useMemo(() => {
    if (!educationData.length) return ['All'];
    const unique = [
      ...new Set(
        educationData.map(item => getStatusLabel(item.ApprovalStatus)),
      ), // ← fix
    ];
    return ['All', ...unique.filter(s => s !== '')];
  }, [educationData]);

  /* ---------- buttons ---------- */
  // Fix: rename param to avoid shadowing isProcessing state
  const setButtonProcessing = (recId, buttonType, isProcessingState) => {
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: isProcessingState
        ? [...(prev[recId] || []), buttonType]
        : (prev[recId] || []).filter(btn => btn !== buttonType),
    }));
  };

  const getButtonConfig = item => {
    const isDraft = getStatusLabel(item.ApprovalStatus) === 'Draft';
    const isCancelled =
      getStatusLabel(item.ApprovalStatus) === 'Cancelled' ||
      getStatusLabel(item.ApprovalStatus) === 'Canceled';
    const canDelete = isDraft || isCancelled;
    const isHCMRecord = getStatusLabel(item.ApprovalStatus) === '';
    const isRejected = getStatusLabel(item.ApprovalStatus) === 'Rejected';

    return {
      edit: {
        show: true,
        position: 'header',
        style: 'icon',
        icon: 'edit',
        iconSize: 20,
        iconColor: '#fff',
        backgroundColor: '#0A66C2',
        disabled: isHCMRecord ? false : !isDraft && !isRejected,
        customStyle:
          !isDraft && !isRejected && !isHCMRecord
            ? {backgroundColor: '#BDBDBD'}
            : {},
      },
      delete: {
        show: true,
        position: 'header',
        style: 'icon',
        icon: 'trash',
        iconSize: 20,
        iconColor: '#fff',
        backgroundColor: '#0A66C2',
        disabled: !canDelete,
        customStyle: !canDelete ? {backgroundColor: '#BDBDBD'} : {},
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
        icon: 'check-square-o',
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

  /* ---------- actions ---------- */
  const handleButtonPress = (buttonType, itemData) => {
    switch (buttonType) {
      case 'edit':
        navigation.navigate('PersonalEducationSaveRecord', {
          mode: 'edit',
          employeeId: effectiveEmployeeId,
          employeeName: effectiveEmployeeName,
          WorkerRecId: effectiveWorkerRecId,
          userData: effectiveUserData,
          cameFrom: 'PersonalEducationListPage',
          originalCameFrom: 'PersonalEducationListPage',
          educationData: itemData,
        });
        break;
      case 'delete':
        setItemToDelete(itemData);
        setDeleteModal(true);
        break;
      case 'submit':
        handleSubmitPress(itemData);
        break;
      case 'attachment':
        handleReceiptAttachmentPress(itemData);
        break;
      default:
        console.log('Unknown button type:', buttonType);
    }
  };

  /* ---------- create ---------- */
  const handleCreateEducation = () => {
    navigation.navigate('PersonalEducationSaveRecord', {
      mode: 'create',
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: effectiveUserData,
      cameFrom: 'PersonalEducationListPage',
      originalCameFrom: 'PersonalEducationListPage',
      educationData: {
        Education: '',
        Description: '',
        DurationUnit: '',
        Duration: '',
        StartDate: '',
        EndDate: '',
        Notes: '',
      },
    });
  };

  /* ---------- delete ---------- */
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setDeleteModal(false);

    setTimeout(async () => {
      setIsProcessing(true);
      setButtonProcessing(itemToDelete.RecId, 'delete', true);

      try {
        const response = await DeleteEducationDetails({
          recordsRecId: [itemToDelete.RecId],
        });
        if (response[0]?.IsSuccess) {
          setAlertMessage('Record deleted successfully.');
          // Fix: filter using RecId (uppercase) consistently
          setEducationData(prev =>
            prev.filter(ed => ed.RecId !== itemToDelete.RecId),
          );
        } else {
          setAlertMessage('Failed to delete record.');
        }
      } catch (error) {
        console.error('DeleteEducationDetails error:', error);
        setAlertMessage('Failed to delete record');
      } finally {
        setIsProcessing(false);
        setButtonProcessing(itemToDelete.RecId, 'delete', false);
        setItemToDelete(null);
        setAlertModal(true);

        setTimeout(() => {
          fetchEducationData();
        }, 800);
      }
    }, 100);
  };

  /* ---------- submit ---------- */
  const handleSubmitPress = async itemData => {
    setIsProcessing(true);
    setButtonProcessing(itemData.RecId, 'submit', true);

    try {
      const response = await SubmitEducationRequest({
        recId: itemData.RecId,
      });

      const res = Array.isArray(response) ? response[0] : response;

      if (String(res?.IsSuccess).toLowerCase() === 'true') {
        setAlertMessage('Request submitted successfully.');
        setAlertModal(true);

        // Fix: use RecId (uppercase) consistently
        setHighlightedRecId(itemData.RecId);

        setTimeout(() => setHighlightedRecId(null), 3000);
        setTimeout(() => fetchEducationData(), 1000);
      } else {
        setAlertMessage(res?.Message || 'Failed to submit request.');
        setAlertModal(true);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setAlertMessage('Failed to submit request.');
      setAlertModal(true);
    } finally {
      setIsProcessing(false);
      // Fix: use RecId (uppercase) consistently
      setButtonProcessing(itemData.RecId, 'submit', false);
    }
  };

  /* ---------- attachment ---------- */
  const handleReceiptAttachmentPress = async itemData => {
    try {
      setSelectedEducationItem(itemData);
      setAttachmentModalVisible(true);
    } catch (error) {
      setAlertMessage('Failed to open attachments');
      setAlertModal(true);
    }
  };

  /* ---------- card ---------- */
  const cardConfig = {
    headerConfig: {title: {key: 'EducationDisciplineId', label: 'Education'}},
    fields: [
      {key: 'Description', label: 'Description', type: 'text'},
      {key: 'DurationUnit', label: 'Duration Unit', type: 'text'},
      {key: 'Duration', label: 'Duration', type: 'number'},
      {key: 'ApprovalStatus', label: '', type: 'status'},
    ],
    expandableFields: [
      {key: 'StartDate', label: 'Start Date', type: 'date'},
      {key: 'EndDate', label: 'End Date', type: 'date'},
      {key: 'Notes', label: 'Notes', type: 'text'},
    ],
    isRTL: isRTL,
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

  const renderEducationCard = ({item}) => {
    const updatedItem = {...item, EducationTitle: 'Education'};
    return (
      <DynamicRequestCard
        data={updatedItem}
        headerConfig={cardConfig.headerConfig}
        fields={cardConfig.fields}
        expandableFields={cardConfig.expandableFields}
        buttons={getButtonConfig(item)}
        onButtonPress={handleButtonPress}
        isExpandable
        gradientColors={['#6ee0ff', '#bddeff', '#cce6ff']}
        highlightGradientColors={['#E8F5E8', '#F0FFF0']}
        isHighlighted={highlightedRecId === item.RecId}
        processingButtons={processingButtons[item.RecId] || []}
        isRTL={isRTL}
        searchQuery={searchQuery}
      />
    );
  };

  return (
    <ActionPaneContainer
      pageTitle="Education Details"
      isBackButton={false}
      showFooter={true}
      showFloatingButton={isWorkflowEnabled}
      isHeaderActive={true}
      showTabNavigator={true}
      onFloatingButtonPress={handleCreateEducation}
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
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
          renderItem={renderEducationCard}
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

      {/* Attachment Modal */}
      <DynamicAttachmentModal
        visible={attachmentModalVisible}
        recordData={selectedEducationItem}
        recordIdKey="RecId"
        tableName="EssPersonEducation"
        onClose={() => {
          setAttachmentModalVisible(false);
          setSelectedEducationItem(null);
        }}
        onSave={() => {
          fetchEducationData();
        }}
        legalEntity={selectedLegalEntity}
        employeeId={effectiveEmployeeId}
        employeeName={effectiveEmployeeName}
        modalTitle="Education Attachments"
        showDetails={true}
        detailFields={[
          {key: 'EducationDisciplineId', label: 'Education'},
          {key: 'Description', label: 'Description'},
        ]}
        detailData={selectedEducationItem || {}}
        showTakePhoto={
          getStatusLabel(selectedEducationItem?.ApprovalStatus) === 'Draft' ||
          getStatusLabel(selectedEducationItem?.ApprovalStatus) === ''
        }
        showChooseFile={
          getStatusLabel(selectedEducationItem?.ApprovalStatus) === 'Draft' ||
          getStatusLabel(selectedEducationItem?.ApprovalStatus) === ''
        }
        showDownload={true}
        showDelete={
          getStatusLabel(selectedEducationItem?.ApprovalStatus) === 'Draft' ||
          getStatusLabel(selectedEducationItem?.ApprovalStatus) === ''
        }
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
        text="Are you sure you want to delete this record?"
        onPress={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModal(false);
          setItemToDelete(null);
        }}
      />
    </ActionPaneContainer>
  );
};

export default PersonalEducationListPage;
