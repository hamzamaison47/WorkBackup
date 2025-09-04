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
  StyleSheet,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import {RetrieveEmployeeReportToMe} from '../../API/WorkerAssignedToMe/RetrieveEmployeeReportToMe';
import {ProfilePicture} from '../../API/PersonalInformation/ProfilePicture/ProfilePicture';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import AlertModal from '../../components/Alert/AlertModal';

const styles = StyleSheet.create({
  orgStyles_scrollContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: 16,
  },
  orgStyles_contentWrapper: {paddingBottom: 40},
  orgStyles_noDataText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },

  // Root styles
  orgStyles_rootContainer: {alignItems: 'center', paddingHorizontal: 16},
  orgStyles_rootCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#0A66C2',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 370,
    marginTop: 12,
  },
  orgStyles_rootAvatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#0A66C2',
    marginRight: 16,
  },
  orgStyles_rootInfo: {flex: 1, flexDirection: 'column'},
  orgStyles_rootInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  orgStyles_rootName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginRight: 12,
    flexShrink: 1,
  },
  orgStyles_rootRole: {
    fontSize: 14,
    color: '#0A66C2',
    fontWeight: '600',
    flexShrink: 1,
  },
  orgStyles_rootMeta: {
    fontSize: 13,
    color: '#374151',
    marginRight: 12,
    flexShrink: 1,
  },
  orgStyles_buttonRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  orgStyles_actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A66C2',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginRight: 10,
  },
  orgStyles_actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },

  // Connectors
  orgStyles_connectorFromRoot: {
    width: 2,
    height: 21,
    left: 30,
    backgroundColor: '#0A66C2',
    alignSelf: 'flex-start',
    marginBottom: -1,
  },
  orgStyles_verticalLine: {
    position: 'absolute',
    left: 30,
    top: -1,
    bottom: 42,
    width: 2,
    backgroundColor: '#0A66C2',
  },
  orgStyles_employeeContainer: {
    marginRight: 20,
    marginVertical: 8,
    position: 'relative',
    paddingLeft: 20,
  },
  orgStyles_horizontalConnector: {
    position: 'absolute',
    left: 30,
    top: '50%',
    width: 20,
    height: 2,
    backgroundColor: '#0A66C2',
  },

  // Employee card
  orgStyles_employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginLeft: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  orgStyles_employeeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  orgStyles_employeeInfo: {flex: 1},
  orgStyles_employeeName: {fontSize: 15, fontWeight: '600', color: '#111827'},
  orgStyles_employeeRole: {fontSize: 13, color: '#6B7280', marginTop: 2},
});

// ---------------- Employee Node ----------------
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

// ---------------- Root User ----------------
const RootUser = ({employee, profilePictureUrl, isRootEmployee}) => {
  const navigation = useNavigation();

  const handleLeaveHistoryPress = () => {
    navigation.navigate('LeavesListPage', {
      employeeId: employee?.employeeId || employee?.id,
      employeeName: employee?.employeeName || employee?.name,
      WorkerRecId: employee?.WorkerRecId,
      cameFrom: 'WorkerAssignedToMe',
    });
  };

  return (
    <View style={styles.orgStyles_rootContainer}>
      <View style={styles.orgStyles_rootCardRow}>
        <Image
          source={
            profilePictureUrl
              ? {uri: profilePictureUrl}
              : require('../../assets/userLogo.jpg')
          }
          style={styles.orgStyles_rootAvatarLarge}
        />
        <View style={styles.orgStyles_rootInfo}>
          <View style={styles.orgStyles_rootInfoRow}>
            <Text style={styles.orgStyles_rootName}>
              {employee?.employeeName || employee?.name || 'No name'}
            </Text>
            <Text style={styles.orgStyles_rootRole}>
              {employee?.role || employee?.department || '—'}
            </Text>
          </View>
          <View style={styles.orgStyles_rootInfoRow}>
            <Text style={styles.orgStyles_rootMeta}>
              ID: {employee?.employeeId || employee?.id || '—'}
            </Text>
          </View>

          {!isRootEmployee && (
            <View style={styles.orgStyles_buttonRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.orgStyles_actionButton}
                onPress={handleLeaveHistoryPress}>
                <FontAwesome name="calendar" size={16} color="#fff" />
                <Text style={styles.orgStyles_actionButtonText}>
                  Leave History
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
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
          name: emp.Name,
          role: emp.PositionDescription,
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
    setRootChain(prev => [...prev, emp]); // append chain
    fetchEmployeeReportToMe(emp);
    fetchProfilePictureForRoot(getEmployeeId(emp));
  };

  const handleChainClick = (emp, index) => {
    setRootChain(prev => prev.slice(0, index + 1)); // cut chain
    fetchEmployeeReportToMe(emp);
    fetchProfilePictureForRoot(getEmployeeId(emp));
  };

  useEffect(() => {
    if (userData?.employeeId) {
      fetchEmployeeReportToMe(userData, true);
      fetchProfilePictureForRoot(getEmployeeId(userData));
    }
  }, [userData.employeeId]);

  return (
    <ActionPaneContainer
      pageTitle="My Team"
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      onRefresh={() =>
        fetchEmployeeReportToMe(rootChain[rootChain.length - 1] || userData)
      }>
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <ScrollView
          style={styles.orgStyles_scrollContainer}
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
          <View style={styles.orgStyles_contentWrapper}>
            {/* Root chain */}
            {rootChain.map((emp, index) => (
              <TouchableOpacity
                key={getEmployeeId(emp)}
                activeOpacity={0.7}
                onPress={() => handleChainClick(emp, index)}>
                <RootUser
                  employee={emp}
                  profilePictureUrl={
                    profilePictures[getEmployeeId(emp)] || null
                  }
                  isRootEmployee={emp.employeeId === userData.employeeId}
                />
                {/* Connector below last root if children exist */}
                {index === rootChain.length - 1 && employees.length > 0 && (
                  <View style={styles.orgStyles_connectorFromRoot} />
                )}
              </TouchableOpacity>
            ))}

            {/* Employees under last root */}
            {employees.length > 0 ? (
              <View>
                <View style={styles.orgStyles_verticalLine} />
                {employees.map(emp => (
                  <EmployeeNode
                    key={emp.id}
                    employee={emp}
                    onPress={() => handleSelectEmployee(emp)}
                  />
                ))}
              </View>
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
