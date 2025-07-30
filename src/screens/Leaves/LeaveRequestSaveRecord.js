/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useContext, useCallback} from 'react';
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
  BackHandler,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {UserContext} from './../../context/UserContext';
import {CompanyContext} from '../../context/CompanyContext';
import {Dropdown} from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/FontAwesome';

import CalendarModal from '../../components/Leaves/CalendarModal';
import {AlertModal} from '../../components/Leaves/AlertModal';
import {
  fetchLeaveBalance,
  fetchLeaveCodes,
} from '../../Controller/leaveRequestApiService';

import {createLeaveRequest} from '../../API/Leaves/CreateLeaveRequest';
import {submit} from '../../API/Leaves/submit';
import {update} from '../../API/Leaves/update';

import {retrieveByEmail} from '../../API/WorkflowTrackingStatusTable/retrieveByEmail';
import LogoutAlertModal from '../../components/Leaves/LogoutAlertModal';
import MainPageHeader from '../../components/PageHeader/MainPageHeader';
import NotificationDropdown from '../../components/NotificationDropdown';
import CompanyDropdown from '../../components/PageHeader/CompanyDropdown';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';

const LeaveRequestSaveRecord = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {userData} = useContext(UserContext);
  const {selectedLegalEntity, setSelectedLegalEntity, legalEntities} =
    useContext(CompanyContext);
  const companyToUse = selectedLegalEntity || userData.defaultLegalEntity;

  // Navigation params with safe defaults
  const {
    mode = 'create',
    leaveData = {},
    employeeId = leaveData.employeeId || userData?.employeeId || '',
    employeeName = leaveData.employeeName || userData?.employeeName || '',
    WorkerRecId = leaveData.WorkerRecId || userData?.WorkerRecId || '',
    cameFrom = 'MainDashboard', // Fixed: use consistent parameter name
  } = route.params || {};

  // State declarations
  // const [leaveCodeDropDown, setLeaveCodeDropDown] = useState([]);
  const [LeaveCodesForEmployee, setLeaveCodesForEmployee] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create initial form data function
  const createInitialFormData = () => ({
    recId: '',
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

  // Add state to track when form data is properly initialized
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isCompanySwitching, setIsCompanySwitching] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationVisible, setNotificationVisible] = useState(false);

  // Fixed goBack function with proper navigation logic
  const goBack = useCallback(() => {
    if (cameFrom === 'MainDashboard') {
      // Navigate back to MainDashboard
      navigation.navigate('MainDashboard');
    } else if (cameFrom === 'LeavesListPage') {
      // Navigate back to LeavesListPage with required params
      navigation.navigate('LeavesListPage', {
        employeeId: formData.employeeId || employeeId,
        employeeName: formData.employeeName || employeeName,
        WorkerRecId: formData.WorkerRecId || WorkerRecId,
        cameFrom: 'LeaveRequestSaveRecord', // Track where we came from
      });
    } else {
      // Default fallback - just go back
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

  // Reset form data when screen comes into focus and mode changes
  useFocusEffect(
    React.useCallback(() => {
      if (mode === 'create') {
        // Always reset form data for create mode
        const freshFormData = createInitialFormData();
        setFormData(freshFormData);
        setIsFormInitialized(true);
      } else if (mode === 'edit' && leaveData?.recId) {
        const editFormData = {
          ...createInitialFormData(),
          ...leaveData,
          employeeId: leaveData.employeeId || employeeId,
          employeeName: leaveData.employeeName || employeeName,
          WorkerRecId: leaveData.WorkerRecId || WorkerRecId,
        };

        setFormData(editFormData);
        setIsFormInitialized(true);

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
        setIsFormInitialized(true);
      }
    }, [mode, leaveData?.recId, employeeId, employeeName, WorkerRecId]),
  );

  useFocusEffect(
    useCallback(() => {
      closeAllOverlays();

      const onBackPress = () => {
        goBack();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => {
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
      };
    }, [goBack]),
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      closeAllOverlays();
    });

    return unsubscribe;
  }, [navigation]);

  // Update the header configuration ONLY after form is initialized
  useEffect(() => {
    if (!isFormInitialized) return;

    const headerOptions = MainPageHeader({
      onToggleDrawer: goBack,
      onTitle: mode === 'edit' ? 'Edit' : 'Create',
      onShowNotify: toggleNotification,
      onCount: notificationCount,
      onLogout: handleLogout,
      isBack: true,
      onDatPress: toggleCompanyDropdown,
      selectedDat:
        selectedLegalEntity || userData?.defaultLegalEntity || 'Select Company',
      defaultDat: userData?.defaultLegalEntity,
    });
    navigation.setOptions(headerOptions);
  }, [
    navigation,
    notificationCount,
    notificationVisible,
    notifications,
    goBack,
    selectedLegalEntity,
    userData?.defaultLegalEntity,
    mode,
    isFormInitialized,
  ]);

  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    fetchNotifications();
    return () => clearInterval(interval);
  }, [userData.email]);

  const closeAllOverlays = () => {
    setDropdownVisible(false);
    setNotificationVisible(false);
    setModalVisible(false);
    navigation.closeDrawer?.();
  };

  const toggleNotification = () => {
    closeAllOverlays();
    setNotificationVisible(prev => !notificationVisible);
  };
  const handleLogout = () => {
    closeAllOverlays();
    setModalVisible(true);
  };
  const toggleCompanyDropdown = () => {
    closeAllOverlays();
    setDropdownVisible(prev => !dropdownVisible);
  };
  const closeNotification = () => setNotificationVisible(false);
  const confirmLogout = () => {
    setModalVisible(false);
    navigation.navigate('Login');
  };
  const cancelLogout = () => setModalVisible(false);

  const handleCompanySelect = async newLegalEntity => {
    setIsCompanySwitching(true);
    setSelectedLegalEntity(newLegalEntity);
    console.log('Company changed to:', newLegalEntity);

    try {
      await fetchNotifications();

      const codes = await fetchLeaveCodes(formData.employeeId, newLegalEntity);
      // setLeaveCodeDropDown(codes);
      setLeaveCodesForEmployee(codes);
    } catch (error) {
      console.error('Error updating data after company change:', error);
      setAlertMessage('Failed to refresh data after company change.');
      setAlertModal(true);
    } finally {
      setIsCompanySwitching(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await retrieveByEmail({email: userData.email});
      if (Array.isArray(data)) {
        const formattedNotifications = data.map(notification => ({
          document: notification.Document,
          documentType: notification.DocumentType,
          correlationId: notification.CorrelationId,
        }));
        setNotifications(formattedNotifications);
        setNotificationCount(formattedNotifications.length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
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

        setFormData(prev => ({
          ...prev,
          balance: newBalance,
          ...(numericBalance > 0 && prev.leaveDays
            ? {
                leaveEndDate: calculateEndDate(formatted, prev.leaveDays),
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
    endDate.setDate(start.getDate() + daysNum - 1);

    return formatToISOWithTime(endDate);
  };

  const handleLeaveDaysChange = value => {
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

  const handleLeaveCodeChange = async item => {
    const newLeaveCode = item.value;

    const resetForm = {
      ...createInitialFormData(),
      employeeId: formData.employeeId,
      employeeName: formData.employeeName,
      WorkerRecId: formData.WorkerRecId,
      leaveCode: newLeaveCode,
      leaveCategory: formData.leaveCategory,
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
        RecId: data.recId === '' ? '0' : data.recId.toString(),
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
          await submit({
            recId: response.RecId,
            companyToUse: companyToUse,
          });
        }
      } else {
        response = await update({
          leaveData: leavesData,
          companyToUse: companyToUse,
        });
        if (actionType === 'submit') {
          await submit({
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
        setTimeout(() => {
          setAlertModal(false);
          // Always navigate to LeavesListPage after successful create/update
          navigation.navigate('LeavesListPage', {
            employeeId: formData.employeeId,
            employeeName: formData.employeeName,
            WorkerRecId: formData.WorkerRecId,
            highlightRecId: result.recId, // Pass the record ID for highlighting
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior="padding" style={styles.contentWrapper}>
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
            onChange={item => handleInputChange('leaveCategory', item.value)}
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
            onFocus={fetchLeaveCodesForEmployee} // 👈 call the method here
            onChange={handleLeaveCodeChange}
          />
          {/* <Dropdown
            style={styles.input}
            data={leaveCodeDropDown}
            labelField="label"
            valueField="value"
            placeholder="Select Leave Code"
            value={formData.leaveCode}
            itemTextStyle={{color: '#707070ff', fontSize: 16}}
            onChange={handleLeaveCodeChange}
          /> */}
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
            <Icon name="calendar" size={20} color="#ff7f00" />
          </TouchableOpacity>
          <CalendarModal
            visible={showCalendar}
            current={formData.leaveStartDate}
            onDateSelected={handleDateChange}
            onClose={() => setShowCalendar(false)}
          />
          <Text style={styles.label}>Leave Days *</Text>
          <TextInput
            style={styles.input}
            value={formData.leaveDays.toString()}
            onChangeText={handleLeaveDaysChange}
            keyboardType="numeric"
            placeholder="Enter number of days"
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
              <Text style={[styles.buttonText, pressed && styles.pressedText]}>
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

      {isCompanySwitching && (
        <View style={styles.loadingOverlay}>
          <CustomIndicator size="large" color="#007AFF" />
        </View>
      )}

      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => {
          setAlertModal(false);
          // Navigation is handled in handleSave for success cases
        }}
      />

      <LogoutAlertModal
        visible={modalVisible}
        heading="Are you sure?"
        text="Do you really want to logout?"
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />

      {notificationVisible && (
        <NotificationDropdown
          visible={notificationVisible}
          notifications={notifications}
          onClose={closeNotification}
        />
      )}

      {dropdownVisible && (
        <CompanyDropdown
          visible={dropdownVisible}
          onClose={() => setDropdownVisible(false)}
          legalEntities={legalEntities}
          selectedLegalEntity={selectedLegalEntity}
          onSelect={handleCompanySelect}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFA500',
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 10,
    fontWeight: '600',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  formContainer: {
    padding: 16,
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
    borderColor: '#FFA726',
    borderRadius: 20,
    paddingVertical: 12,
    marginHorizontal: 5,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  submitButton: {
    borderColor: '#28a745',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontWeight: 'bold',
    color: '#FFA726',
  },
  submitButtonText: {
    fontWeight: 'bold',
    color: '#28a745',
  },
  pressedButton: {
    backgroundColor: '#FFA726',
  },
  pressedSubmitButton: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  pressedText: {
    color: '#fff',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 9999,
  },
});

export default LeaveRequestSaveRecord;
