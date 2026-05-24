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

// Components
import ActionPaneContainer from '../../../../components/ActionPaneContainer';
import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';
import DynamicRequestCard from '../../../../components/DynamicRequestCard';
import AlertModal from '../../../../components/Alert/AlertModal';
import AlertDeleteModal from '../../../../components/Alert/AlertDeleteModal';
import {translate as t} from '../../../../store/utils/translate';

// API
import {ContactDetails} from '../../../../API/PersonalInformation/ContactDetails/ContactDetails';
import {DeleteContactDetails} from '../../../../API/PersonalInformation/ContactDetails/DeleteContactDetails';
import {UpdateContactDetails} from '../../../../API/PersonalInformation/ContactDetails/UpdateContactDetails';

import styles from '../../../../styles/styles';

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
  const [rawData, setRawData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [sortOrder, setSortOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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
      setRawData(data); // ← here
      setDisplayData(data); // ← here
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
    // setButtonProcessing(itemToDelete.RecId, 'delete', true);

    setDeleteModal(false);

    setTimeout(async () => {
      setIsProcessing(true);
      setButtonProcessing(itemToDelete.RecId, 'delete', true);

      try {
        const response = await DeleteContactDetails({
          recordsRecId: [itemToDelete.RecId],
        });

        if (response[0].IsSuccess) {
          setAlertMessage('Record deleted successfully');
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
        setIsProcessing(false);
        setButtonProcessing(itemToDelete.RecId, 'delete', false);
        setItemToDelete(null);
        setAlertModal(true);

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
      title: {key: 'Type', label: 'Type'},
      // subtitle: {key: 'Description'},
    },
    fields: [
      {key: 'Type', label: 'Type', type: 'text'},
      {
        key: 'IsPrimary',
        label: contactsData[0]?.IsPrimarylbl || 'Primary Contact',
        type: 'text',
      },
      {
        key: 'Locator',
        label: 'Address',
        type: 'text',
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
      backgroundColor: '#0A66C2', // Add this line
    },
    delete: {
      show: true,
      position: 'header',
      style: 'icon',
      icon: 'trash',
      iconSize: 20,
      iconColor: '#fff',
      backgroundColor: '#0A66C2', // Add this line
    },
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

  const getFilteredData = () => {
    return searchQuery.trim() ? displayData : rawData;
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
        searchQuery={searchQuery}
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
          {searchQuery.trim() ? (
            <>
              {/* <Text style={styles.DLP_NoDataText}>No results found</Text> */}
              <Text style={styles.DLP_NoDataSubText}>
                No records match "{searchQuery}"
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

      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />

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
