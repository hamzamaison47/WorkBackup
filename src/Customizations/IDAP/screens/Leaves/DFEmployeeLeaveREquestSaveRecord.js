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
  ScrollView,
  SafeAreaView,
  BackHandler,
  Platform,
  I18nManager,
  ActivityIndicator,
  Switch,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {Dropdown} from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/FontAwesome';
import useNotify from '../../../../hooks/useNotify';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';

import {retrieveLeaveTypes} from '../../API/Leaves/retrieveLeaveTypes';
import {createDFEmployeeLeaveRequest} from '../../API/Leaves/createDFEmployeeLeaveRequest';
import {calculateAvailableLeaveDays} from '../../API/Leaves/calculateAvailableLeaveDays';
import {getEmployeeLeaveDays} from '../../API/Leaves/getEmployeeLeaveDays';
import {
  parseDynamicsDate,
  formatDynamicsDate,
} from '../../../../utils/dynamicsDate';

import AlertModal from '../../../../components/Alert/AlertModal';
import useAlertModal from '../../../../hooks/useAlertModal';
import CalendarModal from '../../../../components/Leaves/CalendarModal';
import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../../../components/ActionPaneContainer';
import SaveRecordButtons, {
  BUTTON_TYPES,
} from '../../../../components/Buttons/SaveRecordButtons';
import styles from '../../../../styles/styles';
import {formatDateValue} from '../../../../store/utils/dateUtils';
import {
  selectDateFormat,
  selectTimeFormat,
  selectTimezone,
} from '../../../../store/selectors';
import useAppStyles from '../../../../hooks/useAppStyles';
import brand from '../../../../theme/brand';

