/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
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
import {translate as t} from '../../../../store/utils/translate';

import {CreateIdentityRequest} from '../../../../API/PersonalInformation/Identification/CreateIdentityRequest';
import {UpdateIdentityRequest} from '../../../../API/PersonalInformation/Identification/UpdateIdentityRequest';
import {SubmitIdentificationRequest} from '../../../../API/PersonalInformation/Identification/SubmitIdentificationRequest';
import {FindIdentificationTypeRequest} from '../../../../API/PersonalInformation/Identification/FindIdentificationTypeRequest';
import {getpersonalContactsLabels} from '../../../../API/PersonalInformation/Identification/GetIdentificationLabels';

import AlertModal from '../../../../components/Alert/AlertModal';
import CalendarModal from '../../../../components/Leaves/CalendarModal';
import ActionPaneContainer from '../../../../components/ActionPaneContainer';
import SaveRecordButtons from '../../../../components/Buttons/SaveRecordButtons';
import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';

import styles from '../../../../styles/styles';

const IdentificationNumberSaveRecord = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const userData = useSelector(state => state.user.userData);
  const routeUserData = route.params?.userData;
  const effectiveUserData = routeUserData || userData || {};

  const {
    mode = 'create',
    identityData = {},
    employeeId = identityData.employeeId || effectiveUserData?.employeeId || '',
    employeeName = identityData.employeeName ||
      effectiveUserData?.employeeName ||
      '',
    WorkerRecId = identityData.WorkerRecId ||
      effectiveUserData?.WorkerRecId ||
      '',
    cameFrom = 'MainDashboard',
    originalCameFrom = null,
  } = route.params || {};
  const isRTL = useSelector(state => state.language.isRTL);
  const [identTypes, setIdentTypes] = useState([]);
  const [showIssuePicker, setShowIssuePicker] = useState(false);
  const [showExpirationPicker, setShowExpirationPicker] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarField, setCalendarField] = useState('');
  const [processingButton, setProcessingButton] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [PersonalContactsLabelData, setPersonalContactsLabelsData] = useState(
    {},
  );
  const createInitialFormData = () => ({
    recId:
      !identityData.recId || identityData.recId === '0'
        ? ''
        : identityData.recId,
    employeeId,
    employeeName,
    WorkerRecId,
    IdentificationType: '',
    IdentificationNumber: '',
    Description: '',
    IssuingAgency: '',
    IssueDate: '',
    ExpirationDate: '',
    WorkflowOperation: '',
  });

  const [formData, setFormData] = useState(() => createInitialFormData());
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const goBack = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'IdentificationNumberListPage',
          params: {
            employeeId,
            employeeName,
            WorkerRecId,
            cameFrom: originalCameFrom || 'DisplayListPage',
          },
        },
      ],
    });
  }, [navigation, employeeId, employeeName, WorkerRecId, originalCameFrom]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        goBack();
        return true;
      };
      const sub = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => sub.remove();
    }, [goBack]),
  );

  useFocusEffect(
    useCallback(
      () => scrollViewRef.current?.scrollTo({y: 0, animated: false}),
      [],
    ),
  );

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

  // Load identification types
  // useFocusEffect(
  //   React.useCallback(() => {
  //     const fetchIdentificationTypes = async () => {
  //       try {
  //         const response = await FindIdentificationTypeRequest();

  //         if (response && Array.isArray(response)) {
  //           setIdentTypes(
  //             response.map(item => ({
  //               label: item.IdentificationTypeId, // or item.Description / item.Name
  //               value: item.RecId,
  //             })),
  //           );
  //         }
  //       } catch (error) {
  //         console.error('Failed to load identification types:', error);
  //       }
  //     };
  //     fetchIdentificationTypes();
  //   }, []),
  // );

  // useFocusEffect(
  //   React.useCallback(() => {
  //     if (mode === 'create') {
  //       const freshFormData = createInitialFormData();
  //       setFormData(freshFormData);
  //     } else if (mode === 'edit' && identityData?.recId) {
  //       // Set up the form for edit mode
  //       const editFormData = {
  //         ...createInitialFormData(),
  //         ...identityData,
  //         employeeId: identityData.employeeId || employeeId,
  //         employeeName: identityData.employeeName || employeeName,
  //         WorkerRecId: identityData.WorkerRecId || WorkerRecId,
  //       };

  //       setFormData(editFormData);

  //       FindIdentificationTypeRequest().then(() => {
  //         if (mode === 'edit' && identityData) {
  //           setFormData(prev => ({
  //             ...prev,
  //           }));
  //         }
  //       });
  //     }
  //   }, [mode, identityData?.RecId, employeeId, employeeName, WorkerRecId]),
  // );
  const fetchPersonalContactsLabels = async () => {
    try {
      const labels = await getpersonalContactsLabels();
      return labels || {};
    } catch (error) {
      console.error('Error fetching Personal Contacts labels:', error);
      return {};
    }
  };
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const initializeForm = async () => {
        setIsLoading(true);

        try {
          // 🔹 Fetch labels FIRST
          const labels = await fetchPersonalContactsLabels();
          if (!isActive) return;
          setPersonalContactsLabelsData(labels || {});

          console.log('ashan', setPersonalContactsLabelsData);

          // 🔹 Fetch Identification Types
          const identResponse = await FindIdentificationTypeRequest();
          if (!isActive) return;

          if (identResponse && Array.isArray(identResponse)) {
            setIdentTypes(
              identResponse.map(item => ({
                label: item.IdentificationTypeId,
                value: item.RecId,
              })),
            );
          }

          // 🔹 CREATE MODE
          if (mode === 'create') {
            setFormData(createInitialFormData());
            setAlertMessage('');
          }

          // 🔹 EDIT MODE
          else if (mode === 'edit' && identityData?.recId) {
            setFormData({
              ...createInitialFormData(),
              ...identityData,
              employeeId: identityData.employeeId || employeeId,
              employeeName: identityData.employeeName || employeeName,
              WorkerRecId: identityData.WorkerRecId || WorkerRecId,
            });
          }
        } catch (error) {
          console.error('Error initializing Identification form:', error);
          setAlertMessage('Failed to fetch data');
          setAlertModal(true);
        } finally {
          if (isActive) setIsLoading(false);
        }
      };

      initializeForm();

      // ✅ Proper cleanup (VERY IMPORTANT)
      return () => {
        isActive = false;
      };
    }, [mode, identityData?.recId, employeeId, employeeName, WorkerRecId]),
  );

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      setFormData(createInitialFormData());
    } finally {
      setIsLoading(false);
    }
  };

  const convertDateFormat = date => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(d.getDate()).padStart(2, '0')}T12:00:00`;
  };

  const handleDateChange = date => {
    setFormData(prev => ({...prev, [calendarField]: convertDateFormat(date)}));
    setShowCalendar(false);
  };

  const handleInputChange = (field, value) =>
    setFormData(prev => ({...prev, [field]: value}));

  // Date helpers
  const formatToISOWithTime = date => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(d.getDate()).padStart(2, '0')}T12:00:00`;
  };

  const formatDate = date => {
    if (!date) return '';
    const d = new Date(date);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(
      d.getDate(),
    ).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const onIssueDateSelected = (event, selectedDate) => {
    setShowIssuePicker(false);
    if (selectedDate)
      setFormData(prev => ({
        ...prev,
        IssueDate: formatToISOWithTime(selectedDate),
      }));
  };

  const onExpirationDateSelected = (event, selectedDate) => {
    setShowExpirationPicker(false);
    if (selectedDate)
      setFormData(prev => ({
        ...prev,
        ExpirationDate: formatToISOWithTime(selectedDate),
      }));
  };

  const validateFields = () => {
    const missing = [];
    if (!formData.employeeId) missing.push('Employee Id');
    if (!formData.IdentificationType) missing.push('Identification Type');
    if (!formData.IdentificationNumber) missing.push('Identification Number');
    if (!formData.IssueDate) missing.push('Issue Date');
    if (!formData.ExpirationDate) missing.push('Expiration Date');
    if (missing.length > 0) {
      setAlertMessage('Please fill in:\n' + missing.join('\n'));
      setAlertModal(true);
      return false;
    }
    return true;
  };

  // 🔧 Centralized Save/Update/Submit logic
  const handleAction = async (actionType, modalMode, data) => {
    try {
      const contract = {
        RecId: data.recId || '',
        Description: data.Description || null,
        EmployeeId: data.WorkerRecId,
        ExpirationDate: data.ExpirationDate || null,
        IssuedDate: data.IssueDate || null,
        IdentificationNumber: data.IdentificationNumber,
        IdentificationType: data.IdentificationType,
        IdentificationTypeId: data.IdentificationTypeId || null,
        IsPrimary: data.IsPrimary === undefined ? 'No' : data.IsPrimary,
        IssuingAgency: data.IssuingAgency || 0,
        IssuingAgencyId: data.IssuingAgencyId || '',
        PersonIdentificationNumberRecVersion:
          data.PersonIdentificationNumberRecVersion || 1,
        WorkflowOperation: data.WorkflowOperation,
      };

      let response, submitResult;

      if (modalMode === 'create') {
        response = await CreateIdentityRequest({identityData: contract});
        if (actionType === 'submit' && response?.RecId) {
          submitResult = await SubmitIdentificationRequest({
            recId: response.RecId,
          });
        }
      } else if (modalMode === 'update') {
        response = await UpdateIdentityRequest({identityData: contract});
        if (actionType === 'submit' && response.IsSuccess) {
          submitResult = await SubmitIdentificationRequest({
            recId: contract.RecId,
          });
        }
      }

      if (response) {
        const textAction = modalMode === 'create' ? 'Created' : 'Updated';
        let textSubmit;
        if (submitResult.IsSuccess === 'true') {
          textSubmit = actionType === 'submit' ? ' and Submitted' : '';
          setAlertMessage(
            `${contract.IdentificationTypeId} is ${textAction}${textSubmit} Successfully`,
          );
        } else if (submitResult.IsSuccess === 'false') {
          textSubmit = actionType === 'submit' ? ' but not Submitted' : '';
          setAlertMessage(
            `${contract.IdentificationTypeId} is ${textAction}${textSubmit}`,
          );
        }

        setAlertModal(true);
        return {success: true, recId: response.RecId || contract.RecId};
      } else {
        throw new Error('No response from server');
      }
    } catch (error) {
      console.error('Error in handleAction:', error);
      setAlertMessage('Failed to process request.');
      setAlertModal(true);
      return {success: false};
    }
  };

  const handleSave = async actionType => {
    if (processingButton) return;
    if (!validateFields()) return;

    setProcessingButton(actionType);
    setIsProcessing(true);

    console.log('Form Data : ', formData);
    try {
      const result = await handleAction(
        actionType,
        mode === 'edit' ? 'update' : 'create',
        formData,
      );
      console.log('Resut', result);
      if (result.success) {
        setTimeout(() => {
          setAlertModal(false);
          setFormData(createInitialFormData());
          navigation.navigate('IdentificationNumberListPage', {
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
        }, 1500);
      }
    } finally {
      setProcessingButton('');
      setIsProcessing(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const isEditRecordESS =
    formData.WorkflowOperation === '' && mode === 'edit' ? true : false;
  return (
    <ActionPaneContainer
      pageTitle={
        mode === 'edit' ? 'Edit Identification' : 'Create Identification'
      }
      isBackButton={true}
      showFooter={false}
      isHeaderActive={true}
      showTabNavigator={!isKeyboardVisible}
      onBackPress={goBack}
      onRefresh={handleRefresh}>
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
            showsVerticalScrollIndicator={false}>
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              {PersonalContactsLabelData?.employeeNamelbl || 'Employee Name'}
            </Text>
            <Text style={[styles.DSR_Input, styles.DSR_Disabled]}>
              {formData.employeeName}
            </Text>

            {/*<Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
                {PersonalContactsLabelData?.IdentificationTypelbl ||
                  'Request Date'}
              </Text>
              <Text style={[styles.DSR_Input, styles.DSR_Disabled]}>
                {formatDate(today)}
              </Text>*/}

            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              {PersonalContactsLabelData?.IdentificationTypelbl ||
                'Identification Type *'}
            </Text>
            <Dropdown
              style={[styles.DSR_Input, isEditRecordESS && styles.DSR_Disabled]}
              data={identTypes}
              labelField="label"
              valueField="value"
              placeholder="Select Identification Type"
              value={formData.IdentificationType}
              disable={isEditRecordESS}
              onChange={item =>
                setFormData(prev => ({
                  ...prev,
                  IdentificationType: item.value,
                  IdentificationTypeDescription: item.label,
                }))
              }
              placeholderStyle={styles.DSR_DropdownPlaceholder}
              placeholderTextColor="#888"
              selectedTextStyle={styles.DSR_DropdownSelectedText}
              itemTextStyle={styles.DSR_DropdownItemText}
            />

            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              {PersonalContactsLabelData?.IdentificationNumberlbl ||
                'Account Identification'}
            </Text>
            <TextInput
              style={styles.DSR_Input}
              value={formData.IdentificationNumber}
              onChangeText={v => handleInputChange('IdentificationNumber', v)}
              placeholder="Enter Identification Number"
              placeholderTextColor="#888"
            />

            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              {PersonalContactsLabelData?.Descriptionlbl || 'Description'}
            </Text>
            <TextInput
              style={[styles.DSR_Input, styles.DSR_TextArea]}
              value={formData.Description}
              onChangeText={v => handleInputChange('Description', v)}
              placeholder="Enter Description"
              placeholderTextColor="#888"
              multiline
            />

            {/* <Text style={styles.DSR_Label}>Issuing Agency</Text>
              <TextInput
                style={styles.DSR_Input}
                value={formData.IssuingAgency}
                onChangeText={v => handleInputChange('IssuingAgency', v)}
                placeholder="Enter Issuing Agency"
              /> */}

            {/* <Text style={styles.DSR_Label}>Issue Date</Text>
              <TouchableOpacity
                style={styles.DSR_DateSelector}
                onPress={() => setShowIssuePicker(true)}>
                <View style={{flex: 1}}>
                  <Text style={styles.DSR_DateText}>
                    {formData.IssueDate
                      ? formatDate(formData.IssueDate)
                      : 'Select Issue Date'}
                  </Text>
                </View>
                <Icon name="calendar" size={20} color="#0A66C2" />
              </TouchableOpacity>
              {showIssuePicker && (
                <DateTimePicker
                  value={
                    formData.IssueDate
                      ? new Date(formData.IssueDate)
                      : new Date()
                  }
                  mode="date"
                  display="default"
                  onChange={onIssueDateSelected}
                  placeholderTextColor="#888"
                />
              )} */}

            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              {PersonalContactsLabelData?.IssuedDatelbl || 'Issue Date *'}
            </Text>
            <TouchableOpacity
              style={styles.DSR_DateSelector}
              onPress={() => {
                setCalendarField('IssueDate');
                setShowCalendar(true);
              }}>
              <View style={{flex: 1}}>
                <Text style={styles.DSR_DateText}>
                  {formData.IssueDate
                    ? formatDate(formData.IssueDate)
                    : 'Select Issue Date'}
                </Text>
              </View>
              <Icon name="calendar" size={20} color="#0A66C2" />
            </TouchableOpacity>

            {/* <Text style={styles.DSR_Label}>Expiration Date</Text>
              <TouchableOpacity
                style={styles.DSR_DateSelector}
                onPress={() => setShowExpirationPicker(true)}>
                <View style={{flex: 1}}>
                  <Text style={styles.DSR_DateText}>
                    {formData.ExpirationDate
                      ? formatDate(formData.ExpirationDate)
                      : 'Select Expiration Date'}
                  </Text>
                </View>
                <Icon name="calendar" size={20} color="#0A66C2" />
              </TouchableOpacity>
              {showExpirationPicker && (
                <DateTimePicker
                  value={
                    formData.ExpirationDate
                      ? new Date(formData.ExpirationDate)
                      : new Date()
                  }
                  mode="date"
                  display="default"
                  onChange={onExpirationDateSelected}
                  placeholderTextColor="#888"
                />
              )} */}

            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              {PersonalContactsLabelData?.ExpirationDatelbl ||
                'Expiration Date *'}
            </Text>
            <TouchableOpacity
              style={styles.DSR_DateSelector}
              onPress={() => {
                setCalendarField('ExpirationDate');
                setShowCalendar(true);
              }}>
              <View style={{flex: 1}}>
                <Text style={styles.DSR_DateText}>
                  {formData.ExpirationDate
                    ? formatDate(formData.ExpirationDate)
                    : 'Select Expiration Date'}
                </Text>
              </View>
              <Icon name="calendar" size={20} color="#0A66C2" />
            </TouchableOpacity>
          </ScrollView>

          <SaveRecordButtons
            mode={mode}
            processingButton={processingButton}
            onSave={handleSave}
            onCancel={goBack}
            isDisabled={
              processingButton === 'create' || processingButton === 'submit'
            }
          />
          {/* </KeyboardAvoidingView> */}

          <AlertModal
            visible={alertModal}
            heading="Alert"
            text={alertMessage}
            onPress={() => setAlertModal(false)}
          />

          <CalendarModal
            visible={showCalendar}
            current={formData[calendarField]}
            onDateSelected={handleDateChange}
            onClose={() => setShowCalendar(false)}
          />
        </SafeAreaView>
      )}
    </ActionPaneContainer>
  );
};

export default IdentificationNumberSaveRecord;
