/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable curly */
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import {RetrieveEmployeeReportToMe} from '../../API/WorkerAssignedToMe/RetrieveEmployeeReportToMe';
import {ProfilePicture} from '../../API/PersonalInformation/ProfilePicture/ProfilePicture';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import AlertModal from '../../components/Alert/AlertModal';
import styles from '../../styles/styles';

// ----------------------------
// Employee Node Component
// ----------------------------
const EmployeeNode = ({employee, onPress}) => {
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);

  useEffect(() => {
    fetchProfilePicture(employee.id);
  }, [employee.id]);

  const fetchProfilePicture = async employeeId => {
    try {
      const data = await ProfilePicture({employeeId});
      let imageData = Array.isArray(data) && data.length > 0 ? data[0] : data;
      if (imageData?.StringImage) {
        const cleanBase64 = imageData.StringImage.replace(/\s/g, '');
        setProfilePictureUrl(`data:image/png;base64,${cleanBase64}`);
      }
    } catch {
      setProfilePictureUrl(null);
    }
  };

  return (
    <View style={styles.orgStyles_employeeContainer}>
      <View style={styles.orgStyles_horizontalConnector} />
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.orgStyles_employeeCard}
        onPress={onPress}>
        <Image
          source={
            profilePictureUrl
              ? {uri: profilePictureUrl}
              : require('../../assets/userLogo.jpg')
          }
          style={styles.orgStyles_employeeAvatar}
        />
        <View style={styles.orgStyles_employeeInfo}>
          <Text style={styles.orgStyles_employeeName}>{employee.name}</Text>
          <Text style={styles.orgStyles_employeeRole}>{employee.role}</Text>
        </View>
        <FontAwesome name="chevron-right" size={14} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );
};

