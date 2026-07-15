/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import {Dropdown} from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/FontAwesome';

import {PREmailTaxCertificate} from '../../API/TaxCertificate/TaxCertificate';
import {PayGroupPayperiodByEmployeeId} from '../../API/PayGroupPayPeriod/PayGroupPayperiodByEmployeeId';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import AlertModal from '../../components/Alert/AlertModal';
import styles from '../../styles/styles';
import usePallete from '../../hooks/usePalette';

const PRTaxCertificate = () => {
  const navigation = useNavigation();
  const {userData} = useSelector(state => state.user);
  const P = usePallete();

  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertHeading, setAlertHeading] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [payPeriods, setPayPeriods] = useState([]);
  const [selectedPayPeriodYear, setSelectedPayPeriodYear] = useState('');

  useFocusEffect(
    useCallback(() => {
      resetForm();
      fetchPayPeriods();
    }, []),
  );

  const fetchPayPeriods = async () => {
    setLoading(true);
    resetForm();

    try {
      const data = await PayGroupPayperiodByEmployeeId({
        employeeId: userData.employeeId,
      });

      if (data && data.length > 0) {
        const uniqueYears = [...new Set(data.map(item => item.PayPeriodYear))];

        const validYears = uniqueYears
          .filter(year => year != null && year !== '')
          .sort((a, b) => b - a);

        if (validYears.length > 0) {
          setPayPeriods(
            validYears.map(year => ({
              label: year.toString(),
              value: year.toString(),
            })),
          );
        } else {
          setPayPeriods([]);
          showMessage(
            'Info',
            'No tax certificate record found for the selected company.',
          );
          navigation.goBack();
        }
      } else {
        setPayPeriods([]);
        showMessage(
          'Info',
          'No tax certificate record found for the selected company.',
        );
        navigation.goBack();
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
    setSelectedPayPeriodYear('');
    setSendingEmail(false);
  };

  const sendTaxCertificate = async () => {
    if (!selectedPayPeriodYear) {
      showMessage(
        'Warning',
        'Please select a pay period year before proceeding.',
      );
      return;
    }

    if (sendingEmail) {
      return;
    }

    setSendingEmail(true);

    try {
      const response = await PREmailTaxCertificate({
        PRPayPeriodYear: selectedPayPeriodYear,
        employeeId: userData.employeeId,
      });

      if (response === 'Email sent Successfully') {
        showMessage(
          'Success',
          'Your tax certificate has been emailed successfully.',
        );
        resetForm();
      } else {
        showMessage('Info', response?.data?.message || 'Something went wrong.');
      }
    } catch (error) {
      console.error('Error sending tax certificate:', error);

      const errorMessage = error?.message || error?.response?.data?.message;
      showMessage(
        'Error',
        `There was an error sending the tax certificate.\n${errorMessage}`,
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

  const isProcessing = loading || sendingEmail;

  return (
    <ActionPaneContainer
      pageTitle="Tax Certificate"
      isBackButton={false}
      showFooter={!isProcessing}
      showFloatingButton={false}
      isHeaderActive={true}
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}>
      {/* Main content */}
      {isProcessing ? (
        <CustomIndicator />
      ) : (
        <View style={styles.TCert_Container}>
          <ScrollView
            contentContainerStyle={styles.TCert_ScrollContent}
            showsVerticalScrollIndicator={false}>
            <Icon
              name="file-pdf-o"
              size={50}
              color={P.primary}
              style={styles.TCert_Icon}
            />
            <Text style={styles.TCert_ScreenTitle}>Email Tax Certificate</Text>
            <Text style={styles.TCert_ScreenSubtitle}>
              Please select a pay period year below to email your tax
              certificate.
            </Text>
            <Text style={styles.TCert_Label}>Select Pay Period Year</Text>
            <Dropdown
              style={styles.TCert_Dropdown}
              data={payPeriods}
              itemTextStyle={styles.TCert_ItemText}
              labelField="label"
              valueField="value"
              placeholder="Select Pay Period Year"
              value={selectedPayPeriodYear}
              onChange={item => setSelectedPayPeriodYear(item.value)}
              placeholderStyle={styles.TCert_DropdownPlaceholder}
              selectedTextStyle={styles.TCert_DropdownSelected}
            />

            <TouchableOpacity
              onPress={sendTaxCertificate}
              style={[styles.TCert_Button, sendingEmail && {opacity: 0.6}]}
              activeOpacity={0.7}
              disabled={sendingEmail}>
              <LinearGradient
                colors={[P.primary, P.primary]}
                style={styles.TCert_ButtonContent}>
                {sendingEmail ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.TCert_ButtonText}>
                    Email Tax Certificate
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

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

export default PRTaxCertificate;
