/* eslint-disable curly */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  BackHandler,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import usePallete from '../../../../hooks/usePalette';

// Components
import ActionPaneContainer from '../../../../components/ActionPaneContainer';
import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';
import DynamicRequestCard from '../../../../components/DynamicRequestCard';
import AlertModal from '../../../../components/Alert/AlertModal';
import useAlertModal from '../../../../hooks/useAlertModal';
import AlertDeleteModal from '../../../../components/Alert/AlertDeleteModal';
import {translate as t} from '../../../../store/utils/translate';
import {ContactDetails} from '../../../../API/PersonalInformation/ContactDetails/ContactDetails';
import {DeleteContactDetails} from '../../../../API/PersonalInformation/ContactDetails/DeleteContactDetails';
import {UpdateContactDetails} from '../../../../API/PersonalInformation/ContactDetails/UpdateContactDetails';
import useNotify from '../../../../hooks/useNotify';
import useListFilters from '../../../../hooks/useListFilters';

import styles from '../../../../styles/styles';

const ContactDetailsListPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const P = usePallete();

  const reduxUserData = useSelector(state => state.user.userData);
  const effectiveUserData = reduxUserData;

  const effectiveEmployeeId = effectiveUserData?.employeeId;
  const effectiveEmployeeName = effectiveUserData?.employeeName;
  const effectiveWorkerRecId = effectiveUserData?.WorkerRecId;
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const {showSuccess, showError, showWarning, hide, alertModalProps} =
    useAlertModal();
  const [isProcessing, setIsProcessing] = useState(false);
  const {notifySuccess, notifyError, notifyDelete} =
    useNotify('Contact Details');
  const [processingButtons, setProcessingButtons] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [contactsData, setContactsData] = useState([]);

  const fetchContactsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await ContactDetails({employeeId: effectiveEmployeeId});
      console.log({data});
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

  // Fix: rename param to avoid shadowing isProcessing state
  const setButtonProcessing = (recId, buttonType, isProcessingState) => {
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: isProcessingState
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

    setDeleteModal(false);

    setTimeout(async () => {
      setIsProcessing(true);
      setButtonProcessing(itemToDelete.RecId, 'delete', true);

      try {
        const response = await DeleteContactDetails({
          recordsRecId: [itemToDelete.RecId],
        });

        if (response[0].IsSuccess) {
          notifyDelete('Contact detail deleted successfully');
          showSuccess('Contact detail deleted successfully');
          setContactsData(prev =>
            prev.filter(contact => contact.RecId !== itemToDelete.RecId),
          );
        } else {
          showError('Unable to delete contact.');
        }
      } catch (error) {
        console.log('Failed to delete contact:', error);
        showError('Failed to delete contact.');
      } finally {
        setIsProcessing(false);
        setButtonProcessing(itemToDelete.RecId, 'delete', false);
        setItemToDelete(null);
        setTimeout(() => {
          fetchContactsData();
        }, 800);
      }
    }, 100);
  };

  // Handle back navigation
  const handleGoBack = () => {
    navigation.navigate('DisplayPersonalInfo');
  };

  // 🔹 Define Card Config
  const cardConfig = {
    headerConfig: {
      title: {key: 'type', label: 'Type'},
      // subtitle: {key: 'Description'},
    },
    fields: [
      {key: 'type', label: 'Type', type: 'text'},
      {
        key: 'Locator',
        label: 'Address',
        type: 'text',
      },
      {
        key: 'IsPrimary',
        label: contactsData[0]?.IsPrimarylbl || 'Primary Contact',
        type: 'boolean',
      },
    ],
  };

  // 🔹 Button Config
  const getButtonConfig = () => ({
    edit: {
      show: true,
      position: 'header',
      style: 'icon',
      icon: 'edit',
      iconSize: 20,
      iconColor: '#fff',
      backgroundColor: P.primary, // Add this line
    },
    delete: {
      show: true,
      position: 'header',
      style: 'icon',
      icon: 'trash',
      iconSize: 20,
      iconColor: '#fff',
      backgroundColor: P.primary, // Add this line
    },
  });

  // ✅ 🔹 EDIT LOGIC (taken from LeaveRequestListPage)
  const handleEditPress = itemData => {
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
        Type: itemData.type || itemData.Type, // ← handle both casings
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

  // Filter/search/sort now owned by useListFilters (no pills on this screen).
  // Date filter + sort key off CreatedDateTime, resolved case-insensitively.
  // Header Date+Sort trigger only.
  const f = useListFilters({
    data: contactsData,
    dateField: 'CreatedDateTime',
  });

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
        searchQuery={f.searchQuery}
      />
    );
  };

  return (
    <ActionPaneContainer
      pageTitle="Contact Details"
      isBackButton={false}
      showFooter={false}
      showFloatingButton={true}
      isHeaderActive={true}
      showTabNavigator={true}
      onFloatingButtonPress={handleCreateContact}
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      showPageTitleRow={true}
      showSearchBar={true}
      {...f.actionPaneProps}>
      {isProcessing && (
        <View style={styles.DLP_ProcessingOverlay}>
          <View style={styles.DLP_ProcessingContainer}>
            <ActivityIndicator size="large" color={P.primary} />
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
      ) : f.filteredData.length > 0 ? (
        <FlatList
          data={f.filteredData}
          renderItem={renderContactCard}
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
            <>
              {/* <Text style={styles.DLP_NoDataText}>No results found</Text> */}
              <Text style={styles.DLP_NoDataSubText}>
                No records match "{f.searchQuery}"
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.DLP_NoDataText}>Get started</Text>
              <Text style={styles.DLP_NoDataSubText}>
                Tap + to add a new record
              </Text>
            </>
          )}
        </ScrollView>
      )}

      <AlertModal {...alertModalProps} />

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

export default ContactDetailsListPage;
