/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  BackHandler,
  RefreshControl,
  ScrollView,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';

// Components
import ActionPaneContainer from '../../../../components/ActionPaneContainer';
import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';
import DynamicRequestCard from '../../../../components/DynamicRequestCard';
import AlertModal from '../../../../components/Alert/AlertModal';
import AlertDeleteModal from '../../../../components/Alert/AlertDeleteModal';

// API
import {ContactDetails} from '../../../../API/PersonalInformation/ContactDetails/ContactDetails';
import {DeleteContactDetails} from '../../../../API/PersonalInformation/ContactDetails/DeleteContactDetails';
import {UpdateContactDetails} from '../../../../API/PersonalInformation/ContactDetails/UpdateContactDetails';

const ContactDetailsListPage = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Get userData from Redux
  const reduxUserData = useSelector(state => state.user.userData);
  const effectiveUserData = reduxUserData;

  // Extract employee details
  const effectiveEmployeeId = effectiveUserData?.employeeId;
  const effectiveEmployeeName = effectiveUserData?.employeeName;
  const effectiveWorkerRecId = effectiveUserData?.WorkerRecId;

  // 🔹 Modals & Alerts
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // 🔹 Processing states
  const [processingButtons, setProcessingButtons] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [contactsData, setContactsData] = useState([]);

  // 🔹 Fetch Contacts from API
  const fetchContactsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await ContactDetails({employeeId: effectiveEmployeeId});
      // console.log({data});
      setContactsData(data);
    } catch (error) {
      console.log('Failed to fetch contacts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveEmployeeId]);

  // 🔹 Run fetch when screen focused
  useFocusEffect(
    useCallback(() => {
      fetchContactsData();
    }, [fetchContactsData]),
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

  // 🔹 Handle refresh
  const handleRefresh = () => fetchContactsData();

  // 🔹 Handle Create Contact
  const handleCreateContact = () => {
    navigation.navigate('ContactDetailsSaveRecord', {
      mode: 'create',
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      userData: effectiveUserData,
      cameFrom: 'ContactDetailsListPage',
      contactData: {
        Type: '',
        Locator: '',
        Description: '',
        IsPrimary: false,
        IsPrivate: false,
        IsMobilePhone: false,
        LocatorExtension: '',
      },
    });
  };

  // 🔹 Track processing state for button actions
  const setButtonProcessing = (recId, buttonType, isProcessing) => {
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: isProcessing
        ? [...(prev[recId] || []), buttonType]
        : (prev[recId] || []).filter(btn => btn !== buttonType),
    }));
  };

  // 🔹 Delete Logic
  const handleDeletePress = itemData => {
    setItemToDelete(itemData);
    setDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setButtonProcessing(itemToDelete.RecId, 'delete', true);

    try {
      const response = await DeleteContactDetails({
        recordsRecId: [itemToDelete.RecId],
      });

      if (response[0].IsSuccess) {
        setAlertMessage('Contact deleted successfully.');
        setContactsData(prev =>
          prev.filter(contact => contact.RecId !== itemToDelete.RecId),
        );
      } else {
        setAlertMessage('Unable to delete contact.');
      }
    } catch (error) {
      console.log('Failed to delete contact:', error);
      setAlertMessage('Failed to delete contact.');
    } finally {
      setButtonProcessing(itemToDelete.RecId, 'delete', false);
      setDeleteModal(false);
      setItemToDelete(null);
      setAlertModal(true);
      setTimeout(() => {
        fetchContactsData();
      }, 1000);
    }
  };
  // Handle back navigation
  const handleGoBack = () => {
    navigation.navigate('DisplayPersonalInfo');
  };

  // 🔹 Define Card Config
  const cardConfig = {
    headerConfig: {
      title: {key: 'Type', label: 'Type'},
      // subtitle: {key: 'Description'},
    },
    fields: [
      {key: 'IsPrimary', label: 'Primary Contact', type: 'text'},
      {key: 'Type', label: 'Type', type: 'text'},
      {key: 'Locator', label: 'Contact number/address', type: 'text'},
    ],
  };

  // 🔹 Button Config
  const getButtonConfig = () => ({
    // edit: {
    //   show: true,
    //   position: 'header',
    //   style: 'icon',
    //   icon: 'edit',
    //   iconSize: 20,
    //   iconColor: '#fff',
    //   backgroundColor: '#0A66C2', // Add this line
    // },
    // delete: {
    //   show: true,
    //   position: 'header',
    //   style: 'icon',
    //   icon: 'trash',
    //   iconSize: 20,
    //   iconColor: '#fff',
    //   backgroundColor: '#0A66C2', // Add this line
    // },
  });

  // ✅ 🔹 EDIT LOGIC (taken from LeaveRequestListPage)
  const handleEditPress = itemData => {
    console.log('ItemData :', itemData);
    navigation.navigate('ContactDetailsSaveRecord', {
      mode: 'edit',
      employeeId: itemData.EmployeeId || effectiveEmployeeId,
      employeeName: itemData.EmployeeName || effectiveEmployeeName,
      WorkerRecId: itemData.WorkerRecId || effectiveWorkerRecId,
      userData: effectiveUserData,
      cameFrom: 'ContactDetailsListPage',
      contactData: {
        RecId: itemData.RecId,
        EmployeeId: itemData.EmployeeId || effectiveEmployeeId,
        EmployeeName: itemData.EmployeeName || effectiveEmployeeName,
        WorkerRecId: itemData.WorkerRecId || effectiveWorkerRecId,
        Type: itemData.Type,
        Locator: itemData.Locator,
        LocatorExtension: itemData.LocatorExtension,
        Description: itemData.Description,
        IsPrimary: itemData.IsPrimary,
        IsPrivate: itemData.IsPrivate,
        IsMobilePhone: itemData.IsMobilePhone,
      },
    });
  };

  // 🔹 Button Press Handler
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

  // 🔹 Render Each Contact Card
  const renderContactCard = ({item}) => {
    const itemProcessingButtons = processingButtons[item.RecId] || [];

    // console.log({item});

    return (
      <DynamicRequestCard
        data={item}
        headerConfig={cardConfig.headerConfig}
        fields={cardConfig.fields}
        buttons={getButtonConfig()}
        onButtonPress={handleButtonPress}
        processingButtons={itemProcessingButtons}
        isExpandable
        gradientColors={['#6ee0ff', '#bddeff', '#cce6ff']}
        highlightGradientColors={['#E8F5E8', '#F0FFF0']}
      />
    );
  };

  // 🔹 Main Render
  return (
    <ActionPaneContainer
      pageTitle="Contact Details"
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={true}
      onFloatingButtonPress={handleCreateContact}
      onRefresh={handleRefresh}>
      {isLoading ? (
        <CustomIndicator />
      ) : contactsData.length > 0 ? (
        <FlatList
          data={contactsData}
          renderItem={renderContactCard}
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
          <Text style={styles.LReqLP_NoDataText}>No Data Found</Text>
        </ScrollView>
      )}

      {/* Alert Modal */}
      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />

      {/* Delete Modal */}
      <AlertDeleteModal
        visible={deleteModal}
        heading="Confirm Deletion"
        text="Are you sure you want to delete this contact?"
        onPress={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModal(false);
          setItemToDelete(null);
        }}
      />
    </ActionPaneContainer>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 6,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
    color: '#9CA3AF',
  },
});

export default ContactDetailsListPage;
