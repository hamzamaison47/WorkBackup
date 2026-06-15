/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome';
import {Dropdown} from 'react-native-element-dropdown';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import AlertModal from '../../components/Alert/AlertModal';
import SaveRecordButtons, {
  BUTTON_TYPES,
} from '../../components/Buttons/SaveRecordButtons';
import styles from '../../styles/styles';
import CalendarModal from '../../components/Leaves/CalendarModal';

import {eosRetrieveReasonCode} from '../../API/EmployeeEOSRequest/RetrieveReasonCode';
import {eosRetrieveNoticePeriodCode} from '../../API/EmployeeEOSRequest/RetrieveNoticePeriodCode';
import {retrieveEmployeeReporteesEOS} from '../../API/EmployeeEOSRequest/RetrieveEmployeeReportees';
import {RetrieveEmployeeReporteesEmpInfo} from '../../API/EmploymentInformation/RetrieveEmployeeReporteesEmpInfo';
import {CreateEOSRequest} from '../../API/EmployeeEOSRequest/CreateEOSRequest';
import SubmitEOSRequest from '../../API/EmployeeEOSRequest/SubmitEOSRequest';
import useNotify from '../../hooks/useNotify';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = raw => {
  if (!raw) {
    return '';
  }
  try {
    const d = new Date(raw);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}-${day}-${year}`;
  } catch {
    return raw;
  }
};

const getLastWorkingDateFromNoticePeriod = (
  noticePeriodCode,
  notificationDate,
) => {
  const base = new Date(notificationDate);
  const code = String(noticePeriodCode).toLowerCase();

  if (code.includes('one day') || code.includes('1 day')) {
    return base.toISOString().split('T')[0];
  } else if (code.includes('one month') || code.includes('1 month')) {
    base.setMonth(base.getMonth() + 1);
    return base.toISOString().split('T')[0];
  } else {
    base.setDate(base.getDate() + 30);
    return base.toISOString().split('T')[0];
  }
};

// ─── Component ────────────────────────────────────────────────────────────────
const EmployeeEOS_SaveRecord = () => {
  const userData = useSelector(state => state.user.userData);
  const {menuItems} = useSelector(state => state.menuItem);
  const today = new Date().toISOString().split('T')[0];
  const scrollRef = useRef(null);
  const navigation = useNavigation();
  const route = useRoute();

  const {
    employeeId,
    employeeName,
    WorkerRecId,
    cameFrom = 'EmployeeEOSRequestListPage',
    userData: routeUserData,
  } = route.params || {};

  const effectiveUserData = routeUserData || userData;
  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
  const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingButton, setProcessingButton] = useState('');
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [noticePeriods, setNoticePeriods] = useState([]);
  const [reasonCodes, setReasonCodes] = useState([]);
  const [showActualDateCalendar, setShowActualDateCalendar] = useState(false);
  const {notifySuccess, notifyError} = useNotify('EOS Request');
  const [formData, setFormData] = useState({
    employee: effectiveEmployeeName || userData?.employeeName || '',
    employeeId: effectiveEmployeeId || userData?.employeeId || 0,
    EmployeeId: WorkerRecId || userData?.WorkerRecId || 0,
    RecId: 0,
    activePayPeriod: '',
    EOSType: 'Resignation',
    lastWorkingDatePlanned: today,
    NoticePeriodCode: '',
    EOSNotificationDate: today,
    LastWorkingDate_Actual: today,
    reasonCode: '',
    hiringDate: userData?.OriginalHireDate || '',
    serviceDuration: '',
    remarks: '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  // ── Page Label ──────────────────────────────────────────────────────────────
  const getPageLabel = () => {
    const currentMenuItem = menuItems.find(
      item => item.MenuId === 'EOSRequestScreen',
    );
    return currentMenuItem?.Label || 'EOS Request';
  };

  // ── Back Navigation ─────────────────────────────────────────────────────────
  const goBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('EmployeeEOSRequestListPage');
    }
  }, [navigation]);

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
      if (scrollRef.current) {
        scrollRef.current.scrollTo({y: 0, animated: false});
      }
    }, []),
  );

  // ── Load Data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        await Promise.all([loadDropdowns(), loadEmployeeDefaults()]);
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, [effectiveEmployeeId]);

  const loadDropdowns = async () => {
    try {
      const [noticeData, reasonData] = await Promise.all([
        eosRetrieveNoticePeriodCode(),
        eosRetrieveReasonCode(),
      ]);
      setNoticePeriods(
        (noticeData || []).map(item => ({
          label: item.NoticePeriodCode,
          value: item.NoticePeriodCode,
        })),
      );
      setReasonCodes(
        (reasonData || []).map(item => ({
          label: item.ReasonCodeId,
          value: item.ReasonCodeId,
        })),
      );
    } catch (error) {
      console.log('Dropdown Load Error:', error);
    }
  };

  const loadEmployeeDefaults = async () => {
    try {
      const [reporteeData, empInfoData] = await Promise.all([
        retrieveEmployeeReporteesEOS(effectiveEmployeeId),
        RetrieveEmployeeReporteesEmpInfo(effectiveEmployeeId),
      ]);

      if (reporteeData?.length > 0) {
        const calculatedDate = getLastWorkingDateFromNoticePeriod('', today);
        handleChange('LastWorkingDate_Actual', today);
        handleChange('lastWorkingDatePlanned', today);
      }

      if (empInfoData?.length > 0) {
        const empData = empInfoData[0];
        handleChange('activePayPeriod', empData.ActivePayPeriodCode || '');
        handleChange(
          'hiringDate',
          empData.hiringdate || userData?.OriginalHireDate || '',
        );
        handleChange('serviceDuration', empData.ServiceDuration || '');
      }
    } catch (error) {
      console.log('Employee Info Load Error:', error);
    }
  };

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateForm = () => {
    const missing = [];
    if (!formData.NoticePeriodCode) missing.push('Notice Period Code');
    if (!formData.reasonCode) missing.push('Reason Code');

    if (missing.length > 0) {
      setAlertMessage('Please fill required fields:\n' + missing.join('\n'));
      setAlertModal(true);
      return false;
    }
    return true;
  };

  // ── API Handlers ────────────────────────────────────────────────────────────
  const handleSave = async actionType => {
    if (processingButton) return;
    if (!validateForm()) return;

    setProcessingButton(actionType);
    setIsProcessing(true);

    try {
      const result = await CreateEOSRequest({contract: formData});

      if (
        result?.IsSuccess === 'true' &&
        result?.RecId &&
        result.RecId !== '0'
      ) {
        handleChange('RecId', result.RecId);

        if (actionType === 'submit') {
          await SubmitEOSRequest(result.RecId);
          notifySuccess('EOS Request Created & Submitted Successfully!');
          setAlertMessage('EOS Request Created & Submitted Successfully!');
        } else {
          notifySuccess('EOS Request Created Successfully!');
          setAlertMessage('EOS Request Created Successfully!');
        }

        setAlertModal(true);

        setTimeout(() => {
          setAlertModal(false);
          navigation.navigate('EmployeeEOSRequestListPage', {
            employeeId: effectiveEmployeeId,
            employeeName: effectiveEmployeeName,
            WorkerRecId: WorkerRecId || userData?.WorkerRecId,
            highlightRecId: result.RecId,
            cameFrom: cameFrom,
            userData: effectiveUserData,
          });
        }, 2000);
      } else {
        const errMsg = result?.Message || 'Failed to create EOS Request.';
        notifyError(errMsg); // 👈 ADD
        setAlertMessage(errMsg);
        setAlertModal(true);
      }
    } catch (error) {
      console.error('Save error:', error);
      notifyError('Error while saving EOS Request.');
      setAlertMessage('Error while saving EOS Request.');
      setAlertModal(true);
    } finally {
      setProcessingButton('');
      setIsProcessing(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <ActionPaneContainer
      pageTitle={getPageLabel()}
      isBackButton={true}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      onBackPress={goBack}
      showPageTitleRow={true}>
      {isLoading ? (
        <View style={styles.DLP_LoadingContainer}>
          <ActivityIndicator size="large" color="#0A66C2" />
        </View>
      ) : (
        <SafeAreaView style={styles.DSR_SafeArea}>
          {isProcessing && (
            <View style={styles.DSR_ProcessingOverlay}>
              <View style={styles.DSR_ProcessingContainer}>
                <ActivityIndicator size="large" color="#0A66C2" />
                <Text style={styles.DSR_ProcessingText}>Processing...</Text>
              </View>
            </View>
          )}

          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.DSR_FormContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {/* Employee */}
            <Text style={styles.DSR_Label}>Employee</Text>
            <Text style={[styles.DSR_Input, styles.DSR_Disabled]}>
              {formData.employee}
            </Text>

            {/* Active Pay Period */}
            <Text style={styles.DSR_Label}>Active Pay Period</Text>
            <Text style={[styles.DSR_Input, styles.DSR_Disabled]}>
              {formData.activePayPeriod || '—'}
            </Text>

            {/* EOS Type — disabled, Resignation pre-selected */}
            <Text style={styles.DSR_Label}>EOS Type</Text>
            <Text style={[styles.DSR_Input, styles.DSR_Disabled]}>
              Resignation
            </Text>

            {/* Notice Period Code */}
            <Text style={styles.DSR_Label}>Notice Period Code</Text>
            <Dropdown
              style={styles.DSR_Input}
              data={noticePeriods}
              labelField="label"
              valueField="value"
              placeholder="Select Notice Period"
              value={formData.NoticePeriodCode}
              onFocus={loadDropdowns}
              onChange={item => {
                handleChange('NoticePeriodCode', item.value);

                const code = String(item.value).toLowerCase();
                let newNotificationDate = today;

                if (code.includes('one month') || code.includes('1 month')) {
                  const oneMonthLater = new Date(today);
                  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
                  newNotificationDate = oneMonthLater
                    .toISOString()
                    .split('T')[0];
                }

                handleChange('EOSNotificationDate', newNotificationDate);
                handleChange('lastWorkingDatePlanned', newNotificationDate); // ← same as notification date
                // LastWorkingDate_Actual stays as today — don't touch it
              }}
              placeholderStyle={styles.DSR_DropdownPlaceholder}
              selectedTextStyle={styles.DSR_DropdownSelectedText}
              itemTextStyle={styles.DSR_DropdownItemText}
              activeColor="#E6F0FF"
              containerStyle={[
                styles.DSR_DropdownContainer,
                {marginTop: Platform.OS === 'ios' ? 5 : 2},
              ]}
              itemContainerStyle={styles.DSR_DropdownItemContainer}
              maxHeight={280}
              dropdownPosition="auto"
              renderRightIcon={() => (
                <Icon
                  name="chevron-down"
                  size={10}
                  color="#8b8b8bff"
                  style={{marginHorizontal: 8}}
                />
              )}
              iconStyle={{width: 0, height: 0}}
            />

            {/* Notification Date */}
            <Text style={styles.DSR_Label}>Notification Date</Text>
            <Text style={[styles.DSR_Input, styles.DSR_Disabled]}>
              {formatDate(formData.EOSNotificationDate)}
            </Text>

            {/* Last Working Date Planned */}
            <Text style={styles.DSR_Label}>Last Working Date (Planned)</Text>
            <Text style={[styles.DSR_Input, styles.DSR_Disabled]}>
              {formatDate(formData.lastWorkingDatePlanned) || '—'}
            </Text>

            {/* Last Working Date Requested */}
            <Text style={styles.DSR_Label}>Last Working Date (Requested)</Text>
            <TouchableOpacity
              style={styles.DSR_DateSelector}
              onPress={() => setShowActualDateCalendar(true)}>
              <View style={{flex: 1}}>
                <Text style={styles.DSR_DateText}>
                  {formData.LastWorkingDate_Actual
                    ? formatDate(formData.LastWorkingDate_Actual)
                    : 'Select Date'}
                </Text>
              </View>
              <Icon name="calendar" size={20} color="#0A66C2" />
            </TouchableOpacity>

            {/* Reason Code */}
            <Text style={styles.DSR_Label}>Reason Code</Text>
            <Dropdown
              style={styles.DSR_Input}
              data={reasonCodes}
              labelField="label"
              valueField="value"
              placeholder="Select Reason Code"
              value={formData.reasonCode}
              onChange={item => handleChange('reasonCode', item.value)}
              placeholderStyle={styles.DSR_DropdownPlaceholder}
              selectedTextStyle={styles.DSR_DropdownSelectedText}
              itemTextStyle={styles.DSR_DropdownItemText}
              activeColor="#E6F0FF"
              containerStyle={[
                styles.DSR_DropdownContainer,
                {marginTop: Platform.OS === 'ios' ? 5 : 2},
              ]}
              itemContainerStyle={styles.DSR_DropdownItemContainer}
              maxHeight={280}
              dropdownPosition="auto"
              search
              searchPlaceholder="Search reason code..."
              inputSearchStyle={styles.DSR_DropdownSearchInput}
              renderRightIcon={() => (
                <Icon
                  name="chevron-down"
                  size={10}
                  color="#8b8b8bff"
                  style={{marginHorizontal: 8}}
                />
              )}
              iconStyle={{width: 0, height: 0}}
            />

            {/* Hiring Date */}
            <Text style={styles.DSR_Label}>Hiring Date</Text>
            <Text style={[styles.DSR_Input, styles.DSR_Disabled]}>
              {formatDate(formData.hiringDate) || '—'}
            </Text>

            {/* Service Duration */}
            <Text style={styles.DSR_Label}>Service Duration</Text>
            <Text style={[styles.DSR_Input, styles.DSR_Disabled]}>
              {formData.serviceDuration || '—'}
            </Text>

            {/* Remarks */}
            <Text style={styles.DSR_Label}>Remarks</Text>
            <TextInput
              style={[styles.DSR_Input, styles.DSR_TextArea]}
              value={formData.remarks}
              onChangeText={v => handleChange('remarks', v)}
              placeholder="Enter remarks..."
              multiline
              numberOfLines={5}
            />
          </ScrollView>

          <SaveRecordButtons
            mode="create"
            processingButton={processingButton}
            onSave={handleSave}
            onCancel={goBack}
            isDisabled={
              processingButton === 'create' || processingButton === 'submit'
            }
            showButtons={[
              BUTTON_TYPES.CREATE,
              BUTTON_TYPES.SUBMIT,
              BUTTON_TYPES.CANCEL,
            ]}
          />
        </SafeAreaView>
      )}

      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
      {showActualDateCalendar && (
        <CalendarModal
          visible={showActualDateCalendar}
          initialDate={formData.LastWorkingDate_Actual}
          onDateSelected={date => {
            const formatted = `${date.getFullYear()}-${String(
              date.getMonth() + 1,
            ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            handleChange('LastWorkingDate_Actual', formatted);
            setShowActualDateCalendar(false);
          }}
          onClose={() => setShowActualDateCalendar(false)}
        />
      )}
    </ActionPaneContainer>
  );
};

export default EmployeeEOS_SaveRecord;
