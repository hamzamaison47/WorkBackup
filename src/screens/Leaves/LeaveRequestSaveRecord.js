/* eslint-disable curly */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useCallback, useRef, useEffect} from 'react';
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
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {Dropdown} from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/FontAwesome';
import {translate as t} from '../../store/utils/translate';

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
import {isLeaveWorkflowConfigured} from '../../API/Leaves/isLeaveWorkflowEnabled';

import AlertModal from '../../components/Alert/AlertModal';
import CalendarModal from '../../components/Leaves/CalendarModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import SaveRecordButtons from '../../components/Buttons/SaveRecordButtons';
import {BUTTON_TYPES} from '../../components/DynamicRequestCard';
import styles from '../../styles/styles';

const LeaveRequestSaveRecord = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);

  const currentLanguage = useSelector(state => state.language.currentLanguage);
  const isRTL = useSelector(state => state.language.isRTL);
  const userData = useSelector(state => state.user.userData);
  const {menuItems} = useSelector(state => state.menuItem);
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
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [leaveLabelsData, setLeaveLabelsData] = useState({});
  const [isWorkflowConfigured, setIsWorkflowConfigured] = useState(false);
  const [startCalendarKey, setStartCalendarKey] = useState(Date.now());
  const [endCalendarKey, setEndCalendarKey] = useState(Date.now());
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

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
    leaveStartDate: today,
    leaveEndDate: '',
    leaveDays: '',
    reason: '',
    leaveRequestId: '',
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

  // Function to get the page label based on mode
  const getPageLabel = () => {
    const currentMenuItem = menuItems.find(
      item => item.MenuId === 'LeaveSaveRecord',
    );
    const baseLabel = currentMenuItem?.Label || t('leaveSaveRecord.pageTitle');

    if (mode === 'create') {
      return `${t('common.create')} ${baseLabel}`;
    } else if (mode === 'edit') {
      return `${t('common.update')} ${baseLabel}`;
    }

    return baseLabel;
  };

  const checkIsWorkflowConfigured = async () => {
    try {
      const result = await isLeaveWorkflowConfigured();
      // console.log('Here is the data', result);
      return result === true || result === 'true' || result === 1;
    } catch (error) {
      console.error('Workflow config check failed:', error);
      return false;
    }
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadWorkflowConfig = async () => {
      const enabled = await checkIsWorkflowConfigured();
      if (isMounted) {
        setIsWorkflowConfigured(enabled);
      }
    };

    loadWorkflowConfig();

    return () => {
      isMounted = false;
    };
  }, []);

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
    setIsLoading(true);
    try {
      const labels = await GetLeaveLabels();
      setLeaveLabelsData(labels || {});
    } catch (error) {
      console.error('Error fetching leave labels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const initializeForm = async () => {
        setIsLoading(true);
        try {
          await fetchLeaveLabels();
          await fetchLeaveCodesForEmployee();

          if (mode === 'create') {
            const freshFormData = createInitialFormData();
            setFormData(freshFormData);
          } else if (mode === 'edit' && leaveData?.recId) {
            const normalizedLeaveCategory = normalizeLeaveCategoryForDisplay(
              leaveData.leaveCategory,
            );

            // First set the form data with values from leaveData
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
              leaveRequestId: leaveData.leaveReqId || '',
            };

            setFormData(editFormData);

            // Then fetch fresh balance/quota/eligibility data using the parameters directly
            if (leaveData.leaveCode && leaveData.leaveStartDate) {
              // No setTimeout needed now
              await fetchBalanceQuotaEligibility(
                leaveData.leaveCode,
                leaveData.leaveStartDate,
              );
            } else if (leaveData.leaveCode) {
              await fetchBalanceQuotaEligibility(
                leaveData.leaveCode,
                formatToISOWithTime(new Date()),
              );
            }
          }
        } catch (error) {
          console.error('Error initializing form:', error);
        } finally {
          setIsLoading(false);
        }
      };

      initializeForm();
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
      label: t('dynamic.leaveCategories.FullLeave'),
      value: 'Full Day Leave',
    },
    {
      label: t('dynamic.leaveCategories.HalfLeave'),
      value: 'Half Day Leave',
    },
  ];

  const formatToISOWithTime = dateInput => {
    // Handle both "2025-03-15" and Date objects safely
    let year, month, day;
    if (typeof dateInput === 'string') {
      const datePart = dateInput.split('T')[0];
      [year, month, day] = datePart.split('-').map(Number);
    } else {
      year = dateInput.getFullYear();
      month = dateInput.getMonth() + 1;
      day = dateInput.getDate();
    }
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(
      2,
      '0',
    )}T12:00:00`;
  };

  const fetchBalanceQuotaEligibility = async (leaveCode, startDate) => {
    try {
      const effectiveStartDate = startDate || formatToISOWithTime(new Date());

      // Use the parameters directly instead of formData
      const empId = employeeId; // Use the employeeId from props
      const leaveRecId =
        mode === 'edit' && leaveData?.recId ? leaveData.recId : '0';
      const leaveReqId = leaveData?.leaveReqId || '';

      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();

      const balanceResult = await GetLeaveBalance({
        employeeId: empId,
        leaveCode: leaveCode,
        leaveStartDate: effectiveStartDate,
        leaveRequestId: leaveReqId,
        _t: timestamp,
      });

      const quotaResult = await GetEmployeeQuota({
        employeeId: empId,
        leaveCode: leaveCode,
        leaveStartDate: effectiveStartDate,
        leaveRecId: leaveRecId,
        _t: timestamp,
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
    const startDate = new Date(formatted);

    // Close modal FIRST
    setShowStartCalendar(false);

    if (formData.leaveEndDate) {
      const endDate = new Date(formData.leaveEndDate);
      if (startDate > endDate) {
        setAlertMessage(t('leaveSaveRecord.startDateAfterEnd'));
        setAlertModal(true);
        return;
      }
    }

    // Then update form data
    setFormData(prev => ({
      ...prev,
      leaveStartDate: formatted,
    }));

    // Fetch data after state update
    if (formData.leaveCode) {
      await fetchBalanceQuotaEligibility(formData.leaveCode, formatted);

      if (formData.leaveEndDate) {
        await fetchLeaveDaysFromAPI(formatted, formData.leaveEndDate);
      }
    }
  };

  const handleEndDateChange = async date => {
    const formatted = formatToISOWithTime(date);

    // Close modal FIRST
    setShowEndCalendar(false);

    if (formData.leaveStartDate) {
      const startDate = new Date(formData.leaveStartDate);
      const endDate = new Date(formatted);

      if (endDate < startDate) {
        setAlertMessage(t('leaveSaveRecord.endDateBeforeStart'));
        setAlertModal(true);

        setFormData(prev => ({
          ...prev,
          leaveEndDate: '',
          leaveDays: '',
        }));

        return;
      }
    }

    // Then update form data
    setFormData(prev => ({
      ...prev,
      leaveEndDate: formatted,
    }));

    // Fetch data after state update
    if (formData.leaveStartDate && formData.leaveCode) {
      setIsProcessing(true);

      try {
        await fetchLeaveDaysFromAPI(formData.leaveStartDate, formatted);

        await fetchBalanceQuotaEligibility(
          formData.leaveCode,
          formData.leaveStartDate,
        );
      } catch (error) {
        console.log('Error while fetching leave data:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleDatePickerOpen = dateType => {
    if (!formData.leaveCode) {
      setAlertMessage(
        t('leaveSaveRecord.selectLeaveCodeFirst') ||
          'Please select Leave Code first',
      );
      setAlertModal(true);
      return false;
    }
    return true;
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

    if (formData.leaveStartDate) {
      await fetchBalanceQuotaEligibility(newLeaveCode, formData.leaveStartDate);

      if (formData.leaveEndDate) {
        await fetchLeaveDaysFromAPI(
          formData.leaveStartDate,
          formData.leaveEndDate,
        );
      }
    }
  };

  const fetchLeaveCodesForEmployee = async () => {
    try {
      const codes = await fetchLeaveCodes(formData.employeeId || employeeId);
      setLeaveCodesForEmployee(codes);
    } catch (error) {
      setAlertMessage(t('leaveRequest.fetchFailed'));
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
        EmployeeName: data.employeeName,
        RecId: data.recId === '' ? '0' : data.recId,
        LeaveReqId: modalMode === 'create' ? '' : data.leaveRequestId || '',
      };

      // console.log({leaveData});

      if (
        !leavesData.LeaveCode ||
        !leavesData.LeaveEndDate ||
        !leavesData.LeaveStartDate
      ) {
        setAlertMessage(t('leaveSaveRecord.requiredFields'));
        setAlertModal(true);
        return false;
      }

      let response, submitResult;

      if (modalMode === 'create') {
        response = await createLeaveRequest({leaveData: leavesData});
        if (actionType === 'submit' && response?.RecId) {
          submitResult = await SubmitLeaveRequest({recId: response.RecId});
        }
      } else if (modalMode === 'update') {
        response = await UpdateLeaveRequest({leaveData: leavesData});
        if (actionType === 'submit' && response?.IsSuccess) {
          submitResult = await SubmitLeaveRequest({recId: leavesData.RecId});
        }
      }

      if (response.IsSuccess === 'true') {
        const actionText =
          modalMode === 'create' ? t('common.create') : t('common.update');
        const submitText =
          actionType === 'submit' && submitResult?.IsSuccess === 'true'
            ? ` ${t('leaveSaveRecord.andSubmitted')}`
            : actionType === 'submit' && submitResult?.IsSuccess === 'false'
            ? ` ${t('leaveSaveRecord.butNotSubmitted')}`
            : '';

        setAlertMessage(
          `${leavesData.LeaveCode} ${actionText}${submitText} ${t(
            'leaveSaveRecord.successfully',
          )}`,
        );
        setAlertModal(true);

        return {success: true, recId: response?.RecId};
      } else {
        const errorMessage =
          response?.Message || t('leaveSaveRecord.operationFailed');
        setAlertMessage(errorMessage);
        setAlertModal(true);
        return {success: false, message: errorMessage};
      }
    } catch (error) {
      console.error('Error in handleAction:', error);
      setAlertMessage(t('leaveSaveRecord.processingError'));
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
    // if (!formData.leaveDays) {
    //   missingFields.push('Leave Days');
    // } else if (Number(formData.leaveDays) === 0) {
    //   missingFields.push('Leave Days cannot be 0');
    // }

    if (missingFields.length > 0) {
      const message =
        t('leaveSaveRecord.fillRequiredFields') +
        '\n' +
        missingFields.join('\n');
      setAlertMessage(message);
      setAlertModal(true);
      return;
    }

    setProcessingButton(actionType);
    setIsProcessing(true);

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
      setAlertMessage(t('leaveSaveRecord.saveFailed'));
      setAlertModal(true);
    } finally {
      setProcessingButton('');
      setIsProcessing(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <ActionPaneContainer
      pageTitle={getPageLabel()}
      isBackButton={true}
      showFooter={false}
      showTabNavigator={!isKeyboardVisible}
      showFloatingButton={false}
      isHeaderActive={true}
      onBackPress={goBack}
      onRefresh={handleRefresh}
      onFloatingButtonPress={{}}
      showPageTitleRow={true}>
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <SafeAreaView style={styles.DSR_SafeArea}>
          {/* <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.DSR_ContentWrapper}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}> */}
          {isProcessing && (
            <View style={styles.DSR_ProcessingOverlay}>
              <View style={styles.DSR_ProcessingContainer}>
                <ActivityIndicator size="large" color="#0A66C2" />
                <Text style={styles.DSR_ProcessingText}>
                  {t('common.processing')}
                </Text>
              </View>
            </View>
          )}
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.DSR_FormContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}>
            {/* Employee Name */}
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              {leaveLabelsData?.EmployeeNameLabel || 'Employee Name'}
            </Text>
            <Text
              style={[
                styles.DSR_Input,
                styles.DSR_Disabled,
                isRTL && {textAlign: 'left', writingDirection: 'rtl'},
              ]}>
              {formData.employeeName}
            </Text>

            {/* Request Date */}
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              {leaveLabelsData?.LeaveReqDateLabel || 'Request Date'}
            </Text>
            <Text
              style={[
                styles.DSR_Input,
                styles.DSR_Disabled,
                isRTL && {textAlign: 'left', writingDirection: 'rtl'},
              ]}>
              {formatDate(today)}
            </Text>

            {/* Leave Category Label */}
            {/* <Text style={[styles.LReqSR_Label, isRTL && {textAlign: 'left'}]}>
                {leaveLabelsData?.LeaveCategoryLabel || 'Leave Category'}
              </Text>
              <Dropdown
                style={[styles.DSR_Input, isRTL && {textAlign: 'left'}]}
                data={leaveCategoryOptions}
                labelField="label"
                valueField="value"
                placeholder={t('leaveSaveRecord.selectLeaveCategory')}
                value={formData.leaveCategory}
                onChange={handleLeaveCategoryChange}
                placeholderStyle={[
                  styles.DSR_DropdownPlaceholder,
                  isRTL && {textAlign: 'left'},
                ]}
                selectedTextStyle={[
                  styles.DSR_DropdownSelectedText,
                  isRTL && {textAlign: 'left'},
                ]}
                itemTextStyle={[
                  styles.DSR_DropdownItemText,
                  isRTL && {textAlign: 'left'},
                ]}
                activeColor="#E6F0FF"
                containerStyle={[
                  styles.DSR_DropdownContainer,
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
                itemContainerStyle={styles.DSR_DropdownItemContainer}
                maxHeight={280}
                dropdownPosition="auto"
                inverted={isRTL}
              /> */}

            {/* Leave Code */}
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              {leaveLabelsData?.LeaveCodeLabel || 'Leave Code *'}
            </Text>
            <Dropdown
              style={[styles.DSR_Input, isRTL && {textAlign: 'left'}]}
              data={LeaveCodesForEmployee}
              labelField="label"
              valueField="value"
              placeholder={t('leaveSaveRecord.selectLeaveCode')}
              value={formData.leaveCode}
              onFocus={fetchLeaveCodesForEmployee}
              onChange={handleLeaveCodeChange}
              placeholderStyle={[
                styles.DSR_DropdownPlaceholder,
                isRTL && {textAlign: 'left'},
              ]}
              selectedTextStyle={[
                styles.DSR_DropdownSelectedText,
                isRTL && {textAlign: 'left'},
              ]}
              itemTextStyle={[
                styles.DSR_DropdownItemText,
                isRTL && {textAlign: 'left'},
              ]}
              activeColor="#E6F0FF"
              containerStyle={[
                styles.DSR_DropdownContainer,
                {marginTop: Platform.OS === 'ios' ? 5 : 2, zIndex: 999},
              ]}
              itemContainerStyle={styles.DSR_DropdownItemContainer}
              maxHeight={280}
              dropdownPosition="auto"
              search
              searchPlaceholder={t('leaveSaveRecord.searchLeaveCode')}
              inputSearchStyle={[
                styles.DSR_DropdownSearchInput,
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
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              {leaveLabelsData?.LeaveStartDateLabel || 'Leave Start Date *'}
            </Text>
            <TouchableOpacity
              style={[styles.DSR_DateSelector, isRTL && {flexDirection: 'row'}]}
              onPress={() => {
                if (handleDatePickerOpen('start')) {
                  // setStartCalendarKey(Date.now());
                  setShowStartCalendar(true);
                }
              }}>
              <View style={{flex: 1}}>
                <Text
                  style={[
                    styles.DSR_DateText,
                    isRTL && {textAlign: 'left', writingDirection: 'rtl'},
                  ]}>
                  {formData.leaveStartDate
                    ? formatDate(formData.leaveStartDate)
                    : t('leaveSaveRecord.selectStartDate')}
                </Text>
              </View>
              <Icon name="calendar" size={20} color="#0A66C2" />
            </TouchableOpacity>

            {/* Leave End Date */}
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              {leaveLabelsData?.LeaveEndDateLabel || 'Leave End Date *'}
            </Text>
            <TouchableOpacity
              style={[styles.DSR_DateSelector, isRTL && {flexDirection: 'row'}]}
              onPress={() => {
                if (handleDatePickerOpen('end')) {
                  // setEndCalendarKey(Date.now());
                  setShowEndCalendar(true);
                }
              }}>
              <View style={{flex: 1}}>
                <Text
                  style={[
                    styles.DSR_DateText,
                    isRTL && {textAlign: 'left', writingDirection: 'rtl'},
                  ]}>
                  {formData.leaveEndDate
                    ? formatDate(formData.leaveEndDate)
                    : t('leaveSaveRecord.selectEndDate')}
                </Text>
              </View>
              <Icon name="calendar" size={20} color="#0A66C2" />
            </TouchableOpacity>

            {/* Leave Days */}
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              {leaveLabelsData?.LeaveDaysLabel || 'Leave Days'}
            </Text>
            <Text
              style={[
                styles.DSR_Input,
                styles.DSR_Disabled,
                isRTL && {textAlign: 'left', writingDirection: 'rtl'},
              ]}>
              {formData.leaveDays || '0'}
            </Text>

            {/* Balance */}
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              {leaveLabelsData?.BalanceLabel || 'Balance'}
            </Text>
            <Text
              style={[
                styles.DSR_Input,
                styles.DSR_Disabled,
                isRTL && {textAlign: 'left', writingDirection: 'rtl'},
              ]}>
              {formData.balance}
            </Text>

            {/* Quota */}
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              {leaveLabelsData?.QuotaLabel || 'Quota'}
            </Text>
            <Text
              style={[
                styles.DSR_Input,
                styles.DSR_Disabled,
                isRTL && {textAlign: 'left', writingDirection: 'rtl'},
              ]}>
              {formData.quota}
            </Text>

            {/* Eligibility */}
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              {leaveLabelsData?.EligibilityLabel || 'Eligibility'}
            </Text>
            <Text
              style={[
                styles.DSR_Input,
                styles.DSR_Disabled,
                isRTL && {textAlign: 'left', writingDirection: 'rtl'},
              ]}>
              {formData.eligibility}
            </Text>

            {/* Reason */}
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              {leaveLabelsData?.ReasonLabel || 'Reason'}
            </Text>
            <TextInput
              style={[
                styles.DSR_Input,
                styles.DSR_TextArea,
                isRTL && {textAlign: 'right', writingDirection: 'rtl'},
              ]}
              value={formData.reason}
              onChangeText={value => handleInputChange('reason', value)}
              placeholder={t('leaveSaveRecord.enterReason')}
              multiline
              numberOfLines={6}
            />
          </ScrollView>

          {isWorkflowConfigured ? (
            <SaveRecordButtons
              mode={mode}
              processingButton={processingButton}
              onSave={handleSave}
              onCancel={goBack}
              isDisabled={
                processingButton === 'create' || processingButton === 'submit'
              }
            />
          ) : (
            <SaveRecordButtons
              mode={mode}
              processingButton={processingButton}
              onSave={handleSave}
              onCancel={goBack}
              isDisabled={
                processingButton === 'create' || processingButton === 'submit'
              }
              showButtons={[BUTTON_TYPES.CREATE, BUTTON_TYPES.CANCEL]}
            />
          )}
          {/* </KeyboardAvoidingView> */}
        </SafeAreaView>
      )}
      {showStartCalendar && (
        <CalendarModal
          // key={`start-${startCalendarKey}`}
          visible={showStartCalendar}
          initialDate={formData.leaveStartDate}
          onDateSelected={handleStartDateChange}
          onClose={() => setShowStartCalendar(false)}
        />
      )}

      {showEndCalendar && (
        <CalendarModal
          // key={`end-${endCalendarKey}`}
          visible={showEndCalendar}
          initialDate={formData.leaveEndDate}
          onDateSelected={handleEndDateChange}
          onClose={() => setShowEndCalendar(false)}
        />
      )}

      <AlertModal
        visible={alertModal}
        heading={t('common.alert')}
        text={alertMessage}
        onPress={() => {
          setAlertModal(false);
        }}
      />
    </ActionPaneContainer>
  );
};

export default LeaveRequestSaveRecord;
