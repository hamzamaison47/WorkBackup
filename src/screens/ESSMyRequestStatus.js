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
  TouchableOpacity,
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
  // Get userData from Redux as fallback
  const reduxUserData = useSelector(state => state.user.userData);
  const effectiveUserData = routeUserData || reduxUserData;

  // Use effective user data for all operations
  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
  const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;
  const effectiveWorkerRecId = WorkerRecId || effectiveUserData?.WorkerRecId;

  console.log('Employee ID:', effectiveEmployeeId);

  const [requestData, setRequestData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Filter state - using pill buttons
  const [activeFilter, setActiveFilter] = useState('All');

  /* ==============================
     Fetch Request Status Data
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
      console.log('here is the adta', data);

      const formattedData = (data || []).map((item, index) => ({
        id: item.RecId ?? index,
        requestId: item.RequestId,
        description: item.Description,
        status: item.PRWFStatus,
        recId: item.RecId,
        tableName: item.TableName,
        ModifiedDateTime: item.ModifiedDateTime,
      }));

      setRequestData(formattedData);
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
     Filter Logic (using pill buttons)
  ============================== */

  const getFilteredData = () => {
    switch (activeFilter) {
      case 'All':
        return requestData;
      case 'Pending':
        return requestData.filter(
          item =>
            item.status?.toLowerCase().includes('pending') ||
            item.status?.toLowerCase() === 'submitted',
        );
      case 'Approved':
        return requestData.filter(
          item => item.status?.toLowerCase() === 'approved',
        );
      case 'Rejected':
        return requestData.filter(
          item => item.status?.toLowerCase() === 'rejected',
        );
      default:
        return requestData;
    }
  };

  /* ==============================
     Get Status Counts
  ============================== */

  const getStatusCounts = () => {
    const pending = requestData.filter(
      item =>
        item.status?.toLowerCase().includes('pending') ||
        item.status?.toLowerCase() === 'submitted',
    ).length;

    const approved = requestData.filter(
      item => item.status?.toLowerCase() === 'approved',
    ).length;

    const rejected = requestData.filter(
      item => item.status?.toLowerCase() === 'rejected',
    ).length;

    return {
      all: requestData.length,
      pending,
      approved,
      rejected,
    };
  };

  /* ==============================
     Format Date
  ============================== */

  const formatDateTime = dateTimeString => {
    if (!dateTimeString) return 'N/A';

    try {
      const date = new Date(dateTimeString);
      const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      };
      return date.toLocaleDateString('en-US', options);
    } catch {
      return dateTimeString;
    }
  };

  /* ==============================
     Get Status Color
  ============================== */

  const getStatusColor = status => {
    const statusLower = status?.toLowerCase() || '';

    if (statusLower === 'approved') {
      return '#28a745';
    } else if (statusLower === 'rejected') {
      return '#dc3545';
    } else if (statusLower.includes('pending') || statusLower === 'submitted') {
      return '#fd7e14';
    } else {
      return '#6c757d';
    }
  };

  /* ==============================
     Render Card
  ============================== */

  const renderRequestCard = ({item}) => {
    const statusColor = getStatusColor(item.status);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          // Navigate based on filter
          switch (activeFilter) {
            case 'Pending':
              console.log('Navigate to pending detail:', item.recId);
              break;
            case 'Approved':
              console.log('Navigate to approved detail:', item.recId);
              break;
            case 'Rejected':
              console.log('Navigate to rejected detail:', item.recId);
              break;
            default:
              console.log('Navigate to detail:', item.recId);
          }
        }}
        style={styles.ESS_cardWrapper}>
        <View
          style={[
            styles.ESS_card,
            {borderLeftColor: statusColor, borderLeftWidth: 4},
          ]}>
          {/* Table Name */}
          <View style={styles.ESS_tableNameSection}>
            <Text style={styles.ESS_labelText}>Type</Text>
            <Text style={styles.ESS_tableNameText}>
              {item.tableName || 'N/A'}
            </Text>
          </View>

          {/* Request ID */}
          <View style={styles.ESS_section}>
            <Text style={styles.ESS_labelText}>Request ID</Text>
            <Text style={styles.ESS_requestIdText}>
              {item.requestId || 'N/A'}
            </Text>
          </View>

          {/* Description */}
          <View style={styles.ESS_section}>
            <Text style={styles.ESS_labelText}>Description</Text>
            <Text style={styles.ESS_descriptionText} numberOfLines={2}>
              {item.description || 'No description available'}
            </Text>
          </View>

          {/* Created Date Only */}
          <View style={styles.ESS_footerSection}>
            <View style={styles.ESS_dateRow}>
              <Text style={styles.ESS_dateIcon}>📅</Text>
              <Text style={styles.ESS_dateText}>
                Modified Date: {formatDateTime(item.ModifiedDateTime)}
              </Text>
            </View>
          </View>

          {/* Status Indicator */}
          <View
            style={[
              styles.ESS_statusIndicator,
              {backgroundColor: statusColor},
            ]}>
            <Text style={styles.ESS_statusIndicatorText}>
              {item.status || 'Unknown'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /* ==============================
     Filter Pills (using global styles)
  ============================== */

  const renderFilterPills = () => {
    const counts = getStatusCounts();

    const filters = [
      {key: 'All', label: 'All', count: counts.all, color: '#0066CC'},
      {
        key: 'Pending',
        label: 'Pending',
        count: counts.pending,
        color: '#0066CC',
      },
      {
        key: 'Approved',
        label: 'Approved',
        count: counts.approved,
        color: '#0066CC',
      },
      {
        key: 'Rejected',
        label: 'Rejected',
        count: counts.rejected,
        color: '#0066CC',
      },
    ];

    return (
      <View style={styles.Pill_container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.Pill_scrollContent}>
          {filters.map(filter => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.Pill_pill,
                activeFilter === filter.key && styles.Pill_activePill,
                activeFilter === filter.key && {backgroundColor: filter.color},
              ]}
              onPress={() => setActiveFilter(filter.key)}>
              <Text
                style={[
                  styles.Pill_pillText,
                  activeFilter === filter.key && styles.Pill_activePillText,
                ]}>
                {filter.label} ({filter.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
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
      onRefresh={fetchRequestStatus}>
      {/* Filter Pills - Always visible */}
      {!isLoading && requestData.length > 0 && renderFilterPills()}

      {isLoading ? (
        <CustomIndicator />
      ) : filteredData.length > 0 ? (
        <FlatList
          data={filteredData}
          renderItem={renderRequestCard}
          keyExtractor={item => item.recId?.toString()}
          contentContainerStyle={styles.ESS_listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchRequestStatus}
            />
          }
          ListHeaderComponent={
            <View style={styles.ESS_filterHeader}>
              <Text style={styles.ESS_filterTitle}>
                {activeFilter === 'All'
                  ? 'All Requests'
                  : `${activeFilter} Requests (${filteredData.length})`}
              </Text>
            </View>
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.ESS_emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchRequestStatus}
            />
          }>
          <View style={styles.ESS_emptyState}>
            <Text style={styles.ESS_emptyIcon}>📋</Text>
            <Text style={styles.ESS_emptyTitle}>
              {activeFilter === 'All'
                ? 'No Requests Found'
                : `No ${activeFilter} Requests`}
            </Text>
            <Text style={styles.ESS_emptySubtitle}>
              {activeFilter === 'All'
                ? 'You have not submitted any requests yet'
                : `You have no ${activeFilter.toLowerCase()} requests at the moment`}
            </Text>
          </View>
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
