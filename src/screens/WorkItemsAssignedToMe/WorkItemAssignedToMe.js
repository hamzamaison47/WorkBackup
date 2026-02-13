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
  ActivityIndicator,
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
import WorkflowItemAction from '../../API/WorkflowTrackingStatusTable/WorkflowItemAction';

import styles from '../../styles/styles';

const WorkItemsAssignedToMePage = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const {userData: routeUserData} = route.params || {};
  const reduxUserData = useSelector(state => state.user.userData);
  const effectiveUserData = routeUserData || reduxUserData;

  const [tableData, setTableData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedRecIds, setSelectedRecIds] = useState([]);

  /* ==============================
     Fetch Data
  ============================== */

  const fetchWorkItems = useCallback(async () => {
    if (!effectiveUserData?.email) return;

    setIsLoading(true);
    try {
      const data = await RetrieveByEmail({
        email: effectiveUserData.email,
      });

      const formattedData = (data || []).map((item, index) => ({
        id: item.workflowWorkItemRecId ?? index,
        document: item.Document,
        documentType: item.DocumentType,
        recId: item.workflowWorkItemRecId,
        ContextRecId: item.ContextRecId,
        ContextTableId: item.ContextTableId,
        additionalDetails:
          item.AdditionalDetails || `Details for ${item.Document}`,
      }));

      setTableData(formattedData);
    } catch (error) {
      setAlertMessage('Failed to fetch work items.');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [effectiveUserData?.email]);

  useFocusEffect(
    useCallback(() => {
      fetchWorkItems();
    }, [fetchWorkItems]),
  );

  /* ==============================
     Back Handling
  ============================== */

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (selectionMode) {
          exitSelectionMode();
          return true;
        }
        navigation.goBack();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [selectionMode]),
  );

  /* ==============================
     Selection Logic
  ============================== */

  const enterSelectionMode = recId => {
    setSelectionMode(true);
    setSelectedRecIds([recId]);
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedRecIds([]);
  };

  const toggleSelection = recId => {
    setSelectedRecIds(prev =>
      prev.includes(recId) ? prev.filter(id => id !== recId) : [...prev, recId],
    );
  };

  const selectAll = () => {
    if (selectedRecIds.length === tableData.length) {
      setSelectedRecIds([]);
    } else {
      setSelectedRecIds(tableData.map(item => item.recId));
    }
  };

  /* ==============================
     Bulk Action
  ============================== */

  const handleBulkAction = async actionType => {
    if (selectedRecIds.length === 0 || isActionLoading) return;

    try {
      setIsActionLoading(true);

      const response = await WorkflowItemAction({
        recId: selectedRecIds,
        action: actionType,
      });

      if (response?.IsSuccess) {
        setAlertMessage(
          `${actionType} successful for ${selectedRecIds.length} item(s)`,
        );
        exitSelectionMode();
        fetchWorkItems();
      } else {
        setAlertMessage(`Failed to ${actionType}`);
      }
    } catch {
      setAlertMessage(`Error during ${actionType}`);
    } finally {
      setIsActionLoading(false);
      setAlertModal(true);
    }
  };

  /* ==============================
     Render Card
  ============================== */

  const renderWorkItemCard = ({item}) => {
    const isSelected = selectedRecIds.includes(item.recId);

    const cardData = {
      ...item,
      wfStatus: 'Pending',
    };

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        disabled={isActionLoading}
        onLongPress={() => enterSelectionMode(item.recId)}
        onPress={() => (selectionMode ? toggleSelection(item.recId) : null)}>
        <View style={{marginVertical: 6}}>
          {selectionMode && (
            <View
              style={{
                position: 'absolute',
                right: 18,
                top: 18,
                zIndex: 10,
                width: 24,
                height: 24,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: isSelected ? '#4CAF50' : '#ccc',
                backgroundColor: isSelected ? '#4CAF50' : '#fff',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {isSelected && (
                <Text style={{color: '#fff', fontWeight: 'bold'}}>✓</Text>
              )}
            </View>
          )}

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
            isHighlighted={isSelected}
            isExpandable={false}
            gradientColors={['#6ee0ff', '#bddeff', '#cce6ff']}
            highlightGradientColors={['#E8F5E8', '#F0FFF0']}
          />
        </View>
      </TouchableOpacity>
    );
  };

  /* ==============================
     UI
  ============================== */

  return (
    <ActionPaneContainer
      pageTitle={
        selectionMode
          ? `${selectedRecIds.length} Selected`
          : 'Work Items Assigned To Me'
      }
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={false}
      onRefresh={fetchWorkItems}>
      {/* 🔥 Enhanced Bulk Toolbar */}
      {selectionMode && (
        <View
          style={{
            backgroundColor: '#ffffff',
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#e5e5e5',
            elevation: 4,
          }}>
          <View style={{flexDirection: 'row', marginBottom: 12}}>
            <TouchableOpacity
              disabled={isActionLoading}
              onPress={() => handleBulkAction('Approve')}
              style={{
                flex: 1,
                marginRight: 8,
                paddingVertical: 10,
                borderRadius: 25,
                backgroundColor: '#E8F5E8',
                alignItems: 'center',
              }}>
              {isActionLoading ? (
                <ActivityIndicator />
              ) : (
                <Text style={{color: '#2e7d32', fontWeight: '600'}}>
                  Approve
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              disabled={isActionLoading}
              onPress={() => handleBulkAction('Reject')}
              style={{
                flex: 1,
                marginLeft: 8,
                paddingVertical: 10,
                borderRadius: 25,
                backgroundColor: '#fdecea',
                alignItems: 'center',
              }}>
              <Text style={{color: '#c62828', fontWeight: '600'}}>Reject</Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
            <TouchableOpacity onPress={selectAll}>
              <Text style={{color: '#007bff', fontWeight: '500'}}>
                {selectedRecIds.length === tableData.length
                  ? 'Unselect All'
                  : 'Select All'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={exitSelectionMode}>
              <Text style={{color: '#666', fontWeight: '500'}}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isLoading ? (
        <CustomIndicator />
      ) : tableData.length > 0 ? (
        <FlatList
          data={tableData}
          renderItem={renderWorkItemCard}
          keyExtractor={item => item.recId?.toString()}
          contentContainerStyle={styles.LReqLP_ListContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchWorkItems}
            />
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}>
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
