/* eslint-disable curly */
/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useCallback} from 'react';
import {
  ScrollView,
  Image,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  useWindowDimensions,
  FlatList,
  Dimensions,
  BackHandler,
  Modal,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useSelector, useDispatch} from 'react-redux';
import moment from 'moment';

import {setSelectedLegalEntity} from '../store/slices/companySlice';
import {screenMapping, iconMapping} from '../Controller/screenMapping';

import {ProfilePicture} from '../API/PersonalInformation/ProfilePicture/ProfilePicture';
import {getRegisterDetailsByDate} from '../API/Attendance/getRegisterDetailsByDate';

import CustomIndicator from '../components/CustomIndicator/CustomIndicator';
import ActionPaneContainer from '../components/ActionPaneContainer';
import LogoutAlertModal from '../components/Alert/LogoutAlertModal';
import DFCalendar from '../components/Attendance/DFCalendar';

// Get initial screen dimensions
const {width: initialScreenWidth, height: initialScreenHeight} =
  Dimensions.get('window');

// Responsive utility functions
const getResponsiveSize = (baseSize, screenWidth) => {
  const scale = screenWidth / 375; // Base width (iPhone X)
  const newSize = baseSize * scale;
  return Math.max(Math.min(newSize, baseSize * 1.5), baseSize * 0.8);
};

const getResponsivePadding = (basePadding, screenWidth) => {
  if (screenWidth < 360) return basePadding * 0.7; // Small phones
  if (screenWidth > 414) return basePadding * 1.2; // Large phones
  return basePadding;
};

const getResponsiveFontSize = (baseFontSize, screenWidth) => {
  const scale = screenWidth / 375;
  const newSize = baseFontSize * scale;
  return Math.max(Math.min(newSize, baseFontSize * 1.3), baseFontSize * 0.85);
};

const chunkArray = (arr, size) =>
  arr.reduce((acc, _, i) => {
    if (i % size === 0) acc.push(arr.slice(i, i + size));
    return acc;
  }, []);

// Helper functions for calendar
const pick = (obj, ...keys) =>
  keys.map(k => obj?.[k]).find(v => v !== undefined);
const bool = v => v === true || v === 'true' || v === 1 || v === '1';

const determineColor = item => {
  if (!item) return '#f0f0f0';
  const apiColor = pick(item, 'Color', 'color');
  if (apiColor && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(apiColor))
    return apiColor;
  return '#f0f0f0';
};

const getTextColor = hex => {
  try {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.5 ? '#000000' : '#FFFFFF';
  } catch {
    return '#000000';
  }
};

const normalizeArray = payload => {
  try {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (typeof payload === 'string') {
      const parsed = JSON.parse(payload);
      return Array.isArray(parsed) ? parsed : [];
    }
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.value)) return payload.value;
    return [];
  } catch {
    return [];
  }
};

// Convert seconds to 12-hour format
const secondsTo12Hour = seconds => {
  if (!seconds && seconds !== 0) return 'N/A';
  const sec = Number(seconds);
  if (!Number.isFinite(sec)) return 'N/A';
  if (sec === 0) return '12:00 AM';
  const totalSeconds = Math.abs(sec);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  let period = 'AM';
  let displayHours = hours;
  if (hours >= 12) {
    period = 'PM';
    displayHours = hours > 12 ? hours - 12 : hours;
  }
  if (hours === 0) displayHours = 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
};

const fmtTime12Hour = value => {
  if (!value && value !== 0) return 'N/A';
  if (!isNaN(value)) return secondsTo12Hour(Number(value));
  if (typeof value === 'string' && value.includes(':')) {
    const parts = value.split(':');
    if (parts.length >= 2) {
      const hours = parseInt(parts[0], 10) || 0;
      const minutes = parseInt(parts[1], 10) || 0;
      const totalSeconds = hours * 3600 + minutes * 60;
      return secondsTo12Hour(totalSeconds);
    }
  }
  if (String(value).includes('T')) {
    try {
      const timeStr = String(value).split('T')[1];
      return moment(`2000-01-01T${timeStr}`).format('hh:mm a');
    } catch {
      return value;
    }
  }
  return 'N/A';
};

const secondsToHours = seconds => {
  if (!seconds && seconds !== 0) return 'N/A';
  const sec = Number(seconds);
  if (!Number.isFinite(sec)) return 'N/A';
  if (sec === 0) return '0.00 hrs';
  const hours = sec / 3600;
  return `${hours.toFixed(2)} hrs`;
};

const fmtHours = value => {
  if (!value && value !== 0) return 'N/A';
  if (!isNaN(value)) return secondsToHours(Number(value));
  if (typeof value === 'string' && value.includes(':')) {
    const parts = value.split(':');
    if (parts.length >= 2) {
      const hours = parseInt(parts[0], 10) || 0;
      const minutes = parseInt(parts[1], 10) || 0;
      const seconds = parseInt(parts[2], 10) || 0;
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      return secondsToHours(totalSeconds);
    }
  }
  return 'N/A';
};

