/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
import React, {useState, useCallback} from 'react';
import {
  Text,
  FlatList,
  BackHandler,
  RefreshControl,
  I18nManager,
  View,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';

import AlertModal from '../../components/Alert/AlertModal';
import AlertDeleteModal from '../../components/Alert/AlertDeleteModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import DynamicRequestCard from '../../components/DynamicRequestCard';
import styles from '../../styles/styles';
import {useSelector} from 'react-redux';
import {translate as t} from '../../store/utils/translate';

import {employeeEOSRequestfindbyEmployee} from '../../API/EmployeeEOSRequest/EmployeeEOSRequestfindbyEmployee';
import useListFilters from '../../hooks/useListFilters';

const EmployeeEOSRequestListPage = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    employeeId,
    employeeName,
    WorkerRecId,
    cameFrom,
    highlightRecId,
    userData: routeUserData,
  } = route.params || {};

  const {menuItems} = useSelector(state => state.menuItem);
  const reduxUserData = useSelector(state => state.user.userData);
  const effectiveUserData = routeUserData || reduxUserData;
  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
  const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;
  const effectiveWorkerRecId = WorkerRecId || effectiveUserData?.WorkerRecId;

  const isRTL = I18nManager.isRTL;

  const [isLoading, setIsLoading] = useState(false);
  const [EOSRequestData, setEOSRequestData] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [highlightedRecId, setHighlightedRecId] = useState(null);
  const [processingButtons, setProcessingButtons] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isWorkflowConfigured, setIsWorkflowConfigured] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchEmployeeEosRequest = useCallback(async () => {
    if (!effectiveEmployeeId) return;

    setIsLoading(true);
    try {
      const data = await employeeEOSRequestfindbyEmployee({
        employeeId: effectiveEmployeeId,
      });
      setEOSRequestData(data);
    } catch (error) {
      setAlertMessage(t('EmployeeEOSData.fetchFailed'));
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveEmployeeId]);

  useFocusEffect(
    useCallback(() => {
      fetchEmployeeEosRequest();
    }, [fetchEmployeeEosRequest]),
  );

  useFocusEffect(
    useCallback(() => {
      if (highlightRecId) {
        setHighlightedRecId(highlightRecId);
        fetchEmployeeEosRequest();
        const timer = setTimeout(() => setHighlightedRecId(null), 3000);
        return () => clearTimeout(timer);
      }
    }, [highlightRecId, fetchEmployeeEosRequest]),
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
    }, [handleGoBack, navigation]),
  );

  // ── Navigation ─────────────────────────────────────────────────────────────
  const handleGoBack = () => {
    let targetRoute = 'MainDashboard';
    switch (cameFrom) {
      case 'MainDashboard':
      case 'DrawerNavigator':
        targetRoute = 'MainDashboard';
        break;
      case 'DisplayListPage':
        targetRoute = 'DisplayListPage';
        break;
      case 'WorkerAssignedToMe':
        targetRoute = 'WorkerAssignedToMe';
        break;
      default:
        if (navigation.canGoBack()) {
          navigation.goBack();
          return;
        }
        targetRoute = 'MainDashboard';
        return;
    }
    navigation.reset({index: 0, routes: [{name: targetRoute}]});
  };

  const handleRefresh = () => fetchEmployeeEosRequest();

  const handleAddEOSRequest = () => {
    navigation.navigate('EmployeeEOS_SaveRecord', {
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      cameFrom: 'EmployeeEOSRequestListPage',
      userData: effectiveUserData,
    });
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getPageLabel = () => {
    const currentMenuItem = menuItems.find(
      item => item.MenuId === 'EmployeeEOSRequestListPage',
    );
    return currentMenuItem?.Label || t('EmployeeEOSRequestListPage.pageTitle');
  };

  const getStatusLabel = status => {
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

  const formatDate = date => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  // ── Filter/search/sort now owned by useListFilters (no pills on this screen).
  //    Date filter + sort key off CreatedDateTime, resolved case-insensitively.
  //    Header Date+Sort trigger only. ─────────────────────────────────────────
  const f = useListFilters({
    data: EOSRequestData,
    dateField: 'CreatedDateTime',
  });

  // ── Button Config ──────────────────────────────────────────────────────────
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
      submit: {
        show: isWorkflowConfigured && isDraft,
        position: 'bottom',
        style: 'text',
        icon: 'send',
        iconSize: 16,
        text: t('buttons.submit'),
        textColor: '#0A66C2',
        iconColor: '#0A66C2',
      },
      clearance: {
        show: true,
        position: 'bottom',
        style: 'text',
        icon: 'check-circle',
        iconSize: 16,
        text: 'Clearance',
        textColor: '#0A66C2',
        iconColor: '#0A66C2',
      },
    };
  };

  // ── Button Press Handler ───────────────────────────────────────────────────
  const handleButtonPress = (buttonType, itemData) => {
    switch (buttonType) {
      case 'clearance':
        navigation.navigate('EmployeeEOSClearanceItemsListPage', {
          employeeId: effectiveEmployeeId,
          employeeName: effectiveEmployeeName,
          WorkerRecId: effectiveWorkerRecId,
          recId: itemData?.RecId,
          cameFrom: 'EmployeeEOSRequestListPage',
          userData: effectiveUserData,
        });
        break;
      default:
        console.log('Unknown button pressed:', buttonType);
    }
  };

  // ── Card Config & Render ───────────────────────────────────────────────────
  const cardConfig = {
    headerConfig: {
      title: {key: 'EOSRequestId'},
    },
    fields: [
      {key: 'EmployeePersonnelNumber', label: 'Employee Id', type: 'text'},
      {key: 'EmployeeName', label: 'Employee Name', type: 'text'},
      {key: 'EOSType', label: 'EOS Type', type: 'text'},
      {key: 'NoticePeriodCode', label: 'Notice Period Code', type: 'text'},
    ],
    expandableFields: [
      {key: 'EOSNotificationDate', label: 'Notification Date', type: 'date'},
      {
        key: 'LastWorkingDate_Actual',
        label: 'Last Working Date Requested',
        type: 'date',
      },
      {
        key: 'LastWorkingDate_Calculated',
        label: 'Last Working Date Planned',
        type: 'date',
      },
    ],
    isRTL: isRTL,
  };

  const renderEmployeeEOSReqCard = ({item}) => {
    const isHighlighted = highlightedRecId === item.RecId;
    const itemProcessingButtons = processingButtons[item.RecId] || [];

    const processedItem = {
      ...item,
      WFStatus: getStatusLabel(item.WFStatus),
      EOSNotificationDate: formatDate(item.EOSNotificationDate),
      LastWorkingDate_Actual: formatDate(item.LastWorkingDate_Actual),
      LastWorkingDate_Calculated: formatDate(item.LastWorkingDate_Calculated),
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

  const filteredData = f.filteredData;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <ActionPaneContainer
      pageTitle={getPageLabel()}
      isBackButton={false}
      showFooter={true}
      showFloatingButton={true}
      isHeaderActive={true}
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={handleAddEOSRequest}
      showPageTitleRow={true}
      showSearchBar={true}
      {...f.actionPaneProps}>
      {/* Processing Overlay */}
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

      {/* Main Content */}
      {isLoading ? (
        <View style={styles.DLP_LoadingContainer}>
          <CustomIndicator />
        </View>
      ) : filteredData.length > 0 ? (
        <FlatList
          data={filteredData}
          renderItem={renderEmployeeEOSReqCard}
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
          {f.searchQuery.trim() ? (
            <Text style={styles.DLP_NoDataSubText}>
              No records match "{f.searchQuery}"
            </Text>
          ) : EOSRequestData.length === 0 ? (
            <>
              <Text style={styles.DLP_NoDataText}>Get started</Text>
              <Text style={styles.DLP_NoDataSubText}>
                Tap + to add a new record
              </Text>
            </>
          ) : (
            <Text style={styles.DLP_NoDataText}>No records found.</Text>
          )}
        </ScrollView>
      )}

      {/* Alert Modal */}
      <AlertModal
        visible={alertModal}
        heading={t('common.alert')}
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />

      {/* Delete Confirmation Modal */}
      <AlertDeleteModal
        visible={deleteModal}
        heading={t('Employee EOS Request.deleteConfirmTitle')}
        text={t('Employee EOS Request.deleteConfirmMessage')}
        onPress={0}
        onCancel={() => {
          setDeleteModal(false);
          setItemToDelete(null);
        }}
      />
    </ActionPaneContainer>
  );
};

export default EmployeeEOSRequestListPage;
