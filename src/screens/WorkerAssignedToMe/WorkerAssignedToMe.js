/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
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
import {iconSize} from '../../store/utils/scaling';

// ---------------- Employee Node ----------------
const EmployeeNode = ({employee, onPress}) => {
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);

  useEffect(() => {
    fetchProfilePicture(employee.id);
  }, [employee.id]);

  const getInitials = name => {
    if (!name) return 'UN';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

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
    <View style={styles.WorkerATM_EmployeeContainer}>
      <View style={styles.WorkerATM_HorizontalConnector} />
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.WorkerATM_EmployeeCard}
        onPress={onPress}>
        {profilePictureUrl ? (
          <Image
            source={{uri: profilePictureUrl}}
            style={styles.WorkerATM_EmployeeAvatar}
          />
        ) : (
          <View
            style={[
              styles.WorkerATM_EmployeeAvatar,
              styles.WorkerATM_EmployeeAvatarPlaceholder,
            ]}>
            <Text style={styles.WorkerATM_EmployeeInitials}>
              {getInitials(employee?.name)}
            </Text>
          </View>
        )}
        <View style={styles.WorkerATM_EmployeeInfo}>
          <Text style={styles.WorkerATM_EmployeeName} numberOfLines={1}>
            {employee.name}
          </Text>
          <Text style={styles.WorkerATM_EmployeeRole} numberOfLines={1}>
            {employee.role}
          </Text>
        </View>
        <View style={styles.WorkerATM_ChevronIcon}>
          <FontAwesome
            name="chevron-right"
            size={iconSize.xs}
            color="#9CA3AF"
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

