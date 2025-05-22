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

import {RetrieveAllRequestedFor} from '../../API/EmployeeCertificates/RetrieveAllRequestedFor';
import {RetrieveAllReasonCode} from '../../API/EmployeeCertificates/RetrieveAllReasonCode';

const CertificateModal = ({
  visible,
  onClose,
  mode,
  onAction,
  certificateData = {},
  userData,
}) => {
  const [requestedForDropDown, setRequestedForDropDown] = useState([]);
  const [reasonCodeDropDown, setReasonCodeDropDown] = useState([]);

  const [formData, setFormData] = useState({
    recId: certificateData?.RecId,
    employeeId: certificateData?.EmployeeId, // Use consistent key
    employeeName: certificateData?.EmployeeName,
    certificateId: certificateData?.CertificateId || '', // Ensure this is extracted correctly
    CertificateType: certificateData?.CertificateType || '',
    department: certificateData?.Department || '',
    jobId: certificateData?.JobId || '',
    reason: certificateData?.Reason || '',
    remarks: certificateData?.Remarks || '',
    reqestedFor: certificateData?.ReqestedFor || '',
    requestedDate: certificateData?.RequestedDate || '',
  });

  // Fetch reason code & Requested For on mount
  useEffect(() => {
    const fetchRequestedForAsync = async () => {
      try {
        const requestedFor = await RetrieveAllRequestedFor();

        const dropdownData = Array.from(
          new Set(requestedFor.map(item => item.RequestedForId)),
        ).map(code => ({
          label: code,
          value: code,
        }));

        setRequestedForDropDown(dropdownData);
      } catch (error) {
        console.error('Error fetching Requested For:', error);
      }
    };

    const fetchReasonCodesAsync = async () => {
      try {
        const reasonCodes = await RetrieveAllReasonCode();

        const dropdownData = Array.from(
          new Set(reasonCodes.map(item => item.ReasonCodeId)),
        ).map(code => ({
          label: code,
          value: code,
        }));

        setReasonCodeDropDown(dropdownData);
      } catch (error) {
        console.error('Error fetching Reason code:', error);
      }
    };

    fetchRequestedForAsync();
    fetchReasonCodesAsync();
  }, [formData.recId]);

  // Sync with certificateData on changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...certificateData,
    }));
  }, [certificateData]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const getCertificateType = [
    {label: 'Clearance', value: 'Clearance'},
    {label: 'Salary Certificate', value: 'Salary Certificate'},
    {label: 'Employment Letter', value: 'Employment Letter'},
    {label: 'Warning Letter', value: 'Warning Letter'},
    {label: 'Salary Transfer Letter', value: 'Salary Transfer Letter'},
    {label: 'Appointment', value: 'Appointment'},
    {label: 'Confirmation', value: 'Confirmation'},
    {label: 'Work Experience', value: 'Work Experience'},
    {label: 'Termination', value: 'Termination'},
  ];

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
      recId: '',
      employeeId: '',
      employeeName: '',
      // certificateId: '',
      CertificateType: '',
      department: '',
      jobId: '',
      reason: '',
      remarks: '',
      reqestedFor: '',
      requestedDate: '',
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
                ? 'Edit Employee Certificate'
                : 'Create Employee Certificate'}
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

            <Text style={styles.label}>Job</Text>
            <Text style={[styles.input, styles.disable]}>{userData.jobId}</Text>

            <Text style={styles.label}>Department</Text>
            <Text style={[styles.input, styles.disable]}>
              {userData.department}
            </Text>

            <Text style={styles.label}>Requested Date</Text>
            <Text style={[styles.input, styles.disable]}>
              {formatDate(today)}
            </Text>

            <Text style={styles.label}>Certificate Type</Text>
            <Dropdown
              style={[
                styles.input,
                mode === 'edit' && styles.disable, // Apply disable style when in edit mode
              ]}
              data={getCertificateType}
              labelField="label"
              valueField="value"
              placeholder="Select Certificate Type"
              placeholderStyle={{color: '#555555'}}
              selectedTextStyle={{color: '#000'}}
              itemTextStyle={{color: '#000'}}
              value={formData.CertificateType}
              onChange={item =>
                handleInputChange('CertificateType', item.value)
              }
              disable={mode === 'edit'}
            />

            <Text style={styles.label}>Requested For</Text>
            <Dropdown
              style={styles.input}
              data={requestedForDropDown}
              labelField="label"
              valueField="value"
              placeholder="Select Requested For"
              placeholderStyle={{color: '#555555'}}
              selectedTextStyle={{color: '#000'}}
              itemTextStyle={{color: '#000'}}
              value={formData.reqestedFor}
              onChange={item => handleInputChange('reqestedFor', item.value)}
            />

            <Text style={styles.label}>Reason</Text>
            <Dropdown
              style={styles.input}
              data={reasonCodeDropDown}
              labelField="label"
              valueField="value"
              placeholder="Select Reason"
              placeholderStyle={{color: '#555555'}}
              selectedTextStyle={{color: '#000'}}
              itemTextStyle={{color: '#000'}}
              value={formData.reason}
              onChange={item => handleInputChange('reason', item.value)}
            />

            <Text style={styles.label}>Remarks</Text>
            <TextInput
              style={styles.input}
              value={formData.remarks}
              placeholder="Enter Remarks"
              placeholderTextColor="grey"
              onChangeText={value => handleInputChange('remarks', value)}
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
});

export default CertificateModal;
