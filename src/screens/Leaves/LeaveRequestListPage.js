/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
import React, {useState, useEffect, useContext, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  BackHandler,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import {UserContext} from '../../context/UserContext';
import {CompanyContext} from '../../context/CompanyContext';

import {AlertModal} from '../../components/Leaves/AlertModal';
import LeaveRequestCard from '../../components/Leaves/LeaveRequestCard';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import LogoutAlertModal from '../../components/Leaves/LogoutAlertModal';
import MainPageHeader from '../../components/PageHeader/MainPageHeader';
import NotificationDropdown from '../../components/NotificationDropdown';
import CompanyDropdown from '../../components/PageHeader/CompanyDropdown';

import {deleteLeaveRequest} from '../../API/Leaves/deleteLeaveRequest';
import {retrieveByEmail} from '../../API/WorkflowTrackingStatusTable/retrieveByEmail';
import {fetchLeaves} from '../../Controller/leaveRequestApiService';

const {width, height} = Dimensions.get('window');

const LeaveRequestListPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [leavesData, setLeavesData] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationVisible, setNotificationVisible] = useState(false);

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [highlightedRecId, setHighlightedRecId] = useState(null);

  const navigation = useNavigation();
  const {userData} = useContext(UserContext);
  const {selectedLegalEntity, setSelectedLegalEntity, legalEntities} =
    useContext(CompanyContext);

  // const navigation = useNavigation();
  const route = useRoute();
  const {employeeId, employeeName, WorkerRecId, cameFrom, highlightRecId} =
    route.params || {};

  // Fetch leaves data
  const fetchLeavesData = useCallback(async () => {
    if (!employeeId) return;

    setIsLoading(true);
    try {
      const companyToUse = selectedLegalEntity || userData.defaultLegalEntity;
      const LeaveData = await fetchLeaves(employeeId, companyToUse);
      setLeavesData(LeaveData);
    } catch (error) {
      setAlertMessage('Failed to fetch data.');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, selectedLegalEntity, userData.defaultLegalEntity]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchLeavesData();
    }, [fetchLeavesData]),
  );

  useFocusEffect(
    useCallback(() => {
      // Close everything on focus
      closeAllOverlays();

      const onBackPress = () => {
        handleGoBack();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => {
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
      };
    }, []),
  );

  useEffect(() => {
    if (highlightRecId && cameFrom === 'CreateSuccess') {
      setHighlightedRecId(highlightRecId);

      // Remove highlight after 3 seconds
      const timer = setTimeout(() => {
        setHighlightedRecId(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [highlightRecId, cameFrom]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      closeAllOverlays();
    });

    return unsubscribe;
  }, [navigation]);

  // Initial data fetch
  useEffect(() => {
    fetchLeavesData();
  }, [fetchLeavesData]);

  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    fetchNotifications(); // Initial fetch
    return () => clearInterval(interval);
  }, [userData.email]);

  const handleCompanySelect = newLegalEntity => {
    setSelectedLegalEntity(newLegalEntity);
    console.log('Company changed to:', newLegalEntity);

    // Refresh leaves data with new company
    fetchLeavesData();
  };

  useEffect(() => {
    const headerOptions = MainPageHeader({
      onToggleDrawer: toggleDrawer,
      onTitle: 'Leaves',
      onShowNotify: toggleNotification,
      onCount: notificationCount,
      onLogout: handleLogout,
      isBack: false,
      onDatPress: toggleCompanyDropdown,
      selectedDat:
        selectedLegalEntity || userData?.defaultLegalEntity || 'Select Company',
      defaultDat: userData?.defaultLegalEntity,
    });
    navigation.setOptions(headerOptions);
  }, [
    navigation,
    notificationCount,
    notificationVisible,
    notifications,
    toggleDrawer,
    selectedLegalEntity,
    userData?.defaultLegalEntity,
  ]);

  const closeAllOverlays = () => {
    setDropdownVisible(false);
    setNotificationVisible(false);
    setModalVisible(false);
    navigation.closeDrawer?.(); // Optional, if using Drawer Navigator
  };

  const toggleNotification = () => {
    closeAllOverlays();
    setNotificationVisible(prev => !notificationVisible);
  };
  const toggleDrawer = () => {
    closeAllOverlays();
    navigation.toggleDrawer();
  };
  const handleLogout = () => {
    closeAllOverlays();
    setModalVisible(true);
  };
  const toggleCompanyDropdown = () => {
    closeAllOverlays();
    setDropdownVisible(prev => !dropdownVisible);
  };
  const closeNotification = () => setNotificationVisible(false);
  const confirmLogout = () => {
    setModalVisible(false);
    navigation.navigate('Login');
  };
  const cancelLogout = () => setModalVisible(false);

  const fetchNotifications = async () => {
    try {
      const data = await retrieveByEmail({email: userData.email});
      if (Array.isArray(data)) {
        const formattedNotifications = data.map(notification => ({
          document: notification.Document,
          documentType: notification.DocumentType,
          correlationId: notification.CorrelationId,
        }));
        setNotifications(formattedNotifications);
        setNotificationCount(formattedNotifications.length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };
  const handleGoBack = () => {
    if (cameFrom === 'DisplayListPage') {
      navigation.navigate('DisplayListPage');
    } else if (cameFrom === 'WorkerAssignedToMe') {
      navigation.navigate('WorkerAssignedToMe');
    } else {
      navigation.navigate('MainDashboard');
    }
  };

  const handleRefresh = () => {
    fetchLeavesData();
  };

  const getLeaveCategory = category => {
    return category === 'FullLeave'
      ? 'Full Leave'
      : category === 'HalfLeave'
      ? 'Half Leave'
      : 'Invalid Category';
  };

  const getStatusLabel = status => {
    const statusMap = {
      NotSubmitted: 'Draft',
      Approved: 'Approved',
      Cancelled: 'Cancelled',
      Rejected: 'Rejected',
      Submitted: 'Submitted',
      ChangeRequest: 'Change Request',
      PendingCancellation: 'Pending Cancellation',
      Returned: 'Returned',
      PendingApproval: 'Pending Approval',
      PendingComplete: 'Pending Complete',
      WorkflowCompleted: 'Workflow Completed',
      Completed: 'Completed',
      Failed: 'Failed',
    };
    return statusMap[status] || 'Draft';
  };

  const handleDeleteLeave = async recId => {
    try {
      const companyToUse = selectedLegalEntity || userData.defaultLegalEntity;
      const response = await deleteLeaveRequest({
        recordsRecId: [recId],
        defaultCompany: companyToUse,
      });
      if (response[0].IsSuccess) {
        setAlertMessage('Leave Request Deleted Successfully.');
        setLeavesData(prev => prev.filter(leave => leave.recId !== recId));
      } else {
        setAlertMessage('Unable to Delete Leave Request.');
      }
    } catch (error) {
      setAlertMessage('Failed to Delete Leave Request');
    } finally {
      setAlertModal(true);
      // Refresh data after delete operation
      setTimeout(() => {
        fetchLeavesData();
      }, 1000);
    }
  };

  const handleCreateLeave = () => {
    navigation.navigate('LeaveSaveRecord', {
      mode: 'create',
      employeeId,
      employeeName,
      WorkerRecId,
      cameFrom: 'LeavesListPage', // Fixed: use consistent parameter name
      leaveData: {
        employeeId,
        employeeName,
        WorkerRecId, // Fixed: include WorkerRecId
        recId: '',
        leaveCode: '',
        leaveCategory: '',
        balance: '0.00',
        leaveStartDate: '',
        leaveEndDate: '',
        leaveDays: '',
        reason: '',
      },
    });
  };

  const renderLeavesCard = ({item}) => {
    const isHighlighted = highlightedRecId === item.recId;

    return (
      <LeaveRequestCard
        recId={item.recId}
        leaveReqId={item.leaveReqId}
        employeeId={employeeId}
        employeeName={item.employeeName}
        leaveCode={item.leaveCode}
        leaveCategory={getLeaveCategory(item.leaveCategory)}
        leaveReqDate={item.leaveReqDate}
        leaveDays={item.leaveDays}
        leaveStartDate={item.leaveStartDate}
        leaveEndDate={item.leaveEndDate}
        reason={item.reason}
        balance={item.balance}
        wfStatus={getStatusLabel(item.wfStatus)}
        onDelete={() => handleDeleteLeave(item.recId)}
        isHighlighted={isHighlighted} // Pass highlight state to card
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {isLoading ? (
          <CustomIndicator />
        ) : leavesData.length > 0 ? (
          <FlatList
            data={leavesData}
            renderItem={renderLeavesCard}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <Text style={styles.noDataText}>No Data Found</Text>
        )}
      </View>

      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabButton} onPress={handleGoBack}>
          <FontAwesome name="arrow-left" size={24} color="#ffffff" />
          <Text style={styles.tabButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabButton} onPress={handleRefresh}>
          <FontAwesome name="refresh" size={24} color="#ffffff" />
          <Text style={styles.tabButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.floatingPlusButtonContainer}>
        <TouchableOpacity
          style={styles.floatingPlusButton}
          onPress={handleCreateLeave}>
          <FontAwesome name="plus" style={styles.plusIcon} />
        </TouchableOpacity>
      </View>

      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />

      <LogoutAlertModal
        visible={modalVisible}
        heading="Are you sure?"
        text="Do you really want to logout?"
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />

      {notificationVisible && (
        <NotificationDropdown
          visible={notificationVisible}
          notifications={notifications}
          onClose={closeNotification}
        />
      )}

      {dropdownVisible && (
        <CompanyDropdown
          visible={dropdownVisible}
          onClose={() => setDropdownVisible(false)}
          legalEntities={legalEntities}
          selectedLegalEntity={selectedLegalEntity}
          onSelect={handleCompanySelect}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    width: '100%',
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.04,
    backgroundColor: '#FFA500',
  },
  headerTitle: {
    fontSize: width * 0.05,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: width * 0.03,
    paddingTop: height * 0.01,
  },
  listContainer: {
    paddingBottom: height * 0.1,
  },
  noDataText: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: width * 0.04,
    fontWeight: 'bold',
    color: '#999999',
  },
  tabButton: {
    alignItems: 'center',
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFA500',
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.18,
    justifyContent: 'space-between',
    alignItems: 'center',
    height: height * 0.075,
  },
  tabButtonText: {
    fontSize: width * 0.032,
    color: '#ffffff',
    marginTop: 2,
    fontWeight: '500',
  },
  floatingPlusButtonContainer: {
    position: 'absolute',
    bottom: height * 0.035,
    left: width / 2 - 28,
  },
  floatingPlusButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#FFA500',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  plusIcon: {
    fontSize: 24,
    color: '#FFA500',
  },
});

export default LeaveRequestListPage;
