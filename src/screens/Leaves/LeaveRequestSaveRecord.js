/* eslint-disable curly */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
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
  I18nManager,
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
import SubmitLeaveRequest from '../../API/Leaves/SubmitLeaveRequest';
import {UpdateLeaveRequest} from '../../API/Leaves/UpdateLeaveRequest';
import {GetLeaveBalance} from '../../API/Leaves/LeaveBalance';
import {GetEmployeeQuota} from '../../API/Leaves/GetEmployeeQuota';
import {GetLeaveDays} from '../../API/Leaves/GetLeaveDays';
import {GetLeaveLabels} from '../../API/Leaves/GetLeaveLabels';

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

  const isRTL = useSelector(state => state.language.isRTL);

  const userData = useSelector(state => state.user.userData);
  const routeUserData = route.params?.userData;
  const effectiveUserData = routeUserData || userData || {};

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

  const [LeaveCodesForEmployee, setLeaveCodesForEmployee] = useState([]);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [processingButton, setProcessingButton] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [leaveLabelsData, setLeaveLabelsData] = useState({});

  const createInitialFormData = () => ({
    recId: !leaveData.recId || leaveData.recId === '0' ? '' : leaveData.recId,
    employeeId: employeeId,
    employeeName: employeeName,
    WorkerRecId: WorkerRecId,
    leaveCode: '',
    leaveCategory: 'Full Day Leave',
    balance: '0.00',
    quota: '0.00',
    eligibility: '0.00',
    leaveStartDate: '',
    leaveEndDate: '',
    leaveDays: '',
    reason: '',
  });

  const [formData, setFormData] = useState(() => createInitialFormData());

  // Define navigation constants (could be in a separate file)
  const NAVIGATION_SCREENS = {
    ATTENDANCE_CALENDAR: 'AttendanceCalendarScreen',
    ATTENDANCE_DETAILS: 'AttendanceDetailsScreen',
    MAIN_DASHBOARD: 'MainDashboard',
    LEAVES_LIST: 'LeavesListPage',
    TAB_NAVIGATOR: 'TabNavigator',
    DISPLAY_LIST: 'DisplayListPage',
  };

  const goBack = useCallback(() => {
    try {
      switch (cameFrom) {
        case NAVIGATION_SCREENS.ATTENDANCE_CALENDAR:
        case NAVIGATION_SCREENS.ATTENDANCE_DETAILS:
          navigation.navigate(cameFrom);
          break;

        case NAVIGATION_SCREENS.MAIN_DASHBOARD:
          navigation.reset({
            index: 0,
            routes: [
              {
                name: NAVIGATION_SCREENS.TAB_NAVIGATOR,
                params: {screen: NAVIGATION_SCREENS.MAIN_DASHBOARD},
              },
            ],
          });
          break;

        case NAVIGATION_SCREENS.LEAVES_LIST:
          navigation.reset({
            index: 0,
            routes: [
              {
                name: NAVIGATION_SCREENS.LEAVES_LIST,
                params: {
                  employeeId,
                  employeeName,
                  WorkerRecId,
                  cameFrom: originalCameFrom || NAVIGATION_SCREENS.DISPLAY_LIST,
                },
              },
            ],
          });
          break;

        default:
          // Check if we can actually go back
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            // Navigate to a safe default screen
            navigation.navigate(NAVIGATION_SCREENS.MAIN_DASHBOARD);
          }
          break;
      }
    } catch (error) {
      console.error('Navigation error in goBack:', error);
      // Last resort fallback
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate(NAVIGATION_SCREENS.MAIN_DASHBOARD);
      }
    }
  }, [
    navigation,
    cameFrom,
    originalCameFrom,
    employeeId,
    employeeName,
    WorkerRecId,
  ]);

  // const goBack = useCallback(() => {
  //   if (cameFrom === 'AttendanceCalendarScreen') {
  //     navigation.navigate('AttendanceCalendarScreen');
  //     return;
  //   } else if (cameFrom === 'AttendanceDetailsScreen') {
  //     navigation.navigate('AttendanceDetailsScreen');
  //     return;
  //   } else if (cameFrom === 'MainDashboard') {
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
  //     navigation.goBack();
  //   }
  // }, [
  //   navigation,
  //   cameFrom,
  //   originalCameFrom,
  //   employeeId,
  //   employeeName,
  //   WorkerRecId,
  // ]);

  const normalizeLeaveCategoryForDisplay = category => {
    if (!category) return 'Full Day Leave';

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

  const clearFormData = useCallback(() => {
    const clearedForm = createInitialFormData();
    setFormData(clearedForm);
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

  useFocusEffect(
    React.useCallback(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({y: 0, animated: false});
      }
    }, []),
  );

  const fetchLeaveLabels = async () => {
    try {
      const labels = await GetLeaveLabels();
      setLeaveLabelsData(labels || {});
    } catch (error) {
      console.error('Error fetching leave labels:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchLeaveLabels();

      if (mode === 'create') {
        const freshFormData = createInitialFormData();
        setFormData(freshFormData);
      } else if (mode === 'edit' && leaveData?.recId) {
        const normalizedLeaveCategory = normalizeLeaveCategoryForDisplay(
          leaveData.leaveCategory,
        );

        const editFormData = {
          ...createInitialFormData(),
          ...leaveData,
          employeeId: leaveData.employeeId || employeeId,
          employeeName: leaveData.employeeName || employeeName,
          WorkerRecId: leaveData.WorkerRecId || WorkerRecId,
          leaveCategory: normalizedLeaveCategory,
          leaveDays: leaveData.leaveDays || '',
          balance: leaveData.balance || '0.00',
          quota: leaveData.quota || '0.00',
          eligibility: leaveData.eligibility || '0.00',
        };

        setFormData(editFormData);

        fetchLeaveCodesForEmployee();
      }
    }, [mode, leaveData?.recId, employeeId, employeeName, WorkerRecId]),
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
    {
      label: 'Full Day Leave',
      value: 'Full Day Leave',
    },
    {
      label: 'Half Day Leave',
      value: 'Half Day Leave',
    },
  ];

  const formatToISOWithTime = date => {
    const baseDate = new Date(date);
    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, '0');
    const day = String(baseDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T12:00:00`;
  };

  const fetchBalanceQuotaEligibility = async (leaveCode, startDate) => {
    try {
      const effectiveStartDate = startDate || formatToISOWithTime(new Date());
      const leaveRequestId = mode === 'edit' ? formData.recId : '';

      const balanceResult = await GetLeaveBalance({
        employeeId: formData.employeeId,
        leaveCode: leaveCode,
        leaveStartDate: effectiveStartDate,
        leaveRequestId: leaveRequestId,
      });

      const quotaResult = await GetEmployeeQuota({
        employeeId: formData.employeeId,
        leaveCode: leaveCode,
        leaveStartDate: effectiveStartDate,
        leaveRecId: leaveRequestId || '0',
      });

      const balance =
        balanceResult !== null ? balanceResult.toString() : '0.00';
      const quota = quotaResult !== null ? quotaResult.toString() : '0.00';

      const balanceNum = parseFloat(balance) || 0;
      const quotaNum = parseFloat(quota) || 0;
      const eligibility = Math.max(balanceNum, quotaNum).toString();

      setFormData(prev => ({
        ...prev,
        balance: balance,
        quota: quota,
        eligibility: eligibility,
      }));
    } catch (error) {
      console.error('Error fetching balance/quota/eligibility:', error);
      setFormData(prev => ({
        ...prev,
        balance: '0.00',
        quota: '0.00',
        eligibility: '0.00',
      }));
    }
  };

  const fetchLeaveDaysFromAPI = async (startDate, endDate) => {
    try {
      const leaveDaysResult = await GetLeaveDays({
        employeeId: formData.WorkerRecId,
        leaveCode: formData.leaveCode,
        leaveStartDate: startDate,
        leaveEndDate: endDate,
      });

      const leaveDays =
        leaveDaysResult !== null ? leaveDaysResult.toString() : '0';

      setFormData(prev => ({
        ...prev,
        leaveDays: leaveDays,
      }));

      await fetchBalanceQuotaEligibility(formData.leaveCode, startDate);
    } catch (error) {
      console.error('Error fetching leave days:', error);
      setFormData(prev => ({
        ...prev,
        leaveDays: '0',
      }));
    }
  };

  const handleStartDateChange = async date => {
    const formatted = formatToISOWithTime(date);

    setFormData(prev => ({
      ...prev,
      leaveStartDate: formatted,
    }));

    if (formData.leaveEndDate && formData.leaveCode) {
      await fetchLeaveDaysFromAPI(formatted, formData.leaveEndDate);
    }
  };

  const handleEndDateChange = async date => {
    const formatted = formatToISOWithTime(date);

    if (formData.leaveStartDate) {
      const startDate = new Date(formData.leaveStartDate);
      const endDate = new Date(formatted);

      if (endDate < startDate) {
        setAlertMessage('Leave End Date cannot be before Leave Start Date.');
        setAlertModal(true);

        setFormData(prev => ({
          ...prev,
          leaveEndDate: '',
          leaveDays: '',
        }));

        setShowEndCalendar(false);
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      leaveEndDate: formatted,
    }));

    if (formData.leaveStartDate && formData.leaveCode) {
      await fetchLeaveDaysFromAPI(formData.leaveStartDate, formatted);
    }
  };

  const handleLeaveCategoryChange = async item => {
    const newLeaveCategory = item.value;

    setFormData(prev => ({
      ...prev,
      leaveCategory: newLeaveCategory,
    }));
  };

  const handleLeaveCodeChange = async item => {
    const newLeaveCode = item.value;

    setFormData(prev => ({
      ...prev,
      leaveCode: newLeaveCode,
      leaveDays: '',
    }));

    await fetchBalanceQuotaEligibility(newLeaveCode, formData.leaveStartDate);
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
    const year = d.getFullYear();
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

      const leavesData = {
        LeaveCode: data.leaveCode,
        LeaveDays: data.leaveDays.toString(),
        LeaveCategory: getLeaveCategoryCode(data.leaveCategory),
        Balance: data.balance.toString(),
        Eligibility: data.eligibility.toString(),
        Quota: data.quota.toString(),
        LeaveStartDate: data.leaveStartDate,
        LeaveEndDate: data.leaveEndDate,
        LeaveReqDate: formattedLeaveReqDate,
        Reason: data.reason,
        EmployeeId: data.employeeId,
        RecId: data.recId === '' ? '0' : data.recId,
      };

      if (
        !leavesData.LeaveCode ||
        !leavesData.LeaveEndDate ||
        !leavesData.LeaveStartDate
      ) {
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
    if (processingButton) return;

    const missingFields = [];

    if (!formData.leaveCode) missingFields.push('Leave Code');
    if (!formData.leaveStartDate) missingFields.push('Leave Start Date');
    if (!formData.leaveEndDate) missingFields.push('Leave End Date');
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
        setTimeout(() => {
          setAlertModal(false);

          clearFormData();

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
              contentContainerStyle={styles.LReqSR_FormContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}>
              {/* Employee Name */}
              <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
                {leaveLabelsData?.EmployeeNameLabel || 'Employee Name'}
              </Text>
              <Text
                style={[
                  styles.LReqSR_Input,
                  styles.LReqSR_Disabled,
                  isRTL && {textAlign: 'left', writingDirection: 'rtl'},
                ]}>
                {formData.employeeName}
              </Text>

              {/* Request Date */}
              <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
                {leaveLabelsData?.LeaveReqDateLabel || 'Request Date'}
              </Text>
              <Text
                style={[
                  styles.LReqSR_Input,
                  styles.LReqSR_Disabled,
                  isRTL && {textAlign: 'left', writingDirection: 'rtl'},
                ]}>
                {formatDate(today)}
              </Text>

              {/* Leave Category Label */}
              <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
                {leaveLabelsData?.LeaveCategoryLabel || 'Leave Category'}
              </Text>
              <Dropdown
                style={[styles.LReqSR_Input, isRTL && {textAlign: 'left'}]}
                data={leaveCategoryOptions}
                labelField="label"
                valueField="value"
                placeholder="Select Leave Category"
                value={formData.leaveCategory}
                onChange={handleLeaveCategoryChange}
                placeholderStyle={[
                  styles.LReqSR_DropdownPlaceholder,
                  isRTL && {textAlign: 'left'},
                ]}
                selectedTextStyle={[
                  styles.LReqSR_DropdownSelectedText,
                  isRTL && {textAlign: 'left'},
                ]}
                itemTextStyle={[
                  styles.LReqSR_DropdownItemText,
                  isRTL && {textAlign: 'left'},
                ]}
                activeColor="#E6F0FF"
                containerStyle={[
                  styles.LReqSR_DropdownContainer,
                  {
                    marginTop: Platform.OS === 'ios' ? 5 : 2,
                    zIndex: 1000,
                  },
                ]}
                renderLeftIcon={
                  isRTL
                    ? () => (
                        <Icon
                          name="chevron-down"
                          size={10}
                          color="#8b8b8bff"
                          style={{marginHorizontal: 8}}
                        />
                      )
                    : null
                }
                renderRightIcon={
                  !isRTL
                    ? () => (
                        <Icon
                          name="chevron-down"
                          size={10}
                          color="#8b8b8bff"
                          style={{marginHorizontal: 8}}
                        />
                      )
                    : null
                }
                iconStyle={{width: 0, height: 0}}
                itemContainerStyle={styles.LReqSR_DropdownItemContainer}
                maxHeight={280}
                dropdownPosition="auto"
                inverted={isRTL}
              />

              {/* Leave Code */}
              <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
                {leaveLabelsData?.LeaveCodeLabel || 'Leave Code *'}
              </Text>
              <Dropdown
                style={[styles.LReqSR_Input, isRTL && {textAlign: 'left'}]}
                data={LeaveCodesForEmployee}
                labelField="label"
                valueField="value"
                placeholder="Select Leave Code"
                value={formData.leaveCode}
                onFocus={fetchLeaveCodesForEmployee}
                onChange={handleLeaveCodeChange}
                placeholderStyle={[
                  styles.LReqSR_DropdownPlaceholder,
                  isRTL && {textAlign: 'left'},
                ]}
                selectedTextStyle={[
                  styles.LReqSR_DropdownSelectedText,
                  isRTL && {textAlign: 'left'},
                ]}
                itemTextStyle={[
                  styles.LReqSR_DropdownItemText,
                  isRTL && {textAlign: 'left'},
                ]}
                activeColor="#E6F0FF"
                containerStyle={[
                  styles.LReqSR_DropdownContainer,
                  {marginTop: Platform.OS === 'ios' ? 5 : 2, zIndex: 999},
                ]}
                itemContainerStyle={styles.LReqSR_DropdownItemContainer}
                maxHeight={280}
                dropdownPosition="auto"
                search
                searchPlaceholder="Search Leave Code"
                inputSearchStyle={[
                  styles.LReqSR_DropdownSearchInput,
                  isRTL && {textAlign: 'right'},
                ]}
                renderLeftIcon={
                  isRTL
                    ? () => (
                        <Icon
                          name="chevron-down"
                          size={10}
                          color="#8b8b8bff"
                          style={{marginHorizontal: 8}}
                        />
                      )
                    : null
                }
                renderRightIcon={
                  !isRTL
                    ? () => (
                        <Icon
                          name="chevron-down"
                          size={10}
                          color="#8b8b8bff"
                          style={{marginHorizontal: 8}}
                        />
                      )
                    : null
                }
                iconStyle={{width: 0, height: 0}}
                keyboardAvoiding
                inverted={isRTL}
              />

              {/* Leave Start Date */}
              <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
                {leaveLabelsData?.LeaveStartDateLabel || 'Leave Start Date *'}
              </Text>
              <TouchableOpacity
                style={[
                  styles.LReqSR_DateSelector,
                  isRTL && {flexDirection: 'row'},
                ]}
                onPress={() => setShowStartCalendar(true)}>
                <View style={{flex: 1}}>
                  <Text
                    style={[
                      styles.LReqSR_DateText,
                      isRTL && {textAlign: 'left', writingDirection: 'rtl'},
                    ]}>
                    {formData.leaveStartDate
                      ? formatDate(formData.leaveStartDate)
                      : 'Select Start Date'}
                  </Text>
                </View>
                <Icon name="calendar" size={20} color="#0A66C2" />
              </TouchableOpacity>

              {/* Leave End Date */}
              <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
                {leaveLabelsData?.LeaveEndDateLabel || 'Leave End Date *'}
              </Text>
              <TouchableOpacity
                style={[
                  styles.LReqSR_DateSelector,
                  isRTL && {flexDirection: 'row'},
                ]}
                onPress={() => setShowEndCalendar(true)}>
                <View style={{flex: 1}}>
                  <Text
                    style={[
                      styles.LReqSR_DateText,
                      isRTL && {textAlign: 'left', writingDirection: 'rtl'},
                    ]}>
                    {formData.leaveEndDate
                      ? formatDate(formData.leaveEndDate)
                      : 'Select End Date'}
                  </Text>
                </View>
                <Icon name="calendar" size={20} color="#0A66C2" />
              </TouchableOpacity>

              {/* Leave Days - Disabled */}
              <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
                {leaveLabelsData?.LeaveDaysLabel || 'Leave Days'}
              </Text>
              <Text
                style={[
                  styles.LReqSR_Input,
                  styles.LReqSR_Disabled,
                  isRTL && {textAlign: 'left', writingDirection: 'rtl'},
                ]}>
                {formData.leaveDays || '0'}
              </Text>

              {/* Balance - Disabled */}
              <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
                {leaveLabelsData?.BalanceLabel || 'Balance'}
              </Text>
              <Text
                style={[
                  styles.LReqSR_Input,
                  styles.LReqSR_Disabled,
                  isRTL && {textAlign: 'left', writingDirection: 'rtl'},
                ]}>
                {formData.balance}
              </Text>

              {/* Quota - Disabled */}
              <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
                {leaveLabelsData?.QuotaLabel || 'Quota'}
              </Text>
              <Text
                style={[
                  styles.LReqSR_Input,
                  styles.LReqSR_Disabled,
                  isRTL && {textAlign: 'left', writingDirection: 'rtl'},
                ]}>
                {formData.quota}
              </Text>

              {/* Eligibility - Disabled */}
              <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
                {leaveLabelsData?.EligibilityLabel || 'Eligibility'}
              </Text>
              <Text
                style={[
                  styles.LReqSR_Input,
                  styles.LReqSR_Disabled,
                  isRTL && {textAlign: 'left', writingDirection: 'rtl'},
                ]}>
                {formData.eligibility}
              </Text>

              {/* Reason */}
              <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
                {leaveLabelsData?.ReasonLabel || 'Reason'}
              </Text>
              <TextInput
                style={[
                  styles.LReqSR_Input,
                  styles.LReqSR_TextArea,
                  isRTL && {textAlign: 'right', writingDirection: 'rtl'},
                ]}
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

          <CalendarModal
            visible={showStartCalendar}
            current={formData.leaveStartDate}
            onDateSelected={handleStartDateChange}
            onClose={() => setShowStartCalendar(false)}
          />

          <CalendarModal
            visible={showEndCalendar}
            current={formData.leaveEndDate}
            onDateSelected={handleEndDateChange}
            onClose={() => setShowEndCalendar(false)}
          />

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

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// /* eslint-disable curly */
// /* eslint-disable no-unused-vars */
// /* eslint-disable react-hooks/exhaustive-deps */
// /* eslint-disable react-native/no-inline-styles */
// import React, {useState, useCallback, useRef} from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   KeyboardAvoidingView,
//   ScrollView,
//   SafeAreaView,
//   BackHandler,
//   Platform,
//   I18nManager,
// } from 'react-native';
// import {
//   useNavigation,
//   useRoute,
//   useFocusEffect,
// } from '@react-navigation/native';
// import {useSelector} from 'react-redux';
// import {Dropdown} from 'react-native-element-dropdown';
// import Icon from 'react-native-vector-icons/FontAwesome';

// import {
//   fetchLeaveBalance,
//   fetchLeaveCodes,
// } from '../../Controller/leaveRequestApiService';
// import {createLeaveRequest} from '../../API/Leaves/CreateLeaveRequest';
// import SubmitLeaveRequest from '../../API/Leaves/SubmitLeaveRequest';
// import {UpdateLeaveRequest} from '../../API/Leaves/UpdateLeaveRequest';
// import {GetLeaveBalance} from '../../API/Leaves/LeaveBalance';
// import {GetEmployeeQuota} from '../../API/Leaves/GetEmployeeQuota';
// import {GetLeaveDays} from '../../API/Leaves/GetLeaveDays';

// import AlertModal from '../../components/Alert/AlertModal';
// import CalendarModal from '../../components/Leaves/CalendarModal';
// import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
// import ActionPaneContainer from '../../components/ActionPaneContainer';
// import SaveRecordButtons from '../../components/Buttons/SaveRecordButtons';
// import styles from '../../styles/styles';

// const LeaveRequestSaveRecord = () => {
//   const route = useRoute();
//   const navigation = useNavigation();
//   const scrollViewRef = useRef(null);

//   const isRTL = useSelector(state => state.language.isRTL);

//   const userData = useSelector(state => state.user.userData);
//   const routeUserData = route.params?.userData;
//   const effectiveUserData = routeUserData || userData || {};

//   const {
//     mode = 'create',
//     leaveData = {},
//     employeeId = leaveData.employeeId || effectiveUserData?.employeeId || '',
//     employeeName = leaveData.employeeName ||
//       effectiveUserData?.employeeName ||
//       '',
//     WorkerRecId = leaveData.WorkerRecId || effectiveUserData?.WorkerRecId || '',
//     cameFrom = 'MainDashboard',
//     originalCameFrom = null,
//   } = route.params || {};

//   const [LeaveCodesForEmployee, setLeaveCodesForEmployee] = useState([]);
//   const [showStartCalendar, setShowStartCalendar] = useState(false);
//   const [showEndCalendar, setShowEndCalendar] = useState(false);
//   const [alertModal, setAlertModal] = useState(false);
//   const [alertMessage, setAlertMessage] = useState('');
//   const [processingButton, setProcessingButton] = useState('');
//   const [isLoading, setIsLoading] = useState(false);

//   const createInitialFormData = () => ({
//     recId: !leaveData.recId || leaveData.recId === '0' ? '' : leaveData.recId,
//     employeeId: employeeId,
//     employeeName: employeeName,
//     WorkerRecId: WorkerRecId,
//     leaveCode: '',
//     leaveCategory: 'Full Day Leave',
//     balance: '0.00',
//     quota: '0.00',
//     eligibility: '0.00',
//     leaveStartDate: '',
//     leaveEndDate: '',
//     leaveDays: '',
//     reason: '',
//   });

//   const [formData, setFormData] = useState(() => createInitialFormData());

//   const goBack = useCallback(() => {
//     if (cameFrom === 'AttendanceCalendarScreen') {
//       navigation.navigate('AttendanceCalendarScreen');
//       return;
//     } else if (cameFrom === 'AttendanceDetailsScreen') {
//       navigation.navigate('AttendanceDetailsScreen');
//       return;
//     } else if (cameFrom === 'MainDashboard') {
//       navigation.reset({
//         index: 0,
//         routes: [
//           {
//             name: 'TabNavigator',
//             params: {screen: 'MainDashboard'},
//           },
//         ],
//       });
//     } else if (cameFrom === 'LeavesListPage') {
//       const targetCameFrom = originalCameFrom || 'DisplayListPage';
//       navigation.reset({
//         index: 0,
//         routes: [
//           {
//             name: 'LeavesListPage',
//             params: {
//               employeeId,
//               employeeName,
//               WorkerRecId,
//               cameFrom: targetCameFrom,
//             },
//           },
//         ],
//       });
//     } else {
//       navigation.goBack();
//     }
//   }, [
//     navigation,
//     cameFrom,
//     originalCameFrom,
//     employeeId,
//     employeeName,
//     WorkerRecId,
//   ]);

//   const normalizeLeaveCategoryForDisplay = category => {
//     if (!category) return 'Full Day Leave';

//     switch (category.toLowerCase()) {
//       case 'fullleave':
//       case 'full leave':
//       case 'full day leave':
//         return 'Full Day Leave';
//       case 'halfleave':
//       case 'half leave':
//       case 'half day leave':
//         return 'Half Day Leave';
//       default:
//         return 'Full Day Leave';
//     }
//   };

//   const clearFormData = useCallback(() => {
//     const clearedForm = createInitialFormData();
//     setFormData(clearedForm);
//   }, []);

//   useFocusEffect(
//     useCallback(() => {
//       const onBackPress = () => {
//         goBack();
//         return true;
//       };

//       BackHandler.addEventListener('hardwareBackPress', onBackPress);

//       return () =>
//         BackHandler.removeEventListener('hardwareBackPress', onBackPress);
//     }, [navigation]),
//   );

//   useFocusEffect(
//     React.useCallback(() => {
//       if (scrollViewRef.current) {
//         scrollViewRef.current.scrollTo({y: 0, animated: false});
//       }
//     }, []),
//   );

//   useFocusEffect(
//     React.useCallback(() => {
//       if (mode === 'create') {
//         const freshFormData = createInitialFormData();
//         setFormData(freshFormData);
//       } else if (mode === 'edit' && leaveData?.recId) {
//         const normalizedLeaveCategory = normalizeLeaveCategoryForDisplay(
//           leaveData.leaveCategory,
//         );

//         const editFormData = {
//           ...createInitialFormData(),
//           ...leaveData,
//           employeeId: leaveData.employeeId || employeeId,
//           employeeName: leaveData.employeeName || employeeName,
//           WorkerRecId: leaveData.WorkerRecId || WorkerRecId,
//           leaveCategory: normalizedLeaveCategory,
//           leaveDays: leaveData.leaveDays || '',
//           balance: leaveData.balance || '0.00',
//           quota: leaveData.quota || '0.00',
//           eligibility: leaveData.eligibility || '0.00',
//         };

//         setFormData(editFormData);

//         fetchLeaveCodesForEmployee();
//       }
//     }, [mode, leaveData?.recId, employeeId, employeeName, WorkerRecId]),
//   );

//   const handleRefresh = async () => {
//     setIsLoading(true);

//     try {
//       clearFormData();

//       const codes = await fetchLeaveCodes(formData.employeeId);
//       setLeaveCodesForEmployee(codes);
//     } catch (error) {
//       console.error('Error in Save Record Screen', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleInputChange = (field, value) => {
//     setFormData(prev => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   // Leave category options - labels will come from API in the selected language
//   const leaveCategoryOptions = [
//     {
//       label: 'Full Day Leave',
//       value: 'Full Day Leave',
//     },
//     {
//       label: 'Half Day Leave',
//       value: 'Half Day Leave',
//     },
//   ];

//   const formatToISOWithTime = date => {
//     const baseDate = new Date(date);
//     const year = baseDate.getFullYear();
//     const month = String(baseDate.getMonth() + 1).padStart(2, '0');
//     const day = String(baseDate.getDate()).padStart(2, '0');
//     return `${year}-${month}-${day}T12:00:00`;
//   };

//   // Fetch Balance, Quota, and calculate Eligibility when Leave Code is selected
//   const fetchBalanceQuotaEligibility = async (leaveCode, startDate) => {
//     try {
//       const effectiveStartDate = startDate || formatToISOWithTime(new Date());
//       const leaveRequestId = mode === 'edit' ? formData.recId : '';

//       // Fetch Balance
//       const balanceResult = await GetLeaveBalance({
//         employeeId: formData.employeeId,
//         leaveCode: leaveCode,
//         leaveStartDate: effectiveStartDate,
//         leaveRequestId: leaveRequestId,
//       });

//       // Fetch Quota
//       const quotaResult = await GetEmployeeQuota({
//         employeeId: formData.employeeId,
//         leaveCode: leaveCode,
//         leaveStartDate: effectiveStartDate,
//         leaveRecId: leaveRequestId || '0',
//       });

//       const balance =
//         balanceResult !== null ? balanceResult.toString() : '0.00';
//       const quota = quotaResult !== null ? quotaResult.toString() : '0.00';

//       // Determine Eligibility (bigger of Balance or Quota)
//       const balanceNum = parseFloat(balance) || 0;
//       const quotaNum = parseFloat(quota) || 0;
//       const eligibility = Math.max(balanceNum, quotaNum).toString();

//       setFormData(prev => ({
//         ...prev,
//         balance: balance,
//         quota: quota,
//         eligibility: eligibility,
//       }));
//     } catch (error) {
//       console.error('Error fetching balance/quota/eligibility:', error);
//       setFormData(prev => ({
//         ...prev,
//         balance: '0.00',
//         quota: '0.00',
//         eligibility: '0.00',
//       }));
//     }
//   };

//   // Fetch Leave Days when both Start and End dates are selected
//   const fetchLeaveDaysFromAPI = async (startDate, endDate) => {
//     try {
//       const leaveDaysResult = await GetLeaveDays({
//         employeeId: formData.WorkerRecId,
//         leaveCode: formData.leaveCode,
//         leaveStartDate: startDate,
//         leaveEndDate: endDate,
//       });

//       const leaveDays =
//         leaveDaysResult !== null ? leaveDaysResult.toString() : '0';

//       setFormData(prev => ({
//         ...prev,
//         leaveDays: leaveDays,
//       }));

//       // After getting leave days, fetch Balance and Quota again
//       await fetchBalanceQuotaEligibility(formData.leaveCode, startDate);
//     } catch (error) {
//       console.error('Error fetching leave days:', error);
//       setFormData(prev => ({
//         ...prev,
//         leaveDays: '0',
//       }));
//     }
//   };

//   const handleStartDateChange = async date => {
//     const formatted = formatToISOWithTime(date);

//     setFormData(prev => ({
//       ...prev,
//       leaveStartDate: formatted,
//     }));

//     // If both dates are selected, fetch leave days
//     if (formData.leaveEndDate && formData.leaveCode) {
//       await fetchLeaveDaysFromAPI(formatted, formData.leaveEndDate);
//     }
//   };

//   const handleEndDateChange = async date => {
//     const formatted = formatToISOWithTime(date);

//     if (formData.leaveStartDate) {
//       const startDate = new Date(formData.leaveStartDate);
//       const endDate = new Date(formatted);

//       if (endDate < startDate) {
//         setAlertMessage(t('leaveSaveRecord.endDateBeforeStartDate'));
//         setAlertModal(true);

//         // Clear the end date as requested
//         setFormData(prev => ({
//           ...prev,
//           leaveEndDate: '',
//           leaveDays: '',
//         }));

//         // Close the calendar modal
//         setShowEndCalendar(false);
//         return;
//       }
//     }

//     setFormData(prev => ({
//       ...prev,
//       leaveEndDate: formatted,
//     }));

//     // If both dates are selected, fetch leave days
//     if (formData.leaveStartDate && formData.leaveCode) {
//       await fetchLeaveDaysFromAPI(formData.leaveStartDate, formatted);
//     }
//   };

//   const handleLeaveCategoryChange = async item => {
//     const newLeaveCategory = item.value;

//     setFormData(prev => ({
//       ...prev,
//       leaveCategory: newLeaveCategory,
//     }));
//   };

//   const handleLeaveCodeChange = async item => {
//     const newLeaveCode = item.value;

//     setFormData(prev => ({
//       ...prev,
//       leaveCode: newLeaveCode,
//       leaveDays: '',
//     }));

//     // Fetch Balance, Quota, and Eligibility immediately
//     await fetchBalanceQuotaEligibility(newLeaveCode, formData.leaveStartDate);
//   };

//   const fetchLeaveCodesForEmployee = async () => {
//     try {
//       const codes = await fetchLeaveCodes(leaveData?.employeeId || employeeId);
//       setLeaveCodesForEmployee(codes);
//     } catch (error) {
//       setAlertMessage(t('leaveSaveRecord.fetchLeaveCodesFailed'));
//       setAlertModal(true);
//     }
//   };

//   const formatDate = date => {
//     if (!date) return '';
//     const d = new Date(date);
//     const month = String(d.getMonth() + 1).padStart(2, '0');
//     const day = String(d.getDate()).padStart(2, '0');
//     const year = d.getFullYear();
//     return `${month}/${day}/${year}`;
//   };

//   const getLeaveCategoryCode = categoryName => {
//     return categoryName === 'Full Day Leave'
//       ? 'FullLeave'
//       : categoryName === 'Half Day Leave'
//       ? 'HalfLeave'
//       : 'FullLeave';
//   };

//   const convertDateFormat = date => {
//     const d = new Date(date);
//     return `${d.getFullYear()}-${(d.getMonth() + 1)
//       .toString()
//       .padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}T12:00:00`;
//   };

//   const handleAction = async (actionType, modalMode, data = {}) => {
//     try {
//       const formattedLeaveReqDate = `${
//         new Date().toISOString().split('T')[0]
//       }T12:00:00`;

//       const leavesData = {
//         LeaveCode: data.leaveCode,
//         LeaveDays: data.leaveDays.toString(),
//         LeaveCategory: getLeaveCategoryCode(data.leaveCategory),
//         Balance: data.balance.toString(),
//         Eligibility: data.eligibility.toString(), // Add this
//         Quota: data.quota.toString(), // Add this
//         LeaveStartDate: data.leaveStartDate,
//         LeaveEndDate: data.leaveEndDate,
//         LeaveReqDate: formattedLeaveReqDate,
//         Reason: data.reason,
//         EmployeeId: data.employeeId,
//         RecId: data.recId === '' ? '0' : data.recId,
//       };

//       if (
//         !leavesData.LeaveCode ||
//         !leavesData.LeaveEndDate ||
//         !leavesData.LeaveStartDate
//       ) {
//         setAlertMessage(t('leaveSaveRecord.requiredFields'));
//         setAlertModal(true);
//         return false;
//       }

//       let response;
//       if (modalMode === 'create') {
//         response = await createLeaveRequest({
//           leaveData: leavesData,
//         });
//         if (actionType === 'submit') {
//           await SubmitLeaveRequest({
//             recId: response.RecId,
//           });
//         }
//       } else {
//         response = await UpdateLeaveRequest({
//           leaveData: leavesData,
//         });
//         if (actionType === 'submit') {
//           await SubmitLeaveRequest({
//             recId: response.RecId,
//           });
//         }
//       }

//       const isSuccess =
//         response.IsSuccess === true || response.IsSuccess === 'true';

//       if (isSuccess) {
//         const actionText =
//           modalMode === 'create'
//             ? t('leaveSaveRecord.created')
//             : t('leaveSaveRecord.updated');
//         const submitText =
//           actionType === 'submit'
//             ? ` ${t('leaveSaveRecord.andSubmitted')}`
//             : '';
//         setAlertMessage(
//           t('leaveSaveRecord.successMessage', {
//             leaveCode: data.leaveCode,
//             action: actionText + submitText,
//           }),
//         );
//         setAlertModal(true);
//         return {success: true, recId: response.RecId};
//       } else {
//         const errorMessage =
//           response.Message || t('leaveSaveRecord.operationFailed');
//         setAlertMessage(errorMessage);
//         setAlertModal(true);
//         return {success: false, message: errorMessage};
//       }
//     } catch (error) {
//       console.error('Error in handleAction:', error);
//       setAlertMessage(t('leaveSaveRecord.errorOccurred'));
//       setAlertModal(true);
//       return {success: false, message: 'Network or server error'};
//     }
//   };

//   const handleSave = async actionType => {
//     if (processingButton) return;

//     const missingFields = [];

//     if (!formData.leaveCode) missingFields.push(t('leaveSaveRecord.leaveCode'));
//     if (!formData.leaveStartDate)
//       missingFields.push(t('leaveSaveRecord.leaveStartDate'));
//     if (!formData.leaveEndDate)
//       missingFields.push(t('leaveSaveRecord.leaveEndDate'));
//     if (!formData.leaveDays) {
//       missingFields.push(t('leaveSaveRecord.leaveDays'));
//     } else if (Number(formData.leaveDays) === 0) {
//       missingFields.push(t('leaveSaveRecord.leaveDaysCannotBeZero'));
//     }

//     if (missingFields.length > 0) {
//       const message =
//         t('leaveSaveRecord.fillRequiredFields') +
//         '\n' +
//         missingFields.join('\n');
//       setAlertMessage(message);
//       setAlertModal(true);
//       return;
//     }

//     setProcessingButton(actionType);

//     try {
//       const result = await handleAction(
//         actionType,
//         mode === 'edit' ? 'update' : 'create',
//         formData,
//       );

//       if (result.success) {
//         setTimeout(() => {
//           setAlertModal(false);

//           clearFormData();

//           navigation.navigate('LeavesListPage', {
//             employeeId: formData.employeeId,
//             employeeName: formData.employeeName,
//             WorkerRecId: formData.WorkerRecId,
//             userData: route.params?.userData || {
//               employeeId: formData.employeeId,
//               employeeName: formData.employeeName,
//               WorkerRecId: formData.WorkerRecId,
//             },
//             highlightRecId: result.recId,
//             cameFrom: originalCameFrom || 'DisplayListPage',
//           });
//         }, 2000);
//       }
//     } catch (error) {
//       console.error('Error saving leave request:', error);
//       setAlertMessage(t('leaveSaveRecord.saveFailed'));
//       setAlertModal(true);
//     } finally {
//       setProcessingButton('');
//     }
//   };

//   const today = new Date().toISOString().split('T')[0];

//   return (
//     <ActionPaneContainer
//       pageTitle={
//         mode === 'edit'
//           ? t('leaveSaveRecord.editTitle')
//           : t('leaveSaveRecord.createTitle')
//       }
//       isBackButton={true}
//       showFooter={false}
//       showFloatingButton={false}
//       isHeaderActive={true}
//       onBackPress={goBack}
//       onRefresh={handleRefresh}
//       onFloatingButtonPress={{}}>
//       {isLoading ? (
//         <CustomIndicator />
//       ) : (
//         <SafeAreaView style={styles.LReqSR_SafeArea}>
//           <KeyboardAvoidingView
//             behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//             style={styles.LReqSR_ContentWrapper}
//             keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
//             <ScrollView
//               ref={scrollViewRef}
//               contentContainerStyle={styles.LReqSR_FormContainer}
//               showsVerticalScrollIndicator={false}
//               keyboardShouldPersistTaps="handled"
//               nestedScrollEnabled={true}>
//               {/* Employee Name */}
//               <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
//                 {t('leaveSaveRecord.employeeName')}
//               </Text>
//               <Text
//                 style={[
//                   styles.LReqSR_Input,
//                   styles.LReqSR_Disabled,
//                   isRTL && {textAlign: 'left', writingDirection: 'rtl'},
//                 ]}>
//                 {formData.employeeName}
//               </Text>

//               {/* Request Date */}
//               <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
//                 {t('leaveSaveRecord.requestDate')}
//               </Text>
//               <Text
//                 style={[
//                   styles.LReqSR_Input,
//                   styles.LReqSR_Disabled,
//                   isRTL && {textAlign: 'left', writingDirection: 'rtl'},
//                 ]}>
//                 {formatDate(today)}
//               </Text>

//               {/* Leave Category Label */}
//               <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
//                 {t('leaveSaveRecord.leaveCategoryLabel')}
//               </Text>
//               <Dropdown
//                 style={[styles.LReqSR_Input, isRTL && {textAlign: 'left'}]}
//                 data={leaveCategoryOptions}
//                 labelField="label"
//                 valueField="value"
//                 placeholder={t('leaveSaveRecord.selectLeaveCategory')}
//                 value={formData.leaveCategory}
//                 onChange={handleLeaveCategoryChange}
//                 placeholderStyle={[
//                   styles.LReqSR_DropdownPlaceholder,
//                   isRTL && {textAlign: 'left'},
//                 ]}
//                 selectedTextStyle={[
//                   styles.LReqSR_DropdownSelectedText,
//                   isRTL && {textAlign: 'left'},
//                 ]}
//                 itemTextStyle={[
//                   styles.LReqSR_DropdownItemText,
//                   isRTL && {textAlign: 'left'},
//                 ]}
//                 activeColor="#E6F0FF"
//                 containerStyle={[
//                   styles.LReqSR_DropdownContainer,
//                   {
//                     marginTop: Platform.OS === 'ios' ? 5 : 2,
//                     zIndex: 1000,
//                   },
//                 ]}
//                 renderLeftIcon={
//                   isRTL
//                     ? () => (
//                         <Icon
//                           name="chevron-down"
//                           size={10}
//                           color="#8b8b8bff"
//                           style={{marginHorizontal: 8}}
//                         />
//                       )
//                     : null
//                 }
//                 renderRightIcon={
//                   !isRTL
//                     ? () => (
//                         <Icon
//                           name="chevron-down"
//                           size={10}
//                           color="#8b8b8bff"
//                           style={{marginHorizontal: 8}}
//                         />
//                       )
//                     : null
//                 }
//                 iconStyle={{width: 0, height: 0}}
//                 itemContainerStyle={styles.LReqSR_DropdownItemContainer}
//                 maxHeight={280}
//                 dropdownPosition="auto"
//                 inverted={isRTL}
//               />

//               {/* Leave Code */}
//               <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
//                 {t('leaveSaveRecord.leaveCode')} *
//               </Text>
//               <Dropdown
//                 style={[styles.LReqSR_Input, isRTL && {textAlign: 'left'}]}
//                 data={LeaveCodesForEmployee}
//                 labelField="label"
//                 valueField="value"
//                 placeholder={t('leaveSaveRecord.selectLeaveCode')}
//                 value={formData.leaveCode}
//                 onFocus={fetchLeaveCodesForEmployee}
//                 onChange={handleLeaveCodeChange}
//                 placeholderStyle={[
//                   styles.LReqSR_DropdownPlaceholder,
//                   isRTL && {textAlign: 'left'},
//                 ]}
//                 selectedTextStyle={[
//                   styles.LReqSR_DropdownSelectedText,
//                   isRTL && {textAlign: 'left'},
//                 ]}
//                 itemTextStyle={[
//                   styles.LReqSR_DropdownItemText,
//                   isRTL && {textAlign: 'left'},
//                 ]}
//                 activeColor="#E6F0FF"
//                 containerStyle={[
//                   styles.LReqSR_DropdownContainer,
//                   {marginTop: Platform.OS === 'ios' ? 5 : 2, zIndex: 999},
//                 ]}
//                 itemContainerStyle={styles.LReqSR_DropdownItemContainer}
//                 maxHeight={280}
//                 dropdownPosition="auto"
//                 search
//                 searchPlaceholder={t('leaveSaveRecord.searchLeaveCode')}
//                 inputSearchStyle={[
//                   styles.LReqSR_DropdownSearchInput,
//                   isRTL && {textAlign: 'right'},
//                 ]}
//                 renderLeftIcon={
//                   isRTL
//                     ? () => (
//                         <Icon
//                           name="chevron-down"
//                           size={10}
//                           color="#8b8b8bff"
//                           style={{marginHorizontal: 8}}
//                         />
//                       )
//                     : null
//                 }
//                 renderRightIcon={
//                   !isRTL
//                     ? () => (
//                         <Icon
//                           name="chevron-down"
//                           size={10}
//                           color="#8b8b8bff"
//                           style={{marginHorizontal: 8}}
//                         />
//                       )
//                     : null
//                 }
//                 iconStyle={{width: 0, height: 0}}
//                 keyboardAvoiding
//                 inverted={isRTL}
//               />

//               {/* Leave Start Date */}
//               <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
//                 {t('leaveSaveRecord.leaveStartDate')} *
//               </Text>
//               <TouchableOpacity
//                 style={[
//                   styles.LReqSR_DateSelector,
//                   isRTL && {flexDirection: 'row'},
//                 ]}
//                 onPress={() => setShowStartCalendar(true)}>
//                 <View style={{flex: 1}}>
//                   <Text
//                     style={[
//                       styles.LReqSR_DateText,
//                       isRTL && {textAlign: 'left', writingDirection: 'rtl'},
//                     ]}>
//                     {formData.leaveStartDate
//                       ? formatDate(formData.leaveStartDate)
//                       : t('leaveSaveRecord.selectStartDate')}
//                   </Text>
//                 </View>
//                 <Icon name="calendar" size={20} color="#0A66C2" />
//               </TouchableOpacity>

//               {/* Leave End Date */}
//               <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
//                 {t('leaveSaveRecord.leaveEndDate')} *
//               </Text>
//               <TouchableOpacity
//                 style={[
//                   styles.LReqSR_DateSelector,
//                   isRTL && {flexDirection: 'row'},
//                 ]}
//                 onPress={() => setShowEndCalendar(true)}>
//                 <View style={{flex: 1}}>
//                   <Text
//                     style={[
//                       styles.LReqSR_DateText,
//                       isRTL && {textAlign: 'left', writingDirection: 'rtl'},
//                     ]}>
//                     {formData.leaveEndDate
//                       ? formatDate(formData.leaveEndDate)
//                       : t('leaveSaveRecord.selectEndDate')}
//                   </Text>
//                 </View>
//                 <Icon name="calendar" size={20} color="#0A66C2" />
//               </TouchableOpacity>

//               {/* Leave Days - Disabled */}
//               <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
//                 {t('leaveSaveRecord.leaveDays')}
//               </Text>
//               <Text
//                 style={[
//                   styles.LReqSR_Input,
//                   styles.LReqSR_Disabled,
//                   isRTL && {textAlign: 'left', writingDirection: 'rtl'},
//                 ]}>
//                 {formData.leaveDays || '0'}
//               </Text>

//               {/* Balance - Disabled */}
//               <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
//                 {t('leaveSaveRecord.balance')}
//               </Text>
//               <Text
//                 style={[
//                   styles.LReqSR_Input,
//                   styles.LReqSR_Disabled,
//                   isRTL && {textAlign: 'left', writingDirection: 'rtl'},
//                 ]}>
//                 {formData.balance}
//               </Text>

//               {/* Quota - Disabled */}
//               <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
//                 {t('leaveSaveRecord.quota')}
//               </Text>
//               <Text
//                 style={[
//                   styles.LReqSR_Input,
//                   styles.LReqSR_Disabled,
//                   isRTL && {textAlign: 'left', writingDirection: 'rtl'},
//                 ]}>
//                 {formData.quota}
//               </Text>

//               {/* Eligibility - Disabled */}
//               <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
//                 {t('leaveSaveRecord.eligibility')}
//               </Text>
//               <Text
//                 style={[
//                   styles.LReqSR_Input,
//                   styles.LReqSR_Disabled,
//                   isRTL && {textAlign: 'left', writingDirection: 'rtl'},
//                 ]}>
//                 {formData.eligibility}
//               </Text>

//               {/* Reason */}
//               <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
//                 {t('leaveSaveRecord.reason')}
//               </Text>
//               <TextInput
//                 style={[
//                   styles.LReqSR_Input,
//                   styles.LReqSR_TextArea,
//                   isRTL && {textAlign: 'right', writingDirection: 'rtl'},
//                 ]}
//                 value={formData.reason}
//                 onChangeText={value => handleInputChange('reason', value)}
//                 placeholder={t('leaveSaveRecord.enterReason')}
//                 multiline
//                 numberOfLines={6}
//               />
//             </ScrollView>

//             <SaveRecordButtons
//               mode={mode}
//               processingButton={processingButton}
//               onSave={handleSave}
//               onCancel={goBack}
//               isDisabled={
//                 processingButton === 'save' || processingButton === 'submit'
//               }
//             />
//           </KeyboardAvoidingView>

//           <CalendarModal
//             visible={showStartCalendar}
//             current={formData.leaveStartDate}
//             onDateSelected={handleStartDateChange}
//             onClose={() => setShowStartCalendar(false)}
//           />

//           <CalendarModal
//             visible={showEndCalendar}
//             current={formData.leaveEndDate}
//             onDateSelected={handleEndDateChange}
//             onClose={() => setShowEndCalendar(false)}
//           />

//           <AlertModal
//             visible={alertModal}
//             heading={t('common.alert')}
//             text={alertMessage}
//             onPress={() => {
//               setAlertModal(false);
//             }}
//           />
//         </SafeAreaView>
//       )}
//     </ActionPaneContainer>
//   );
// };

// export default LeaveRequestSaveRecord;
