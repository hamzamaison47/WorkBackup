/* eslint-disable no-shadow */
/* eslint-disable curly */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */

import React, {useState, useCallback, useMemo} from 'react';
import {
  Text,
  FlatList,
  BackHandler,
  RefreshControl,
  ScrollView,
  I18nManager,
  View,
} from 'react-native';

import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';

import {useSelector} from 'react-redux';
import {translate as t} from '../../store/utils/translate';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import DynamicRequestCard from '../../components/DynamicRequestCard';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import AlertModal from '../../components/Alert/AlertModal';

import styles from '../../styles/styles';
import {retrieveAllOverTimePlanner} from '../../API/OvertimePlanner/retrieveAllOverTimePlanner';

const OvertimePlanner_ListPage = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    employeeId,
    employeeName,
    WorkerRecId,
    cameFrom,
    userData: routeUserData,
  } = route.params || {};

  const reduxUserData = useSelector(state => state.user.userData);
  const effectiveUserData = routeUserData || reduxUserData;

  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
  const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;

  const isRTL = I18nManager.isRTL;

  const [isLoading, setIsLoading] = useState(false);
  const [overtimeData, setOvertimeData] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Data
  const fetchOvertimeData = useCallback(async () => {
    if (!effectiveEmployeeId) return;

    setIsLoading(true);

    try {
      const response = await retrieveAllOverTimePlanner({
        employeeId: effectiveEmployeeId,
      });

      console.log(
        'OvertimePlanner API response:',
        JSON.stringify(response, null, 2),
      );

      setOvertimeData(response);
      setRawData(response);
      setDisplayData(response);
    } catch (error) {
      setAlertMessage('Failed to fetch Overtime Planner records');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveEmployeeId]);

  // Screen Focus
  useFocusEffect(
    useCallback(() => {
      fetchOvertimeData();
    }, [fetchOvertimeData]),
  );

  // Back Handler
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleGoBack();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, []),
  );

  // Handle Back
  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainDashboard');
    }
  };

  // ─── FIXED: Time Formatter ────────────────────────────────────────────────
  // Dynamics AX / D365 stores time fields as **seconds since midnight**.
  // e.g.  28800 → 8 h  → 8:00:00 AM
  //       68400 → 19 h → 7:00:00 PM
  // The old code passed the number straight into `new Date()` which treated it
  // as a Unix timestamp (ms) and applied the local timezone offset, causing the
  // wrong time to appear on the mobile card.
  const formatTime = timeStr => {
    if (timeStr === null || timeStr === undefined || timeStr === '') return '';

    // ── Number: treat as Dynamics AX "seconds since midnight" ──────────────
    if (typeof timeStr === 'number') {
      const totalSeconds = timeStr; // e.g. 28800
      const hours24 = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const ampm = hours24 >= 12 ? 'PM' : 'AM';
      const hours12 = hours24 % 12 || 12;

      return `${hours12}:${String(minutes).padStart(2, '0')}:${String(
        seconds,
      ).padStart(2, '0')} ${ampm}`;
    }

    // ── String: force to string and try H:mm:ss / HH:mm:ss / HH:mm ─────────
    const str = String(timeStr);

    const parts = str.split(':');
    if (parts.length >= 2 && !isNaN(parseInt(parts[0], 10))) {
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1].padStart(2, '0');
      const seconds = parts[2] ? parts[2].padStart(2, '0') : '00';
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${hours}:${minutes}:${seconds} ${ampm}`;
    }

    // ── ISO date string fallback ─────────────────────────────────────────────
    const date = new Date(str);
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    }

    return str;
  };
  // ─────────────────────────────────────────────────────────────────────────

  // Handle Create
  const handleCreateOvertime = () => {
    navigation.navigate('OvertimePlanner_Create', {
      mode: 'create',
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: WorkerRecId,
      userData: effectiveUserData,
      cameFrom: 'OvertimePlanner_ListPage',
    });
  };

  // Refresh
  const handleRefresh = () => {
    fetchOvertimeData();
  };

  // Status Label
  const getStatusLabel = status => {
    const statusMap = {
      NotSubmitted: 'Draft',
      Submitted: 'Submitted',
      Approved: 'Approved',
      Rejected: 'Rejected',
      Returned: 'Returned',
      Cancelled: 'Cancelled',
    };

    return statusMap[status] || status || 'Draft';
  };

  // Search + Sort
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

  // Filter
  const getFilteredData = () => {
    const base = searchQuery.trim() ? displayData : rawData;

    if (activeFilter === 'All') return base;

    return base.filter(item => getStatusLabel(item.wfStatus) === activeFilter);
  };

  const getFilterCounts = () => {
    const counts = {All: overtimeData.length};

    [
      ...new Set(overtimeData.map(item => getStatusLabel(item.wfStatus))),
    ].forEach(status => {
      counts[status] = overtimeData.filter(
        item => getStatusLabel(item.wfStatus) === status,
      ).length;
    });

    return counts;
  };

  const visiblePills = useMemo(() => {
    if (!overtimeData.length) return ['All'];

    const unique = [
      ...new Set(overtimeData.map(item => getStatusLabel(item.wfStatus))),
    ];

    return ['All', ...unique];
  }, [overtimeData]);

  // Card Config
  const cardConfig = {
    headerConfig: {
      title: {key: 'planId'},
      subtitle: {key: 'employeeName'},
    },

    fields: [
      {
        key: 'employeeId',
        label: 'Employee Id',
        type: 'text',
      },
      {
        key: 'employeeName',
        label: 'Employee Name',
        type: 'text',
      },
      {
        key: 'requestDate',
        label: 'Request Date',
        type: 'date',
      },
      {
        key: 'planDate',
        label: 'Plan Date',
        type: 'date',
      },
      {
        key: 'startTime',
        label: 'Start Time',
        type: 'text',
      },
      {
        key: 'endTime',
        label: 'End Time',
        type: 'text',
      },
      {
        key: 'wfStatus',
        label: '',
        type: 'status',
      },
    ],

    expandableFields: [],

    isRTL: isRTL,
  };

  // Render Card
  const renderCard = ({item}) => {
    const processedItem = {
      ...item,
      wfStatus: getStatusLabel(item.wfStatus),
      startTime: formatTime(item.startTime),
      endTime: formatTime(item.endTime),
    };

    return (
      <DynamicRequestCard
        data={processedItem}
        headerConfig={cardConfig.headerConfig}
        fields={cardConfig.fields}
        expandableFields={cardConfig.expandableFields}
        isExpandable={false}
        gradientColors={['#ffe0b2', '#fff3e0', '#fff8f0']}
        highlightGradientColors={['#FFF3E0', '#FFFDE7']}
        isRTL={isRTL}
        searchQuery={searchQuery}
      />
    );
  };

  return (
    <ActionPaneContainer
      pageTitle="Overtime Planner"
      isBackButton={false}
      showFooter={true}
      showFloatingButton={true}
      onFloatingButtonPress={handleCreateOvertime}
      isHeaderActive={true}
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      showFilterPills={true}
      filterPills={visiblePills}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      filterCounts={getFilterCounts()}
      showPageTitleRow={true}
      showSearchBar={true}
      onSearchChange={handleSearch}
      onSortChange={handleSort}
      activeSortOrder={sortOrder}>
      {isLoading ? (
        <View style={styles.DLP_LoadingContainer}>
          <CustomIndicator />
        </View>
      ) : getFilteredData().length > 0 ? (
        <FlatList
          data={getFilteredData()}
          renderItem={renderCard}
          keyExtractor={(item, index) =>
            item.recId?.toString() || index.toString()
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
            <Text style={styles.DLP_NoDataSubText}>
              No records match "{searchQuery}"
            </Text>
          ) : (
            <>
              <Text style={styles.DLP_NoDataText}>
                No Overtime Planner Records Found
              </Text>
            </>
          )}
        </ScrollView>
      )}

      {/* Alert Modal */}
      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
    </ActionPaneContainer>
  );
};

export default OvertimePlanner_ListPage;
