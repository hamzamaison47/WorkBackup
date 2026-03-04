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
import DynamicAttachmentModal from '../../shared/DynamicAttachmentModal';

import {employeeEOSRequestfindbyEmployee} from '../../API/EmployeeEOSRequest/EmployeeEOSRequestfindbyEmployee';
import {ScrollView} from 'react-native-gesture-handler';

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
  const {selectedLegalEntity, defaultLegalEntity, legalEntities} = useSelector(
    state => state.company,
  );

  const isRTL = I18nManager.isRTL;

  // Example states
  const [isLoading, setIsLoading] = useState(false);
  const [EOSRequestData, setEOSRequestData] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [highlightedRecId, setHighlightedRecId] = useState(null);
  const [processingButtons, setProcessingButtons] = useState({});
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [selectedLeaveItem, setSelectedLeaveItem] = useState(null);
  const [isWorkflowConfigured, setIsWorkflowConfigured] = useState(false);

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchEmployeeEosRequest = useCallback(async () => {
    if (!effectiveEmployeeId) return;

    setIsLoading(true);
    try {
      const EmployeeEOSData = await employeeEOSRequestfindbyEmployee({
        employeeId: effectiveEmployeeId,
      });

      console.log('EmployeeEOSData', {EmployeeEOSData});

      setEOSRequestData(EmployeeEOSData);
    } catch (error) {
      setAlertMessage(t('EmployeeEOSData.fetchFailed'));
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveEmployeeId]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchEmployeeEosRequest();
    }, [fetchEmployeeEosRequest]),
  );

  // Handle highlighting of records
  useFocusEffect(
    useCallback(() => {
      if (highlightRecId) {
        setHighlightedRecId(highlightRecId);
        fetchEmployeeEosRequest();

        const timer = setTimeout(() => {
          setHighlightedRecId(null);
        }, 3000);

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

  const cardConfig = {
    headerConfig: {
      title: {key: 'EOSRequestId'},
    },

    fields: [
      {
        key: 'EmployeePersonnelNumber',
        label: 'Employee Id' || 'Employee Id',
        type: 'text',
      },
      {
        key: 'EmployeeName',
        label: 'Employee Name' || 'Employee Name',
        type: 'text',
      },
      {
        key: 'EOSType',
        label: 'EOS Type' || 'EOS Type',
        type: 'text',
      },
      {
        key: 'NoticePeriodCode',
        label: 'Notice Period Code' || 'Notice Period Code',
        type: 'text',
      },
    ],

    expandableFields: [
      {
        key: 'EOSNotificationDate',
        label: 'Notification Date' || 'Notification Date',
        type: 'Date',
      },
      {
        key: 'LastWorkingDate_Actual',
        label: 'Last Working Date Requested' || 'Last Working Date Requested',
        type: 'Date',
      },
      {
        key: 'LastWorkingDate_Calculated',
        label: 'Last Working Date Planned' || 'Last Working Date Planned',
        type: 'Date',
      },
    ],
    isRTL: isRTL,
  };

  const formatDate = date => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  // Handle back navigation
  const handleGoBack = () => {
    let targetRoute = 'MainDashboard'; // default

    switch (cameFrom) {
      case 'MainDashboard':
        targetRoute = 'MainDashboard';
        break;
      case 'DisplayListPage':
        targetRoute = 'DisplayListPage';
        break;
      case 'DrawerNavigator':
        targetRoute = 'MainDashboard';
        break;
      case 'WorkerAssignedToMe':
        targetRoute = 'WorkerAssignedToMe';
        break;
      default:
        if (navigation.canGoBack()) {
          navigation.goBack();
          return;
        } else {
          targetRoute = 'MainDashboard';
        }
        return; // exit early
    }

    navigation.reset({
      index: 0,
      routes: [{name: targetRoute}],
    });
  };

  const getPageLabel = () => {
    const currentMenuItem = menuItems.find(
      item => item.MenuId === 'EmployeeEOSRequestListPage',
    );
    return currentMenuItem?.Label || t('EmployeeEOSRequestListPage.pageTitle'); // Fallback to default if not found
  };

  const handleButtonPress = (buttonType, itemData) => {
    switch (
      buttonType
      // case BUTTON_TYPES.EDIT:
      //   handleEditPress(itemData);
      //   break;
      // case BUTTON_TYPES.DELETE:
      //   handleDeletePress(itemData);
      //   break;
      // case BUTTON_TYPES.SUBMIT:
      //   handleSubmitPress(itemData);
      //   break;
      // case BUTTON_TYPES.ATTACHMENT:
      //   handleReceiptAttachmentPress(itemData);
      //   break;
      // default:
      // console.log('Unknown button pressed:', buttonType);
    ) {
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchEmployeeEosRequest();
  };

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
    };
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

    // Get button configuration
    const buttonConfig = getButtonConfig(item);

    return (
      <DynamicRequestCard
        data={processedItem}
        headerConfig={cardConfig.headerConfig}
        fields={cardConfig.fields}
        expandableFields={cardConfig.expandableFields}
        buttons={buttonConfig} // Only this prop needed now!
        isHighlighted={isHighlighted}
        onButtonPress={handleButtonPress}
        isExpandable={true} // Can set to false to disable
        gradientColors={['#6ee0ff', '#bddeff', '#cce6ff']}
        highlightGradientColors={['#E8F5E8', '#F0FFF0']}
        processingButtons={itemProcessingButtons}
        isRTL={isRTL}
      />
    );
  };

  return (
    <ActionPaneContainer
      // pageTitle="Leave Requests"
      pageTitle={getPageLabel()}
      isBackButton={false}
      showFooter={true}
      showFloatingButton={true}
      isHeaderActive={true}
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={0}>
      {/* Main content */}
      {isLoading ? (
        <CustomIndicator />
      ) : EOSRequestData.length > 0 ? (
        <FlatList
          data={EOSRequestData}
          renderItem={renderEmployeeEOSReqCard}
          keyExtractor={(item, index) =>
            item.RecId?.toString() || index.toString()
          }
          contentContainerStyle={styles.LReqLP_ListContainer}
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
          <Text style={styles.LReqLP_NoDataText}>
            {t('Employee EOS Request Data Not Found')}
          </Text>
        </ScrollView>
      )}

      {/* Attachment Modal
      <DynamicAttachmentModal
        visible={attachmentModalVisible}
        recordData={selectedLeaveItem}
        tableName="PREmployeeLeaveRequest"
        onClose={() => {
          setAttachmentModalVisible(false);
          setSelectedLeaveItem(null);
        }}
        onSave={() => {
          fetchEmployeeEosRequest();
        }}
        legalEntity={selectedLegalEntity}
        employeeId={effectiveEmployeeId}
        employeeName={effectiveEmployeeName}
        modalTitle={t('EmployeeEOSRequestListPage.pageTitle') + ' Attachments'}
        showDetails={true}
        detailFields={[
          {key: 'LeaveCode', label: 'Leave Type'},
          {key: 'LeaveCategory', label: 'Category'},
          {key: 'LeaveStartDate', label: 'Start Date'},
          {key: 'LeaveEndDate', label: 'End Date'},
        ]}
        detailData={selectedLeaveItem || {}}
        showTakePhoto={selectedLeaveItem?.WFStatus === 'Draft'}
        showChooseFile={selectedLeaveItem?.WFStatus === 'Draft'}
        showDownload={true}
        showDelete={selectedLeaveItem?.WFStatus === 'Draft'}
      /> */}

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
