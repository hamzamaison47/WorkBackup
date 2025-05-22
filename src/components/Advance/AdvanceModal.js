/* eslint-disable react-hooks/exhaustive-deps */
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
import CalendarModal from '../Leaves/CalendarModal';
import {getPayGroupPayPeriod} from '../../Controller/AdvanceRequestApiService';
import {RetrieveAdvanceType} from '../../API/Advance/RetrieveAdvanceType';

const AdvanceModal = ({
  visible,
  onClose,
  mode,
  onAction,
  userData,
  advanceType,
  advancesData = {},
}) => {
  const [advanceCodes, setAdvanceCodes] = useState([]);
  const [formData, setFormData] = useState({
    RecId: advancesData?.RecId,
    EmployeeId: advancesData?.EmployeeId,
    EmployeeName: advancesData?.EmployeeName,
    AdvanceTypeCode: advancesData?.AdvanceTypeCode || '',
    AdvanceAmount: advancesData?.AdvanceAmount
      ? advancesData.AdvanceAmount.toString()
      : '0',
    PaymentDate: advancesData?.PaymentDate || '',
    RecoveryStartDate: advancesData?.RecoveryStartDate || '',
    RequestedInstallmentAmount: advancesData?.RequestedInstallmentAmount
      ? advancesData.RequestedInstallmentAmount
      : '',
    RequestedInstallments: advancesData?.RequestedInstallments
      ? advancesData.RequestedInstallments
      : '',
    RequestDate:
      advancesData?.RequestDate || new Date().toISOString().split('T')[0],
    AdvanceDescription: advancesData?.AdvanceDescription || '',
    AdvanceRequestId: advancesData?.AdvanceRequestId || '',
  });

  // Advance Amount States
  const [advanceCodeDropDown, setAdvanceCodeDropDown] = useState([]);
  const [isAdvanceAmountValid, setIsAdvanceAmountValid] = useState(true);
  const [isAmountExceeds, setIsAmountExceeds] = useState(false);
  const [maxAdvanceAmount, setMaxAdvanceAmount] = useState(0);

  // Calender Validations
  const [showCalendar, setShowCalendar] = useState(false);

  // Payment Date States
  const [isDateValid, setIsDateValid] = useState(true);
  const [isPaymentDateValid, setIsPaymentDateValid] = useState(true);

  // Advance Type Code States
  const [isAdvanceTypeCodeValid, setIsAdvanceTypeCodeValid] = useState(true);

  // Sync with advancesData on changes
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch advance codes
        const advanceCode = await RetrieveAdvanceType();

        const filteredAdvanceType = advanceCode.filter(
          type => type.AdvanceType === advanceType,
        );

        const dropdownData = Array.from(
          new Set(filteredAdvanceType.map(item => item.AdvanceTypeCode)),
        ).map(code => ({
          label: code,
          value: code,
        }));

        setAdvanceCodeDropDown(dropdownData);
        setAdvanceCodes(filteredAdvanceType);

        // console.log('Advance Code-0-0-0-0-0-0-0-0-', advanceCode);

        // Sync with advancesData
        setFormData(prev => ({
          ...prev,
          ...advancesData,
          AdvanceAmount: advancesData?.AdvanceAmount
            ? advancesData.AdvanceAmount.toString()
            : '',
        }));

        // Fetch PayGroupPayPeriod data if EmployeeId is available
        if (userData.employeeId) {
          const response = await getPayGroupPayPeriod(userData.employeeId);

          const filteredPayGroupPayPeriod = response.filter(
            a => a.PayPeriodStatus === 0,
          );

          // Check if response is defined and has data
          if (
            filteredPayGroupPayPeriod &&
            filteredPayGroupPayPeriod.length > 0
          ) {
            if (mode === 'create') {
              formData.RecoveryStartDate = new Date(
                filteredPayGroupPayPeriod[0]?.EndDate,
              );
              setFormData(prev => ({
                ...prev,
                RecoveryStartDate: formatToISOWithTime(
                  filteredPayGroupPayPeriod[0]?.EndDate,
                ),
              }));
            }
          } else {
            console.warn(
              'No PayGroupPayPeriod data found for EmployeeId:',
              userData.employeeId,
            );
          }
        }

        // Fetch recoveries if AdvanceTypeCode is available
        if (formData.AdvanceTypeCode) {
          fetchRecoveries();
        } else {
          formData.RequestedInstallments = '';
          formData.RequestedInstallmentAmount = '';
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, [advancesData, userData.employeeId, formData.AdvanceTypeCode]);

  // Sync with advanceData on changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...advancesData,
    }));
  }, [advancesData]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Validate all fields before proceeding with Create or Update
  const validateFields = () => {
    let isValid = true;

    // Validate Advance Amount
    const advanceAmountStr = formData.AdvanceAmount || '0';
    const advanceAmountNum = Number(advanceAmountStr.replace(/,/g, ''));
    if (!advanceAmountNum || advanceAmountNum === 0) {
      setIsAdvanceAmountValid(false);
      isValid = false;
    } else {
      setIsAdvanceAmountValid(true);
    }

    // Validate Advance Type Code
    if (!formData.AdvanceTypeCode) {
      setIsAdvanceTypeCodeValid(false);
      isValid = false;
    } else {
      setIsAdvanceTypeCodeValid(true);
    }

    // Validate Payment Date
    if (!formData.PaymentDate) {
      setIsPaymentDateValid(false);
      isValid = false;
    } else {
      setIsPaymentDateValid(true);
    }

    return isValid;
  };

  // Handle Create or Update action
  const handleAction = actionType => {
    console.log('formData =======', formData);
    if (!validateFields()) {
      return;
    }

    onAction(actionType, mode === 'edit' ? 'Update' : 'Create', formData).then(
      success => {
        if (success) {
          handleClose();
        }
      },
    );
  };

  // Handle input changes for Advance Amount
  const handleAdvanceAmountChange = value => {
    const cleanedValue = value.replace(/[^0-9.]/g, '');
    const formattedValue = new Intl.NumberFormat().format(cleanedValue);

    handleInputChange('AdvanceAmount', formattedValue);
    setIsAdvanceAmountValid(true);
    setIsAmountExceeds(false);
  };

  // Validate Advance Amount
  const validateAdvanceAmount = () => {
    const advanceAmountStr = formData.AdvanceAmount || '0';
    const advanceAmountNum = Number(advanceAmountStr.replace(/,/g, ''));

    if (!advanceAmountNum || advanceAmountNum === 0) {
      setIsAdvanceAmountValid(false);
    } else {
      setIsAdvanceAmountValid(true);
    }
  };

  // Check if the Advance Amount exceeds the limit
  const checkAdvanceAmountLimit = () => {
    const advanceTypeCode = formData.AdvanceTypeCode;
    const advanceAmountStr = formData.AdvanceAmount || '0';
    const advanceAmountNum = Number(advanceAmountStr.replace(/,/g, ''));

    const filteredAdvances = advanceCodes.filter(
      a => a.AdvanceTypeCode === advanceTypeCode,
    );

    if (filteredAdvances.length > 0) {
      const maxAdvanceAmounts = filteredAdvances[0]?.MaxAdanceAmount || 0;

      if (advanceAmountNum > maxAdvanceAmounts && maxAdvanceAmounts !== 0) {
        setIsAmountExceeds(true);
        setMaxAdvanceAmount(maxAdvanceAmounts);
      } else {
        setIsAmountExceeds(false);
      }
    } else {
      setIsAmountExceeds(true);
      setMaxAdvanceAmount(0);
      console.log('No advances found with the specified AdvanceTypeCode.');
    }
  };

  // Fetch recoveries based on the advance type code
  const fetchRecoveries = async () => {
    try {
      const filteredAdvances = advanceCodes.filter(
        a => a.AdvanceTypeCode === formData.AdvanceTypeCode,
      );

      if (filteredAdvances.length > 0) {
        const maxRecoverie = filteredAdvances[0]?.Recoveries || 0;

        // Check if the record already has Recovery Amount or Recoveries
        if (
          formData.RequestedInstallmentAmount &&
          formData.RequestedInstallmentAmount !== 0
        ) {
          formData.RequestedInstallmentAmount =
            formData.RequestedInstallmentAmount;
          formData.RequestedInstallments = '';
          text => handleInputChange('RequestedInstallmentAmount', text);
        } else if (
          formData.RequestedInstallments &&
          formData.RequestedInstallments !== 0
        ) {
          formData.RequestedInstallments = formData.RequestedInstallments;
          formData.RequestedInstallmentAmount = '';
        } else if (maxRecoverie > 0) {
          formData.RequestedInstallments = maxRecoverie;
          formData.RequestedInstallmentAmount = '';
          handleInputChange('RequestedInstallments', maxRecoverie);
        } else {
          formData.RequestedInstallments = '';
          formData.RequestedInstallmentAmount = '';
        }
      } else {
        formData.RequestedInstallments = '';
        formData.RequestedInstallmentAmount = '';
      }
    } catch (error) {
      console.error('Error fetching recoveries:', error);
    }
  };

  // Payment Date Change method
  const handleDateChangePayment = date => {
    setFormData({
      ...formData,
      PaymentDate: formatToISOWithTime(date),
    });
    setShowCalendar(false);
    validatePaymentDate(date);
  };

  // Validate Payment Date
  const validatePaymentDate = date => {
    const selectedDate = new Date(date);
    const recoveryStartDateObj = new Date(formData.RecoveryStartDate);

    console.log('validatePaymentDate:', selectedDate, recoveryStartDateObj);

    if (selectedDate > recoveryStartDateObj) {
      setIsDateValid(false);
      setIsPaymentDateValid(true);
    } else {
      setIsDateValid(true);
      setIsPaymentDateValid(true);
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

  const formatToISOWithTime = date => {
    const baseDate = new Date(date);
    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, '0');
    const day = String(baseDate.getDate()).padStart(2, '0');

    // Construct the desired format with fixed time
    return `${year}-${month}-${day}T12:00:00`;
  };

  const handleClose = () => {
    setFormData({
      AdvanceTypeCode: '',
      AdvanceAmount: '',
      RequestDate: new Date().toISOString().split('T')[0],
      AdvanceDescription: '',
      AdvanceRequestId: '',
    });

    onClose();
  };

  useEffect(() => {
    // Cleanup function to reset state when the modal is closed
    return () => {
      // Reset formData when the modal is closed
      setFormData({
        RecId: '',
        EmployeeId: '',
        EmployeeName: '',
        AdvanceTypeCode: '',
        RequestDate: new Date().toISOString().split('T')[0],
        AdvanceDescription: '',
        AdvanceRequestId: '',
      });
      setAdvanceCodeDropDown([]);
      setIsAdvanceAmountValid(true);
      setIsAmountExceeds(false);
      setMaxAdvanceAmount(0);
      setIsAdvanceTypeCodeValid(true);
    };
  }, [visible]);

  // console.log('Form Data-0-0-0-0-0-0-0-0-', formData);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior="padding" style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {mode === 'edit'
                ? 'Edit Advance Request'
                : 'Create Advance Request'}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          {/* Body */}
          <ScrollView>
            <Text style={styles.label}>Employee Name</Text>
            <Text style={[styles.input, styles.disable]}>
              {formData.EmployeeName}
            </Text>

            <Text style={styles.label}>Request Date</Text>
            <Text style={[styles.input, styles.disable]}>
              {formatDate(today)}
            </Text>

            <Text style={styles.label}>Advance Description</Text>
            <TextInput
              style={styles.input}
              value={formData.AdvanceDescription}
              placeholder="Enter Advance Description"
              placeholderTextColor={'grey'}
              onChangeText={text =>
                handleInputChange('AdvanceDescription', text)
              }
            />

            <View>
              <Text style={styles.label}>Advance Type Code</Text>
              <Dropdown
                style={styles.input}
                data={advanceCodeDropDown}
                labelField="label"
                valueField="value"
                placeholder="Select Advance Code"
                placeholderStyle={{color: '#555555'}}
                selectedTextStyle={{color: '#000'}}
                itemTextStyle={{color: '#000'}}
                value={formData.AdvanceTypeCode}
                onChange={item => {
                  handleInputChange('AdvanceTypeCode', item.value);
                  setIsAdvanceTypeCodeValid(true);
                }}
              />
              {!isAdvanceTypeCodeValid && (
                <Text style={styles.errorText}>
                  Advance Type Code is required
                </Text>
              )}
            </View>

            <View>
              <Text style={styles.label}>Advance Amount</Text>
              <TextInput
                style={[
                  styles.input,
                  !isAdvanceAmountValid && styles.invalidField,
                  formData.AdvanceTypeCode ? {} : {backgroundColor: '#f7f7f7'},
                ]}
                value={formData.AdvanceAmount}
                placeholder="0"
                placeholderTextColor="grey"
                keyboardType="numeric"
                onChangeText={handleAdvanceAmountChange}
                onBlur={() => {
                  validateAdvanceAmount();
                  checkAdvanceAmountLimit();
                }}
                editable={!!formData.AdvanceTypeCode}
              />
              {!isAdvanceAmountValid && (
                <Text style={styles.errorText}>Advance Amount is required</Text>
              )}

              {isAmountExceeds && maxAdvanceAmount > 0 && (
                <Text style={styles.errorText}>
                  Advance Amount cannot exceed{' '}
                  {Number(maxAdvanceAmount).toLocaleString()}
                </Text>
              )}

              {isAmountExceeds && maxAdvanceAmount === 0 && (
                <Text style={styles.errorText}>
                  No advances found with the specified AdvanceTypeCode.
                </Text>
              )}
            </View>

            <View>
              <Text style={styles.label}>Payment Date</Text>
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => {
                  setShowCalendar(true);
                }}
                onBlur={() => {
                  validatePaymentDate(formData.PaymentDate);
                }}>
                <View style={{flex: 1}}>
                  <Text style={styles.dateText}>
                    {formData.PaymentDate
                      ? formatDate(formData.PaymentDate)
                      : 'Select Payment Date'}
                  </Text>
                </View>
                <Icon name="calendar" size={24} color="#555" />
              </TouchableOpacity>
              {!isPaymentDateValid && (
                <Text style={styles.errorText}>Payment Date is required</Text>
              )}

              {!isDateValid && (
                <Text style={styles.errorText}>
                  Payment date can not be greater than{' '}
                  {formatDate(formData.RecoveryStartDate)}
                </Text>
              )}
            </View>
          </ScrollView>
          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleAction('save')}>
              <Text style={styles.buttonText}>
                {mode === 'edit' ? 'Update' : 'Create'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={() => handleAction('submit')}>
              <Text style={styles.buttonText}>
                {mode === 'edit' ? 'Update & Submit' : 'Create & Submit'}
              </Text>
            </TouchableOpacity>
          </View>
          <CalendarModal
            visible={showCalendar}
            current={formData.PaymentDate}
            onDateSelected={date => {
              handleDateChangePayment(date);
            }}
            onClose={() => setShowCalendar(false)}
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
  invalidField: {
    borderColor: 'red',
  },
  disabledInput: {
    backgroundColor: '#f7f7f7',
    color: '#a0a0a0',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
  },
});

export default AdvanceModal;
