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
  StyleSheet,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';

// Components
import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import AlertModal from '../../components/Alert/AlertModal';

// API
import {retrieveWorkflowHistory} from '../../API/WorkflowHistory/retrieveWorkflowHistory';

import styles from '../../styles/styles';

const WorkflowHistoryScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const {recId, tableId} = route.params || {};
  console.log('Here is the data', recId, tableId);

  // 🔹 Modals & Alerts
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // 🔹 Processing states
  const [isLoading, setIsLoading] = useState(false);
  const [workflowData, setWorkflowData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);

  // 🔹 Fetch Workflow History from API
  const fetchWorkflowHistory = useCallback(async () => {
    if (!recId || !tableId) {
      setAlertMessage('Missing required parameters: recId or tableId');
      setAlertModal(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await retrieveWorkflowHistory({
        _recId: recId,
        _tableId: tableId,
      });

      // Store total count before filtering
      setTotalRecords(data.length);

      // Filter to show only unique tracking types (keep the most recent one)
      const uniqueData = [];
      const seenTypes = new Set();

      // Iterate through data (assuming it's already sorted by date, most recent first)
      data.forEach(item => {
        if (!seenTypes.has(item.TrackingType)) {
          seenTypes.add(item.TrackingType);
          uniqueData.push(item);
        }
      });

      setWorkflowData(uniqueData);
    } catch (error) {
      console.log('Failed to fetch workflow history:', error);
      setAlertMessage('Failed to load workflow history');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [recId, tableId]);

  // 🔹 Run fetch when screen focused
  useFocusEffect(
    useCallback(() => {
      fetchWorkflowHistory();
    }, [fetchWorkflowHistory]),
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
  const handleRefresh = () => fetchWorkflowHistory();

  // Handle back navigation
  const handleGoBack = () => {
    navigation.goBack();
  };

  // 🔹 Format DateTime
  const formatDateTime = dateTimeStr => {
    if (!dateTimeStr) return 'N/A';
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateTimeStr;
    }
  };

  // 🔹 Get status config based on tracking type
  const getStatusConfig = trackingType => {
    const type = trackingType?.toLowerCase() || '';

    if (type.includes('created')) {
      return {
        color: '#3b82f6',
        bgColor: '#dbeafe',
        icon: '✦',
        label: 'Created',
      };
    } else if (type.includes('submitted')) {
      return {
        color: '#8b5cf6',
        bgColor: '#ede9fe',
        icon: '↗',
        label: 'Submitted',
      };
    } else if (type.includes('pending')) {
      return {
        color: '#f59e0b',
        bgColor: '#fef3c7',
        icon: '◷',
        label: 'Pending',
      };
    } else if (type.includes('approved') || type.includes('completed')) {
      return {
        color: '#10b981',
        bgColor: '#d1fae5',
        icon: '✓',
        label: 'Approved',
      };
    } else if (type.includes('rejected')) {
      return {
        color: '#ef4444',
        bgColor: '#fee2e2',
        icon: '✕',
        label: 'Rejected',
      };
    } else if (type.includes('cancelled')) {
      return {
        color: '#6b7280',
        bgColor: '#f3f4f6',
        icon: '⊘',
        label: 'Cancelled',
      };
    }

    return {
      color: '#6b7280',
      bgColor: '#f3f4f6',
      icon: '●',
      label: trackingType || 'Unknown',
    };
  };

  // 🔹 Render Timeline Item
  const renderTimelineItem = ({item, index}) => {
    const isLast = index === workflowData.length - 1;
    const statusConfig = getStatusConfig(item.TrackingType);

    return (
      <View style={timelineStyles.itemContainer}>
        {/* Timeline Line */}
        <View style={timelineStyles.timelineColumn}>
          <View
            style={[
              timelineStyles.iconCircle,
              {
                backgroundColor: statusConfig.bgColor,
                borderColor: statusConfig.color,
              },
            ]}>
            <Text style={[timelineStyles.icon, {color: statusConfig.color}]}>
              {statusConfig.icon}
            </Text>
          </View>
          {!isLast && <View style={timelineStyles.timelineLine} />}
        </View>

        {/* Content */}
        <View style={timelineStyles.contentContainer}>
          <View style={timelineStyles.card}>
            {/* Header */}
            <View style={timelineStyles.cardHeader}>
              <View style={timelineStyles.headerLeft}>
                <Text style={timelineStyles.statusText}>
                  {item.TrackingType}
                </Text>
                <Text style={timelineStyles.instanceText}>
                  Instance #{item.InstanceNumber || 'N/A'}
                </Text>
              </View>
              <View
                style={[
                  timelineStyles.statusBadge,
                  {backgroundColor: statusConfig.bgColor},
                ]}>
                <Text
                  style={[
                    timelineStyles.badgeText,
                    {color: statusConfig.color},
                  ]}>
                  {statusConfig.label}
                </Text>
              </View>
            </View>

            {/* Date/Time */}
            <View style={timelineStyles.dateContainer}>
              <Text style={timelineStyles.dateIcon}>🕒</Text>
              <Text style={timelineStyles.dateText}>
                {formatDateTime(item.CreatedDateTime)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ActionPaneContainer
      pageTitle="Workflow History"
      isBackButton={true}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={false}
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}>
      {isLoading ? (
        <View style={styles.DLP_LoadingContainer}>
          <CustomIndicator />
        </View>
      ) : workflowData.length > 0 ? (
        <View style={timelineStyles.container}>
          {/* Summary Header */}
          <View style={timelineStyles.summaryContainer}>
            <Text style={timelineStyles.summaryTitle}>Workflow Timeline</Text>
            <Text style={timelineStyles.summarySubtitle}>
              {workflowData.length} unique{' '}
              {workflowData.length === 1 ? 'status' : 'statuses'}
              {totalRecords > workflowData.length &&
                ` (${totalRecords} total events)`}
            </Text>
          </View>

          {/* Timeline */}
          <FlatList
            data={workflowData}
            renderItem={renderTimelineItem}
            keyExtractor={(item, index) =>
              item.RecId?.toString() || index.toString()
            }
            contentContainerStyle={timelineStyles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={handleRefresh}
              />
            }
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.DLP_NoDataContainer}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }>
          <Text style={styles.DLP_NoDataText}>No Data Found</Text>
          <Text style={styles.DLP_NoDataSubText}>
            No workflow history available
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

const timelineStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  summaryContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timelineColumn: {
    width: 40,
    alignItems: 'center',
    position: 'relative',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    zIndex: 2,
  },
  icon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timelineLine: {
    position: 'absolute',
    top: 36,
    bottom: -4,
    width: 2.5,
    backgroundColor: '#e5e7eb',
    left: '50%',
    marginLeft: -1.25,
  },
  contentContainer: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  instanceText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dateIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  dateText: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '600',
  },
});

export default WorkflowHistoryScreen;
