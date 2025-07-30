/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useContext} from 'react';
import {View, Text, StyleSheet, FlatList} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {UserContext} from '../../context/UserContext';
import {CompanyContext} from '../../context/CompanyContext';

import {RetrieveEmployeeReportToMe} from '../../API/WorkerAssignedToMe/RetrieveEmployeeReportToMe';
import {retrieveByEmail} from '../../API/WorkflowTrackingStatusTable/retrieveByEmail';

import {AlertModal} from '../../components/Leaves/AlertModal';
import AssignedWorkerCard from '../../components/WorkerAssigned/AssignedWorkerCard';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import MainPageHeader from '../../components/PageHeader/MainPageHeader';
import LogoutAlertModal from '../../components/Leaves/LogoutAlertModal';
import NotificationDropdown from '../../components/NotificationDropdown';
import {handleLogoutauth} from '../../Controller/authUtils';
import CompanyDropdown from '../../components/PageHeader/CompanyDropdown';

const WorkerAssignedToMe = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [teamData, setTeamData] = useState([]);

  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationVisible, setNotificationVisible] = useState(false);

  const [isCompanySwitching, setIsCompanySwitching] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const navigation = useNavigation();
  const {userData} = useContext(UserContext);
  const {selectedLegalEntity, setSelectedLegalEntity, legalEntities} =
    useContext(CompanyContext);
  const companyToUse = selectedLegalEntity || userData.defaultLegalEntity;

  useEffect(() => {
    const fetchEmployeeReportToMe = async () => {
      if (userData.employeeId) {
        setIsLoading(true);
        try {
          const myTeamData = await RetrieveEmployeeReportToMe({
            employeeId: userData.employeeId,
            defaultCompany: companyToUse,
          });

          setTeamData(myTeamData);
        } catch (error) {
          setAlertMessage('Failed to Fetch Data.');
          setAlertModal(true);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchEmployeeReportToMe();
  }, [userData.employeeId]);

  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    fetchNotifications(); // Initial fetch
    return () => clearInterval(interval);
  }, [userData.email]);

  const handleCompanySelect = async newLegalEntity => {
    setIsCompanySwitching(true);
    setSelectedLegalEntity(newLegalEntity);

    // Optional: simulate delay if needed for effect (or await any refresh logic)
    await RetrieveEmployeeReportToMe({
      employeeId: userData.employeeId,
      defaultCompany: newLegalEntity,
    });
    // Optional but Refresh any data that depends on the selected company

    setIsCompanySwitching(false);
  };

  useEffect(() => {
    if (userData?.defaultLegalEntity && !selectedLegalEntity) {
      setSelectedLegalEntity(userData.defaultLegalEntity);
    }
  }, [
    userData?.defaultLegalEntity,
    selectedLegalEntity,
    setSelectedLegalEntity,
  ]);

  // Update the header configuration to show the current selected company:
  useEffect(() => {
    const headerOptions = MainPageHeader({
      onToggleDrawer: toggleDrawer,
      onTitle: 'My Team',
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
    handleLogoutauth(userData.Provider);
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

  const renderTeamCard = ({item}) => (
    <AssignedWorkerCard
      employeeId={item.EmployeId}
      employeeName={item.Name}
      departmentName={item.DepartmentName}
      email={item.Email}
      positionId={item.PositionId}
      positionDescription={item.PositionDescription}
      workerRecId={userData.WorkerRecId}
    />
  );

  return (
    <View style={styles.container}>
      {isLoading || isCompanySwitching ? (
        <CustomIndicator />
      ) : teamData.length > 0 ? (
        <FlatList
          data={teamData}
          renderItem={renderTeamCard}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{flexGrow: 1}}
        />
      ) : (
        <Text style={styles.mainTxt}>No Data Found</Text>
      )}

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
    backgroundColor: '#fff',
  },
  mainTxt: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
});

export default WorkerAssignedToMe;
