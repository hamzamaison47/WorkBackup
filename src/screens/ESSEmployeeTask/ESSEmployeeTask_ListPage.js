import React, {useState, useCallback, useMemo} from 'react';
import {
  Text,
  FlatList,
  View,
  RefreshControl,
  I18nManager,
  StyleSheet,
} from 'react-native';
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';

import {retrieveAllESSEmployeeTask} from '../../API/ESSEmployeeTask/retrieveAllESSEmployeeTask';
import {updateESSEmployeeTask} from '../../API/ESSEmployeeTask/UpdateESSEmployeeTask';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import DynamicRequestCard from '../../components/DynamicRequestCard';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import AlertModal from '../../components/Alert/AlertModal';
import styles from '../../styles/styles';

const ESSEmployeeTask_ListPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const isRTL = I18nManager.isRTL;

  const reduxUserData = useSelector(state => state.user.userData);
  const {employeeId, userData: routeUserData} = route.params || {};
  const effectiveUserData = routeUserData || reduxUserData;
  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;

  const [isLoading, setIsLoading] = useState(false);
  const [taskData, setTaskData] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const [processingButtons, setProcessingButtons] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  // ✅ REQUIRED STATES
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ FIXED PILLS (ONLY THESE TWO)
  const visiblePills = ['All', 'Active'];
  const getStatus = item => {
    return (item['a:Status'] || item.Status || '').trim();
  };

  /** ================= FILTER ================= */
  const getFilteredData = () => {
    const base = searchQuery.trim()
      ? taskData.filter(item =>
          (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : taskData;

    if (activeFilter === 'All') {
      return base;
    }

    // ✅ Active = In progress + Not started
    if (activeFilter === 'Active') {
      return base.filter(item =>
        ['In progress', 'Not started'].includes(getStatus(item)),
      );
    }

    return base;
  };

  /** ================= COUNTS ================= */
  const getFilterCounts = () => {
    return {
      All: taskData.length,
      Active: taskData.filter(item =>
        ['In progress', 'Not started'].includes(getStatus(item)),
      ).length,
    };
  };

  const handleSearch = value => {
    setSearchQuery(value);
  };

  /** ================= FETCH TASKS ================= */
  const fetchAllTasks = useCallback(async () => {
    if (!effectiveEmployeeId) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await retrieveAllESSEmployeeTask({
        employeeId: effectiveEmployeeId,
      });

      setTaskData(response || []);
    } catch (error) {
      setAlertMessage('Unable to load tasks');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveEmployeeId]);

  useFocusEffect(
    useCallback(() => {
      fetchAllTasks();
    }, [fetchAllTasks]),
  );

  const handleRefresh = () => fetchAllTasks();

  /** ================= PROCESSING HELPER ================= */
  const setButtonProcessing = (recId, buttonType, isProcessing) => {
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: isProcessing
        ? [...(prev[recId] || []), buttonType]
        : (prev[recId] || []).filter(btn => btn !== buttonType),
    }));
  };

  /** ================= BUTTON ACTION ================= */
  const handleButtonPress = async (buttonType, item) => {
    console.log('Button pressed:', buttonType, item);

    const recId = item.recId;
    let statusValue = '';

    // buttonType is a string (like 'Completed', 'In Progress', etc.)
    switch (buttonType) {
      case 'In progress':
        statusValue = 'In progress';
        break;
      case 'Completed':
        statusValue = 'Completed';
        break;
      case 'Canceled':
        statusValue = 'Canceled';
        break;
      default:
        console.log('Unknown button type:', buttonType);
        return;
    }

    console.log('Status value to update:', statusValue);
    console.log('RecId:', recId);
    console.log('EffectiveEmployeeId:', effectiveEmployeeId);

    setIsProcessing(true);
    setButtonProcessing(recId, 'approval', true);

    try {
      console.log('Calling update API with:', {
        recId,
        Status: statusValue,
        contactperson: effectiveEmployeeId,
      });

      const employeeTaskData = {
        recId,
        Status: statusValue,
        contactperson: effectiveEmployeeId,
      };

      await updateESSEmployeeTask({employeeTaskData});

      console.log('here is the data', recId, statusValue, effectiveEmployeeId);

      // ✅ Instant UI update
      setTaskData(prev =>
        prev.map(task =>
          (task['a:recId'] || task.recId) == recId
            ? {
                ...task,
                // status: statusValue,
                Status: statusValue,
                'a:Status': statusValue,
              }
            : task,
        ),
      );

      setAlertMessage('Status updated successfully');
      setAlertModal(true);

      // ✅ Refresh from backend
      setTimeout(() => {
        fetchAllTasks();
      }, 800);
    } catch (error) {
      console.log('Error in update:', error);
      setAlertMessage(error?.message || 'Failed to update status');
      setAlertModal(true);
    } finally {
      setIsProcessing(false);
      setButtonProcessing(recId, 'approval', false);
    }
  };
  /** ================= CARD CONFIG ================= */
  const getButtonConfig = item => {
    const isCompleted = (item['a:Status'] || item.Status || '') === 'Completed';

    return {
      approval: {
        show: !isCompleted,
        position: 'bottom',
        style: 'approval_dropdown',
        text: 'Change Status',
        icon: 'check-square-o',
        textColor: '#0A66C2',
        disabled: false,
        actions: [
          {key: 'In progress', label: 'In progress', icon: 'play'},
          {key: 'Completed', label: 'Completed', icon: 'check'},
          {key: 'Canceled', label: 'Canceled', icon: 'times'},
        ],
      },
    };
  };

  /** ================= RENDER CARD ================= */
  const renderTaskCard = ({item}) => {
    if (!item) {
      return null;
    }
    console.log('Before going to Processing ', item);
    const processedItem = {
      recId: item['a:recId'] || item.recId || '',
      name: item['a:name'] || item.name || '',
      description: item['a:description'] || item.description || '',
      displayRegarding:
        item['a:displayRegarding'] || item.displayRegarding || '',
      Status: item['a:Status'] || item.Status || '',
      IsOptional: item['a:IsOptional'] || item.IsOptional || '',
      displayActionLinkLabelValue:
        item['a:displayActionLinkLabelValue'] ||
        item.displayActionLinkLabelValue ||
        '',
      displayProcessType:
        item['a:displayProcessType'] || item.displayProcessType || '',
      dueDate: item['a:dueDate'] || item.dueDate || '',
    };

    return (
      <DynamicRequestCard
        data={processedItem}
        headerConfig={{
          title: {key: 'name'},
          subtitle: {key: 'displayRegarding'},
        }}
        fields={[
          {key: 'description', label: 'Description', type: 'text'},
          {key: 'displayProcessType', label: 'Process Type', type: 'text'},
          {key: 'Status', label: 'Status', type: 'text'},
        ]}
        expandableFields={[
          {key: 'displayRegarding', label: 'Regarding', type: 'text'},
          {key: 'dueDate', label: 'Due Date', type: 'date'},
          {key: 'IsOptional', label: 'Optional', type: 'text'},
          {
            key: 'displayActionLinkLabelValue',
            label: 'Task Link',
            type: 'text',
          },
        ]}
        buttons={getButtonConfig(item)}
        processingButtons={processingButtons[processedItem.recId] || []}
        onButtonPress={handleButtonPress}
        isExpandable={true}
        gradientColors={['#6ee0ff', '#bddeff', '#cce6ff']}
        isRTL={isRTL}
        onPress={() => {
          if (processedItem.recId) {
            navigation.navigate('ESSEmployeeTaskDetail', {
              recId: processedItem.recId,
            });
          }
        }}
      />
    );
  };

  /** ================= UI ================= */
  return (
    <ActionPaneContainer
      pageTitle="Employee Task"
      showFooter
      isHeaderActive
      onRefresh={handleRefresh}
      showPageTitleRow
      showFloatingButton={false}
      showFilterPills={true}
      filterPills={visiblePills}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      filterCounts={getFilterCounts()}
      // ✅ SEARCH
      showSearchBar={true}
      onSearchChange={handleSearch}>
      {/* Processing Overlay */}
      {isProcessing && (
        <View style={styles.overlay}>
          <CustomIndicator />
        </View>
      )}
      {isLoading ? (
        <View style={styles.DLP_LoadingContainer}>
          <CustomIndicator />
        </View>
      ) : taskData.length > 0 ? (
        <FlatList
          data={getFilteredData()}
          renderItem={renderTaskCard}
          keyExtractor={(item, index) =>
            (item['a:recId'] || item.recId || index).toString()
          }
          contentContainerStyle={styles.DLP_ListContainer}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataTitle}>No Tasks Found</Text>
          <Text style={styles.noDataText}>You're all caught up.</Text>
        </View>
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

// const styles = StyleSheet.create({
// loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
// listContainer: {paddingBottom: 20},
// noDataContainer: {
//   flex: 1,
//   justifyContent: 'center',
//   alignItems: 'center',
// },
// noDataText: {fontSize: 16, color: '#555'},
// overlay: {
//   position: 'absolute',
//   top: 0,
//   left: 0,
//   right: 0,
//   bottom: 0,
//   justifyContent: 'center',
//   alignItems: 'center',
//   backgroundColor: 'rgba(0,0,0,0.3)',
//   zIndex: 999,
// },
// });

export default ESSEmployeeTask_ListPage;
