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
import CalendarModal from '../Leaves/CalendarModal';
import AlertModal from '../Alert/AlertModal';
import usePalette from '../../hooks/usePalette';

import {FindIdentificationTypeRequest} from '../../API/PersonalInformation/Identification/FindIdentificationTypeRequest';

const IdentificationInfoModal = ({
  visible,
  onClose,
  mode,
  onAction,
  serviceData = {},
}) => {
  const [identityTypes, setIdentityTypes] = useState([]); // To store the dropdown data
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentField, setCurrentField] = useState('');
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [formData, setFormData] = useState({
    RecId: serviceData?.RecId || 0,
    Description: serviceData?.Description || '',
    // Classification: serviceData?.Classification || '',
    IdentificationNumber: serviceData?.IdentificationNumber || '',
    IdentificationType: serviceData?.IdentificationType || null,
    IdentificationTypeId: serviceData?.IdentificationTypeId || '',
    IssuedDate: serviceData?.IssuedDate || '',
    ExpirationDate: serviceData?.ExpirationDate || '',
    IssuingAgency: serviceData?.IssuingAgency || '',
    IssuingAgencyId: serviceData?.IssuingAgencyId || '',
    IsSelected: serviceData?.IsSelected || 0,
    IsPrimary: serviceData?.IsPrimary || 0,
    WorkflowOperation: serviceData?.WorkflowOperation || '',
    ApprovalStatus: serviceData?.ApprovalStatus || '',
  });

  const P = usePalette();
  const styles = createStyles(P);

  // Update form data when serviceData changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...serviceData,
    }));
  }, [serviceData]);

  // Fetch identity types
  useEffect(() => {
    const fetchIdentityType = async () => {
      try {
        const allIdentityTypes = await FindIdentificationTypeRequest();
        const formattedIdentityTypes = allIdentityTypes.map(item => ({
          label: item.IdentificationTypeId, // Displayed in dropdown
          value: item.RecId, // RecId passed in API
        }));
        setIdentityTypes(formattedIdentityTypes);
      } catch (error) {
        console.error('Error fetching identity types:', error);
      }
    };

    fetchIdentityType();
  }, []);

  const handleDateChange = date => {
    const selectedDate = new Date(date); // Convert selected date to Date object
    const issuedDate = formData.IssuedDate
      ? new Date(formData.IssuedDate)
      : null;
    const expiryDate = formData.ExpirationDate
      ? new Date(formData.ExpirationDate)
      : null;

    if (currentField === 'ExpirationDate') {
      // Check if Issued Date is not set
      if (!issuedDate) {
        setAlertModal(true);
        setAlertMessage(
          'Please set the Issued Date before selecting the Expiry Date.',
        );
        return; // Stop further processing
      }

      // Check if Expiry Date is earlier than Issued Date
      if (selectedDate < issuedDate) {
        setAlertModal(true);
        setAlertMessage('Expiry Date cannot be earlier than the Issued Date.');
        return; // Stop further processing
      }
    }

    if (currentField === 'IssuedDate') {
      // Check if Issued Date is greater than Expiry Date
      if (expiryDate && selectedDate > expiryDate) {
        setAlertModal(true);
        setAlertMessage('Issued Date cannot be greater than the Expiry Date.');
        return; // Stop further processing
      }

      // Check if Issued Date is in the future
      if (selectedDate > new Date(today)) {
        setAlertModal(true);
        setAlertMessage('Issued Date cannot be in the future.');
        return; // Prevent further processing
      }
    }

    // Update the selected field with the formatted date
    setFormData({
      ...formData,
      [currentField]: formatToISOWithTime(date),
    });
    setShowCalendar(false);
  };

  const formatToISOWithTime = date => {
    const baseDate = new Date(date); // Convert input date to Date object
    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, '0'); // Months are 0-based
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleIdentityTypesChange = selectedIdentificationType => {
    const selectedType = identityTypes.find(
      item => item.value === selectedIdentificationType,
    );

    if (selectedType) {
      setFormData(prevData => ({
        ...prevData,
        IdentificationTypeId: selectedType.label, // Visible label
        IdentificationType: selectedType.value, // RecId to be sent to API
      }));

      handleInputChange('IdentificationTypeId', selectedType.value); // Pass RecId to the API
    }
  };

  const getYesNo = [
    {label: 'No', value: 0},
    {label: 'Yes', value: 1},
  ];

  const handleClose = () => {
    setFormData({
      RecId: '',
      Description: '',
      // Classification: '',
      IdentificationNumber: '',
      IdentificationTypeId: '',
      IdentificationType: '',
      IssuedDate: '',
      ExpirationDate: '',
      IssuingAgencyId: '',
      IsSelected: 0,
      IsPrimary: getYesNo[0],
      WorkflowOperation: '',
      ApprovalStatus: '',
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
                ? 'Edit Identification Information'
                : 'Create Identification Information'}
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

            <Text style={styles.label}>Identification Type</Text>
            <Dropdown
              style={styles.input}
              data={identityTypes}
              labelField="label"
              valueField="value"
              placeholder="Select Identification Type"
              placeholderStyle={{color: 'grey'}}
              selectedTextStyle={{color: '#707070'}}
              itemTextStyle={{color: '#707070'}}
              value={formData.IdentificationTypeId}
              onChange={item => handleIdentityTypesChange(item.value)}
            />

            <Text style={styles.label}>Number</Text>
            <TextInput
              style={styles.input}
              value={formData.IdentificationNumber}
              onChangeText={value =>
                handleInputChange('IdentificationNumber', value)
              }
              placeholder="Enter Number"
              placeholderTextColor="grey"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              value={formData.Description}
              onChangeText={value => handleInputChange('Description', value)}
              placeholder="Enter Description"
              placeholderTextColor="grey"
            />

            {/* <Text style={styles.label}>Entry Type</Text>
            <TextInput
              style={styles.input}
              value={formData.Classification}
              onChangeText={value => handleInputChange('Classification', value)}
              placeholder="Enter Classification"
              placeholderTextColor="grey"
            /> */}

            <Text style={styles.label}>Primary</Text>
            <Dropdown
              style={styles.input}
              data={getYesNo}
              labelField="label"
              valueField="value"
              selectedTextStyle={{color: '#000'}}
              itemTextStyle={{color: '#000'}}
              value={formData.IsPrimary}
              onChange={item => handleInputChange('IsPrimary', item.value)}
            />

            <Text style={styles.label}>Issued Date</Text>
            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() => {
                setCurrentField('IssuedDate');
                setShowCalendar(true);
              }}>
              <View style={{flex: 1}}>
                <Text style={styles.dateText}>
                  {formData.IssuedDate
                    ? formatDate(formData.IssuedDate)
                    : 'Select Issued Date'}
                </Text>
              </View>
              <Icon name="calendar" size={24} color="#555" />
            </TouchableOpacity>

            <Text style={styles.label}>Expiration Date</Text>
            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() => {
                setCurrentField('ExpirationDate');
                setShowCalendar(true);
              }}>
              <View style={{flex: 1}}>
                <Text style={styles.dateText}>
                  {formData.ExpirationDate
                    ? formatDate(formData.ExpirationDate)
                    : 'Select Expiry Date'}
                </Text>
              </View>
              <Icon name="calendar" size={24} color="#555" />
            </TouchableOpacity>
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
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
            current={formData[currentField]}
            selectedDate={formData[currentField]}
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

// const styles = StyleSheet.create({
const createStyles = P =>
  StyleSheet.create({
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
      backgroundColor: P.primary,
    },
    buttonText: {
      color: P.onPrimary,
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

export default IdentificationInfoModal;
