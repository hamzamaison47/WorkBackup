/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  BackHandler,
  Platform,
  Keyboard,
  Animated,
  ActivityIndicator,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {Dropdown} from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/FontAwesome';
import {translate as t} from '../../../../../store/utils/translate';

import {RetrieveExpenseCategory} from '../../../API/TravelRequisition/Lines/RetrieveExpenseCategory';
import {GetCurrencyCode} from '../../../API/TravelRequisition/Lines/GetCurrencyCode';
import {CreateTravelRequisitionLine} from '../../../API/TravelRequisition/Lines/CreateTravelRequisitionLine';
import {UpdateTravelRequisitionLine} from '../../../API/TravelRequisition/Lines/UpdateTravelRequisitionLine';
import {GetAmountInPKR} from '../../../API/TravelRequisition/Lines/GetAmountInPKR';
import {GetEstimatedAmountForPerDiem} from '../../../API/TravelRequisition/Lines/GetEstimatedAmountForPerDiem';
import {GetMileageAmount} from '../../../API/TravelRequisition/Lines/GetMileageAmount';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import DatePicker from 'react-native-date-picker';

import AlertModal from '../../../../../components/Alert/AlertModal';
import useAlertModal from '../../../../../hooks/useAlertModal';
import CalendarModal from '../../../../../components/Leaves/CalendarModal';
import CustomIndicator from '../../../../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../../../../components/ActionPaneContainer';
import SaveRecordButtons, {
  BUTTON_TYPES,
} from '../../../../../components/Buttons/SaveRecordButtons';
import {AppTokens} from '../../../../../components/AppComponentsDesign/Appcomponents';
import styles from '../../../../../styles/styles';
import useNotify from '../../../../../hooks/useNotify';
import usePalette from '../../../../../hooks/usePalette';
import useAppStyles from '../../../../../hooks/useAppStyles';

const CATEGORY_GROUPS = {
  STANDARD: [
    'Bus',
    'Car Fuel',
    'Hotel INT G-6',
    'Hotel Loc G-6',
    'Other Expenses',
    'Rail',
    'Taxi / Rickshaw',
    'Toll Tax',
    'Visa Fee',
  ],
  MILEAGE: ['Car Mileage'],
  AIRLINE: ['Flight International', 'Flight Local'],
  PERDIEM: ['Per Diem G-6', 'Per Diem INT G-6'],
};

const getCategoryGroup = category => {
  if (!category) return 'STANDARD';

  if (CATEGORY_GROUPS.MILEAGE.includes(category)) return 'MILEAGE';
  if (CATEGORY_GROUPS.AIRLINE.includes(category)) return 'AIRLINE';

  // Grade-agnostic: matches "Per Diem G-4", "Per Diem INT G-6", etc.
  if (/^Per Diem( INT)? G-\d+$/i.test(category)) return 'PERDIEM';

  return 'STANDARD';
};

const GROUP_CONFIG = {
  STANDARD: {
    showEstimatedAmount: true,
    showCurrency: true,
    showMileage: false,
    showAirlineServiceClass: false,
    showPerDiemDates: false,
    amountEditable: true,
    autoCalcPKR: true,
  },
  MILEAGE: {
    showEstimatedAmount: true,
    showCurrency: true,
    showMileage: true,
    showAirlineServiceClass: false,
    showPerDiemDates: false,
    amountEditable: false,
    autoCalcPKR: true,
  },
  AIRLINE: {
    showEstimatedAmount: true,
    showCurrency: true,
    showMileage: false,
    showAirlineServiceClass: true,
    showPerDiemDates: false,
    amountEditable: true,
    autoCalcPKR: true,
  },
  PERDIEM: {
    showEstimatedAmount: true,
    showCurrency: true,
    showMileage: false,
    showAirlineServiceClass: false,
    showPerDiemDates: true,
    amountEditable: false,
    autoCalcPKR: false,
  },
};

const AIRLINE_SERVICE_CLASS_OPTIONS = [
  {label: 'Economy Class', value: 'Economy Class'},
  {label: 'Business Class', value: 'Business Class'},
  {label: 'First Class', value: 'First Class'},
];

// Maps the backend's exact enum2Str() output (case as returned by D365) to
// the dropdown's option values. Keys must match the backend string EXACTLY —
// confirmed via logging: backend sends "Economy class", not "Economy Class".
const AIRLINE_SERVICE_CLASS_MAP = {
  'Economy class': 'Economy Class',
  'Business class': 'Business Class',
  'First class': 'First Class',
};

