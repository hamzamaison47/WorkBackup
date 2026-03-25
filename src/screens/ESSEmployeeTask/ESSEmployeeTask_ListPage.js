import React, {useState, useCallback} from 'react';
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

import ActionPaneContainer from '../../components/ActionPaneContainer';
import DynamicRequestCard from '../../components/DynamicRequestCard';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import AlertModal from '../../components/Alert/AlertModal';

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

  /** Fetch Tasks from API */
  const fetchAllTasks = useCallback(async () => {
    if (!effectiveEmployeeId) return;

    setIsLoading(true);
    try {
      const response = await retrieveAllESSEmployeeTask({
        employeeId: effectiveEmployeeId,
      });
      console.log('Tasks from API:', response);

      setTaskData(response || []);
    } catch (error) {
      console.log('Task fetch error', error);
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

  /** Card configuration */
  const cardConfig = {
    headerConfig: {title: {key: 'name'}, subtitle: {key: 'displayRegarding'}},
    fields: [
      {
        key: 'description',
        label: taskData[0]?.descriptionlbl || 'Description',
        type: 'text',
      },
      {
        key: 'displayProcessType',
        label: taskData[0]?.displayProcessTypelbl || 'Process Type',
        type: 'text',
      },
      {key: 'status', label: taskData[0]?.Statuslbl || 'Status', type: 'text'},
    ],
    expandableFields: [
      {
        key: 'displayRegarding',
        label: taskData[0]?.displayRegardinglbl || 'Regarding',
        type: 'text',
      },
      {
        key: 'dueDate',
        label: taskData[0]?.dueDatelbl || 'Due Date',
        type: 'date',
      },
      {
        key: 'IsOptional',
        label: taskData[0]?.IsOptional || 'Optional',
        type: 'text',
      },
      {
        key: 'displayActionLinkLabelValue',
        label: taskData[0]?.displayActionLinkLabelValue || 'Task Link',
        type: 'text',
      },
    ],
    gradientColors: ['#6ee0ff', '#bddeff', '#cce6ff'],
    isRTL: isRTL,
  };
  const getButtonConfig = () => {
    return {
      approval: {
        show: true,
        position: 'bottom',
        style: 'approval_dropdown',
        text: 'Change Status',
        icon: 'check-square-o',
        textColor: '#0A66C2',
        disabled: false,
        actions: [
          {
            key: 'inprogress',
            label: 'In Progress',
            icon: 'play',
          },
          {
            key: 'confirmed',
            label: 'Confirmed',
            icon: 'check',
          },
          {
            key: 'cancelled',
            label: 'Cancelled',
            icon: 'times',
          },
        ],
      },
    };
  };

  /** Dropdown Click (No functionality yet) */
  const handleButtonPress = () => {
    console.log('Dropdown clicked');
  };

  /** Handle Dropdown Actions */

  /** Render Task Card */
  const renderTaskCard = ({item}) => {
    if (!item) return null;

    const processedItem = {
      recId: item['a:recId'] || item.recId || '', // ✅ ensure lowercase recId
      name: item['a:name'] || item.name || '',
      description: item['a:description'] || item.description || '',
      displayRegarding:
        item['a:displayRegarding'] || item.displayRegarding || '',
      status: item['a:Status'] || item.status || '',
      IsOptional: item['a:IsOptional'] || item.IsOptional || '',
      displayActionLinkLabelValue:
        item['a:displayActionLinkLabelValue'] ||
        item.displayActionLinkLabelValue ||
        '',
      displayProcessType:
        item['a:displayProcessType'] || item.displayProcessType || '',
      dueDate: item['a:dueDate'] || item.dueDate || '',
    };
    const buttonConfig = getButtonConfig();

    console.log('Processed Item for Card:', processedItem); // ✅ Verify recId here

    return (
      <DynamicRequestCard
        data={processedItem}
        headerConfig={cardConfig.headerConfig}
        fields={cardConfig.fields}
        expandableFields={cardConfig.expandableFields}
        buttons={buttonConfig}
        onButtonPress={handleButtonPress}
        isExpandable={true}
        onPress={() => {
          console.log(processedItem);
          if (processedItem.recId) {
            console.log(
              'Navigating to ESSEmployeeTaskDetail with recId:',
              processedItem.recId,
            );
            navigation.navigate('ESSEmployeeTaskDetail', {
              recId: processedItem.recId,
            });
          } else {
            console.warn('recId missing for task card, cannot navigate.');
          }
        }}
        gradientColors={cardConfig.gradientColors}
        isRTL={isRTL}
      />
    );
  };

  return (
    <ActionPaneContainer
      pageTitle="Employee Task"
      showFooter
      isHeaderActive
      onRefresh={handleRefresh}
      showPageTitleRow
      showFloatingButton={false}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <CustomIndicator />
        </View>
      ) : taskData.length > 0 ? (
        <FlatList
          data={taskData}
          renderItem={renderTaskCard}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No Tasks Found</Text>
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

const styles = StyleSheet.create({
  loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  listContainer: {paddingBottom: 20},
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  noDataText: {fontSize: 16, color: '#555'},
});

export default ESSEmployeeTask_ListPage;