// ---------------- Root User ----------------
const RootUser = ({
  employee,
  profilePictureUrl,
  isRootEmployee,
  isSelected = false,
  isShrunk = false,
  showConnector = false,
  onPress,
}) => {
  const navigation = useNavigation();

  const getInitials = name => {
    if (!name) return 'UN';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleLeaveHistoryPress = () => {
    navigation.navigate('LeavesListPage', {
      employeeId: employee?.employeeId || employee?.id,
      employeeName: employee?.employeeName || employee?.name,
      WorkerRecId: employee?.WorkerRecId,
      cameFrom: 'WorkerAssignedToMe',
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.WorkerATM_RootContainer}
      onPress={onPress}
      disabled={!onPress}>
      <View
        style={[
          styles.WorkerATM_RootCard,
          isShrunk && styles.WorkerATM_RootCardShrunk,
        ]}>
        {profilePictureUrl ? (
          <Image
            source={{uri: profilePictureUrl}}
            style={[
              styles.WorkerATM_RootAvatar,
              isShrunk && styles.WorkerATM_RootAvatarShrunk,
            ]}
          />
        ) : (
          <View
            style={[
              styles.WorkerATM_RootAvatar,
              isShrunk && styles.WorkerATM_RootAvatarShrunk,
              styles.WorkerATM_RootAvatarPlaceholder,
            ]}>
            <Text
              style={[
                styles.WorkerATM_RootInitials,
                isShrunk && styles.WorkerATM_RootInitialsShrunk,
              ]}>
              {getInitials(employee?.employeeName || employee?.name)}
            </Text>
          </View>
        )}
        <View style={styles.WorkerATM_RootInfo}>
          <View style={styles.WorkerATM_RootInfoRow}>
            <Text
              style={[
                styles.WorkerATM_RootName,
                isShrunk && styles.WorkerATM_RootNameShrunk,
              ]}
              numberOfLines={1}>
              {employee?.employeeName || employee?.name || 'No name'}
            </Text>
            <Text
              style={[
                styles.WorkerATM_RootRole,
                isShrunk && styles.WorkerATM_RootRoleShrunk,
              ]}
              numberOfLines={1}>
              {employee?.employeeId || employee?.id || '—'}
            </Text>
          </View>
          <View style={styles.WorkerATM_RootInfoRow}>
            <Text
              style={[
                styles.WorkerATM_RootMeta,
                isShrunk && styles.WorkerATM_RootMetaShrunk,
              ]}
              numberOfLines={1}>
              Department: {employee?.department || employee?.department || '—'}
            </Text>
          </View>
          <View style={styles.WorkerATM_RootInfoRow}>
            <Text
              style={[
                styles.WorkerATM_RootMeta,
                isShrunk && styles.WorkerATM_RootMetaShrunk,
              ]}
              numberOfLines={1}>
              Position: {employee?.role || employee?.PositionDescription || '—'}
            </Text>
          </View>

          {/* Action buttons only for current selected user (not shrunk) */}
          {!isRootEmployee && !isShrunk && (
            <View style={styles.WorkerATM_ActionButtonRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.WorkerATM_ActionButton}
                onPress={handleLeaveHistoryPress}>
                <FontAwesome name="calendar" size={iconSize.xs} color="#fff" />
                <Text style={styles.WorkerATM_ActionButtonText}>
                  Leave History
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Bottom connector line for shrunk users */}
      {isShrunk && showConnector && (
        <View style={styles.WorkerATM_BottomConnector} />
      )}
    </TouchableOpacity>
  );
};

// ---------------- Main ----------------
const WorkerAssignedToMe = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [rootChain, setRootChain] = useState([]);
  const [profilePictures, setProfilePictures] = useState({});

  const {userData} = useSelector(state => state.user);

  const getEmployeeId = emp => emp?.employeeId || emp?.id;

  const fetchProfilePictureForRoot = async employeeId => {
    if (!employeeId) return;
    try {
      const data = await ProfilePicture({employeeId});
      const imageData = Array.isArray(data) && data.length > 0 ? data[0] : data;
      if (imageData?.StringImage) {
        const clean = imageData.StringImage.replace(/\s/g, '');
        const uri = `data:image/png;base64,${clean}`;
        setProfilePictures(prev => ({...prev, [employeeId]: uri}));
      } else {
        setProfilePictures(prev => ({...prev, [employeeId]: null}));
      }
    } catch {
      setProfilePictures(prev => ({...prev, [employeeId]: null}));
    }
  };

  const fetchEmployeeReportToMe = async (employee, resetChain = false) => {
    if (!employee) return;
    setIsLoading(true);
    try {
      const myTeamData = await RetrieveEmployeeReportToMe({
        employeeId: getEmployeeId(employee),
      });

      const mapped =
        myTeamData?.map(emp => ({
          id: emp.EmployeId,
          employeeId: emp.EmployeId,
          name: emp.Name,
          role: emp.PositionDescription,
          department: emp.DepartmentName,
          email: emp.Email,
          positionId: emp.PositionId,
        })) || [];

      setEmployees(mapped);

      if (resetChain) {
        setRootChain([employee]);
      }
    } catch {
      setAlertMessage('Failed to Fetch Data.');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectEmployee = emp => {
    setRootChain(prev => [...prev, emp]);
    fetchEmployeeReportToMe(emp);
    fetchProfilePictureForRoot(getEmployeeId(emp));
  };

  const handleChainClick = (emp, index) => {
    setRootChain(prev => prev.slice(0, index + 1));
    fetchEmployeeReportToMe(emp);
    fetchProfilePictureForRoot(getEmployeeId(emp));
  };

  useEffect(() => {
    if (userData?.employeeId) {
      fetchEmployeeReportToMe(userData, true);
      fetchProfilePictureForRoot(getEmployeeId(userData));
    }
  }, [userData?.employeeId]);

  return (
    <ActionPaneContainer
      pageTitle="My Team"
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={false}
      onRefresh={() =>
        fetchEmployeeReportToMe(rootChain[rootChain.length - 1] || userData)
      }>
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <ScrollView
          style={styles.WorkerATM_ScrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() =>
                fetchEmployeeReportToMe(
                  rootChain[rootChain.length - 1] || userData,
                )
              }
            />
          }>
          <View style={styles.WorkerATM_ContentWrapper}>
            <View style={styles.WorkerATM_ChainContainer}>
              {rootChain.map((emp, index) => {
                const isCurrentSelected = index === rootChain.length - 1;
                const isShrunk = index < rootChain.length - 1;
                const showConnector = index < rootChain.length - 1;

                return (
                  <RootUser
                    key={getEmployeeId(emp)}
                    employee={emp}
                    profilePictureUrl={
                      profilePictures[getEmployeeId(emp)] || null
                    }
                    isRootEmployee={emp.employeeId === userData.employeeId}
                    isSelected={isCurrentSelected}
                    isShrunk={isShrunk}
                    showConnector={showConnector}
                    onPress={() => handleChainClick(emp, index)}
                  />
                );
              })}
            </View>

            {rootChain.length > 0 && employees.length > 0 && (
              <View style={styles.WorkerATM_ConnectorFromRoot} />
            )}

            {employees.length > 0 ? (
              <View>
                <View style={styles.WorkerATM_VerticalLine} />
                {employees.map(emp => (
                  <EmployeeNode
                    key={emp.id}
                    employee={emp}
                    onPress={() => handleSelectEmployee(emp)}
                  />
                ))}
              </View>
            ) : rootChain.length === 1 ? (
              <Text style={styles.WorkerATM_NoDataText}>
                No Team Members Found
              </Text>
            ) : null}
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
