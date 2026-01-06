/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
import React, {useState, useCallback} from 'react';
import {
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  BackHandler,
  ScrollView,
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

// API
import {EmployeePersonalEducation} from '../../../../API/PersonalInformation/Education/PersonalEducation';
import {DeleteEducationDetails} from '../../../../API/PersonalInformation/Education/PersonalEducationDelete';
import {SubmitEducationRequest} from '../../../../API/PersonalInformation/Education/SubmitEducationRequest';

const PersonalEducation = () => {
  const navigation = useNavigation();
  const route = useRoute(); // ➜ ADD THIS

  /* ---------- redux user ---------- */
  const reduxUserData = useSelector(state => state.user.userData);
  const effectiveUserData = reduxUserData || {};

  const effectiveEmployeeId = effectiveUserData?.employeeId;
  const effectiveEmployeeName = effectiveUserData?.employeeName;
  const effectiveWorkerRecId = effectiveUserData?.WorkerRecId;

  /* ---------- state ---------- */
  const [isLoading, setIsLoading] = useState(false);
  const [educationData, setEducationData] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [highlightedRecId, setHighlightedRecId] = useState(null);
  const [processingButtons, setProcessingButtons] = useState({});
  // const [refreshing, setRefreshing] = useState(false);

  /* ---------- fetch ---------- */
  const fetchEducationData = useCallback(async () => {
    if (!effectiveEmployeeId) return;
    setIsLoading(true);
    try {
      const data = await EmployeePersonalEducation({
        employeeId: effectiveEmployeeId,
      });
      // newest record on top
      data.sort((a, b) => (b.RecId || 0) - (a.RecId || 0));
      console.log('Education Data : ', data);
      setEducationData(data);
    } catch (error) {
      console.log('Failed to fetch education details:', error);
      setAlertMessage('Failed to load education records.');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveEmployeeId]);

  const routeParams = route.params || {};
  const routeUserData = routeParams.userData;
  const cameFrom = routeParams.cameFrom;
  const highlightRecId = routeParams.highlightRecId; // ➜ THE FIX

  useFocusEffect(
    useCallback(() => {
      fetchEducationData();
    }, [fetchEducationData]),
  );

  /* ---------- highlight ---------- */
  /* 1.  copy route param into state once  */
  useFocusEffect(
    useCallback(() => {
      const id = route.params?.highlightRecId;
      if (id && id !== highlightedRecId) {
        setHighlightedRecId(id); // start highlight
        navigation.setParams({highlightRecId: undefined}); // ← forget it
      }
    }, [route.params?.highlightRecId, highlightedRecId, navigation]),
  );

  /* 2.  auto-clear highlight after 3 s  */
  useFocusEffect(
    useCallback(() => {
      if (!highlightedRecId) return;
      const t = setTimeout(() => setHighlightedRecId(null), 3000);
      return () => clearTimeout(t);
    }, [highlightedRecId]),
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

  // Handle back navigation
  const handleGoBack = () => {
    navigation.navigate('DisplayPersonalInfo');
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchEducationData();
  };

  /* ---------- create ---------- */
  const handleCreateEducation = () => {
    navigation.navigate('PersonalEducationSaveRecord', {
      mode: 'create',
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: effectiveUserData,
      cameFrom: 'PersonalEducation',
      originalCameFrom: 'PersonalEducation',
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

  /* ---------- status ---------- */
  const getStatusLabel = status => {
    if (!status) return '';
    const normalizedStatus = status.replace(/\s+/g, '').toLowerCase(); // remove spaces & lowercase

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
    return map[normalizedStatus] || 'Unknown';
  };

  /* ---------- buttons ---------- */
  const setButtonProcessing = (recId, buttonType, isProcessing) => {
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: isProcessing
        ? [...(prev[recId] || []), buttonType]
        : (prev[recId] || []).filter(btn => btn !== buttonType),
    }));
  };

  const getButtonConfig = item => {
    // console.log(item.ApprovalStatus);
    // console.log(getStatusLabel(item.ApprovalStatus));
    const isDraft = getStatusLabel(item.ApprovalStatus) === 'Draft';
    const isHCMRecord = getStatusLabel(item.ApprovalStatus) === '';
    return {
      edit: {
        show: true,
        position: 'header',
        style: 'icon',
        icon: 'edit',
        iconSize: 20,
        iconColor: '#fff',
        backgroundColor: '#0A66C2',
        disabled: isHCMRecord ? false : !isDraft,
        customStyle: false ? {backgroundColor: '#BDBDBD'} : {},
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
          cameFrom: 'PersonalEducation',
          originalCameFrom: 'PersonalEducation',
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
      default:
        console.log('Unknown button type:', buttonType);
    }
  };

  /* ---------- delete ---------- */
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setButtonProcessing(itemToDelete.RecId, 'delete', true);
    try {
      const response = await DeleteEducationDetails({
        recordsRecId: [itemToDelete.RecId],
      });
      if (response[0]?.IsSuccess) {
        setAlertMessage('Education record deleted successfully.');
        setEducationData(prev =>
          prev.filter(ed => ed.RecId !== itemToDelete.RecId),
        );
      } else {
        setAlertMessage('Unable to delete education record.');
      }
    } catch (error) {
      console.error('DeleteEducationDetails error:', error);
      setAlertMessage('Failed to delete education record.');
    } finally {
      setButtonProcessing(itemToDelete.RecId, 'delete', false);
      setDeleteModal(false);
      setItemToDelete(null);
      setAlertModal(true);
      setTimeout(() => fetchEducationData(), 1000);
    }
  };

  /* ---------- submit ---------- */
  const handleSubmitPress = async itemData => {
    setButtonProcessing(itemData.RecId, 'submit', true);
    try {
      const response = await SubmitEducationRequest({recId: itemData.RecId});
      const res = Array.isArray(response) ? response[0] : response;
      if (String(res?.IsSuccess).toLowerCase() === 'true') {
        setAlertMessage(
          `${itemData.EducationDisciplineId} is Submitted Successfully.`,
        );
        setHighlightedRecId(itemData.RecId);
        setTimeout(() => setHighlightedRecId(null), 3000);
        setTimeout(() => fetchEducationData(), 1000);
      } else {
        setAlertMessage(res?.Message || 'Failed to Submit Education Request');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setAlertMessage('Failed to Submit Education Request');
    } finally {
      setButtonProcessing(itemData.RecId, 'submit', false);
      setAlertModal(true);
    }
  };

  /* ---------- card ---------- */
  const cardConfig = {
    headerConfig: {title: {key: 'EducationTitle', label: 'Education'}},
    fields: [
      {key: 'EducationDisciplineId', label: 'Education', type: 'text'},
      {key: 'Description', label: 'Description', type: 'text'},
      {key: 'DurationUnit', label: 'Duration Unit', type: 'text'},
      {key: 'Duration', label: 'Duration', type: 'number'},
      {key: 'ApprovalStatus', label: '', type: 'status'},
    ],
    expandableFields: [
      {key: 'StartDate', label: 'Start Date', type: 'date'},
      {key: 'EndDate', label: 'End Date', type: 'date'},
      {key: 'Notes', label: 'Notes', type: 'text'},
      // {key: 'WorkflowOperation', label: 'Workflow Operation', type: 'text'},
    ],
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
      />
    );
  };

  /* ---------- render ---------- */
  return (
    <ActionPaneContainer
      pageTitle="Education Details"
      isBackButton={false}
      showFooter
      showFloatingButton
      isHeaderActive
      showTabNavigator
      onFloatingButtonPress={handleCreateEducation}
      onRefresh={fetchEducationData}>
      {isLoading ? (
        <CustomIndicator />
      ) : educationData.length > 0 ? (
        <FlatList
          data={educationData}
          renderItem={renderEducationCard}
          keyExtractor={(item, index) =>
            item.RecId?.toString() || index.toString()
          }
          contentContainerStyle={styles.listContent}
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
          <Text style={styles.noDataText}>No Data Found</Text>
        </ScrollView>
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
        text="Are you sure you want to delete this education record?"
        onPress={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModal(false);
          setItemToDelete(null);
        }}
      />
    </ActionPaneContainer>
  );
};

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  listContent: {padding: 6},
  noDataText: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#999999',
  },
});

export default PersonalEducation;
