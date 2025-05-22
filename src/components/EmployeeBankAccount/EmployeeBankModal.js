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
import Icon from 'react-native-vector-icons/FontAwesome';

const EmployeeBankModal = ({
  visible,
  onClose,
  mode,
  onAction,
  bankAccountData = {},
}) => {
  const [formData, setFormData] = useState({
    recId: bankAccountData?.recId,
    employeeId: bankAccountData?.employeeId,
    employeeName: bankAccountData?.employeeName,
    accountId: bankAccountData?.accountId || '',
    name: bankAccountData?.name || '',
    accountNum: bankAccountData?.accountNum || '',
    accountHolder: bankAccountData?.accountHolder || '',
    bankIBAN: bankAccountData?.bankIBAN || '',
    branchNumber: bankAccountData?.branchNumber || '',
    branchName: bankAccountData?.branchName || '',
  });

  // Sync with leaveData on changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...bankAccountData,
    }));
  }, [bankAccountData]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClose = () => {
    setFormData({
      recId: '',
      employeeId: '',
      employeeName: '',
      accountId: '',
      name: '',
      accountNum: '',
      accountHolder: '',
      bankIBAN: '',
      branchNumber: '',
      branchName: '',
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
                ? 'Edit Employee Bank Account'
                : 'Create Employee Bank Account'}
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

            <Text style={styles.label}>Account Id</Text>
            <TextInput
              style={styles.input}
              value={formData.accountId}
              placeholder="Enter Account ID"
              placeholderTextColor="grey"
              onChangeText={value => handleInputChange('accountId', value)}
            />

            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              placeholder="Enter Name"
              placeholderTextColor="grey"
              onChangeText={value => handleInputChange('name', value)}
            />

            <Text style={styles.label}>Bank Account</Text>
            <TextInput
              style={styles.input}
              value={formData.accountNum}
              placeholder="Enter Bank Account Number"
              placeholderTextColor="grey"
              onChangeText={value => handleInputChange('accountNum', value)}
            />

            <Text style={styles.label}>IBAN</Text>
            <TextInput
              style={styles.input}
              value={formData.bankIBAN}
              placeholder="Enter Bank IBAN Number"
              placeholderTextColor="grey"
              onChangeText={value => handleInputChange('bankIBAN', value)}
            />

            <Text style={styles.label}>Branch Number</Text>
            <TextInput
              style={styles.input}
              value={formData.branchNumber}
              placeholder="Enter Branch Number"
              placeholderTextColor="grey"
              onChangeText={value => handleInputChange('branchNumber', value)}
            />

            <Text style={styles.label}>Branch Name</Text>
            <TextInput
              style={styles.input}
              value={formData.branchName}
              placeholder="Enter Branch Name"
              placeholderTextColor="grey"
              onChangeText={value => handleInputChange('branchName', value)}
            />

            <Text style={styles.label}>Account Title</Text>
            <TextInput
              style={styles.input}
              value={formData.accountHolder}
              placeholder="Enter Account Title"
              placeholderTextColor="grey"
              onChangeText={value => handleInputChange('accountHolder', value)}
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

export default EmployeeBankModal;
