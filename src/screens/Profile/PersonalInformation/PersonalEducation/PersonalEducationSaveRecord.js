/* eslint-disable curly */
/* eslint-disable no-shadow */
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
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {Dropdown} from 'react-native-element-dropdown';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome';
import {translate as t} from '../../../../store/utils/translate';

import AlertModal from '../../../../components/Alert/AlertModal';
import CalendarModal from '../../../../components/Leaves/CalendarModal';
import ActionPaneContainer from '../../../../components/ActionPaneContainer';
import {BUTTON_TYPES} from '../../../../components/Buttons/SaveRecordButtons';
import SaveRecordButtons from '../../../../components/Buttons/SaveRecordButtons';
import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';

import {RetrieveAllEducationDisciplines} from '../../../../API/PersonalInformation/Education/RetrieveAllEducationDisciplines';
import {CreateEducationDetails} from '../../../../API/PersonalInformation/Education/PersonalEducationCreate';
import {UpdateEducationDetails} from '../../../../API/PersonalInformation/Education/PersonEducationIUpdate';
import {SubmitEducationRequest} from '../../../../API/PersonalInformation/Education/SubmitEducationRequest';
import {isEducationWorkflowConfigured} from '../../../../API/PersonalInformation/Education/isEducationWorkflowEnabled';
import {GetPersonalEducationLabel} from '../../../../API/PersonalInformation/Education/GetPersonalEducationLabel';

import styles from '../../../../styles/styles';
import {conditionalVerticalScale} from '../../../../store/utils/scaling';

/* ---------- initial form ---------- */
const createInitialFormData = (
  educationData,
  employeeId,
  employeeName,
  WorkerRecId,
) => ({
  RecId:
    educationData?.RecId ||
    educationData?.recId ||
    educationData?.RecordId ||
    0,
  EducationDisciplineId:
    educationData?.EducationDisciplineId ||
    educationData?.EducationDiscipline ||
    '',
  Description: educationData?.Description || '',
  DurationUnit: educationData?.DurationUnit || '',
  Duration: educationData?.Duration || '',
  StartDate: educationData?.StartDate || '',
  EndDate: educationData?.EndDate || '',
  Notes: educationData?.Notes || '',
  ApprovalStatus: educationData?.ApprovalStatus || '',
  WorkflowOperation: educationData?.WorkflowOperation || '',
  PersonEducationRecVersion: educationData?.PersonEducationRecVersion || 1,
  EmployeeId: employeeId,
  EmployeeName: employeeName,
  Person: WorkerRecId,
});

