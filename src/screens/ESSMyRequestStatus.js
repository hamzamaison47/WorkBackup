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
  StyleSheet,
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

  // Filter state - using the summary tiles
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
     Filter Logic (using summary tiles)
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
        style={cardStyles.cardWrapper}>
        <View
          style={[
            cardStyles.card,
            {borderLeftColor: statusColor, borderLeftWidth: 4},
          ]}>
          {/* Table Name */}
          <View style={cardStyles.tableNameSection}>
            <Text style={cardStyles.labelText}>Type</Text>
            <Text style={cardStyles.tableNameText}>
              {item.tableName || 'N/A'}
            </Text>
          </View>

          {/* Request ID */}
          <View style={cardStyles.section}>
            <Text style={cardStyles.labelText}>Request ID</Text>
            <Text style={cardStyles.requestIdText}>
              {item.requestId || 'N/A'}
            </Text>
          </View>

          {/* Description */}
          <View style={cardStyles.section}>
            <Text style={cardStyles.labelText}>Description</Text>
            <Text style={cardStyles.descriptionText} numberOfLines={2}>
              {item.description || 'No description available'}
            </Text>
          </View>

          {/* Created Date Only */}
          <View style={cardStyles.footerSection}>
            <View style={cardStyles.dateRow}>
              <Text style={cardStyles.dateIcon}>📅</Text>
              <Text style={cardStyles.dateText}>
                Modified Date: {formatDateTime(item.ModifiedDateTime)}
              </Text>
            </View>
          </View>

          {/* Status Indicator */}
          <View
            style={[
              cardStyles.statusIndicator,
              {backgroundColor: statusColor},
            ]}>
            <Text style={cardStyles.statusIndicatorText}>
              {item.status || 'Unknown'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /* ==============================
     Filter Tiles (replacing tabs)
  ============================== */

  const renderFilterTiles = () => {
    const counts = getStatusCounts();

    const filters = [
      {key: 'All', label: 'All', count: counts.all},
      {key: 'Pending', label: 'Pending', count: counts.pending},
      {key: 'Approved', label: 'Approved', count: counts.approved},
      {key: 'Rejected', label: 'Rejected', count: counts.rejected},
    ];

    return (
      <View style={tileStyles.container}>
        {filters.map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[
              tileStyles.tile,
              filter.key === 'Pending' && tileStyles.pendingTile,
              filter.key === 'Approved' && tileStyles.approvedTile,
              filter.key === 'Rejected' && tileStyles.rejectedTile,
              activeFilter === filter.key && tileStyles.activeTile,
            ]}
            onPress={() => setActiveFilter(filter.key)}>
            <Text
              style={[
                tileStyles.count,
                filter.key === 'Pending' && tileStyles.pendingText,
                filter.key === 'Approved' && tileStyles.approvedText,
                filter.key === 'Rejected' && tileStyles.rejectedText,
                activeFilter === filter.key && tileStyles.activeCount,
              ]}>
              {filter.count}
            </Text>
            <Text
              style={[
                tileStyles.label,
                activeFilter === filter.key && tileStyles.activeLabel,
              ]}>
              {filter.label}
            </Text>
            {activeFilter === filter.key && (
              <View style={tileStyles.activeIndicator} />
            )}
          </TouchableOpacity>
        ))}
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
      {/* Filter Tiles - Always visible */}
      {!isLoading && requestData.length > 0 && renderFilterTiles()}

      {isLoading ? (
        <CustomIndicator />
      ) : filteredData.length > 0 ? (
        <FlatList
          data={filteredData}
          renderItem={renderRequestCard}
          keyExtractor={item => item.recId?.toString()}
          contentContainerStyle={listStyles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchRequestStatus}
            />
          }
          ListHeaderComponent={
            <View style={listStyles.filterHeader}>
              <Text style={listStyles.filterTitle}>
                {activeFilter === 'All'
                  ? 'All Requests'
                  : `${activeFilter} Requests (${filteredData.length})`}
              </Text>
            </View>
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={listStyles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchRequestStatus}
            />
          }>
          <View style={listStyles.emptyState}>
            <Text style={listStyles.emptyIcon}>📋</Text>
            <Text style={listStyles.emptyTitle}>
              {activeFilter === 'All'
                ? 'No Requests Found'
                : `No ${activeFilter} Requests`}
            </Text>
            <Text style={listStyles.emptySubtitle}>
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

/* ==============================
   STYLES
============================== */

const cardStyles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    position: 'relative',
  },
  tableNameSection: {
    marginBottom: 12,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  section: {
    marginBottom: 12,
  },
  requestIdText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007bff',
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#495057',
  },
  footerSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateIcon: {
    fontSize: 12,
  },
  dateText: {
    fontSize: 11,
    color: '#6c757d',
  },
  statusIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    opacity: 0.9,
  },
  statusIndicatorText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

const tileStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tile: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e9ecef',
    position: 'relative',
  },
  pendingTile: {
    backgroundColor: '#fff8e1',
    borderColor: '#ffeaa7',
  },
  approvedTile: {
    backgroundColor: '#e8f5e9',
    borderColor: '#c3e6cb',
  },
  rejectedTile: {
    backgroundColor: '#ffebee',
    borderColor: '#f5c6cb',
  },
  activeTile: {
    borderColor: '#007bff',
    borderWidth: 2,
    transform: [{scale: 1.02}],
  },
  count: {
    fontSize: 24,
    fontWeight: '800',
    color: '#212529',
    marginBottom: 4,
  },
  pendingText: {
    color: '#fd7e14',
  },
  approvedText: {
    color: '#28a745',
  },
  rejectedText: {
    color: '#dc3545',
  },
  activeCount: {
    color: '#007bff',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6c757d',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activeLabel: {
    color: '#007bff',
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 20,
    height: 3,
    backgroundColor: '#007bff',
    borderRadius: 1.5,
  },
});

const listStyles = StyleSheet.create({
  listContainer: {
    paddingVertical: 8,
    paddingBottom: 24,
  },
  filterHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    marginBottom: 4,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#495057',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
});
