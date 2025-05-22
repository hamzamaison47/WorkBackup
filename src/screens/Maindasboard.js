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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import {useNavigation, useFocusEffect} from '@react-navigation/native';

import {wp, hp} from '../constants/Size';
import {UserContext} from '../context/UserContext';

import {ProfilePicture} from '../API/ProfilePicture/ProfilePicture';
import {retrieveByEmail} from '../API/WorkflowTrackingStatusTable/retrieveByEmail';

import LogoutAlertModal from '../components/Leaves/LogoutAlertModal';
import MainPageHeader from '../components/PageHeader/MainPageHeader';
import NotificationDropdown from '../components/NotificationDropdown';

const {height, width} = Dimensions.get('window');

const MainDashboard = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationVisible, setNotificationVisible] = useState(false);

  const navigation = useNavigation();
  const {userData} = useContext(UserContext);

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

  useEffect(() => {
    fetchProfilePicture();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    fetchNotifications(); // Initial fetch
    return () => clearInterval(interval);
  }, [userData.email]);

  useEffect(() => {
    const headerOptions = MainPageHeader({
      onToggleDrawer: toggleDrawer,
      onShowNotify: toggleNotification,
      onCount: notificationCount,
      onLogout: handleLogout,
    });
    navigation.setOptions(headerOptions);
  }, [
    navigation,
    notificationCount,
    notificationVisible,
    notifications,
    toggleDrawer,
  ]);

  const closeNotification = () => setNotificationVisible(false);
  const toggleDrawer = () => navigation.toggleDrawer();
  const toggleNotification = () => setNotificationVisible(!notificationVisible);

  const handleLogout = () => setModalVisible(true);
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

  const fetchProfilePicture = async () => {
    setIsLoading(true);
    try {
      const data = await ProfilePicture({employeeId: userData.employeeId});
      const base64Image = `data:image/png;base64,${data.StringImage}`;
      setProfilePictureUrl(base64Image);
    } catch (error) {
      console.error('Failed to fetch Image data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cards = [
    {
      text: 'Leave Request',
      colors: ['orange', 'orange'],
      icon: 'calendar',
      onPress: () =>
        navigation.navigate('Leaves', {employeeId: userData.employeeId}),
    },
    {
      text: 'Resignation Request',
      colors: ['orange', 'orange'],
      icon: 'flag',
      onPress: () =>
        navigation.navigate('EndOfService', {employeeId: userData.employeeId}),
    },
    {
      text: 'Salary Slip',
      colors: ['orange', 'orange'],
      icon: 'money',
      onPress: () =>
        navigation.navigate('PRSalarySlip', {employeeId: userData.employeeId}),
    },
    {
      text: 'Tax Certificate',
      colors: ['orange', 'orange'],
      icon: 'certificate',
      onPress: () =>
        navigation.navigate('PRTaxCertificate', {
          employeeId: userData.employeeId,
        }),
    },
    {
      text: 'Loan Request',
      colors: ['orange', 'orange'],
      icon: 'handshake-o',
      onPress: () =>
        navigation.navigate('LoanRequest', {
          employeeId: userData.employeeId,
        }),
    },
    {
      text: 'Advance Salary',
      colors: ['orange', 'orange'],
      icon: 'credit-card',
      onPress: () =>
        navigation.navigate('AdvanceSalary', {
          employeeId: userData.employeeId,
        }),
    },
    {
      text: 'Entitlement Balances',
      colors: ['orange', 'orange'],
      icon: 'balance-scale',
      onPress: () =>
        navigation.navigate('EntitlementBalance', {
          employeeId: userData.employeeId,
        }),
    },
    {
      text: 'My Team',
      colors: ['orange', 'orange'],
      icon: 'users',
      onPress: () =>
        navigation.navigate('WorkerAssignedToMe', {
          employeeId: userData.employeeId,
        }),
    },
    {
      text: 'Employee Certificates',
      colors: ['orange', 'orange'],
      icon: 'file-text',
      onPress: () =>
        navigation.navigate('EmployeeCertificates', {
          employeeId: userData.employeeId,
        }),
    },
    {
      text: 'Employee Bank Account',
      colors: ['orange', 'orange'],
      icon: 'bank',
      onPress: () =>
        navigation.navigate('EmployeeBankAccount', {
          employeeId: userData.employeeId,
        }),
    },
    {
      text: 'Help Desk',
      colors: ['orange', 'orange'],
      icon: 'heart-o',
      onPress: () =>
        navigation.navigate('HelpDesk', {
          employeeId: userData.employeeId,
        }),
    },
  ];

  const renderCard = ({item}) => (
    <TouchableOpacity onPress={item.onPress} style={styles.cardContainer}>
      <LinearGradient colors={item.colors} style={styles.card}>
        <View style={styles.iconContainer}>
          <Icon name={item.icon} size={hp(5)} color="#FFFFFF" />
        </View>
        <Text style={styles.cardText}>{item.text}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          {isLoading ? (
            <ActivityIndicator size="large" color="orange" />
          ) : (
            <TouchableOpacity onPress={() => setImageModalVisible(true)}>
              <Image
                source={{
                  uri: profilePictureUrl || 'https://via.placeholder.com/150',
                }}
                style={styles.profilePicture}
              />
            </TouchableOpacity>
          )}
          <View style={styles.textColumn}>
            <Text style={styles.welcomeText}>Maison Payroll Dashboard</Text>
            <Text style={styles.nameText}>Hello, {userData.employeeName}</Text>
          </View>
        </View>
        <View style={styles.summaryTextContainer}>
          <Text style={styles.sectionTitle}>Your Quick Links</Text>
        </View>
      </View>

      <FlatList
        data={cards}
        renderItem={renderCard}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.cardList}
        numColumns={2}
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

      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>Maison Consulting and Solutions</Text>
      </View>
      {notificationVisible && (
        <NotificationDropdown
          visible={notificationVisible}
          notifications={notifications}
          onClose={closeNotification}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    width: wp(90),
    alignSelf: 'center',
    marginTop: hp(5),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  profilePicture: {
    width: hp(18),
    height: hp(18),
    borderRadius: hp(9),
    marginRight: wp(3),
  },
  textColumn: {
    flexDirection: 'column',
  },
  welcomeText: {
    fontSize: hp(4.5),
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: hp(1),
    textAlign: 'left',
  },
  nameText: {
    fontSize: hp(3.5),
    color: '#555555',
    textAlign: 'left',
  },
  summaryTextContainer: {
    marginTop: hp(2),
    marginBottom: hp(2),
  },
  sectionTitle: {
    fontSize: hp(3.8),
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
  cardList: {
    alignSelf: 'center',
    paddingBottom: hp(8),
  },
  cardContainer: {
    margin: wp(3),
    elevation: 3,
    borderRadius: 15,
    overflow: 'hidden',
  },
  card: {
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    height: hp(25),
    width: wp(42),
    padding: 10,
  },
  cardText: {
    fontSize: hp(3.5),
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  iconContainer: {
    marginBottom: hp(1),
    alignItems: 'center',
  },
  footerContainer: {
    padding: hp(1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: hp(2.5),
    color: '#888888',
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
    // padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalImage: {
    width: width * 0.8,
    height: height * 0.6,
    borderRadius: 10,
    // marginBottom: 20,
  },
});

export default MainDashboard;
