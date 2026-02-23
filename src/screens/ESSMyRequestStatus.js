// /* eslint-disable no-unused-vars */
// /* eslint-disable react-native/no-inline-styles */
// /* eslint-disable react-hooks/exhaustive-deps */
// /* eslint-disable curly */
// import React, {useState, useCallback} from 'react';
// import {
//   Text,
//   FlatList,
//   BackHandler,
//   RefreshControl,
//   ScrollView,
//   View,
//   TouchableOpacity,
// } from 'react-native';
// import {
//   useNavigation,
//   useFocusEffect,
//   useRoute,
// } from '@react-navigation/native';
// import {useSelector} from 'react-redux';
// import ActionPaneContainer from '../components/ActionPaneContainer';
// import CustomIndicator from '../components/CustomIndicator/CustomIndicator';
// import AlertModal from '../components/Alert/AlertModal';

// import {retrieveMyRequestStatus} from '../API/ESSMyRequestStatus/retrieveAllESSMyRequestStatus';
// import styles from '../styles/styles';

// const ESSMyRequestStatusListPage = () => {
//   const navigation = useNavigation();
//   const route = useRoute();

//   const {
//     employeeId,
//     employeeName,
//     WorkerRecId,
//     cameFrom,
//     highlightRecId,
//     userData: routeUserData,
//   } = route.params || {};
//   // Get userData from Redux as fallback
//   const reduxUserData = useSelector(state => state.user.userData);
//   const effectiveUserData = routeUserData || reduxUserData;

//   // Use effective user data for all operations
//   const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
//   const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;
//   const effectiveWorkerRecId = WorkerRecId || effectiveUserData?.WorkerRecId;

//   console.log('Employee ID:', effectiveEmployeeId);

//   const [requestData, setRequestData] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const [alertModal, setAlertModal] = useState(false);
//   const [alertMessage, setAlertMessage] = useState('');

//   // Filter state - using the summary tiles
//   const [activeFilter, setActiveFilter] = useState('All');

//   /* ==============================
//      Fetch Request Status Data
//   ============================== */

//   const fetchRequestStatus = useCallback(async () => {
//     if (!effectiveEmployeeId) {
//       setAlertMessage('Employee ID not found.');
//       setAlertModal(true);
//       return;
//     }

//     setIsLoading(true);
//     try {
//       const data = await retrieveMyRequestStatus({
//         employeeId: effectiveEmployeeId,
//       });
//       console.log('here is the adta', data);

//       const formattedData = (data || []).map((item, index) => ({
//         id: item.RecId ?? index,
//         requestId: item.RequestId,
//         description: item.Description,
//         status: item.PRWFStatus,
//         recId: item.RecId,
//         tableName: item.TableName,
//         ModifiedDateTime: item.ModifiedDateTime,
//       }));

//       setRequestData(formattedData);
//     } catch (error) {
//       setAlertMessage('Failed to fetch request status data.');
//       setAlertModal(true);
//     } finally {
//       setIsLoading(false);
//       setRefreshing(false);
//     }
//   }, [effectiveEmployeeId]);

//   useFocusEffect(
//     useCallback(() => {
//       fetchRequestStatus();
//     }, [fetchRequestStatus]),
//   );

//   /* ==============================
//      Back Handling
//   ============================== */

//   useFocusEffect(
//     useCallback(() => {
//       const onBackPress = () => {
//         navigation.goBack();
//         return true;
//       };

//       BackHandler.addEventListener('hardwareBackPress', onBackPress);
//       return () =>
//         BackHandler.removeEventListener('hardwareBackPress', onBackPress);
//     }, []),
//   );

//   /* ==============================
//      Filter Logic (using summary tiles)
//   ============================== */

//   const getFilteredData = () => {
//     switch (activeFilter) {
//       case 'All':
//         return requestData;
//       case 'Pending':
//         return requestData.filter(
//           item =>
//             item.status?.toLowerCase().includes('pending') ||
//             item.status?.toLowerCase() === 'submitted',
//         );
//       case 'Approved':
//         return requestData.filter(
//           item => item.status?.toLowerCase() === 'approved',
//         );
//       case 'Rejected':
//         return requestData.filter(
//           item => item.status?.toLowerCase() === 'rejected',
//         );
//       default:
//         return requestData;
//     }
//   };