const PersonalEducationSaveRecord = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const scrollViewRef = useRef(null);

  const reduxUser = useSelector(state => state.user.userData);
  const routeUser = route.params?.userData;
  const effectiveUser = routeUser || reduxUser || {};

  const {
    mode = 'create',
    educationData = {},
    cameFrom,
    originalCameFrom = null,
  } = route.params || {};

  const employeeId =
    educationData?.EmployeeId || effectiveUser?.employeeId || '';
  const employeeName =
    educationData?.EmployeeName || effectiveUser?.employeeName || '';
  const WorkerRecId = educationData?.Person || effectiveUser?.WorkerRecId || '';

  /* ---------- state ---------- */
  const [formData, setFormData] = useState(() =>
    createInitialFormData(educationData, employeeId, employeeName, WorkerRecId),
  );
  const [originalDisciplineId, setOriginalDisciplineId] = useState(
    educationData?.EducationDisciplineId ||
      educationData?.EducationDiscipline ||
      '',
  );
  const [isLoading, setIsLoading] = useState(false);
  const [processingButton, setProcessingButton] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [educationDisciplines, setEducationDisciplines] = useState([]);
  const [isWorkflowConfigured, setIsWorkflowConfigured] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [showStartDateCalendar, setShowStartDateCalendar] = useState(false);
  const [showEndDateCalendar, setShowEndDateCalendar] = useState(false);
  const [educationLabels, setEducationLabels] = useState({});

  /* ---------- helpers ---------- */
  const formatDate = date => {
    if (!date) return '';
    const d = new Date(date);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(
      d.getDate(),
    ).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const fetchEducationLabels = useCallback(async () => {
    try {
      const labels = await GetPersonalEducationLabel();
      console.log('Labels received in screen:', labels);
      return labels || {};
    } catch (error) {
      console.error('Error fetching Education labels:', error);
      return {};
    }
  }, []);

  const checkWorkflowConfig = useCallback(async () => {
    try {
      const res = await isEducationWorkflowConfigured();
      console.log('here is the workflow resut', res);
      setIsWorkflowConfigured(res === true || res === 1);
    } catch (e) {
      setIsWorkflowConfigured(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkWorkflowConfig();
    }, [checkWorkflowConfig]),
  );

  const convertDateFormat = date => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(d.getDate()).padStart(2, '0')}T12:00:00`;
  };

  const buildPayload = data => ({
    RecId: Number(data.RecId || 0),
    EducationDiscipline: Number(
      mode === 'edit' ? originalDisciplineId : formData.EducationDisciplineId,
    ),
    Description: data.Description.trim(),
    DurationUnit: data.DurationUnit,
    Duration: Number(data.Duration) || 0,
    StartDate: data.StartDate,
    EndDate: data.EndDate,
    Notes: data.Notes.trim(),
    EmployeeId: data.EmployeeId,
    Person: Number(data.Person),
    PersonEducationRecVersion: data.PersonEducationRecVersion || 1,
    ApprovalStatus: data.ApprovalStatus || 'Draft',
    WorkflowOperation: data.ApprovalStatus ? 'Update' : 'Insert',
  });

  /* ---------- back ---------- */
  const goBack = useCallback(() => {
    if (cameFrom === 'PersonalEducationListPage') {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'PersonalEducationListPage',
            params: {
              employeeId,
              employeeName,
              WorkerRecId,
              cameFrom: originalCameFrom || 'PersonalEducationListPage',
            },
          },
        ],
      });
    } else {
      navigation.goBack();
    }
  }, [
    cameFrom,
    originalCameFrom,
    navigation,
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

  // const [disciplineMap, setDisciplineMap] = useState({}); // <-- add

  const fetchDisciplines = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await RetrieveAllEducationDisciplines();
      if (Array.isArray(res) && res.length) {
        const list = res.map(item => ({
          label: item.EducationDisciplineId,
          value: item.RecId,
        }));
        setEducationDisciplines(list);

        const map = {};
        res.forEach(item => {
          map[item.EducationDisciplineId] = item.RecId;
        });
        // setDisciplineMap(map);

        const originalLabel =
          educationData?.EducationDisciplineId ||
          educationData?.EducationDiscipline ||
          '';
        setOriginalDisciplineId(map[originalLabel] || '');
      }
    } catch {
      setAlertMessage('Failed to fetch data.');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [educationData]); // ← only changes if initial data changes

  // useFocusEffect(
  //   useCallback(() => {
  //     fetchDisciplines();
  //     setProcessingButton('');
  //   }, [fetchDisciplines]),
  // );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const initializeScreen = async () => {
        setIsLoading(true);
        try {
          const [labels] = await Promise.all([
            fetchEducationLabels(),
            fetchDisciplines(),
          ]);

          if (!isActive) return;

          setEducationLabels(labels);
        } catch (err) {
          console.error('Error loading education screen:', err);
        } finally {
          if (isActive) setIsLoading(false);
        }
      };

      initializeScreen();
      setProcessingButton('');

      return () => {
        isActive = false;
      };
    }, [fetchDisciplines, fetchEducationLabels]),
  );

  /* ---------- input ---------- */
  const handleInputChange = (field, value) =>
    setFormData(prev => ({...prev, [field]: value}));

  const handleStartDateChange = date => {
    setFormData(prev => ({...prev, StartDate: convertDateFormat(date)}));
    setShowStartDateCalendar(false);
  };

  const handleEndDateChange = date => {
    setFormData(prev => ({...prev, EndDate: convertDateFormat(date)}));
    setShowEndDateCalendar(false);
  };
  /* ---------- validation ---------- */
  const validate = () => {
    const missing = [];
    if (!formData.EducationDisciplineId) missing.push('Education');
    if (!formData.Description.trim()) missing.push('Description');
    if (!formData.DurationUnit) missing.push('Duration Unit');
    if (!formData.Duration) missing.push('Duration');
    // if (!formData.StartDate) missing.push('Start Date');
    // if (!formData.EndDate) missing.push('End Date');
    if (missing.length) {
      setAlertMessage(
        'Please fill in the following required fields:\n' + missing.join('\n'),
      );
      setAlertModal(true);
      return false;
    }
    return true;
  };

  /* ---------- save / submit ---------- */
  const handleSave = async actionType => {
    if (processingButton) return;
    if (!validate()) return;

    setProcessingButton(actionType);
    setIsProcessing(true);
    try {
      console.log('Form Data :', formData);
      const payload = buildPayload(formData);
      console.log('Payload :', payload);
      let response;
      if (mode === 'edit') {
        response = await UpdateEducationDetails({educationData: payload});
      } else {
        response = await CreateEducationDetails({educationData: payload});
      }

      const isSuccess =
        response?.IsSuccess === true || response?.IsSuccess === 'true';
      if (!isSuccess)
        throw new Error(response?.Message || 'Failed to save record.');

      const recId = response?.RecId || payload.RecId;

      /* ---- submit if requested ---- */
      if (actionType === 'submit') {
        try {
          const submitRes = await SubmitEducationRequest({recId});
          const submitOk =
            submitRes?.IsSuccess === true || submitRes?.IsSuccess === 'true';
          if (!submitOk)
            throw new Error(submitRes?.Message || 'Failed to submit request.');
        } catch (submitErr) {
          // make sure the user sees the submit error
          setAlertMessage(submitErr.message || 'Failed to submit request.');
          setAlertModal(true);
          return; // stop the success flow
        }
      }

      /* ---- success flow ---- */
      setAlertMessage(
        actionType === 'submit'
          ? 'Request submitted successfully.'
          : 'Record created successfully.',
      );
      setAlertModal(true);
      setTimeout(() => {
        setAlertModal(false);
        /* ── same reset logic used by Cancel ── */
        if (cameFrom === 'PersonalEducationListPage') {
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'PersonalEducationListPage',
                params: {
                  employeeId,
                  employeeName,
                  WorkerRecId: WorkerRecId,
                  cameFrom: originalCameFrom || 'PersonalEducationListPage',
                  highlightRecId: recId, // optional – scroll to the row
                },
              },
            ],
          });
        } else {
          navigation.navigate('PersonalEducationListPage', {
            highlightRecId: recId,
            cameFrom: originalCameFrom || 'PersonalEducationListPage',
          });
        }
      }, 1200);
    } catch (err) {
      setAlertMessage(
        err.message || 'An error occurred while processing the request.',
      );
      setAlertModal(true);
    } finally {
      setProcessingButton('');
      setIsProcessing(false);
    }
  };

  /* ---------- UI ---------- */
  const durationOptions = [
    {label: 'Days', value: 'Day'},
    {label: 'Months', value: 'Month'},
    {label: 'Years', value: 'Year'},
  ];

  const readableEducation =
    educationDisciplines.find(d => d.value === originalDisciplineId)?.label ||
    formData.EducationDisciplineId;

  return (
    <ActionPaneContainer
      pageTitle={mode === 'edit' ? 'Edit Education' : 'Create Education'}
      isBackButton
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive
      showTabNavigator={!isKeyboardVisible}
      onBackPress={goBack}
      onRefresh={fetchDisciplines}
      showPageTitleRow={true}>
      {isLoading && <CustomIndicator />}
      {!isLoading && (
        <SafeAreaView style={styles.DSR_SafeArea}>
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
            keyboardShouldPersistTaps="handled">
            <Text style={styles.DSR_Label}>
              {educationLabels?.EducationDisciplinelbl || 'Education *'}
            </Text>
            {mode === 'edit' ? (
              <Text
                style={[
                  styles.DSR_Input,
                  styles.DSR_Disabled,
                  {paddingVertical: conditionalVerticalScale(12, 14, 16, 18)},
                ]}>
                {readableEducation}
              </Text>
            ) : (
              <Dropdown
                style={styles.DSR_Input}
                data={educationDisciplines}
                labelField="label"
                valueField="value"
                placeholder="Select Education"
                value={formData.EducationDisciplineId}
                onChange={item =>
                  handleInputChange('EducationDisciplineId', item.value)
                }
                search
                searchPlaceholder="Search Education"
                placeholderStyle={styles.DSR_DropdownPlaceholder}
                selectedTextStyle={styles.DSR_DropdownSelectedText}
                itemTextStyle={styles.DSR_DropdownItemText}
                activeColor="#E6F0FF"
                containerStyle={[
                  styles.DSR_DropdownContainer,
                  {marginTop: Platform.OS === 'ios' ? 5 : 2, zIndex: 1000},
                ]}
                itemContainerStyle={styles.DSR_DropdownItemContainer}
                maxHeight={280}
                dropdownPosition="auto"
              />
            )}

            <Text style={styles.DSR_Label}>
              {educationLabels?.Descriptionlbl || 'Description'}
            </Text>
            <TextInput
              style={styles.DSR_Input}
              value={formData.Description}
              onChangeText={t => handleInputChange('Description', t)}
              placeholder="Enter Description"
              placeholderTextColor="#888"
            />

            <Text style={styles.DSR_Label}>
              {educationLabels?.DurationUnitlbl || 'Duration Unit *'}
            </Text>
            <Dropdown
              style={styles.DSR_Input}
              data={durationOptions}
              labelField="label"
              valueField="value"
              placeholder="Select Duration Unit"
              value={formData.DurationUnit}
              onChange={item => handleInputChange('DurationUnit', item.value)}
              maxHeight={250}
              dropdownPosition="auto"
              placeholderStyle={styles.DSR_DropdownPlaceholder}
              selectedTextStyle={styles.DSR_DropdownSelectedText}
              itemTextStyle={styles.DSR_DropdownItemText}
              activeColor="#E6F0FF"
              containerStyle={[
                styles.DSR_DropdownContainer,
                {marginTop: Platform.OS === 'ios' ? 5 : 2, zIndex: 999},
              ]}
              itemContainerStyle={styles.DSR_DropdownItemContainer}
            />

            <Text style={styles.DSR_Label}>
              {educationLabels?.Durationlbl || 'Duration *'}
            </Text>
            <TextInput
              style={styles.DSR_Input}
              value={formData.Duration}
              onChangeText={t =>
                handleInputChange('Duration', t.replace(/[^0-9]/g, ''))
              }
              placeholder="Enter Duration"
              placeholderTextColor="#888"
              keyboardType="numeric"
            />

            {/* <Text style={styles.DSR_Label}>Start Date</Text> */}

            <Text style={styles.DSR_Label}>
              {educationLabels?.StartDatelbl || 'Start Date*'}
            </Text>
            <TouchableOpacity
              style={styles.DSR_DateSelector}
              onPress={() => setShowStartDateCalendar(true)}>
              <View style={{flex: 1}}>
                <Text style={styles.DSR_DateText}>
                  {formData.StartDate
                    ? formatDate(formData.StartDate)
                    : 'Select Start Date'}
                </Text>
              </View>
              <Icon name="calendar" size={20} color="#0A66C2" />
            </TouchableOpacity>

            <Text style={styles.DSR_Label}>
              {educationLabels?.EndDatelbl || 'End Date'}
            </Text>
            <TouchableOpacity
              style={styles.DSR_DateSelector}
              onPress={() => setShowEndDateCalendar(true)}>
              <View style={{flex: 1}}>
                <Text style={styles.DSR_DateText}>
                  {formData.EndDate
                    ? formatDate(formData.EndDate)
                    : 'Select End Date'}
                </Text>
              </View>
              <Icon name="calendar" size={20} color="#0A66C2" />
            </TouchableOpacity>

            <Text style={styles.DSR_Label}>
              {educationLabels?.Noteslbl || 'Notes'}
            </Text>
            <TextInput
              style={[styles.DSR_Input, styles.DSR_TextArea]}
              value={formData.Notes}
              onChangeText={t => handleInputChange('Notes', t)}
              placeholder="Enter Notes"
              placeholderTextColor="#888"
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
        </SafeAreaView>
      )}

      {/* ✅ One CalendarModal per date field, outside the loading block */}
      <CalendarModal
        visible={showStartDateCalendar}
        initialDate={formData.StartDate}
        onDateSelected={handleStartDateChange}
        onClose={() => setShowStartDateCalendar(false)}
      />

      <CalendarModal
        visible={showEndDateCalendar}
        initialDate={formData.EndDate}
        onDateSelected={handleEndDateChange}
        onClose={() => setShowEndDateCalendar(false)}
      />

      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
    </ActionPaneContainer>
  );
};

export default PersonalEducationSaveRecord;
