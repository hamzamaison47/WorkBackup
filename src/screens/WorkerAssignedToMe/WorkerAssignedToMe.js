/* eslint-disable react-native/no-inline-styles */
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
  useWindowDimensions,
  Dimensions,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import {RetrieveEmployeeReportToMe} from '../../API/WorkerAssignedToMe/RetrieveEmployeeReportToMe';
import {ProfilePicture} from '../../API/PersonalInformation/ProfilePicture/ProfilePicture';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import AlertModal from '../../components/Alert/AlertModal';

// Get initial screen dimensions
const {width: initialScreenWidth} = Dimensions.get('window');

// Enhanced responsive utility functions
const getResponsiveSize = (baseSize, screenWidth) => {
  const scale = screenWidth / 375; // Base width (iPhone X)
  const newSize = baseSize * scale;
  return Math.max(Math.min(newSize, baseSize * 1.2), baseSize * 0.7); // Tighter bounds
};

const getResponsivePadding = (basePadding, screenWidth) => {
  const scale = screenWidth / 375;
  return basePadding * Math.max(Math.min(scale, 1.2), 0.7);
};

const getResponsiveFontSize = (baseFontSize, screenWidth) => {
  const scale = screenWidth / 375;
  const newSize = baseFontSize * scale;
  return Math.max(Math.min(newSize, baseFontSize * 1.2), baseFontSize * 0.75);
};

const getResponsiveCardWidth = screenWidth => {
  const baseWidth = 370;
  const padding = getResponsivePadding(32, screenWidth);
  const availableWidth = screenWidth - padding;
  return Math.min(baseWidth, availableWidth);
};

