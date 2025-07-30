/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unstable-nested-components */
import React, {useState, useContext, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  BackHandler,
} from 'react-native';
import {PREmailSalarySlip} from '../../API/Reports/PREmailSalarySlip';
import {Dropdown} from 'react-native-element-dropdown';
import Modal from 'react-native-modal';
import {
  useTheme,
  useRoute,
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {UserContext} from '../../context/UserContext';
import {CompanyContext} from '../../context/CompanyContext';
import Icon from 'react-native-vector-icons/FontAwesome';
import {PayGroupPayperiodByEmployeeId} from '../../API/PayGroupPayPeriod/PayGroupPayperiodByEmployeeId';
import {hp, wp} from '../../constants/Size';
import LinearGradient from 'react-native-linear-gradient';
import logo from '../../assets/cloud.png';
import MainPageHeader from '../../components/PageHeader/MainPageHeader';
import LogoutAlertModal from '../../components/Leaves/LogoutAlertModal';
import NotificationDropdown from '../../components/NotificationDropdown';
import CompanyDropdown from '../../components/PageHeader/CompanyDropdown';
import {retrieveByEmail} from '../../API/WorkflowTrackingStatusTable/retrieveByEmail';
import {reporter} from '../../../metro.config';

const {height, width} = Dimensions.get('window');

const PRSalarySlip = () => {
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [payPeriods, setPayPeriods] = useState([]);
  const [selectedPayPeriod, setSelectedPayPeriod] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const {colors} = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const {employeeId} = route.params || {};
  const {userData} = useContext(UserContext);
  const {selectedLegalEntity, setSelectedLegalEntity, legalEntities} =
    useContext(CompanyContext);
  const companyToUse = selectedLegalEntity || userData.defaultLegalEntity;

  useFocusEffect(
    React.useCallback(() => {
      resetForm();
      fetchPayPeriods(companyToUse);
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
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
    const interval = setInterval(fetchNotifications, 30000);
    fetchNotifications(); // Initial fetch
    return () => clearInterval(interval);
  }, [userData.email]);

  const handleCompanySelect = newLegalEntity => {
    setSelectedLegalEntity(newLegalEntity);
    console.log('Company changed to:', newLegalEntity);

    // Refresh leaves data with new company
    fetchPayPeriods(newLegalEntity);
  };

  useEffect(() => {
    const headerOptions = MainPageHeader({
      onToggleDrawer: toggleDrawer,
      onTitle: 'Salary Slip',
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

  const fetchPayPeriods = async defaultCompany => {
    setLoading(true);
    try {
      const data = await PayGroupPayperiodByEmployeeId({
        employeeId: userData.employeeId,
        defaultCompany: defaultCompany,
      });
      setPayPeriods(
        data.map(item => ({
          label: item.PayPeriodCode.toString(),
          value: item.PayPeriodCode.toString(),
        })),
      );
    } catch (error) {
      console.error('Failed to fetch pay periods:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => setSelectedPayPeriod('');

  const sendSalarySlip = async () => {
    if (!selectedPayPeriod) {
      showMessage('Please select a pay period before proceeding.');
      return;
    }

    setLoading(true);
    try {
      const response = await PREmailSalarySlip({
        payPeriodCode: selectedPayPeriod,
        employeeId: userData.employeeId,
        dataAreaId: companyToUse,
      });
      showMessage(
        response === 'Email sent Successfully'
          ? 'Your salary slip has been emailed.'
          : 'Something went wrong.',
      );
    } catch (error) {
      console.error('Error sending salary slip:', error);
      showMessage('There was an error sending the salary slip.');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = message => {
    setDialogMessage(message);
    setDialogVisible(true);
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleRefresh = () => {
    fetchPayPeriods(companyToUse);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Icon name="file-pdf-o" size={50} color="orange" style={styles.icon} />
        <Text style={styles.screenTitle}>Email Salary Slip</Text>
        <Text style={styles.screenSubtitle}>
          Please select a pay period below to email your salary slip.
        </Text>
        <Text style={styles.fieldsHeading}>Select Pay Period</Text>
        <Dropdown
          style={styles.dropdown}
          data={payPeriods}
          itemTextStyle={styles.itemText}
          labelField="label"
          valueField="value"
          placeholder="Select Pay Period"
          value={selectedPayPeriod}
          onChange={item => setSelectedPayPeriod(item.value)}
          placeholderStyle={styles.dropdownPlaceholder}
          selectedTextStyle={styles.dropdownSelected}
        />
        {loading ? (
          <ActivityIndicator size="large" color="orange" />
        ) : (
          // <CustomIndicator />
          <LinearGradient colors={['orange', 'orange']} style={styles.button}>
            <TouchableOpacity
              onPress={sendSalarySlip}
              style={styles.buttonContent}>
              <Text style={styles.buttonText}>Email Salary Slip</Text>
            </TouchableOpacity>
          </LinearGradient>
        )}

        <Modal
          isVisible={dialogVisible}
          onBackdropPress={() => setDialogVisible(false)}>
          <View style={styles.dialogContainer}>
            <Text style={styles.dialogMessage}>{dialogMessage}</Text>
            <TouchableOpacity
              style={styles.dialogButton}
              onPress={() => setDialogVisible(false)}>
              <Text style={styles.dialogButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </ScrollView>

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
    backgroundColor: '#f7f7f7',
  },
  scrollContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerLeftButton: {
    width: wp(10),
    height: hp(6),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: width * 0.03,
  },
  headerRightButton: {
    width: wp(10),
    alignItems: 'center',
    height: hp(6),
    justifyContent: 'center',
    marginRight: width * 0.03,
  },
  icon: {marginBottom: 20},
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  screenSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  fieldsHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  dropdown: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 20,
    width: '100%',
  },
  itemText: {color: '#000'},
  dropdownPlaceholder: {color: '#999'},
  dropdownSelected: {color: '#000'},
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 25,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonContent: {justifyContent: 'center', alignItems: 'center'},
  buttonText: {color: '#FFFFFF', fontSize: 16, fontWeight: 'bold'},
  dialogContainer: {
    borderRadius: 10,
    padding: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  dialogMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  dialogButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  dialogButtonText: {color: '#fff', fontSize: 16, fontWeight: 'bold'},
  rightSideView: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: wp(3), // Adjusted margin
  },
  leftSide: {
    width: wp(9),
    alignItems: 'center',
    height: hp(6),
    justifyContent: 'center',
    marginRight: 9,
    marginLeft: 5,
  },
  headerImage: {
    width: 100,
    height: 40,
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
});

export default PRSalarySlip;
