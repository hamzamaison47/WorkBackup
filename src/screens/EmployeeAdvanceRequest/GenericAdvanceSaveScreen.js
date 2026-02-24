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
  Pressable,
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

import {CreateAdvanceRequest} from '../../API/EmployeeAdvanceRequest/CreateAdvanceRequest';
import {SubmitAdvanceRequest} from '../../API/EmployeeAdvanceRequest/SubmitAdvanceRequest';
import {UpdateAdvanceRequest} from '../../API/EmployeeAdvanceRequest/UpdateAdvanceRequest';
import {RetrieveAllAdvanceTypeRequest} from '../../API/EmployeeAdvanceRequest/RetrieveAllAdvanceTypeRequest';
import {FindFirstPayGroupPayPeriod} from '../../API/PayGroupPayPeriod/FindFirstPayGroupPayPeriod';
import {GetEmployeeLookup} from '../../API/EmployeeAdvanceRequest/GetEmployeeLookup';
import {GetEmployeeAdvanceLabels} from '../../API/EmployeeAdvanceRequest/GetEmployeeAdvanceLabels';

import AlertModal from '../../components/Alert/AlertModal';
import CalendarModal from '../../components/Leaves/CalendarModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import styles from '../../styles/styles';
import SaveRecordButtons from '../../components/Buttons/SaveRecordButtons';

const GenericAdvanceSaveScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);

  const isRTL = useSelector(state => state.language.isRTL);
  const userData = useSelector(state => state.user.userData);
  const routeUserData = route.params?.userData;
  const effectiveUserData = routeUserData || userData || {};

  // Enhanced navigation params with robust validation and fallbacks
  const {
    mode = 'create',
    advanceData = {},
    employeeId = advanceData.employeeId || effectiveUserData?.employeeId || '',
    employeeName = advanceData.employeeName ||
      effectiveUserData?.employeeName ||
      '',
    WorkerRecId = advanceData.WorkerRecId ||
      effectiveUserData?.WorkerRecId ||
      '',
    cameFrom = 'MainDashboard',
    originalCameFrom = null,
    requestType = 'Loan',
    advanceType = 0,
    screenName = 'Loan Request',
  } = route.params || {};

  // State declarations
  const [advanceCodes, setAdvanceCodes] = useState([]);
  const [advanceCodeDropDown, setAdvanceCodeDropDown] = useState([]);
  const [guarantorsData, setGuarantorsData] = useState([]);
  const [filteredGuarantors1, setFilteredGuarantors1] = useState([]);
  const [filteredGuarantors2, setFilteredGuarantors2] = useState([]);
  const [guarantor1SearchQuery, setGuarantor1SearchQuery] = useState('');
  const [guarantor2SearchQuery, setGuarantor2SearchQuery] = useState('');
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [processingButton, setProcessingButton] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dataInitialized, setDataInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [EmployeeAdvanceLabelsData, setEmployeeAdvanceLabelsData] = useState(
    {},
  );
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showPaymentDateCalendar, setShowPaymentDateCalendar] = useState(false);
  const [showRecoveryDateCalendar, setShowRecoveryDateCalendar] =
    useState(false);

  const fetchEmployeeAdvanceLabels = async () => {
    setIsLoading(true);
    try {
      const labels = await GetEmployeeAdvanceLabels();
      setEmployeeAdvanceLabelsData(labels || {});
    } catch (error) {
      console.error('Error fetching Employee Advance labels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create initial form data function with enhanced validation
  const createInitialFormData = useCallback(() => {
    return {
      RecId:
        !advanceData.RecId || advanceData.RecId === '0'
          ? ''
          : advanceData.RecId,
      employeeId: employeeId || '',
      employeeName: employeeName || '',
      WorkerRecId: WorkerRecId || '',
      AdvanceTypeCode: '',
      AdvanceAmount: '',
      RequestedPaymentDate: '',
      RecoveryStartDate: '',
      RequestedInstallmentAmount: '',
      RequestedInstallments: '',
      AdvanceDescription: '',
      Guarantor1: '',
      Guarantor2: '',
    };
  }, []);

  // Form state - Initialize by calling the function
  const [formData, setFormData] = useState(() => createInitialFormData());
  const [selectedAdvanceTypeData, setSelectedAdvanceTypeData] = useState(null);

  useFocusEffect(
    useCallback(() => {
      if (mode === 'create' && cameFrom !== 'RequestTypeSelectionModal') {
        const shouldReset =
          cameFrom === 'MainDashboard' ||
          cameFrom === 'GenericAdvanceListScreen';

        if (shouldReset) {
          setFormData(createInitialFormData());
          setSelectedAdvanceTypeData(null);
          setAdvanceCodeDropDown([]);
          setAdvanceCodes([]);
          setValidationErrors({});
          setDataInitialized(false);

          fetchInitialData();
        }
      }
    }, [mode, cameFrom, fetchInitialData]), // Add fetchInitialData to dependencies
  );

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

  // Enhanced back navigation with comprehensive parameter handling
  const goBack = useCallback(() => {
    if (cameFrom === 'MainDashboard') {
      navigation.reset({
        index: 0,
        routes: [{name: 'TabNavigator', params: {screen: 'MainDashboard'}}],
      });
    } else if (cameFrom === 'GenericAdvanceListScreen') {
      const targetCameFrom = originalCameFrom || 'DisplayListPage';
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'GenericAdvanceListScreen',
            params: {
              employeeId,
              employeeName,
              WorkerRecId,
              userData: effectiveUserData,
              cameFrom: targetCameFrom,
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
    effectiveUserData,
  ]);

  // Get advance type mapping based on API response
  const getAdvanceTypeMapping = () => {
    switch (requestType) {
      case 'Loan':
        return 'Loan';
      case 'Advance':
        return 'Salary';
      default:
        return 'Loan';
    }
  };

  // Enhanced form data clearing with better state management
  const clearFormData = useCallback(() => {
    const clearedForm = createInitialFormData();
    setFormData(clearedForm);
    setSelectedAdvanceTypeData(null);
    setAdvanceCodeDropDown([]);
    setAdvanceCodes([]);
    setDataInitialized(false);
    setValidationErrors({});
  }, [createInitialFormData]);

  // Reset scroll position when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({y: 0, animated: false});
      }
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const initializeForm = async () => {
        setIsLoading(true);

        try {
          // 🔹 Fetch labels
          await fetchEmployeeAdvanceLabels();
          if (!isActive) return;

          // 🔹 CREATE MODE
          if (mode === 'create') {
            setFormData(createInitialFormData());
            setSelectedAdvanceTypeData(null);
            setValidationErrors({});
          }

          // 🔹 EDIT MODE
          if (mode === 'edit' && advanceData?.RecId) {
            setFormData({
              ...createInitialFormData(),
              ...advanceData,
              employeeId: advanceData.employeeId || employeeId,
              employeeName: advanceData.employeeName || employeeName,
              WorkerRecId: advanceData.WorkerRecId || WorkerRecId,
              AdvanceAmount: formatNumber(advanceData.AdvanceAmount || ''),
              RequestedInstallmentAmount: formatNumber(
                advanceData.RequestedInstallmentAmount || '',
              ),
              RequestedInstallments:
                advanceData.RequestedInstallments?.toString() || '',
            });
          }

          // 🔹 Load dropdowns, guarantors, pay period etc.
          await fetchInitialData();
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
    }, [mode, advanceData?.RecId]),
  );

  // Enhanced real-time validation function
  const validateField = useCallback(
    (fieldName, value, formDataToCheck = formData) => {
      const errors = {};
      const tempFormData = {...formDataToCheck, [fieldName]: value};

      // Validate Payment Date vs Recovery Start Date
      if (
        fieldName === 'RequestedPaymentDate' ||
        fieldName === 'RecoveryStartDate'
      ) {
        if (
          tempFormData.RequestedPaymentDate &&
          tempFormData.RecoveryStartDate
        ) {
          const paymentDate = new Date(tempFormData.RequestedPaymentDate);
          const recoveryDate = new Date(tempFormData.RecoveryStartDate);

          if (paymentDate > recoveryDate) {
            errors.dateComparison = `Payment Date cannot be greater than Recovery Start Date (${formatDate(
              recoveryDate,
            )})`;
          }
        }
      }

      // Validate Advance Amount against max amount
      if (fieldName === 'AdvanceAmount') {
        const advanceAmount = parseNumber(value);
        if (
          selectedAdvanceTypeData &&
          selectedAdvanceTypeData.MaxAdanceAmount
        ) {
          const maxAmount = parseNumber(
            selectedAdvanceTypeData.MaxAdanceAmount,
          );
          if (maxAmount > 0 && advanceAmount > maxAmount) {
            errors.advanceAmount = `Advance Amount cannot exceed ${formatNumber(
              maxAmount.toString(),
            )}`;
          }
        }
      }

      // Validate Recovery Amount vs Advance Amount
      if (fieldName === 'RequestedInstallmentAmount') {
        const recoveryAmount = parseNumber(value);
        const advanceAmount = parseNumber(tempFormData.AdvanceAmount);
        if (
          recoveryAmount > 0 &&
          advanceAmount > 0 &&
          recoveryAmount > advanceAmount
        ) {
          errors.recoveryAmount =
            'Recovery Amount cannot exceed Advance Amount';
        }
      }

      // Validate Recoveries against max recoveries - only when max recoveries > 0
      if (fieldName === 'RequestedInstallments') {
        const recoveries = parseNumber(value);
        if (selectedAdvanceTypeData && selectedAdvanceTypeData.Recoveries) {
          const maxRecoveries = parseNumber(selectedAdvanceTypeData.Recoveries);
          // Only validate if maxRecoveries > 0
          if (maxRecoveries > 0 && recoveries > maxRecoveries) {
            errors.recoveries = `Requested Installment cannot be greater than ${maxRecoveries}`;
          }
        }
      }

      // Enhanced validation error state management
      setValidationErrors(prev => {
        const newErrors = {...prev};
        // Remove old errors for this field group
        delete newErrors.dateComparison;
        delete newErrors.advanceAmount;
        delete newErrors.recoveryAmount;
        delete newErrors.recoveries;

        // Add new errors
        return {...newErrors, ...errors};
      });

      // Show alert immediately if there are errors
      if (Object.keys(errors).length > 0) {
        const errorMessage = Object.values(errors).join('\n');
        setAlertMessage(errorMessage);
        setAlertModal(true);
      }

      return Object.keys(errors).length === 0;
    },
    [formData, selectedAdvanceTypeData],
  );

  // Enhanced data initialization with better error handling
  useEffect(() => {
    const initializeScreen = async () => {
      if (!dataInitialized) {
        setDataInitialized(true);
        setIsLoading(true); // Add this line

        // Reset states
        setAdvanceCodeDropDown([]);
        setAdvanceCodes([]);
        setSelectedAdvanceTypeData(null);
        setProcessingButton('');
        setValidationErrors({});

        try {
          if (mode === 'create') {
            const freshFormData = createInitialFormData();
            setFormData(freshFormData);
          } else if (mode === 'edit' && advanceData?.RecId) {
            const editFormData = {
              ...createInitialFormData(),
              ...advanceData,
              employeeId: advanceData.employeeId || employeeId,
              employeeName: advanceData.employeeName || employeeName,
              WorkerRecId: advanceData.WorkerRecId || WorkerRecId,
              AdvanceAmount: formatNumber(advanceData.AdvanceAmount || ''),
              RequestedInstallmentAmount: formatNumber(
                advanceData.RequestedInstallmentAmount || '',
              ),
              RequestedInstallments:
                advanceData.RequestedInstallments?.toString() || '',
            };
            setFormData(editFormData);
          }

          await fetchInitialData();
        } catch (error) {
          console.error('Initialization error:', error);
          setAlertMessage('Failed to initialize screen. Please try again.');
          setAlertModal(true);
          setIsLoading(false); // Add this line
        }
      }
    };

    initializeScreen();
  }, [mode, advanceData?.RecId, requestType]);

  // Enhanced data fetching with better error handling
  const fetchInitialData = async () => {
    try {
      setIsLoading(true);

      const allAdvanceCodes = await RetrieveAllAdvanceTypeRequest({
        employeeId: employeeId,
      });
      const getEmployeeLookup = await GetEmployeeLookup();

      // console.log({allAdvanceCodes});
      // console.log(getEmployeeLookup, {getEmployeeLookup});

      if (!allAdvanceCodes || !Array.isArray(allAdvanceCodes)) {
        throw new Error('Invalid advance codes data received');
      }

      // Process Guarantors data
      if (getEmployeeLookup && Array.isArray(getEmployeeLookup)) {
        const filteredGuarantors = getEmployeeLookup
          .filter(
            emp =>
              emp.EmployeeId !== employeeId.toString() &&
              emp.EmployeeId !== String(employeeId).padStart(6, '0'),
          )
          .map(emp => ({
            ...emp,
            combinedLabel: `${emp.EmployeeId} - ${emp.EmployeeName}`,
          }));

        setGuarantorsData(filteredGuarantors);
        setFilteredGuarantors1(filteredGuarantors);
        setFilteredGuarantors2(filteredGuarantors);
      }

      // const expectedAdvanceType = getAdvanceTypeMapping();
      // const filteredAdvanceType = allAdvanceCodes.filter(
      //   type => type.AdvanceType === expectedAdvanceType,
      // );
      const expectedAdvanceType = getAdvanceTypeMapping();
      const employmentType = effectiveUserData?.EmploymentType || '';
      const filteredAdvanceType = allAdvanceCodes.filter(type => {
        if (type.AdvanceType !== expectedAdvanceType) {
          return false;
        }

        if (requestType === 'Loan') {
          return type.EmploymentType === 'Permanent';
        }

        return true;
      });

      const dropdownData = Array.from(
        new Set(filteredAdvanceType.map(item => item.AdvanceTypeCode)),
      ).map(code => ({
        label: code,
        value: code,
      }));

      setAdvanceCodeDropDown(dropdownData);
      setAdvanceCodes(filteredAdvanceType);

      // Enhanced auto-selection logic for Advance type in create mode
      if (
        mode === 'create' &&
        requestType === 'Advance' &&
        dropdownData.length > 0
      ) {
        const firstAdvanceType = filteredAdvanceType.find(
          type => type.AdvanceTypeCode === dropdownData[0].value,
        );

        setFormData(prev => ({
          ...prev,
          AdvanceTypeCode: dropdownData[0].value,
        }));
        setSelectedAdvanceTypeData(firstAdvanceType);
      }

      // Enhanced edit mode data handling
      if (mode === 'edit' && formData.AdvanceTypeCode) {
        const selectedType = filteredAdvanceType.find(
          type => type.AdvanceTypeCode === formData.AdvanceTypeCode,
        );
        if (selectedType) {
          setSelectedAdvanceTypeData(selectedType);
        }
      }

      // Enhanced PayGroupPayPeriod data fetching
      if (employeeId) {
        try {
          const response = await FindFirstPayGroupPayPeriod();
          const filteredPayGroupPayPeriod = response.filter(
            a => a.PayPeriodStatus === 'Active',
          );

          if (
            filteredPayGroupPayPeriod &&
            filteredPayGroupPayPeriod.length > 0
          ) {
            if (mode === 'create') {
              setFormData(prev => ({
                ...prev,
                RequestedPaymentDate: formatToISOWithTime(
                  filteredPayGroupPayPeriod[0]?.EndDate,
                ),
                RecoveryStartDate: formatToISOWithTime(
                  filteredPayGroupPayPeriod[0]?.EndDate,
                ),
              }));
            }
          }
        } catch (payGroupError) {
          console.warn('PayGroup data fetch failed:', payGroupError);
          // Continue without setting recovery date
        }
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setAlertMessage(
        'Failed to fetch initial data. Please refresh and try again.',
      );
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = value => {
    if (value === null || value === undefined || value === '') return '';

    const num = Number(value.toString().replace(/,/g, '')); // clean commas if already present
    if (isNaN(num)) return '';

    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Helper function to parse formatted numbers
  const parseNumber = value => {
    if (!value) return 0;
    const cleanValue = value.toString().replace(/,/g, '');
    const num = parseFloat(cleanValue);
    return isNaN(num) ? 0 : num;
  };

  // Enhanced refresh handler
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      clearFormData();
      await fetchInitialData();
    } catch (error) {
      console.error('Error in Save Record Screen', error);
      setAlertMessage('Failed to refresh data. Please try again.');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced input change handler
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Format date functions
  const formatDate = date => {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const year = d.getFullYear();
      return `${month}/${day}/${year}`;
    } catch (error) {
      console.error('Date formatting error:', error);
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
    } catch (error) {
      console.error('Date ISO formatting error:', error);
      return '';
    }
  };

  const handlePaymentDateChange = async date => {
    const formatted = formatToISOWithTime(date);
    setFormData(prev => ({...prev, RequestedPaymentDate: formatted}));
    setTimeout(() => validateField('RequestedPaymentDate', formatted), 100);
    setShowPaymentDateCalendar(false);
  };

  const handleRecoveryDateChange = async date => {
    const formatted = formatToISOWithTime(date);
    setFormData(prev => ({...prev, RecoveryStartDate: formatted}));
    setTimeout(() => validateField('RecoveryStartDate', formatted), 100);
    setShowRecoveryDateCalendar(false);
  };

  const handleAdvanceAmountChange = value => {
    const cleanedValue = value.replace(/[^0-9.]/g, '');
    const formattedValue = formatNumber(cleanedValue);
    handleInputChange('AdvanceAmount', formattedValue);

    // Validate immediately with slight delay
    setTimeout(() => {
      validateField('AdvanceAmount', formattedValue);
    }, 100);
  };

  const handleAdvanceTypeCodeChange = async item => {
    const newAdvanceTypeCode = item.value;
    const selectedType = advanceCodes.find(
      type => type.AdvanceTypeCode === newAdvanceTypeCode,
    );

    const currentPaymentDate = formData.RequestedPaymentDate;
    const currentRecoveryDate = formData.RecoveryStartDate;
    const currentDescription = formData.AdvanceDescription;
    const currentAdvanceAmount = formData.AdvanceAmount;

    // Reset form but preserve important data
    const resetForm = {
      ...createInitialFormData(),
      employeeId: formData.employeeId,
      employeeName: formData.employeeName,
      WorkerRecId: formData.WorkerRecId,
      AdvanceTypeCode: newAdvanceTypeCode,
      RequestedPaymentDate: currentPaymentDate,
      RecoveryStartDate: currentRecoveryDate,
      AdvanceDescription: currentDescription,
      AdvanceAmount: currentAdvanceAmount,
    };

    setFormData(resetForm);
    setSelectedAdvanceTypeData(selectedType);
    setValidationErrors({}); // Clear validation errors

    // Set default values based on the selected advance type
    if (
      selectedType &&
      selectedType.Recoveries &&
      parseNumber(selectedType.Recoveries) > 0
    ) {
      setFormData(prev => ({
        ...prev,
        RequestedInstallments: selectedType.Recoveries,
        RequestedInstallmentAmount: '',
      }));
    }
  };

  const handleRecoveryAmountChange = value => {
    const cleanedValue = value.replace(/[^0-9.]/g, '');
    const formattedValue = formatNumber(cleanedValue);

    setFormData(prev => ({
      ...prev,
      RequestedInstallmentAmount: formattedValue,
      RequestedInstallments:
        formattedValue !== '' && formattedValue !== '0'
          ? ''
          : prev.RequestedInstallments,
    }));

    // Validate immediately
    setTimeout(() => {
      validateField('RequestedInstallmentAmount', formattedValue);
    }, 100);
  };

  // Enhanced recoveries change handler
  const handleRecoveriesChange = value => {
    const cleanedValue = value.replace(/[^0-9]/g, '');

    setFormData(prev => ({
      ...prev,
      RequestedInstallments: cleanedValue,
      RequestedInstallmentAmount:
        cleanedValue !== '' && cleanedValue !== '0'
          ? ''
          : prev.RequestedInstallmentAmount,
    }));

    // Validate immediately
    setTimeout(() => {
      validateField('RequestedInstallments', cleanedValue);
    }, 100);
  };

  // Add these custom render functions
  const renderGuarantorItem = item => {
    return (
      <View style={styles.LReqSR_GuarantorItem}>
        <Text style={styles.LReqSR_GuarantorId}>{item.EmployeeId}</Text>
        <Text style={styles.LReqSR_GuarantorName}>{item.EmployeeName}</Text>
      </View>
    );
  };

  // Enhanced main action handler with better error handling
  const handleAction = async (actionType, modalMode, data = {}) => {
    try {
      const formattedRequestDate = `${
        new Date().toISOString().split('T')[0]
      }T12:00:00`;

      const advanceRequestData = {
        AdvanceTypeCode: data.AdvanceTypeCode,
        AdvanceAmount: parseNumber(data.AdvanceAmount).toString(),
        RequestedPaymentDate: data.RequestedPaymentDate,
        RecoveryStartDate: data.RecoveryStartDate,
        RequestedInstallmentAmount: parseNumber(
          data.RequestedInstallmentAmount,
        ).toString(),
        RequestedInstallments: data.RequestedInstallments || '0',
        AdvanceDescription: data.AdvanceDescription,
        EmployeeId: WorkerRecId,
        RecId: data.RecId === '' ? '0' : data.RecId,
        RequestDate: formattedRequestDate,
        Guarantor1: data.Guarantor1 || '',
        Guarantor2: data.Guarantor2 || '',
      };

      // Enhanced validation before API call
      if (
        !advanceRequestData.AdvanceTypeCode ||
        !advanceRequestData.RequestedPaymentDate
      ) {
        throw new Error('Advance Type Code and Payment Date are required.');
      }

      let response, submitResult;

      if (modalMode === 'create') {
        response = await CreateAdvanceRequest({
          advanceData: advanceRequestData,
        });
        if (actionType === 'submit' && response?.RecId) {
          submitResult = await SubmitAdvanceRequest({recId: response.RecId});
        }
      } else if (modalMode === 'update') {
        response = await UpdateAdvanceRequest({
          advanceData: advanceRequestData,
        });
        if (actionType === 'submit' && response?.IsSuccess) {
          submitResult = await SubmitAdvanceRequest({
            recId: advanceRequestData.RecId,
          });
        }
      }

      if (response.IsSuccess === 'true') {
        const actionText = modalMode === 'create' ? 'created' : 'update';
        let submitText = '';

        if (submitResult?.IsSuccess === 'true') {
          submitText = actionType === 'submit' ? ' and Submitted' : '';
        } else if (submitResult?.IsSuccess === 'false') {
          submitText = actionType === 'submit' ? ' but not Submitted' : '';
        }

        setAlertMessage(`Record ${actionText}${submitText} successfully`);
        setAlertModal(true);

        return {success: true, recId: response?.RecId};
      } else {
        const errorMessage = response?.Message || 'Operation Failed';
        setAlertMessage(errorMessage);
        setAlertModal(true);
        return {success: false, message: errorMessage};
      }
    } catch (error) {
      console.error('Error in handleAction:', error);
      const errorMessage =
        error.message || 'An error occurred while processing the request.';
      setAlertMessage(errorMessage);
      setAlertModal(true);
      return {success: false, message: errorMessage};
    }
  };

  // Enhanced field validation with comprehensive checks
  const validateFields = () => {
    const errors = [];

    // Validate Advance Type Code
    if (!formData.AdvanceTypeCode) {
      errors.push('Advance Type Code is required');
    }

    // Validate Advance Amount
    const advanceAmount = parseNumber(formData.AdvanceAmount);
    if (!advanceAmount || advanceAmount === 0) {
      errors.push('Advance Amount is required and must be greater than 0');
    } else {
      // Check if amount exceeds maximum allowed
      if (selectedAdvanceTypeData && selectedAdvanceTypeData.MaxAdanceAmount) {
        const maxAmount = parseNumber(selectedAdvanceTypeData.MaxAdanceAmount);
        if (maxAmount > 0 && advanceAmount > maxAmount) {
          errors.push(
            `Advance can not be greater than ${formatNumber(
              maxAmount.toString(),
            )}`,
          );
        }
      }
    }

    // Validate Payment Date
    if (!formData.RequestedPaymentDate) {
      errors.push('Payment Date is required');
    }

    // Validate Recovery Start Date vs Payment Date
    if (formData.RequestedPaymentDate && formData.RecoveryStartDate) {
      const paymentDate = new Date(formData.RequestedPaymentDate);
      const recoveryDate = new Date(formData.RecoveryStartDate);
      if (paymentDate > recoveryDate) {
        errors.push(
          `Payment Date cannot be greater than Recovery Start Date ${formatDate(
            recoveryDate,
          )}`,
        );
      }
    }

    if (formData.Guarantor1 && formData.Guarantor2) {
      if (formData.Guarantor1 === formData.Guarantor2) {
        errors.push('Guarantor 1 and Guarantor 2 cannot be the same person');
      }
    }

    // Enhanced validation for Loan requests
    if (requestType === 'Loan') {
      const recoveryAmount = parseNumber(formData.RequestedInstallmentAmount);
      const recoveries = parseNumber(formData.RequestedInstallments);

      // Either recovery amount or recoveries must be filled
      if (!recoveryAmount && !recoveries) {
        errors.push('Either Recovery Amount or Recoveries must be filled');
      }

      // Recovery amount cannot exceed advance amount
      if (recoveryAmount > 0 && recoveryAmount > advanceAmount) {
        errors.push('Recovery Amount cannot exceed Advance Amount');
      }

      // Recoveries cannot exceed max recoveries - only when max recoveries > 0
      if (selectedAdvanceTypeData && selectedAdvanceTypeData.Recoveries) {
        const maxRecoveries = parseNumber(selectedAdvanceTypeData.Recoveries);
        // Only validate if maxRecoveries > 0
        if (maxRecoveries > 0 && recoveries > maxRecoveries) {
          errors.push(
            `Requested Installment cannot be greater than ${maxRecoveries}`,
          );
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  };

  // Enhanced save handler with better error handling and navigation
  const handleSave = async actionType => {
    if (processingButton) return; // Prevent multiple clicks

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

          // Navigate back to list page after successful create/update
          navigation.navigate('GenericAdvanceListScreen', {
            employeeId: formData.employeeId,
            employeeName: formData.employeeName,
            WorkerRecId: formData.WorkerRecId,
            userData: effectiveUserData,
            highlightRecId: result.recId,
            cameFrom: originalCameFrom || 'DisplayListPage',
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving advance request:', error);
      setAlertMessage('Failed to save request. Please try again.');
      setAlertModal(true);
    } finally {
      setProcessingButton('');
      setIsProcessing(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  // Determine if recovery fields should be shown based on request type
  const showRecoveryFields = requestType === 'Loan';

  // Check if recovery amount field should be disabled
  const isRecoveryAmountDisabled =
    formData.RequestedInstallments &&
    parseNumber(formData.RequestedInstallments) > 0;

  // Check if recoveries field should be disabled
  const isRecoveriesDisabled =
    (formData.RequestedInstallmentAmount &&
      parseNumber(formData.RequestedInstallmentAmount) > 0) ||
    (selectedAdvanceTypeData?.Recoveries &&
      parseNumber(selectedAdvanceTypeData.Recoveries) > 0 &&
      formData.RequestedInstallments === selectedAdvanceTypeData.Recoveries);

  return (
    <ActionPaneContainer
      pageTitle={
        mode === 'edit' ? `Edit ${screenName}` : `Create ${screenName}`
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
            contentContainerStyle={styles.DSR_FormContainer}>
            {/* Employee Name */}
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              {EmployeeAdvanceLabelsData?.EmployeeNamelbl || 'Employee Name'}
            </Text>
            <Text
              style={[
                styles.DSR_Input,
                styles.DSR_Disabled,
                isRTL && {textAlign: 'left', writingDirection: 'rtl'},
              ]}>
              {formData.employeeName}
            </Text>

            {/* Request Date */}
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              {EmployeeAdvanceLabelsData?.RequestDatelbl || 'Request Date'}
            </Text>
            <Text
              style={[
                styles.DSR_Input,
                styles.DSR_Disabled,
                isRTL && {textAlign: 'left', writingDirection: 'rtl'},
              ]}>
              {formatDate(today)}
            </Text>

            {/* Advance Type Code */}
            <Text style={[styles.DSR_Label, isRTL && {textAlign: 'left'}]}>
              {EmployeeAdvanceLabelsData?.AdvanceTypeCodelbl ||
                'Advance Type Code *'}
            </Text>
            <Dropdown
              style={[
                styles.DSR_Input,
                requestType === 'Advance' && styles.DSR_Disabled,
              ]}
              data={advanceCodeDropDown}
              labelField="label"
              valueField="value"
              placeholder="Select Advance Type Code"
              value={formData.AdvanceTypeCode}
              onChange={handleAdvanceTypeCodeChange}
              placeholderStyle={styles.DSR_DropdownPlaceholder}
              selectedTextStyle={styles.DSR_DropdownSelectedText}
              itemTextStyle={styles.DSR_DropdownItemText}
              activeColor="#E6F0FF"
              containerStyle={styles.DSR_DropdownContainer}
              itemContainerStyle={styles.DSR_DropdownItemContainer}
              maxHeight={280}
              search
              searchPlaceholder="Search Advance Type Code"
              inputSearchStyle={styles.DSR_DropdownSearchInput}
              iconStyle={styles.DSR_DropdownIcon}
              disable={requestType === 'Advance'}
            />

            {/* Advance Amount */}
            <Text style={styles.DSR_Label}>
              {EmployeeAdvanceLabelsData?.AdvanceAmountlbl ||
                'Advance Amount *'}
            </Text>
            <TextInput
              style={[
                styles.DSR_Input,
                !formData.AdvanceTypeCode && styles.DSR_Disabled,
              ]}
              value={formData.AdvanceAmount}
              onChangeText={handleAdvanceAmountChange}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#888"
              editable={!!formData.AdvanceTypeCode}
            />

            {/* Payment Date */}
            <Text style={styles.DSR_Label}>
              {EmployeeAdvanceLabelsData?.RequestedPaymentDatelbl ||
                'Payment Date *'}
            </Text>
            {/* <TouchableOpacity
              style={styles.DSR_DateSelector}
              onPress={() => {
                setCurrentDateField('RequestedPaymentDate');
                setShowCalendar(true);
              }}>
              <View style={{flex: 1}}>
                <Text style={styles.DSR_DateText}>
                  {formData.RequestedPaymentDate
                    ? formatDate(formData.RequestedPaymentDate)
                    : 'Select Payment Date'}
                </Text>
              </View>
              <Icon name="calendar" size={20} color="#0A66C2" />
            </TouchableOpacity> */}
            {/* Payment Date */}
            <TouchableOpacity
              style={styles.DSR_DateSelector}
              onPress={() => setShowPaymentDateCalendar(true)}>
              <View style={{flex: 1}}>
                <Text style={styles.DSR_DateText}>
                  {formData.RequestedPaymentDate
                    ? formatDate(formData.RequestedPaymentDate)
                    : 'Select Payment Date'}
                </Text>
              </View>
              <Icon name="calendar" size={20} color="#0A66C2" />
            </TouchableOpacity>

            {/* Recovery fields - only for Loan */}
            {showRecoveryFields && (
              <>
                <Text style={styles.DSR_Label}>
                  {EmployeeAdvanceLabelsData?.RecoveryStartDatelbl ||
                    'Recovery Start Date'}
                </Text>
                {/* Recovery Start Date */}
                <TouchableOpacity
                  style={styles.DSR_DateSelector}
                  onPress={() => setShowRecoveryDateCalendar(true)}>
                  <View style={{flex: 1}}>
                    <Text style={styles.DSR_DateText}>
                      {formData.RecoveryStartDate
                        ? formatDate(formData.RecoveryStartDate)
                        : 'Select Recovery Start Date'}
                    </Text>
                  </View>
                  <Icon name="calendar" size={20} color="#0A66C2" />
                </TouchableOpacity>

                {/* Guarantor 1 */}
                <Text style={styles.DSR_Label}>
                  {EmployeeAdvanceLabelsData?.Guarantor1lbl || 'Guarantor 1'}
                </Text>
                <Dropdown
                  style={styles.DSR_Input}
                  data={[
                    {
                      EmployeeId: '',
                      EmployeeName: 'Select Guarantor 1',
                      combinedLabel: '',
                    },
                    ...guarantorsData.filter(
                      emp => emp.EmployeeId !== formData.Guarantor2,
                    ),
                  ]}
                  labelField="EmployeeName"
                  valueField="EmployeeId"
                  search
                  searchPlaceholder="Search by ID or Name"
                  searchField="combinedLabel"
                  onChangeText={text => setGuarantor1SearchQuery(text)}
                  placeholder="Select Guarantor 1"
                  value={formData.Guarantor1}
                  onChange={item => {
                    handleInputChange('Guarantor1', item.EmployeeId);
                    setGuarantor1SearchQuery('');
                  }}
                  placeholderStyle={styles.DSR_DropdownPlaceholder}
                  selectedTextStyle={styles.DSR_DropdownSelectedText}
                  itemTextStyle={styles.DSR_DropdownItemText}
                  activeColor="#E6F0FF"
                  containerStyle={styles.DSR_DropdownContainer}
                  itemContainerStyle={styles.DSR_DropdownItemContainer}
                  maxHeight={280}
                  inputSearchStyle={styles.DSR_DropdownSearchInput}
                  iconStyle={styles.DSR_DropdownIcon}
                  renderItem={renderGuarantorItem}
                />

                {/* Guarantor 2 */}
                <Text style={styles.DSR_Label}>
                  {EmployeeAdvanceLabelsData?.Guarantor2lbl || 'Guarantor 2'}
                </Text>
                <Dropdown
                  style={styles.DSR_Input}
                  data={[
                    {
                      EmployeeId: '',
                      EmployeeName: 'Select Guarantor 2',
                      combinedLabel: '',
                    },
                    ...guarantorsData.filter(
                      emp => emp.EmployeeId !== formData.Guarantor1,
                    ),
                  ]}
                  labelField="EmployeeName"
                  valueField="EmployeeId"
                  search
                  searchPlaceholder="Search by ID or Name"
                  searchField="combinedLabel"
                  onChangeText={text => setGuarantor2SearchQuery(text)}
                  placeholder="Select Guarantor 2"
                  value={formData.Guarantor2}
                  onChange={item => {
                    handleInputChange('Guarantor2', item.EmployeeId);
                    setGuarantor2SearchQuery('');
                  }}
                  placeholderStyle={styles.DSR_DropdownPlaceholder}
                  selectedTextStyle={styles.DSR_DropdownSelectedText}
                  itemTextStyle={styles.DSR_DropdownItemText}
                  activeColor="#E6F0FF"
                  containerStyle={styles.DSR_DropdownContainer}
                  itemContainerStyle={styles.DSR_DropdownItemContainer}
                  maxHeight={280}
                  inputSearchStyle={styles.DSR_DropdownSearchInput}
                  iconStyle={styles.DSR_DropdownIcon}
                  renderItem={renderGuarantorItem}
                />

                <Text style={styles.DSR_Label}>
                  {EmployeeAdvanceLabelsData?.RequestedInstallmentAmountlbl ||
                    'Recovery Amount *'}
                </Text>
                <TextInput
                  style={[
                    styles.DSR_Input,
                    isRecoveryAmountDisabled && styles.DSR_Disabled,
                  ]}
                  value={formData.RequestedInstallmentAmount}
                  onChangeText={handleRecoveryAmountChange}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#888"
                  editable={!isRecoveryAmountDisabled}
                />

                <Text style={styles.DSR_Label}>
                  {EmployeeAdvanceLabelsData?.recoverieslbl || 'Recoveries *'}
                </Text>
                <TextInput
                  style={[
                    styles.DSR_Input,
                    isRecoveriesDisabled && styles.DSR_Disabled,
                  ]}
                  value={formData.RequestedInstallments}
                  onChangeText={handleRecoveriesChange}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#888"
                  editable={!isRecoveriesDisabled}
                />
              </>
            )}

            {/* Description */}
            <Text style={styles.DSR_Label}>
              {EmployeeAdvanceLabelsData?.AdvanceDescriptionlbl ||
                'AdvanceDescription'}
            </Text>
            <TextInput
              style={[styles.DSR_Input, styles.DSR_TextArea]}
              value={formData.AdvanceDescription}
              onChangeText={value =>
                handleInputChange('AdvanceDescription', value)
              }
              placeholder={`Enter ${requestType.toLowerCase()} description`}
              placeholderTextColor="#888"
              multiline
              numberOfLines={4}
              maxLength={60}
            />
            <Text style={styles.DSR_CharCount}>
              {formData.AdvanceDescription?.length || 0}/60
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

      {/* ✅ One CalendarModal per date field, outside the loading block */}
      <CalendarModal
        visible={showPaymentDateCalendar}
        initialDate={formData.RequestedPaymentDate}
        onDateSelected={handlePaymentDateChange}
        onClose={() => setShowPaymentDateCalendar(false)}
      />

      <CalendarModal
        visible={showRecoveryDateCalendar}
        initialDate={formData.RecoveryStartDate}
        onDateSelected={handleRecoveryDateChange}
        onClose={() => setShowRecoveryDateCalendar(false)}
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

export default GenericAdvanceSaveScreen;
