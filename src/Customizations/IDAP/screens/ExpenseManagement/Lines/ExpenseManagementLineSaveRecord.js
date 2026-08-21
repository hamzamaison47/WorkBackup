/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
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
import DatePicker from 'react-native-date-picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import {translate as t} from '../../../../../store/utils/translate';

import {RetrieveExpenseCategory} from '../../../API/ExpenseManagement/Lines/RetrieveExpenseCategory';
import {GetCurrencyCode} from '../../../API/ExpenseManagement/Lines/GetCurrencyCode';
import {CreateExpenseManagementLine} from '../../../API/ExpenseManagement/Lines/CreateExpenseManagementLine';
import {UpdateExpenseManagementLine} from '../../../API/ExpenseManagement/Lines/UpdateExpenseManagementLine';
import {AmountInPKRCalculationExpense} from '../../../API/ExpenseManagement/Lines/AmountInPKRCalculationExpense';
import {GetEstimatedAmountForPerDiemExpense} from '../../../API/ExpenseManagement/Lines/GetEstimatedAmountForPerDiemExpense';
import {GetMileageAmountForExpense} from '../../../API/ExpenseManagement/Lines/GetMileageAmountForExpense';

import AlertModal from '../../../../../components/Alert/AlertModal';
import useAlertModal from '../../../../../hooks/useAlertModal';
import CalendarModal from '../../../../../components/Leaves/CalendarModal';
import CustomIndicator from '../../../../../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../../../../../components/ActionPaneContainer';
import SaveRecordButtons, {
  BUTTON_TYPES,
} from '../../../../../components/Buttons/SaveRecordButtons';
import {AppTokens} from '../../../../../components/AppComponentsDesign/Tokens';
import styles from '../../../../../styles/styles';
import useNotify from '../../../../../hooks/useNotify';
import usePalette from '../../../../../hooks/usePalette';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import useAppStyles from '../../../../../hooks/useAppStyles';

const ROUTE_LINES_LIST = 'ExpenseManagementLinesListPage';

// Group membership per CostType. Every category listed maps to a group;
// unlisted categories fall back to 'standard' (all fields editable).
const COST_TYPE_GROUPS = {
  Bus: 'standard',
  'Car Fuel': 'standard',
  'Car Mileage': 'mileage',
  'Flight International': 'standard',
  'Flight Local': 'standard',
  'Hotel INT G-6': 'standard',
  'Hotel Loc G-6': 'standard',
  'Other Expenses': 'standard',
  'Per Diem G-6': 'perDiem',
  'Per Diem INT G-6': 'perDiem',
  Rail: 'standard',
  'Taxi / Rickshaw': 'standard',
  'Toll Tax': 'standard',
  'Visa Fee': 'standard',
};

// standard: Bus, Car Fuel, Flight Intl/Local, Hotel INT/Loc, Other Expenses,
//           Rail, Taxi/Rickshaw, Toll Tax, Visa Fee — all fields editable.
// mileage:  Car Mileage — ClaimedAmount is derived (disabled), Mileage +
//           Departure/Arrival are editable.
// perDiem:  Per Diem G-* — only DateFrom/DateTo apply; ClaimedAmount and
//           Currency are both derived (disabled).
const GROUP_CONFIG = {
  standard: {
    fields: [
      'ClaimedAmount',
      'DepartureLocation',
      'DepartureDateTime',
      'ArrivalLocation',
      'ArrivalDateTime',
    ],
    required: ['ClaimedAmount'],
    showCurrency: true,
  },
  mileage: {
    fields: [
      'DepartureLocation',
      'DepartureDateTime',
      'ArrivalLocation',
      'ArrivalDateTime',
      'Mileage',
    ],
    required: ['Mileage'],
    showCurrency: false,
  },
  perDiem: {
    fields: ['DateFrom', 'DateTo'],
    required: ['DateFrom', 'DateTo'],
    showCurrency: false,
  },
};

