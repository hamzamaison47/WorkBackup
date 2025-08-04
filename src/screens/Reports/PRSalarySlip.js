/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import {Dropdown} from 'react-native-element-dropdown';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/FontAwesome';

import {PREmailSalarySlip} from '../../API/SalarySlip/PREmailSalarySlip';
import {PayGroupPayperiodByEmployeeId} from '../../API/SalarySlip/PayGroupPayperiodByEmployeeId';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';

const {height, width} = Dimensions.get('window');

const PRSalarySlip = () => {
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [payPeriods, setPayPeriods] = useState([]);
  const [selectedPayPeriod, setSelectedPayPeriod] = useState('');

  const navigation = useNavigation();

  // If you want to see your team salary slip then use routs
  // const route = useRoute();
  // const {employeeId} = route.params || {};

  const {userData} = useSelector(state => state.user);
  const {selectedLegalEntity, defaultLegalEntity} = useSelector(
    state => state.company,
  );
  const companyToUse = selectedLegalEntity || defaultLegalEntity;

  useFocusEffect(
    React.useCallback(() => {
      resetForm();
      fetchPayPeriods(companyToUse);
    }, [companyToUse]),
  );

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
    <ActionPaneContainer
      pageTitle="Salary Slip"
      isBackButton={false}
      showFooter={true}
      showFloatingButton={false}
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}>
      {/* Main content */}
      {loading ? (
        <CustomIndicator />
      ) : (
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <Icon
              name="file-pdf-o"
              size={50}
              color="orange"
              style={styles.icon}
            />
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
              <LinearGradient
                colors={['orange', 'orange']}
                style={styles.button}>
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
      )}
    </ActionPaneContainer>
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
    padding: width * 0.05,
  },
  icon: {
    marginBottom: height * 0.03,
  },
  screenTitle: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: height * 0.01,
  },
  screenSubtitle: {
    fontSize: width * 0.04,
    color: '#666',
    textAlign: 'center',
    marginBottom: height * 0.025,
  },
  fieldsHeading: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: height * 0.015,
  },
  dropdown: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.03,
    backgroundColor: '#fff',
    marginBottom: height * 0.025,
    width: '100%',
  },
  itemText: {
    color: '#000',
    fontSize: width * 0.04,
  },
  dropdownPlaceholder: {
    color: '#999',
    fontSize: width * 0.04,
  },
  dropdownSelected: {
    color: '#000',
    fontSize: width * 0.04,
  },
  button: {
    borderRadius: 8,
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.05,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: height * 0.025,
    width: '100%',
  },
  buttonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: width * 0.045,
    fontWeight: 'bold',
  },
  dialogContainer: {
    borderRadius: 10,
    padding: width * 0.05,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  dialogMessage: {
    fontSize: width * 0.045,
    color: '#333',
    textAlign: 'center',
    marginBottom: height * 0.025,
  },
  dialogButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 5,
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.05,
  },
  dialogButtonText: {
    color: '#fff',
    fontSize: width * 0.045,
    fontWeight: 'bold',
  },
});

export default PRSalarySlip;
