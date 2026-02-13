/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
import React, {useState, useCallback} from 'react';
import {
  Text,
  FlatList,
  BackHandler,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
  Modal,
  StyleSheet,
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
import WorkflowItemAction from '../../API/WorkflowTrackingStatusTable/WorkflowItemAction';

const WorkItemsAssignedToMePage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  console.log('I MA HEREERRERE');
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
  const [menuVisible, setMenuVisible] = useState({});

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
        recId: item.workflowWorkItemRecId,
        ContextRecId: item.ContextRecId,
        ContextTableId: item.ContextTableId,
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

  // Add this function to handle workflow history navigation
  const handleWorkflowHistory = item => {
    console.log('Opening workflow history for:', item);
    setMenuVisible({});
    navigation.navigate('WorkflowHistoryScreen', {
      recId: item.ContextRecId,
      tableId: item.ContextTableId,
    });
  };

  // Add this function to toggle menu
  const toggleMenu = correlationId => {
    setMenuVisible(prev => ({
      ...prev,
      [correlationId]: !prev[correlationId],
    }));
  };

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
      console.log('Correlation Id Outside Approve Request : ', item.recId);
      const response = await WorkflowItemAction({
        recId: [item.recId],
        action: 'Approve',
      });
      console.log('Response: ', response);
      if (response?.IsSuccess) {
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
      // const response = await RejectWorkItem({
      //   correlationId: item.correlationId,
      // });
      const response = await WorkflowItemAction({
        recId: [item.recId],
        action: 'Reject',
      });
      if (response?.IsSuccess) {
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
      <View>
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

        {/* Three-dot menu button */}
        <TouchableOpacity
          style={cardStyles.menuButton}
          onPress={() => toggleMenu(item.correlationId)}>
          <Text style={cardStyles.menuDots}>⋮</Text>
        </TouchableOpacity>

        {/* Menu Modal */}
        <Modal
          visible={menuVisible[item.correlationId] || false}
          transparent={true}
          animationType="fade"
          onRequestClose={() => toggleMenu(item.correlationId)}>
          <TouchableOpacity
            style={cardStyles.modalOverlay}
            activeOpacity={1}
            onPress={() => toggleMenu(item.correlationId)}>
            <View style={cardStyles.menuContainer}>
              <TouchableOpacity
                style={cardStyles.menuItem}
                onPress={() => handleWorkflowHistory(item)}>
                <Text style={cardStyles.menuText}>Workflow History</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
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

const cardStyles = StyleSheet.create({
  menuButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
    zIndex: 10,
  },
  menuDots: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 60,
    marginRight: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 180,
  },
  menuItem: {
    padding: 16,
    borderBottomWidth: 0,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});
