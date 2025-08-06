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
import Icon from 'react-native-vector-icons/FontAwesome';

import {PREmailSalarySlip} from '../../API/SalarySlip/PREmailSalarySlip';
import {PayGroupPayperiodByEmployeeId} from '../../API/SalarySlip/PayGroupPayperiodByEmployeeId';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import {AlertModal} from '../../components/Alert/AlertModal';

const {height, width} = Dimensions.get('window');

const PRSalarySlip = () => {
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertHeading, setAlertHeading] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
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
    // Reset form when starting to fetch
    resetForm();

    try {
      const data = await PayGroupPayperiodByEmployeeId({
        employeeId: userData.employeeId,
        defaultCompany: defaultCompany,
      });

      console.log('Fetching Pay Periods', data);

      if (data && data.length > 0) {
        setPayPeriods(
          data.map(item => ({
            label: item.PayPeriodCode.toString(),
            value: item.PayPeriodCode.toString(),
          })),
        );
      } else {
        setPayPeriods([]);
        showMessage('Info', 'No pay periods found for the selected company.');
      }
    } catch (error) {
      console.error('Failed to fetch pay periods:', error);
      setPayPeriods([]);
      showMessage('Error', 'Failed to fetch pay periods. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedPayPeriod('');
  };

  const sendSalarySlip = async () => {
    if (!selectedPayPeriod) {
      showMessage('Warning', 'Please select a pay period before proceeding.');
      return;
    }

    setLoading(true);
    resetForm();

    try {
      const response = await PREmailSalarySlip({
        payPeriodCode: selectedPayPeriod,
        employeeId: userData.employeeId,
        dataAreaId: companyToUse,
      });

      console.log('Send Salary Slip by Email', response);

      // Show the actual response message from API
      if (response === 'Email sent Successfully') {
        showMessage(
          'Success',
          'Your salary slip has been emailed successfully.',
        );
      } else {
        // Show the actual response from API if it's not the success message
        showMessage('Info', response?.data?.message || 'Something went wrong.');
      }
    } catch (error) {
      console.error('Error sending salary slip:', error);

      // Show more detailed error message if available
      const errorMessage = error?.message || error?.response?.data?.message;
      showMessage(
        'Error',
        `There was an error sending the salary slip.\n${errorMessage}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (heading, message) => {
    setAlertHeading(heading);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleAlertClose = () => {
    setAlertVisible(false);
    setAlertHeading('');
    setAlertMessage('');
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
      isHeaderActive={true}
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
              color="#0A66C2"
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
              <ActivityIndicator size="large" color="#0A66C2" />
            ) : (
              <LinearGradient
                colors={['#0A66C2', '#0A66C2']}
                style={styles.button}>
                <TouchableOpacity
                  onPress={sendSalarySlip}
                  style={styles.buttonContent}
                  activeOpacity={0.7}
                  disabled={loading}>
                  <Text style={styles.buttonText}>Email Salary Slip</Text>
                </TouchableOpacity>
              </LinearGradient>
            )}

            {/* Custom Alert Modal */}
            <AlertModal
              visible={alertVisible}
              heading={alertHeading}
              text={alertMessage}
              onPress={handleAlertClose}
            />
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
    marginTop: width * 0.1,
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
});

export default PRSalarySlip;
