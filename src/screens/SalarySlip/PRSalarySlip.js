/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState} from 'react';
import {
  View,
  Text,
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

import {PayGroupPayperiodByEmployeeId} from '../../API/SalarySlip/PayGroupPayperiodByEmployeeId';
import {PREmailSalarySlip} from '../../API/SalarySlip/PREmailSalarySlip';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import {AlertModal} from '../../components/Alert/AlertModal';
import {styles} from '../../styles/styles';

const PRSalarySlip = () => {
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false); // New state for email sending
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

  useFocusEffect(
    React.useCallback(() => {
      resetForm();
      fetchPayPeriods();
    }, []),
  );

  const fetchPayPeriods = async () => {
    setLoading(true);
    // Reset form when starting to fetch
    resetForm();

    try {
      const data = await PayGroupPayperiodByEmployeeId({
        employeeId: userData.employeeId,
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

    // Prevent multiple clicks
    if (sendingEmail) {
      return;
    }

    setSendingEmail(true);

    try {
      const response = await PREmailSalarySlip({
        payPeriodCode: selectedPayPeriod,
        employeeId: userData.employeeId,
      });

      console.log('Send Salary Slip by Email', response);

      // Show the actual response message from API
      if (response === 'Email sent Successfully') {
        showMessage(
          'Success',
          'Your salary slip has been emailed successfully.',
        );
        // Reset form after successful email
        resetForm();
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
      setSendingEmail(false);
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
    fetchPayPeriods();
  };

  // Show loading or content based on states
  const isProcessing = loading || sendingEmail;

  return (
    <ActionPaneContainer
      pageTitle="Salary Slip"
      isBackButton={false}
      showFooter={!isProcessing} // Hide footer when processing
      showFloatingButton={false}
      isHeaderActive={true}
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}>
      {/* Main content */}
      {isProcessing ? (
        <CustomIndicator />
      ) : (
        <View style={styles.SSlip_Container}>
          <ScrollView
            contentContainerStyle={styles.SSlip_ScrollContent}
            showsVerticalScrollIndicator={false}>
            <Icon
              name="file-pdf-o"
              size={50}
              color="#0A66C2"
              style={styles.SSlip_Icon}
            />
            <Text style={styles.SSlip_ScreenTitle}>Email Salary Slip</Text>
            <Text style={styles.SSlip_ScreenSubtitle}>
              Please select a pay period below to email your salary slip.
            </Text>
            <Text style={styles.SSlip_FieldsHeading}>Select Pay Period</Text>
            <Dropdown
              style={styles.SSlip_Dropdown}
              data={payPeriods}
              itemTextStyle={styles.SSlip_ItemText}
              labelField="label"
              valueField="value"
              placeholder="Select Pay Period"
              value={selectedPayPeriod}
              onChange={item => setSelectedPayPeriod(item.value)}
              placeholderStyle={styles.SSlip_DropdownPlaceholder}
              selectedTextStyle={styles.SSlip_DropdownSelected}
            />

            <LinearGradient
              colors={['#0A66C2', '#0A66C2']}
              style={[styles.SSlip_Button, sendingEmail && {opacity: 0.6}]}>
              <TouchableOpacity
                onPress={sendSalarySlip}
                style={styles.SSlip_ButtonContent}
                activeOpacity={0.7}
                disabled={sendingEmail}>
                {sendingEmail ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.SSlip_ButtonText}>Email Salary Slip</Text>
                )}
              </TouchableOpacity>
            </LinearGradient>

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

export default PRSalarySlip;