// ----------------------------
// Department Section Component
// ----------------------------
const DepartmentSection = ({department, onSelectEmployee}) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <View>
      <TouchableOpacity
        style={styles.orgStyles_departmentHeader}
        onPress={() => setExpanded(!expanded)}>
        <View style={styles.orgStyles_departmentIcon}>
          <FontAwesome name="sitemap" size={16} color="#0A66C2" />
        </View>
        <Text style={styles.orgStyles_departmentName}>{department.name}</Text>
        <Text style={styles.orgStyles_departmentCount}>
          {department.children.length}
        </Text>
        <TouchableOpacity
          style={styles.orgStyles_expandButton}
          onPress={() => setExpanded(!expanded)}>
          <FontAwesome
            name={expanded ? 'chevron-down' : 'chevron-right'}
            size={16}
            color="#6B7280"
          />
        </TouchableOpacity>
      </TouchableOpacity>

      {expanded && (
        <View style={{marginLeft: 20, position: 'relative'}}>
          <View style={styles.orgStyles_verticalLine} />
          {department.children.map(employee => (
            <EmployeeNode
              key={employee.id}
              employee={employee}
              onPress={() => onSelectEmployee(employee)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

// ----------------------------
// Root User Component
// ----------------------------
const RootUser = ({userData}) => {
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);

  useEffect(() => {
    if (userData?.employeeId || userData?.id) {
      fetchProfilePicture(userData.employeeId || userData.id);
    }
  }, [userData?.employeeId, userData?.id]);

  const fetchProfilePicture = async employeeId => {
    try {
      const data = await ProfilePicture({employeeId});
      let imageData = Array.isArray(data) && data.length > 0 ? data[0] : data;
      if (imageData?.StringImage) {
        const cleanBase64 = imageData.StringImage.replace(/\s/g, '');
        setProfilePictureUrl(`data:image/png;base64,${cleanBase64}`);
      }
    } catch {
      setProfilePictureUrl(null);
    }
  };

  return (
    <View style={styles.orgStyles_rootContainer}>
      <View style={styles.orgStyles_rootCard}>
        <Image
          source={
            profilePictureUrl
              ? {uri: profilePictureUrl}
              : require('../../assets/userLogo.jpg')
          }
          style={styles.orgStyles_rootAvatar}
        />
        <Text style={styles.orgStyles_rootName}>
          {userData?.employeeName || userData?.name || 'No name'}
        </Text>
        <Text style={styles.orgStyles_rootRole}>
          {userData?.jobId || userData?.role || 'No job id'}
        </Text>
      </View>
    </View>
  );
};

// ----------------------------
// Transform API -> hierarchy
// ----------------------------
const transformToHierarchy = employees => {
  const grouped = {};
  employees.forEach(emp => {
    if (!grouped[emp.DepartmentName]) {
      grouped[emp.DepartmentName] = [];
    }
    grouped[emp.DepartmentName].push({
      id: emp.EmployeId,
      name: emp.Name,
      role: emp.PositionDescription,
      email: emp.Email,
      type: 'employee',
    });
  });

  return Object.keys(grouped).map(dept => ({
    id: dept,
    name: dept,
    type: 'department',
    children: grouped[dept],
  }));
};

// ----------------------------
// Main Screen Component
// ----------------------------
const WorkerAssignedToMe = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [hierarchy, setHierarchy] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [currentRoot, setCurrentRoot] = useState(null); // selected employee becomes top node
  const [history, setHistory] = useState([]); // stack for drill-down back
  const [showDetailsDropdown, setShowDetailsDropdown] = useState(false); // dropdown under Details button
  const [topProfilePictureUrl, setTopProfilePictureUrl] = useState(null); // picture for selected employee at top

  const {userData} = useSelector(state => state.user);
  const navigation = useNavigation();

  // ----------------------------
  // Helpers
  // ----------------------------
  const getEmployeeId = emp => emp?.employeeId || emp?.id;
  const getDisplayName = emp => emp?.employeeName || emp?.name || 'No name';
  const getDisplayDept = emp =>
    emp?.department ||
    emp?.DepartmentName ||
    emp?.deptName ||
    emp?.jobId ||
    emp?.role ||
    '—';

  const fetchTopProfilePicture = async employeeId => {
    if (!employeeId) return setTopProfilePictureUrl(null);
    try {
      const data = await ProfilePicture({employeeId});
      const imageData = Array.isArray(data) && data.length > 0 ? data[0] : data;
      if (imageData?.StringImage) {
        const clean = imageData.StringImage.replace(/\s/g, '');
        setTopProfilePictureUrl(`data:image/png;base64,${clean}`);
      } else {
        setTopProfilePictureUrl(null);
      }
    } catch {
      setTopProfilePictureUrl(null);
    }
  };

  // ----------------------------
  // API
  // ----------------------------
  const fetchEmployeeReportToMe = async (employeeId, asRoot = null) => {
    if (!employeeId) return;
    setIsLoading(true);
    try {
      const myTeamData = await RetrieveEmployeeReportToMe({employeeId});
      if (myTeamData && myTeamData.length > 0) {
        setHierarchy(transformToHierarchy(myTeamData));
      } else {
        setHierarchy([]);
      }
      if (asRoot) setCurrentRoot(asRoot);
    } catch (error) {
      setAlertMessage('Failed to Fetch Data.');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------
  // Events
  // ----------------------------
  const handleSelectEmployee = employee => {
    setShowDetailsDropdown(false);
    setHistory(prev => [...prev, currentRoot || userData]); // push current top to stack
    fetchEmployeeReportToMe(getEmployeeId(employee), employee);
  };

  const handleBack = () => {
    setShowDetailsDropdown(false);
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const previous = prev[prev.length - 1]; // peek
      const newHistory = prev.slice(0, -1); // then pop
      fetchEmployeeReportToMe(getEmployeeId(previous), previous);
      return newHistory;
    });
  };

  const navigateFromDetails = screenName => {
    setShowDetailsDropdown(false);
    // pass both the object and a normalized id
    navigation.navigate(screenName, {
      employee: currentRoot,
      employeeId: getEmployeeId(currentRoot),
      WorkerRecId: currentRoot?.workerRecId,
      cameFrom: 'WorkerAssignedToMe',
    });
  };

  // ----------------------------
  // Effects
  // ----------------------------
  useEffect(() => {
    if (userData?.employeeId) {
      fetchEmployeeReportToMe(getEmployeeId(userData), userData);
    }
  }, [userData.employeeId]);

  useEffect(() => {
    // load profile picture for selected top node (not for root)
    if (currentRoot) {
      fetchTopProfilePicture(getEmployeeId(currentRoot));
    } else {
      setTopProfilePictureUrl(null);
    }
  }, [currentRoot]);

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <ActionPaneContainer
      pageTitle="My Team"
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      onRefresh={() =>
        fetchEmployeeReportToMe(
          getEmployeeId(currentRoot || userData),
          currentRoot || null,
        )
      }>
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <ScrollView
          style={styles.orgStyles_scrollContainer}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() =>
                fetchEmployeeReportToMe(
                  getEmployeeId(currentRoot || userData),
                  currentRoot || null,
                )
              }
            />
          }>
          <View style={styles.orgStyles_contentWrapper}>
            {/* Back Button (only when not at root) */}
            {history.length > 0 && (
              <TouchableOpacity onPress={handleBack}>
                <Text style={styles.orgStyles_backButton}>
                  ← Back to{' '}
                  {history[history.length - 1]?.employeeName ||
                    history[history.length - 1]?.name}
                </Text>
              </TouchableOpacity>
            )}

            {/* Top Node:
                - If root: show existing RootUser (no Details)
                - If selected employee: show card with Image, Name, Department, Details button (inside the card) */}
            {/* Top Node:
    - If currentRoot exists AND it's not the root user -> show Details card
    - Else -> show RootUser (no Details)
*/}
            {currentRoot &&
            getEmployeeId(currentRoot) !== getEmployeeId(userData) ? (
              <View style={styles.orgStyles_rootContainer}>
                <View style={styles.orgStyles_rootCard}>
                  <Image
                    source={
                      topProfilePictureUrl
                        ? {uri: topProfilePictureUrl}
                        : require('../../assets/userLogo.jpg')
                    }
                    style={styles.orgStyles_rootAvatar}
                  />

                  {/* Employee Name */}
                  <Text style={styles.orgStyles_rootName}>
                    {getDisplayName(currentRoot)}
                  </Text>

                  {/* Department */}
                  <Text style={styles.orgStyles_rootRole}>
                    {getDisplayDept(currentRoot)}
                  </Text>

                  {/* Details Button */}
                  <View style={{marginTop: 12, alignItems: 'center'}}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setShowDetailsDropdown(prev => !prev)}
                      style={{
                        backgroundColor: '#0A66C2',
                        paddingVertical: 8,
                        paddingHorizontal: 16,
                        borderRadius: 8,
                      }}>
                      <Text style={{color: '#FFFFFF', fontWeight: '600'}}>
                        Details
                      </Text>
                    </TouchableOpacity>

                    {showDetailsDropdown && (
                      <View
                        style={{
                          marginTop: 8,
                          backgroundColor: '#FFFFFF',
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: '#E5E7EB',
                          shadowColor: '#000',
                          shadowOffset: {width: 0, height: 1},
                          shadowOpacity: 0.1,
                          shadowRadius: 2,
                          elevation: 2,
                          width: 200,
                          overflow: 'hidden',
                        }}>
                        {[
                          {
                            label: 'Leave History',
                            screen: 'LeavesListPage',
                            params: {
                              employeeId: getEmployeeId(currentRoot),
                              employeeName: getDisplayName(currentRoot),
                              WorkerRecId: currentRoot?.workerRecId,
                              cameFrom: 'WorkerAssignedToMe',
                            },
                          },
                        ].map(item => (
                          <TouchableOpacity
                            key={item.screen}
                            onPress={() => navigateFromDetails(item.screen)}
                            style={{
                              paddingVertical: 10,
                              paddingHorizontal: 12,
                            }}>
                            <Text
                              style={{
                                color: '#111827',
                                fontSize: 14,
                                fontWeight: '500',
                              }}>
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ) : (
              <RootUser userData={userData} />
            )}

            {/* Connector from top node to departments */}
            {hierarchy.length > 0 && (
              <View style={styles.orgStyles_connectorFromRoot} />
            )}

            {/* Departments */}
            {hierarchy.length > 0 ? (
              hierarchy.map(department => (
                <DepartmentSection
                  key={department.id}
                  department={department}
                  onSelectEmployee={handleSelectEmployee}
                />
              ))
            ) : (
              <Text style={styles.orgStyles_noDataText}>
                No Team Members Found
              </Text>
            )}
          </View>
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

export default WorkerAssignedToMe;