//   /* ==============================
//      Get Status Counts
//   ============================== */

//   const getStatusCounts = () => {
//     const pending = requestData.filter(
//       item =>
//         item.status?.toLowerCase().includes('pending') ||
//         item.status?.toLowerCase() === 'submitted',
//     ).length;

//     const approved = requestData.filter(
//       item => item.status?.toLowerCase() === 'approved',
//     ).length;

//     const rejected = requestData.filter(
//       item => item.status?.toLowerCase() === 'rejected',
//     ).length;

//     return {
//       all: requestData.length,
//       pending,
//       approved,
//       rejected,
//     };
//   };

//   /* ==============================
//      Format Date
//   ============================== */

//   const formatDateTime = dateTimeString => {
//     if (!dateTimeString) return 'N/A';

//     try {
//       const date = new Date(dateTimeString);
//       const options = {
//         year: 'numeric',
//         month: 'short',
//         day: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit',
//       };
//       return date.toLocaleDateString('en-US', options);
//     } catch {
//       return dateTimeString;
//     }
//   };

//   /* ==============================
//      Get Status Color
//   ============================== */

//   const getStatusColor = status => {
//     const statusLower = status?.toLowerCase() || '';

//     if (statusLower === 'approved') {
//       return '#28a745';
//     } else if (statusLower === 'rejected') {
//       return '#dc3545';
//     } else if (statusLower.includes('pending') || statusLower === 'submitted') {
//       return '#fd7e14';
//     } else {
//       return '#6c757d';
//     }
//   };

//   /* ==============================
//      Render Card
//   ============================== */

//   const renderRequestCard = ({item}) => {
//     const statusColor = getStatusColor(item.status);

//     return (
//       <TouchableOpacity
//         activeOpacity={0.7}
//         onPress={() => {
//           // Navigate based on filter
//           switch (activeFilter) {
//             case 'Pending':
//               console.log('Navigate to pending detail:', item.recId);
//               break;
//             case 'Approved':
//               console.log('Navigate to approved detail:', item.recId);
//               break;
//             case 'Rejected':
//               console.log('Navigate to rejected detail:', item.recId);
//               break;
//             default:
//               console.log('Navigate to detail:', item.recId);
//           }
//         }}
//         style={styles.ESS_cardWrapper}>
//         <View
//           style={[
//             styles.ESS_card,
//             {borderLeftColor: statusColor, borderLeftWidth: 4},
//           ]}>
//           {/* Table Name */}
//           <View style={styles.ESS_tableNameSection}>
//             <Text style={styles.ESS_labelText}>Type</Text>
//             <Text style={styles.ESS_tableNameText}>
//               {item.tableName || 'N/A'}
//             </Text>
//           </View>

//           {/* Request ID */}
//           <View style={styles.ESS_section}>
//             <Text style={styles.ESS_labelText}>Request ID</Text>
//             <Text style={styles.ESS_requestIdText}>
//               {item.requestId || 'N/A'}
//             </Text>
//           </View>

//           {/* Description */}
//           <View style={styles.ESS_section}>
//             <Text style={styles.ESS_labelText}>Description</Text>
//             <Text style={styles.ESS_descriptionText} numberOfLines={2}>
//               {item.description || 'No description available'}
//             </Text>
//           </View>

//           {/* Created Date Only */}
//           <View style={styles.ESS_footerSection}>
//             <View style={styles.ESS_dateRow}>
//               <Text style={styles.ESS_dateIcon}>📅</Text>
//               <Text style={styles.ESS_dateText}>
//                 Modified Date: {formatDateTime(item.ModifiedDateTime)}
//               </Text>
//             </View>
//           </View>

//           {/* Status Indicator */}
//           <View
//             style={[
//               styles.ESS_statusIndicator,
//               {backgroundColor: statusColor},
//             ]}>
//             <Text style={styles.ESS_statusIndicatorText}>
//               {item.status || 'Unknown'}
//             </Text>
//           </View>
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   /* ==============================
//      Filter Tiles (replacing tabs)
//   ============================== */

