/* eslint-disable no-alert */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import {Dropdown} from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/FontAwesome';
import CalendarModal from './CalendarModal';
import {
  fetchLeaveBalance,
  fetchLeaveCodes,
} from '../../Controller/leaveRequestApiService';

const LeaveModal = ({visible, onClose, mode, onAction, leaveData = {}}) => {
  const [leaveCodeDropDown, setLeaveCodeDropDown] = useState([]);
  const [formData, setFormData] = useState({
    recId: leaveData?.recId,
    employeeId: leaveData?.employeeId,
    employeeName: leaveData?.employeeName,
    leaveCode: leaveData?.leaveCode || '',
    leaveCategory: leaveData?.leaveCategory || '',
    balance: leaveData?.balance || '0.00',
    leaveStartDate: leaveData?.leaveStartDate || '',
    leaveEndDate: leaveData?.leaveEndDate || '',
    leaveDays: leaveData?.leaveDays || '',
    reason: leaveData?.reason || '',
  });

  // Sync with leaveData on changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...leaveData,
    }));
  }, [leaveData]);

  // Fetch leave codes on mount
  useEffect(() => {
    const fetchLeaveCodesAsync = async () => {
      try {
        const leaveCodes = await fetchLeaveCodes();
        setLeaveCodeDropDown(leaveCodes);
      } catch (error) {
        console.error('Error fetching leave codes:', error);
      }
    };
    fetchLeaveCodesAsync();
  }, []);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Leave category options
  const leaveCategoryOptions = [
    {label: 'Full Leave', value: 'Full Leave'},
    {label: 'Half Leave', value: 'Half Leave'},
  ];

  // Calendar handling
  const [showCalendar, setShowCalendar] = useState(false);

  const formatToISOWithTime = date => {
    const baseDate = new Date(date); // Convert input date to Date object
    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(baseDate.getDate()).padStart(2, '0');

    // Construct the desired format with fixed time
    return `${year}-${month}-${day}T12:00:00`;
  };

  const handleDateChange = async date => {
    // Update the Leave Start Date
    setFormData(prev => ({
      ...prev,
      leaveStartDate: formatToISOWithTime(date),
    }));

    try {
      // Fetch the leave balance from the API
      const balanceData = await fetchLeaveBalance(
        formData.employeeId,
        formData.leaveCode,
        formatToISOWithTime(date),
      );

      // Update the balance in the state
      setFormData(prev => ({
        ...prev,
        balance: balanceData || '0.00',
      }));
    } catch (error) {
      console.error('Error fetching leave balance:', error);

      // Fallback in case of error
      setFormData(prev => ({
        ...prev,
        balance: '0.00',
      }));
    }
  };

  //Leave End Date
  const handleLeaveDaysChange = value => {
    const leaveDays = parseFloat(value) || 0;
    const balance = parseFloat(formData.balance) || 0;

    if (leaveDays <= balance) {
      // Calculate the end date based on LeaveStartDate and LeaveDays
      const startDate = new Date(formData.leaveStartDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + leaveDays - 1); // Add the leave days to the start date

      handleInputChange('leaveDays', leaveDays.toString());
      handleInputChange('leaveEndDate', endDate); // Format and set the end date
    } else {
      alert('Leave Days cannot exceed the available balance.');
    }
  };

  // Format date
  const today = new Date().toISOString().split('T')[0];

  const formatDate = date =>
    date
      ? new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
      : '';

  const handleClose = () => {
    setFormData({
      leaveCode: '',
      leaveCategory: '',
      balance: '',
      leaveStartDate: '',
      leaveEndDate: '',
      leaveDays: '0',
      reason: '',
    });
    onClose(); // Call the parent `onClose` to close the modal
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior="padding" style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {mode === 'edit' ? 'Edit Leave Request' : 'Create Leave Request'}
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

            <Text style={styles.label}>Leave Code</Text>
            <Dropdown
              style={styles.input}
              data={leaveCodeDropDown}
              labelField="label"
              valueField="value"
              placeholder="Select Leave Code"
              placeholderStyle={{color: '#555555'}}
              selectedTextStyle={{color: '#000'}}
              itemTextStyle={{color: '#000'}}
              value={formData.leaveCode}
              onChange={item => handleInputChange('leaveCode', item.value)}
            />

            <Text style={styles.label}>Leave Category</Text>
            <Dropdown
              style={styles.input}
              data={leaveCategoryOptions}
              labelField="label"
              valueField="value"
              placeholder="Select Leave Category"
              placeholderStyle={{color: '#555555'}}
              selectedTextStyle={{color: '#000'}}
              itemTextStyle={{color: '#000'}}
              value={formData.leaveCategory}
              onChange={item => handleInputChange('leaveCategory', item.value)}
            />

            <Text style={styles.label}>Balance</Text>
            <Text style={[styles.input, styles.disable]}>
              {formData.balance.toString()}
            </Text>

            <Text style={styles.label}>Request Date</Text>
            <Text style={[styles.input, styles.disable]}>
              {formatDate(today)}
            </Text>

            <Text style={styles.label}>Leave Start Date</Text>
            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() => setShowCalendar(true)}>
              <View style={{flex: 1}}>
                <Text style={styles.dateText}>
                  {formData.leaveStartDate
                    ? formatDate(formData.leaveStartDate)
                    : 'Select Start Date'}
                </Text>
              </View>
              <Icon name="calendar" size={24} color="#555" />
            </TouchableOpacity>
            <CalendarModal
              visible={showCalendar}
              current={formData.leaveStartDate}
              onDateSelected={handleDateChange}
              onClose={() => setShowCalendar(false)}
            />

            <Text style={styles.label}>Leave Days</Text>
            <TextInput
              style={styles.input}
              value={formData.leaveDays.toString()}
              onChangeText={handleLeaveDaysChange}
              keyboardType="numeric"
              placeholder="Enter Leave Days"
              placeholderTextColor="grey"
            />

            <Text style={styles.label}>End Date</Text>
            <Text style={[styles.input, styles.disable]}>
              {formData.leaveEndDate
                ? formatDate(formData.leaveEndDate)
                : 'Select End Date'}
            </Text>

            <Text style={styles.label}>Reason</Text>
            <TextInput
              style={styles.input}
              value={formData.reason}
              onChangeText={value => handleInputChange('reason', value)}
              placeholder="Enter reason"
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
                ).then(success => {
                  if (success) {
                    handleClose(); // Close the modal only on success
                  }
                });
              }}>
              <Text style={styles.buttonText}>
                {mode === 'edit' ? 'Update' : 'Create'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              // onPress={() => {
              //   onAction(
              //     'submit',
              //     mode === 'edit' ? 'Update' : 'Create',
              //     formData,
              //   );
              //   handleClose();
              // }}>
              onPress={() => {
                onAction(
                  'submit',
                  mode === 'edit' ? 'Update' : 'Create',
                  formData,
                ).then(success => {
                  if (success) {
                    handleClose(); // Close the modal only on success
                  }
                });
              }}>
              <Text style={styles.buttonText}>
                {mode === 'edit' ? 'Update & Submit' : 'Create & Submit'}
              </Text>
            </TouchableOpacity>
          </View>
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

export default LeaveModal;
