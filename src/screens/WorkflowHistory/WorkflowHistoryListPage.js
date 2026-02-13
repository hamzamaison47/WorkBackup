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
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';

// Components
import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import DynamicRequestCard from '../../components/DynamicRequestCard';
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
      setWorkflowData(data);
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
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateTimeStr;
    }
  };

  // 🔹 Get badge style based on tracking type
  const getBadgeStyle = trackingType => {
    const type = trackingType?.toLowerCase() || '';
    if (type.includes('completed') || type.includes('approved')) {
      return 'success';
    } else if (type.includes('pending') || type.includes('submitted')) {
      return 'warning';
    } else if (type.includes('rejected') || type.includes('cancelled')) {
      return 'danger';
    }
    return 'default';
  };

  // 🔹 Define Card Config
  const cardConfig = {
    headerConfig: {
      title: {key: 'InstanceNumber', label: 'Instance'},
      subtitle: {key: 'TrackingType'},
    },
    fields: [
      {
        key: 'CreatedDateTime',
        label: 'Created',
        type: 'text',
        transform: formatDateTime,
      },
      {key: 'TrackingMessage', label: 'Message', type: 'text'},
      {key: 'ConfigurationNumber', label: 'Configuration', type: 'text'},
    ],
    expandableFields: [{key: 'RecId', label: 'Record ID', type: 'text'}],
  };

  // 🔹 Button Config (no buttons for workflow history)
  const getButtonConfig = () => ({});

  // 🔹 Button Press Handler
  const handleButtonPress = (buttonType, itemData) => {
    console.log('Button pressed:', buttonType, itemData);
  };

  // 🔹 Render Each Workflow History Card
  const renderWorkflowCard = ({item}) => {
    // Transform data to add formatted values
    const transformedItem = {
      ...item,
      InstanceNumber: `Instance #${item.InstanceNumber || 'N/A'}`,
      ConfigurationNumber: `#${item.ConfigurationNumber || 'N/A'}`,
      TrackingMessage: item.TrackingMessage || 'No message',
    };

    return (
      <DynamicRequestCard
        data={transformedItem}
        headerConfig={cardConfig.headerConfig}
        fields={cardConfig.fields}
        expandableFields={cardConfig.expandableFields}
        buttons={getButtonConfig()}
        onButtonPress={handleButtonPress}
        processingButtons={[]}
        isExpandable={true}
        gradientColors={['#6ee0ff', '#bddeff', '#cce6ff']}
        highlightGradientColors={['#E8F5E8', '#F0FFF0']}
      />
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
        <FlatList
          data={workflowData}
          renderItem={renderWorkflowCard}
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

export default WorkflowHistoryScreen;
