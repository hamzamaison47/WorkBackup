/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
import React, {useState, useCallback} from 'react';
import {
  Text,
  FlatList,
  BackHandler,
  RefreshControl,
  ScrollView,
  I18nManager,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

import AlertModal from '../../components/Alert/AlertModal';
import AlertDeleteModal from '../../components/Alert/AlertDeleteModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import DynamicRequestCard from '../../components/DynamicRequestCard';
import {useDynamicTranslation} from '../../hooks/useDynamicTranslation';
import styles from '../../styles/styles';

import {fetchLeaves} from '../../Controller/leaveRequestApiService';
import DeleteLeaveRequest from '../../API/Leaves/deleteLeaveRequest';
import SubmitLeaveRequest from '../../API/Leaves/SubmitLeaveRequest';
import {useSelector} from 'react-redux';

const LeaveRequestListPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {t} = useTranslation();
  const {
    translateLeaveType,
    translateLeaveCategory,
    translateWorkflowStatus,
    translateFieldLabel,
  } = useDynamicTranslation();

  const isRTL = I18nManager.isRTL;
  // const styles = createDynamicStyles(isRTL);

  const {
    employeeId,
    employeeName,
    WorkerRecId,
    cameFrom,
    highlightRecId,
    userData: routeUserData,
  } = route.params || {};

  const reduxUserData = useSelector(state => state.user.userData);
  const effectiveUserData = routeUserData || reduxUserData;

  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
  const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;
  const effectiveWorkerRecId = WorkerRecId || effectiveUserData?.WorkerRecId;

  const [isLoading, setIsLoading] = useState(false);
  const [leavesData, setLeavesData] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [highlightedRecId, setHighlightedRecId] = useState(null);
  const [processingButtons, setProcessingButtons] = useState({});

  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchLeavesData = useCallback(async () => {
    if (!effectiveEmployeeId) return;

    setIsLoading(true);
    try {
      const LeaveData = await fetchLeaves(effectiveEmployeeId);
      setLeavesData(LeaveData);
    } catch (error) {
      setAlertMessage(t('leaveRequest.fetchFailed'));
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveEmployeeId, t]);

  useFocusEffect(
    useCallback(() => {
      fetchLeavesData();
    }, [fetchLeavesData]),
  );

  useFocusEffect(
    useCallback(() => {
      if (highlightRecId) {
        setHighlightedRecId(highlightRecId);
        fetchLeavesData();

        const timer = setTimeout(() => {
          setHighlightedRecId(null);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }, [highlightRecId, fetchLeavesData]),
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
      routes: [{name: 'TabNavigator', params: {screen: targetRoute}}],
    });
  };

  const handleRefresh = () => {
    fetchLeavesData();
  };

  const handleCreateLeave = () => {
    navigation.navigate('LeaveSaveRecord', {
      mode: 'create',
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: effectiveUserData,
      cameFrom: 'LeavesListPage',
      originalCameFrom: cameFrom,
      leaveData: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
        recId: '',
        leaveCode: '',
        leaveCategory: '',
        balance: '0.00',
        leaveStartDate: '',
        leaveEndDate: '',
        leaveDays: '',
        reason: '',
      },
    });
  };

  const cardConfig = {
    headerConfig: {
      title: {key: 'leaveCode'},
      subtitle: {key: 'employeeName'},
    },

    fields: [
      {
        key: 'leaveStartDate',
        label: translateFieldLabel('Leave Start Date'),
        type: 'date',
      },
      {
        key: 'leaveEndDate',
        label: translateFieldLabel('Leave End Date'),
        type: 'date',
      },
      {
        key: 'leaveDays',
        label: translateFieldLabel('Leave Days'),
        type: 'text',
      },
      {key: 'wfStatus', label: '', type: 'status'},
    ],

    expandableFields: [
      {
        key: 'leaveReqId',
        label: translateFieldLabel('Leave Request ID'),
        type: 'text',
      },
      {
        key: 'leaveCategory',
        label: translateFieldLabel('Leave Category'),
        type: 'text',
      },
      {
        key: 'leaveReqDate',
        label: translateFieldLabel('Leave Request Date'),
        type: 'date',
      },
      {
        key: 'balance',
        label: translateFieldLabel('Balance'),
        type: 'currency',
      },
      {
        key: 'reason',
        label: translateFieldLabel('Reason'),
        type: 'text',
      },
    ],
    isRTL: isRTL,
  };

  const getButtonConfig = item => {
    const isDraft =
      translateWorkflowStatus(item.wfStatus) ===
      translateWorkflowStatus('NotSubmitted');

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
      submit: {
        show: isDraft,
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

  const setButtonProcessing = (recId, buttonType, isProcessing) => {
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: isProcessing
        ? [...(prev[recId] || []), buttonType]
        : (prev[recId] || []).filter(btn => btn !== buttonType),
    }));
  };

  const handleButtonPress = (buttonType, itemData) => {
    switch (buttonType) {
      case 'edit':
        handleEditPress(itemData);
        break;
      case 'delete':
        handleDeletePress(itemData);
        break;
      case 'submit':
        handleSubmitPress(itemData);
        break;
      default:
        console.log('Unknown button pressed:', buttonType);
    }
  };

  const handleEditPress = itemData => {
    navigation.navigate('LeaveSaveRecord', {
      mode: 'edit',
      employeeId: itemData.employeeId || employeeId,
      employeeName: itemData.employeeName || employeeName,
      WorkerRecId: itemData.WorkerRecId || WorkerRecId,
      userData: route.params?.userData || {
        employeeId,
        employeeName,
        WorkerRecId,
      },
      cameFrom: 'LeavesListPage',
      originalCameFrom: cameFrom,
      leaveData: {
        recId: itemData.recId,
        employeeId: itemData.employeeId || employeeId,
        employeeName: itemData.employeeName || employeeName,
        WorkerRecId: itemData.WorkerRecId || WorkerRecId,
        leaveCode: itemData.leaveCode,
        leaveCategory: itemData.leaveCategory,
        balance: itemData.balance,
        leaveStartDate: itemData.leaveStartDate,
        leaveEndDate: itemData.leaveEndDate,
        leaveDays: itemData.leaveDays,
        reason: itemData.reason,
      },
    });
  };

  const handleDeletePress = itemData => {
    setItemToDelete(itemData);
    setDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setButtonProcessing(itemToDelete.recId, 'delete', true);

    try {
      const response = await DeleteLeaveRequest({
        recordsRecId: [itemToDelete.recId],
      });

      if (response[0].IsSuccess) {
        setAlertMessage(t('leaveRequest.deleteSuccess'));
        setLeavesData(prev =>
          prev.filter(leave => leave.recId !== itemToDelete.recId),
        );
      } else {
        setAlertMessage(t('leaveRequest.deleteFailed'));
      }
    } catch (error) {
      setAlertMessage(t('leaveRequest.deleteFailed'));
      console.log('Delete Leave Request response', error);
    } finally {
      setButtonProcessing(itemToDelete.recId, 'delete', false);
      setDeleteModal(false);
      setItemToDelete(null);
      setAlertModal(true);
      setTimeout(() => {
        fetchLeavesData();
      }, 1000);
    }
  };

  const handleSubmitPress = async itemData => {
    setButtonProcessing(itemData.recId, 'submit', true);

    try {
      const response = await SubmitLeaveRequest({
        recId: Number(itemData.recId),
      });
      const resObj = Array.isArray(response) ? response[0] : response;

      if (resObj && String(resObj.IsSuccess).toLowerCase() === 'true') {
        setAlertMessage(
          t('leaveRequest.submitSuccess', {leaveCode: itemData.leaveCode}),
        );
        setAlertModal(true);

        setHighlightedRecId(itemData.recId);

        setTimeout(() => {
          setHighlightedRecId(null);
        }, 3000);

        setTimeout(() => {
          fetchLeavesData();
        }, 1000);
      } else {
        const errorMessage =
          resObj && resObj.Message
            ? resObj.Message
            : t('leaveRequest.submitFailed', {leaveCode: itemData.leaveCode});
        setAlertMessage(errorMessage);
        setAlertModal(true);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setAlertMessage(
        t('leaveRequest.submitFailed', {leaveCode: itemData.leaveCode}),
      );
      setAlertModal(true);
    } finally {
      setButtonProcessing(itemData.recId, 'submit', false);
    }
  };

  const renderLeavesCard = ({item}) => {
    const isHighlighted = highlightedRecId === item.recId;
    const itemProcessingButtons = processingButtons[item.recId] || [];

    const processedItem = {
      ...item,
      leaveCode: translateLeaveType(item.leaveCode),
      leaveCategory: translateLeaveCategory(item.leaveCategory),
      wfStatus: translateWorkflowStatus(item.wfStatus),
      employeeId: item.employeeId || employeeId,
      employeeName: item.employeeName || employeeName,
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
      pageTitle={t('leaveRequest.pageTitle')}
      isBackButton={false}
      showFooter={true}
      showFloatingButton={true}
      isHeaderActive={true}
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={handleCreateLeave}>
      {isLoading ? (
        <CustomIndicator />
      ) : leavesData.length > 0 ? (
        <FlatList
          data={leavesData}
          renderItem={renderLeavesCard}
          keyExtractor={(item, index) =>
            item.recId?.toString() || index.toString()
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
            {t('leaveRequest.noDataFound')}
          </Text>
        </ScrollView>
      )}

      <AlertModal
        visible={alertModal}
        heading={t('common.alert')}
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />

      <AlertDeleteModal
        visible={deleteModal}
        heading={t('leaveRequest.deleteConfirmTitle')}
        text={t('leaveRequest.deleteConfirmMessage')}
        onPress={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModal(false);
          setItemToDelete(null);
        }}
      />
    </ActionPaneContainer>
  );
};

export default LeaveRequestListPage;
