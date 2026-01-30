/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useCallback, useRef, useEffect} from 'react';
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
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {Dropdown} from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import {translate as t} from '../../../../store/utils/translate';
import Icon from 'react-native-vector-icons/FontAwesome';

import ActionPaneContainer from '../../../../components/ActionPaneContainer';
import SaveRecordButtons from '../../../../components/Buttons/SaveRecordButtons';
import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';
import AlertModal from '../../../../components/Alert/AlertModal';
import {BUTTON_TYPES} from '../../../../components/Buttons/SaveRecordButtons';

import {retrieveRelationshipTypeId} from '../../../../API/PersonalInformation/FamilyContacts/retrieveRelationshipTypeId';
import {FamilyContactCreate} from '../../../../API/PersonalInformation/FamilyContacts/FamilyContactCreate';
import {FamilyContactUpdate} from '../../../../API/PersonalInformation/FamilyContacts/FamilyContactUpdate';
import styles from '../../../../styles/styles';

const FamilyContact_SaveRecord = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);

  const userData = useSelector(state => state.user.userData);
  const routeUserData = route.params?.userData;
  const effectiveUserData = routeUserData || userData || {};

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
  } = route.params || {};

  const createInitialFormData = () => ({
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
  });

  useFocusEffect(
    React.useCallback(() => {
      if (mode === 'create') {
        const freshFormData = createInitialFormData();
        setFormData(freshFormData);
      } else if (mode === 'edit' && familyContactDataSet?.RecId) {
        const fullName = familyContactDataSet.Name || '';
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || ''; // Join remaining parts for last name

        // Helper function to convert various boolean representations to true boolean
        const toBoolean = value => {
          if (typeof value === 'boolean') return value;
          if (typeof value === 'number') return value === 1;
          if (typeof value === 'string') {
            const lower = value.toLowerCase();
            return lower === 'true' || lower === '1' || lower === 'yes';
          }
          return false;
        };
        const editFormData = {
          ...createInitialFormData(),

          // map edit values
          // map edit values
          recId: familyContactDataSet.RecId,
          firstName: firstName,
          lastName: lastName,
          relationship: familyContactDataSet.RelationShipTypeId || '',

          EmergencyContact: toBoolean(familyContactDataSet.EmergencyContact),
          isBeneficiary: toBoolean(familyContactDataSet.isBeneficiary),
          isDependent: toBoolean(familyContactDataSet.isDependent),

          Gender: familyContactDataSet.Gender || '',
          BirthDate: familyContactDataSet.BirthDate || '',

          // beneficiaryValidFrom: familyContactDataSet.BeneficiaryFromDate || '',
          // beneficiaryValidTo: familyContactDataSet.BeneficiaryToDate || '',

          // dependentValidFrom: familyContactDataSet.DependentValidFrom || '',
          // dependentValidTo: familyContactDataSet.DependentValidTo || '',

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

          IsFullTimeStudent: toBoolean(familyContactDataSet.IsFullTimeStudent),
          IsPersonWithDisabilities: toBoolean(
            familyContactDataSet.IsPersonWithDisabilities,
          ),

          // ensure employee context is preserved
          employeeId: familyContactDataSet.employeeId || employeeId,
          employeeName: familyContactDataSet.employeeName || employeeName,
          WorkerRecId: familyContactDataSet.WorkerRecId || WorkerRecId,
        };

        setFormData(editFormData);
      }
    }, [
      mode,
      familyContactDataSet?.RecId,
      familyContactDataSet,
      employeeId,
      employeeName,
      WorkerRecId,
    ]),
  );

  const D365_MAX_DATE = '2154-12-31T23:59:59Z';
  const D365_MIN_DATE = '1900-01-01';

  const normalizeD365Date = dateString => {
    if (!dateString) return '';

    if (
      dateString.startsWith(D365_MAX_DATE) ||
      dateString.startsWith(D365_MIN_DATE)
    ) {
      return ''; // empty means "Never / Not set" in UI
    }

    return dateString;
  };

  const [relationshipTypes, setRelationshipTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [processingButton, setProcessingButton] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showValidFromPicker, setShowValidFromPicker] = useState(false);
  const [showValidToPicker, setShowValidToPicker] = useState(false);
  const [showDependentValidFromPicker, setShowDependentValidFromPicker] =
    useState(false);
  const [showDependentValidToPicker, setShowDependentValidToPicker] =
    useState(false);

  const [formData, setFormData] = useState({});

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

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      setFormData(createInitialFormData());
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) =>
    setFormData(prev => ({...prev, [field]: value}));

  const fetchRelationshipTypes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await retrieveRelationshipTypeId();
      if (!Array.isArray(res)) throw new Error('Invalid response from API');
      setRelationshipTypes(res);

      // preselect if editing
      const originalId = familyContactDataSet?.RelationShipTypeId || '';
      setFormData(prev => ({...prev, relationship: originalId}));
    } catch (err) {
      setAlertMessage('Failed to fetch relationship types.');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRelationshipTypes();
  }, [fetchRelationshipTypes]);

  const convertDateFormat = date =>
    date ? new Date(date).toISOString().split('T')[0] : null;

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate)
      handleInputChange('BirthDate', convertDateFormat(selectedDate));
  };

  const formatDisplayDate = dateString => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const validate = () => {
    const missing = [];
    if (!formData.firstName.trim()) missing.push('First Name');
    if (!formData.lastName.trim()) missing.push('Last Name');
    if (!formData.relationship) missing.push('Relationship');
    if (missing.length) {
      setAlertMessage(
        'Please fill in the following required fields:\n' + missing.join('\n'),
      );
      setAlertModal(true);
      return false;
    }
    return true;
  };

  const handleAction = async (mode, data) => {
    try {
      console.log('Handle Action Data : ', data);

      const contract = {
        RecId: Number(data.recId || 0),

        Name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),

        EmployeeId: data.employeeId || '',
        RelationShipTypeId: data.relationship || '',

        EmergencyContact: data.EmergencyContact ? 1 : 0,
        isDependent: data.isDependent ? 1 : 0,
        isBeneficiary: data.isBeneficiary ? 1 : 0,

        BeneficiaryFromDate:
          data.beneficiaryValidFrom || '1900-01-01T00:00:00.000Z',

        BeneficiaryToDate: data.beneficiaryValidTo
          ? data.beneficiaryValidTo
          : '2154-12-31T23:59:59.000Z',

        Gender: data.Gender || '',
        BirthDate: data.BirthDate || '1900-01-01T00:00:00.000Z',

        DependentValidFrom:
          data.dependentValidFrom || '1900-01-01T00:00:00.000Z',

        DependentValidTo: data.dependentValidTo
          ? data.dependentValidTo
          : '2154-12-31T23:59:59.000Z',

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
        console.log('THIS IS HTE DAT ATHAT IS GOIGJ', contract);
      }

      if (!response) {
        throw new Error('No response from server');
      }

      const actionText = mode === 'edit' ? 'Updated' : 'Created';

      setAlertMessage(`${contract.Name} is ${actionText} Successfully`);
      setAlertModal(true);

      return {
        success: true,
        recId: response.RecId || contract.RecId,
      };
    } catch (error) {
      console.error('Error in handleAction:', error);
      setAlertMessage('Failed to process request.');
      setAlertModal(true);

      return {success: false};
    }
  };

  const handleSave = async actionType => {
    if (processingButton) return;
    if (!validate()) return;

    setProcessingButton(actionType);
    setIsProcessing(true);

    console.log('Form Data : ', formData);
    try {
      const result = await handleAction(
        mode === 'edit' ? 'edit' : 'create',
        formData,
      );
      console.log('Resut', result);
      if (result.success) {
        setTimeout(() => {
          setAlertModal(false);
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
  };

  const toggleSwitch = field => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const onValidFromDateChange = (event, selectedDate) => {
    setShowValidFromPicker(Platform.OS === 'ios');
    if (selectedDate) {
      handleInputChange('beneficiaryValidFrom', selectedDate.toISOString());
    }
  };

  const onValidToDateChange = (event, selectedDate) => {
    setShowValidToPicker(Platform.OS === 'ios');
    if (selectedDate) {
      handleInputChange('beneficiaryValidTo', selectedDate.toISOString());
    }
  };
  const onDependentValidFromChange = (event, selectedDate) => {
    setShowDependentValidFromPicker(Platform.OS === 'ios');
    if (selectedDate) {
      handleInputChange('dependentValidFrom', selectedDate.toISOString());
    }
  };

  const onDependentValidToChange = (event, selectedDate) => {
    setShowDependentValidToPicker(Platform.OS === 'ios');
    if (selectedDate) {
      handleInputChange('dependentValidTo', selectedDate.toISOString());
    }
  };

  return (
    <ActionPaneContainer
      pageTitle={
        mode === 'edit' ? 'Edit Personal Contact' : 'Create Personal Contact'
      }
      isBackButton={true}
      showFooter={false}
      isHeaderActive={true}
      onBackPress={goBack}
      onRefresh={handleRefresh}>
      {/* 1️⃣ Show loader ONLY */}
      {isLoading && <CustomIndicator />}

      {/* 2️⃣ Show screen ONLY when NOT loading */}
      {!isLoading && (
        <SafeAreaView style={styles.LReqSR_SafeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.LReqSR_ContentWrapper}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
            {isProcessing && (
              <View style={styles.LReqSR_ProcessingOverlay}>
                <View style={styles.LReqSR_ProcessingContainer}>
                  <ActivityIndicator size="large" color="#0A66C2" />
                  <Text style={styles.LReqSR_ProcessingText}>
                    {t('common.processing')}
                  </Text>
                </View>
              </View>
            )}
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={styles.LReqSR_FormContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              <Text style={styles.LReqSR_Label}>First Name *</Text>
              <TextInput
                style={styles.LReqSR_Input}
                value={formData.firstName}
                onChangeText={t => handleInputChange('firstName', t)}
                placeholder="Enter First Name"
                placeholderTextColor="#888"
              />

              <Text style={styles.LReqSR_Label}>Last Name *</Text>
              <TextInput
                style={styles.LReqSR_Input}
                value={formData.lastName}
                onChangeText={t => handleInputChange('lastName', t)}
                placeholder="Enter Last Name"
                placeholderTextColor="#888"
              />

              <Text style={styles.LReqSR_Label}>Relationship *</Text>
              <Dropdown
                style={styles.LReqSR_Input}
                data={relationshipTypes}
                labelField="label"
                valueField="value"
                placeholder="Select Relationship"
                value={formData.relationship}
                onChange={item => handleInputChange('relationship', item.value)}
                search
                searchPlaceholder="Search Relationship"
                placeholderStyle={styles.LReqSR_DropdownPlaceholder}
                selectedTextStyle={styles.LReqSR_DropdownSelectedText}
                itemTextStyle={styles.LReqSR_DropdownItemText}
                activeColor="#E6F0FF"
                containerStyle={[
                  styles.LReqSR_DropdownContainer,
                  {marginTop: Platform.OS === 'ios' ? 5 : 2, zIndex: 1000},
                ]}
                itemContainerStyle={styles.LReqSR_DropdownItemContainer}
                maxHeight={280}
                dropdownPosition="auto"
              />
              <View style={{marginTop: 24, paddingHorizontal: 8}}>
                {/* Emergency Contact */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#f9f9f9',
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    marginBottom: 12,
                  }}>
                  <Text
                    style={{
                      fontSize: 16,
                      color: '#000',
                      fontWeight: '500',
                    }}>
                    Emergency Contact
                  </Text>

                  <Switch
                    value={formData.EmergencyContact}
                    onValueChange={() => toggleSwitch('EmergencyContact')}
                    trackColor={{false: '#767577', true: '#81b0ff'}}
                    thumbColor={
                      formData.EmergencyContact ? '#2196F3' : '#f4f3f4'
                    }
                  />
                </View>

                {/* Beneficiary */}
                {/* <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#f9f9f9',
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    marginBottom: 12,
                  }}>
                  <Text
                    style={{
                      fontSize: 16,
                      color: '#000',
                      fontWeight: '500',
                    }}>
                    Beneficiary
                  </Text>

                  <Switch
                    value={formData.isBeneficiary}
                    onValueChange={() => toggleSwitch('isBeneficiary')}
                    trackColor={{false: '#767577', true: '#81b0ff'}}
                    thumbColor={formData.isBeneficiary ? '#2196F3' : '#f4f3f4'}
                  />
                </View> */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#f9f9f9',
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderTopLeftRadius: 12,
                    borderTopRightRadius: 12,
                    borderBottomLeftRadius: formData.isBeneficiary ? 0 : 12,
                    borderBottomRightRadius: formData.isBeneficiary ? 0 : 12,
                    marginBottom: formData.isBeneficiary ? 0 : 12,
                  }}>
                  <Text
                    style={{
                      fontSize: 16,
                      color: '#000',
                      fontWeight: '500',
                    }}>
                    Beneficiary
                  </Text>

                  <Switch
                    value={formData.isBeneficiary}
                    onValueChange={() => toggleSwitch('isBeneficiary')}
                    trackColor={{false: '#767577', true: '#81b0ff'}}
                    thumbColor={formData.isBeneficiary ? '#2196F3' : '#f4f3f4'}
                  />
                </View>

                {/* Beneficiary Date Fields */}
                {formData.isBeneficiary && (
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
                    {/* Valid From */}
                    <Text
                      style={{
                        fontSize: 16,
                        color: '#000',
                        marginTop: 8,
                        marginBottom: 4,
                      }}>
                      Valid From
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.LReqSR_Input,
                        {
                          flexDirection: 'row', // Makes children align horizontally
                          alignItems: 'center', // Centers items vertically
                          justifyContent: 'space-between', // Pushes items to edges
                          paddingHorizontal: 12,
                        },
                      ]}
                      onPress={() => setShowValidFromPicker(true)}>
                      <Text
                        style={{
                          color: formData.beneficiaryValidFrom
                            ? '#000'
                            : '#888',
                          fontSize: 16,
                        }}>
                        {formData.beneficiaryValidFrom
                          ? formatDisplayDate(formData.beneficiaryValidFrom)
                          : formatDisplayDate(new Date().toISOString())}
                      </Text>
                      <Icon name="calendar" size={20} color="#04739cff" />
                    </TouchableOpacity>

                    {showValidFromPicker && (
                      <DateTimePicker
                        value={
                          formData.beneficiaryValidFrom
                            ? new Date(formData.beneficiaryValidFrom)
                            : new Date()
                        }
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onValidFromDateChange}
                      />
                    )}

                    {/* Valid To */}
                    <Text
                      style={{
                        fontSize: 16,
                        color: '#000',
                        marginTop: 12,
                        marginBottom: 4,
                      }}>
                      Valid To
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.LReqSR_Input,
                        {
                          flexDirection: 'row', // Makes children align horizontally
                          alignItems: 'center', // Centers items vertically
                          justifyContent: 'space-between', // Pushes items to edges
                          paddingHorizontal: 12,
                        },
                      ]}
                      onPress={() => setShowValidToPicker(true)}>
                      <Text
                        style={{
                          color: formData.beneficiaryValidTo ? '#000' : '#888',
                          fontSize: 16,
                        }}>
                        {formData.beneficiaryValidTo
                          ? formatDisplayDate(formData.beneficiaryValidTo)
                          : 'Never'}
                      </Text>
                      <Icon name="calendar" size={20} color="#04739cff" />
                    </TouchableOpacity>

                    {showValidToPicker && (
                      <DateTimePicker
                        value={
                          formData.beneficiaryValidTo
                            ? new Date(formData.beneficiaryValidTo)
                            : new Date()
                        }
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onValidToDateChange}
                        minimumDate={
                          formData.beneficiaryValidFrom
                            ? new Date(formData.beneficiaryValidFrom)
                            : new Date()
                        }
                      />
                    )}
                  </View>
                )}

                {/* Dependent */}
                {formData.relationship !== 'FamilyContact' &&
                  formData.relationship !== 'OtherContact' && (
                    <View>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: '#f9f9f9',
                          paddingVertical: 14,
                          paddingHorizontal: 16,
                          borderTopLeftRadius: 12,
                          borderTopRightRadius: 12,
                          borderBottomLeftRadius: formData.isDependent ? 0 : 12,
                          borderBottomRightRadius: formData.isDependent
                            ? 0
                            : 12,
                          marginBottom: formData.isDependent ? 0 : 12,
                        }}>
                        <Text
                          style={{
                            fontSize: 16,
                            color: '#000',
                            fontWeight: '500',
                          }}>
                          Dependent
                        </Text>

                        <Switch
                          value={formData.isDependent}
                          onValueChange={() => toggleSwitch('isDependent')}
                          trackColor={{false: '#767577', true: '#81b0ff'}}
                          thumbColor={
                            formData.isDependent ? '#2196F3' : '#f4f3f4'
                          }
                        />
                      </View>

                      {/* Conditional Fields - Extended Menu */}
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
                          {/* Valid From */}
                          <Text
                            style={{
                              fontSize: 16,
                              color: '#000',
                              marginTop: 8,
                              marginBottom: 4,
                            }}>
                            Valid From
                          </Text>
                          <TouchableOpacity
                            style={[
                              styles.LReqSR_Input,
                              {
                                flexDirection: 'row', // Makes children align horizontally
                                alignItems: 'center', // Centers items vertically
                                justifyContent: 'space-between', // Pushes items to edges
                                paddingHorizontal: 12,
                              },
                            ]}
                            onPress={() =>
                              setShowDependentValidFromPicker(true)
                            }>
                            <Text
                              style={{
                                color: formData.dependentValidFrom
                                  ? '#000'
                                  : '#888',
                                fontSize: 16,
                              }}>
                              {formData.dependentValidFrom
                                ? formatDisplayDate(formData.dependentValidFrom)
                                : formatDisplayDate(new Date().toISOString())}
                            </Text>
                            <Icon name="calendar" size={20} color="#04739cff" />
                          </TouchableOpacity>
                          {showDependentValidFromPicker && (
                            <DateTimePicker
                              value={
                                formData.dependentValidFrom
                                  ? new Date(formData.dependentValidFrom)
                                  : new Date()
                              }
                              mode="date"
                              display={
                                Platform.OS === 'ios' ? 'spinner' : 'default'
                              }
                              onChange={onDependentValidFromChange}
                            />
                          )}

                          {/* Valid To */}
                          <Text
                            style={{
                              fontSize: 16,
                              color: '#000',
                              marginTop: 12,
                              marginBottom: 4,
                            }}>
                            Valid To
                          </Text>
                          <TouchableOpacity
                            style={[
                              styles.LReqSR_Input,
                              {
                                flexDirection: 'row', // Makes children align horizontally
                                alignItems: 'center', // Centers items vertically
                                justifyContent: 'space-between', // Pushes items to edges
                                paddingHorizontal: 12,
                              },
                            ]}
                            onPress={() => setShowDependentValidToPicker(true)}>
                            <Text
                              style={{
                                color: formData.dependentValidTo
                                  ? '#000'
                                  : '#888',
                                fontSize: 16,
                              }}>
                              {formData.dependentValidTo
                                ? formatDisplayDate(formData.dependentValidTo)
                                : 'Never'}
                            </Text>
                            <Icon name="calendar" size={20} color="#04739cff" />
                          </TouchableOpacity>
                          {showDependentValidToPicker && (
                            <DateTimePicker
                              value={
                                formData.dependentValidTo
                                  ? new Date(formData.dependentValidTo)
                                  : new Date()
                              }
                              mode="date"
                              display={
                                Platform.OS === 'ios' ? 'spinner' : 'default'
                              }
                              onChange={onDependentValidToChange}
                              minimumDate={
                                formData.dependentValidFrom
                                  ? new Date(formData.dependentValidFrom)
                                  : new Date()
                              }
                            />
                          )}
                          {/* Gender Dropdown */}
                          <Text
                            style={{
                              fontSize: 16,
                              color: '#000',
                              marginBottom: 4,
                              marginTop: 8,
                            }}>
                            Gender
                          </Text>
                          <Dropdown
                            style={styles.LReqSR_Input}
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
                            placeholderStyle={styles.LReqSR_DropdownPlaceholder}
                            selectedTextStyle={
                              styles.LReqSR_DropdownSelectedText
                            }
                            itemTextStyle={styles.LReqSR_DropdownItemText}
                            activeColor="#E6F0FF"
                            containerStyle={[
                              styles.LReqSR_DropdownContainer,
                              {marginTop: 4, zIndex: 1000},
                            ]}
                            itemContainerStyle={
                              styles.LReqSR_DropdownItemContainer
                            }
                            maxHeight={180}
                            dropdownPosition="auto"
                          />

                          {/* Birth Date */}
                          <Text
                            style={{
                              fontSize: 16,
                              color: '#000',
                              marginTop: 12,
                              marginBottom: 4,
                            }}>
                            Birth Date
                          </Text>
                          <TouchableOpacity
                            style={[
                              styles.LReqSR_Input,
                              {
                                flexDirection: 'row', // Makes children align horizontally
                                alignItems: 'center', // Centers items vertically
                                justifyContent: 'space-between', // Pushes items to edges
                                paddingHorizontal: 12,
                              },
                            ]}
                            onPress={() => setShowDatePicker(true)}>
                            <Text
                              style={{
                                color: formData.BirthDate ? '#000' : '#888',
                                fontSize: 16,
                              }}>
                              {formData.BirthDate
                                ? formatDisplayDate(formData.BirthDate)
                                : formatDisplayDate(new Date().toISOString())}
                            </Text>
                            <Icon name="calendar" size={20} color="#04739cff" />
                          </TouchableOpacity>

                          {showDatePicker && (
                            <DateTimePicker
                              value={
                                formData.BirthDate
                                  ? new Date(formData.BirthDate)
                                  : new Date()
                              }
                              mode="date"
                              display={
                                Platform.OS === 'ios' ? 'spinner' : 'default'
                              }
                              onChange={onDateChange}
                              maximumDate={new Date()}
                            />
                          )}

                          {/* Full-time Student */}
                          <View style={{marginTop: 12}}>
                            <Text
                              style={{
                                fontSize: 16,
                                color: '#000',
                                marginBottom: 8,
                                fontWeight: '500',
                              }}>
                              Full-time Student
                            </Text>
                            <View style={{alignSelf: 'flex-start'}}>
                              <Switch
                                value={formData.IsFullTimeStudent}
                                onValueChange={() =>
                                  toggleSwitch('IsFullTimeStudent')
                                }
                                trackColor={{false: '#767577', true: '#81b0ff'}}
                                thumbColor={
                                  formData.IsFullTimeStudent
                                    ? '#2196F3'
                                    : '#f4f3f4'
                                }
                              />
                            </View>
                          </View>

                          {/* Person with Disabilities */}
                          <View style={{marginTop: 12}}>
                            <Text
                              style={{
                                fontSize: 16,
                                color: '#000',
                                marginBottom: 8,
                                fontWeight: '500',
                              }}>
                              Person with Disabilities
                            </Text>
                            <View style={{alignSelf: 'flex-start'}}>
                              <Switch
                                value={formData.IsPersonWithDisabilities}
                                onValueChange={() =>
                                  toggleSwitch('IsPersonWithDisabilities')
                                }
                                trackColor={{false: '#767577', true: '#81b0ff'}}
                                thumbColor={
                                  formData.IsPersonWithDisabilities
                                    ? '#2196F3'
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
          </KeyboardAvoidingView>

          <AlertModal
            visible={alertModal}
            heading="Alert"
            text={alertMessage}
            onPress={() => setAlertModal(false)}
          />
        </SafeAreaView>
      )}
    </ActionPaneContainer>
  );
};

export default FamilyContact_SaveRecord;
