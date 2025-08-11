/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
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
import {styles} from '../../styles/styles';

const LeaveRequestSaveRecord = () => {
  const route = useRoute();
  const navigation = useNavigation();

  const {userData} = useSelector(state => state.user);

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
  const [processingButton, setProcessingButton] = useState(''); // Track which button is processing
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

        // Fetch leave codes first, then balance
        fetchLeaveCodesForEmployee().then(() => {
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
        });
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

      const codes = await fetchLeaveCodes(formData.employeeId);
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
      const codes = await fetchLeaveCodes(leaveData?.employeeId || employeeId);
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
        });
        if (actionType === 'submit') {
          await SubmitLeaveRequest({
            recId: response.RecId,
          });
        }
      } else {
        response = await UpdateLeaveRequest({
          leaveData: leavesData,
        });
        if (actionType === 'submit') {
          await SubmitLeaveRequest({
            recId: response.RecId,
          });
        }
      }

      console.log('API Response:', response);

      const isSuccess =
        response.IsSuccess === true || response.IsSuccess === 'true';

      if (isSuccess) {
        const actionText = modalMode === 'create' ? 'Created' : 'Updated';
        const submitText = actionType === 'submit' ? ' and Submitted' : '';
        setAlertMessage(
          `${data.leaveCode} is ${actionText}${submitText} Successfully`,
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
    if (processingButton) return; // Prevent multiple clicks

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

    setProcessingButton(actionType);

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
      setProcessingButton('');
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const isLeaveDaysDisabled = formData.leaveCategory === 'Half Leave';

  return (
    <ActionPaneContainer
      pageTitle={mode === 'edit' ? 'Edit' : 'Create'}
      isBackButton={true}
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
        <SafeAreaView style={styles.LeaveReqSRSafeArea}>
          <KeyboardAvoidingView
            behavior="padding"
            style={styles.LeaveReqSRContentWrapper}>
            <ScrollView contentContainerStyle={styles.LeaveReqSRFormContainer}>
              <Text style={styles.LeaveReqSRLabel}>Employee Name</Text>
              <Text style={[styles.LeaveReqSRInput, styles.LeaveReqSRDisabled]}>
                {formData.employeeName}
              </Text>
              <Text style={styles.LeaveReqSRLabel}>Request Date</Text>
              <Text style={[styles.LeaveReqSRInput, styles.LeaveReqSRDisabled]}>
                {formatDate(today)}
              </Text>
              <Text style={styles.LeaveReqSRLabel}>Leave Category *</Text>
              <Dropdown
                style={styles.LeaveReqSRInput}
                data={leaveCategoryOptions}
                labelField="label"
                valueField="value"
                placeholder="Select Leave Category"
                value={formData.leaveCategory}
                onChange={handleLeaveCategoryChange}
                placeholderStyle={{color: '#444'}}
                selectedTextStyle={{color: '#444'}}
                itemTextStyle={{color: '#444'}}
                search
                searchPlaceholder="Search Leave Category..."
              />
              <Text style={styles.LeaveReqSRLabel}>Leave Code *</Text>
              <Dropdown
                style={styles.LeaveReqSRInput}
                data={LeaveCodesForEmployee}
                labelField="label"
                valueField="value"
                placeholder="Select Leave Code"
                value={formData.leaveCode}
                onFocus={fetchLeaveCodesForEmployee}
                onChange={handleLeaveCodeChange}
                placeholderStyle={{color: '#444'}}
                selectedTextStyle={{color: '#444'}}
                itemTextStyle={{color: '#444'}}
                search
                searchPlaceholder="Search Leave Code..."
              />
              <Text style={styles.LeaveReqSRLabel}>Balance</Text>
              <Text style={[styles.LeaveReqSRInput, styles.LeaveReqSRDisabled]}>
                {formData.balance}
              </Text>
              <Text style={styles.LeaveReqSRLabel}>Leave Start Date *</Text>
              <TouchableOpacity
                style={styles.LeaveReqSRDateSelector}
                onPress={() => setShowCalendar(true)}>
                <View style={{flex: 1}}>
                  <Text style={styles.LeaveReqSRDateText}>
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
              <Text style={styles.LeaveReqSRLabel}>Leave Days *</Text>
              <TextInput
                style={[
                  styles.LeaveReqSRInput,
                  isLeaveDaysDisabled && styles.LeaveReqSRDisabled,
                ]}
                value={formData.leaveDays.toString()}
                onChangeText={handleLeaveDaysChange}
                keyboardType="numeric"
                placeholder="Enter number of days"
                editable={!isLeaveDaysDisabled}
              />
              <Text style={styles.LeaveReqSRLabel}>End Date</Text>
              <Text style={[styles.LeaveReqSRInput, styles.LeaveReqSRDisabled]}>
                {formData.leaveEndDate
                  ? formatDate(formData.leaveEndDate)
                  : 'End date will be calculated'}
              </Text>
              <Text style={styles.LeaveReqSRLabel}>Reason</Text>
              <TextInput
                style={[styles.LeaveReqSRInput, styles.LeaveReqSRTextArea]}
                value={formData.reason}
                onChangeText={value => handleInputChange('reason', value)}
                placeholder="Enter reason for leave"
                multiline
                numberOfLines={6}
              />
            </ScrollView>

            <View style={styles.LeaveReqSRFooter}>
              <Pressable
                style={({pressed}) => [
                  styles.button,
                  pressed && styles.pressedButton,
                  (processingButton === 'save' ||
                    processingButton === 'submit') &&
                    styles.disabledButton,
                ]}
                onPress={() => handleSave('save')}
                disabled={
                  processingButton === 'save' || processingButton === 'submit'
                }>
                {({pressed}) => (
                  <Text
                    style={[styles.buttonText, pressed && styles.pressedText]}>
                    {processingButton === 'save'
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
                  (processingButton === 'save' ||
                    processingButton === 'submit') &&
                    styles.disabledButton,
                ]}
                onPress={() => handleSave('submit')}
                disabled={
                  processingButton === 'save' || processingButton === 'submit'
                }>
                {({pressed}) => (
                  <Text
                    style={[
                      styles.LeaveReqSRSubmitButtonText,
                      pressed && styles.LeaveReqSRpressedText,
                    ]}>
                    {processingButton === 'submit'
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

export default LeaveRequestSaveRecord;