const DFEmployeeLeaveRequestSaveRecord = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const styles = useAppStyles();

  const isRTL = I18nManager.isRTL;
  const userData = useSelector(state => state.user.userData);
  const {menuItems} = useSelector(state => state.menuItem);
  const selectedFormat = useSelector(selectDateFormat);
  const selectedTimeFormat = useSelector(selectTimeFormat);
  const selectedTimezone = useSelector(selectTimezone);

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

  const NAVIGATION_SCREENS = {
    MAIN_DASHBOARD: 'MainDashboard',
    LEAVES_LIST: 'DFEmployeeLeaveRequestListPage',
    DISPLAY_LIST: 'DisplayListPage',
  };

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingButton, setProcessingButton] = useState('');

  const {showSuccess, showError, showWarning, alertModalProps} =
    useAlertModal();

  const [leaveTypeOptions, setLeaveTypeOptions] = useState([]);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [isFetchingAvailable, setIsFetchingAvailable] = useState(false);
  const [isCalculatingDays, setIsCalculatingDays] = useState(false);

  const {notifySuccess, notifyError} = useNotify('Leave Request');

  const getLocalToday = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = getLocalToday();

  const createInitialFormData = () => ({
    recId: '',
    employeeId,
    employeeName,
    WorkerRecId,
    leaveType: '',
    leaveTypeName: '',
    fromDate: today,
    toDate: '',
    isShortLeave: false,
    shortLeaveType: '',
    available: '0.00',
    days: '0.00',
    hrs: '0.00',
    isAdjustment: false,
    note: '',
  });

  const [formData, setFormData] = useState(() => createInitialFormData());

  useEffect(() => {
    const updateDays = async () => {
      if (!formData.fromDate) {
        setFormData(prev => ({...prev, days: '0.00', hrs: '0.00'}));
        return;
      }
      if (!formData.isShortLeave && !formData.toDate) {
        setFormData(prev => ({...prev, days: '0.00', hrs: '0.00'}));
        return;
      }

      setIsCalculatingDays(true);
      try {
        const result = await getEmployeeLeaveDays({
          fromDate: formData.fromDate,
          toDate: formData.isShortLeave ? formData.fromDate : formData.toDate,
          leaveHours: 0,
          workerRecId: WorkerRecId,
          leaveName: formData.leaveType,
          isShortLeave: formData.isShortLeave, // make sure this is sent — see SOAP body below
        });

        const record = result?.[0] ?? {};
        setFormData(prev => ({
          ...prev,
          days: String(record.LeaveDaysForCreation ?? '0.00'),
          hrs: String(record.leaveHoursForCreation ?? '0.00'),
        }));
      } catch (error) {
        console.error('Failed to calculate leave days:', error);
        setFormData(prev => ({...prev, days: '0.00', hrs: '0.00'}));
      } finally {
        setIsCalculatingDays(false);
      }
    };

    updateDays();
  }, [
    formData.fromDate,
    formData.toDate,
    formData.isShortLeave,
    formData.leaveType,
  ]);

  // ---------------- Page label ----------------
  const getPageLabel = () => {
    const currentMenuItem = menuItems.find(
      item => item.MenuId === 'DFEmployeeLeaveRequestSaveRecord',
    );
    const baseLabel = currentMenuItem?.Label || 'Leave request';

    if (mode === 'create') return `Create ${baseLabel}`;
    if (mode === 'edit') return `Update ${baseLabel}`;
    return baseLabel;
  };

  // ---------------- Back navigation ----------------
  const goBack = useCallback(() => {
    try {
      switch (cameFrom) {
        case NAVIGATION_SCREENS.MAIN_DASHBOARD:
          navigation.reset({
            index: 0,
            routes: [{name: NAVIGATION_SCREENS.MAIN_DASHBOARD}],
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
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate(NAVIGATION_SCREENS.MAIN_DASHBOARD);
          }
          break;
      }
    } catch (error) {
      console.error('Navigation error in goBack:', error);
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

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        goBack();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [goBack]),
  );

  useFocusEffect(
    useCallback(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToPosition(0, 0, false);
      }
    }, []),
  );

  // ---------------- Fetch dropdown data ----------------
  const fetchLeaveTypes = async () => {
    try {
      const data = await retrieveLeaveTypes({employeeId});
      const options = (data || []).map(item => ({
        label: item.LeaveName,
        value: item.LeaveName,
      }));
      setLeaveTypeOptions(options);
    } catch (error) {
      showError('Failed to fetch leave types');
    }
  };

  const fetchAvailableLeaves = async leaveTypeName => {
    setIsFetchingAvailable(true);
    try {
      const data = await calculateAvailableLeaveDays({
        employeeId,
        leaveName: leaveTypeName,
      });

      if (data && data.length > 0) {
        const record = data[0];
        setFormData(prev => ({
          ...prev,
          available: String(record.AvailableModified ?? '0.00'),
        }));
      } else {
        setFormData(prev => ({...prev, available: '0.00'}));
      }
    } catch (error) {
      console.error('Failed to fetch available leaves:', error);
      setFormData(prev => ({...prev, available: '0.00'}));
    } finally {
      setIsFetchingAvailable(false);
    }
  };

  const shortLeaveTypeOptions = [
    {label: 'First Half', value: 'First Half'},
    {label: 'Second Half', value: 'Second Half'},
  ];

  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        setIsLoading(true);
        try {
          await fetchLeaveTypes();

          if (mode === 'create') {
            setFormData(createInitialFormData());
          } else if (mode === 'edit' && leaveData?.recId) {
            setFormData({
              ...createInitialFormData(),
              ...leaveData,
            });
          }
        } finally {
          setIsLoading(false);
        }
      };

      init();
    }, [mode, leaveData?.recId]),
  );

  // ---------------- Helpers ----------------
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // ✅ REPLACE WITH THIS
  // const formatDate = date => {
  //   if (!date) return '';
  //   return formatDateValue(
  //     date,
  //     selectedFormat,
  //     'date',
  //     selectedTimeFormat,
  //     selectedTimezone,
  //   );
  // };

  const formatDate = date => formatDynamicsDate(parseDynamicsDate(date));

  const formatToISOWithTime = dateInput => {
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

  // ---------------- Leave Type change ----------------
  const isShortLeaveType = typeValue => {
    if (!typeValue) return false;
    return String(typeValue).toLowerCase().includes('short');
  };

  const handleLeaveTypeChange = item => {
    const newLeaveType = item.value;
    const shortAllowed = isShortLeaveType(newLeaveType);

    setFormData(prev => ({
      ...prev,
      leaveType: newLeaveType,
      leaveTypeName: newLeaveType,
      isShortLeave: shortAllowed ? prev.isShortLeave : false,
      shortLeaveType: shortAllowed ? prev.shortLeaveType : '',
      available: '0.00',
    }));

    fetchAvailableLeaves(newLeaveType);
  };

  // ---------------- Date change ----------------
  const handleStartDateChange = date => {
    const formatted = formatToISOWithTime(date);
    setShowStartCalendar(false);

    if (formData.toDate) {
      const start = new Date(formatted);
      const end = new Date(formData.toDate);
      if (start > end) {
        showWarning('Start date cannot be after end date'); // was: setAlertMessage + setAlertModal(true)
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      fromDate: formatted,
    }));
  };

  const handleEndDateChange = date => {
    const formatted = formatToISOWithTime(date);
    setShowEndCalendar(false);

    const currentFromDate = formData.fromDate;

    if (currentFromDate) {
      const start = new Date(currentFromDate);
      const end = new Date(formatted);
      if (end < start) {
        showWarning('End date cannot be before start date'); // was: setAlertMessage + setAlertModal(true)
        setFormData(prev => ({...prev, toDate: ''}));
        return;
      }
    }

    // Days will be auto-calculated by the useEffect watching fromDate/toDate
    setFormData(prev => ({...prev, toDate: formatted}));
  };

  const handleDatePickerOpen = () => {
    if (!formData.leaveType) {
      showWarning('Please select Leave Type first');
      return false;
    }
    return true;
  };

  // ---------------- Save ----------------
  const handleSave = async actionType => {
    if (processingButton) return;

    const missingFields = [];

    if (!formData.leaveType) missingFields.push('Leave Type');
    if (!formData.fromDate) missingFields.push('From Date');
    if (!formData.isShortLeave && !formData.toDate)
      missingFields.push('To Date');
    if (formData.isShortLeave && !formData.shortLeaveType) {
      missingFields.push('Short Leave Type');
    }

    if (missingFields.length > 0) {
      showWarning(
        `Please fill the required fields:\n${missingFields.join('\n')}`,
      );
      return;
    }

    setProcessingButton(actionType);
    setIsProcessing(true);

    try {
      const contractData = {
        leaveNameForCreation: formData.leaveType,
        fromDateForCreation: formData.fromDate,
        toDateForCreation: formData.isShortLeave
          ? formData.fromDate
          : formData.toDate,
        leaveDaysForCreation: formData.days,
        leaveHoursForCreation: formData.hrs,
        isShortLeave: formData.isShortLeave,
        shortleaveType: formData.shortLeaveType,
        isAdjustment: formData.isAdjustment,
        note: formData.note,
        Worker: WorkerRecId,
      };

      const response = await createDFEmployeeLeaveRequest({
        leaveData: contractData,
      });

      // IsSuccess comes back as string "true"/"false" due to parseTagValue: false
      const isSuccess =
        response?.IsSuccess === 'true' || response?.IsSuccess === true;
      const message = response?.Message || '';

      if (isSuccess) {
        notifySuccess(message || 'Leave request created successfully');
        showSuccess(message || 'Leave request created successfully');

        setTimeout(() => {
          setFormData(createInitialFormData());
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
        }, 1500);
      } else {
        // Show the actual AX error/validation message to the user
        notifyError(message || 'Failed to create leave request');
        showError(message || 'Failed to create leave request');
      }
    } catch (error) {
      console.error('Error saving leave request:', error);
      showError('Something went wrong while saving the leave request');
    } finally {
      setProcessingButton('');
      setIsProcessing(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchLeaveTypes()]);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  return (
    <ActionPaneContainer
      pageTitle={getPageLabel()}
      isBackButton={true}
      showFooter={false}
      showTabNavigator={true}
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
          {isProcessing && (
            <View style={styles.DSR_ProcessingOverlay}>
              <View style={styles.DSR_ProcessingContainer}>
                <ActivityIndicator size="large" color={brand.primaryStrong} />
                <Text style={styles.DSR_ProcessingText}>Processing...</Text>
              </View>
            </View>
          )}

          <KeyboardAwareScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.DSR_FormContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            enableOnAndroid={true}
            extraScrollHeight={20}
            keyboardOpensCalledOnce={true}>
            {/* Leave Type */}
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              Leave type *
            </Text>
            <Dropdown
              style={[styles.DSR_Input, isRTL && {textAlign: 'left'}]}
              data={leaveTypeOptions}
              labelField="label"
              valueField="value"
              placeholder="Select leave type"
              value={formData.leaveType}
              onChange={handleLeaveTypeChange}
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
              activeColor={brand.tint}
              containerStyle={[
                styles.DSR_DropdownContainer,
                {marginTop: Platform.OS === 'ios' ? 5 : 2, zIndex: 1000},
              ]}
              itemContainerStyle={styles.DSR_DropdownItemContainer}
              maxHeight={280}
              dropdownPosition="auto"
              search
              searchPlaceholder="Search Leave Type"
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

            {/* From Date */}
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              From date *
            </Text>
            <TouchableOpacity
              style={[styles.DSR_DateSelector, isRTL && {flexDirection: 'row'}]}
              onPress={() => {
                if (handleDatePickerOpen()) {
                  setShowStartCalendar(true);
                }
              }}>
              <View style={{flex: 1}}>
                <Text
                  style={[
                    styles.DSR_DateText,
                    isRTL && {textAlign: 'left', writingDirection: 'rtl'},
                  ]}>
                  {formData.fromDate
                    ? formatDate(formData.fromDate)
                    : 'Select From date'}
                </Text>
              </View>
              <Icon name="calendar" size={20} color={brand.primaryStrong} />
            </TouchableOpacity>

            {/* To Date — disabled when short leave is active */}
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              To date {formData.isShortLeave ? '' : '*'}
            </Text>
            <TouchableOpacity
              style={[
                styles.DSR_DateSelector,
                isRTL && {flexDirection: 'row'},
                formData.isShortLeave && styles.DSR_Disabled,
              ]}
              disabled={formData.isShortLeave}
              onPress={() => {
                if (handleDatePickerOpen()) {
                  setShowEndCalendar(true);
                }
              }}>
              <View style={{flex: 1}}>
                <Text
                  style={[
                    styles.DSR_DateText,
                    isRTL && {textAlign: 'left', writingDirection: 'rtl'},
                    formData.isShortLeave && {color: '#9E9E9E'},
                  ]}>
                  {formData.isShortLeave
                    ? formatDate(formData.fromDate)
                    : formData.toDate
                    ? formatDate(formData.toDate)
                    : 'Select to date'}
                </Text>
              </View>
              <Icon
                name="calendar"
                size={20}
                color={formData.isShortLeave ? '#BDBDBD' : brand.primaryStrong}
              />
            </TouchableOpacity>

            {/* Short Leave Toggle */}
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              Short leave
            </Text>
            <Switch
              value={formData.isShortLeave}
              disabled={
                !isShortLeaveType(formData.leaveType) || formData.isAdjustment
              }
              onValueChange={value => {
                setFormData(prev => ({
                  ...prev,
                  isShortLeave: value,
                  shortLeaveType: value ? prev.shortLeaveType : '',
                  toDate: value ? '' : prev.toDate,
                }));
              }}
              trackColor={{false: '#BDBDBD', true: brand.primaryStrong}}
              thumbColor="#fff"
              style={{alignSelf: 'flex-start', marginTop: 4}}
            />

            {/* Short Leave Type Dropdown */}
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              Short leave type {formData.isShortLeave ? '*' : ''}
            </Text>
            <Dropdown
              style={[
                styles.DSR_Input,
                isRTL && {textAlign: 'left'},
                !formData.isShortLeave && styles.DSR_Disabled,
              ]}
              data={shortLeaveTypeOptions}
              labelField="label"
              valueField="value"
              placeholder="Select short leave type"
              value={formData.shortLeaveType}
              disable={!formData.isShortLeave}
              onChange={item => {
                setFormData(prev => ({
                  ...prev,
                  shortLeaveType: item.value,
                }));
              }}
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
              activeColor={brand.tint}
              containerStyle={[
                styles.DSR_DropdownContainer,
                {marginTop: Platform.OS === 'ios' ? 5 : 2, zIndex: 998},
              ]}
              itemContainerStyle={styles.DSR_DropdownItemContainer}
              maxHeight={280}
              dropdownPosition="auto"
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

            {/* Available */}
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              Available
            </Text>
            {isFetchingAvailable ? (
              <ActivityIndicator
                size="small"
                color={brand.primaryStrong}
                style={{marginTop: 8, alignSelf: 'flex-start'}}
              />
            ) : (
              <Text
                style={[
                  styles.DSR_Input,
                  styles.DSR_Disabled,
                  {textAlign: 'left'},
                ]}>
                {formData.available || '0.00'}
              </Text>
            )}

            {/* Days */}
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              Days
            </Text>
            {isCalculatingDays ? (
              <ActivityIndicator
                size="small"
                color={brand.primaryStrong}
                style={{marginTop: 8, alignSelf: 'flex-start'}}
              />
            ) : (
              <Text
                style={[
                  styles.DSR_Input,
                  styles.DSR_Disabled,
                  {textAlign: 'left'},
                ]}>
                {formData.days || '0.00'}
              </Text>
            )}

            {/* Hrs */}
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              Hrs
            </Text>
            <Text
              style={[
                styles.DSR_Input,
                styles.DSR_Disabled,
                {textAlign: 'left'},
              ]}>
              {formData.hrs || '0.00'}
            </Text>

            {/* Adjustment Toggle */}
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              Adjustment
            </Text>
            <Switch
              value={formData.isAdjustment}
              disabled={formData.isShortLeave}
              onValueChange={value => {
                setFormData(prev => ({...prev, isAdjustment: value}));
              }}
              trackColor={{false: '#BDBDBD', true: brand.primaryStrong}}
              thumbColor="#fff"
              style={{alignSelf: 'flex-start', marginTop: 4}}
            />

            {/* Notes — bottom of form. Backed by formData.note, which
                handleSave already sends as contractData.note → WSDL "Note"
                field on DFEmployeeLeaveRequestContract, so no API/X++
                changes are needed, only this input was missing. */}
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              Notes
            </Text>
            <TextInput
              style={[
                styles.DSR_Input,
                styles.DSR_TextArea,
                isRTL && {textAlign: 'right', writingDirection: 'rtl'},
              ]}
              value={formData.note}
              onChangeText={text => handleInputChange('note', text)}
              placeholder="Enter notes"
              placeholderTextColor="#888"
              multiline
              numberOfLines={4}
            />
          </KeyboardAwareScrollView>

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
        </SafeAreaView>
      )}

      {showStartCalendar && (
        <CalendarModal
          visible={showStartCalendar}
          initialDate={formData.fromDate}
          onDateSelected={handleStartDateChange}
          onClose={() => setShowStartCalendar(false)}
        />
      )}

      {showEndCalendar && (
        <CalendarModal
          visible={showEndCalendar}
          initialDate={formData.toDate}
          onDateSelected={handleEndDateChange}
          onClose={() => setShowEndCalendar(false)}
        />
      )}

      <AlertModal {...alertModalProps} />
    </ActionPaneContainer>
  );
};

export default DFEmployeeLeaveRequestSaveRecord;
