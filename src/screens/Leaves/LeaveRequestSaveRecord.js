/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView,
  BackHandler,
  Platform,
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
// import {SubmitLeaveRequest} from '../../API/Leaves/SubmitLeaveRequest';
import SubmitLeaveRequest from '../../API/Leaves/SubmitLeaveRequest';
import {UpdateLeaveRequest} from '../../API/Leaves/UpdateLeaveRequest';

import AlertModal from '../../components/Alert/AlertModal';
import CalendarModal from '../../components/Leaves/CalendarModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import SaveRecordButtons from '../../components/Buttons/SaveRecordButtons';
import styles from '../../styles/styles';

const LeaveRequestSaveRecord = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);

  const userData = useSelector(state => state.user.userData);
  const routeUserData = route.params?.userData;
  const effectiveUserData = routeUserData || userData || {};

  // Navigation params with safe defaults
  const {
    mode = 'create',
    leaveData = {},
    employeeId = leaveData.employeeId || effectiveUserData?.employeeId || '',
    employeeName = leaveData.employeeName ||
      effectiveUserData?.employeeName ||
      '',
    WorkerRecId = leaveData.WorkerRecId || effectiveUserData?.WorkerRecId || '',
    cameFrom = 'MainDashboard',
    originalCameFrom = null,
  } = route.params || {};

  // State declarations
  const [LeaveCodesForEmployee, setLeaveCodesForEmployee] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [processingButton, setProcessingButton] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [originalBalance, setOriginalBalance] = useState(null);

  // Create initial form data function
  const createInitialFormData = () => ({
    recId: !leaveData.recId || leaveData.recId === '0' ? '' : leaveData.recId,
    employeeId: employeeId,
    employeeName: employeeName,
    WorkerRecId: WorkerRecId,
    leaveCode: '',
    leaveCategory: 'Full Day Leave',
    balance: '0.00',
    leaveStartDate: '',
    leaveEndDate: '',
    leaveDays: '',
    reason: '',
  });

  // Form state - Initialize by calling the function
  const [formData, setFormData] = useState(() => createInitialFormData());

  // const goBack = useCallback(() => {
  //   if (cameFrom === 'MainDashboard') {
  //     // Reset stack so only MainDashboard remains
  //     navigation.reset({
  //       index: 0,
  //       routes: [
  //         {
  //           name: 'TabNavigator',
  //           params: {screen: 'MainDashboard'},
  //         },
  //       ],
  //     });
  //   } else if (cameFrom === 'LeavesListPage') {
  //     // Reset stack so only LeavesListPage remains
  //     const targetCameFrom = originalCameFrom || 'DisplayListPage';
  //     navigation.reset({
  //       index: 0,
  //       routes: [
  //         {
  //           name: 'LeavesListPage',
  //           params: {
  //             employeeId,
  //             employeeName,
  //             WorkerRecId,
  //             cameFrom: targetCameFrom,
  //           },
  //         },
  //       ],
  //     });
  //   } else {
  const goBack = useCallback(() => {
    if (cameFrom === 'AttendanceCalendarScreen') {
      navigation.navigate('AttendanceCalendarScreen');
      return;
    } else if (cameFrom === 'AttendanceDetailsScreen') {
      navigation.navigate('AttendanceDetailsScreen');
      return;
    } else if (cameFrom === 'MainDashboard') {
      // Reset stack so only MainDashboard remains
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'TabNavigator',
            params: {screen: 'MainDashboard'},
          },
        ],
      });
    } else if (cameFrom === 'LeavesListPage') {
      // Reset stack so only LeavesListPage remains
      const targetCameFrom = originalCameFrom || 'DisplayListPage';
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'LeavesListPage',
            params: {
              employeeId,
              employeeName,
              WorkerRecId,
              cameFrom: targetCameFrom,
            },
          },
        ],
      });
    } else {
      // Default: just go back one screen in the stack
      navigation.goBack();
    }
  }, [
    navigation,
    cameFrom,
    originalCameFrom,
    employeeId,
    employeeName,
    WorkerRecId,
  ]);

  // Function to normalize leave category for display
  const normalizeLeaveCategoryForDisplay = category => {
    if (!category) return 'Full Day Leave'; // Default to Full Day Leave

    // Handle different formats from API
    switch (category.toLowerCase()) {
      case 'fullleave':
      case 'full leave':
      case 'full day leave':
        return 'Full Day Leave';
      case 'halfleave':
      case 'half leave':
      case 'half day leave':
        return 'Half Day Leave';
      default:
        return 'Full Day Leave';
    }
  };

  // Function to clear form data
  const clearFormData = useCallback(() => {
    const clearedForm = createInitialFormData();
    setFormData(clearedForm);
    setOriginalBalance(null); // Clear original balance
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        goBack();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation]),
  );

  // Reset scroll position when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Scroll to top when screen comes into focus
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({y: 0, animated: false});
      }
    }, []),
  );

  // Reset form data when screen comes into focus and mode changes
  useFocusEffect(
    React.useCallback(() => {
      if (mode === 'create') {
        const freshFormData = createInitialFormData();
        setFormData(freshFormData);
        setOriginalBalance(null); // Clear original balance for create mode
      } else if (mode === 'edit' && leaveData?.recId) {
        const normalizedLeaveCategory = normalizeLeaveCategoryForDisplay(
          leaveData.leaveCategory,
        );

        // Store the original balance to preserve it during updates
        setOriginalBalance(leaveData.balance);

        // Set leaveDays correctly for edit mode
        const editFormData = {
          ...createInitialFormData(),
          ...leaveData,
          employeeId: leaveData.employeeId || employeeId,
          employeeName: leaveData.employeeName || employeeName,
          WorkerRecId: leaveData.WorkerRecId || WorkerRecId,
          leaveCategory: normalizedLeaveCategory,
          leaveDays: leaveData.leaveDays || '',
        };

        setFormData(editFormData);

        // Fetch leave codes first, then balance
        fetchLeaveCodesForEmployee().then(() => {
          if (mode === 'edit' && leaveData?.balance) {
            setFormData(prev => ({
              ...prev,
              balance: leaveData.balance,
            }));
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
      leaveData?.leaveDays,
      leaveData?.balance,
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
    {label: 'Full Day Leave', value: 'Full Day Leave'},
    {label: 'Half Day Leave', value: 'Half Day Leave'},
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

    // Only fetch balance for create mode, not edit mode
    if (mode === 'create' && formData.employeeId && formData.leaveCode) {
      try {
        const balanceData = await fetchLeaveBalance(
          formData.employeeId,
          formData.leaveCode,
          formatted,
        );

        const newBalance = balanceData || '0.00';
        const numericBalance = parseFloat(newBalance);

        const effectiveLeaveDays =
          formData.leaveCategory === 'Half Day Leave'
            ? '0.5'
            : formData.leaveDays;

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
    } else if (mode === 'edit') {
      // For edit mode, preserve the original balance and just recalculate end date
      if (formData.leaveDays) {
        setFormData(prev => ({
          ...prev,
          leaveEndDate: calculateEndDate(formatted, formData.leaveDays),
          balance: originalBalance || prev.balance,
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
    if (formData.leaveCategory === 'Half Day Leave') {
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

  // Updated function to handle leave category change and prevent balance modification
  const handleLeaveCategoryChange = async item => {
    const newLeaveCategory = item.value;

    // Store current balance and other important data to preserve them
    const currentBalance = originalBalance || formData.balance; // Use original balance if available
    const currentLeaveCode = formData.leaveCode;
    const currentStartDate = formData.leaveStartDate;

    // Reset form to default state but keep employee info and selected category
    const resetForm = {
      ...createInitialFormData(),
      employeeId: formData.employeeId,
      employeeName: formData.employeeName,
      WorkerRecId: formData.WorkerRecId,
      leaveCategory: newLeaveCategory,
      leaveDays: newLeaveCategory === 'Half Day Leave' ? '0.5' : '',
      balance: currentBalance || '0.00',
      leaveCode: currentLeaveCode || '',
      leaveStartDate: currentStartDate || '',
    };

    setFormData(resetForm);

    // Calculate end date if we have all required data and preserve balance
    if (currentStartDate && newLeaveCategory === 'Half Day Leave') {
      setFormData(prev => ({
        ...prev,
        leaveEndDate: calculateEndDate(currentStartDate, '0.5'),
        balance: currentBalance || prev.balance, // Ensure balance is preserved
      }));
    }
  };

  const handleLeaveCodeChange = async item => {
    const newLeaveCode = item.value;

    // Store current values to preserve them if needed
    const currentCategory = formData.leaveCategory;
    const currentStartDate = formData.leaveStartDate;
    const currentBalance = originalBalance || formData.balance;

    const resetForm = {
      ...createInitialFormData(),
      employeeId: formData.employeeId,
      employeeName: formData.employeeName,
      WorkerRecId: formData.WorkerRecId,
      leaveCode: newLeaveCode,
      leaveCategory: currentCategory,
      leaveDays:
        currentCategory === 'Half Day Leave' ? '0.5' : formData.leaveDays,
      leaveStartDate: currentStartDate,
    };

    setFormData(resetForm);

    // Only fetch balance for create mode
    if (mode === 'create') {
      const effectiveStartDate =
        currentStartDate || new Date().toISOString().split('T')[0];

      try {
        const balanceData = await fetchLeaveBalance(
          formData.employeeId,
          newLeaveCode,
          effectiveStartDate,
        );

        // Set balance and ensure it doesn't get modified by half leave selection
        const newBalance = balanceData || '0.00';
        setFormData(prev => ({
          ...prev,
          balance: newBalance,
        }));
      } catch (error) {
        console.error('Error fetching leave balance:', error);
        setFormData(prev => ({
          ...prev,
          balance: '0.00',
        }));
      }
    } else {
      // For edit mode, preserve the original balance
      setFormData(prev => ({
        ...prev,
        balance: currentBalance || '0.00',
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

  const formatDate = date => {
    if (!date) return '';
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear(); // always 4 digits
    return `${month}/${day}/${year}`;
  };

  const getLeaveCategoryCode = categoryName => {
    return categoryName === 'Full Day Leave'
      ? 'FullLeave'
      : categoryName === 'Half Day Leave'
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

      // For edit mode, preserve the original balance instead of current form balance
      const balanceToUse =
        mode === 'edit' && originalBalance ? originalBalance : data.balance;

      const leavesData = {
        LeaveCode: data.leaveCode,
        LeaveDays: data.leaveDays.toString(),
        LeaveCategory: getLeaveCategoryCode(data.leaveCategory),
        Balance: balanceToUse.toString(),
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
    // const listPageCameFrom = originalCameFrom || 'DisplayListPage';

    if (!formData.leaveCode) missingFields.push('Leave Code');
    if (!formData.leaveStartDate) missingFields.push('Leave Start Date');
    if (!formData.leaveDays) {
      missingFields.push('Leave Days');
    } else if (Number(formData.leaveDays) === 0) {
      missingFields.push('Leave Days cannot be 0');
    }

    // Leave Category validation as it will always have a default value
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
            userData: route.params?.userData || {
              employeeId: formData.employeeId,
              employeeName: formData.employeeName,
              WorkerRecId: formData.WorkerRecId,
            },
            highlightRecId: result.recId,
            cameFrom: originalCameFrom || 'DisplayListPage',
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
  const isLeaveDaysDisabled = formData.leaveCategory === 'Half Day Leave';

  return (
    <ActionPaneContainer
      pageTitle={
        mode === 'edit' ? 'Edit Leave Request' : 'Create Leave Request'
      }
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
        <SafeAreaView style={styles.LReqSR_SafeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.LReqSR_ContentWrapper}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={[
                styles.LReqSR_FormContainer,
                // {paddingBottom: 20},
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}>
              <Text style={styles.LReqSR_Label}>Employee Name</Text>
              <Text style={[styles.LReqSR_Input, styles.LReqSR_Disabled]}>
                {formData.employeeName}
              </Text>

              <Text style={styles.LReqSR_Label}>Request Date</Text>
              <Text style={[styles.LReqSR_Input, styles.LReqSR_Disabled]}>
                {formatDate(today)}
              </Text>

              <Text style={styles.LReqSR_Label}>Leave Category</Text>
              <Dropdown
                style={styles.LReqSR_Input}
                data={leaveCategoryOptions}
                labelField="label"
                valueField="value"
                placeholder="Select Leave Category"
                value={formData.leaveCategory}
                onChange={handleLeaveCategoryChange}
                placeholderStyle={styles.LReqSR_DropdownPlaceholder}
                selectedTextStyle={styles.LReqSR_DropdownSelectedText}
                itemTextStyle={styles.LReqSR_DropdownItemText}
                activeColor="#E6F0FF"
                containerStyle={[
                  styles.LReqSR_DropdownContainer,
                  {
                    marginTop: Platform.OS === 'ios' ? 5 : 2,
                    zIndex: 1000,
                  },
                ]}
                itemContainerStyle={styles.LReqSR_DropdownItemContainer}
                maxHeight={280}
                dropdownPosition="auto"
                // search
                // searchPlaceholder="Search Leave Category"
                // inputSearchStyle={styles.LReqSR_DropdownSearchInput}
                // iconStyle={styles.LReqSR_DropdownIcon}
              />

              <Text style={styles.LReqSR_Label}>Leave Code *</Text>
              <Dropdown
                style={styles.LReqSR_Input}
                data={LeaveCodesForEmployee}
                labelField="label"
                valueField="value"
                placeholder="Select Leave Code"
                value={formData.leaveCode}
                onFocus={fetchLeaveCodesForEmployee}
                onChange={handleLeaveCodeChange}
                placeholderStyle={styles.LReqSR_DropdownPlaceholder}
                selectedTextStyle={styles.LReqSR_DropdownSelectedText}
                itemTextStyle={styles.LReqSR_DropdownItemText}
                activeColor="#E6F0FF"
                containerStyle={[
                  styles.LReqSR_DropdownContainer,
                  {
                    marginTop: Platform.OS === 'ios' ? 5 : 2,
                    zIndex: 999,
                  },
                ]}
                itemContainerStyle={styles.LReqSR_DropdownItemContainer}
                maxHeight={280}
                dropdownPosition="auto"
                search
                searchPlaceholder="Search Leave Code"
                inputSearchStyle={styles.LReqSR_DropdownSearchInput}
                iconStyle={styles.LReqSR_DropdownIcon}
                keyboardAvoiding={true}
              />

              <Text style={styles.LReqSR_Label}>Balance</Text>
              <Text style={[styles.LReqSR_Input, styles.LReqSR_Disabled]}>
                {formData.balance}
              </Text>

              <Text style={styles.LReqSR_Label}>Leave Start Date *</Text>
              <TouchableOpacity
                style={styles.LReqSR_DateSelector}
                onPress={() => setShowCalendar(true)}>
                <View style={{flex: 1}}>
                  <Text style={styles.LReqSR_DateText}>
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

              <Text style={styles.LReqSR_Label}>Leave Days *</Text>
              <TextInput
                style={[
                  styles.LReqSR_Input,
                  isLeaveDaysDisabled && styles.LReqSR_Disabled,
                ]}
                value={formData.leaveDays.toString()}
                onChangeText={handleLeaveDaysChange}
                keyboardType="numeric"
                placeholder="Enter number of days"
                editable={!isLeaveDaysDisabled}
              />

              <Text style={styles.LReqSR_Label}>Leave End Date</Text>
              <Text style={[styles.LReqSR_Input, styles.LReqSR_Disabled]}>
                {formData.leaveEndDate
                  ? formatDate(formData.leaveEndDate)
                  : 'End date will be calculated'}
              </Text>

              <Text style={styles.LReqSR_Label}>Reason</Text>
              <TextInput
                style={[styles.LReqSR_Input, styles.LReqSR_TextArea]}
                value={formData.reason}
                onChangeText={value => handleInputChange('reason', value)}
                placeholder="Enter reason for leave"
                multiline
                numberOfLines={6}
              />
            </ScrollView>

            <SaveRecordButtons
              mode={mode}
              processingButton={processingButton}
              onSave={handleSave}
              onCancel={goBack}
              isDisabled={
                processingButton === 'save' || processingButton === 'submit'
              }
            />
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
