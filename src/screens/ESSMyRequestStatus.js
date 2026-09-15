/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
import React, {useState, useCallback} from 'react';
import {
  Text,
  FlatList,
  BackHandler,
  RefreshControl,
  ScrollView,
  View,
  Pressable,
} from 'react-native';
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import ActionPaneContainer from '../components/ActionPaneContainer';
import CustomIndicator from '../components/CustomIndicator/CustomIndicator';
import AlertModal from '../components/Alert/AlertModal';
import DynamicRequestCard from '../components/DynamicRequestCard';

import {retrieveMyRequestStatus} from '../API/ESSMyRequestStatus/retrieveAllESSMyRequestStatus';
import {retrieveMyReuestStatusAll} from '../API/ESSMyRequestStatus/retrieveMyReuestStatusAll';
import useListFilters from '../hooks/useListFilters';
import ListFilterBar from '../components/Filters/ListFilterBar';
import styles from '../styles/styles';

const ESSMyRequestStatusListPage = () => {
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

  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Source data; filtering/sorting/search all derive from this via the hook.
  const [rawData, setRawData] = useState([]);

  /* ==============================
     Fetch Data
  ============================== */

  const fetchRequestStatus = useCallback(async () => {
    if (!effectiveEmployeeId) {
      setAlertMessage('Employee ID not found.');
      setAlertModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const data = await retrieveMyReuestStatusAll({
        email: effectiveUserData.email,
      });
      // const formattedData = (data || []).map((item, index) => ({
      //   id: item.RecId ?? index,
      //   recId: item.RecId,
      //   // Keep raw fields — no joining/splitting
      //   RequestId: item.RequestId || '',
      //   Description: item.Description || '',
      //   PRWFStatus: item.PRWFStatus || '',
      //   TableName: item.TableName || '',
      //   ModifiedDateTime: item.ModifiedDateTime || '',
      // }));
      const formattedData = (data || []).map((item, index) => {
        const documentStr = item.Document || '';

        // Extract the document ID (everything after ':' and before ',')
        const documentIdMatch = documentStr.match(/:\s*([^,]+)/);
        const documentId = documentIdMatch
          ? documentIdMatch[1].trim()
          : documentStr;

        // Extract requester (after last comma)
        const requesterMatch = documentStr.match(/,?\s*([^,]+)$/);
        const requester = requesterMatch ? requesterMatch[1].trim() : '';

        // Get document type from API if exists
        let documentType = item.DocumentType || '';
        documentType = documentType.replace(/\b\w/g, l => l.toUpperCase());
        documentType =
          documentType
            .replace(/^\s*Employee\s+Self\s+Service\s*[-:]?\s*/i, '')
            .trim() || documentType;

        return {
          id: item.workflowWorkItemRecId ?? index,
          recId: item.workflowWorkItemRecId,
          documentId: documentId, // USMF-00060
          documentType: documentType, // Employee Leave Requests
          requester: requester,
          ContextTableId: item.ContextTableId,
          ContextRecId: item.ContextRecId,
          workflowWorkItemType: item.workflowWorkItemType,
          Document: item.Document,
          createdDateTime: item.createdDateTime,
          From: item.From,
          Subject: item.Subject,
        };
      });
      setRawData(formattedData);
    } catch (error) {
      setAlertMessage('Failed to fetch request status data.');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [effectiveEmployeeId]);

  useFocusEffect(
    useCallback(() => {
      fetchRequestStatus();
    }, [fetchRequestStatus]),
  );

  /* ==============================
     Back Handling
  ============================== */

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.goBack();
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, []),
  );

  /* ==============================
     Filter Logic
  ============================== */

  // Normalise raw API status to a pill-friendly label
  const normaliseStatus = status => {
    const s = status?.toLowerCase() || '';
    if (s === 'approved') return 'Approved';
    if (s === 'rejected') return 'Rejected';
    if (s.includes('pending') || s === 'submitted') return 'Pending';
    if (s === 'completed' || s === 'workflowcompleted') return 'Completed';
    return 'Draft';
  };

  // Status pills are derived from the data via normaliseStatus; date presets +
  // search scan all values (parity with the previous implementation).
  const f = useListFilters({
    data: rawData,
    dateField: 'createdDateTime',
    classifyPill: item => normaliseStatus(item.PRWFStatus),
  });

  /* ==============================
     Format helpers
  ============================== */

  const formatDateTime = dateTimeString => {
    if (!dateTimeString) return 'N/A';
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateTimeString;
    }
  };

  /* ==============================
     Card Config
  ============================== */

  const CARD_CONFIG = {
    headerConfig: {
      title: {key: 'documentType'},
    },
    fields: [
      // {key: 'Document', label: '', type: 'link'},
      {key: 'Subject', label: 'Subject', type: 'text'},
      {key: 'createdDateTime', label: 'Created date time', type: 'datetime'},
      {key: 'From', label: 'From', type: 'text'},
    ],
  };

  // No action buttons — read-only list
  const BUTTON_CONFIG = {};

  /* ==============================
     Render Card
  ============================== */

  const renderRequestCard = ({item}) => {
    const processedItem = {
      ...item,
      ModifiedDateTime: formatDateTime(item.ModifiedDateTime),
      PRWFStatus: item.PRWFStatus || 'Unknown',
    };

    const handleCardPress = () => {
      navigation.push('WorkflowHistoryScreen', {
        recId: item.ContextRecId,
        tableId: item.ContextTableId,
        cameFrom: 'ESSMyRequestStatusListPage',
      });
    };

    return (
      <DynamicRequestCard
        data={processedItem}
        headerConfig={CARD_CONFIG.headerConfig}
        fields={CARD_CONFIG.fields}
        buttons={BUTTON_CONFIG}
        onButtonPress={() => {}}
        onPress={handleCardPress} // ← pass directly as onPress prop
        isExpandable={false}
        processingButtons={[]}
        showNavigationArrow={true}
        isClickable={true}
        searchQuery={f.searchQuery}
      />
    );
  };

  /* ==============================
     UI
  ============================== */

  const filteredData = f.filteredData;

  return (
    <ActionPaneContainer
      pageTitle="My Request Status"
      isBackButton={true}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={true}
      onRefresh={fetchRequestStatus}
      showPageTitleRow={true}
      showSearchBar={true}
      {...f.actionPaneProps}>
      <ListFilterBar filters={f} showDocumentTypeFilter />

      {isLoading ? (
        <CustomIndicator />
      ) : filteredData.length > 0 ? (
        <FlatList
          data={filteredData}
          renderItem={renderRequestCard}
          keyExtractor={item => item.recId?.toString()}
          contentContainerStyle={styles.DLP_ListContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchRequestStatus}
            />
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.DLP_NoDataContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchRequestStatus}
            />
          }>
          {f.searchQuery.trim() ? (
            <Text style={styles.DLP_NoDataSubText}>
              No records match "{f.searchQuery}"
            </Text>
          ) : rawData.length === 0 ? (
            <>
              {/* <Text style={styles.DLP_NoDataText}>No requests found</Text>
              <Text style={styles.DLP_NoDataSubText}>
                You have not submitted any requests yet
              </Text> */}
            </>
          ) : (
            <Text style={styles.DLP_NoDataText}>
              {`${f.activeFilter} record not found.`}
            </Text>
          )}
        </ScrollView>
      )}

      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
    </ActionPaneContainer>
  );
};

export default ESSMyRequestStatusListPage;
