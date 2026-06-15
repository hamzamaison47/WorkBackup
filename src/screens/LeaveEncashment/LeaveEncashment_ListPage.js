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

import {RetrieveAll} from '../../API/LeaveEncashment/RetrieveAll';

const LeaveEncashment_ListPage = () => {
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
  const [encashmentData, setEncashmentData] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Data
  const fetchEncashmentData = useCallback(async () => {
    if (!effectiveEmployeeId) return;

    setIsLoading(true);

    try {
      const response = await RetrieveAll({
        employeeId: effectiveEmployeeId,
      });

      setEncashmentData(response);
      setRawData(response);
      setDisplayData(response);
    } catch (error) {
      setAlertMessage('Failed to fetch Leave Encashment records');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveEmployeeId]);

  // Screen Focus
  useFocusEffect(
    useCallback(() => {
      fetchEncashmentData();
    }, [fetchEncashmentData]),
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
  const handleCreateEncashment = () => {
    navigation.navigate('LeaveEncashment_SaveRecord', {
      mode: 'create',
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: WorkerRecId,
      userData: effectiveUserData,
      cameFrom: 'LeaveEncashment_ListPage',
    });
  };

  // Refresh
  const handleRefresh = () => {
    fetchEncashmentData();
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

    return base.filter(item => getStatusLabel(item.WFStatus) === activeFilter);
  };

  const getFilterCounts = () => {
    const counts = {All: encashmentData.length};

    [
      ...new Set(encashmentData.map(item => getStatusLabel(item.WFStatus))),
    ].forEach(status => {
      counts[status] = encashmentData.filter(
        item => getStatusLabel(item.WFStatus) === status,
      ).length;
    });

    return counts;
  };

  const visiblePills = useMemo(() => {
    if (!encashmentData.length) return ['All'];

    const unique = [
      ...new Set(encashmentData.map(item => getStatusLabel(item.WFStatus))),
    ];

    return ['All', ...unique];
  }, [encashmentData]);

  // Card Config
  const cardConfig = {
    headerConfig: {
      title: {key: 'RequestId'},
      subtitle: {key: 'EmployeeName'},
    },

    fields: [
      {
        key: 'EmployeeId',
        label: 'Employee Id',
        type: 'text',
      },
      {
        key: 'Description',
        label: 'Designation',
        type: 'text',
      },
      {
        key: 'Department',
        label: 'Department',
        type: 'text',
      },
      {
        key: 'LeavesToEncashed',
        label: 'No of Leaves to be Encashed',
        type: 'text',
      },
      {
        key: 'RequestDate',
        label: 'Requested Date',
        type: 'date',
      },
      {
        key: 'WFStatus',
        label: '',
        type: 'status',
      },
    ],

    expandableFields: [
      {
        key: 'BalanceBeforeApplication',
        label: 'Balance Before Application',
        type: 'text',
      },
      {
        key: 'EarningAmount',
        label: 'Earning Amount',
        type: 'currency',
      },
      {
        key: 'RemainingBalance',
        label: 'Remaining Balance',
        type: 'text',
      },
      {
        key: 'LastEncashmentDate',
        label: 'Last Encashment Date',
        type: 'date',
      },
      {
        key: 'LastEncashmentLeave',
        label: 'Last Encashment Leaves',
        type: 'text',
      },
    ],

    isRTL: isRTL,
  };

  // Render Card
  const renderCard = ({item}) => {
    const processedItem = {
      ...item,
      WFStatus: getStatusLabel(item.WFStatus),
    };

    return (
      <DynamicRequestCard
        data={processedItem}
        headerConfig={cardConfig.headerConfig}
        fields={cardConfig.fields}
        expandableFields={cardConfig.expandableFields}
        isExpandable={true}
        gradientColors={['#6ee0ff', '#bddeff', '#cce6ff']}
        highlightGradientColors={['#E8F5E8', '#F0FFF0']}
        isRTL={isRTL}
        searchQuery={searchQuery}
      />
    );
  };

  return (
    <ActionPaneContainer
      pageTitle="Leave Encashment"
      isBackButton={false}
      showFooter={true}
      showFloatingButton={true}
      onFloatingButtonPress={handleCreateEncashment}
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
            <Text style={styles.DLP_NoDataSubText}>
              No records match "{searchQuery}"
            </Text>
          ) : (
            <>
              <Text style={styles.DLP_NoDataText}>
                No Leave Encashment Records Found
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

export default LeaveEncashment_ListPage;
