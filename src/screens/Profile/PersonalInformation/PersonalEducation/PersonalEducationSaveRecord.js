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
import {Dropdown} from 'react-native-element-dropdown';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome';

import ActionPaneContainer from '../../../../components/ActionPaneContainer';
import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';
import AlertModal from '../../../../components/Alert/AlertModal';
import SaveRecordButtons from '../../../../components/Buttons/SaveRecordButtons';
import CalendarModal from '../../../../components/Leaves/CalendarModal';

import {RetrieveAllEducationDisciplines} from '../../../../API/PersonalInformation/Education/RetrieveAllEducationDisciplines';
import {CreateEducationDetails} from '../../../../API/PersonalInformation/Education/PersonalEducationCreate';
import {UpdateEducationDetails} from '../../../../API/PersonalInformation/Education/PersonEducationIUpdate';
import {SubmitEducationRequest} from '../../../../API/PersonalInformation/Education/SubmitEducationRequest';

import styles from '../../../../styles/styles';

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
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [educationDisciplines, setEducationDisciplines] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarField, setCalendarField] = useState('');

  /* ---------- helpers ---------- */
  const formatDate = date => {
    if (!date) return '';
    const d = new Date(date);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(
      d.getDate(),
    ).padStart(2, '0')}/${d.getFullYear()}`;
  };

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
    WorkflowOperation: 'Update',
  });

  /* ---------- back ---------- */
  const goBack = useCallback(() => {
    if (cameFrom === 'PersonalEducation') {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'PersonalEducation',
            params: {
              employeeId,
              employeeName,
              WorkerRecId,
              cameFrom: originalCameFrom || 'PersonalEducation',
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
      setAlertMessage('Failed to fetch disciplines.');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [educationData]); // ← only changes if initial data changes

  useFocusEffect(
    useCallback(() => {
      fetchDisciplines();
      setProcessingButton('');
    }, [fetchDisciplines]),
  );

  /* ---------- input ---------- */
  const handleInputChange = (field, value) =>
    setFormData(prev => ({...prev, [field]: value}));

  const handleDateChange = date => {
    setFormData(prev => ({...prev, [calendarField]: convertDateFormat(date)}));
    setShowCalendar(false);
  };

  /* ---------- validation ---------- */
  const validate = () => {
    const missing = [];
    if (!formData.EducationDisciplineId) missing.push('Education');
    if (!formData.Description.trim()) missing.push('Description');
    if (!formData.DurationUnit) missing.push('Duration Unit');
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
    setIsLoading(true);
    try {
      const payload = buildPayload(formData);
      let response;
      if (mode === 'edit') {
        response = await UpdateEducationDetails({educationData: payload});
      } else {
        response = await CreateEducationDetails({educationData: payload});
      }

      const isSuccess =
        response?.IsSuccess === true || response?.IsSuccess === 'true';
      if (!isSuccess) throw new Error(response?.Message || 'Operation failed');

      const recId = response?.RecId || payload.RecId;

      /* ---- submit if requested ---- */
      if (actionType === 'submit') {
        await SubmitEducationRequest({recId});
      }

      /* ---- success flow ---- */
      setAlertMessage(
        `Education Record ${
          actionType === 'submit' ? 'Submitted' : 'Saved'
        } Successfully`,
      );
      setAlertModal(true);
      setTimeout(() => {
        setAlertModal(false);
        /* ── same reset logic used by Cancel ── */
        if (cameFrom === 'PersonalEducation') {
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'PersonalEducation',
                params: {
                  employeeId,
                  employeeName,
                  WorkerRecId: WorkerRecId,
                  cameFrom: originalCameFrom || 'PersonalEducation',
                  highlightRecId: recId, // optional – scroll to the row
                },
              },
            ],
          });
        } else {
          navigation.navigate('PersonalEducation', {
            highlightRecId: recId,
            cameFrom: originalCameFrom || 'PersonalEducation',
          });
        }
      }, 1200);
    } catch (err) {
      setAlertMessage(err.message || 'Network / server error');
      setAlertModal(true);
    } finally {
      setProcessingButton('');
      setIsLoading(false);
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
      pageTitle={mode === 'edit' ? 'Edit Education Record' : 'Add Education'}
      isBackButton
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive
      onBackPress={goBack}
      onRefresh={fetchDisciplines}>
      {isLoading && <CustomIndicator />}
      {!isLoading && (
        <SafeAreaView style={styles.LReqSR_SafeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.LReqSR_ContentWrapper}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={styles.LReqSR_FormContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {/* ---------- Education (frozen in edit) ---------- */}
              <Text style={styles.LReqSR_Label}>Education *</Text>
              {mode === 'edit' ? (
                <Text
                  style={[
                    styles.LReqSR_Input,
                    styles.LReqSR_Disabled,
                    {paddingVertical: 14},
                  ]}>
                  {readableEducation}
                </Text>
              ) : (
                <Dropdown
                  style={styles.LReqSR_Input}
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
              )}

              <Text style={styles.LReqSR_Label}>Description *</Text>
              <TextInput
                style={styles.LReqSR_Input}
                value={formData.Description}
                onChangeText={t => handleInputChange('Description', t)}
                placeholder="Enter Description"
              />

              <Text style={styles.LReqSR_Label}>Duration Unit *</Text>
              <Dropdown
                style={styles.LReqSR_Input}
                data={durationOptions}
                labelField="label"
                valueField="value"
                placeholder="Select Duration Unit"
                value={formData.DurationUnit}
                onChange={item => handleInputChange('DurationUnit', item.value)}
                maxHeight={250}
                dropdownPosition="auto"
                placeholderStyle={styles.LReqSR_DropdownPlaceholder}
                selectedTextStyle={styles.LReqSR_DropdownSelectedText}
                itemTextStyle={styles.LReqSR_DropdownItemText}
                activeColor="#E6F0FF"
                containerStyle={[
                  styles.LReqSR_DropdownContainer,
                  {marginTop: Platform.OS === 'ios' ? 5 : 2, zIndex: 999},
                ]}
                itemContainerStyle={styles.LReqSR_DropdownItemContainer}
              />

              <Text style={styles.LReqSR_Label}>Duration *</Text>
              <TextInput
                style={styles.LReqSR_Input}
                value={formData.Duration}
                onChangeText={t =>
                  handleInputChange('Duration', t.replace(/[^0-9]/g, ''))
                }
                placeholder="Enter Duration"
                keyboardType="numeric"
              />

              <Text style={styles.LReqSR_Label}>Start Date *</Text>
              <TouchableOpacity
                style={styles.LReqSR_DateSelector}
                onPress={() => {
                  setCalendarField('StartDate');
                  setShowCalendar(true);
                }}>
                <View style={{flex: 1}}>
                  <Text style={styles.LReqSR_DateText}>
                    {formData.StartDate
                      ? formatDate(formData.StartDate)
                      : 'Select Start Date'}
                  </Text>
                </View>
                <Icon name="calendar" size={20} color="#0A66C2" />
              </TouchableOpacity>

              <Text style={styles.LReqSR_Label}>End Date *</Text>
              <TouchableOpacity
                style={styles.LReqSR_DateSelector}
                onPress={() => {
                  setCalendarField('EndDate');
                  setShowCalendar(true);
                }}>
                <View style={{flex: 1}}>
                  <Text style={styles.LReqSR_DateText}>
                    {formData.EndDate
                      ? formatDate(formData.EndDate)
                      : 'Select End Date'}
                  </Text>
                </View>
                <Icon name="calendar" size={20} color="#0A66C2" />
              </TouchableOpacity>

              <Text style={styles.LReqSR_Label}>Notes</Text>
              <TextInput
                style={[styles.LReqSR_Input, styles.LReqSR_TextArea]}
                value={formData.Notes}
                onChangeText={t => handleInputChange('Notes', t)}
                placeholder="Enter Notes"
                multiline
                numberOfLines={6}
              />
            </ScrollView>

            <SaveRecordButtons
              mode={mode}
              processingButton={processingButton}
              onSave={() => handleSave('save')}
              onSubmit={() => handleSave('submit')}
              onCancel={goBack}
              isDisabled={!!processingButton}
            />
          </KeyboardAvoidingView>

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

export default PersonalEducationSaveRecord;
