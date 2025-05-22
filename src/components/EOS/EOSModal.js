/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
} from 'react-native';
import {Dropdown} from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/FontAwesome';

import {NoticePeriodCode} from '../../API/EOS/NoticePeriodCode';
import {ResonCode} from '../../API/EOS/ResonCode';
import {WorkerDetails} from '../../API/EOS/WorkerDetails';
import {RetriveEmployeeReportees} from '../../API/EOS/RetriveEmployeeReportees';

import {AlertModal} from '../Leaves/AlertModal';
import CalendarModal from '../Leaves/CalendarModal';

const EOSModal = ({visible, onClose, mode, onAction, serviceData = {}}) => {
  const [lastWorkingDatePlanned, setLastWorkingDatePlanned] = useState('');
  const [reasonOptions, setReasonOptions] = useState([]);
  const [hiringDateOptions, setHiringDateOptions] = useState('');
  const [activePayperiod, setactivePayperiod] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');
  const [currentField, setCurrentField] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const [formData, setFormData] = useState({
    recId: serviceData?.recId,
    employeeId: serviceData?.employeeId,
    employeeName: serviceData?.employeeName,
    EOSType: serviceData?.EOSType || 0,
    NoticePeriodCode: '',
    EOSReasonCode: serviceData?.EOSReasonCode || '',
    EOSNotificationDate: serviceData?.EOSNotificationDate || '',
    LastWorkingDate_Calculated: serviceData?.LastWorkingDate_Calculated || '',
    LastWorkingDate_Actual: serviceData?.LastWorkingDate_Actual || '',
    Remarks: serviceData?.Remarks || '',
  });

  // Sync with serviceData on changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...serviceData,
    }));
  }, [serviceData]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (formData.employeeId) {
          const todayString = new Date().toISOString().split('T')[0];
          const formattedLastWorkingDateActual = `${todayString}T12:00:00`;

          const [noticePeriodCodes, reasonCodes, hiringData, reportees] =
            await Promise.all([
              NoticePeriodCode(),
              ResonCode(),
              WorkerDetails({
                employeeId: formData.employeeId,
                lastWorkingDateActual: formattedLastWorkingDateActual,
              }),
              RetriveEmployeeReportees({employeeId: formData.employeeId}),
            ]);

          const filteredNoticeCodes = noticePeriodCodes
            .filter(item => item.EOSType === formData.EOSType)
            .map(item => ({
              label: item.NoticePeriodCode,
              value: item.NoticePeriodCode,
              intervalType: item.IntervalType,
              period: item.Period,
            }));

          if (filteredNoticeCodes.length > 0) {
            const firstNoticePeriodCode = filteredNoticeCodes[0].value;
            setFormData(prev => ({
              ...prev,
              NoticePeriodCode: firstNoticePeriodCode,
            }));

            const calculatedDate = calculateLastWorkingDate(
              new Date().toISOString().split('T')[0],
              filteredNoticeCodes[0].intervalType,
              filteredNoticeCodes[0].period,
            );

            setLastWorkingDatePlanned(formatDate(calculatedDate));

            const joiningDate = new Date(hiringData.JoiningDate)
              .toISOString()
              .split('T')[0];
            setHiringDateOptions(joiningDate);

            // Calculate initial service duration
            calculateServiceDuration(joiningDate, calculatedDate);
          }

          setReasonOptions(
            reasonCodes.map(item => ({
              label: item.ReasonCodeId,
              value: item.ReasonCodeId,
            })),
          );

          const filteredReportees = reportees.find(
            item => item.EmployeeId === formData.employeeId,
          );
          setactivePayperiod(filteredReportees?.ActivePayPeriodCode || '');
          // setServiceDuration(filteredReportees?.ServiceDuration || '');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [formData.employeeId, formData.EOSType]);

  useEffect(() => {
    if (lastWorkingDatePlanned && !formData.LastWorkingDate_Actual) {
      setFormData(prev => ({
        ...prev,
        LastWorkingDate_Actual: lastWorkingDatePlanned,
      }));
    }
  }, [lastWorkingDatePlanned, formData.LastWorkingDate_Actual]);

  // Methods
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    if (field === 'LastWorkingDate_Actual') {
      calculateServiceDuration(hiringDateOptions, value);
    }
  };

  const handleDateChange = date => {
    // Check if the selected date is greater than today's date
    if (new Date(date) < new Date(today)) {
      setAlertModal(true);
      setAlertMessage(
        'Last Working Date Requested cannot be greater than Notification Date (today).',
      );
      return; // Prevent further updates
    }

    setFormData(prev => ({
      ...prev,
      [currentField]: formatToISOWithTime(date),
    }));
    setShowCalendar(false);

    // Calculate service duration when Last Working Date Requested changes
    calculateServiceDuration(hiringDateOptions, formatToISOWithTime(date));
  };

  const calculateLastWorkingDate = (notificationDate, intervalType, period) => {
    const date = new Date(notificationDate);

    if (intervalType === 0) {
      // For Months
      date.setMonth(date.getMonth() + period);
    } else if (intervalType === 1) {
      // For Days
      date.setDate(date.getDate() + period);
    }

    return date; // Return date in YYYY-MM-DD format
    // return formatDate(date); // Return date in YYYY-MM-DD format
  };

  const calculateServiceDuration = (hiringDate, lastWorkingDate) => {
    const startDate = new Date(hiringDate);
    const endDate = new Date(lastWorkingDate);
    const differenceInTime = endDate.getTime() - startDate.getTime();
    const differenceInDays = differenceInTime / (1000 * 3600 * 24);
    const years = Math.floor(differenceInDays / 365);
    const months = Math.floor((differenceInDays % 365) / 30);
    const days = Math.floor((differenceInDays % 365) % 30);

    setServiceDuration(`${years} years, ${months} months, ${days} days`);
  };

  const formatToISOWithTime = date => {
    const baseDate = new Date(date);
    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, '0');
    const day = String(baseDate.getDate()).padStart(2, '0');

    // Construct the desired format with fixed time
    return `${year}-${month}-${day}T12:00:00`;
  };

  const today = new Date().toISOString().split('T')[0];

  const formatDate = date =>
    date
      ? new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
      : '';

  const isValidDate = dateString => {
    const date = new Date(dateString);
    return date.toString() !== 'Invalid Date' && !isNaN(date);
  };

  const handleClose = () => {
    setFormData({
      recId: '',
      employeeId: '',
      employeeName: '',
      EOSType: 0,
      NoticePeriodCode: '',
      EOSReasonCode: '',
      LastWorkingDate_Actual: '',
      Remarks: '',
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior="padding" style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {mode === 'edit'
                ? 'Edit Resignation Request'
                : 'Create Resignation Request'}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView>
            <Text style={styles.label}>Employee Name</Text>
            <Text style={[styles.input, styles.disable]}>
              {formData.employeeName}
            </Text>

            <Text style={styles.label}>EOS Type</Text>
            <Text style={[styles.input, styles.disable]}>Resignation</Text>

            <Text style={styles.label}>Notice Period Code</Text>
            <Text style={[styles.input, styles.disable]}>
              {formData.NoticePeriodCode}
            </Text>

            <Text style={styles.label}>Reason Code</Text>
            <Dropdown
              style={styles.input}
              data={reasonOptions}
              labelField="label"
              valueField="value"
              placeholder="Select Reason Code"
              placeholderStyle={{color: '#555555'}}
              selectedTextStyle={{color: '#000'}}
              itemTextStyle={{color: '#000'}}
              value={formData.EOSReasonCode}
              onChange={item => handleInputChange('EOSReasonCode', item.value)}
            />

            <Text style={styles.label}>Hiring Date</Text>
            <Text style={[styles.input, styles.disable]}>
              {formatDate(hiringDateOptions)}
            </Text>

            <Text style={styles.label}>Notification Date</Text>
            <Text style={[styles.input, styles.disable]}>
              {formatDate(today)}
            </Text>

            <Text style={styles.label}>Active Pay Period</Text>
            <Text style={[styles.input, styles.disable]}>
              {activePayperiod}
            </Text>

            <Text style={styles.label}>Last Working Date Planned</Text>
            <Text style={[styles.input, styles.disable]}>
              {lastWorkingDatePlanned}
            </Text>

            <Text style={styles.label}>Last Working Date Requested</Text>
            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() => {
                setCurrentField('LastWorkingDate_Actual');
                setShowCalendar(true);
              }}>
              <View style={{flex: 1}}>
                <Text style={styles.dateText}>
                  {isValidDate(formData.LastWorkingDate_Actual)
                    ? formatDate(formData.LastWorkingDate_Actual)
                    : formData.LastWorkingDate_Actual}
                </Text>
              </View>
              <Icon name="calendar" size={24} color="#555" />
            </TouchableOpacity>

            <Text style={styles.label}>Service Duration</Text>
            <Text style={[styles.input, styles.disable]}>
              {serviceDuration}
            </Text>

            <Text style={styles.label}>Remarks</Text>
            <TextInput
              style={styles.input}
              value={formData.Remarks}
              onChangeText={value => handleInputChange('Remarks', value)}
              placeholder="Enter Reason"
              placeholderTextColor="grey"
            />
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                onAction(
                  'save',
                  mode === 'edit' ? 'Update' : 'Create',
                  formData,
                );
                handleClose();
                // console.log('formData-0-0-0-0-0-0-0-', formData);
              }}>
              <Text style={styles.buttonText}>
                {mode === 'edit' ? 'Update' : 'Create'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={() => {
                onAction(
                  'submit',
                  mode === 'edit' ? 'Update' : 'Create',
                  formData,
                );
                handleClose();
              }}>
              <Text style={styles.buttonText}>
                {mode === 'edit' ? 'Update & Submit' : 'Create & Submit'}
              </Text>
            </TouchableOpacity>
          </View>
          <CalendarModal
            visible={showCalendar}
            current={formData[formatToISOWithTime(currentField)]}
            selectedDate={formData[formatToISOWithTime(currentField)]}
            onDateSelected={handleDateChange}
            onClose={() => setShowCalendar(false)}
          />

          <AlertModal
            visible={alertModal}
            heading="Alert"
            text={alertMessage}
            onPress={() => setAlertModal(false)}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    justifyContent: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#707070',
  },
  label: {
    fontSize: 16,
    marginTop: 10,
    fontWeight: 'bold',
    color: '#8a8a8a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
    fontSize: 16,
    fontWeight: '500',
    color: '#707070',
  },
  disable: {
    backgroundColor: '#f7f7f7',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
  },
  dateText: {
    color: '#555',
  },
});

export default EOSModal;
