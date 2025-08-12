/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
} from 'react-native';
import {Dropdown} from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/FontAwesome';
import {styles} from '../../styles/styles';

const ContactInfoModal = ({
  visible,
  onClose,
  mode,
  onAction,
  serviceData = {},
}) => {
  const [formData, setFormData] = useState({
    RecId: serviceData?.RecId,
    employeeId: serviceData?.employeeId,
    employeeName: serviceData?.employeeName,
    Description: serviceData?.Description || '',
    Type: serviceData?.Type || 0, // Default to the first option's value (e.g., 0 for 'None')
    Locator: serviceData?.Locator || '',
    IsMobilePhone: serviceData?.IsMobilePhone || 0, // Default to 'No' (0)
    IsPrimary: serviceData?.IsPrimary || 0, // Default to 'No' (0)
    IsPrivate: serviceData?.IsPrivate || 0, // Default to 'No' (0)
  });

  // Sync with serviceData on changes
  useEffect(() => {
    // console.log('Service Data-0-0-0-0-0-0-', serviceData);
    setFormData(prev => ({
      ...prev,
      ...serviceData,
    }));
  }, [serviceData]);

  // Methods
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const getYesNo = [
    {label: 'No', value: 0},
    {label: 'Yes', value: 1},
  ];

  const typeMapping = [
    {label: 'None', value: 0},
    {label: 'Phone', value: 1},
    {label: 'Email address', value: 2},
    {label: 'URL', value: 3},
    {label: 'Telex', value: 4},
    {label: 'Fax', value: 5},
    {label: 'Facebook', value: 6},
    {label: 'Twitter', value: 7},
    {label: 'LinkedIn', value: 8},
    {label: 'Home number', value: 9},
    {label: 'Work number', value: 10},
    {label: 'Mobile number', value: 11},
  ];

  const handleClose = () => {
    setFormData({
      RecId: '',
      employeeId: '',
      employeeName: '',
      Description: '',
      Type: typeMapping[0],
      Locator: '',
      IsMobilePhone: getYesNo[0],
      IsPrimary: getYesNo[0],
      IsPrivate: getYesNo[0],
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.CntInfoMdl_modalContainer}>
        <View style={styles.CntInfoMdl_modalContent}>
          {/* Header */}
          <View style={styles.CntInfoMdl_modalHeader}>
            <Text style={styles.CntInfoMdl_modalTitle}>
              {mode === 'edit'
                ? 'Edit Contact Information'
                : 'Create Contact Information'}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView>
            <Text style={styles.CntInfoMdl_label}>Employee Name</Text>
            <Text style={[styles.CntInfoMdl_input, styles.CntInfoMdl_disable]}>
              {formData.employeeName}
            </Text>

            <Text style={styles.CntInfoMdl_label}>Description</Text>
            <TextInput
              style={styles.CntInfoMdl_input}
              value={formData.Description}
              onChangeText={value => handleInputChange('Description', value)}
              placeholder="Enter Description"
              placeholderTextColor="grey"
            />

            <Text style={styles.CntInfoMdl_label}>Type</Text>
            <Dropdown
              style={styles.CntInfoMdl_input}
              data={typeMapping}
              labelField="label"
              valueField="value"
              selectedTextStyle={{color: '#000'}}
              itemTextStyle={{color: '#000'}}
              value={formData.Type}
              onChange={item => handleInputChange('Type', item.value)}
            />

            <Text style={styles.CntInfoMdl_label}>
              {formData.Type === 1 ? 'Phone' : 'Email Address'}
            </Text>
            <TextInput
              style={styles.CntInfoMdl_input}
              value={formData.Locator}
              onChangeText={value => handleInputChange('Locator', value)}
              placeholder="Enter Your Info"
              placeholderTextColor="grey"
            />

            <Text style={styles.CntInfoMdl_label}>Mobile</Text>
            <Dropdown
              style={styles.CntInfoMdl_input}
              data={getYesNo}
              labelField="label"
              valueField="value"
              selectedTextStyle={{color: '#000'}}
              itemTextStyle={{color: '#000'}}
              value={formData.IsMobilePhone}
              onChange={item => handleInputChange('IsMobilePhone', item.value)}
            />

            <Text style={styles.CntInfoMdl_label}>Primary</Text>
            <Dropdown
              style={styles.CntInfoMdl_input}
              data={getYesNo}
              labelField="label"
              valueField="value"
              selectedTextStyle={{color: '#000'}}
              itemTextStyle={{color: '#000'}}
              value={formData.IsPrimary}
              onChange={item => handleInputChange('IsPrimary', item.value)}
            />

            <Text style={styles.CntInfoMdl_label}>Private</Text>
            <Dropdown
              style={styles.CntInfoMdl_input}
              data={getYesNo}
              labelField="label"
              valueField="value"
              selectedTextStyle={{color: '#000'}}
              itemTextStyle={{color: '#000'}}
              value={formData.IsPrivate} // This should be a number (0 or 1)
              onChange={item => handleInputChange('IsPrivate', item.value)}
            />
          </ScrollView>

          {/* Footer */}
          <View style={styles.CntInfoMdl_modalFooter}>
            <TouchableOpacity
              style={[styles.CntInfoMdl_button, styles.CntInfoMdl_submitButton]}
              onPress={() => {
                onAction(
                  'submit',
                  mode === 'edit' ? 'Update' : 'Create',
                  formData,
                );
                handleClose();
              }}>
              <Text style={styles.CntInfoMdl_buttonText}>
                {mode === 'edit' ? 'Update & Submit' : 'Create & Submit'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ContactInfoModal;
