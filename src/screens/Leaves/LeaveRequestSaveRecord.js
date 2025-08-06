/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView,
  Pressable,
  Dimensions,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {Dropdown} from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/FontAwesome';

import {
  fetchLeaveBalance,
  fetchLeaveCodes,
} from '../../Controller/leaveRequestApiService';

import {createLeaveRequest} from '../../API/Leaves/CreateLeaveRequest';
import {SubmitLeaveRequest} from '../../API/Leaves/SubmitLeaveRequest';
import {UpdateLeaveRequest} from '../../API/Leaves/UpdateLeaveRequest';

import {AlertModal} from '../../components/Alert/AlertModal';
import CalendarModal from '../../components/Leaves/CalendarModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';

const {width, height} = Dimensions.get('window');

const LeaveRequestSaveRecord = () => {
  const route = useRoute();
  const navigation = useNavigation();

  const {selectedLegalEntity, defaultLegalEntity} = useSelector(
    state => state.company,
  );
  const {userData} = useSelector(state => state.user);
  const companyToUse = selectedLegalEntity || defaultLegalEntity;

  // Navigation params with safe defaults
  const {
    mode = 'create',
    leaveData = {},
    employeeId = leaveData.employeeId || userData?.employeeId || '',
    employeeName = leaveData.employeeName || userData?.employeeName || '',
    WorkerRecId = leaveData.WorkerRecId || userData?.WorkerRecId || '',
    cameFrom = 'MainDashboard',
  } = route.params || {};

  // State declarations
  const [LeaveCodesForEmployee, setLeaveCodesForEmployee] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Create initial form data function
  const createInitialFormData = () => ({
    recId: !leaveData.recId || leaveData.recId === '0' ? '' : leaveData.recId,
    employeeId: employeeId,
    employeeName: employeeName,
    WorkerRecId: WorkerRecId,
    leaveCode: '',
    leaveCategory: '',
    balance: '0.00',
    leaveStartDate: '',
    leaveEndDate: '',
    leaveDays: '',
    reason: '',
  });

  // Form state - Initialize by calling the function
  const [formData, setFormData] = useState(() => createInitialFormData());

  // Fixed goBack function with proper navigation logic
  const goBack = useCallback(() => {
    if (cameFrom === 'MainDashboard') {
      navigation.navigate('MainDashboard');
    } else if (cameFrom === 'LeavesListPage') {
      navigation.navigate('LeavesListPage', {
        employeeId: formData.employeeId || employeeId,
        employeeName: formData.employeeName || employeeName,
        WorkerRecId: formData.WorkerRecId || WorkerRecId,
        cameFrom: 'LeaveRequestSaveRecord',
      });
    } else {
      navigation.goBack();
    }
  }, [
    cameFrom,
    formData.employeeId,
    formData.employeeName,
    formData.WorkerRecId,
    employeeId,
    employeeName,
    WorkerRecId,
    navigation,
  ]);

  // Function to normalize leave category for display
  const normalizeLeaveCategoryForDisplay = category => {
    if (!category) return '';

    // Handle different formats from API
    switch (category.toLowerCase()) {
      case 'fullleave':
      case 'full leave':
        return 'Full Leave';
      case 'halfleave':
      case 'half leave':
        return 'Half Leave';
      default:
        return category;
    }
  };

  // Function to clear form data
  const clearFormData = useCallback(() => {
    const clearedForm = createInitialFormData();
    setFormData(clearedForm);
  }, []);

  // Reset form data when screen comes into focus and mode changes
  useFocusEffect(
    React.useCallback(() => {
      if (mode === 'create') {
        // Always reset form data for create mode
        const freshFormData = createInitialFormData();
        setFormData(freshFormData);
      } else if (mode === 'edit' && leaveData?.recId) {
        // Normalize the leave category from API
        const normalizedLeaveCategory = normalizeLeaveCategoryForDisplay(
          leaveData.leaveCategory,
        );

        const editFormData = {
          ...createInitialFormData(),
          ...leaveData,
          employeeId: leaveData.employeeId || employeeId,
          employeeName: leaveData.employeeName || employeeName,
          WorkerRecId: leaveData.WorkerRecId || WorkerRecId,
          leaveCategory: normalizedLeaveCategory, // Use normalized category
        };

        console.log(
          'Setting edit form data with normalized category:',
          normalizedLeaveCategory,
        );
        setFormData(editFormData);

        // Fetch balance for the existing record
        if (
          (leaveData?.employeeId || employeeId) &&
          leaveData?.leaveCode &&
          leaveData?.leaveStartDate
        ) {
          fetchLeaveBalance(
            leaveData?.employeeId || employeeId,
            leaveData?.leaveCode,
            leaveData?.leaveStartDate,
            companyToUse,
          )
            .then(balance => {
              setFormData(prev => ({
                ...prev,
                balance: balance || '0.00',
              }));
            })
            .catch(error => {
              console.error('Error fetching balance for edit mode:', error);
              setFormData(prev => ({
                ...prev,
                balance: '0.00',
              }));
            });
        }
      } else {
      }
    }, [
      mode,
      leaveData?.recId,
      employeeId,
      employeeName,
      WorkerRecId,
      leaveData?.leaveCategory,
    ]),
  );

  const handleRefresh = async () => {
    setIsLoading(true);

    try {
      clearFormData();

      const codes = await fetchLeaveCodes(formData.employeeId, companyToUse);
      setLeaveCodesForEmployee(codes);
    } catch (error) {
      console.error('Error in Save Record Screen', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const leaveCategoryOptions = [
    {label: 'Full Leave', value: 'Full Leave'},
    {label: 'Half Leave', value: 'Half Leave'},
  ];

  const formatToISOWithTime = date => {
    const baseDate = new Date(date);
    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, '0');
    const day = String(baseDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T12:00:00`;
  };

  const handleDateChange = async date => {
    const formatted = formatToISOWithTime(date);

    setFormData(prev => ({
      ...prev,
      leaveStartDate: formatted,
    }));

    if (formData.employeeId && formData.leaveCode) {
      try {
        const balanceData = await fetchLeaveBalance(
          formData.employeeId,
          formData.leaveCode,
          formatted,
          companyToUse,
        );

        const newBalance = balanceData || '0.00';
        const numericBalance = parseFloat(newBalance);

        const effectiveLeaveDays =
          formData.leaveCategory === 'Half Leave' ? '0.5' : formData.leaveDays;

        setFormData(prev => ({
          ...prev,
          balance: newBalance,
          ...(numericBalance > 0 && effectiveLeaveDays
            ? {
                leaveEndDate: calculateEndDate(formatted, effectiveLeaveDays),
              }
            : {}),
        }));
      } catch (error) {
        console.error('Error fetching leave balance:', error);
        setFormData(prev => ({
          ...prev,
          balance: '0.00',
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        balance: '0.00',
      }));
    }
  };

  const calculateEndDate = (startDate, days) => {
    const daysNum = parseFloat(days) || 0;
    if (daysNum <= 0) return '';

    const start = new Date(startDate);
    const endDate = new Date(start);

    if (daysNum === 0.5) {
      return formatToISOWithTime(start);
    } else {
      endDate.setDate(start.getDate() + daysNum - 1);
      return formatToISOWithTime(endDate);
    }
  };

  const handleLeaveDaysChange = value => {
    if (formData.leaveCategory === 'Half Leave') {
      return;
    }

    const leaveDays = parseFloat(value) || 0;
    const balance = parseFloat(formData.balance) || 0;

    if (leaveDays <= balance) {
      setFormData(prev => ({
        ...prev,
        leaveDays: leaveDays.toString(),
        ...(balance > 0 && prev.leaveStartDate
          ? {
              leaveEndDate: calculateEndDate(prev.leaveStartDate, leaveDays),
            }
          : {}),
      }));
    } else {
      setAlertMessage('Leave Days cannot exceed the available balance.');
      setAlertModal(true);
    }
  };

  // Updated function to handle leave category change
  const handleLeaveCategoryChange = async item => {
    const newLeaveCategory = item.value;

    console.log('Leave category changed to:', newLeaveCategory);

    // Reset form to default state but keep employee info and selected category
    const resetForm = {
      ...createInitialFormData(),
      employeeId: formData.employeeId,
      employeeName: formData.employeeName,
      WorkerRecId: formData.WorkerRecId,
      leaveCategory: newLeaveCategory,
      leaveDays: newLeaveCategory === 'Half Leave' ? '0.5' : '',
    };

    setFormData(resetForm);
  };

  const handleLeaveCodeChange = async item => {
    const newLeaveCode = item.value;

    const resetForm = {
      ...createInitialFormData(),
      employeeId: formData.employeeId,
      employeeName: formData.employeeName,
      WorkerRecId: formData.WorkerRecId,
      leaveCode: newLeaveCode,
      leaveCategory: formData.leaveCategory,
      leaveDays:
        formData.leaveCategory === 'Half Leave' ? '0.5' : formData.leaveDays,
    };

    setFormData(resetForm);

    const effectiveStartDate =
      formData.leaveStartDate || new Date().toISOString().split('T')[0];

    try {
      const balanceData = await fetchLeaveBalance(
        formData.employeeId,
        newLeaveCode,
        effectiveStartDate,
        companyToUse,
      );
      setFormData(prev => ({
        ...prev,
        balance: balanceData || '0.00',
      }));
    } catch (error) {
      console.error('Error fetching leave balance:', error);
      setFormData(prev => ({
        ...prev,
        balance: '0.00',
      }));
    }
  };

  const fetchLeaveCodesForEmployee = async () => {
    try {
      const codes = await fetchLeaveCodes(
        leaveData?.employeeId || employeeId,
        companyToUse,
      );
      setLeaveCodesForEmployee(codes);
    } catch (error) {
      setAlertMessage('Failed to fetch leave codes.');
      setAlertModal(true);
    }
  };

  const formatDate = date =>
    date
      ? new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
      : '';

  const getLeaveCategoryCode = categoryName => {
    return categoryName === 'Full Leave'
      ? 'FullLeave'
      : categoryName === 'Half Leave'
      ? 'HalfLeave'
      : 'FullLeave';
  };

  const convertDateFormat = date => {
    const d = new Date(date);
    return `${d.getFullYear()}-${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}T12:00:00`;
  };

  const handleAction = async (actionType, modalMode, data = {}) => {
    try {
      const formattedLeaveReqDate = `${
        new Date().toISOString().split('T')[0]
      }T12:00:00`;

      const leavesData = {
        LeaveCode: data.leaveCode,
        LeaveDays: data.leaveDays.toString(),
        LeaveCategory: getLeaveCategoryCode(data.leaveCategory),
        Balance: data.balance.toString(),
        LeaveStartDate: data.leaveStartDate,
        LeaveEndDate: convertDateFormat(data.leaveEndDate),
        LeaveReqDate: formattedLeaveReqDate,
        Reason: data.reason,
        EmployeeId: data.employeeId,
        RecId: data.recId === '' ? '0' : data.recId,
      };

      if (!leavesData.LeaveCode || !leavesData.LeaveEndDate) {
        setAlertMessage('Leave Code and End Date are required.');
        setAlertModal(true);
        return false;
      }

      let response;
      if (modalMode === 'create') {
        response = await createLeaveRequest({
          leaveData: leavesData,
          companyToUse: companyToUse,
        });
        if (actionType === 'submit') {
          await SubmitLeaveRequest({
            recId: response.RecId,
            companyToUse: companyToUse,
          });
        }
      } else {
        response = await UpdateLeaveRequest({
          leaveData: leavesData,
          companyToUse: companyToUse,
        });
        if (actionType === 'submit') {
          await SubmitLeaveRequest({
            recId: response.RecId,
            companyToUse: companyToUse,
          });
        }
      }

      console.log('API Response:', response);

      const isSuccess =
        response.IsSuccess === true || response.IsSuccess === 'true';

      if (isSuccess) {
        setAlertMessage(
          actionType === 'submit'
            ? `${
                modalMode === 'create' ? 'Created' : 'Updated'
              } and Submitted Successfully`
            : `${modalMode === 'create' ? 'Created' : 'Updated'} Successfully`,
        );
        setAlertModal(true);
        return {success: true, recId: response.RecId};
      } else {
        const errorMessage = response.Message || 'Operation Failed';
        setAlertMessage(errorMessage);
        setAlertModal(true);
        return {success: false, message: errorMessage};
      }
    } catch (error) {
      console.error('Error in handleAction:', error);
      setAlertMessage('An error occurred while processing the request.');
      setAlertModal(true);
      return {success: false, message: 'Network or server error'};
    }
  };

  const handleSave = async actionType => {
    if (isSubmitting) return;

    const missingFields = [];

    if (!formData.leaveCode) missingFields.push('Leave Code');
    if (!formData.leaveCategory) missingFields.push('Leave Category');
    if (!formData.leaveStartDate) missingFields.push('Leave Start Date');
    if (!formData.leaveDays) {
      missingFields.push('Leave Days');
    } else if (Number(formData.leaveDays) === 0) {
      missingFields.push('Leave Days cannot be 0');
    }

    if (missingFields.length > 0) {
      const message =
        'Please fill in the following required fields:\n' +
        missingFields.join('\n');
      setAlertMessage(message);
      setAlertModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await handleAction(
        actionType,
        mode === 'edit' ? 'update' : 'create',
        formData,
      );

      if (result.success) {
        // Clear form data after successful operation
        setTimeout(() => {
          setAlertModal(false);

          // Clear the form data
          clearFormData();

          // Navigate to LeavesListPage after successful create/update
          navigation.navigate('LeavesListPage', {
            employeeId: formData.employeeId,
            employeeName: formData.employeeName,
            WorkerRecId: formData.WorkerRecId,
            highlightRecId: result.recId,
            cameFrom: mode === 'create' ? 'CreateSuccess' : 'UpdateSuccess',
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving leave request:', error);
      setAlertMessage('Failed to save leave request. Please try again.');
      setAlertModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const isLeaveDaysDisabled = formData.leaveCategory === 'Half Leave';

  return (
    <ActionPaneContainer
      pageTitle={mode === 'edit' ? 'Edit' : 'Create'}
      isBackButton={true} // Use drawer instead of back button
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      onBackPress={goBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={{}}>
      {/* Show loading indicator when isLoading is true */}
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior="padding"
            style={styles.contentWrapper}>
            <ScrollView contentContainerStyle={styles.formContainer}>
              <Text style={styles.label}>Employee Name</Text>
              <Text style={[styles.input, styles.disabled]}>
                {formData.employeeName}
              </Text>
              <Text style={styles.label}>Request Date</Text>
              <Text style={[styles.input, styles.disabled]}>
                {formatDate(today)}
              </Text>
              <Text style={styles.label}>Leave Category *</Text>
              <Dropdown
                style={styles.input}
                data={leaveCategoryOptions}
                labelField="label"
                valueField="value"
                placeholder="Select Leave Category"
                value={formData.leaveCategory}
                itemTextStyle={{color: '#707070ff', fontSize: 16}}
                onChange={handleLeaveCategoryChange}
              />
              <Text style={styles.label}>Leave Code *</Text>
              <Dropdown
                style={styles.input}
                data={LeaveCodesForEmployee}
                labelField="label"
                valueField="value"
                placeholder="Select Leave Code"
                value={formData.leaveCode}
                itemTextStyle={{color: '#707070ff', fontSize: 16}}
                onFocus={fetchLeaveCodesForEmployee}
                onChange={handleLeaveCodeChange}
              />
              <Text style={styles.label}>Balance</Text>
              <Text style={[styles.input, styles.disabled]}>
                {formData.balance}
              </Text>
              <Text style={styles.label}>Leave Start Date *</Text>
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
                <Icon name="calendar" size={20} color="#0A66C2" />
              </TouchableOpacity>
              <CalendarModal
                visible={showCalendar}
                current={formData.leaveStartDate}
                onDateSelected={handleDateChange}
                onClose={() => setShowCalendar(false)}
              />
              <Text style={styles.label}>Leave Days *</Text>
              <TextInput
                style={[styles.input, isLeaveDaysDisabled && styles.disabled]}
                value={formData.leaveDays.toString()}
                onChangeText={handleLeaveDaysChange}
                keyboardType="numeric"
                placeholder="Enter number of days"
                editable={!isLeaveDaysDisabled}
              />
              <Text style={styles.label}>End Date</Text>
              <Text style={[styles.input, styles.disabled]}>
                {formData.leaveEndDate
                  ? formatDate(formData.leaveEndDate)
                  : 'End date will be calculated'}
              </Text>
              <Text style={styles.label}>Reason</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.reason}
                onChangeText={value => handleInputChange('reason', value)}
                placeholder="Enter reason for leave"
                multiline
                numberOfLines={6}
              />
            </ScrollView>

            <View style={styles.footer}>
              <Pressable
                style={({pressed}) => [
                  styles.button,
                  pressed && styles.pressedButton,
                  isSubmitting && styles.disabledButton,
                ]}
                onPress={() => handleSave('save')}
                disabled={isSubmitting}>
                {({pressed}) => (
                  <Text
                    style={[styles.buttonText, pressed && styles.pressedText]}>
                    {isSubmitting
                      ? 'Processing...'
                      : mode === 'edit'
                      ? 'Update'
                      : 'Create'}
                  </Text>
                )}
              </Pressable>

              <Pressable
                style={({pressed}) => [
                  styles.button,
                  styles.submitButton,
                  pressed && styles.pressedSubmitButton,
                  isSubmitting && styles.disabledButton,
                ]}
                onPress={() => handleSave('submit')}
                disabled={isSubmitting}>
                {({pressed}) => (
                  <Text
                    style={[
                      styles.submitButtonText,
                      pressed && styles.pressedText,
                    ]}>
                    {isSubmitting
                      ? 'Processing...'
                      : mode === 'edit'
                      ? 'Update & Submit'
                      : 'Create & Submit'}
                  </Text>
                )}
              </Pressable>
            </View>
          </KeyboardAvoidingView>

          <AlertModal
            visible={alertModal}
            heading="Alert"
            text={alertMessage}
            onPress={() => {
              setAlertModal(false);
            }}
          />
        </SafeAreaView>
      )}
    </ActionPaneContainer>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.03,
    paddingTop: height * 0.01,
  },
  formContainer: {
    padding: 5,
    paddingBottom: 100,
  },
  label: {
    fontSize: 14,
    marginTop: 12,
    fontWeight: '600',
    color: '#444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#fff',
  },
  disabled: {
    backgroundColor: '#f1f1f1',
    color: '#999',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  dateText: {
    fontSize: 15,
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  button: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#0A66C2',
    borderRadius: 20,
    paddingVertical: 12,
    marginHorizontal: 5,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  submitButton: {
    borderColor: '#0A66C2',
    backgroundColor: '#0A66C2',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontWeight: 'bold',
    color: '#0A66C2',
  },
  submitButtonText: {
    fontWeight: 'bold',
    color: '#ffffffff',
  },
  pressedButton: {
    backgroundColor: '#0A66C2',
  },
  pressedSubmitButton: {
    backgroundColor: '#3d95edff',
    borderColor: '#3d95edff',
  },
  pressedText: {
    color: '#fff',
  },
});

export default LeaveRequestSaveRecord;
