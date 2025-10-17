// /* eslint-disable react-native/no-inline-styles */
// import React, {useState, useCallback} from 'react';
// import {View, Text, TouchableOpacity, ScrollView} from 'react-native';
// import {useNavigation, useFocusEffect} from '@react-navigation/native';
// import {useSelector} from 'react-redux';
// import LinearGradient from 'react-native-linear-gradient';
// import Icon from 'react-native-vector-icons/FontAwesome';

// import {PREmailTaxCertificate} from '../../API/TaxCertificate/TaxCertificate';
// import {PayGroupPayperiodByEmployeeId} from '../../API/PayGroupPayPeriod/PayGroupPayperiodByEmployeeId';

// import styles from '../../styles/styles';
// import CalendarModal from '../../components/Leaves/CalendarModal';
// import ActionPaneContainer from '../../components/ActionPaneContainer';
// import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
// import AlertModal from '../../components/Alert/AlertModal';

// const PRTaxCertificate = () => {
//   const navigation = useNavigation();
//   const {userData} = useSelector(state => state.user);

//   const [loading, setLoading] = useState(false);
//   const [alertVisible, setAlertVisible] = useState(false);
//   const [alertHeading, setAlertHeading] = useState('');
//   const [alertMessage, setAlertMessage] = useState('');
//   const [showStartCalendar, setShowStartCalendar] = useState(false);
//   const [showEndCalendar, setShowEndCalendar] = useState(false);
//   const [showFooter, setShowFooter] = useState(true);

//   const [formData, setFormData] = useState({
//     leaveStartDate: '',
//     leaveEndDate: '',
//   });

//   // Reset form when screen comes into focus
//   useFocusEffect(
//     useCallback(() => {
//       setFormData({
//         leaveStartDate: '',
//         leaveEndDate: '',
//       });
//     }, []),
//   );

//   const formatDate = date =>
//     date
//       ? new Date(date).toLocaleDateString('en-US', {
//           year: 'numeric',
//           month: '2-digit',
//           day: '2-digit',
//         })
//       : '';

//   const formatToISOWithTime = date => {
//     const baseDate = new Date(date);
//     const year = baseDate.getFullYear();
//     const month = String(baseDate.getMonth() + 1).padStart(2, '0');
//     const day = String(baseDate.getDate()).padStart(2, '0');
//     return `${year}-${month}-${day}T12:00:00`;
//   };

//   const onPressButton = async () => {
//     if (!formData.leaveStartDate || !formData.leaveEndDate) {
//       showMessage('Error', 'Please select both start and end dates.');
//       return;
//     }
//     setShowFooter(false);
//     setLoading(true);
//     await sendTaxCertificate(
//       userData?.employeeId,
//       formData.leaveStartDate,
//       formData.leaveEndDate,
//     );
//   };

//   const sendTaxCertificate = async (employeeId, startDate, endDate) => {
//     try {
//       await PREmailTaxCertificate({
//         employeeId: employeeId || userData?.employeeId || '',
//         startDate: startDate,
//         endDate: endDate,
//       });
//       showMessage(
//         'Success',
//         'Your Tax Certificate has been successfully emailed.',
//       );
//     } catch (error) {
//       console.error(error);
//       showMessage('Error', 'There was an error sending the Tax Certificate.');
//     } finally {
//       setFormData({
//         leaveStartDate: '',
//         leaveEndDate: '',
//       });

//       setLoading(false);
//     }
//   };

//   const showMessage = (heading, message) => {
//     setAlertHeading(heading);
//     setAlertMessage(message);
//     setAlertVisible(true);
//   };

//   const handleAlertClose = () => {
//     setAlertVisible(false);
//     setAlertHeading('');
//     setAlertMessage('');
//     setShowFooter(true);
//   };

//   const handleGoBack = () => {
//     navigation.goBack();
//   };

//   const handleRefresh = () => {
//     setLoading(true);
//     setFormData(prev => ({
//       ...prev,
//       leaveStartDate: '',
//       leaveEndDate: '',
//     }));

//     setTimeout(() => {
//       setLoading(false);
//     }, 1500);
//   };

//   const handleStartDateChange = date => {
//     if (formData.leaveEndDate) {
//       const newStartDate = new Date(date);
//       const endDate = new Date(formData.leaveEndDate);

//       if (newStartDate >= endDate) {
//         showMessage('Error', 'Start date must be earlier than end date.');
//         return;
//       }
//     }

//     const formattedDate = formatToISOWithTime(date);
//     setFormData(prev => ({
//       ...prev,
//       leaveStartDate: formattedDate,
//     }));
//     setShowStartCalendar(false);
//   };

//   const handleEndDateChange = date => {
//     if (formData.leaveStartDate) {
//       const newEndDate = new Date(date);
//       const startDate = new Date(formData.leaveStartDate);

//       if (newEndDate <= startDate) {
//         showMessage('Error', 'End date must be later than start date.');
//         return; // stop here, don't set the end date
//       }
//     }

//     const formattedDate = formatToISOWithTime(date);
//     setFormData(prev => ({
//       ...prev,
//       leaveEndDate: formattedDate,
//     }));
//     setShowEndCalendar(false);
//   };

//   return (
//     <ActionPaneContainer
//       pageTitle="Tax Certificate"
//       isBackButton={false}
//       showFooter={showFooter}
//       showFloatingButton={false}
//       isHeaderActive={true}
//       onBackPress={handleGoBack}
//       onRefresh={handleRefresh}>
//       {loading ? (
//         <CustomIndicator />
//       ) : (
//         <View style={styles.TCert_Container}>
//           <ScrollView
//             contentContainerStyle={styles.TCert_ScrollContent}
//             showsVerticalScrollIndicator={false}>
//             <Icon
//               name="file-pdf-o"
//               size={50}
//               color="#0A66C2"
//               style={styles.TCert_Icon}
//             />
//             <Text style={styles.TCert_ScreenTitle}>Email Tax Certificate</Text>
//             <Text style={styles.TCert_ScreenSubtitle}>
//               Please select a From Date and To Date to email your Tax
//               Certificate.
//             </Text>

