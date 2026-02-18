/* eslint-disable no-shadow */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
import React, {useState, useCallback} from 'react';
import {
  Text,
  FlatList,
  BackHandler,
  RefreshControl,
  View,
  ActivityIndicator,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';

import AlertModal from '../../../../components/Alert/AlertModal';
import AlertDeleteModal from '../../../../components/Alert/AlertDeleteModal';
import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../../../components/ActionPaneContainer';
import DynamicRequestCard from '../../../../components/DynamicRequestCard';
import styles from '../../../../styles/styles';
import {translate as t} from '../../../../store/utils/translate';

import {retrieveAllFamilyContacts} from '../../../../API/PersonalInformation/FamilyContacts/retrieveAllFamilyContacts';
import {deleteFamilyContactRecord} from '../../../../API/PersonalInformation/FamilyContacts/FamilyContactDelete';
import {useSelector} from 'react-redux';
import {ScrollView} from 'react-native-gesture-handler';

const FamilyContacts_ListPageScreen = () => {
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

  const reduxUserData = useSelector(state => state.user.userData);
  const effectiveUserData = routeUserData || reduxUserData;
  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
  const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;
  const effectiveWorkerRecId = WorkerRecId || effectiveUserData?.WorkerRecId;

  // Example states
  const [isLoading, setIsLoading] = useState(false);
  const [familycontactsdata, setfamilycontactsdata] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [highlightedRecId, setHighlightedRecId] = useState(null);
  const [processingButtons, setProcessingButtons] = useState({});
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchFamilyContactsData = useCallback(async () => {
    if (!effectiveEmployeeId) return;

    setIsLoading(true);
    try {
      const FamilyContactData = await retrieveAllFamilyContacts({
        employeeId: effectiveEmployeeId, // ✅
      });
      FamilyContactData.sort((a, b) => (b.RecId || 0) - (a.RecId || 0));
      console.log(FamilyContactData);
      setfamilycontactsdata(FamilyContactData);
    } catch (error) {
      setAlertMessage('Failed to fetch data.');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveEmployeeId]);

  useFocusEffect(
    useCallback(() => {
      fetchFamilyContactsData();
    }, [fetchFamilyContactsData]),
  );

  useFocusEffect(
    useCallback(() => {
      if (highlightRecId) {
        setHighlightedRecId(highlightRecId);
        fetchFamilyContactsData();

        const timer = setTimeout(() => {
          setHighlightedRecId(null);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }, [highlightRecId, fetchFamilyContactsData]),
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

  const cardConfig = {
    headerConfig: {
      title: {key: 'Name'},
    },

    fields: [
      {
        key: 'Name',
        label: familycontactsdata[0]?.Namelbl || 'Name',
        type: 'text',
      },
      {
        key: 'RelationShipTypeId',
        label: familycontactsdata[0]?.RelationShipTypeIdlbl || 'Relationship',
        type: 'text',
      },
    ],

    expandableFields: [
      {
        key: 'EmergencyContact',
        label:
          familycontactsdata[0]?.EmergencyContactlbl || 'Emergency contact',
        type: 'boolean',
      },
      {
        key: 'isDependent',
        label: familycontactsdata[0]?.isDependentlbl || 'Dependent',
        type: 'boolean',
      },
      {
        key: 'isBeneficiary',
        label: familycontactsdata[0]?.isBeneficiarylbl || 'Beneficiary',
        type: 'boolean',
      },
    ],
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
        backgroundColor: '#0A66C2', // Add this line
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
        backgroundColor: '#0A66C2', // Add this line
        disabled: !isDraft,
        customStyle: !isDraft ? {backgroundColor: '#BDBDBD'} : {},
      },
      // submit: {
      //   show: isDraft,
      //   position: 'bottom',
      //   style: 'text',
      //   icon: 'send',
      //   iconSize: 16,
      //   text: 'Submit',
      //   textColor: '#0A66C2',
      //   iconColor: '#0A66C2',
      // },
    };
  };
  const handleButtonPress = (buttonType, itemData) => {
    switch (buttonType) {
      case 'edit':
        handleEditPress(itemData);
        break;
      case 'delete':
        handleDeletePress(itemData);
        break;
      default:
        console.log('Unknown button pressed:', buttonType);
    }
  };

  const handleEditPress = itemData => {
    navigation.navigate('FamilyContact_SaveRecord', {
      mode: 'edit',
      employeeId: itemData.employeeId || effectiveEmployeeId,
      employeeName: itemData.employeeName || effectiveEmployeeName,
      WorkerRecId: itemData.WorkerRecId || effectiveWorkerRecId,
      userData: routeUserData || effectiveUserData,
      cameFrom: 'FamilyContact_ListPage',
      originalCameFrom: cameFrom,
      familyContactDataSet: {
        RecId: itemData.RecId,
        employeeId: itemData.employeeId || effectiveEmployeeId,
        employeeName: itemData.employeeName || effectiveEmployeeName,
        WorkerRecId: itemData.WorkerRecId || effectiveWorkerRecId,
        Name: itemData.Name, // ← Pass the full name
        FirstName: itemData.FirstName,
        MiddleName: itemData.MiddleName,
        LastName: itemData.LastName,
        RelationShipTypeId: itemData.RelationShipTypeId, // ← Fixed spelling
        EmergencyContact: itemData.EmergencyContact,
        isBeneficiary: itemData.isBeneficiary,
        BeneficiaryFromDate: itemData.BeneficiaryFromDate,
        BeneficiaryToDate: itemData.BeneficiaryToDate,
        isDependent: itemData.isDependent,
        DependentValidFrom: itemData.DependentValidFrom,
        DependentValidTo: itemData.DependentValidTo,
        Gender: itemData.Gender,
        BirthDate: itemData.BirthDate,
        IsFullTimeStudent: itemData.IsFullTimeStudent,
        IsPersonWithDisabilities: itemData.IsPersonWithDisabilities,
      },
    });
    console.log('SENT FPR EDIT', itemData);
  };

  const handleDeletePress = itemData => {
    setItemToDelete(itemData); // <-- stores the whole item
    setDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    // First close the delete modal
    setDeleteModal(false);

    // Small delay to ensure modal is closed before showing processing overlay
    setTimeout(async () => {
      setIsProcessing(true); // Show processing overlay
      setButtonProcessing(itemToDelete.RecId, 'delete', true);

      try {
        const response = await deleteFamilyContactRecord({
          records: [itemToDelete],
        });

        if (response?.[0]?.IsSuccess) {
          setAlertMessage('Record deleted successfully');
          setfamilycontactsdata(prev =>
            prev.filter(c => c.RecId !== itemToDelete.RecId),
          );
        } else {
          setAlertMessage('Unable to delete record. Please try again.');
        }
      } catch (error) {
        console.log('Delete error:', error);
        setAlertMessage('Failed to delete record');
      } finally {
        setIsProcessing(false); // Hide processing overlay
        setButtonProcessing(itemToDelete.RecId, 'delete', false);
        setItemToDelete(null);
        setAlertModal(true);

        // Optional: refresh after short delay so user sees success message first
        setTimeout(() => {
          fetchFamilyContactsData();
        }, 800);
      }
    }, 100); // Small delay to ensure modal closes first
  };

  const getStatusLabel = status => {
    const statusMap = {
      NotSubmitted: 'Draft',
      Submitted: 'Submitted',
      Approved: 'Approved',
      Rejected: 'Rejected',
      Cancelled: 'Cancelled',
      ChangeRequest: 'Change Request',
      PendingCancellation: 'Pending Cancellation',
      Returned: 'Returned',
      PendingApproval: 'Pending Approval', // ← now matches the enum
      PendingComplete: 'Pending Complete',
      WorkflowCompleted: 'Workflow Completed',
      Completed: 'Completed',
    };
    return statusMap[status] || 'Draft';
  };

  const setButtonProcessing = (recId, buttonType, isProcessing) => {
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: isProcessing
        ? [...(prev[recId] || []), buttonType]
        : (prev[recId] || []).filter(btn => btn !== buttonType),
    }));
  };

  const handleRefresh = () => {
    fetchFamilyContactsData();
  };

  const handleGoBack = () => {
    navigation.navigate('DisplayPersonalInfo');
  };

  const handleFamilyContactRecordCreate = () => {
    navigation.navigate('FamilyContact_SaveRecord', {
      mode: 'create',
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: effectiveUserData,
      cameFrom: 'FamilyContacts_ListPage',
      originalCameFrom: cameFrom,
      familyContactDataSet: {
        employeeId: effectiveEmployeeId,
        employeeName: effectiveEmployeeName,
        WorkerRecId: effectiveWorkerRecId,
        RecId: '',
        Name: '',
        RelationshipTypeId: '',
        EmergencyContact: '',
        isDependent: '',
        isbeneficiary: '',
      },
    });
  };

  const renderFamilyContactCard = ({item}) => {
    const isHighlighted = highlightedRecId === item.RecId;
    const itemProcessingButtons = processingButtons[item.RecId] || [];

    // Process/massage the item data before passing to the card
    const processedItem = {
      ...item,
      employeeId: item.employeeId || effectiveEmployeeId,
      employeeName: item.employeeName || effectiveEmployeeName,
    };

    return (
      <DynamicRequestCard
        data={processedItem}
        headerConfig={cardConfig.headerConfig} // make sure you define cardConfig
        fields={cardConfig.fields}
        expandableFields={cardConfig.expandableFields}
        buttons={getButtonConfig(item)} // define getButtonConfig to generate button configs per item
        isHighlighted={isHighlighted}
        onButtonPress={handleButtonPress} // define handleButtonPress to handle button clicks
        isExpandable={true}
        gradientColors={['#6ee0ff', '#bddeff', '#cce6ff']}
        highlightGradientColors={['#E8F5E8', '#F0FFF0']}
        processingButtons={itemProcessingButtons}
      />
    );
  };

  return (
    <ActionPaneContainer
      pageTitle="Personal Contacts"
      isBackButton={true}
      showFooter={true}
      showFloatingButton={true}
      isHeaderActive={true}
      onButtonPress={handleButtonPress}
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={handleFamilyContactRecordCreate}>
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
      ) : familycontactsdata.length > 0 ? (
        <FlatList
          data={familycontactsdata}
          renderItem={renderFamilyContactCard}
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
          <Text style={styles.DLP_NoDataText}>Get started</Text>
          <Text style={styles.DLP_NoDataSubText}>
            Tap + to add a new record
          </Text>
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

export {FamilyContacts_ListPageScreen};