// Module-level, stable-across-renders default for lineData. Using an inline
// `lineData = {}` default in the destructure below would create a NEW object
// reference on every render, which — when depended on inside useFocusEffect/
// useCallback — caused an infinite update loop in create mode (new lineData
// reference -> effect re-fires -> setState -> re-render -> new lineData
// reference -> ...). A shared module-level constant fixes that: it's the same
// reference every time route.params.lineData is genuinely absent.
const EMPTY_LINE_DATA = {};

const TravelRequisitionLinesSaveRecord = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const P = usePalette();
  const {notifySuccess, notifyError} = useNotify('Travel Requisition Line');
  const styles = useAppStyles();

  const reduxUserData = useSelector(state => state.user.userData);
  const {selectedLegalEntity, defaultLegalEntity} = useSelector(
    state => state.company,
  );

  const {
    mode = 'create',
    lineData = EMPTY_LINE_DATA,
    headerRecId,
    requisitionNumber,
    workerRecId,
    legalEntity,
    userData: routeUserData,
    cameFrom,
    originalCameFrom,
  } = route.params || {};

  const isEdit = mode === 'edit';

  const effectiveUserData = routeUserData || reduxUserData || {};
  const effectiveWorkerRecId =
    workerRecId || effectiveUserData?.WorkerRecId || '';
  const effectiveEmployeeId = effectiveUserData?.employeeId || '';
  const effectiveEmployeeName = effectiveUserData?.employeeName || '';
  const effectiveLegalEntity =
    legalEntity || selectedLegalEntity || defaultLegalEntity || '';

  const today = new Date().toISOString().split('T')[0] + 'T12:00:00';

  // Defensively coerce any date value (string OR Date object) into an ISO
  // string. lineData comes from the SOAP response via FindTravelRequisitionLines,
  // and depending on parsing, date fields can arrive as JS Date instances
  // instead of strings — CalendarModal (and other consumers) assume strings
  // and crash on Date objects (e.g. `.includes is not a function`).
  const toDateString = value => {
    if (!value) return '';
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      const hours = String(value.getHours()).padStart(2, '0');
      const minutes = String(value.getMinutes()).padStart(2, '0');
      const seconds = String(value.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }
    return String(value);
  };

  const createInitialFormData = () => ({
    RecId: isEdit ? lineData.RecId : '',
    Category: isEdit ? lineData.Category || '' : '',
    Currency: isEdit
      ? getCategoryGroup(lineData.Category) === 'MILEAGE'
        ? 'PKR'
        : lineData.Currency || 'PKR'
      : 'PKR',
    EstimatedAmount: isEdit
      ? lineData.EstimatedAmount != null
        ? String(lineData.EstimatedAmount)
        : ''
      : '',
    EstimatedDate: isEdit
      ? toDateString(lineData.EstimatedDate) || today
      : today,
    AmountInPKR: isEdit
      ? lineData.AmountInPKR != null
        ? String(lineData.AmountInPKR)
        : ''
      : '',
    ExchangeRate: isEdit
      ? lineData.ExchangeRate != null
        ? String(lineData.ExchangeRate)
        : ''
      : '',
    Mileage: isEdit
      ? lineData.Mileage != null
        ? String(lineData.Mileage)
        : ''
      : '',
    AirlineServiceClass: isEdit
      ? AIRLINE_SERVICE_CLASS_MAP[lineData.AirlineServiceClass] ||
        lineData.AirlineServiceClass ||
        ''
      : '',
    PerDiemFromDate: isEdit
      ? toDateString(lineData.PerdiemDateFrom || lineData.PerDiemFromDate)
      : '',
    PerDiemToDate: isEdit
      ? toDateString(lineData.PerdiemDateTo || lineData.PerDiemToDate)
      : '',
  });

  console.log(
    '[SaveRecord] AirlineServiceClass from lineData:',
    JSON.stringify(lineData.AirlineServiceClass),
  );

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [currencyOptions, setCurrencyOptions] = useState([]);
  const [formData, setFormData] = useState(() => createInitialFormData());
  const [errors, setErrors] = useState({});
  const [activeDateField, setActiveDateField] = useState(null);
  const {showSuccess, showError, showWarning, alertModalProps} =
    useAlertModal();
  const [processingButton, setProcessingButton] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculatingPKR, setIsCalculatingPKR] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [dateTimeField, setDateTimeField] = useState(null);

  const pkrDebounceRef = useRef(null);
  const perDiemDebounceRef = useRef(null);
  const mileageDebounceRef = useRef(null);

  const group = getCategoryGroup(formData.Category);
  const config = GROUP_CONFIG[group];

  // Resets EVERYTHING — including in-flight debounce timers and the
  // processing/calculating flags — so a Cancel or hardware-back mid-save or
  // mid-debounce can never leak state into the next time this screen is
  // focused (create or edit, same instance reused or not).
  const clearAllStates = useCallback(() => {
    setCategoryOptions([]);
    setCurrencyOptions([]);
    setFormData(createInitialFormData());
    setErrors({});
    setActiveDateField(null);
    setProcessingButton('');
    setIsProcessing(false);
    setIsCalculatingPKR(false);
    setDataFetched(false);

    if (pkrDebounceRef.current) clearTimeout(pkrDebounceRef.current);
    if (perDiemDebounceRef.current) clearTimeout(perDiemDebounceRef.current);
    if (mileageDebounceRef.current) clearTimeout(mileageDebounceRef.current);
  }, []);

  useEffect(() => {
    return () => {
      clearAllStates();
    };
  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // ── Auto-calc Amount in PKR for STANDARD / AIRLINE groups ──────────────
  useEffect(() => {
    if (!config.autoCalcPKR || group === 'MILEAGE') return;
    if (isLoading) return;

    const amountNum = parseFloat(formData.EstimatedAmount);
    if (!formData.Currency || isNaN(amountNum)) return;

    if (pkrDebounceRef.current) clearTimeout(pkrDebounceRef.current);
    pkrDebounceRef.current = setTimeout(async () => {
      setIsCalculatingPKR(true);
      try {
        const {amountInPKR, exchangeRate} = await GetAmountInPKR({
          Currency: formData.Currency,
          EstimatedAmount: amountNum,
          EstimatedDate: formData.EstimatedDate,
        });
        setFormData(prev => ({
          ...prev,
          AmountInPKR: String(amountInPKR),
          ExchangeRate: String(exchangeRate),
        }));
      } catch (error) {
        console.error('PKR calculation error:', error);
      } finally {
        setIsCalculatingPKR(false);
      }
    }, 500);

    return () => clearTimeout(pkrDebounceRef.current);
  }, [
    formData.EstimatedAmount,
    formData.Currency,
    formData.EstimatedDate,
    config.autoCalcPKR,
    group,
    isLoading,
  ]);

  const formatExchangeRate = value => {
    if (value === '' || value === null || value === undefined) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num.toFixed(3);
  };

  // ── Auto-calc Estimated Amount + Amount in PKR for PERDIEM group ───────
  useEffect(() => {
    if (group !== 'PERDIEM') return;
    if (isLoading) return;
    if (
      !formData.Category ||
      !formData.PerDiemFromDate ||
      !formData.PerDiemToDate
    )
      return;

    if (perDiemDebounceRef.current) clearTimeout(perDiemDebounceRef.current);
    perDiemDebounceRef.current = setTimeout(async () => {
      setIsCalculatingPKR(true);
      try {
        const result = await GetEstimatedAmountForPerDiem({
          Category: formData.Category,
          Currency: 'PKR',
          EstimatedDate: formData.EstimatedDate,
          PerDiemFromDate: formData.PerDiemFromDate,
          PerDiemToDate: formData.PerDiemToDate,
          RequisitionHeaderRecId: headerRecId,
        });
        setFormData(prev => ({
          ...prev,
          Currency: result.currency || 'PKR',
          EstimatedAmount: String(result.estimatedAmount),
          AmountInPKR: String(result.amountInPKR),
        }));
      } catch (error) {
        console.error('Per diem calculation error:', error);
      } finally {
        setIsCalculatingPKR(false);
      }
    }, 500);

    return () => clearTimeout(perDiemDebounceRef.current);
  }, [
    group,
    formData.Category,
    formData.EstimatedDate,
    formData.PerDiemFromDate,
    formData.PerDiemToDate,
    isLoading,
  ]);

  // ── Auto-calc Estimated Amount + Amount in PKR for MILEAGE group ───────
  useEffect(() => {
    if (group !== 'MILEAGE') return;
    if (isLoading) return;

    const mileageNum = parseFloat(formData.Mileage);
    if (!formData.Category || isNaN(mileageNum)) return;

    if (mileageDebounceRef.current) clearTimeout(mileageDebounceRef.current);
    mileageDebounceRef.current = setTimeout(async () => {
      setIsCalculatingPKR(true);
      try {
        const result = await GetMileageAmount({
          Category: formData.Category,
          EstimatedDate: formData.EstimatedDate,
          Mileage: mileageNum,
          RequisitionHeaderRecId: headerRecId,
        });
        setFormData(prev => ({
          ...prev,
          EstimatedAmount: String(result.estimatedAmount),
          AmountInPKR: String(result.amountInPKR),
        }));
      } catch (error) {
        console.error('Mileage calculation error:', error);
      } finally {
        setIsCalculatingPKR(false);
      }
    }, 500);

    return () => clearTimeout(mileageDebounceRef.current);
  }, [
    group,
    formData.Category,
    formData.EstimatedDate,
    formData.Mileage,
    isLoading,
  ]);

  const goBack = useCallback(() => {
    clearAllStates();
    navigation.navigate('TravelRequisitionLinesListPage', {
      headerRecId,
      requisitionNumber,
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      legalEntity: effectiveLegalEntity,
      userData: effectiveUserData,
      cameFrom: originalCameFrom || cameFrom || 'DrawerNavigator',
      forceShowAddButton: true,
    });
  }, [
    navigation,
    headerRecId,
    requisitionNumber,
    effectiveEmployeeId,
    effectiveEmployeeName,
    effectiveWorkerRecId,
    effectiveLegalEntity,
  ]);

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
      scrollViewRef.current?.scrollToPosition(0, 0, false);
    }, []),
  );

  const fetchCategoryOptions = async (forceRefresh = false) => {
    if (categoryOptions.length > 0 && !forceRefresh) return;
    const categories = await RetrieveExpenseCategory(effectiveWorkerRecId);
    setCategoryOptions(
      (categories || []).map(cat => ({label: cat, value: cat})),
    );
  };

  const fetchCurrencyOptions = async (forceRefresh = false) => {
    if (currencyOptions.length > 0 && !forceRefresh) return;
    const currencies = await GetCurrencyCode();
    setCurrencyOptions(
      (currencies || []).map(cur => ({label: cur, value: cur})),
    );
  };

  // Fetch dropdown lookup data — only needs to happen once per screen
  // lifetime. Deliberately kept SEPARATE from the formData sync effect below
  // (they used to be one effect gated by `dataFetched`, which raced with
  // reused screen instances and could skip the formData resync entirely).
  useFocusEffect(
    useCallback(() => {
      const initializeData = async () => {
        setIsLoading(true);
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start();

        if (!dataFetched) {
          try {
            await Promise.all([fetchCategoryOptions(), fetchCurrencyOptions()]);
            setDataFetched(true);
          } catch (error) {
            console.error('Error fetching lookup data:', error);
            showError('Failed to fetch data.');
          }
        }

        setIsLoading(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      };

      initializeData();
    }, [dataFetched]),
  );

  // Sync formData on every focus:
  //  - edit mode: pull the latest values from lineData. Depending on the
  //    whole `lineData` object (not just lineData.RecId) matters — re-editing
  //    the SAME record after changing a field elsewhere needs a fresh object
  //    reference to force this to re-run; depending on RecId alone would
  //    keep a stale closure from the first edit of that record.
  //  - create mode: always start blank. handleAddLine navigates directly
  //    without going through goBack()/clearAllStates(), so this is the only
  //    reset point when the screen instance is reused after a prior edit.
  // This is safe against infinite loops ONLY because `lineData` now defaults
  // to the stable module-level EMPTY_LINE_DATA constant instead of a fresh
  // inline `{}` on every render.
  useFocusEffect(
    useCallback(() => {
      setFormData(createInitialFormData());
      setErrors({});
    }, [isEdit, lineData]),
  );

  const handleRefresh = useCallback(async () => {
    if (isEdit) return; // nothing to reset in edit mode
    setIsLoading(true);
    try {
      setCategoryOptions([]);
      setCurrencyOptions([]);
      setDataFetched(false);
      setFormData(createInitialFormData());
      setErrors({});
      await Promise.all([
        fetchCategoryOptions(true),
        fetchCurrencyOptions(true),
      ]);
      setDataFetched(true);
    } catch (error) {
      console.error('Error refreshing lookup data:', error);
      showError('Failed to fetch data.');
    } finally {
      setIsLoading(false);
    }
  }, [isEdit, effectiveWorkerRecId]);

  const clearFieldError = field =>
    setErrors(prev => {
      if (!prev[field]) return prev;
      const next = {...prev};
      delete next[field];
      return next;
    });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
    clearFieldError(field);
  };

  const handleCategoryChange = item => {
    if (isEdit) return; // category is locked once created — backend update() ignores it anyway
    const newCategory = item.value;
    const newGroup = getCategoryGroup(newCategory);
    setFormData(prev => ({
      ...prev,
      Category: newCategory,
      Currency:
        newGroup === 'PERDIEM' || newGroup === 'MILEAGE'
          ? 'PKR'
          : prev.Currency,
      Mileage: newGroup === 'MILEAGE' ? prev.Mileage : '',
      AirlineServiceClass:
        newGroup === 'AIRLINE' ? prev.AirlineServiceClass : '',
      PerDiemFromDate: newGroup === 'PERDIEM' ? prev.PerDiemFromDate : '',
      PerDiemToDate: newGroup === 'PERDIEM' ? prev.PerDiemToDate : '',
      AmountInPKR: '',
      ExchangeRate: '',
    }));
    [
      'Category',
      'Mileage',
      'AirlineServiceClass',
      'PerDiemFromDate',
      'PerDiemToDate',
    ].forEach(clearFieldError);
  };

  const handleCurrencyChange = item => {
    setFormData(prev => ({...prev, Currency: item.value}));
    clearFieldError('Currency');
  };

  const formatDisplayDate = date => {
    const d = typeof date === 'string' ? parseLocalDateTimeString(date) : date;
    if (!d) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDisplayDateTime = date => {
    const d = typeof date === 'string' ? parseLocalDateTimeString(date) : date;
    if (!d) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const mins = String(d.getMinutes()).padStart(2, '0');
    let hours = d.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${day}/${month}/${year} ${hours}:${mins} ${ampm}`;
  };

  // Used for EstimatedDate — noon is fine here since only the calendar day
  // matters for this field's downstream logic.
  const formatToISOWithTime = dateInput => {
    let year, month, day;
    if (typeof dateInput === 'string') {
      const datePart = dateInput.split('T')[0];
      [year, month, day] = datePart.split('-').map(Number);
    } else {
      year = dateInput.getFullYear();
      month = dateInput.getMonth() + 1;
      day = dateInput.getDate();
    }
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(
      2,
      '0',
    )}T12:00:00`;
  };

  const formatToISOPreserveTime = dateInput => {
    const d =
      typeof dateInput === 'string'
        ? parseLocalDateTimeString(dateInput)
        : dateInput;
    if (!d) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  // Parses a "YYYY-MM-DDTHH:mm:ss" string into local Date components directly —
  // never routes through new Date(str), which Hermes misinterprets as UTC for
  // timezone-less strings (silently shifts hours by the device's UTC offset).
  const parseLocalDateTimeString = str => {
    if (!str) return null;
    const match = String(str).match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/,
    );
    if (!match) return null;
    const [, year, month, day, hours, minutes, seconds] = match;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
      Number(seconds),
    );
  };

  const handleDateTimeConfirm = date => {
    if (!dateTimeField) return;
    setFormData(prev => ({
      ...prev,
      [dateTimeField]: formatToISOPreserveTime(date),
    }));
    clearFieldError(dateTimeField);
    setDateTimeField(null);
  };

  const dateTimePickerInitialDate = () => {
    const current = dateTimeField ? formData[dateTimeField] : '';
    if (!current) return new Date();
    const d = parseLocalDateTimeString(current);
    return d || new Date();
  };

  const handleDateChange = date => {
    if (!activeDateField) return;

    const isPerDiemField =
      activeDateField === 'PerDiemFromDate' ||
      activeDateField === 'PerDiemToDate';

    const formatted = isPerDiemField
      ? formatToISOPreserveTime(date)
      : formatToISOWithTime(date);

    setFormData(prev => ({
      ...prev,
      [activeDateField]: formatted,
    }));
    clearFieldError(activeDateField);
    setActiveDateField(null);
  };

  const formatThousands = value => {
    if (value === '' || value === null || value === undefined) return '';
    const [intPart, decPart] = String(value).split('.');
    const sign = intPart.startsWith('-') ? '-' : '';
    const digitsOnly = intPart.replace('-', '');
    const formattedInt = digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decPart !== undefined
      ? `${sign}${formattedInt}.${decPart}`
      : `${sign}${formattedInt}`;
  };

  const stripThousands = value => value.replace(/,/g, '');

  const handleAmountChange = rawInput => {
    const unformatted = stripThousands(rawInput);
    let cleaned = unformatted.replace(/[^0-9.-]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');
    handleInputChange('EstimatedAmount', cleaned);
  };

  const handleMileageChange = rawInput => {
    const unformatted = stripThousands(rawInput);
    let cleaned = unformatted.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');
    handleInputChange('Mileage', cleaned);
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.Category) nextErrors.Category = 'Category is required';
    if (!formData.EstimatedDate)
      nextErrors.EstimatedDate = 'Estimated date is required';

    if (config.showCurrency && !formData.Currency) {
      nextErrors.Currency = 'Currency is required';
    }

    if (config.showEstimatedAmount) {
      const raw = formData.EstimatedAmount;
      if (raw === '' || raw === null || raw === undefined) {
        nextErrors.EstimatedAmount = 'Estimated amount is required';
      } else {
        const num = parseFloat(raw);
        if (isNaN(num)) {
          nextErrors.EstimatedAmount =
            'Estimated amount must be a valid number';
        } else if (num < 0) {
          nextErrors.EstimatedAmount = 'Estimated amount cannot be negative';
        }
      }
    }

    if (config.showMileage) {
      const mileageNum = parseFloat(formData.Mileage);
      if (formData.Mileage === '' || formData.Mileage === null) {
        nextErrors.Mileage = 'Mileage is required';
      } else if (isNaN(mileageNum) || mileageNum < 0) {
        nextErrors.Mileage = 'Mileage must be a valid non-negative number';
      }
    }

    if (config.showAirlineServiceClass && !formData.AirlineServiceClass) {
      nextErrors.AirlineServiceClass = 'Airline service class is required';
    }

    if (config.showPerDiemDates) {
      if (!formData.PerDiemFromDate)
        nextErrors.PerDiemFromDate = 'Per diem from date is required';
      if (!formData.PerDiemToDate)
        nextErrors.PerDiemToDate = 'Per diem to date is required';
      if (
        formData.PerDiemFromDate &&
        formData.PerDiemToDate &&
        new Date(formData.PerDiemToDate) < new Date(formData.PerDiemFromDate)
      ) {
        nextErrors.PerDiemToDate = 'To date cannot be before from date';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async actionType => {
    if (processingButton) return;
    if (isCalculatingPKR) {
      showWarning('Please wait for the amount calculation to finish.');
      return;
    }

    if (!validate()) {
      showWarning('Please correct the highlighted fields before saving.');
      return;
    }

    setProcessingButton(actionType);
    setIsProcessing(true);

    try {
      let response;

      const sharedFields = {
        Category: formData.Category,
        Currency: formData.Currency,
        EstimatedAmount: config.showEstimatedAmount
          ? parseFloat(formData.EstimatedAmount)
          : undefined,
        EstimatedDate: formData.EstimatedDate,
        LegalEntity: effectiveLegalEntity,
        Mileage: group === 'MILEAGE' ? parseFloat(formData.Mileage) : undefined,
        AirlineServiceClass:
          group === 'AIRLINE' ? formData.AirlineServiceClass : undefined,
        PerDiemFromDate:
          group === 'PERDIEM' ? formData.PerDiemFromDate : undefined,
        PerDiemToDate: group === 'PERDIEM' ? formData.PerDiemToDate : undefined,
        AmountInPKR: formData.AmountInPKR
          ? parseFloat(formData.AmountInPKR)
          : undefined,
      };

      if (isEdit) {
        response = await UpdateTravelRequisitionLine({
          RecId: formData.RecId,
          ...sharedFields,
          RequisitionHeaderRecId: headerRecId,
        });
      } else {
        response = await CreateTravelRequisitionLine(headerRecId, sharedFields);
      }

      if (response?.IsSuccess) {
        const message =
          response.Message ||
          (isEdit
            ? 'Record updated successfully'
            : 'Record created successfully');
        notifySuccess(message);
        showSuccess(message);

        setTimeout(() => {
          clearAllStates();
          navigation.navigate('TravelRequisitionLinesListPage', {
            headerRecId,
            requisitionNumber,
            employeeId: effectiveEmployeeId,
            employeeName: effectiveEmployeeName,
            WorkerRecId: effectiveWorkerRecId,
            legalEntity: effectiveLegalEntity,
            userData: effectiveUserData,
            cameFrom: originalCameFrom || cameFrom || 'DrawerNavigator',
            refresh: Date.now(),
          });
        }, 1200);
      } else {
        const message =
          response?.Message ||
          (isEdit ? 'Error updating record' : 'Error creating record');
        notifyError(message);
        showError(message);
      }
    } catch (error) {
      console.error('Error saving travel requisition line:', error);
      notifyError('Failed to save record. Please try again.');
      showError('Failed to save record. Please try again.');
    } finally {
      setProcessingButton('');
      setIsProcessing(false);
    }
  };

  const renderError = field =>
    errors[field] ? (
      <Text style={{color: AppTokens.red, fontSize: 12, marginTop: 4}}>
        {errors[field]}
      </Text>
    ) : null;

  return (
    <ActionPaneContainer
      pageTitle={
        isEdit
          ? 'Edit Travel Requisition Line'
          : 'Create Travel Requisition Line'
      }
      isBackButton={true}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={!isKeyboardVisible}
      onBackPress={goBack}
      onRefresh={handleRefresh}
      showPageTitleRow={true}>
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <Animated.View style={{flex: 1, opacity: fadeAnim}}>
          <SafeAreaView style={styles.DSR_SafeArea}>
            {isProcessing && (
              <View style={styles.DSR_ProcessingOverlay}>
                <View style={styles.DSR_ProcessingContainer}>
                  <ActivityIndicator size="large" color={P.primary} />
                  <Text style={styles.DSR_ProcessingText}>
                    {t('common.processing')}
                  </Text>
                </View>
              </View>
            )}

            <KeyboardAwareScrollView
              ref={scrollViewRef}
              contentContainerStyle={styles.DSR_FormContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}>
              {/* 1. Category — editable only in create mode */}
              <Text style={styles.DSR_Label}>Expense category *</Text>
              {isEdit ? (
                <Text style={[styles.DSR_Input, styles.DSR_Disabled]}>
                  {formData.Category}
                </Text>
              ) : (
                <>
                  <Dropdown
                    style={styles.DSR_Input}
                    data={categoryOptions}
                    labelField="label"
                    valueField="value"
                    placeholder="Select Expense category"
                    value={formData.Category}
                    onChange={handleCategoryChange}
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
                    search
                    searchPlaceholder="Search Expense category"
                    inputSearchStyle={styles.DSR_DropdownSearchInput}
                    iconStyle={styles.DSR_DropdownIcon}
                    keyboardAvoiding={true}
                  />
                  {renderError('Category')}
                </>
              )}

              {/* 2. Estimated Date */}
              <Text style={styles.DSR_Label}>Estimated date *</Text>
              <TouchableOpacity
                style={styles.DSR_DateSelector}
                onPress={() => setActiveDateField('EstimatedDate')}>
                <View style={{flex: 1}}>
                  <Text style={styles.DSR_DateText}>
                    {formData.EstimatedDate
                      ? formatDisplayDate(formData.EstimatedDate)
                      : 'Select Estimated date'}
                  </Text>
                </View>
                <Icon name="calendar" size={20} color={P.primary} />
              </TouchableOpacity>
              {renderError('EstimatedDate')}

              {/* 3. Estimated Amount — read-only + auto-filled for Per Diem / Mileage */}
              {config.showEstimatedAmount && (
                <>
                  <Text style={styles.DSR_Label}>Estimated amount *</Text>
                  {config.amountEditable ? (
                    <>
                      <TextInput
                        style={styles.DSR_Input}
                        value={formatThousands(formData.EstimatedAmount)}
                        onChangeText={handleAmountChange}
                        keyboardType="numeric"
                        placeholder="Enter estimated amount"
                        placeholderTextColor={AppTokens.subtitleText}
                      />
                      {renderError('EstimatedAmount')}
                    </>
                  ) : (
                    <Text style={[styles.DSR_Input, styles.DSR_Disabled]}>
                      {formatThousands(formData.EstimatedAmount) || '0.00'}
                    </Text>
                  )}
                </>
              )}

              {/* 4. Currency */}
              {config.showCurrency && (
                <>
                  <Text style={styles.DSR_Label}>Currency *</Text>
                  {group === 'PERDIEM' || group === 'MILEAGE' ? (
                    <Text style={[styles.DSR_Input, styles.DSR_Disabled]}>
                      {formData.Currency || 'PKR'}
                    </Text>
                  ) : (
                    <>
                      <Dropdown
                        style={styles.DSR_Input}
                        data={currencyOptions}
                        labelField="label"
                        valueField="value"
                        placeholder="Select Currency"
                        value={formData.Currency}
                        onChange={handleCurrencyChange}
                        placeholderStyle={styles.DSR_DropdownPlaceholder}
                        selectedTextStyle={styles.DSR_DropdownSelectedText}
                        itemTextStyle={styles.DSR_DropdownItemText}
                        activeColor={P.tint}
                        containerStyle={[
                          styles.DSR_DropdownContainer,
                          {
                            marginTop: Platform.OS === 'ios' ? 5 : 2,
                            zIndex: 999,
                          },
                        ]}
                        itemContainerStyle={styles.DSR_DropdownItemContainer}
                        maxHeight={280}
                        dropdownPosition="auto"
                        search
                        searchPlaceholder="Search Currency"
                        inputSearchStyle={styles.DSR_DropdownSearchInput}
                        iconStyle={styles.DSR_DropdownIcon}
                        keyboardAvoiding={true}
                      />
                      {renderError('Currency')}
                    </>
                  )}
                </>
              )}

              {/* Exchange rate — only where currency is user-editable (STANDARD/AIRLINE);
    PERDIEM/MILEAGE are locked to PKR and have no meaningful conversion rate
    to show. Mirrors Amount in PKR: read-only, refreshed by the same effect. */}
              {group !== 'PERDIEM' && group !== 'MILEAGE' && (
                <>
                  <Text style={styles.DSR_Label}>Exchange rate</Text>
                  <Text style={[styles.DSR_Input, styles.DSR_Disabled]}>
                    {isCalculatingPKR
                      ? 'Calculating...'
                      : formatExchangeRate(formData.ExchangeRate) || '0.000'}
                  </Text>
                </>
              )}

              {/* 5. Amount in PKR — always read-only, populated via service */}
              <Text style={styles.DSR_Label}>Amount in PKR</Text>
              <Text style={[styles.DSR_Input, styles.DSR_Disabled]}>
                {isCalculatingPKR
                  ? 'Calculating...'
                  : formatThousands(formData.AmountInPKR) || '0.00'}
              </Text>

              {config.showMileage && (
                <>
                  <Text style={styles.DSR_Label}>Mileage *</Text>
                  <TextInput
                    style={styles.DSR_Input}
                    value={formatThousands(formData.Mileage)}
                    onChangeText={handleMileageChange}
                    keyboardType="numeric"
                    placeholder="Enter mileage"
                    placeholderTextColor={AppTokens.subtitleText}
                  />
                  {renderError('Mileage')}
                </>
              )}

              {config.showAirlineServiceClass && (
                <>
                  <Text style={styles.DSR_Label}>Airline Service Class *</Text>
                  <Dropdown
                    style={styles.DSR_Input}
                    data={AIRLINE_SERVICE_CLASS_OPTIONS}
                    labelField="label"
                    valueField="value"
                    placeholder="Select Service Class"
                    value={formData.AirlineServiceClass}
                    onChange={item =>
                      handleInputChange('AirlineServiceClass', item.value)
                    }
                    placeholderStyle={styles.DSR_DropdownPlaceholder}
                    selectedTextStyle={styles.DSR_DropdownSelectedText}
                    itemTextStyle={styles.DSR_DropdownItemText}
                    activeColor={P.tint}
                    containerStyle={[
                      styles.DSR_DropdownContainer,
                      {
                        marginTop: Platform.OS === 'ios' ? 5 : 2,
                        zIndex: 998,
                      },
                    ]}
                    itemContainerStyle={styles.DSR_DropdownItemContainer}
                    maxHeight={200}
                    dropdownPosition="top" // <-- forced instead of "auto"
                  />
                  {renderError('AirlineServiceClass')}
                </>
              )}

              {config.showPerDiemDates && (
                <>
                  <Text style={styles.DSR_Label}>Per Diem From Date *</Text>
                  <TouchableOpacity
                    style={styles.DSR_DateSelector}
                    onPress={() => setDateTimeField('PerDiemFromDate')}>
                    <View style={{flex: 1}}>
                      <Text style={styles.DSR_DateText}>
                        {formData.PerDiemFromDate
                          ? formatDisplayDateTime(formData.PerDiemFromDate)
                          : 'Select From Date/Time'}
                      </Text>
                    </View>
                    <Icon name="calendar" size={20} color={P.primary} />
                  </TouchableOpacity>
                  {renderError('PerDiemFromDate')}

                  <Text style={styles.DSR_Label}>Per Diem To Date *</Text>
                  <TouchableOpacity
                    style={styles.DSR_DateSelector}
                    onPress={() => setDateTimeField('PerDiemToDate')}>
                    <View style={{flex: 1}}>
                      <Text style={styles.DSR_DateText}>
                        {formData.PerDiemToDate
                          ? formatDisplayDateTime(formData.PerDiemToDate)
                          : 'Select To Date/Time'}
                      </Text>
                    </View>
                    <Icon name="calendar" size={20} color={P.primary} />
                  </TouchableOpacity>
                  {renderError('PerDiemToDate')}
                </>
              )}
            </KeyboardAwareScrollView>

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
        </Animated.View>
      )}

      {activeDateField && (
        <CalendarModal
          visible={!!activeDateField}
          initialDate={formData[activeDateField] || today}
          onDateSelected={handleDateChange}
          onClose={() => setActiveDateField(null)}
        />
      )}
      <DatePicker
        modal
        open={dateTimeField !== null}
        date={dateTimePickerInitialDate()}
        mode="datetime"
        onConfirm={handleDateTimeConfirm}
        onCancel={() => setDateTimeField(null)}
      />
      <AlertModal {...alertModalProps} />
    </ActionPaneContainer>
  );
};

export default TravelRequisitionLinesSaveRecord;
