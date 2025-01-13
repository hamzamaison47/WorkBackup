/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
import React, {useState, useContext, useEffect} from 'react';
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
import {UserContext} from '../../context/UserContext';
import Icon from 'react-native-vector-icons/FontAwesome';
import {PayGroupPayperiodByEmployeeId} from '../../API/PayGroupPayPeriod/PayGroupPayperiodByEmployeeId';
import {hp, wp} from '../../constants/Size';
import LinearGradient from 'react-native-linear-gradient';
import logo from '../../assets/cloud.png';

const {height, width} = Dimensions.get('window');

const PRSalarySlip = () => {
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [payPeriods, setPayPeriods] = useState([]);
  const [selectedPayPeriod, setSelectedPayPeriod] = useState('');
  const {colors} = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const {employeeId} = route.params || {};
  const {userData} = useContext(UserContext);

  useFocusEffect(
    React.useCallback(() => {
      resetForm();
      fetchPayPeriods();
    }, []),
  );

  useEffect(() => {
    navigationSettings();
  }, []);

  const fetchPayPeriods = async () => {
    setLoading(true);
    try {
      const data = await PayGroupPayperiodByEmployeeId({
        employeeId: userData.employeeId,
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

  const navigationSettings = () => {
    navigation.setOptions({
      headerTitle: () => {
        '';
      },
      headerLeft: () => (
        <View style={styles.rightSideView}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.leftSide}>
            <Icon name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Image source={logo} style={styles.headerImage} />
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={fetchPayPeriods}
          style={styles.headerRightButton}>
          <Icon name="refresh" size={24} color="white" />
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: '#FFA500',
        height: Platform.OS === 'ios' ? height * 0.13 : height * 0.09,
      },
      headerTintColor: '#fff',
      headerTitleAlign: 'center',
      headerTitleStyle: {
        fontSize: hp(2.3),
        color: 'white',
      },
    });
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f7f7f7',
  },
  scrollContent: {alignItems: 'center', paddingVertical: 20},
  headerLeftButton: {
    width: wp(10),
    alignItems: 'center',
    height: hp(6),
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
});

export default PRSalarySlip;