// ---------------- Employee Node ----------------
const EmployeeNode = ({employee, onPress, screenWidth}) => {
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);

  // Use fixed breakpoints instead of screen size detection for layout
  const shouldUseCompactLayout = screenWidth < 400;

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

  const getEmployeeStyles = () => ({
    employeeContainer: {
      marginRight: getResponsivePadding(16, screenWidth),
      marginVertical: getResponsivePadding(6, screenWidth),
      position: 'relative',
      paddingLeft: getResponsivePadding(16, screenWidth),
    },
    horizontalConnector: {
      position: 'absolute',
      left: getResponsiveSize(25, screenWidth),
      top: '50%',
      width: getResponsivePadding(16, screenWidth),
      height: 2,
      backgroundColor: '#0A66C2',
    },
    employeeCard: {
      flexDirection: 'row', // Always row layout
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      paddingVertical: getResponsivePadding(10, screenWidth),
      paddingHorizontal: getResponsivePadding(12, screenWidth),
      borderRadius: getResponsiveSize(8, screenWidth),
      borderWidth: 1,
      borderColor: '#E5E7EB',
      marginLeft: getResponsivePadding(16, screenWidth),
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
      minHeight: getResponsiveSize(60, screenWidth),
    },
    employeeAvatar: {
      width: getResponsiveSize(40, screenWidth),
      height: getResponsiveSize(40, screenWidth),
      borderRadius: getResponsiveSize(20, screenWidth),
      marginRight: getResponsivePadding(10, screenWidth),
      borderWidth: 2,
      borderColor: '#E5E7EB',
    },
    employeeInfo: {
      flex: 1,
      alignItems: 'flex-start', // Always left aligned
    },
    employeeName: {
      fontSize: getResponsiveFontSize(14, screenWidth),
      fontWeight: '600',
      color: '#111827',
      textAlign: 'left', // Always left aligned
    },
    employeeRole: {
      fontSize: getResponsiveFontSize(12, screenWidth),
      color: '#6B7280',
      marginTop: 2,
      textAlign: 'left', // Always left aligned
    },
    chevronIcon: {
      marginLeft: getResponsivePadding(8, screenWidth),
    },
  });

  const employeeStyles = getEmployeeStyles();

  return (
    <View style={employeeStyles.employeeContainer}>
      <View style={employeeStyles.horizontalConnector} />
      <TouchableOpacity
        activeOpacity={0.7}
        style={employeeStyles.employeeCard}
        onPress={onPress}>
        {profilePictureUrl ? (
          <Image
            source={{uri: profilePictureUrl}}
            style={employeeStyles.employeeAvatar}
          />
        ) : (
          <View
            style={[
              employeeStyles.employeeAvatar,
              {
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#E5E7EB',
              },
            ]}>
            <Text
              style={{
                fontSize: getResponsiveFontSize(14, screenWidth),
                fontWeight: '600',
                color: '#374151',
              }}>
              {getInitials(employee?.name)}
            </Text>
          </View>
        )}
        <View style={employeeStyles.employeeInfo}>
          <Text style={employeeStyles.employeeName} numberOfLines={1}>
            {employee.name}
          </Text>
          <Text style={employeeStyles.employeeRole} numberOfLines={1}>
            {employee.role}
          </Text>
        </View>
        <View style={employeeStyles.chevronIcon}>
          <FontAwesome
            name="chevron-right"
            size={getResponsiveSize(12, screenWidth)}
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
  screenWidth,
  isSelected = false,
  isShrunk = false,
  showConnector = false,
  onPress,
}) => {
  const navigation = useNavigation();

  // Use fixed layout regardless of screen size
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

  const getRootStyles = () => {
    // Current selected user (largest) vs upper users (shrunk)
    const avatarSize = isShrunk
      ? getResponsiveSize(50, screenWidth) // Shrunk size for upper users
      : getResponsiveSize(70, screenWidth); // Full size for current selected

    const nameFontSize = isShrunk
      ? getResponsiveFontSize(13, screenWidth)
      : getResponsiveFontSize(16, screenWidth);

    const roleFontSize = isShrunk
      ? getResponsiveFontSize(11, screenWidth)
      : getResponsiveFontSize(13, screenWidth);

    const metaFontSize = isShrunk
      ? getResponsiveFontSize(10, screenWidth)
      : getResponsiveFontSize(11, screenWidth);

    const paddingVertical = isShrunk
      ? getResponsivePadding(8, screenWidth)
      : getResponsivePadding(12, screenWidth);

    const cardWidth = isShrunk
      ? getResponsiveCardWidth(screenWidth) * 0.9
      : getResponsiveCardWidth(screenWidth);

    return {
      rootContainer: {
        alignItems: 'center',
        paddingHorizontal: getResponsivePadding(12, screenWidth),
        position: 'relative',
      },
      rootCardRow: {
        flexDirection: 'row', // Always row layout
        alignItems: 'center',
        backgroundColor: isShrunk ? '#F0F7FF' : '#F8FAFC',
        borderRadius: getResponsiveSize(10, screenWidth),
        padding: paddingVertical,
        borderWidth: 2,
        borderColor: '#0A66C2',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: isShrunk ? 1 : 2},
        shadowOpacity: isShrunk ? 0.06 : 0.1,
        shadowRadius: isShrunk ? 2 : 4,
        elevation: isShrunk ? 1 : 3,
        width: cardWidth,
        maxWidth: '100%',
        marginTop: getResponsivePadding(6, screenWidth),
        transform: isShrunk ? [{scale: 0.85}] : [{scale: 1}],
      },
      rootAvatarLarge: {
        width: avatarSize,
        height: avatarSize,
        borderRadius: avatarSize / 2,
        borderWidth: isShrunk
          ? getResponsiveSize(2, screenWidth)
          : getResponsiveSize(3, screenWidth),
        borderColor: '#0A66C2',
        marginRight: getResponsivePadding(12, screenWidth),
      },
      rootInfo: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'flex-start',
      },
      rootInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: getResponsivePadding(2, screenWidth),
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
      },
      rootName: {
        fontSize: nameFontSize,
        fontWeight: '700',
        color: '#111827',
        marginRight: getResponsivePadding(8, screenWidth),
        flexShrink: 1,
        textAlign: 'left',
      },
      rootRole: {
        fontSize: roleFontSize,
        color: '#0A66C2',
        fontWeight: '600',
        flexShrink: 1,
        textAlign: 'left',
      },
      rootMeta: {
        fontSize: metaFontSize,
        color: '#374151',
        marginRight: getResponsivePadding(8, screenWidth),
        flexShrink: 1,
        textAlign: 'left',
        lineHeight: getResponsiveFontSize(13, screenWidth),
      },
      buttonRow: {
        flexDirection: 'row',
        marginTop: getResponsivePadding(6, screenWidth),
        justifyContent: 'flex-start',
      },
      actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0A66C2',
        paddingVertical: getResponsivePadding(6, screenWidth),
        paddingHorizontal: getResponsivePadding(10, screenWidth),
        borderRadius: getResponsiveSize(14, screenWidth),
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
        marginRight: getResponsivePadding(6, screenWidth),
      },
      actionButtonText: {
        color: '#fff',
        fontSize: getResponsiveFontSize(11, screenWidth),
        fontWeight: '600',
        marginLeft: getResponsivePadding(4, screenWidth),
      },
      // Bottom connector for shrunk users
      bottomConnector: {
        position: 'absolute',
        bottom: -getResponsivePadding(22, screenWidth),
        alignSelf: 'center',
        width: 2,
        height: getResponsivePadding(28, screenWidth),
        backgroundColor: showConnector ? '#0A66C2' : 'transparent',
        zIndex: 1,
      },
    };
  };

  const rootStyles = getRootStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={rootStyles.rootContainer}
      onPress={onPress}
      disabled={!onPress}>
      <View style={rootStyles.rootCardRow}>
        {profilePictureUrl ? (
          <Image
            source={{uri: profilePictureUrl}}
            style={rootStyles.rootAvatarLarge}
          />
        ) : (
          <View
            style={[
              rootStyles.rootAvatarLarge,
              {
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#E5E7EB',
              },
            ]}>
            <Text
              style={{
                fontSize: getResponsiveFontSize(
                  isShrunk ? 14 : 18,
                  screenWidth,
                ),
                fontWeight: '700',
                color: '#374151',
              }}>
              {getInitials(employee?.employeeName || employee?.name)}
            </Text>
          </View>
        )}
        <View style={rootStyles.rootInfo}>
          <View style={rootStyles.rootInfoRow}>
            <Text style={rootStyles.rootName} numberOfLines={1}>
              {employee?.employeeName || employee?.name || 'No name'}
            </Text>
            <Text style={rootStyles.rootRole} numberOfLines={1}>
              {employee?.employeeId || employee?.id || '—'}
            </Text>
          </View>
          <View style={rootStyles.rootInfoRow}>
            <Text style={rootStyles.rootMeta} numberOfLines={1}>
              Department: {employee?.department || employee?.department || '—'}
            </Text>
          </View>
          <View style={rootStyles.rootInfoRow}>
            <Text style={rootStyles.rootMeta} numberOfLines={1}>
              Position: {employee?.role || employee?.PositionDescription || '—'}
            </Text>
          </View>

          {/* Only show action buttons for current selected user (not shrunk) */}
          {/* {!isRootEmployee && !isShrunk && (
            <View style={rootStyles.buttonRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={rootStyles.actionButton}
                onPress={handleLeaveHistoryPress}>
                <FontAwesome
                  name="calendar"
                  size={getResponsiveSize(12, screenWidth)}
                  color="#fff"
                />
                <Text style={rootStyles.actionButtonText}>Leave History</Text>
              </TouchableOpacity>
            </View>
          )} */}
        </View>
      </View>

      {/* Bottom connector line for shrunk users */}
      {isShrunk && showConnector && <View style={rootStyles.bottomConnector} />}
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
  const {width: screenWidth} = useWindowDimensions();

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

  // Responsive styles
  const getResponsiveStyles = () => ({
    scrollContainer: {
      flex: 1,
      backgroundColor: '#FAFAFA',
      paddingTop: getResponsivePadding(12, screenWidth),
    },
    contentWrapper: {
      paddingBottom: getResponsivePadding(30, screenWidth),
    },
    noDataText: {
      textAlign: 'center',
      marginTop: getResponsivePadding(30, screenWidth),
      fontSize: getResponsiveFontSize(14, screenWidth),
      fontWeight: '500',
      color: '#6B7280',
      paddingHorizontal: getResponsivePadding(16, screenWidth),
    },
    connectorFromRoot: {
      width: 2,
      height: getResponsivePadding(18, screenWidth),
      left: getResponsiveSize(25, screenWidth),
      backgroundColor: '#0A66C2',
      alignSelf: 'flex-start',
      marginBottom: -1,
    },
    verticalLine: {
      position: 'absolute',
      left: getResponsiveSize(25, screenWidth),
      top: -1,
      bottom: getResponsivePadding(35, screenWidth),
      width: 2,
      backgroundColor: '#0A66C2',
    },
    chainContainer: {
      position: 'relative',
    },
  });

  const responsiveStyles = getResponsiveStyles();

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
          style={responsiveStyles.scrollContainer}
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
          <View style={responsiveStyles.contentWrapper}>
            <View style={responsiveStyles.chainContainer}>
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
                    screenWidth={screenWidth}
                  />
                );
              })}
            </View>

            {rootChain.length > 0 && employees.length > 0 && (
              <View style={responsiveStyles.connectorFromRoot} />
            )}

            {employees.length > 0 ? (
              <View>
                <View style={responsiveStyles.verticalLine} />
                {employees.map(emp => (
                  <EmployeeNode
                    key={emp.id}
                    employee={emp}
                    onPress={() => handleSelectEmployee(emp)}
                    screenWidth={screenWidth}
                  />
                ))}
              </View>
            ) : rootChain.length === 1 ? (
              <Text style={responsiveStyles.noDataText}>
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