//   const renderFilterTiles = () => {
//     const counts = getStatusCounts();

//     const filters = [
//       {key: 'All', label: 'All', count: counts.all},
//       {key: 'Pending', label: 'Pending', count: counts.pending},
//       {key: 'Approved', label: 'Approved', count: counts.approved},
//       {key: 'Rejected', label: 'Rejected', count: counts.rejected},
//     ];

//     return (
//       <View style={styles.ESS_tileContainer}>
//         {filters.map(filter => (
//           <TouchableOpacity
//             key={filter.key}
//             style={[
//               styles.ESS_tile,
//               filter.key === 'Pending' && styles.ESS_pendingTile,
//               filter.key === 'Approved' && styles.ESS_approvedTile,
//               filter.key === 'Rejected' && styles.ESS_rejectedTile,
//               activeFilter === filter.key && styles.ESS_activeTile,
//             ]}
//             onPress={() => setActiveFilter(filter.key)}>
//             <Text
//               style={[
//                 styles.ESS_tileCount,
//                 filter.key === 'Pending' && styles.ESS_pendingText,
//                 filter.key === 'Approved' && styles.ESS_approvedText,
//                 filter.key === 'Rejected' && styles.ESS_rejectedText,
//                 activeFilter === filter.key && styles.ESS_activeCount,
//               ]}>
//               {filter.count}
//             </Text>
//             <Text
//               style={[
//                 styles.ESS_tileLabel,
//                 activeFilter === filter.key && styles.ESS_activeLabel,
//               ]}>
//               {filter.label}
//             </Text>
//             {activeFilter === filter.key && (
//               <View style={styles.ESS_activeIndicator} />
//             )}
//           </TouchableOpacity>
//         ))}
//       </View>
//     );
//   };

//   /* ==============================
//      UI
//   ============================== */

//   const filteredData = getFilteredData();

//   return (
//     <ActionPaneContainer
//       pageTitle="My Request Status"
//       isBackButton={true}
//       showFooter={false}
//       showFloatingButton={false}
//       isHeaderActive={true}
//       showTabNavigator={false}
//       onRefresh={fetchRequestStatus}>
//       {/* Filter Tiles - Always visible */}
//       {!isLoading && requestData.length > 0 && renderFilterTiles()}

//       {isLoading ? (
//         <CustomIndicator />
//       ) : filteredData.length > 0 ? (
//         <FlatList
//           data={filteredData}
//           renderItem={renderRequestCard}
//           keyExtractor={item => item.recId?.toString()}
//           contentContainerStyle={styles.ESS_listContainer}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={fetchRequestStatus}
//             />
//           }
//           ListHeaderComponent={
//             <View style={styles.ESS_filterHeader}>
//               <Text style={styles.ESS_filterTitle}>
//                 {activeFilter === 'All'
//                   ? 'All Requests'
//                   : `${activeFilter} Requests (${filteredData.length})`}
//               </Text>
//             </View>
//           }
//         />
//       ) : (
//         <ScrollView
//           contentContainerStyle={styles.ESS_emptyContainer}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={fetchRequestStatus}
//             />
//           }>
//           <View style={styles.ESS_emptyState}>
//             <Text style={styles.ESS_emptyIcon}>📋</Text>
//             <Text style={styles.ESS_emptyTitle}>
//               {activeFilter === 'All'
//                 ? 'No Requests Found'
//                 : `No ${activeFilter} Requests`}
//             </Text>
//             <Text style={styles.ESS_emptySubtitle}>
//               {activeFilter === 'All'
//                 ? 'You have not submitted any requests yet'
//                 : `You have no ${activeFilter.toLowerCase()} requests at the moment`}
//             </Text>
//           </View>
//         </ScrollView>
//       )}

//       <AlertModal
//         visible={alertModal}
//         heading="Alert"
//         text={alertMessage}
//         onPress={() => setAlertModal(false)}
//       />
//     </ActionPaneContainer>
//   );
// };

// export default ESSMyRequestStatusListPage;

