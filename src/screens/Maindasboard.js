/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useContext, useCallback} from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Dimensions,
  BackHandler,
  ActivityIndicator,
  TouchableWithoutFeedback,
  SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useNavigation, useFocusEffect} from '@react-navigation/native';

import {wp, hp} from '../constants/Size';
import {UserContext} from '../context/UserContext';
import {CompanyContext} from '../context/CompanyContext';

import {ProfilePicture} from '../API/ProfilePicture/ProfilePicture';
import {retrieveByEmail} from '../API/WorkflowTrackingStatusTable/retrieveByEmail';

import LogoutAlertModal from '../components/Leaves/LogoutAlertModal';
import MainPageHeader from '../components/PageHeader/MainPageHeader';
import NotificationDropdown from '../components/NotificationDropdown';
import CompanyDropdown from '../components/PageHeader/CompanyDropdown';
import CustomIndicator from '../components/CustomIndicator/CustomIndicator';
import {handleLogoutauth} from '../Controller/authUtils';

const {height, width} = Dimensions.get('window');
const cardWidth = (width - 56) / 2;

const MainDashboard = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationVisible, setNotificationVisible] = useState(false);

  const [isCompanySwitching, setIsCompanySwitching] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const navigation = useNavigation();
  const {userData} = useContext(UserContext);
  const {selectedLegalEntity, setSelectedLegalEntity, legalEntities} =
    useContext(CompanyContext);

  // Initialize selectedLegalEntity with user's defaultLegalEntity if not already set
  useEffect(() => {
    if (userData?.defaultLegalEntity && !selectedLegalEntity) {
      setSelectedLegalEntity(userData.defaultLegalEntity);
    }
  }, [
    userData?.defaultLegalEntity,
    selectedLegalEntity,
    setSelectedLegalEntity,
  ]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleLogout();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
      };
    }, [handleLogout]),
  );

  useFocusEffect(
    useCallback(() => {
      // Close everything on focus
      closeAllOverlays();

      const onBackPress = () => {
        handleLogout();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => {
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
      };
    }, []),
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      closeAllOverlays();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    fetchProfilePicture();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    fetchNotifications(); // Initial fetch
    return () => clearInterval(interval);
  }, [userData.email]);

  const handleCompanySelect = async newLegalEntity => {
    setIsCompanySwitching(true);
    setSelectedLegalEntity(newLegalEntity);

    // Optional: simulate delay if needed for effect (or await any refresh logic)
    await new Promise(resolve => setTimeout(resolve, 2000));
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
      onTitle: 'Employee Self Service',
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
    setImageModalVisible(false);
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

  const fetchProfilePicture = async () => {
    setIsLoading(true);
    try {
      const data = await ProfilePicture({
        employeeId: userData.employeeId,
        defaultCompany: selectedLegalEntity,
      });

      if (data && data.length > 0 && data[0].StringImage) {
        const base64Image = `data:image/png;base64,${data[0].StringImage}`;
        setProfilePictureUrl(base64Image);
      } else {
        console.warn('No profile picture data found.');
        setProfilePictureUrl(null);
      }
    } catch (error) {
      console.error('Failed to fetch Image data:', error);
      setProfilePictureUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  const cards = [
    {
      id: '1',
      title: 'Leave Request',
      description: 'Apply for time off',
      icon: 'calendar-outline',
      onPress: () =>
        navigation.navigate('LeaveSaveRecord', {
          mode: 'create',
          employeeId: userData.employeeId,
          employeeName: userData.employeeName,
          WorkerRecId: userData.WorkerRecId,
          cameFrom: 'MainDashboard',
          selectedLegalEntity: selectedLegalEntity,
        }),
    },
    {
      id: '2',
      title: 'Salary Slip',
      description: 'View monthly payslip',
      icon: 'card-outline',
      onPress: () =>
        navigation.navigate('PRSalarySlip', {
          employeeId: userData.employeeId,
          selectedLegalEntity: selectedLegalEntity,
        }),
    },
  ];

  const renderCard = ({item}) => (
    <TouchableOpacity
      style={styles.card}
      onPress={item.onPress}
      activeOpacity={0.85}>
      <View style={styles.iconWrapper}>
        <Ionicons name={item.icon} size={30} color="#fff" />
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.welcomeCard}>
          <View style={styles.headerRow}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#FFA500" />
            ) : (
              <TouchableOpacity
                onPress={() => navigation.navigate('DisplayPersonalInfo')}>
                {/* <TouchableOpacity onPress={() => setImageModalVisible(true)}> */}
                <Image
                  source={{
                    uri: profilePictureUrl || 'https://via.placeholder.com/150',
                  }}
                  style={styles.profilePicture}
                />
              </TouchableOpacity>
            )}
            <View style={styles.textColumn}>
              <Text style={styles.welcomeText}>Welcome Back!</Text>
              <Text style={styles.nameText}>{userData.employeeName}</Text>
              <Text style={styles.emailText}>{userData.email}</Text>
              {/* {selectedLegalEntity && (
                <Text style={styles.companyText}>
                  Company: {selectedLegalEntity}
                </Text>
              )} */}
            </View>
          </View>
        </View>
      </View>

      <FlatList
        key={'2-cols'}
        numColumns={2}
        data={cards}
        renderItem={renderCard}
        keyExtractor={item => item.id}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      />

      <LogoutAlertModal
        visible={modalVisible}
        heading="Are you sure?"
        text="Do you really want to logout?"
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />

      <Modal
        transparent={true}
        visible={imageModalVisible}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setImageModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Image
                source={{
                  uri: profilePictureUrl || 'https://via.placeholder.com/150',
                }}
                style={styles.modalImage}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {isCompanySwitching && (
        <View style={styles.loadingOverlay}>
          <CustomIndicator size="large" color="#007AFF" />
        </View>
      )}

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  headerContainer: {
    width: wp(90),
    alignSelf: 'center',
    marginTop: hp(3),
    marginBottom: hp(2),
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 6},
    shadowRadius: 8,
    elevation: 8,
    marginBottom: hp(3),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  profilePicture: {
    width: hp(20),
    height: hp(20),
    borderRadius: hp(12.5),
    marginRight: wp(2),
    borderWidth: 4,
    borderColor: '#FFA500',
  },
  textColumn: {
    flexDirection: 'column',
    flex: 1,
  },
  welcomeText: {
    fontSize: hp(5),
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: hp(0.8),
    textAlign: 'left',
  },
  nameText: {
    fontSize: hp(4.5),
    color: '#FFA500',
    fontWeight: '600',
    textAlign: 'left',
    marginBottom: hp(0.5),
  },
  emailText: {
    fontSize: hp(2.8),
    color: '#5A5A5A',
    textAlign: 'left',
  },
  companyText: {
    fontSize: hp(2.5),
    color: '#FFA500',
    textAlign: 'left',
    marginTop: hp(0.5),
    fontWeight: '500',
  },
  grid: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    width: cardWidth,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 6,
    elevation: 5,
  },
  iconWrapper: {
    backgroundColor: '#FFA500',
    padding: 12,
    borderRadius: 50,
    marginBottom: 12,
    shadowColor: '#FFA500',
    shadowOpacity: 0.2,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#5A5A5A',
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalImage: {
    width: width * 0.8,
    height: height * 0.6,
    borderRadius: 10,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 9999,
  },
});

export default MainDashboard;
