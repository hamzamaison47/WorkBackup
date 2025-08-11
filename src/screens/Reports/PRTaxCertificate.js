/* eslint-disable react-native/no-inline-styles */
import React, {useState, useCallback} from 'react';
import {View, Text, TouchableOpacity, ScrollView} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';

import {PREmailTaxCertificate} from '../../API/TaxCertificate/TaxCertificate';

import {styles} from '../../styles/styles';
import CalendarModal from '../../components/Leaves/CalendarModal';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import {AlertModal} from '../../components/Alert/AlertModal';

const PRTaxCertificate = () => {
  const navigation = useNavigation();
  const {userData} = useSelector(state => state.user);

  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertHeading, setAlertHeading] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [showFooter, setShowFooter] = useState(true);

  const [formData, setFormData] = useState({
    leaveStartDate: '',
    leaveEndDate: '',
  });

  // Reset form when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setFormData({
        leaveStartDate: '',
        leaveEndDate: '',
      });
    }, []),
  );

  const formatDate = date =>
    date
      ? new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
      : '';

  const formatToISOWithTime = date => {
    const baseDate = new Date(date);
    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, '0');
    const day = String(baseDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T12:00:00`;
  };

  const onPressButton = async () => {
    if (!formData.leaveStartDate || !formData.leaveEndDate) {
      showMessage('Error', 'Please select both start and end dates.');
      return;
    }
    setShowFooter(false);
    setLoading(true);
    await sendTaxCertificate(
      userData?.employeeId,
      formData.leaveStartDate,
      formData.leaveEndDate,
    );
  };

  const sendTaxCertificate = async (employeeId, startDate, endDate) => {
    try {
      await PREmailTaxCertificate({
        employeeId: employeeId || userData?.employeeId || '',
        startDate: startDate,
        endDate: endDate,
      });
      showMessage(
        'Success',
        'Your Tax Certificate has been successfully emailed.',
      );
    } catch (error) {
      console.error(error);
      showMessage('Error', 'There was an error sending the Tax Certificate.');
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
    setShowFooter(true);
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleRefresh = () => {
    setLoading(true);
    setFormData(prev => ({
      ...prev,
      leaveStartDate: '',
      leaveEndDate: '',
    }));

    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  const handleStartDateChange = date => {
    const formattedDate = formatToISOWithTime(date);
    setFormData(prev => ({
      ...prev,
      leaveStartDate: formattedDate,
    }));
    setShowStartCalendar(false);
  };

  const handleEndDateChange = date => {
    const formattedDate = formatToISOWithTime(date);
    setFormData(prev => ({
      ...prev,
      leaveEndDate: formattedDate,
    }));
    setShowEndCalendar(false);
  };

  return (
    <ActionPaneContainer
      pageTitle="Tax Certificate"
      isBackButton={false}
      showFooter={showFooter}
      showFloatingButton={false}
      isHeaderActive={true}
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}>
      {loading ? (
        <CustomIndicator />
      ) : (
        <View style={styles.TaxCertificateContainer}>
          <ScrollView
            contentContainerStyle={styles.TaxCertificateScrollContent}
            showsVerticalScrollIndicator={false}>
            <Icon
              name="file-pdf-o"
              size={50}
              color="#0A66C2"
              style={styles.TaxCertificateIcon}
            />
            <Text style={styles.TaxCertificateScreenTitle}>
              Email Tax Certificate
            </Text>
            <Text style={styles.TaxCertificateScreenSubtitle}>
              Please select a From Date and To Date to email your Tax
              Certificate.
            </Text>

            <Text style={styles.TaxCertificateLabel}>From Date</Text>
            <TouchableOpacity
              style={styles.TaxCertificateDateSelector}
              onPress={() => setShowStartCalendar(true)}>
              <View style={{flex: 1}}>
                <Text style={styles.TaxCertificateDateText}>
                  {formData.leaveStartDate
                    ? formatDate(formData.leaveStartDate)
                    : 'Select From Date'}
                </Text>
              </View>
              <Icon name="calendar" size={20} color="#0A66C2" />
            </TouchableOpacity>
            <CalendarModal
              visible={showStartCalendar}
              current={formData.leaveStartDate}
              onDateSelected={handleStartDateChange}
              onClose={() => setShowStartCalendar(false)}
            />

            <Text style={styles.TaxCertificateLabel}>To Date</Text>
            <TouchableOpacity
              style={styles.TaxCertificateDateSelector}
              onPress={() => setShowEndCalendar(true)}>
              <View style={{flex: 1}}>
                <Text style={styles.TaxCertificateDateText}>
                  {formData.leaveEndDate
                    ? formatDate(formData.leaveEndDate)
                    : 'Select To Date'}
                </Text>
              </View>
              <Icon name="calendar" size={20} color="#0A66C2" />
            </TouchableOpacity>
            <CalendarModal
              visible={showEndCalendar}
              current={formData.leaveEndDate}
              onDateSelected={handleEndDateChange}
              onClose={() => setShowEndCalendar(false)}
            />

            <LinearGradient
              colors={['#0A66C2', '#0A66C2']}
              style={styles.TaxCertificateButton}>
              <TouchableOpacity
                onPress={onPressButton}
                style={styles.TaxCertificateButtonContent}
                activeOpacity={0.7}
                disabled={loading}>
                <Text style={styles.TaxCertificateButtonText}>
                  Email Tax Certificate
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </ScrollView>

          <AlertModal
            visible={alertVisible}
            heading={alertHeading}
            text={alertMessage}
            onPress={handleAlertClose}
          />
        </View>
      )}
    </ActionPaneContainer>
  );
};

export default PRTaxCertificate;
