/* eslint-disable curly */
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

import {CreateHRHelpDeskRequest} from '../../API/HRHelpDeskRequest/CreateHRHelpDeskRequest';
import {UpdateHRHelpDeskRequest} from '../../API/HRHelpDeskRequest/UpdateHRHelpDeskRequest';
import {RetrieveTypesOfProblems} from '../../API/HRHelpDeskRequest/RetrieveTypesOfProblems';

import AlertModal from '../../components/Alert/AlertModal';
import CalendarModal from '../../components/Leaves/CalendarModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import styles from '../../styles/styles';
import SaveRecordButtons from '../../components/Buttons/SaveRecordButtons';

const HRHelpDeskSaveScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);

  const isRTL = useSelector(state => state.language.isRTL);
  const userData = useSelector(state => state.user.userData);
  const routeUserData = route.params?.userData;
  const effectiveUserData = routeUserData || userData || {};

  const {
    mode = 'create',
    helpDeskData = {},
    employeeId = helpDeskData.EmployeeId || effectiveUserData?.employeeId || '',
    employeeName = effectiveUserData?.employeeName || '',
    WorkerRecId = effectiveUserData?.WorkerRecId || '',
    cameFrom = 'MainDashboard',
  } = route.params || {};

  // State
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [processingButton, setProcessingButton] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [showProblemDateCalendar, setShowProblemDateCalendar] = useState(false);

  // Dropdown options for TypeOfProblems
  const [typeOfProblemsOptions, setTypeOfProblemsOptions] = useState([]);

  const createInitialFormData = useCallback(() => {
    return {
      RecId:
        !helpDeskData.RecId || helpDeskData.RecId === '0'
          ? ''
          : helpDeskData.RecId,
      EmployeeId: employeeId || '',
      employeeName: employeeName || '',
      WorkerRecId: WorkerRecId || '',
      TypeOfProblems: '',
      Division: '',
      ProblemStartedOn: '',
      DetailProblem: '',
      RequestId: '',
      WFStatus: '',
    };
  }, []);

  const [formData, setFormData] = useState(() => createInitialFormData());

  // Fetch TypeOfProblems dropdown options from the dedicated API
  const fetchTypeOfProblemsOptions = useCallback(async () => {
    try {
      const records = await RetrieveTypesOfProblems();
      // Each record has a TypeOfProblems field — map to {label, value} pairs
      const seen = new Set();
      const options = records
        .map(record => ({
          label:
            record.TypeOfProblems ||
            record.Description ||
            record.ESSTypeOfProblem ||
            '',
          value:
            record.TypeOfProblems ||
            record.Description ||
            record.ESSTypeOfProblem ||
            '',
        }))
        .filter(opt => {
          if (!opt.value) return false; // remove empty
          if (seen.has(opt.value)) return false; // remove duplicates
          seen.add(opt.value);
          return true;
        });
      setTypeOfProblemsOptions(options);
    } catch (error) {
      console.error('Error fetching TypeOfProblems options:', error);
      // Non-fatal — dropdown will just be empty
    }
  }, []);

  // Initialize form based on mode
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const initializeForm = async () => {
        setIsLoading(true);

        try {
          await fetchTypeOfProblemsOptions();

          if (mode === 'create') {
            setFormData(createInitialFormData());
          }

          if (mode === 'edit' && helpDeskData?.RecId) {
            setFormData({
              ...createInitialFormData(),
              ...helpDeskData,
              EmployeeId: helpDeskData.EmployeeId || employeeId,
              employeeName: employeeName,
              WorkerRecId: WorkerRecId,
            });
          }
        } catch (error) {
          console.error('Initialization error:', error);
          setAlertMessage('Failed to initialize screen. Please try again.');
          setAlertModal(true);
        } finally {
          if (isActive) setIsLoading(false);
        }
      };

      initializeForm();

      return () => {
        isActive = false;
      };
    }, [mode, helpDeskData?.RecId]),
  );

  // Handle hardware back
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

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false),
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Back navigation
  const goBack = useCallback(() => {
    if (cameFrom === 'MainDashboard') {
      navigation.reset({
        index: 0,
        routes: [{name: 'MainDashboard'}],
      });
    } else if (cameFrom === 'HRHelpDeskList_Screen') {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'HRHelpDeskList_Screen',
            params: {
              employeeId,
              employeeName,
              WorkerRecId,
              userData: effectiveUserData,
              cameFrom: 'DisplayListPage',
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
    employeeId,
    employeeName,
    WorkerRecId,
    effectiveUserData,
  ]);

  const clearFormData = useCallback(() => {
    setFormData(createInitialFormData());
  }, [createInitialFormData]);

  useFocusEffect(
    useCallback(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({y: 0, animated: false});
      }
    }, []),
  );

  const handleInputChange = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  // Date formatting helpers
  const formatDate = date => {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const year = d.getFullYear();
      return `${month}/${day}/${year}`;
    } catch {
      return '';
    }
  };

  const formatToISOWithTime = date => {
    if (!date) return '';
    try {
      const baseDate = new Date(date);
      if (isNaN(baseDate.getTime())) return '';
      const year = baseDate.getFullYear();
      const month = String(baseDate.getMonth() + 1).padStart(2, '0');
      const day = String(baseDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}T12:00:00`;
    } catch {
      return '';
    }
  };

  const handleProblemDateChange = date => {
    const formatted = formatToISOWithTime(date);
    setFormData(prev => ({...prev, ProblemStartedOn: formatted}));
    setShowProblemDateCalendar(false);
  };

  // Validation
  const validateFields = () => {
    const errors = [];

    if (!formData.TypeOfProblems || !formData.TypeOfProblems.trim()) {
      errors.push('Type of Problem is required');
    }

    if (!formData.DetailProblem || !formData.DetailProblem.trim()) {
      errors.push('Detail Problem is required');
    }

    if (!formData.ProblemStartedOn) {
      errors.push('Problem Started On date is required');
    }

    return {isValid: errors.length === 0, errors};
  };

  // Create/Update API call
  const handleAction = async (actionType, modalMode, data = {}) => {
    try {
      const helpDeskRequestData = {
        EmployeeId: employeeId,
        TypeOfProblems: data.TypeOfProblems || '',
        Division: data.Division || '',
        ProblemStartedOn: data.ProblemStartedOn || '',
        DetailProblem: data.DetailProblem || '',
        RecId: data.RecId === '' ? '0' : data.RecId,
        RequestId: data.RequestId || '',
        WFStatus: data.WFStatus || '',
        EmpId: WorkerRecId,
      };

      let result;

      if (modalMode === 'create') {
        result = await CreateHRHelpDeskRequest({
          helpDeskData: helpDeskRequestData,
        });
      } else {
        result = await UpdateHRHelpDeskRequest({
          helpDeskData: helpDeskRequestData,
        });
      }

      if (result?.IsSuccess === 'true') {
        const recId = result.RecId || result.recId || data.RecId;
        const successMessage =
          modalMode === 'create'
            ? 'HR HelpDesk request created successfully'
            : 'HR HelpDesk request updated successfully';

        setAlertMessage(successMessage);
        setAlertModal(true);

        return {success: true, recId};
      } else {
        setAlertMessage(result.Message);
        setAlertModal(true);
        return {success: false};
      }
    } catch (error) {
      console.error('HR HelpDesk action error:', error);
      const errorMessage =
        error.response?.data || error.message || 'Operation failed';
      setAlertMessage(String(errorMessage));
      setAlertModal(true);
      return {success: false};
    }
  };

  // Save handler
  const handleSave = async actionType => {
    if (processingButton) return;

    const validation = validateFields();
    if (!validation.isValid) {
      setAlertMessage(validation.errors.join('\n'));
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

          navigation.navigate('HRHelpDeskListScreen', {
            employeeId: employeeId,
            employeeName: employeeName,
            WorkerRecId: WorkerRecId,
            userData: effectiveUserData,
            highlightRecId: result.recId,
            cameFrom: 'DisplayListPage',
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving HR HelpDesk request:', error);
      setAlertMessage('Failed to save request. Please try again.');
      setAlertModal(true);
    } finally {
      setProcessingButton('');
      setIsProcessing(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await fetchTypeOfProblemsOptions();
      clearFormData();
    } catch (error) {
      setAlertMessage('Failed to refresh. Please try again.');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ActionPaneContainer
      pageTitle={
        mode === 'edit'
          ? 'Edit HR HelpDesk Request'
          : 'Create HR HelpDesk Request'
      }
      isBackButton={true}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={!isKeyboardVisible}
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
            {/* Employee Name */}
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              Employee Name
            </Text>
            <Text
              style={[
                styles.DSR_Input,
                styles.DSR_Disabled,
                isRTL && {textAlign: 'left', writingDirection: 'rtl'},
              ]}>
              {formData.employeeName}
            </Text>

            {/* Request ID - edit mode only */}
            {mode === 'edit' && formData.RequestId ? (
              <>
                <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
                  Request ID
                </Text>
                <Text
                  style={[
                    styles.DSR_Input,
                    styles.DSR_Disabled,
                    isRTL && {textAlign: 'left', writingDirection: 'rtl'},
                  ]}>
                  {formData.RequestId}
                </Text>
              </>
            ) : null}

            {/* Type of Problems — Dropdown */}
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              Type of Problem *
            </Text>
            <Dropdown
              style={[styles.DSR_Input, isRTL && {textAlign: 'left'}]}
              data={typeOfProblemsOptions}
              labelField="label"
              valueField="value"
              placeholder="Select Type of Problem"
              value={formData.TypeOfProblems}
              onChange={item => handleInputChange('TypeOfProblems', item.value)}
              search
              searchPlaceholder="Search type..."
              placeholderStyle={styles.DSR_DropdownPlaceholder}
              selectedTextStyle={styles.DSR_DropdownSelectedText}
              itemTextStyle={styles.DSR_DropdownItemText}
              activeColor="#E6F0FF"
              containerStyle={styles.DSR_DropdownContainer}
              itemContainerStyle={styles.DSR_DropdownItemContainer}
              inputSearchStyle={styles.DSR_DropdownSearchInput}
              iconStyle={styles.DSR_DropdownIcon}
              maxHeight={280}
            />

            {/* Division */}
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              Division
            </Text>
            <TextInput
              style={[
                styles.DSR_Input,
                isRTL && {textAlign: 'left', writingDirection: 'rtl'},
              ]}
              value={formData.Division}
              onChangeText={value => handleInputChange('Division', value)}
              placeholder="Enter division"
              placeholderTextColor="#888"
            />

            {/* Problem Started On */}
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              Problem Started On *
            </Text>
            <TouchableOpacity
              style={styles.DSR_DateSelector}
              onPress={() => setShowProblemDateCalendar(true)}>
              <View style={{flex: 1}}>
                <Text style={styles.DSR_DateText}>
                  {formData.ProblemStartedOn
                    ? formatDate(formData.ProblemStartedOn)
                    : 'Select Date'}
                </Text>
              </View>
              <Icon name="calendar" size={20} color="#0A66C2" />
            </TouchableOpacity>

            {/* Detail Problem */}
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              Detail Problem *
            </Text>
            <TextInput
              style={[
                styles.DSR_Input,
                styles.DSR_TextArea,
                isRTL && {textAlign: 'left', writingDirection: 'rtl'},
              ]}
              value={formData.DetailProblem}
              onChangeText={value => handleInputChange('DetailProblem', value)}
              placeholder="Enter detail problem description"
              placeholderTextColor="#888"
              multiline
              numberOfLines={4}
              maxLength={250}
            />
            <Text style={styles.DSR_CharCount}>
              {formData.DetailProblem?.length || 0}/250
            </Text>
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
        </SafeAreaView>
      )}

      {/* Calendar Modal */}
      <CalendarModal
        visible={showProblemDateCalendar}
        initialDate={formData.ProblemStartedOn}
        onDateSelected={handleProblemDateChange}
        onClose={() => setShowProblemDateCalendar(false)}
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

export default HRHelpDeskSaveScreen;
