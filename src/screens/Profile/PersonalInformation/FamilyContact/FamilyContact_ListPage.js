/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
import React, {useState, useCallback, useMemo, useEffect} from 'react';
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
import {useSelector} from 'react-redux';

import AlertModal from '../../../../components/Alert/AlertModal';
import AlertDeleteModal from '../../../../components/Alert/AlertDeleteModal';
import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../../../components/ActionPaneContainer';
import DynamicRequestCard from '../../../../components/DynamicRequestCard';
import DynamicAttachmentModal from '../../../../shared/DynamicAttachmentModal';
import styles from '../../../../styles/styles';
import {translate as t} from '../../../../store/utils/translate';
import useNotify from '../../../../hooks/useNotify';

import {retrieveAllFamilyContacts} from '../../../../API/PersonalInformation/FamilyContacts/retrieveAllFamilyContacts';
import {deleteFamilyContactRecord} from '../../../../API/PersonalInformation/FamilyContacts/FamilyContactDelete';

const FamilyContact_ListPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const isRTL = I18nManager.isRTL;

  const {
    employeeId,
    employeeName,
    WorkerRecId,
    cameFrom,
    highlightRecId,
    userData: routeUserData,
  } = route.params || {};

  const reduxUserData = useSelector(state => state.user.userData);
  const {selectedLegalEntity} = useSelector(state => state.company);
  const effectiveUserData = routeUserData || reduxUserData;
  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
  const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;
  const effectiveWorkerRecId = WorkerRecId || effectiveUserData?.WorkerRecId;

  const [isLoading, setIsLoading] = useState(false);
  const [familycontactsdata, setfamilycontactsdata] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [highlightedRecId, setHighlightedRecId] = useState(null);
  const [processingButtons, setProcessingButtons] = useState({});
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [selectedContactItem, setSelectedContactItem] = useState(null);
  const [rawData, setRawData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [sortOrder, setSortOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const {notifySuccess, notifyError, notifyDelete} =
    useNotify('Personal Contacts');

  const fetchFamilyContactsData = useCallback(async () => {
    if (!effectiveEmployeeId) return;

    setIsLoading(true);
    try {
      const FamilyContactData = await retrieveAllFamilyContacts({
        employeeId: effectiveEmployeeId,
      });
      console.log('here is the data', FamilyContactData);
      FamilyContactData.sort((a, b) => (b.RecId || 0) - (a.RecId || 0));
      setfamilycontactsdata(FamilyContactData);
      setRawData(FamilyContactData); // ← here
      setDisplayData(FamilyContactData); // ← here
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

  const handleGoBack = () => {
    navigation.navigate('DisplayPersonalInfo');
  };

  const handleRefresh = () => {
    fetchFamilyContactsData();
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
      PendingApproval: 'Pending Approval',
      PendingComplete: 'Pending Complete',
      WorkflowCompleted: 'Workflow Completed',
      Completed: 'Completed',
    };
    return statusMap[status] || null;
  };

  const getFilteredData = () => {
    const base = searchQuery.trim() ? displayData : rawData;
    const validBase = base.filter(item => getStatusLabel(item.WFStatus));
    if (activeFilter === 'All') return validBase;
    return validBase.filter(
      item => getStatusLabel(item.WFStatus) === activeFilter,
    );
  };

  const getFilterCounts = () => {
    const validItems = familycontactsdata.filter(item =>
      getStatusLabel(item.WFStatus),
    );
    const counts = {All: validItems.length};
    [...new Set(validItems.map(item => getStatusLabel(item.WFStatus)))].forEach(
      status => {
        counts[status] = validItems.filter(
          item => getStatusLabel(item.WFStatus) === status,
        ).length;
      },
    );
    return counts;
  };

  const visiblePills = useMemo(() => {
    if (!familycontactsdata.length) return ['All'];
    const unique = [
      ...new Set(familycontactsdata.map(item => getStatusLabel(item.WFStatus))),
    ].filter(Boolean); // drop null
    return ['All', ...unique];
  }, [familycontactsdata]);

  const handleReceiptAttachmentPress = async itemData => {
    try {
      setSelectedContactItem(itemData);
      setAttachmentModalVisible(true);
    } catch (error) {
      setAlertMessage('Failed to open attachments');
      setAlertModal(true);
    }
  };

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
        key: 'formattedRelationship', // Use the formatted version
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
    isRTL: isRTL,
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
    };
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

  const handleButtonPress = (buttonType, itemData) => {
    switch (buttonType) {
      case 'edit':
        handleEditPress(itemData);
        break;
      case 'delete':
        handleDeletePress(itemData);
        break;
      case 'attachment':
        handleReceiptAttachmentPress(itemData);
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
        Name: itemData.Name,
        FirstName: itemData.FirstName,
        MiddleName: itemData.MiddleName,
        LastName: itemData.LastName,
        RelationShipTypeId: itemData.RelationShipTypeId,
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
        const response = await deleteFamilyContactRecord({
          records: [itemToDelete],
        });

        if (response?.[0]?.IsSuccess) {
          notifyDelete('Record deleted successfully');
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
        setIsProcessing(false);
        setButtonProcessing(itemToDelete.RecId, 'delete', false);
        setItemToDelete(null);
        setAlertModal(true);

        setTimeout(() => {
          fetchFamilyContactsData();
        }, 800);
      }
    }, 100);
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

  const renderFamilyContactCard = ({item}) => {
    const isHighlighted = highlightedRecId === item.RecId;
    const itemProcessingButtons = processingButtons[item.RecId] || [];

    // Format the relationship type
    const formatRelationshipType = value => {
      if (!value) return value;
      return value.replace(/([A-Z])/g, ' $1').trim();
    };

    const processedItem = {
      ...item,
      employeeId: item.employeeId || effectiveEmployeeId,
      employeeName: item.employeeName || effectiveEmployeeName,
      formattedRelationship: formatRelationshipType(item.RelationShipTypeId),
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
        searchQuery={searchQuery}
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
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={handleFamilyContactRecordCreate}
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

      <DynamicAttachmentModal
        visible={attachmentModalVisible}
        recordData={selectedContactItem}
        recordIdKey="RecId"
        tableName="DirPartyTable"
        onClose={() => {
          setAttachmentModalVisible(false);
          setSelectedContactItem(null);
        }}
        onSave={() => {
          fetchFamilyContactsData();
        }}
        legalEntity={selectedLegalEntity}
        employeeId={effectiveEmployeeId}
        employeeName={effectiveEmployeeName}
        modalTitle="Contact Attachments"
        showDetails={true}
        detailFields={[
          {key: 'Name', label: 'Name'},
          {key: 'RelationShipTypeId', label: 'Relationship'},
        ]}
        detailData={selectedContactItem || {}}
        showTakePhoto={
          getStatusLabel(selectedContactItem?.WFStatus) === 'Draft'
        }
        showChooseFile={
          getStatusLabel(selectedContactItem?.WFStatus) === 'Draft'
        }
        showDownload={true}
        showDelete={getStatusLabel(selectedContactItem?.WFStatus) === 'Draft'}
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

export {FamilyContact_ListPage};
