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
  ActivityIndicator,
  TouchableWithoutFeedback,
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

import {RetrieveByEmail} from '../../API/WorkflowTrackingStatusTable/retrieveByEmail';
import WorkflowItemAction from '../../API/WorkflowTrackingStatusTable/WorkflowItemAction';
import styles from '../../styles/styles';
import {StyleSheet} from 'react-native';

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
  const [processingAction, setProcessingAction] = useState('');

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedRecIds, setSelectedRecIds] = useState([]);

  // New state for tabs
  const [activeTab, setActiveTab] = useState('All');

  // State for managing menu visibility
  const [menuVisible, setMenuVisible] = useState(null);

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

      const formattedData = (data || []).map((item, index) => {
        // Parse Document string: "Purchase requisition: 007488, NewTest"
        const documentStr = item.Document || '';

        // Extract document number (007488)
        const numberMatch = documentStr.match(/:?\s*(\d+)/);
        const documentNumber = numberMatch ? numberMatch[1] : '';

        // Extract document type (Purchase requisition)
        const typeMatch = documentStr.match(/^([^:]+)/);
        let documentType = typeMatch ? typeMatch[1].trim() : '';
        // Capitalize first letter of each word
        documentType = documentType.replace(/\b\w/g, l => l.toUpperCase());

        // Extract requester (NewTest)
        const requesterMatch = documentStr.match(/,?\s*([^,]+)$/);
        const requester = requesterMatch ? requesterMatch[1].trim() : '';

        return {
          id: item.workflowWorkItemRecId ?? index,
          recId: item.workflowWorkItemRecId,
          documentNumber: documentNumber,
          documentType: documentType,
          requester: requester,
          ContextRecId: item.ContextRecId,
          ContextTableId: item.ContextTableId,
        };
      });

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
    const currentData = getFilteredData();
    if (selectedRecIds.length === currentData.length) {
      setSelectedRecIds([]);
    } else {
      setSelectedRecIds(currentData.map(item => item.recId));
    }
  };

  /* ==============================
     Tab Filter Logic
  ============================== */

  const getFilteredData = () => {
    switch (activeTab) {
      case 'All':
        return tableData;
      case 'Approved':
        return [];
      case 'Rejected':
        return [];
      default:
        return tableData;
    }
  };

  /* ==============================
     Single Item Actions
  ============================== */

  // const handleSingleAction = async (recId, actionType) => {
  //   if (isActionLoading) return;

  //   try {
  //     setIsActionLoading(true);

  //     const response = await WorkflowItemAction({
  //       recId: [recId],
  //       action: actionType,
  //     });

  //     if (response?.IsSuccess) {
  //       fetchWorkItems();
  //     } else {
  //       setAlertMessage(`Failed to ${actionType}`);
  //     }
  //   } catch {
  //     setAlertMessage(`Error during ${actionType}`);
  //   } finally {
  //     setIsActionLoading(false);
  //     setAlertModal(true);
  //   }
  // };

  const handleSingleAction = async (recId, actionType) => {
    if (isActionLoading) return;

    try {
      setIsActionLoading(true);
      setProcessingAction(actionType.toLowerCase()); // 'approve' or 'reject'

      const response = await WorkflowItemAction({
        recId: [recId],
        action: actionType,
      });

      if (response?.IsSuccess) {
        setAlertMessage(`${actionType} successful`);
        fetchWorkItems();
      } else {
        setAlertMessage(`Failed to ${actionType}`);
        setAlertModal(true);
      }
    } catch {
      setAlertMessage(`Error during ${actionType}`);
      setAlertModal(true);
    } finally {
      setIsActionLoading(false);
      setProcessingAction('');
    }
  };

  /* ==============================
     Bulk Action
  ============================== */

  const handleViewHistory = (contextRecId, contextTableId) => {
    setMenuVisible(null);
    // Navigate with the correct parameter names
    navigation.getParent()?.navigate('WorkflowHistoryScreen', {
      recId: contextRecId,
      tableId: contextTableId,
    });
  };

  // const handleBulkAction = async actionType => {
  //   if (selectedRecIds.length === 0 || isActionLoading) return;

  //   try {
  //     setIsActionLoading(true);

  //     const response = await WorkflowItemAction({
  //       recId: selectedRecIds,
  //       action: actionType,
  //     });

  //     if (response?.IsSuccess) {
  //       setAlertMessage(
  //         `${actionType} successful for ${selectedRecIds.length} item(s)`,
  //       );
  //       exitSelectionMode();
  //       fetchWorkItems();
  //     } else {
  //       setAlertMessage(`Failed to ${actionType}`);
  //     }
  //   } catch {
  //     setAlertMessage(`Error during ${actionType}`);
  //   } finally {
  //     setIsActionLoading(false);
  //     setAlertModal(true);
  //   }
  // };

  const handleBulkAction = async actionType => {
    if (selectedRecIds.length === 0 || isActionLoading) return;

    try {
      setIsActionLoading(true);
      setProcessingAction('bulk');

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
        setAlertModal(true);
      }
    } catch {
      setAlertMessage(`Error during ${actionType}`);
      setAlertModal(true);
    } finally {
      setIsActionLoading(false);
      setProcessingAction('');
    }
  };

  /* ==============================
     Render Card
  ============================== */

  const renderWorkItemCard = ({item}) => {
    const isSelected = selectedRecIds.includes(item.recId);
    const isMenuOpen = menuVisible === item.recId;

    return (
      <View style={cardStyles.container}>
        {/* Selection Overlay for long press */}
        <TouchableOpacity
          activeOpacity={0.9}
          onLongPress={() => enterSelectionMode(item.recId)}
          onPress={() => (selectionMode ? toggleSelection(item.recId) : null)}
          style={cardStyles.touchableArea}>
          {/* Selection Checkbox - Only visible in selection mode */}
          {selectionMode && (
            <View style={cardStyles.checkboxContainer}>
              <View
                style={[
                  cardStyles.checkbox,
                  isSelected && cardStyles.checkboxSelected,
                ]}>
                {isSelected && <Text style={cardStyles.checkmark}>✓</Text>}
              </View>
            </View>
          )}

          {/* Card Content */}
          <View
            style={[cardStyles.card, isSelected && cardStyles.cardSelected]}>
            {/* Top Row - Document Number and Action Buttons */}
            <View style={cardStyles.topRow}>
              <View style={cardStyles.documentNumberContainer}>
                <Text style={cardStyles.documentNumber}>
                  {item.documentNumber}
                </Text>
              </View>

              {/* Action Buttons - Only show when not in selection mode */}
              {!selectionMode && (
                <View style={cardStyles.actionButtons}>
                  <TouchableOpacity
                    style={[cardStyles.actionButton, cardStyles.approveButton]}
                    onPress={() => handleSingleAction(item.recId, 'Approve')}
                    disabled={isActionLoading}>
                    <Text style={cardStyles.approveButtonText}>Approve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[cardStyles.actionButton, cardStyles.rejectButton]}
                    onPress={() => handleSingleAction(item.recId, 'Reject')}
                    disabled={isActionLoading}>
                    <Text style={cardStyles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>

                  {/* Three Dots Menu */}
                  <TouchableOpacity
                    style={cardStyles.menuButton}
                    onPress={() =>
                      setMenuVisible(isMenuOpen ? null : item.recId)
                    }>
                    <Text style={cardStyles.menuDots}>⋯</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Title */}
            <Text style={cardStyles.title}>{item.documentType}</Text>

            {/* Requester Info */}
            {item.requester ? (
              <View style={cardStyles.requesterContainer}>
                <Text style={cardStyles.requesterLabel}>Requester</Text>
                <Text style={cardStyles.requesterValue}>{item.requester}</Text>
              </View>
            ) : null}
          </View>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <View style={cardStyles.menuContainer}>
              <TouchableOpacity
                style={cardStyles.menuItem}
                onPress={() =>
                  handleViewHistory(item.ContextRecId, item.ContextTableId)
                }>
                <Text style={cardStyles.menuItemText}>View History</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  /* ==============================
     Render Tabs
  ============================== */

  const renderTabs = () => {
    const tabs = [
      {key: 'All', label: 'All', count: tableData.length},
      {key: 'Approved', label: 'Approved', count: 0},
      {key: 'Rejected', label: 'Rejected', count: 0},
    ];

    return (
      <View style={tabStyles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={tabStyles.scrollContent}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[
                tabStyles.tab,
                activeTab === tab.key && tabStyles.activeTab,
              ]}
              onPress={() => {
                setActiveTab(tab.key);
                exitSelectionMode();
              }}>
              <Text
                style={[
                  tabStyles.tabText,
                  activeTab === tab.key && tabStyles.activeTabText,
                ]}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View
                  style={[
                    tabStyles.badge,
                    activeTab === tab.key && tabStyles.activeBadge,
                  ]}>
                  <Text
                    style={[
                      tabStyles.badgeText,
                      activeTab === tab.key && tabStyles.activeBadgeText,
                    ]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  /* ==============================
     UI
  ============================== */

  const filteredData = getFilteredData();

  return (
    <ActionPaneContainer
      pageTitle={
        selectionMode ? `${selectedRecIds.length} selected` : 'Work Items'
      }
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={false}
      onRefresh={fetchWorkItems}>
      {/* Tabs */}
      {renderTabs()}

      {isActionLoading && (
        <View style={styles.DSR_ProcessingOverlay}>
          <View style={styles.DSR_ProcessingContainer}>
            <ActivityIndicator size="large" color="#0A66C2" />
            <Text style={styles.DSR_ProcessingText}>Processing...</Text>
          </View>
        </View>
      )}

      {/* Bulk Toolbar */}
      {selectionMode && (
        <View style={bulkToolbarStyles.container}>
          <View style={bulkToolbarStyles.actionRow}>
            <TouchableOpacity
              disabled={isActionLoading}
              onPress={() => handleBulkAction('Approve')}
              style={bulkToolbarStyles.approveButton}>
              {isActionLoading ? (
                <ActivityIndicator color="#2E7D32" size="small" />
              ) : (
                <Text style={bulkToolbarStyles.approveText}>Approve All</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              disabled={isActionLoading}
              onPress={() => handleBulkAction('Reject')}
              style={bulkToolbarStyles.rejectButton}>
              {isActionLoading ? (
                <ActivityIndicator color="#C62828" size="small" />
              ) : (
                <Text style={bulkToolbarStyles.rejectText}>Reject All</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={bulkToolbarStyles.controlRow}>
            <TouchableOpacity
              onPress={selectAll}
              style={bulkToolbarStyles.textButton}>
              <Text style={bulkToolbarStyles.primaryButtonText}>
                {selectedRecIds.length === filteredData.length
                  ? 'Unselect all'
                  : 'Select all'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={exitSelectionMode}
              style={bulkToolbarStyles.textButton}>
              <Text style={bulkToolbarStyles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isLoading ? (
        <CustomIndicator />
      ) : filteredData.length > 0 ? (
        <TouchableWithoutFeedback onPress={() => setMenuVisible(null)}>
          <View style={{flex: 1}}>
            <FlatList
              data={filteredData}
              renderItem={renderWorkItemCard}
              keyExtractor={item => item.recId?.toString()}
              contentContainerStyle={cardStyles.listContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={fetchWorkItems}
                />
              }
            />
          </View>
        </TouchableWithoutFeedback>
      ) : (
        <ScrollView
          contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}>
          <Text style={styles.LReqLP_NoDataText}>
            {activeTab === 'All'
              ? 'No work items found'
              : `No ${activeTab.toLowerCase()} items found`}
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

export default WorkItemsAssignedToMePage;

/* ==============================
     Styles
  ============================== */

const cardStyles = StyleSheet.create({
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  container: {
    marginBottom: 12,
    position: 'relative',
  },
  touchableArea: {
    position: 'relative',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardSelected: {
    backgroundColor: '#F8F9FF',
    borderColor: '#0066CC',
    borderWidth: 1.5,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  documentNumberContainer: {
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  documentNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    letterSpacing: 0.2,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  approveButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#2E7D32',
  },
  rejectButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C62828',
  },
  approveButtonText: {
    color: '#2E7D32',
    fontSize: 13,
    fontWeight: '500',
  },
  rejectButtonText: {
    color: '#C62828',
    fontSize: 13,
    fontWeight: '500',
  },
  menuButton: {
    padding: 4,
    marginLeft: 4,
  },
  menuDots: {
    fontSize: 18,
    color: '#666666',
    letterSpacing: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 12,
  },
  requesterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  requesterLabel: {
    fontSize: 13,
    color: '#666666',
    width: 70,
    fontWeight: '400',
  },
  requesterValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
    flex: 1,
  },
  checkboxContainer: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: '#0066CC',
    backgroundColor: '#0066CC',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  menuContainer: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 140,
    borderWidth: 1,
    borderColor: '#EDEDED',
    zIndex: 20,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '400',
  },
});

const tabStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  scrollContent: {
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F5F7FA',
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#0066CC',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  badge: {
    backgroundColor: '#E9ECEF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 20,
    alignItems: 'center',
  },
  activeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666666',
  },
  activeBadgeText: {
    color: '#FFFFFF',
  },
});

const bulkToolbarStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  approveButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  approveText: {
    color: '#2E7D32',
    fontWeight: '500',
    fontSize: 14,
  },
  rejectButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C62828',
  },
  rejectText: {
    color: '#C62828',
    fontWeight: '500',
    fontSize: 14,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textButton: {
    paddingVertical: 4,
  },
  primaryButtonText: {
    color: '#0066CC',
    fontWeight: '500',
    fontSize: 14,
  },
  secondaryButtonText: {
    color: '#666666',
    fontWeight: '500',
    fontSize: 14,
  },
});
