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
import DateTimePicker from '@react-native-community/datetimepicker';

import {FindIdentificationTypeRequest} from '../../API/PersonalInformation/Identification/FindIdentificationTypeRequest';
import {CreateIdentityRequest} from '../../API/PersonalInformation/Identification/CreateIdentityRequest';
import {UpdateIdentityRequest} from '../../API/PersonalInformation/Identification/UpdateIdentityRequest';
import {SubmitIdentificationRequest} from '../../API/PersonalInformation/Identification/SubmitIdentificationRequest';

import AlertModal from '../../components/Alert/AlertModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import SaveRecordButtons from '../../components/Buttons/SaveRecordButtons';
import styles from '../../styles/styles';

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

  const [identTypes, setIdentTypes] = useState([]);
  const [showIssuePicker, setShowIssuePicker] = useState(false);
  const [showExpirationPicker, setShowExpirationPicker] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [processingButton, setProcessingButton] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  // Navigation setup
  const goBack = useCallback(() => {
    if (cameFrom === 'MainDashboard') {
      navigation.reset({
        index: 0,
        routes: [{name: 'TabNavigator', params: {screen: 'MainDashboard'}}],
      });
    } else if (cameFrom === 'IdentificationListPage') {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'IdentificationListPage',
            params: {
              employeeId,
              employeeName,
              WorkerRecId,
              cameFrom: originalCameFrom || 'DisplayListPage',
            },
          },
        ],
      });
    } else {
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

  // hardware back
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

  // Load identification types
  useFocusEffect(
    React.useCallback(() => {
      const fetchIdentificationTypes = async () => {
        try {
          const response = await FindIdentificationTypeRequest();
          if (response && Array.isArray(response)) {
            setIdentTypes(
              response.map(item => ({
                label: item.Description,
                value: item.RecId,
              })),
            );
          }
        } catch (error) {
          console.error('Failed to load identification types:', error);
        }
      };
      fetchIdentificationTypes();
    }, []),
  );

  useFocusEffect(
    React.useCallback(() => {
      if (mode === 'create') {
        const freshFormData = createInitialFormData();
        setFormData(freshFormData);
      } else if (mode === 'edit' && identityData?.recId) {
        // Set up the form for edit mode
        const editFormData = {
          ...createInitialFormData(),
          ...identityData,
          employeeId: identityData.employeeId || employeeId,
          employeeName: identityData.employeeName || employeeName,
          WorkerRecId: identityData.WorkerRecId || WorkerRecId,
        };

        setFormData(editFormData);

        FindIdentificationTypeRequest().then(() => {
          if (mode === 'edit' && identityData) {
            setFormData(prev => ({
              ...prev,
            }));
          }
        });
      }
    }, [mode, identityData?.RecId, employeeId, employeeName, WorkerRecId]),
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

      let response;

      if (modalMode === 'create') {
        response = await CreateIdentityRequest({identityData: contract});
        if (actionType === 'submit' && response?.RecId) {
          await SubmitIdentificationRequest({recId: response.RecId});
        }
      } else if (modalMode === 'update') {
        response = await UpdateIdentityRequest({identityData: contract});
        if (actionType === 'submit' && contract.RecId) {
          await SubmitIdentificationRequest({recId: contract.RecId});
        }
      }

      if (response) {
        const textAction = modalMode === 'create' ? 'Created' : 'Updated';
        const textSubmit = actionType === 'submit' ? ' and Submitted' : '';
        setAlertMessage(
          `${contract.IdentificationNumber} is ${textAction}${textSubmit} Successfully`,
        );
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

    try {
      const result = await handleAction(
        actionType,
        mode === 'edit' ? 'update' : 'create',
        formData,
      );
      if (result.success) {
        setTimeout(() => {
          setAlertModal(false);
          setFormData(createInitialFormData());
          navigation.navigate('IdentificationListPage', {
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
      onBackPress={goBack}
      onRefresh={handleRefresh}>
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <SafeAreaView style={styles.LReqSR_SafeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.LReqSR_ContentWrapper}>
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={styles.LReqSR_FormContainer}
              showsVerticalScrollIndicator={false}>
              <Text style={styles.LReqSR_Label}>Employee Name</Text>
              <Text style={[styles.LReqSR_Input, styles.LReqSR_Disabled]}>
                {formData.employeeName}
              </Text>

              <Text style={styles.LReqSR_Label}>Request Date</Text>
              <Text style={[styles.LReqSR_Input, styles.LReqSR_Disabled]}>
                {formatDate(today)}
              </Text>

              <Text style={styles.LReqSR_Label}>Identification Type *</Text>
              <Dropdown
                style={[
                  styles.LReqSR_Input,
                  isEditRecordESS && styles.LReqSR_Disabled,
                ]}
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
                placeholderStyle={styles.LReqSR_DropdownPlaceholder}
              />

              <Text style={styles.LReqSR_Label}>Identification Number *</Text>
              <TextInput
                style={styles.LReqSR_Input}
                value={formData.IdentificationNumber}
                onChangeText={v => handleInputChange('IdentificationNumber', v)}
                placeholder="Enter Identification Number"
              />

              <Text style={styles.LReqSR_Label}>Description</Text>
              <TextInput
                style={[styles.LReqSR_Input, styles.LReqSR_TextArea]}
                value={formData.Description}
                onChangeText={v => handleInputChange('Description', v)}
                placeholder="Enter Description"
                multiline
              />

              {/* <Text style={styles.LReqSR_Label}>Issuing Agency</Text>
              <TextInput
                style={styles.LReqSR_Input}
                value={formData.IssuingAgency}
                onChangeText={v => handleInputChange('IssuingAgency', v)}
                placeholder="Enter Issuing Agency"
              /> */}

              <Text style={styles.LReqSR_Label}>Issue Date</Text>
              <TouchableOpacity
                style={styles.LReqSR_DateSelector}
                onPress={() => setShowIssuePicker(true)}>
                <View style={{flex: 1}}>
                  <Text style={styles.LReqSR_DateText}>
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
                />
              )}

              <Text style={styles.LReqSR_Label}>Expiration Date</Text>
              <TouchableOpacity
                style={styles.LReqSR_DateSelector}
                onPress={() => setShowExpirationPicker(true)}>
                <View style={{flex: 1}}>
                  <Text style={styles.LReqSR_DateText}>
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
                />
              )}
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
            onPress={() => setAlertModal(false)}
          />
        </SafeAreaView>
      )}
    </ActionPaneContainer>
  );
};

export default IdentificationNumberSaveRecord;