const toLocalDateTimeString = date => {
  const pad = n => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
      date.getSeconds(),
    )}`
  );
};

// Module-level stable default — an inline `lineData = {}` default would
// create a NEW object reference every render, which — depended on inside
// useFocusEffect — caused an infinite update loop in create mode.
const EMPTY_LINE_DATA = {};

const ExpenseManagementLineSaveRecord = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const P = usePalette();
  const {notifySuccess, notifyError} = useNotify('Expense Line');
  const styles = useAppStyles();

  const reduxUserData = useSelector(state => state.user.userData);
  const {selectedLegalEntity, defaultLegalEntity} = useSelector(
    state => state.company,
  );

  const {
    mode = 'create',
    lineData = EMPTY_LINE_DATA,
    headerRecId,
    expenseNumber,
    approvalStatus,
    personnelNumber,
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
  const effectivePersonnelNumber = personnelNumber || effectiveEmployeeId;
  const effectiveLegalEntity =
    legalEntity || selectedLegalEntity || defaultLegalEntity || '';

  const today = new Date().toISOString().split('T')[0] + 'T00:00:00';

  // Defensively coerce dates that may arrive as JS Date instances (from
  // FindExpenseManagementLines) into ISO strings — same reasoning as
  // TravelRequisitionLinesSaveRecord's toDateString.
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
    LineRecId: isEdit ? lineData.LineRecId : '',
    CostType: isEdit ? lineData.CostType || '' : '',
    ExchangeCode: isEdit ? lineData.ExchangeCode || 'PKR' : 'PKR',
    Transaction: isEdit ? toDateString(lineData.Transaction) || today : today,
    ClaimedAmount: isEdit
      ? lineData.ClaimedAmount != null
        ? String(lineData.ClaimedAmount)
        : ''
      : '',
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
    DepartureLocation: isEdit ? lineData.DepartureLocation || '' : '',
    DepartureDateTime: isEdit ? toDateString(lineData.DepartureDateTime) : '',
    ArrivalLocation: isEdit ? lineData.ArrivalLocation || '' : '',
    ArrivalDateTime: isEdit ? toDateString(lineData.ArrivalDateTime) : '',
    Mileage: isEdit
      ? lineData.Mileage != null
        ? String(lineData.Mileage)
        : ''
      : '',
    DateFrom: isEdit ? toDateString(lineData.DateFrom) : '',
    DateTo: isEdit ? toDateString(lineData.DateTo) : '',
  });

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [currencyOptions, setCurrencyOptions] = useState([]);
  const [formData, setFormData] = useState(() => createInitialFormData());
  const [errors, setErrors] = useState({});
  const [calendarField, setCalendarField] = useState(null);
  const [dateTimeField, setDateTimeField] = useState(null);
  const {showSuccess, showError, showWarning, hide, alertModalProps} =
    useAlertModal();
  const [processingButton, setProcessingButton] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculatingPKR, setIsCalculatingPKR] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const pkrDebounceRef = useRef(null);
  const perDiemDebounceRef = useRef(null);
  const mileageDebounceRef = useRef(null);

  const normalizeKey = str => (str || '').trim().toLowerCase();

  // Grade-agnostic group resolution. Per Diem categories carry a trailing
  // HR-grade suffix (G-4, G-6, G-7, ...) that varies by employee/environment,
  // so we match on prefix instead of hardcoding every grade tier.
  const getGroupForCostType = costType => {
    const normalized = normalizeKey(costType);

    if (!normalized) return 'standard';
    if (normalized.startsWith('per diem')) return 'perDiem';
    if (normalized === 'car mileage') return 'mileage';

    return 'standard';
  };

  const currentGroup = getGroupForCostType(formData.CostType);
  const groupFields = GROUP_CONFIG[currentGroup].fields;
  const groupRequired = GROUP_CONFIG[currentGroup].required;
  const showCurrency = GROUP_CONFIG[currentGroup].showCurrency;
  const isTransactionEditable = currentGroup !== 'perDiem';

  const isFieldVisible = field => groupFields.includes(field);

  // ClaimedAmount is only ever editable for the 'standard' group — mileage
  // and perDiem both derive it via the calc services below.
  const isClaimedAmountEditable = currentGroup === 'standard';
  const hasCategory = !!formData.CostType;

  const clearAllStates = useCallback(
    (resetForm = false) => {
      setCategoryOptions([]);
      setCurrencyOptions([]);
      if (resetForm) setFormData(createInitialFormData());
      setErrors({});
      setCalendarField(null);
      setDateTimeField(null);
      hide();
      setProcessingButton('');
      setIsCalculatingPKR(false);
      setDataFetched(false);

      if (pkrDebounceRef.current) clearTimeout(pkrDebounceRef.current);
      if (perDiemDebounceRef.current) clearTimeout(perDiemDebounceRef.current);
      if (mileageDebounceRef.current) clearTimeout(mileageDebounceRef.current);
    },
    [hide],
  );

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

  // ── Snap Transaction date back to Departure date if it's later ──────
  // Mirrors TrvExpTrans_SLD_DepDateTime_OnModified on the AX side: the
  // transaction can't be logged after the trip's departure. Only fires
  // when a DepartureDateTime is actually set for this group (standard/
  // mileage) — perDiem has no DepartureDateTime field.
  useEffect(() => {
    if (!isFieldVisible('DepartureDateTime')) return;
    if (isLoading) return;
    if (!formData.DepartureDateTime || !formData.Transaction) return;

    const departure = parseLocalDateTime(formData.DepartureDateTime);
    const transaction = parseLocalDateTime(formData.Transaction);
    if (!departure || !transaction) return;

    const departureDateOnly = new Date(
      departure.getFullYear(),
      departure.getMonth(),
      departure.getDate(),
    );
    const transactionDateOnly = new Date(
      transaction.getFullYear(),
      transaction.getMonth(),
      transaction.getDate(),
    );

    if (transactionDateOnly.getTime() > departureDateOnly.getTime()) {
      setFormData(prev => ({
        ...prev,
        Transaction: formatToISOWithTime(formData.DepartureDateTime),
      }));
      clearFieldError('Transaction');
    }
  }, [
    formData.DepartureDateTime,
    formData.Transaction,
    currentGroup,
    isLoading,
  ]);

  const goBack = useCallback(() => {
    clearAllStates(true);
    navigation.navigate(ROUTE_LINES_LIST, {
      headerRecId,
      expenseNumber,
      approvalStatus,
      personnelNumber: effectivePersonnelNumber,
      employeeId: effectiveEmployeeId,
      employeeName: effectiveEmployeeName,
      WorkerRecId: effectiveWorkerRecId,
      legalEntity: effectiveLegalEntity,
      userData: effectiveUserData,
      cameFrom: originalCameFrom || cameFrom || 'DrawerNavigator',
      forceShowAddButton: true,
    });
  }, [
    clearAllStates,
    navigation,
    headerRecId,
    expenseNumber,
    approvalStatus,
    effectivePersonnelNumber,
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
      const sub = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => sub.remove();
    }, [goBack]),
  );

  useFocusEffect(
    useCallback(() => {
      if (typeof scrollViewRef.current?.scrollToPosition === 'function') {
        scrollViewRef.current.scrollToPosition(0, 0, false);
      }
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

  // Sync formData on every focus — edit mode pulls fresh values from
  // lineData, create mode always starts blank.
  useFocusEffect(
    useCallback(() => {
      setFormData(createInitialFormData());
      setErrors({});
    }, [isEdit, lineData]),
  );

  const handleRefresh = useCallback(async () => {
    if (isEdit) return;
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

  // ── Auto-calc Amount in PKR for the standard group ──────────────────
  // Runs in BOTH create and edit mode — any change to ClaimedAmount,
  // ExchangeCode, or Transaction re-derives the PKR conversion.
  useEffect(() => {
    if (currentGroup !== 'standard') return;
    if (isLoading) return;

    const amountNum = parseFloat(formData.ClaimedAmount);
    if (!formData.ExchangeCode || isNaN(amountNum)) return;

    if (pkrDebounceRef.current) clearTimeout(pkrDebounceRef.current);
    pkrDebounceRef.current = setTimeout(async () => {
      setIsCalculatingPKR(true);
      try {
        const {amountInPKR, exchangeRate} = await AmountInPKRCalculationExpense(
          {
            ClaimedAmount: amountNum,
            ExchangeCode: formData.ExchangeCode,
            Transaction: formData.Transaction,
          },
        );
        setFormData(prev => ({
          ...prev,
          AmountInPKR: String(amountInPKR),
          ExchangeRate: String(exchangeRate),
        }));
      } catch (error) {
        console.error('Expense PKR calculation error:', error);
      } finally {
        setIsCalculatingPKR(false);
      }
    }, 500);

    return () => clearTimeout(pkrDebounceRef.current);
  }, [
    currentGroup,
    formData.ClaimedAmount,
    formData.ExchangeCode,
    formData.Transaction,
    isLoading,
  ]);

  // ── Auto-calc Claimed Amount + Amount in PKR for the perDiem group ──
  // Runs in BOTH create and edit mode — any change to DateFrom/DateTo (the
  // only editable fields in this group) re-derives the amount.
  useEffect(() => {
    if (currentGroup !== 'perDiem') return;
    if (isLoading) return;
    if (!formData.CostType || !formData.DateFrom || !formData.DateTo) return;

    if (perDiemDebounceRef.current) clearTimeout(perDiemDebounceRef.current);
    perDiemDebounceRef.current = setTimeout(async () => {
      setIsCalculatingPKR(true);
      try {
        const result = await GetEstimatedAmountForPerDiemExpense({
          CostType: formData.CostType,
          DateFrom: formData.DateFrom,
          DateTo: formData.DateTo,
          PersonnelNumber: effectivePersonnelNumber,
          Transaction: formData.Transaction,
        });
        setFormData(prev => ({
          ...prev,
          ExchangeCode: result.exchangeCode || 'PKR',
          ClaimedAmount: String(result.claimedAmount),
          AmountInPKR: String(result.amountInPKR),
        }));
      } catch (error) {
        console.error('Expense per diem calculation error:', error);
      } finally {
        setIsCalculatingPKR(false);
      }
    }, 500);

    return () => clearTimeout(perDiemDebounceRef.current);
  }, [
    currentGroup,
    formData.CostType,
    formData.DateFrom,
    formData.DateTo,
    formData.Transaction,
    effectivePersonnelNumber,
    isLoading,
  ]);

  // ── Auto-calc Claimed Amount + Amount in PKR for the mileage group ──
  // Runs in BOTH create and edit mode — any change to Mileage (the only
  // editable field in this group) re-derives the amount.
  useEffect(() => {
    if (currentGroup !== 'mileage') return;
    if (isLoading) return;

    const mileageNum = parseFloat(formData.Mileage);
    if (!formData.CostType || isNaN(mileageNum)) return;

    if (mileageDebounceRef.current) clearTimeout(mileageDebounceRef.current);
    mileageDebounceRef.current = setTimeout(async () => {
      setIsCalculatingPKR(true);
      try {
        const result = await GetMileageAmountForExpense({
          CostType: formData.CostType,
          Mileage: mileageNum,
          PersonnelNumber: effectivePersonnelNumber,
          Transaction: formData.Transaction,
        });
        setFormData(prev => ({
          ...prev,
          ClaimedAmount: String(result.claimedAmount),
          AmountInPKR: String(result.amountInPKR),
        }));
      } catch (error) {
        console.error('Expense mileage calculation error:', error);
      } finally {
        setIsCalculatingPKR(false);
      }
    }, 500);

    return () => clearTimeout(mileageDebounceRef.current);
  }, [
    currentGroup,
    formData.CostType,
    formData.Mileage,
    formData.Transaction,
    effectivePersonnelNumber,
    isLoading,
  ]);

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

  const stripThousands = value => value.replace(/,/g, '');

  const handleClaimedAmountChange = rawInput => {
    const unformatted = stripThousands(rawInput);
    let cleaned = unformatted.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');
    handleInputChange('ClaimedAmount', cleaned);
  };

  const handleMileageChange = rawInput => {
    const unformatted = stripThousands(rawInput);
    let cleaned = unformatted.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');
    handleInputChange('Mileage', cleaned);
  };

  // Category is locked once created (backend update() technically accepts a
  // new CostType, but changing it mid-edit re-triggers the whole category
  // cascade and isn't part of this spec).
  // Category can now be changed in both create and edit mode. Changing it
  // still re-triggers the full group cascade (clearing fields that don't
  // belong to the new group), same as create — this is now expected in edit
  // mode too rather than blocked.
  // const handleCostTypeChange = item => {
  //   const nextGroup = getGroupForCostType(item.value);
  //   const nextFields = GROUP_CONFIG[nextGroup].fields;
  //   const nextShowCurrency = GROUP_CONFIG[nextGroup].showCurrency;
  //   const allGroupFields = [
  //     'ClaimedAmount',
  //     'DepartureLocation',
  //     'DepartureDateTime',
  //     'ArrivalLocation',
  //     'ArrivalDateTime',
  //     'Mileage',
  //     'DateFrom',
  //     'DateTo',
  //   ];

  //   setFormData(prev => {
  //     const next = {
  //       ...prev,
  //       CostType: item.value,
  //       AmountInPKR: '',
  //       ExchangeRate: '',
  //     };
  //     allGroupFields.forEach(field => {
  //       if (!nextFields.includes(field)) next[field] = '';
  //     });
  //     if (!nextShowCurrency) next.ExchangeCode = 'PKR';
  //     if (nextGroup === 'perDiem') next.Transaction = today;
  //     return next;
  //   });

  //   setErrors(prev => {
  //     const next = {...prev};
  //     delete next.CostType;
  //     delete next.Transaction;
  //     allGroupFields.forEach(field => {
  //       if (!nextFields.includes(field)) delete next[field];
  //     });
  //     return next;
  //   });
  // };

  const handleCostTypeChange = item => {
    const nextGroup = getGroupForCostType(item.value);
    const nextShowCurrency = GROUP_CONFIG[nextGroup].showCurrency;

    setFormData(prev => ({
      ...prev,
      CostType: item.value,
      ClaimedAmount: '',
      AmountInPKR: '',
      ExchangeRate: '',
      DepartureLocation: '',
      DepartureDateTime: '',
      ArrivalLocation: '',
      ArrivalDateTime: '',
      Mileage: '',
      DateFrom: '',
      DateTo: '',
      ExchangeCode: nextShowCurrency ? prev.ExchangeCode || 'PKR' : 'PKR',
      Transaction: nextGroup === 'perDiem' ? today : prev.Transaction,
    }));

    setErrors({});
  };

  const handleCurrencyChange = item => {
    setFormData(prev => ({...prev, ExchangeCode: item.value}));
    clearFieldError('ExchangeCode');
  };

  const formatDisplayDate = date => {
    const d = parseLocalDateTime(date);
    if (!d) return '';
    const day = d.getDate();
    const month = d.getMonth() + 1;
    return `${day}/${month}/${d.getFullYear()}`;
  };

  const formatDisplayDateTime = date => {
    const d = parseLocalDateTime(date);
    if (!d) return '';
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const mins = String(d.getMinutes()).padStart(2, '0');
    let hours = d.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${day}/${month}/${d.getFullYear()} ${hours}:${mins} ${ampm}`;
  };

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
    )}T00:00:00`;
  };

  const formatExchangeRate = value => {
    if (value === '' || value === null || value === undefined) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num.toFixed(3);
  };

  const handleCalendarConfirm = date => {
    const field = calendarField;
    setCalendarField(null);
    if (!field) return;
    setFormData(prev => ({...prev, [field]: formatToISOWithTime(date)}));
    clearFieldError(field);
  };

  const calendarInitialDate = () => {
    const current = calendarField ? formData[calendarField] : '';
    return current || undefined;
  };

  // const handleDateTimeConfirm = date => {
  //   const field = dateTimeField;
  //   setDateTimeField(null);
  //   if (!field) return;
  //   setFormData(prev => ({...prev, [field]: toLocalDateTimeString(date)}));
  //   clearFieldError(field);
  // };

  const FUTURE_MSG = 'Future date is not allowed';

  const FUTURE_BLOCKED_FIELDS = {
    DateFrom: 'Per diem from date',
    DepartureDateTime: 'Departure date and time',
    ArrivalDateTime: 'Arrival date and time',
  };

  const handleDateTimeConfirm = date => {
    const field = dateTimeField;
    setDateTimeField(null);
    if (!field) return;

    const value = toLocalDateTimeString(date);

    if (FUTURE_BLOCKED_FIELDS[field] && isFutureDate(value)) {
      setErrors(prev => ({...prev, [field]: FUTURE_MSG}));
      showWarning(`${FUTURE_BLOCKED_FIELDS[field]} — ${FUTURE_MSG}`);
      return; // don't write the value
    }

    setFormData(prev => ({...prev, [field]: value}));
    clearFieldError(field);
  };

  const pickerInitialDate = () => {
    const current = dateTimeField ? formData[dateTimeField] : '';
    const d = parseLocalDateTime(current);
    return d || new Date();
  };

  const FIELD_LABELS = {
    ClaimedAmount: 'Claimed amount',
    Mileage: 'Mileage',
    DateFrom: 'Per diem from date',
    DateTo: 'Per diem to date',
  };

  const validate = () => {
    const nextErrors = {};
    const missing = [];

    if (!formData.CostType) {
      nextErrors.CostType = 'Expense category is required';
      missing.push('Expense category');
    }

    if (isFieldVisible('ClaimedAmount') && isClaimedAmountEditable) {
      const raw = formData.ClaimedAmount;
      if (raw === '' || raw === null || raw === undefined) {
        nextErrors.ClaimedAmount = 'Claimed amount is required';
        missing.push('Claimed amount');
      }
    }

    groupRequired.forEach(field => {
      if (field === 'ClaimedAmount') return; // already handled above
      const raw = formData[field];
      if (raw === '' || raw === null || raw === undefined) {
        nextErrors[field] = `${FIELD_LABELS[field] || field} is required`;
        missing.push(FIELD_LABELS[field] || field);
      }
    });

    if (
      isFieldVisible('DateFrom') &&
      isFieldVisible('DateTo') &&
      formData.DateFrom &&
      formData.DateTo &&
      !nextErrors.DateFrom &&
      !nextErrors.DateTo
    ) {
      const from = parseLocalDateTime(formData.DateFrom);
      const to = parseLocalDateTime(formData.DateTo);
      if (from && to && to.getTime() < from.getTime()) {
        nextErrors.DateTo = 'Per diem to date cannot be earlier than from date';
        missing.push('Valid per diem date range');
      }
    }

    setErrors(nextErrors);
    return {valid: Object.keys(nextErrors).length === 0, missing};
  };

  // Live input display — used ONLY inside editable TextInputs (ClaimedAmount,
  // Mileage). Must NOT force decimals or it fights the user while typing.
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

  // Read-only display — used for disabled/derived text (Claimed Amount when
  // disabled, Transaction Amount mirror, Amount in PKR). Safe to force 2
  // decimals here since nothing is being typed into these.
  const formatDisplayAmount = value => {
    if (value === '' || value === null || value === undefined) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    const fixed = num.toFixed(2);
    const [intPart, decPart] = fixed.split('.');
    const sign = intPart.startsWith('-') ? '-' : '';
    const digitsOnly = intPart.replace('-', '');
    const formattedInt = digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${sign}${formattedInt}.${decPart}`;
  };

  const handleSave = async actionType => {
    if (processingButton) return;
    if (isCalculatingPKR) {
      showWarning('Please wait for the amount calculation to finish.');
      return;
    }

    const {valid, missing} = validate();
    if (!valid) {
      showWarning(
        missing.length > 0
          ? `Please fill the following required fields:\n${missing.join('\n')}`
          : 'Please correct the highlighted fields before saving.',
      );
      return;
    }

    setProcessingButton(actionType);
    setIsProcessing(true);

    try {
      const sharedFields = {
        CostType: formData.CostType,
        Transaction: formData.Transaction,
        ClaimedAmount: isFieldVisible('ClaimedAmount')
          ? formData.ClaimedAmount
          : '',
        // Transaction amount — mirrors Claimed Amount 1:1, sent to the backend as
        // AmountCurr on both create and update.
        AmountCurr: formData.ClaimedAmount,
        ExchangeCode: formData.ExchangeCode,
        DateFrom: isFieldVisible('DateFrom') ? formData.DateFrom : '',
        DepartureLocation: isFieldVisible('DepartureLocation')
          ? formData.DepartureLocation
          : '',
        DepartureDateTime: isFieldVisible('DepartureDateTime')
          ? formData.DepartureDateTime
          : '',
        ArrivalLocation: isFieldVisible('ArrivalLocation')
          ? formData.ArrivalLocation
          : '',
        ArrivalDateTime: isFieldVisible('ArrivalDateTime')
          ? formData.ArrivalDateTime
          : '',
        DateTo: isFieldVisible('DateTo') ? formData.DateTo : '',
        Mileage: isFieldVisible('Mileage') ? formData.Mileage : '',
      };

      let response;

      if (isEdit) {
        response = await UpdateExpenseManagementLine({
          LineRecId: formData.LineRecId,
          HeaderRecId: headerRecId,
          ...sharedFields,
        });
      } else {
        response = await CreateExpenseManagementLine({
          headerRecId,
          ...sharedFields,
        });
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
          hide();
          clearAllStates(true);
          navigation.navigate(ROUTE_LINES_LIST, {
            headerRecId,
            expenseNumber,
            approvalStatus,
            personnelNumber: effectivePersonnelNumber,
            employeeId: effectiveEmployeeId,
            employeeName: effectiveEmployeeName,
            WorkerRecId: effectiveWorkerRecId,
            legalEntity: effectiveLegalEntity,
            userData: effectiveUserData,
            cameFrom: originalCameFrom || cameFrom || 'DrawerNavigator',
            forceShowAddButton: true,
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
      console.error('Error saving expense line:', error);
      notifyError('Failed to save record. Please try again.');
      showError('Failed to save record. Please try again.');
    } finally {
      setProcessingButton('');
      setIsProcessing(false);
    }
  };

  const parseLocalDateTime = str => {
    if (!str) return null;
    const [datePart, rawTimePart = '00:00:00'] = str.split('T');
    // Strip trailing 'Z' and any milliseconds (".123Z" / "Z") defensively —
    // guards against a Date.toISOString() string leaking through from
    // somewhere upstream instead of the expected local "HH:mm:ss" format.
    const timePart = rawTimePart.replace(/\.\d+/, '').replace(/Z$/, '');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours = 0, minutes = 0, seconds = 0] = timePart
      .split(':')
      .map(Number);
    const d = new Date(year, month - 1, day, hours, minutes, seconds);
    return isNaN(d.getTime()) ? null : d;
  };

  // Day-granularity future check. Date fields carry a time component
  // (T00:00:00 for calendar picks, real clock time for the DatePicker),
  // so both sides are normalized to midnight — otherwise picking "today"
  // via the datetime picker would fail once the current time passes it.
  const isFutureDate = value => {
    const d = parseLocalDateTime(value);
    if (!d) return false;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return d.getTime() > startOfToday.getTime();
  };

  const renderError = field =>
    errors[field] ? (
      <Text style={{color: AppTokens.red, fontSize: 12, marginTop: 4}}>
        {errors[field]}
      </Text>
    ) : null;

  return (
    <ActionPaneContainer
      pageTitle={isEdit ? 'Edit Expense Line' : 'New Expense line'}
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
              nestedScrollEnabled={true}
              enableOnAndroid={true}
              enableAutomaticScroll={true}
              extraScrollHeight={Platform.OS === 'android' ? 100 : 20}
              extraHeight={150}
              keyboardOpeningTime={0}>
              {/* Expense Category — now editable in both create and edit mode */}
              <Text style={styles.DSR_Label}>Expense category *</Text>
              <Dropdown
                style={styles.DSR_Input}
                data={categoryOptions}
                labelField="label"
                valueField="value"
                placeholder={
                  categoryOptions.length === 0
                    ? 'No expense categories available'
                    : 'Select Expense category'
                }
                value={formData.CostType}
                onChange={handleCostTypeChange}
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
              {renderError('CostType')}

              {/* Transaction date — editable except for Per Diem, where it's forced to today */}
              <Text style={styles.DSR_Label}>Transaction date</Text>
              {isTransactionEditable ? (
                <>
                  <TouchableOpacity
                    style={styles.DSR_DateSelector}
                    onPress={() => setCalendarField('Transaction')}>
                    <View style={{flex: 1}}>
                      <Text style={styles.DSR_DateText}>
                        {formData.Transaction
                          ? formatDisplayDate(formData.Transaction)
                          : 'Select Transaction date'}
                      </Text>
                    </View>
                    <Icon name="calendar" size={20} color={P.primary} />
                  </TouchableOpacity>
                  {renderError('Transaction')}
                </>
              ) : (
                <Text style={[styles.DSR_Input, styles.DSR_Disabled]}>
                  {formData.Transaction
                    ? formatDisplayDate(formData.Transaction)
                    : formatDisplayDate(today)}
                </Text>
              )}

              {/* Claimed Amount — editable only for the standard group;
                  derived + read-only for mileage/perDiem via the calc services */}
              {isFieldVisible('ClaimedAmount') && (
                <>
                  <Text style={styles.DSR_Label}>Claimed amount *</Text>
                  {isClaimedAmountEditable ? (
                    <>
                      <TextInput
                        style={styles.DSR_Input}
                        value={formatThousands(formData.ClaimedAmount)}
                        onChangeText={handleClaimedAmountChange}
                        keyboardType="numeric"
                        placeholder="Enter claimed amount"
                        placeholderTextColor={AppTokens.subtitleText}
                      />
                      {renderError('ClaimedAmount')}
                    </>
                  ) : (
                    <Text style={[styles.DSR_Input, styles.DSR_Disabled]}>
                      {formatDisplayAmount(formData.ClaimedAmount) || '0.00'}
                    </Text>
                  )}
                </>
              )}

              {/* Mileage group derives ClaimedAmount too — same disabled display */}
              {currentGroup === 'mileage' &&
                !isFieldVisible('ClaimedAmount') && (
                  <>
                    <Text style={styles.DSR_Label}>Claimed amount</Text>
                    <Text style={[styles.DSR_Input, styles.DSR_Disabled]}>
                      {formatDisplayAmount(formData.ClaimedAmount) || '0.00'}
                    </Text>
                  </>
                )}

              {/* perDiem group derives ClaimedAmount too — same disabled display */}
              {currentGroup === 'perDiem' && (
                <>
                  <Text style={styles.DSR_Label}>Claimed amount</Text>
                  <Text style={[styles.DSR_Input, styles.DSR_Disabled]}>
                    {formatDisplayAmount(formData.ClaimedAmount) || '0.00'}
                  </Text>
                </>
              )}

              {/* Transaction amount — always-visible, always-disabled mirror of Claimed
                Amount. Purely a display duplicate; does not participate in validation
                or get sent to the backend separately (there is no TransactionAmount
                field on DFExpenseManagementLinesContract). Hidden for perDiem — that
                group has no standalone "transaction amount" concept, only the derived
               per-diem Claimed Amount shown above. */}
              {currentGroup !== 'perDiem' && (
                <>
                  <Text style={styles.DSR_Label}>Transaction amount</Text>
                  <Text style={[styles.DSR_Input, styles.DSR_Disabled]}>
                    {formatDisplayAmount(formData.ClaimedAmount) || '0.00'}
                  </Text>
                </>
              )}

              {/* Mileage — Car Mileage only, editable, triggers auto-calc */}
              {isFieldVisible('Mileage') && (
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

              {/* Currency — locked to PKR for mileage/perDiem; editable otherwise */}
              <Text style={styles.DSR_Label}>Currency</Text>
              {showCurrency ? (
                <Dropdown
                  style={styles.DSR_Input}
                  data={currencyOptions}
                  labelField="label"
                  valueField="value"
                  placeholder={
                    currencyOptions.length === 0
                      ? 'No currencies available'
                      : 'Select Currency'
                  }
                  value={formData.ExchangeCode}
                  onChange={handleCurrencyChange}
                  placeholderStyle={styles.DSR_DropdownPlaceholder}
                  selectedTextStyle={styles.DSR_DropdownSelectedText}
                  itemTextStyle={styles.DSR_DropdownItemText}
                  activeColor={P.tint}
                  containerStyle={[
                    styles.DSR_DropdownContainer,
                    {marginTop: Platform.OS === 'ios' ? 5 : 2, zIndex: 999},
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
              ) : (
                <Text style={[styles.DSR_Input, styles.DSR_Disabled]}>
                  {formData.ExchangeCode || 'PKR'}
                </Text>
              )}
              {renderError('ExchangeCode')}

              {/* Exchange rate — standard group only, mirrors Amount in PKR:
                  always read-only, refreshed by the same PKR calc effect */}
              {currentGroup === 'standard' && (
                <>
                  <Text style={styles.DSR_Label}>Exchange rate</Text>
                  <Text style={[styles.DSR_Input, styles.DSR_Disabled]}>
                    {isCalculatingPKR
                      ? 'Calculating...'
                      : formatExchangeRate(formData.ExchangeRate) || '0.000'}
                  </Text>
                </>
              )}

              {/* Amount in PKR — always read-only, populated by whichever
                  calc service applies to the current group */}
              <Text style={styles.DSR_Label}>Amount in PKR</Text>
              <Text style={[styles.DSR_Input, styles.DSR_Disabled]}>
                {isCalculatingPKR
                  ? 'Calculating...'
                  : formatDisplayAmount(formData.AmountInPKR) || '0.00'}
              </Text>

              {/* Departure Location — editable */}
              {isFieldVisible('DepartureLocation') && (
                <>
                  <Text style={styles.DSR_Label}>Departure location</Text>
                  <TextInput
                    style={styles.DSR_Input}
                    value={formData.DepartureLocation}
                    onChangeText={value =>
                      handleInputChange('DepartureLocation', value)
                    }
                    placeholder="Enter departure location"
                    placeholderTextColor={AppTokens.subtitleText}
                  />
                  {renderError('DepartureLocation')}
                </>
              )}

              {/* Per Diem From — editable, triggers auto-calc */}
              {isFieldVisible('DateFrom') && (
                <>
                  <Text style={styles.DSR_Label}>
                    Per diem from date/time *
                  </Text>
                  <TouchableOpacity
                    style={styles.DSR_DateSelector}
                    disabled={!hasCategory}
                    onPress={() => setDateTimeField('DateFrom')}>
                    <View style={{flex: 1}}>
                      <Text style={styles.DSR_DateText}>
                        {formData.DateFrom
                          ? formatDisplayDateTime(formData.DateFrom)
                          : 'Select Per Diem From Date/Time'}
                      </Text>
                    </View>
                    <Icon name="calendar" size={20} color={P.primary} />
                  </TouchableOpacity>
                  {renderError('DateFrom')}
                </>
              )}

              {isFieldVisible('DateTo') && (
                <>
                  <Text style={styles.DSR_Label}>Per diem to date/time *</Text>
                  <TouchableOpacity
                    style={styles.DSR_DateSelector}
                    disabled={!hasCategory}
                    onPress={() => setDateTimeField('DateTo')}>
                    <View style={{flex: 1}}>
                      <Text style={styles.DSR_DateText}>
                        {formData.DateTo
                          ? formatDisplayDateTime(formData.DateTo)
                          : 'Select Per Diem To Date/Time'}
                      </Text>
                    </View>
                    <Icon name="calendar" size={20} color={P.primary} />
                  </TouchableOpacity>
                  {renderError('DateTo')}
                </>
              )}

              {/* Departure Date/Time — editable */}
              {isFieldVisible('DepartureDateTime') && (
                <>
                  <Text style={styles.DSR_Label}>Departure date and time</Text>
                  <TouchableOpacity
                    style={styles.DSR_DateSelector}
                    disabled={!hasCategory}
                    onPress={() => setDateTimeField('DepartureDateTime')}>
                    <View style={{flex: 1}}>
                      <Text style={styles.DSR_DateText}>
                        {formData.DepartureDateTime
                          ? formatDisplayDateTime(formData.DepartureDateTime)
                          : 'Select Departure Date/Time'}
                      </Text>
                    </View>
                    <Icon name="calendar" size={20} color={P.primary} />
                  </TouchableOpacity>
                  {renderError('DepartureDateTime')}
                </>
              )}

              {/* Arrival Location — editable */}
              {isFieldVisible('ArrivalLocation') && (
                <>
                  <Text style={styles.DSR_Label}>Arrival location</Text>
                  <TextInput
                    style={styles.DSR_Input}
                    value={formData.ArrivalLocation}
                    onChangeText={value =>
                      handleInputChange('ArrivalLocation', value)
                    }
                    placeholder="Enter arrival location"
                    placeholderTextColor={AppTokens.subtitleText}
                  />
                  {renderError('ArrivalLocation')}
                </>
              )}

              {/* Arrival Date/Time — editable */}
              {isFieldVisible('ArrivalDateTime') && (
                <>
                  <Text style={styles.DSR_Label}>Arrival date and time</Text>
                  <TouchableOpacity
                    style={styles.DSR_DateSelector}
                    disabled={!hasCategory}
                    onPress={() => setDateTimeField('ArrivalDateTime')}>
                    <View style={{flex: 1}}>
                      <Text style={styles.DSR_DateText}>
                        {formData.ArrivalDateTime
                          ? formatDisplayDateTime(formData.ArrivalDateTime)
                          : 'Select Arrival Date/Time'}
                      </Text>
                    </View>
                    <Icon name="calendar" size={20} color={P.primary} />
                  </TouchableOpacity>
                  {renderError('ArrivalDateTime')}
                </>
              )}
            </KeyboardAwareScrollView>

            <SaveRecordButtons
              mode={isEdit ? 'edit' : 'create'}
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

      {calendarField && (
        <CalendarModal
          visible={calendarField !== null}
          initialDate={calendarInitialDate()}
          onDateSelected={handleCalendarConfirm}
          onClose={() => setCalendarField(null)}
        />
      )}

      <DatePicker
        modal
        open={dateTimeField !== null}
        date={pickerInitialDate()}
        mode="datetime"
        onConfirm={handleDateTimeConfirm}
        onCancel={() => setDateTimeField(null)}
      />

      <AlertModal {...alertModalProps} />
    </ActionPaneContainer>
  );
};

export default ExpenseManagementLineSaveRecord;
