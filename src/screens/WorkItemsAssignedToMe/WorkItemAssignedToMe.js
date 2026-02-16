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
import DynamicRequestCard from '../../components/DynamicRequestCard';

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

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedRecIds, setSelectedRecIds] = useState([]);

  // New state for tabs
  const [activeTab, setActiveTab] = useState('All');

  // State for managing menu visibility
  const [menuVisible, setMenuVisible] = useState(null); // stores the recId of the card with open menu

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
    // For now, all data is shown in "All" tab
    // Approved and Rejected tabs will be empty until you implement status tracking
    switch (activeTab) {
      case 'All':
        return tableData;
      case 'Approved':
        return []; // Will be implemented later
      case 'Rejected':
        return []; // Will be implemented later
      default:
        return tableData;
    }
  };

  /* ==============================
     Bulk Action
  ============================== */

  const handleViewHistory = (contextRecId, contextTableId) => {
    setMenuVisible(null); // Close menu
    navigation.navigate('WorkflowHistoryScreen', {
      recId: contextRecId,
      tableId: contextTableId,
    });
  };

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
    const isMenuOpen = menuVisible === item.recId;

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
          {/* Selection Checkbox */}
          {selectionMode && (
            <View style={selectionStyles.checkboxContainer}>
              <View
                style={[
                  selectionStyles.checkbox,
                  isSelected && selectionStyles.checkboxSelected,
                ]}>
                {isSelected && <Text style={selectionStyles.checkmark}>✓</Text>}
              </View>
            </View>
          )}

          {/* Three Dots Menu Button */}
          {!selectionMode && (
            <View
              style={{position: 'absolute', top: 16, right: 16, zIndex: 10}}>
              <TouchableOpacity
                style={menuStyles.menuButton}
                onPress={() => setMenuVisible(isMenuOpen ? null : item.recId)}
                activeOpacity={0.7}>
                <Text style={menuStyles.menuDots}>⋮</Text>
              </TouchableOpacity>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <View style={menuStyles.menuContainer}>
                  <TouchableOpacity
                    style={menuStyles.menuItem}
                    onPress={() =>
                      handleViewHistory(item.ContextRecId, item.ContextTableId)
                    }>
                    <Text style={menuStyles.menuText}>📜 View History</Text>
                  </TouchableOpacity>
                </View>
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
     Render Tabs
  ============================== */

  const renderTabs = () => {
    const tabs = [
      {key: 'All', label: 'All', count: tableData.length},
      {key: 'Approved', label: 'Approved', count: 0}, // Will be updated when filtering is implemented
      {key: 'Rejected', label: 'Rejected', count: 0}, // Will be updated when filtering is implemented
    ];

    return (
      <View style={tabStyles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={tabStyles.tabScrollContent}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[
                tabStyles.tab,
                activeTab === tab.key && tabStyles.activeTab,
              ]}
              onPress={() => {
                setActiveTab(tab.key);
                exitSelectionMode(); // Exit selection mode when switching tabs
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
      {/* Tabs */}
      {renderTabs()}

      {/* Bulk Toolbar */}
      {selectionMode && (
        <View style={bulkToolbarStyles.container}>
          <View style={bulkToolbarStyles.actionRow}>
            <TouchableOpacity
              disabled={isActionLoading}
              onPress={() => handleBulkAction('Approve')}
              style={bulkToolbarStyles.approveButton}>
              {isActionLoading ? (
                <ActivityIndicator color="#2e7d32" size="small" />
              ) : (
                <>
                  <Text style={bulkToolbarStyles.approveIcon}>✓</Text>
                  <Text style={bulkToolbarStyles.approveText}>Approve</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              disabled={isActionLoading}
              onPress={() => handleBulkAction('Reject')}
              style={bulkToolbarStyles.rejectButton}>
              {isActionLoading ? (
                <ActivityIndicator color="#c62828" size="small" />
              ) : (
                <>
                  <Text style={bulkToolbarStyles.rejectIcon}>✕</Text>
                  <Text style={bulkToolbarStyles.rejectText}>Reject</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={bulkToolbarStyles.controlRow}>
            <TouchableOpacity
              onPress={selectAll}
              style={bulkToolbarStyles.textButton}>
              <Text style={bulkToolbarStyles.primaryButtonText}>
                {selectedRecIds.length === filteredData.length
                  ? '☐ Unselect All'
                  : '☑ Select All'}
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
              contentContainerStyle={styles.LReqLP_ListContainer}
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
              ? 'No Data Found'
              : `No ${activeTab} items found`}
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

const tabStyles = StyleSheet.create({
  tabContainer: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tabScrollContent: {
    gap: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#dee2e6',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeTab: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
    shadowColor: '#007bff',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
  },
  activeTabText: {
    color: '#ffffff',
  },
  badge: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#495057',
  },
  activeBadgeText: {
    color: '#ffffff',
  },
});

const bulkToolbarStyles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#d4edda',
    borderWidth: 1.5,
    borderColor: '#c3e6cb',
    gap: 6,
  },
  approveIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#155724',
  },
  approveText: {
    color: '#155724',
    fontWeight: '700',
    fontSize: 15,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f8d7da',
    borderWidth: 1.5,
    borderColor: '#f5c6cb',
    gap: 6,
  },
  rejectIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#721c24',
  },
  rejectText: {
    color: '#721c24',
    fontWeight: '700',
    fontSize: 15,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textButton: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  primaryButtonText: {
    color: '#007bff',
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryButtonText: {
    color: '#6c757d',
    fontWeight: '600',
    fontSize: 14,
  },
});

const selectionStyles = StyleSheet.create({
  checkboxContainer: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 10,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2.5,
    borderColor: '#cbd5e0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  checkboxSelected: {
    borderColor: '#28a745',
    backgroundColor: '#28a745',
    shadowColor: '#28a745',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

const menuStyles = StyleSheet.create({
  menuButton: {
    padding: 6,
    zIndex: 10,
  },
  menuDots: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    letterSpacing: 0,
  },
  menuContainer: {
    position: 'absolute',
    top: 30,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    minWidth: 160,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
});