//             <Text style={styles.TCert_Label}>From Date</Text>
//             <TouchableOpacity
//               style={styles.TCert_DateSelector}
//               onPress={() => setShowStartCalendar(true)}>
//               <View style={{flex: 1}}>
//                 <Text style={styles.TCert_DateText}>
//                   {formData.leaveStartDate
//                     ? formatDate(formData.leaveStartDate)
//                     : 'Select From Date'}
//                 </Text>
//               </View>
//               <Icon name="calendar" size={20} color="#0A66C2" />
//             </TouchableOpacity>
//             <CalendarModal
//               visible={showStartCalendar}
//               current={formData.leaveStartDate}
//               onDateSelected={handleStartDateChange}
//               onClose={() => setShowStartCalendar(false)}
//             />

//             <Text style={styles.TCert_Label}>To Date</Text>
//             <TouchableOpacity
//               style={styles.TCert_DateSelector}
//               onPress={() => setShowEndCalendar(true)}>
//               <View style={{flex: 1}}>
//                 <Text style={styles.TCert_DateText}>
//                   {formData.leaveEndDate
//                     ? formatDate(formData.leaveEndDate)
//                     : 'Select To Date'}
//                 </Text>
//               </View>
//               <Icon name="calendar" size={20} color="#0A66C2" />
//             </TouchableOpacity>
//             <CalendarModal
//               visible={showEndCalendar}
//               current={formData.leaveEndDate}
//               onDateSelected={handleEndDateChange}
//               onClose={() => setShowEndCalendar(false)}
//             />

//             <TouchableOpacity
//               onPress={onPressButton}
//               style={styles.TCert_Button}
//               activeOpacity={0.7}
//               disabled={loading}>
//               <LinearGradient
//                 colors={['#0A66C2', '#0A66C2']}
//                 style={styles.TCert_ButtonContent}>
//                 <Text style={styles.TCert_ButtonText}>
//                   Email Tax Certificate
//                 </Text>
//               </LinearGradient>
//             </TouchableOpacity>
//           </ScrollView>

//           <AlertModal
//             visible={alertVisible}
//             heading={alertHeading}
//             text={alertMessage}
//             onPress={handleAlertClose}
//           />
//         </View>
//       )}
//     </ActionPaneContainer>
//   );
// };

// export default PRTaxCertificate;

////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////

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

import styles from '../../styles/styles';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import AlertModal from '../../components/Alert/AlertModal';

const PRTaxCertificate = () => {
  const navigation = useNavigation();
  const {userData} = useSelector(state => state.user);

  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertHeading, setAlertHeading] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [payPeriods, setPayPeriods] = useState([]);
  const [selectedPayPeriod, setSelectedPayPeriod] = useState('');

  // Reset form when screen comes into focus
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

      console.log('Fetching Pay Periods for Tax Certificate', data);

      if (data && data.length > 0) {
        setPayPeriods(
          data.map(item => ({
            label: item.PayPeriodCode.toString(),
            value: item.PayPeriodCode.toString(),
            startDate: item.StartDate,
            endDate: item.EndDate,
          })),
        );
      } else {
        setPayPeriods([]);
        showMessage('Info', 'No pay periods found for the selected company.');
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
    setSelectedPayPeriod('');
  };

  const sendTaxCertificate = async () => {
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
      const selectedPeriod = payPeriods.find(
        period => period.value === selectedPayPeriod,
      );

      if (!selectedPeriod) {
        showMessage('Error', 'Selected pay period not found.');
        return;
      }

      const response = await PREmailTaxCertificate({
        employeeId: userData.employeeId,
        startDate: selectedPeriod.startDate,
        endDate: selectedPeriod.endDate,
      });

      console.log('Send Tax Certificate by Email', response);

      // Show the actual response message from API
      if (response === 'Email sent Successfully') {
        showMessage(
          'Success',
          'Your tax certificate has been emailed successfully.',
        );
        // Reset form after successful email
        resetForm();
      } else {
        // Show the actual response from API if it's not the success message
        showMessage('Info', response?.data?.message || 'Something went wrong.');
      }
    } catch (error) {
      console.error('Error sending tax certificate:', error);

      // Show more detailed error message if available
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

  // Show loading or content based on states
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
              color="#0A66C2"
              style={styles.TCert_Icon}
            />
            <Text style={styles.TCert_ScreenTitle}>Email Tax Certificate</Text>
            <Text style={styles.TCert_ScreenSubtitle}>
              Please select a pay period below to email your tax certificate.
            </Text>

            <Text style={styles.TCert_Label}>Select Pay Period</Text>
            <Dropdown
              style={styles.TCert_Dropdown}
              data={payPeriods}
              itemTextStyle={styles.TCert_ItemText}
              labelField="label"
              valueField="value"
              placeholder="Select Pay Period"
              value={selectedPayPeriod}
              onChange={item => setSelectedPayPeriod(item.value)}
              placeholderStyle={styles.TCert_DropdownPlaceholder}
              selectedTextStyle={styles.TCert_DropdownSelected}
            />

            <TouchableOpacity
              onPress={sendTaxCertificate}
              style={[styles.TCert_Button, sendingEmail && {opacity: 0.6}]}
              activeOpacity={0.7}
              disabled={sendingEmail}>
              <LinearGradient
                colors={['#0A66C2', '#0A66C2']}
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