const normalizeDateISO = v => {
  if (!v) return '';
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = typeof v === 'string' && v.length >= 10 ? moment(v) : moment(v);
  if (!m || !m.isValid()) return '';
  return m.local().format('YYYY-MM-DD');
};

const normalizeTimeTo24h = v => {
  if (!v && v !== 0) return '';
  if (/^\d{1,5}$/.test(String(v))) {
    const sec = Number(v);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  const sv = String(v).trim();
  const t12 = moment(sv, ['h:mm A', 'hh:mm A'], true);
  if (t12.isValid()) return t12.format('HH:mm');
  const t24 = moment(sv, ['HH:mm', 'HH:mm:ss'], true);
  if (t24.isValid()) return t24.format('HH:mm');
  const mx = moment(sv);
  return mx.isValid() ? mx.format('HH:mm') : '';
};

const isBlankTime = v =>
  v === null ||
  v === undefined ||
  v === '' ||
  v === 0 ||
  v === '0' ||
  v === '00:00' ||
  v === '00:00:00';
const looksLikeMissingDate = iso =>
  !iso || String(iso).startsWith('1900-01-01');

// Reusable Detail Row Component
const DetailRow = ({label, value}) => (
  <View style={detailStyles.detailRow}>
    <Text style={detailStyles.detailLabel}>{label}:</Text>
    <Text style={detailStyles.detailValue}>{value || 'N/A'}</Text>
  </View>
);

const MainDashboard = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const {width: screenWidth, height: screenHeight} = useWindowDimensions();

  // Responsive calculations
  const isSmallScreen = screenWidth < 360;
  const isMediumScreen = screenWidth >= 360 && screenWidth <= 414;

  // Dynamic grid configuration based on screen size
  const getNumColumns = () => {
    if (isSmallScreen) return 2;
    if (isMediumScreen) return 3;
    return screenWidth > 500 ? 4 : 3;
  };

  const numColumns = getNumColumns();
  const cardsPerPage = numColumns * 2;

  // Responsive padding and gaps
  const H_PADDING = getResponsivePadding(20, screenWidth);
  const GRID_GAP = getResponsivePadding(12, screenWidth);

  // Calculate card dimensions
  const totalHorizontalGutters = H_PADDING * 2 + GRID_GAP * (numColumns - 1);
  const computedCardWidth = Math.floor(
    (screenWidth - totalHorizontalGutters) / numColumns,
  );

  const getCardHeight = () => {
    const baseRatio = isSmallScreen ? 1.1 : 0.9;
    const calculatedHeight = Math.floor(computedCardWidth * baseRatio);
    const minHeight = isSmallScreen ? 100 : 120;
    const maxHeight = isSmallScreen ? 140 : 160;
    return Math.max(minHeight, Math.min(calculatedHeight, maxHeight));
  };

  const computedCardHeight = getCardHeight();

  const getIconSize = () => {
    const baseSize = computedCardWidth * 0.4;
    const minSize = isSmallScreen ? 28 : 32;
    const maxSize = isSmallScreen ? 48 : 60;
    return Math.max(minSize, Math.min(baseSize, maxSize));
  };

  const iconSize = getIconSize();

  const userData = useSelector(state => state.user.userData);
  const selectedLegalEntity = useSelector(
    state => state.company.selectedLegalEntity,
  );
  const {menuItems} = useSelector(state => state.menuItem);

  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  // Calendar states
  const [attendanceData, setAttendanceData] = useState({});
  const [markedDates, setMarkedDates] = useState({});
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDayDetails, setSelectedDayDetails] = useState(null);
  const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);

  useEffect(() => {
    if (userData?.defaultLegalEntity && !selectedLegalEntity) {
      dispatch(setSelectedLegalEntity(userData.defaultLegalEntity));
    }
  }, [userData?.defaultLegalEntity, selectedLegalEntity]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      navigation.closeDrawer?.();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    fetchProfilePicture();
    fetchAttendanceData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleLogout();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation]),
  );

  const calculateYearsSinceHire = hireDateString => {
    if (!hireDateString) return 0;

    const hireDate = new Date(hireDateString);
    const today = new Date();

    let years = today.getFullYear() - hireDate.getFullYear();
    let months = today.getMonth() - hireDate.getMonth();
    let days = today.getDate() - hireDate.getDate();

    if (months < 0 || (months === 0 && days < 0)) {
      years--;
      months += 12;
    }

    const decimalYears = years + months / 12;
    return decimalYears.toFixed(1);
  };

  const getInitials = name => {
    if (!name) return 'UN';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const fetchProfilePicture = async () => {
    setIsLoading(true);
    setRefreshing(true);
    try {
      if (!userData?.employeeId) return;

      const data = await ProfilePicture({employeeId: userData.employeeId});
      let imageData = Array.isArray(data) && data.length > 0 ? data[0] : data;

      if (imageData?.StringImage) {
        const cleanBase64 = imageData.StringImage.replace(/\s/g, '');
        setProfilePictureUrl(`data:image/png;base64,${cleanBase64}`);
      } else {
        setProfilePictureUrl(null);
      }
    } catch (error) {
      console.error('Failed to fetch profile picture:', error);
      setProfilePictureUrl(null);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Calendar data fetching
  const processAttendanceData = useCallback(rows => {
    const marked = {};
    const map = {};

    const normalizedRows = normalizeArray(rows);

    normalizedRows.forEach(item => {
      const dateSrc = pick(
        item,
        'attendaceDate',
        'attendanceDate',
        'AttendaceDate',
        'AttendanceDate',
      );
      if (!dateSrc) return;

      try {
        const dateStr = moment(dateSrc).format('YYYY-MM-DD');
        const color = determineColor(item);
        marked[dateStr] = {
          customStyles: {
            container: {
              backgroundColor: color,
              borderRadius: 50,
              margin: 2,
              paddingVertical: 2,
              aspectRatio: 1,
              justifyContent: 'center',
              alignItems: 'center',
            },
            text: {color: getTextColor(color), fontWeight: 'bold'},
          },
        };
        map[dateStr] = {...item, color};
      } catch {
        /* ignore row */
      }
    });

    setMarkedDates(marked);
    setAttendanceData(map);
  }, []);

  const fetchAttendanceData = useCallback(async () => {
    if (!userData?.employeeId) {
      console.warn('No employeeId available');
      return;
    }

    try {
      setCalendarLoading(true);
      const fromDate = moment(currentMonth)
        .startOf('month')
        .format('YYYY-MM-DD');
      const toDate = moment(currentMonth).endOf('month').format('YYYY-MM-DD');

      const rows = await getRegisterDetailsByDate({
        employeeId: userData.employeeId,
        fromDate,
        toDate,
      });
      processAttendanceData(rows);
    } catch (err) {
      console.error('Attendance fetch error:', err?.message || err);
    } finally {
      setCalendarLoading(false);
    }
  }, [userData?.employeeId, currentMonth, processAttendanceData]);

  const handleRefresh = () => {
    fetchProfilePicture();
    fetchAttendanceData();
  };

  const handleLogout = () => setModalVisible(true);
  const confirmLogout = () => {
    setModalVisible(false);
    navigation.navigate('Login');
  };
  const cancelLogout = () => setModalVisible(false);

  const handleMonthChange = month => {
    setCurrentMonth(moment(month.dateString));
  };

  const getRecordActionType = useCallback(details => {
    if (!details) return 'none';

    const rawStatus = (details.Status ?? '').toString().trim().toLowerCase();
    const ABSENT_ALIASES = [
      'absent',
      'a',
      'no in/out',
      'no in out',
      'missing',
      'abs',
      'leave without pay',
    ];

    const offDay = bool(pick(details, 'offDay', 'OffDay'));
    const gazettedDay = bool(pick(details, 'gazettedDay', 'GazettedDay'));
    const noIn =
      isBlankTime(details.ClockIn) || looksLikeMissingDate(details.ClockInDate);
    const noOut =
      isBlankTime(details.ClockOut) ||
      looksLikeMissingDate(details.ClockOutDate);
    const computedAbsent = noIn && noOut;
    const isAbsent = computedAbsent || ABSENT_ALIASES.includes(rawStatus);
    const isPresent =
      rawStatus === 'present' || (!noIn && !noOut && rawStatus === '');

    if (offDay || gazettedDay || isAbsent) {
      return 'markPresent';
    } else if (!isPresent) {
      return 'edit';
    }

    return 'none';
  }, []);

  const handleDateSelect = day => {
    const key = day?.dateString;
    setSelectedDate(key);
    setSelectedDayDetails(attendanceData[key]);
    setAttendanceModalVisible(true);
  };

  const handleMarkPresent = () => {
    if (!selectedDate) return;

    const selectedDateISO = normalizeDateISO(selectedDate);

    navigation.navigate('MarkPresentScreen', {
      employeeId: userData?.employeeId,
      employeeName: userData?.employeeName,
      attendanceDate: selectedDateISO,
      sourceScreen: 'MainDashboard',
    });

    setAttendanceModalVisible(false);
  };

  const handleEditAttendance = () => {
    if (!selectedDate || !selectedDayDetails) return;

    const selectedDateISO = normalizeDateISO(selectedDate);
    const normalizedClockIn = normalizeTimeTo24h(selectedDayDetails.ClockIn);
    const normalizedClockOut = normalizeTimeTo24h(selectedDayDetails.ClockOut);

    navigation.navigate('EditAttendanceScreen', {
      employeeId: userData?.employeeId,
      employeeName: userData?.employeeName,
      attendanceDate: selectedDateISO,
      clockIn: normalizedClockIn,
      clockOut: normalizedClockOut,
      remarks: selectedDayDetails?.Remarks || '',
      sourceScreen: 'MainDashboard',
    });

    setAttendanceModalVisible(false);
  };

  const handleShortLeave = () => {
    if (!selectedDate) return;

    const selectedDateISO = normalizeDateISO(selectedDate);

    navigation.navigate('LeaveSaveRecord', {
      mode: 'create',
      employeeId: userData?.employeeId,
      employeeName: userData?.employeeName,
      WorkerRecId: userData?.WorkerRecId,
      cameFrom: 'MainDashboard',
      isShortLeave: true,
      attendanceDate: selectedDateISO,
      prefillData: {leaveCategory: 'Half Day Leave'},
    });

    setAttendanceModalVisible(false);
  };

  const handleLeaveRequest = () => {
    if (!selectedDate) return;

    const selectedDateISO = normalizeDateISO(selectedDate);

    navigation.navigate('LeaveSaveRecord', {
      mode: 'create',
      employeeId: userData?.employeeId,
      employeeName: userData?.employeeName,
      WorkerRecId: userData?.WorkerRecId,
      cameFrom: 'MainDashboard',
      isLeaveRequest: true,
      attendanceDate: selectedDateISO,
      prefillData: {leaveStartDate: selectedDateISO},
    });

    setAttendanceModalVisible(false);
  };

  // DYNAMIC MENU CREATION - Build navigation parameters dynamically
  const getNavigationParams = menuItem => {
    const baseParams = {
      employeeId: userData.employeeId,
      employeeName: userData.employeeName,
      WorkerRecId: userData.WorkerRecId,
      userData: userData,
      cameFrom: 'MainDashboard',
      selectedLegalEntity,
    };

    switch (menuItem.Type) {
      case '0': // List/View screens
        return baseParams;

      case '1': // Create/Save screens
        if (menuItem.MenuId === 'LeaveSaveRecord') {
          return {
            ...baseParams,
            mode: 'create',
            leaveData: {
              employeeId: userData.employeeId,
              employeeName: userData.employeeName,
              WorkerRecId: userData.WorkerRecId,
              recId: '',
              leaveCode: '',
              leaveCategory: '',
              balance: '0.00',
              leaveStartDate: '',
              leaveEndDate: '',
              leaveDays: '',
              reason: '',
            },
          };
        } else if (menuItem.MenuId === 'GenericAdvanceSaveScreen') {
          return {
            ...baseParams,
            mode: 'create',
            advanceData: {
              employeeId: userData.employeeId,
              employeeName: userData.employeeName,
              WorkerRecId: userData.WorkerRecId,
              RecId: '',
              AdvanceTypeCode: '',
              AdvanceAmount: '0.00',
              RequestedPaymentDate: '',
              RecoveryStartDate: '',
              RequestedInstallmentAmount: '0.00',
              RequestedInstallments: '0',
              AdvanceDescription: '',
            },
          };
        }
        return {
          ...baseParams,
          mode: 'create',
        };

      case '2': // Report/View screens
        return baseParams;

      default:
        return baseParams;
    }
  };

  // DYNAMIC MENU FILTERING & MAPPING
  const getDynamicMenus = () => {
    // Filter only valid menu items
    const dashboardMenuItems = menuItems.filter(item => {
      const hasScreen = screenMapping[item.MenuId];
      const validType = [1, 2, 3].includes(Number(item.Type));
      return hasScreen && validType;
    });

    if (dashboardMenuItems.length === 0) return [];

    let cards = dashboardMenuItems
      .filter(item => item.MenuId !== 'GenericAdvanceSaveScreen')
      .map((menuItem, index) => ({
        id: menuItem.MenuId || index.toString(),
        title: menuItem.Label || menuItem.DisplayName || menuItem.MenuId,
        description: `Access ${menuItem.Label || menuItem.MenuId}`,
        icon:
          iconMapping[menuItem.MenuId] ||
          require('../assets/Maindashboard/calendar.png'),
        menuItem: menuItem,
        onPress: () => {
          const navigationParams = getNavigationParams(menuItem);
          navigation.navigate(menuItem.MenuId, navigationParams);
        },
      }));

    const loanCard = {
      id: 'GenericLoanSaveScreen',
      title: 'Loan Request',
      description: 'Access Loan Request',
      icon: require('../assets/Maindashboard/signing.png'),
      menuItem: {MenuId: 'GenericAdvanceSaveScreen', requestType: 'Loan'},
      onPress: () => {
        const baseNavigationParams = getNavigationParams({
          MenuId: 'GenericAdvanceSaveScreen',
          Type: '1',
        });

        navigation.navigate('GenericAdvanceSaveScreen', {
          ...baseNavigationParams,
          cameFrom: 'MainDashboard',
          requestType: 'Loan',
          advanceType: 0,
          screenName: 'Loan Request',
        });
      },
    };

    cards.push(loanCard);
    return cards;
  };

  // GET DYNAMIC MENUS
  const dynamicMenus = getDynamicMenus();
  const pages = chunkArray(dynamicMenus, cardsPerPage);
  const yearsWorked = calculateYearsSinceHire(userData?.OriginalHireDate);

  // Calendar marked dates with today highlight
  const todayStr = moment().format('YYYY-MM-DD');
  const withTodayMarked = {
    ...markedDates,
    [todayStr]: {
      customStyles: {
        container: {
          borderWidth: 2,
          borderColor: '#0EA5E9',
          borderRadius: 50,
          margin: 2,
          paddingVertical: 2,
          aspectRatio: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor:
            markedDates[todayStr]?.customStyles?.container?.backgroundColor ||
            '#FFFFFF',
        },
        text: {
          fontWeight: '800',
          color: markedDates[todayStr]?.customStyles?.text?.color || '#0F172A',
        },
      },
    },
  };

  // Get responsive styles
  const getResponsiveStyles = () => ({
    container: {flex: 1, backgroundColor: '#FAFAFA'},
    scrollView: {flex: 1},
    headerContainer: {
      paddingHorizontal: H_PADDING,
      paddingTop: getResponsivePadding(10, screenWidth),
      paddingBottom: getResponsivePadding(20, screenWidth),
      borderBottomLeftRadius: getResponsiveSize(32, screenWidth),
      borderBottomRightRadius: getResponsiveSize(32, screenWidth),
      backgroundColor: '#0A66C2',
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowOffset: {width: 0, height: 3},
      shadowRadius: 6,
      elevation: 4,
    },
    headerContent: {
      flexDirection: isSmallScreen ? 'column' : 'row',
      alignItems: 'center',
      justifyContent: isSmallScreen ? 'center' : 'flex-start',
    },
    profilePicture: {
      width: getResponsiveSize(90, screenWidth),
      height: getResponsiveSize(90, screenWidth),
      borderRadius: getResponsiveSize(45, screenWidth),
      borderWidth: getResponsiveSize(3, screenWidth),
      borderColor: '#fff',
      backgroundColor: '#EAF2FB',
    },
    avatarContainer: {
      width: getResponsiveSize(90, screenWidth),
      height: getResponsiveSize(90, screenWidth),
      borderRadius: getResponsiveSize(45, screenWidth),
      borderWidth: getResponsiveSize(3, screenWidth),
      borderColor: '#fff',
      backgroundColor: '#bed8f6ff',
      marginRight: isSmallScreen ? 0 : getResponsivePadding(12, screenWidth),
      marginBottom: isSmallScreen ? getResponsivePadding(12, screenWidth) : 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: getResponsiveFontSize(28, screenWidth),
      fontWeight: '700',
      color: '#0A66C2',
    },
    textColumn: {
      flex: 1,
      alignItems: isSmallScreen ? 'center' : 'flex-start',
    },
    nameText: {
      fontSize: getResponsiveFontSize(20, screenWidth),
      fontWeight: '700',
      color: '#fff',
      marginBottom: 2,
      textAlign: isSmallScreen ? 'center' : 'left',
    },
    emailText: {
      fontSize: getResponsiveFontSize(13, screenWidth),
      color: '#DCE6F5',
      textAlign: isSmallScreen ? 'center' : 'left',
      lineHeight: getResponsiveFontSize(16, screenWidth),
    },
    boldText: {
      fontSize: getResponsiveFontSize(13, screenWidth),
      color: '#DCE6F5',
      fontWeight: 'bold',
    },
    mainContent: {
      flex: 1,
      paddingTop: getResponsivePadding(22, screenWidth),
    },
    sectionTitle: {
      fontSize: getResponsiveFontSize(18, screenWidth),
      fontWeight: '700',
      color: '#2C3E50',
      marginBottom: getResponsivePadding(18, screenWidth),
      paddingHorizontal: H_PADDING,
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: getResponsiveSize(16, screenWidth),
      alignItems: 'center',
      justifyContent: 'center',
      padding: getResponsivePadding(10, screenWidth),
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowOffset: {width: 0, height: 3},
      shadowRadius: 6,
      elevation: 2,
      marginBottom: GRID_GAP,
      width: computedCardWidth,
      height: computedCardHeight,
    },
    cardTitle: {
      fontSize: getResponsiveFontSize(12, screenWidth),
      fontWeight: '700',
      color: '#2C3E50',
      textAlign: 'center',
      lineHeight: getResponsiveFontSize(14, screenWidth),
      marginTop: getResponsivePadding(8, screenWidth),
    },
    indicatorContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: getResponsivePadding(12, screenWidth),
      paddingHorizontal: H_PADDING,
    },
    indicatorDot: {
      width: getResponsiveSize(8, screenWidth),
      height: getResponsiveSize(8, screenWidth),
      borderRadius: getResponsiveSize(4, screenWidth),
      backgroundColor: '#0A66C2',
      marginHorizontal: getResponsiveSize(4, screenWidth),
    },
    noMenuContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: getResponsivePadding(40, screenWidth),
      paddingHorizontal: H_PADDING,
    },
    noMenuText: {
      fontSize: getResponsiveFontSize(16, screenWidth),
      color: '#6B7280',
      fontWeight: '500',
      textAlign: 'center',
    },
    // Calendar Styles
    calendarSection: {
      marginTop: getResponsivePadding(16, screenWidth),
      paddingHorizontal: H_PADDING,
    },
    calendarCard: {
      borderRadius: getResponsiveSize(16, screenWidth),
      backgroundColor: '#FFFFFF',
      shadowColor: '#0F172A',
      shadowOffset: {width: 0, height: 8},
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 6,
      overflow: 'hidden',
      marginBottom: getResponsivePadding(16, screenWidth),
    },
    calendarContainer: {
      paddingHorizontal: getResponsivePadding(6, screenWidth),
      paddingBottom: getResponsivePadding(12, screenWidth),
    },
  });

  const styles = getResponsiveStyles();

  const renderCard = card => (
    <TouchableOpacity
      key={card.id}
      style={styles.card}
      onPress={card.onPress}
      activeOpacity={0.85}>
      <Image
        source={typeof card.icon === 'string' ? {uri: card.icon} : card.icon}
        style={{
          width: iconSize,
          height: iconSize,
          resizeMode: 'contain',
        }}
      />
      <Text style={styles.cardTitle} numberOfLines={2}>
        {card.title}
      </Text>
    </TouchableOpacity>
  );

  const renderPage = ({item: pageCards}) => (
    <View
      style={{
        width: screenWidth,
        paddingHorizontal: H_PADDING,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
      }}>
      {pageCards.map((card, index) => (
        <View
          key={card.id}
          style={{
            width: computedCardWidth,
            marginRight: (index + 1) % numColumns === 0 ? 0 : GRID_GAP,
          }}>
          {renderCard(card)}
        </View>
      ))}
    </View>
  );

  return (
    <ActionPaneContainer
      pageTitle="Dynaface"
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={false}
      onRefresh={handleRefresh}>
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <SafeAreaView style={styles.container}>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }>
            {/* Header */}
            <View style={styles.headerContainer}>
              <View style={styles.headerContent}>
                {isLoading ? (
                  <ActivityIndicator size="large" color="#fff" />
                ) : (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Profile')}
                    activeOpacity={0.8}
                    style={styles.avatarContainer}>
                    {profilePictureUrl ? (
                      <Image
                        source={{uri: profilePictureUrl}}
                        style={styles.profilePicture}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.avatarText}>
                        {getInitials(userData?.employeeName)}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
                <View style={styles.textColumn}>
                  <Text style={styles.nameText}>{userData.employeeName}</Text>
                  <Text style={styles.emailText}>
                    <Text style={styles.boldText}>Department: </Text>
                    {userData.department || 'N/A'}
                  </Text>
                  <Text style={styles.emailText}>
                    <Text style={styles.boldText}>Position: </Text>
                    {userData.PositionDescription || 'N/A'}
                  </Text>
                  <Text style={styles.emailText}>
                    <Text style={styles.boldText}>Years of Service: </Text>
                    {yearsWorked} years
                  </Text>
                </View>
              </View>
            </View>

            {/* Calendar Section */}
            <View style={styles.calendarSection}>
              <View style={styles.calendarCard}>
                {/* ⬇️ No custom header here — we let DFCalendar show Month + Arrows */}
                <View style={styles.calendarContainer}>
                  <DFCalendar
                    currentDate={currentMonth.toDate()}
                    markedDates={withTodayMarked}
                    onDayPress={handleDateSelect}
                    onMonthChange={handleMonthChange}
                    enableSwipeMonths
                    /* show built-in arrows near the month title */
                    hideArrows={false}
                    hideExtraDays={false}
                    firstDay={1}
                    hideDayNames={false}
                    markingType="custom"
                    themeOverrides={{
                      backgroundColor: '#F5F7FB',
                      calendarBackground: '#FFFFFF',
                      textSectionTitleColor: '#8E99A4',
                      monthTextColor: '#0F172A',
                      arrowColor: '#0EA5E9',
                      todayTextColor: '#0EA5E9',
                      dayTextColor: '#0F172A',
                      textDisabledColor: '#C7CED6',
                      selectedDayTextColor: '#0F172A',
                      textMonthFontWeight: '800',
                      textMonthFontSize: 30,
                      textDayFontSize: 14,
                      textDayHeaderFontSize: 12,
                    }}
                  />
                </View>
              </View>
            </View>

            {/* Main Section */}
            <View style={styles.mainContent}>
              {dynamicMenus.length === 0 ? (
                <View style={styles.noMenuContainer}>
                  <Text style={styles.noMenuText}>No available request</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.sectionTitle}>
                    What would you like to do?
                  </Text>
                  <FlatList
                    data={pages}
                    renderItem={renderPage}
                    keyExtractor={(_, index) => index.toString()}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={e => {
                      const page = Math.round(
                        e.nativeEvent.contentOffset.x / screenWidth,
                      );
                      setCurrentPage(page);
                    }}
                    scrollEventThrottle={16}
                  />

                  {/* Page Indicator */}
                  {dynamicMenus.length > cardsPerPage && (
                    <View style={styles.indicatorContainer}>
                      {pages.map((_, index) => (
                        <View
                          key={index}
                          style={[
                            styles.indicatorDot,
                            {opacity: currentPage === index ? 1 : 0.3},
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      )}

      {/* Attendance Details Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={attendanceModalVisible}
        onRequestClose={() => setAttendanceModalVisible(false)}>
        <View style={detailStyles.modalContainer}>
          <View style={detailStyles.modalContent}>
            <View style={detailStyles.modalHeader}>
              <Text style={detailStyles.modalTitle}>
                {selectedDate
                  ? moment(selectedDate).format('dddd, MMMM Do, YYYY')
                  : ''}
              </Text>
              <TouchableOpacity
                style={detailStyles.closeButton}
                onPress={() => setAttendanceModalVisible(false)}>
                <Text style={detailStyles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            {selectedDayDetails ? (
              <ScrollView
                contentContainerStyle={detailStyles.detailsContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled">
                <View style={detailStyles.detailsGrid}>
                  <DetailRow
                    label="Clock In"
                    value={fmtTime12Hour(
                      pick(selectedDayDetails, 'clockIn', 'ClockIn'),
                    )}
                  />
                  <DetailRow
                    label="Clock Out"
                    value={fmtTime12Hour(
                      pick(selectedDayDetails, 'clockOut', 'ClockOut'),
                    )}
                  />
                  <DetailRow
                    label="Total Working Time"
                    value={fmtHours(
                      pick(
                        selectedDayDetails,
                        'totalWorkingTime',
                        'TotalWorkingTime',
                      ),
                    )}
                  />
                  <DetailRow
                    label="Overtime"
                    value={fmtHours(
                      pick(
                        selectedDayDetails,
                        'totalOvertime',
                        'TotalOvertime',
                      ),
                    )}
                  />
                  <DetailRow
                    label="Late Arrival"
                    value={fmtHours(
                      pick(
                        selectedDayDetails,
                        'lateArrivalTime',
                        'LateArrivalTime',
                      ),
                    )}
                  />
                  <DetailRow
                    label="Early Out"
                    value={fmtHours(
                      pick(selectedDayDetails, 'earlyOutTime', 'EarlyOutTime'),
                    )}
                  />
                  {pick(selectedDayDetails, 'leaveCode', 'LeaveCode') && (
                    <DetailRow
                      label="Leave Code"
                      value={pick(selectedDayDetails, 'leaveCode', 'LeaveCode')}
                    />
                  )}
                  {pick(selectedDayDetails, 'remarks', 'Remarks') && (
                    <DetailRow
                      label="Remarks"
                      value={pick(selectedDayDetails, 'remarks', 'Remarks')}
                    />
                  )}
                  {Number(
                    pick(
                      selectedDayDetails,
                      'lateArrivalTimeDeduction',
                      'LateArrivalTimeDeduction',
                    ),
                  ) > 0 && (
                    <DetailRow
                      label="Late Arrival Deduction"
                      value={fmtHours(
                        pick(
                          selectedDayDetails,
                          'lateArrivalTimeDeduction',
                          'LateArrivalTimeDeduction',
                        ),
                      )}
                    />
                  )}
                  {Number(
                    pick(
                      selectedDayDetails,
                      'earlyOutTimeDeduction',
                      'EarlyOutTimeDeduction',
                    ),
                  ) > 0 && (
                    <DetailRow
                      label="Early Out Deduction"
                      value={fmtHours(
                        pick(
                          selectedDayDetails,
                          'earlyOutTimeDeduction',
                          'EarlyOutTimeDeduction',
                        ),
                      )}
                    />
                  )}
                  {Number(
                    pick(
                      selectedDayDetails,
                      'totalTimeDeduction',
                      'TotalTimeDeduction',
                    ),
                  ) > 0 && (
                    <DetailRow
                      label="Total Deduction"
                      value={fmtHours(
                        pick(
                          selectedDayDetails,
                          'totalTimeDeduction',
                          'TotalTimeDeduction',
                        ),
                      )}
                    />
                  )}
                  {pick(selectedDayDetails, 'shiftId', 'ShiftId') && (
                    <DetailRow
                      label="Shift ID"
                      value={pick(selectedDayDetails, 'shiftId', 'ShiftId')}
                    />
                  )}
                </View>

                {/* Action Buttons */}
                <View style={detailStyles.actionButtonsContainer}>
                  {getRecordActionType(selectedDayDetails) ===
                    'markPresent' && (
                    <>
                      <TouchableOpacity
                        style={[
                          detailStyles.actionButton,
                          detailStyles.markPresentButton,
                        ]}
                        onPress={handleMarkPresent}>
                        <Text style={detailStyles.actionButtonText}>
                          Mark Present
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          detailStyles.actionButton,
                          detailStyles.leaveRequestButton,
                        ]}
                        onPress={handleLeaveRequest}>
                        <Text style={detailStyles.actionButtonText}>
                          Leave Request
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {getRecordActionType(selectedDayDetails) === 'edit' && (
                    <>
                      <TouchableOpacity
                        style={[
                          detailStyles.actionButton,
                          detailStyles.editButton,
                        ]}
                        onPress={handleEditAttendance}>
                        <Text style={detailStyles.actionButtonText}>
                          Edit Attendance
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          detailStyles.actionButton,
                          detailStyles.shortLeaveButton,
                        ]}
                        onPress={handleShortLeave}>
                        <Text style={detailStyles.actionButtonText}>
                          Short Leave
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {(getRecordActionType(selectedDayDetails) === 'markPresent' ||
                    getRecordActionType(selectedDayDetails) === 'edit') && (
                    <TouchableOpacity
                      style={[
                        detailStyles.actionButton,
                        detailStyles.cancelButton,
                      ]}
                      onPress={() => setAttendanceModalVisible(false)}>
                      <Text
                        style={[
                          detailStyles.actionButtonText,
                          detailStyles.cancelButtonText,
                        ]}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            ) : (
              <View style={detailStyles.noDataContainer}>
                <Text style={detailStyles.noDataText}>
                  No attendance data for this date
                </Text>
                <View style={detailStyles.noDataButtons}>
                  <TouchableOpacity
                    style={[
                      detailStyles.actionButton,
                      detailStyles.markPresentButton,
                      detailStyles.fullWidthButton,
                    ]}
                    onPress={handleMarkPresent}>
                    <Text style={detailStyles.actionButtonText}>
                      Mark Present
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      detailStyles.actionButton,
                      detailStyles.leaveRequestButton,
                      detailStyles.fullWidthButton,
                    ]}
                    onPress={handleLeaveRequest}>
                    <Text style={detailStyles.actionButtonText}>
                      Leave Request
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <LogoutAlertModal
        visible={modalVisible}
        heading="Are you sure you want to logout?"
        text="Are you sure you want to logout?"
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />
    </ActionPaneContainer>
  );
};

// Detail Modal Styles
const detailStyles = {
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  modalTitle: {fontSize: 18, fontWeight: 'bold', color: '#1c1c1e', flex: 1},
  closeButton: {padding: 4, marginLeft: 10},
  closeButtonText: {fontSize: 20, color: '#8e8e93', fontWeight: 'bold'},
  detailsContent: {padding: 20, paddingBottom: 10},
  detailsGrid: {gap: 12},
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  detailLabel: {fontSize: 14, fontWeight: '500', color: '#8e8e93', flex: 1},
  detailValue: {
    fontSize: 14,
    fontWeight: '400',
    color: '#1c1c1e',
    flex: 1,
    textAlign: 'right',
  },
  actionButtonsContainer: {
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markPresentButton: {
    backgroundColor: '#6ce66c',
  },
  editButton: {
    backgroundColor: '#0EA5E9',
  },
  shortLeaveButton: {
    backgroundColor: '#FFA500',
  },
  leaveRequestButton: {
    backgroundColor: '#9370DB',
  },
  cancelButton: {
    backgroundColor: '#f1f1f1',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButtonText: {
    color: '#666666',
  },
  fullWidthButton: {
    marginTop: 8,
  },
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#8e8e93',
    textAlign: 'center',
    marginBottom: 20,
  },
  noDataButtons: {
    width: '100%',
    gap: 12,
  },
};

export default MainDashboard;
