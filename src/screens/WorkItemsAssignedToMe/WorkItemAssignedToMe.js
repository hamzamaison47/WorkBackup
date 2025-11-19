/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
import React, {useState, useCallback} from 'react';
import {
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
import {useSelector} from 'react-redux';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import AlertModal from '../../components/Alert/AlertModal';
import DynamicRequestCard from '../../components/DynamicRequestCard';

import {RetrieveByEmail} from '../../API/WorkflowTrackingStatusTable/retrieveByEmail';
import ApproveWorkItem from '../../API/WorkflowTrackingStatusTable/ApproveWorkItem';
import RejectWorkItem from '../../API/WorkflowTrackingStatusTable/RejectWorkItem';
import styles from '../../styles/styles';

const WorkItemsAssignedToMePage = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    userData: routeUserData,
    highlightRecId,
    cameFrom,
  } = route.params || {};
  const reduxUserData = useSelector(state => state.user.userData);
  const effectiveUserData = routeUserData || reduxUserData;

  const [tableData, setTableData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [highlightedRecId, setHighlightedRecId] = useState(null);
  const [processingButtons, setProcessingButtons] = useState({});
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const fetchWorkItems = useCallback(async () => {
    if (!effectiveUserData?.email) return;
    setIsLoading(true);
    try {
      const data = await RetrieveByEmail({email: effectiveUserData.email});
      const formattedData = (data || []).map((item, index) => ({
        id: item.CorrelationId ?? index,
        document: item.Document,
        documentType: item.DocumentType,
        correlationId: item.CorrelationId,
        additionalDetails:
          item.AdditionalDetails || `Details for ${item.Document}`,
      }));
      setTableData(formattedData);
    } catch (error) {
      console.error(error);
      setAlertMessage('Failed to fetch work items.');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [effectiveUserData?.email]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      fetchWorkItems();
    }, [fetchWorkItems]),
  );

  // Highlight record if provided
  useFocusEffect(
    useCallback(() => {
      if (highlightRecId) {
        setHighlightedRecId(highlightRecId);
        fetchWorkItems();
        const timer = setTimeout(() => setHighlightedRecId(null), 3000);
        return () => clearTimeout(timer);
      }
    }, [highlightRecId, fetchWorkItems]),
  );

  // Back handler
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

  const handleGoBack = () => {
    let targetRoute = 'MainDashboard';
    switch (cameFrom) {
      case 'MainDashboard':
      case 'DrawerNavigator':
        targetRoute = 'MainDashboard';
        break;
      default:
        navigation.goBack();
        return;
    }
    navigation.reset({
      index: 0,
      routes: [{name: 'TabNavigator', params: {screen: targetRoute}}],
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWorkItems();
  };

  const setButtonProcessing = (recId, buttonType, isProcessing) => {
    setProcessingButtons(prev => ({
      ...prev,
      [recId]: isProcessing
        ? [...(prev[recId] || []), buttonType]
        : (prev[recId] || []).filter(btn => btn !== buttonType),
    }));
  };

  const handleApprovePress = async item => {
    console.log(item);
    setButtonProcessing(item.correlationId, 'approve', true);
    try {
      console.log(
        'Correlation Id Outside Approve Request : ',
        item.correlationId,
      );
      const response = await ApproveWorkItem({
        correlationId: item.correlationId,
      });
      if (response?.success) {
        setAlertMessage(`Approved ${item.document}`);
        setHighlightedRecId(item.correlationId);
        setTimeout(() => setHighlightedRecId(null), 3000);
        fetchWorkItems();
      } else {
        setAlertMessage(`Failed to approve ${item.document}`);
      }
    } catch (error) {
      console.error(error);
      setAlertMessage(`Error approving ${item.document}`);
    } finally {
      setButtonProcessing(item.correlationId, 'approve', false);
      setAlertModal(true);
    }
  };

  const handleRejectPress = async item => {
    setButtonProcessing(item.correlationId, 'reject', true);
    try {
      const response = await RejectWorkItem({
        correlationId: item.correlationId,
      });
      if (response?.success) {
        setAlertMessage(`Rejected ${item.document}`);
        setHighlightedRecId(item.correlationId);
        setTimeout(() => setHighlightedRecId(null), 3000);
        fetchWorkItems();
      } else {
        setAlertMessage(`Failed to reject ${item.document}`);
      }
    } catch (error) {
      console.error(error);
      setAlertMessage(`Error rejecting ${item.document}`);
    } finally {
      setButtonProcessing(item.correlationId, 'reject', false);
      setAlertModal(true);
    }
  };

  const getCardButtons = item => ({
    approve: {
      show: true,
      position: 'bottom',
      style: 'text',
      text: 'Approve',
      textColor: '#4CAF50',
      onPress: () => handleApprovePress(item),
      customStyle: {
        transform: [{translateY: -30}],
      },
    },
    reject: {
      show: true,
      position: 'bottom',
      style: 'text',
      text: 'Reject',
      textColor: '#ff4c4c',
      disabled: processingButtons[item.correlationId]?.includes('reject'),
      onPress: () => handleRejectPress(item),
      customStyle: {
        transform: [{translateY: -30}],
      },
    },
  });

  const renderWorkItemCard = ({item}) => {
    const isHighlighted = highlightedRecId === item.correlationId;
    const itemProcessingButtons = processingButtons[item.correlationId] || [];
    const cardData = {
      ...item,
      wfStatus: 'Pending',
    };

    // Handle button presses
    const handleButtonPress = (buttonType, itemData) => {
      switch (buttonType) {
        case 'approve':
          handleApprovePress(itemData);
          break;
        case 'reject':
          handleRejectPress(itemData);
          break;
        default:
          console.log('Unknown button pressed:', buttonType);
      }
    };

    return (
      <DynamicRequestCard
        data={cardData}
        headerConfig={{
          title: {key: 'document'},
          subtitle: {key: 'documentType'},
        }}
        fields={[
          {key: 'document', label: 'Document', type: 'text'},
          {key: 'documentType', label: 'Document Type', type: 'text'},
          {key: 'wfStatus', label: '', type: 'status'},
        ]}
        expandableFields={[
          {key: 'additionalDetails', label: 'Details', type: 'text'},
        ]}
        buttons={getCardButtons(item)}
        isHighlighted={isHighlighted}
        onButtonPress={handleButtonPress}
        isExpandable={false}
        gradientColors={['#6ee0ff', '#bddeff', '#cce6ff']}
        highlightGradientColors={['#E8F5E8', '#F0FFF0']}
        processingButtons={itemProcessingButtons}
      />
    );
  };

  return (
    <ActionPaneContainer
      pageTitle="Work Items Assigned To Me"
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={false}
      onRefresh={handleRefresh}>
      {isLoading ? (
        <CustomIndicator />
      ) : tableData.length > 0 ? (
        <FlatList
          data={tableData}
          renderItem={renderWorkItemCard}
          keyExtractor={(item, index) =>
            item.correlationId?.toString() || index.toString()
          }
          contentContainerStyle={styles.LReqLP_ListContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={{flexGrow: 1}}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }>
          <Text style={styles.LReqLP_NoDataText}>No Data Found</Text>
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

export default WorkItemsAssignedToMePage;
