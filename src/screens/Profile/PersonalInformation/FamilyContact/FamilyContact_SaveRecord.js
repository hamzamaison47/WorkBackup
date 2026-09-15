/* eslint-disable curly */
/* eslint-disable no-shadow */
/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useCallback, useRef, useMemo, useEffect} from 'react';
import {
  Text,
  TextInput,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Switch,
  View,
  TouchableOpacity,
  BackHandler,
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
import {translate as t} from '../../../../store/utils/translate';
import Icon from 'react-native-vector-icons/FontAwesome';

import ActionPaneContainer from '../../../../components/ActionPaneContainer';
import SaveRecordButtons from '../../../../components/Buttons/SaveRecordButtons';
import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';
import AlertModal from '../../../../components/Alert/AlertModal';
import useAlertModal from '../../../../hooks/useAlertModal';
import CalendarModal from '../../../../components/Leaves/CalendarModal';
import {BUTTON_TYPES} from '../../../../components/Buttons/SaveRecordButtons';

import {retrieveRelationshipTypeId} from '../../../../API/PersonalInformation/FamilyContacts/retrieveRelationshipTypeId';
import {FamilyContactCreate} from '../../../../API/PersonalInformation/FamilyContacts/FamilyContactCreate';
import {FamilyContactUpdate} from '../../../../API/PersonalInformation/FamilyContacts/FamilyContactUpdate';
import {getpersonalContactLabels} from '../../../../API/PersonalInformation/FamilyContacts/GetPersonalContactsLabels';
import useNotify from '../../../../hooks/useNotify';

import styles from '../../../../styles/styles';
import usePalette from '../../../../hooks/usePalette';
import {borderRadius, spacing} from '../../../../store/utils/scaling';
import useAppStyles from '../../../../hooks/useAppStyles';

const FamilyContact_SaveRecord = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const isRTL = useSelector(state => state.language.isRTL);
  const userData = useSelector(state => state.user.userData);
  const P = usePalette();
  const styles = useAppStyles();

  const routeUserData = route.params?.userData;
  const effectiveUserData = routeUserData || userData || {};
  const [PersonalContactsLabelData, setPersonalContactsLabelsData] = useState(
    {},
  );
  const {notifySuccess, notifyError} = useNotify('Personal Contacts');

  const routeParams = useMemo(() => route.params || {}, [route.params]);

  const {
    mode = 'create',
    familyContactDataSet = {},
    employeeId = familyContactDataSet.employeeId ||
      effectiveUserData?.employeeId ||
      '',
    employeeName = familyContactDataSet.employeeName ||
      effectiveUserData?.employeeName ||
      '',
    WorkerRecId = familyContactDataSet.WorkerRecId ||
      effectiveUserData?.WorkerRecId ||
      '',
    cameFrom,
    originalCameFrom,
  } = routeParams;

  const today = new Date().toISOString().split('T')[0];
  const D365_MAX_DATE = '2154-12-31T23:59:59';
  const D365_MIN_DATE = '1900-01-01T00:00:00Z';
  const D365_MIN_DATETIME = '1900-01-01T12:00:00';
  const D365_MAX_DATE_ONLY = '2154-12-31';
  const D365_MAX_DATETIME = '2154-12-31T23:59:59.000';

  const getTodayISO = () => new Date().toISOString().split('T')[0];

  const createInitialFormData = useCallback(
    () => ({
      recId:
        !familyContactDataSet?.RecId || familyContactDataSet.RecId === '0'
          ? ''
          : familyContactDataSet.RecId,
      employeeId,
      employeeName,
      WorkerRecId,
      firstName: '',
      lastName: '',
      relationship: '',
      EmergencyContact: false,
      isBeneficiary: false,
      isDependent: false,
      Gender: '',
      BirthDate: '',
      IsFullTimeStudent: false,
      IsPersonWithDisabilities: false,
      WorkflowOperation: '',
      beneficiaryValidFrom: '',
      dependentValidFrom: '',
      beneficiaryValidTo: '',
      dependentValidTo: '',
    }),
    [employeeId, employeeName, WorkerRecId, familyContactDataSet?.RecId],
  );

  const [relationshipTypes, setRelationshipTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const {showSuccess, showError, showWarning, alertModalProps} =
    useAlertModal();
  const [processingButton, setProcessingButton] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBeneficiaryFromCalendar, setShowBeneficiaryFromCalendar] =
    useState(false);
  const [showBeneficiaryToCalendar, setShowBeneficiaryToCalendar] =
    useState(false);
  const [showDependentFromCalendar, setShowDependentFromCalendar] =
    useState(false);
  const [showDependentToCalendar, setShowDependentToCalendar] = useState(false);
  const [showBirthDateCalendar, setShowBirthDateCalendar] = useState(false);
  const [datePickerConfig, setDatePickerConfig] = useState({
    visible: false,
    field: '',
    value: new Date(),
    minDate: null,
    maxDate: null,
  });
  const [formData, setFormData] = useState(createInitialFormData());
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const fetchPersonalContactsLabels = useCallback(async () => {
    try {
      const labels = await getpersonalContactLabels();
      return labels || {};
    } catch (error) {
      console.error('Error fetching Personal Contacts labels:', error);
      return {};
    }
  }, []);

  const normalizeD365Date = useCallback(
    dateString => {
      if (!dateString) return '';

      if (dateString.startsWith(D365_MIN_DATE)) {
        return '';
      }

      if (dateString.startsWith(D365_MAX_DATE)) {
        return D365_MAX_DATE;
      }

      return dateString;
    },
    [D365_MIN_DATE, D365_MAX_DATE],
  );

  const goBack = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'FamilyContact_ListPage',
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

  const toBoolean = useCallback(value => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      return lower === 'true' || lower === '1' || lower === 'yes';
    }
    return false;
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const initializeForm = async () => {
        setIsLoading(true);

        try {
          const [labels, relationshipRes] = await Promise.all([
            fetchPersonalContactsLabels(),
            retrieveRelationshipTypeId(),
          ]);

          if (!isActive) return;

          setPersonalContactsLabelsData(labels);

          if (Array.isArray(relationshipRes)) {
            setRelationshipTypes(relationshipRes);
          }

          if (mode === 'create') {
            setFormData(createInitialFormData());
          } else if (mode === 'edit' && familyContactDataSet?.RecId) {
            console.log('Edit Data :', familyContactDataSet);
            const fullName = familyContactDataSet.Name || '';

            setFormData(prev => ({
              ...prev,
              recId: familyContactDataSet.RecId,
              firstName: familyContactDataSet.FirstName,
              middleName: familyContactDataSet.MiddleName,
              lastName: familyContactDataSet.LastName,
              relationship: familyContactDataSet.RelationShipTypeId || '',
              EmergencyContact: toBoolean(
                familyContactDataSet.EmergencyContact,
              ),
              isBeneficiary: toBoolean(familyContactDataSet.isBeneficiary),
              isDependent: toBoolean(familyContactDataSet.isDependent),
              Gender: familyContactDataSet.Gender || '',
              BirthDate: familyContactDataSet.BirthDate.startsWith(
                D365_MIN_DATETIME,
              )
                ? ''
                : familyContactDataSet.BirthDate,

              beneficiaryValidFrom: normalizeD365Date(
                familyContactDataSet.BeneficiaryFromDate,
              ),

              beneficiaryValidTo: normalizeD365Date(
                familyContactDataSet.BeneficiaryToDate,
              ),

              dependentValidFrom: normalizeD365Date(
                familyContactDataSet.DependentValidFrom,
              ),

              dependentValidTo: normalizeD365Date(
                familyContactDataSet.DependentValidTo,
              ),

              IsFullTimeStudent: toBoolean(
                familyContactDataSet.IsFullTimeStudent,
              ),
              IsPersonWithDisabilities: toBoolean(
                familyContactDataSet.IsPersonWithDisabilities,
              ),
              employeeId: familyContactDataSet.employeeId || employeeId,
              employeeName: familyContactDataSet.employeeName || employeeName,
              WorkerRecId: familyContactDataSet.WorkerRecId || WorkerRecId,
            }));
          }
        } catch (error) {
          console.error('Error initializing Family Contact form:', error);
          showError('Failed to load screen');
        } finally {
          if (isActive) setIsLoading(false);
        }
      };

      initializeForm();

      return () => {
        isActive = false;
      };
    }, [
      mode,
      familyContactDataSet,
      employeeId,
      employeeName,
      WorkerRecId,
      showError,
      fetchPersonalContactsLabels,
      createInitialFormData,
      toBoolean,
      normalizeD365Date,
    ]),
  );

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

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setFormData(createInitialFormData());
    } finally {
      setIsLoading(false);
    }
  }, [createInitialFormData]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
  }, []);

  const handleBeneficiaryFromChange = useCallback(
    date => {
      handleInputChange('beneficiaryValidFrom', date);
      setShowBeneficiaryFromCalendar(false);
    },
    [handleInputChange],
  );

  const handleBeneficiaryToChange = useCallback(
    date => {
      handleInputChange('beneficiaryValidTo', date);
      setShowBeneficiaryToCalendar(false);
    },
    [handleInputChange],
  );

  const handleDependentFromChange = useCallback(
    date => {
      handleInputChange('dependentValidFrom', date);
      setShowDependentFromCalendar(false);
    },
    [handleInputChange],
  );

  const handleDependentToChange = useCallback(
    date => {
      handleInputChange('dependentValidTo', date);
      setShowDependentToCalendar(false);
    },
    [handleInputChange],
  );

  const handleBirthDateChange = useCallback(
    date => {
      handleInputChange('BirthDate', date);
      setShowBirthDateCalendar(false);
    },
    [handleInputChange],
  );

  const convertDateFormat = useCallback(
    date => (date ? new Date(date).toISOString().split('T')[0] : null),
    [],
  );

  const formatDisplayDate = useCallback(dateString => {
    console.log('Date string :', dateString);
    if (!dateString) return '';
    else if (dateString === D365_MAX_DATE) return 'Never';
    const d = new Date(dateString);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  }, []);

  const showDatePicker = useCallback(
    (field, currentValue, minDate = null, maxDate = null) => {
      setDatePickerConfig({
        visible: true,
        field,
        value: currentValue ? new Date(currentValue) : new Date(),
        minDate: minDate ? new Date(minDate) : null,
        maxDate: maxDate ? new Date(maxDate) : null,
      });
    },
    [],
  );

  const handleDateChange = useCallback(
    (event, selectedDate) => {
      setDatePickerConfig(prev => ({...prev, visible: Platform.OS === 'ios'}));

      if (selectedDate && datePickerConfig.field) {
        handleInputChange(
          datePickerConfig.field,
          convertDateFormat(selectedDate),
        );
      }
    },
    [datePickerConfig.field, handleInputChange, convertDateFormat],
  );

  const validate = useCallback(() => {
    const missing = [];
    if (!formData.firstName.trim()) missing.push('First Name');
    if (!formData.relationship) missing.push('Relationship');
    if (missing.length) {
      showWarning(
        'Please fill in the following required fields:\n' + missing.join('\n'),
      );
      return false;
    }
    return true;
  }, [formData.firstName, formData.relationship, showWarning]);

  const handleAction = useCallback(
    async (mode, data) => {
      try {
        const contract = {
          RecId: Number(data.recId || 0),
          FirstName: data.firstName,
          MiddleName: data.middleName,
          LastName: data.lastName,
          Name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
          EmployeeId: data.employeeId || '',
          RelationShipTypeId: data.relationship || '',
          EmergencyContact: data.EmergencyContact ? 1 : 0,
          isDependent: data.isDependent ? 1 : 0,
          isBeneficiary: data.isBeneficiary ? 1 : 0,
          BeneficiaryFromDate: data.beneficiaryValidFrom
            ? data.beneficiaryValidFrom
            : '1900-01-01T00:00:00.000Z',

          BeneficiaryToDate:
            data.beneficiaryValidTo === D365_MAX_DATETIME
              ? D365_MAX_DATETIME
              : data.beneficiaryValidTo
              ? data.beneficiaryValidTo
              : D365_MAX_DATETIME,

          Gender: data.Gender || '',
          BirthDate: data.BirthDate || '1900-01-01T00:00:00.000Z',
          DependentValidFrom: data.dependentValidFrom
            ? data.dependentValidFrom
            : '1900-01-01T00:00:00.000Z',

          DependentValidTo:
            data.dependentValidTo === D365_MAX_DATETIME
              ? D365_MAX_DATETIME
              : data.dependentValidTo
              ? data.dependentValidTo
              : D365_MAX_DATETIME,

          IsFullTimeStudent: data.IsFullTimeStudent ? 1 : 0,
          IsPersonWithDisabilities: data.IsPersonWithDisabilities ? 1 : 0,
          Worker: Number(data.WorkerRecId) || 0,
          ApprovalStatus: 'Draft',
          WorkflowOperation: mode === 'edit' ? 'Update' : 'Create',
        };

        let response;
        if (mode === 'create') {
          response = await FamilyContactCreate({
            familyContactDataSet: contract,
          });
        } else if (mode === 'edit') {
          response = await FamilyContactUpdate({
            familyContactDataSet: contract,
          });
        }

        if (!response) {
          throw new Error('No response from server');
        }

        if (response.IsSuccess === 'true') {
          const actionText = mode === 'edit' ? 'updated' : 'created';
          const successMsg = `Personal contact ${actionText} successfully`;
          notifySuccess(successMsg);
          showSuccess(successMsg);
          return {
            success: true,
            recId: response.RecId || contract.RecId,
          };
        } else if (response.IsSuccess === 'false') {
          const actionText = mode === 'edit' ? 'updated' : 'created';
          showError(response.Message);
          return {
            success: false,
            recId: 0,
          };
        }
      } catch (error) {
        console.error('Error in handleAction:', error);
        showError('Failed to process request.');
        return {success: false};
      }
    },
    [notifySuccess, showError, showSuccess],
  );

  const handleSave = useCallback(
    async actionType => {
      if (processingButton) return;
      if (!validate()) return;

      setProcessingButton(actionType);
      setIsProcessing(true);

      try {
        const result = await handleAction(
          mode === 'edit' ? 'edit' : 'create',
          formData,
        );
        if (result.success) {
          setTimeout(() => {
            setFormData(createInitialFormData());
            navigation.navigate('FamilyContact_ListPage', {
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
    },
    [
      processingButton,
      validate,
      handleAction,
      mode,
      formData,
      createInitialFormData,
      navigation,
      route.params?.userData,
      originalCameFrom,
    ],
  );

  const toggleSwitch = useCallback(field => {
    setFormData(prev => {
      const newValue = !prev[field];
      const today = getTodayISO();

      if (field === 'isBeneficiary') {
        return {
          ...prev,
          isBeneficiary: newValue,
          beneficiaryValidFrom: newValue
            ? prev.beneficiaryValidFrom || today
            : '',
          beneficiaryValidTo: newValue
            ? prev.beneficiaryValidTo || D365_MAX_DATETIME
            : '',
        };
      }

      if (field === 'isDependent') {
        return {
          ...prev,
          isDependent: newValue,
          dependentValidFrom: newValue ? prev.dependentValidFrom || today : '',
          dependentValidTo: newValue
            ? prev.dependentValidTo || D365_MAX_DATETIME
            : '',
        };
      }

      return {
        ...prev,
        [field]: newValue,
      };
    });
  }, []);

  return (
    <ActionPaneContainer
      pageTitle={
        mode === 'edit' ? 'Edit Personal Contact' : 'Create Personal Contact'
      }
      isBackButton={true}
      showFooter={false}
      isHeaderActive={true}
      showTabNavigator={!isKeyboardVisible}
      onBackPress={goBack}
      onRefresh={handleRefresh}
      showPageTitleRow={true}>
      {isLoading && <CustomIndicator />}

      {!isLoading && (
        <SafeAreaView style={styles.DSR_SafeArea}>
          {isProcessing && (
            <View style={styles.DSR_ProcessingOverlay}>
              <View style={styles.DSR_ProcessingContainer}>
                <ActivityIndicator size="large" color={P.primaryStrong} />
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
            keyboardShouldPersistTaps="handled">
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              {PersonalContactsLabelData?.firstNamelbl || 'First Name *'}
            </Text>
            <TextInput
              style={styles.DSR_Input}
              value={formData.firstName}
              onChangeText={t => handleInputChange('firstName', t)}
              placeholder="Enter First Name"
              placeholderTextColor="#888"
            />
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              {PersonalContactsLabelData?.middleNamelbl || 'Middle name'}
            </Text>
            <TextInput
              style={styles.DSR_Input}
              value={formData.middleName}
              onChangeText={t => handleInputChange('middleName', t)}
              placeholder="Enter Middle Name"
              placeholderTextColor="#888"
            />
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              {PersonalContactsLabelData?.lastNamelbl || 'Last Name '}
            </Text>
            <TextInput
              style={styles.DSR_Input}
              value={formData.lastName}
              onChangeText={t => handleInputChange('lastName', t)}
              placeholder="Enter Last Name"
              placeholderTextColor="#888"
            />

            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              {PersonalContactsLabelData?.RelationShipTypeIdlbl ||
                'Relationship *'}
            </Text>
            <Dropdown
              style={styles.DSR_Input}
              data={relationshipTypes}
              labelField="label"
              valueField="value"
              placeholder="Select Relationship"
              value={formData.relationship}
              onChange={item => handleInputChange('relationship', item.value)}
              search
              searchPlaceholder="Search Relationship"
              placeholderStyle={styles.DSR_DropdownPlaceholder}
              selectedTextStyle={styles.DSR_DropdownSelectedText}
              itemTextStyle={styles.DSR_DropdownItemText}
              activeColor={P.tint}
              containerStyle={[
                styles.DSR_DropdownContainer,
                {marginTop: Platform.OS === 'ios' ? 5 : 2, zIndex: 1000},
              ]}
              itemContainerStyle={styles.DSR_DropdownItemContainer}
              maxHeight={280}
              dropdownPosition="auto"
            />

            <View style={{marginTop: spacing.lg}}>
              {/* Emergency Contact */}
              <View style={styles.DSR_SwitchRow}>
                <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
                  {PersonalContactsLabelData?.EmergencyContactlbl ||
                    'Emergency Contact'}
                </Text>
                <Switch
                  value={formData.EmergencyContact}
                  onValueChange={() => toggleSwitch('EmergencyContact')}
                  trackColor={{false: '#767577', true: P.primaryStrong}}
                  thumbColor={formData.EmergencyContact ? P.primary : '#f4f3f4'}
                />
              </View>

              {/* Beneficiary */}
              <View
                style={[
                  styles.DSR_SwitchRow,
                  !formData.isBeneficiary && {
                    borderBottomLeftRadius: borderRadius.md,
                    borderBottomRightRadius: borderRadius.md,
                  },
                ]}>
                <Text style={styles.DSR_SwitchLabel}>
                  {PersonalContactsLabelData?.isBeneficiarylbl || 'Beneficiary'}
                </Text>
                <Switch
                  value={formData.isBeneficiary}
                  onValueChange={() => toggleSwitch('isBeneficiary')}
                  trackColor={{false: '#767577', true: P.primaryStrong}}
                  thumbColor={formData.isBeneficiary ? P.primary : '#f4f3f4'}
                />
              </View>

              {formData.relationship !== 'FamilyContact' &&
                formData.relationship !== 'OtherContact' && (
                  <View>
                    <View
                      style={[
                        styles.DSR_SwitchRow,
                        !formData.isDependent && {
                          borderBottomLeftRadius: borderRadius.md,
                          borderBottomRightRadius: borderRadius.md,
                        },
                      ]}>
                      <Text style={styles.DSR_SwitchLabel}>
                        {PersonalContactsLabelData?.isDependentlbl ||
                          'Dependent'}
                      </Text>
                      <Switch
                        value={formData.isDependent}
                        onValueChange={() => toggleSwitch('isDependent')}
                        trackColor={{false: '#767577', true: P.primaryStrong}}
                        thumbColor={
                          formData.isDependent ? P.primary : '#f4f3f4'
                        }
                      />
                    </View>

                    {formData.isDependent && (
                      <View
                        style={{
                          backgroundColor: '#f9f9f9',
                          paddingHorizontal: 16,
                          paddingTop: 8,
                          paddingBottom: 14,
                          borderBottomLeftRadius: 12,
                          borderBottomRightRadius: 12,
                          marginBottom: 12,
                          borderTopWidth: 1,
                          borderTopColor: '#e0e0e0',
                        }}>
                        {/* Gender Dropdown */}
                        <Text
                          style={[
                            styles.DSR_Label,
                            isRTL && {textAlign: 'left'},
                          ]}>
                          {PersonalContactsLabelData?.genderlbl || 'Gender'}
                        </Text>
                        <Dropdown
                          style={styles.DSR_Input}
                          data={[
                            {label: 'Male', value: 'Male'},
                            {label: 'Female', value: 'Female'},
                            {label: 'Non-specific', value: 'Non-specific'},
                          ]}
                          labelField="label"
                          valueField="value"
                          placeholder="Select Gender"
                          value={formData.Gender}
                          onChange={item =>
                            handleInputChange('Gender', item.value)
                          }
                          search
                          searchPlaceholder="Search Gender"
                          placeholderStyle={styles.DSR_DropdownPlaceholder}
                          selectedTextStyle={styles.DSR_DropdownSelectedText}
                          itemTextStyle={styles.DSR_DropdownItemText}
                          activeColor={P.tint}
                          containerStyle={[
                            styles.DSR_DropdownContainer,
                            {marginTop: 4, zIndex: 1000},
                          ]}
                          itemContainerStyle={styles.DSR_DropdownItemContainer}
                          maxHeight={180}
                          dropdownPosition="auto"
                        />

                        {/* Birth Date */}
                        <Text
                          style={[
                            styles.DSR_Label,
                            isRTL && {textAlign: 'left'},
                          ]}>
                          {PersonalContactsLabelData?.birthDatelbl ||
                            'Birth Date'}
                        </Text>
                        <TouchableOpacity
                          style={[
                            styles.DSR_Input,
                            {
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingHorizontal: 12,
                            },
                          ]}
                          onPress={() => setShowBirthDateCalendar(true)}>
                          <Text
                            style={{
                              color: formData.BirthDate ? '#000' : '#888',
                              fontSize: 16,
                            }}>
                            {formData.BirthDate
                              ? formatDisplayDate(formData.BirthDate)
                              : 'Select Date'}
                          </Text>
                          <Icon
                            name="calendar"
                            size={20}
                            color={P.primaryStrong}
                          />
                        </TouchableOpacity>

                        <View style={{marginTop: spacing.md}}>
                          <Text style={styles.DSR_Label}>
                            {PersonalContactsLabelData?.isFullTimeStudentlbl ||
                              'Full-time Student'}
                          </Text>
                          <View style={{alignSelf: 'flex-start'}}>
                            <Switch
                              value={formData.IsFullTimeStudent}
                              onValueChange={() =>
                                toggleSwitch('IsFullTimeStudent')
                              }
                              trackColor={{
                                false: '#767577',
                                true: P.primaryStrong,
                              }}
                              thumbColor={
                                formData.IsFullTimeStudent
                                  ? P.primary
                                  : '#f4f3f4'
                              }
                            />
                          </View>
                        </View>

                        <View style={{marginTop: spacing.md}}>
                          <Text style={styles.DSR_Label}>
                            {PersonalContactsLabelData?.isPersonWithDisabilitieslbl ||
                              'Person with Disabilities'}
                          </Text>
                          <View style={{alignSelf: 'flex-start'}}>
                            <Switch
                              value={formData.IsPersonWithDisabilities}
                              onValueChange={() =>
                                toggleSwitch('IsPersonWithDisabilities')
                              }
                              trackColor={{
                                false: '#767577',
                                true: P.primaryStrong,
                              }}
                              thumbColor={
                                formData.IsPersonWithDisabilities
                                  ? P.primary
                                  : '#f4f3f4'
                              }
                            />
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                )}
            </View>
          </ScrollView>

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

      {/* ✅ One CalendarModal per date field, outside the loading block */}
      <CalendarModal
        visible={showBeneficiaryFromCalendar}
        initialDate={formData.beneficiaryValidFrom}
        onDateSelected={handleBeneficiaryFromChange}
        onClose={() => setShowBeneficiaryFromCalendar(false)}
      />

      <CalendarModal
        visible={showBeneficiaryToCalendar}
        initialDate={formData.beneficiaryValidTo}
        onDateSelected={handleBeneficiaryToChange}
        onClose={() => setShowBeneficiaryToCalendar(false)}
      />

      <CalendarModal
        visible={showDependentFromCalendar}
        initialDate={formData.dependentValidFrom}
        onDateSelected={handleDependentFromChange}
        onClose={() => setShowDependentFromCalendar(false)}
      />

      <CalendarModal
        visible={showDependentToCalendar}
        initialDate={formData.dependentValidTo}
        onDateSelected={handleDependentToChange}
        onClose={() => setShowDependentToCalendar(false)}
      />

      <CalendarModal
        visible={showBirthDateCalendar}
        initialDate={formData.BirthDate}
        onDateSelected={handleBirthDateChange}
        onClose={() => setShowBirthDateCalendar(false)}
        maxDate={today}
      />

      <AlertModal {...alertModalProps} />
    </ActionPaneContainer>
  );
};

export default FamilyContact_SaveRecord;