/* eslint-disable no-unused-vars */
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

  const [requestData, setRequestData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // ── Filter pill state ──
  const [activeFilter, setActiveFilter] = useState('All');
  const [rawData, setRawData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [sortOrder, setSortOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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
      const data = await retrieveMyRequestStatus({
        employeeId: effectiveEmployeeId,
      });

      const formattedData = (data || []).map((item, index) => ({
        id: item.RecId ?? index,
        recId: item.RecId,
        // Keep raw fields — no joining/splitting
        RequestId: item.RequestId || '',
        Description: item.Description || '',
        PRWFStatus: item.PRWFStatus || '',
        TableName: item.TableName || '',
        ModifiedDateTime: item.ModifiedDateTime || '',
      }));

      setRequestData(formattedData);
      setRawData(formattedData); // ← here
      setDisplayData(formattedData); // ← here
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

  // const getFilteredData = () => {
  //   if (activeFilter === 'All') return requestData;
  //   return requestData.filter(
  //     item => normaliseStatus(item.PRWFStatus) === activeFilter,
  //   );
  // };

  const getFilteredData = () => {
    const base = displayData.length > 0 ? displayData : requestData;
    if (activeFilter === 'All') return base;

    return base.filter(item => {
      const status = normaliseStatus(item.PRWFStatus);
      if (activeFilter === 'Pending') return status.includes('Pending');
      return status === activeFilter;
    });
  };

  // Count per pill
  const getFilterCounts = () => {
    const counts = {All: requestData.length};
    ['Draft', 'Pending', 'Approved', 'Rejected', 'Completed'].forEach(pill => {
      counts[pill] = requestData.filter(
        item => normaliseStatus(item.PRWFStatus) === pill,
      ).length;
    });
    return counts;
  };

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
      title: {key: 'TableName'},
    },
    fields: [
      {key: 'RequestId', label: 'Request ID', type: 'text'},
      {key: 'Description', label: 'Description', type: 'text'},
      {key: 'ModifiedDateTime', label: 'Modified Date', type: 'text'},
      {key: 'PRWFStatus', label: '', type: 'status'},
    ],
  };

  // No action buttons — read-only list
  const BUTTON_CONFIG = {};

  /* ==============================
     Render Card
  ============================== */

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

  const renderRequestCard = ({item}) => {
    const processedItem = {
      ...item,
      // Format date for display
      ModifiedDateTime: formatDateTime(item.ModifiedDateTime),
      // PRWFStatus drives the status badge inside DynamicRequestCard
      PRWFStatus: item.PRWFStatus || 'Unknown',
    };

    return (
      <Pressable
        style={({pressed}) => [
          styles.DLP_PressableCard,
          pressed && styles.DLP_PressableCardPressed,
        ]}
        onPress={() => console.log('Navigate to detail:', item.recId)}>
        <DynamicRequestCard
          data={processedItem}
          headerConfig={CARD_CONFIG.headerConfig}
          fields={CARD_CONFIG.fields}
          buttons={BUTTON_CONFIG}
          onButtonPress={() => {}}
          isExpandable={false}
          gradientColors={['#f0f9ff', '#e0f2fe', '#dbeafe']}
          processingButtons={[]}
          showNavigationArrow={false}
          isClickable={true}
        />
      </Pressable>
    );
  };

  /* ==============================
     UI
  ============================== */

  const filteredData = getFilteredData();

  return (
    <ActionPaneContainer
      pageTitle="My Request Status"
      isBackButton={true}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={false}
      onRefresh={fetchRequestStatus}
      // ── Filter pills ──
      showFilterPills={true}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      filterCounts={getFilterCounts()}
      showPageTitleRow={true}
      showSearchBar={true}
      onSearchChange={handleSearch}
      onSortChange={handleSort}
      activeSortOrder={sortOrder}>
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
          <Text style={styles.DLP_NoDataText}>
            {activeFilter === 'All'
              ? 'No requests found'
              : `No ${activeFilter.toLowerCase()} requests`}
          </Text>
          <Text style={styles.DLP_NoDataSubText}>
            {activeFilter === 'All'
              ? 'You have not submitted any requests yet'
              : `You have no ${activeFilter.toLowerCase()} requests at the moment`}
          </Text>
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
