/* eslint-disable curly */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useCallback, useEffect, useMemo} from 'react';
import {
  Text,
  View,
  ScrollView,
  BackHandler,
  TouchableOpacity,
} from 'react-native';
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import FeatherIcon from 'react-native-vector-icons/Feather';

import {FindTeamAttendance} from '../../API/AttendanceCalendar/findTeamAttendance';

import ActionPaneContainer from '../../../../components/ActionPaneContainer';
import CustomIndicator from '../../../../components/CustomIndicator/CustomIndicator';
import useAppTokens from '../../../../components/AppComponentsDesign/useAppTokens';
import {AppTokens} from '../../../../components/AppComponentsDesign/Tokens';
import usePalette from '../../../../hooks/usePalette';
import styles from '../../../../styles/styles';
import brand from '../../../../theme/brand';
import {
  conditionalScale,
  conditionalVerticalScale,
  conditionalFontScale,
} from '../../../../store/utils/scaling';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_ABBR = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const WEEKDAY_ABBR = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAY_ABBR_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const WHITE_CARD_BG = '#FFFFFF';
const WHITE_CARD_BORDER = '#E5E5E5';

// Fixed, theme-independent status colors — these carry real-world meaning so
// they stay constant across light/dark palettes.
const STATUS_COLORS = {
  onTime: {bg: '#2E7D32', text: '#1B5E20', soft: '#E6F4EA'}, // green
  irregular: {bg: '#C62828', text: '#B71C1C', soft: '#FDECEA'}, // red
  missing: {bg: '#D4A017', text: '#8A6D0B', soft: '#FBF1D6'}, // mustard
  absent: {
    bg: AppTokens.statusDraft,
    text: AppTokens.statusDraftText,
    soft: AppTokens.statusDraftBg,
  },
  leave: {bg: brand.primary, text: brand.primaryStrong, soft: brand.tint},
  offDay: {bg: '#9E9E9E', text: '#616161', soft: '#F1F1F1'},
};

const STATUS_LABELS = {
  onTime: 'On time',
  irregular: 'Late Arrival/Early Departure',
  missing: 'Missing Clock In/Out',
  absent: 'Off day',
  leave: 'Leave',
  offDay: 'Off day',
};

// Short labels used inside the tight, no-scroll table so the chip fits.
const STATUS_LABELS_SHORT = {
  onTime: 'On time',
  irregular: 'Late/Early',
  missing: 'Missing',
  absent: 'Off day',
  leave: 'Leave',
  offDay: 'Off day',
};

// Which statuses appear in the summary strip, and in what order.
const SUMMARY_ORDER = ['onTime', 'irregular', 'missing', 'leave'];
const SUMMARY_SHORT = {
  onTime: 'On time',
  irregular: 'Late Arrival/Early Departure',
  missing: 'Missing Clock In/Out',
  leave: 'Leave',
};

const TODAY_RING_COLOR = brand.primaryStrong;

const startOfDay = d => {
  if (!d) return null;
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};

// Local (never UTC/toISOString) — avoids shifting the day for positive-UTC
// zones like Pakistan.
const toYMD = d => {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// "Monday, 05 Jan 2026" — the label shown in the tappable field.
const formatDateLabel = d => {
  if (!d) return 'Select date';
  return `${WEEKDAY_ABBR_FULL[d.getDay()]}, ${String(d.getDate()).padStart(
    2,
    '0',
  )} ${MONTH_ABBR[d.getMonth()]} ${d.getFullYear()}`;
};

const formatSecondsToTime = seconds => {
  if (seconds === null || seconds === undefined) return '—';
  if (seconds < 0) return '—';
  if (seconds === 0) return '—';
  const hh = Math.floor(seconds / 3600);
  const mm = Math.floor((seconds % 3600) / 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

// A clock time counts as "present" only if it's a real value — not null,
// not undefined, and not AX's -1 "not entered" sentinel (which can leak
// through if the API mapping didn't normalize it). 0 is a legit midnight.
const hasTime = v =>
  v !== null && v !== undefined && v !== -1 && v !== '-1' && v !== '';

// Same derivation as the calendar screen so the two stay consistent.
const deriveStatus = rec => {
  if (rec.IsLeave) return 'leave';
  if (rec.IsAbsent) return 'absent';
  const hasClockIn = hasTime(rec.ClockIn);
  const hasClockOut = hasTime(rec.ClockOut);
  if (!hasClockIn && !hasClockOut) return 'offDay';
  if (!hasClockIn || !hasClockOut) return 'missing';
  if (rec.IsLateArrival || rec.IsEarlyDeparture) return 'irregular';
  return 'onTime';
};

// Standard 7-column month grid; leading/trailing cells are null.
const buildMonthGrid = (year, month) => {
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstOfMonth.getDay();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
};

const DFTeamAttendanceScreen = () => {
  const navigation = useNavigation();
  const T = useAppTokens();
  const P = usePalette();
  const route = useRoute();

  const {employeeId, userData: routeUserData} = route.params || {};

  const reduxUserData = useSelector(state => state.user && state.user.userData);
  // The manager whose reportees we're pulling attendance for.
  const managerPersonnelNumber =
    employeeId || (reduxUserData && reduxUserData.employeeId);

  const today = startOfDay(new Date());

  // Selected date (defaults to today).
  const [selectedDate, setSelectedDate] = useState(today);

  // Whether the inline calendar is open, and which month it's showing.
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const todayKey = toYMD(today);
  const selectedKey = toYMD(selectedDate);

  const loadTeamAttendance = useCallback(async () => {
    if (!selectedDate || !managerPersonnelNumber) {
      setRecords([]);
      return;
    }
    setIsLoading(true);
    try {
      // Passing a real local Date — the API's toAxDateTime forces midnight
      // from local date parts, so no timezone day-shift.
      const data = await FindTeamAttendance(
        selectedDate,
        managerPersonnelNumber,
      );
      setRecords(data || []);
    } catch (error) {
      console.error('[Team Attendance] Failed to fetch:', error);
      setRecords([]);
    } finally {
      setIsLoading(false);
      setHasFetched(true);
    }
  }, [selectedDate, managerPersonnelNumber]);

  // Re-fetch whenever the selected date changes.
  useEffect(() => {
    loadTeamAttendance();
  }, [selectedDate]);

  const handleGoBack = useCallback(() => {
    navigation.reset({index: 0, routes: [{name: 'MainDashboard'}]});
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Close the picker first if it's open, otherwise navigate back.
        if (isPickerOpen) {
          setIsPickerOpen(false);
          return true;
        }
        handleGoBack();
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [handleGoBack, isPickerOpen]),
  );

  const handleRefresh = useCallback(() => {
    loadTeamAttendance();
  }, [loadTeamAttendance]);

  const openPicker = useCallback(() => {
    setViewYear(selectedDate.getFullYear());
    setViewMonth(selectedDate.getMonth());
    setIsPickerOpen(true);
  }, [selectedDate]);

  const goPrevMonth = useCallback(() => {
    setViewMonth(m => {
      if (m === 0) {
        setViewYear(y => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const goNextMonth = useCallback(() => {
    setViewMonth(m => {
      if (m === 11) {
        setViewYear(y => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const goPrevYear = useCallback(() => setViewYear(y => y - 1), []);
  const goNextYear = useCallback(() => setViewYear(y => y + 1), []);

  const handlePickDate = useCallback(date => {
    setSelectedDate(startOfDay(date));
    setIsPickerOpen(false);
  }, []);

  const weeks = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  // The department shown in the header — the most common one across the
  // team's records (a manager's reportees are usually one department).
  const teamDepartment = useMemo(() => {
    const counts = {};
    records.forEach(r => {
      const d = (r.DepartmentName || '').trim();
      if (d) counts[d] = (counts[d] || 0) + 1;
    });
    const names = Object.keys(counts);
    if (!names.length) return '';
    return names.sort((a, b) => counts[b] - counts[a])[0];
  }, [records]);

  // Per-status tally for the summary strip.
  const summary = useMemo(() => {
    const c = {
      onTime: 0,
      irregular: 0,
      missing: 0,
      absent: 0,
      leave: 0,
      offDay: 0,
    };
    records.forEach(r => {
      const s = deriveStatus(r);
      if (c[s] !== undefined) c[s] += 1;
    });
    return c;
  }, [records]);

  return (
    <ActionPaneContainer
      pageTitle="Team Attendance"
      isBackButton={true}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      showPageTitleRow={true}
      showSearchBar={false}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: conditionalScale(14, 15, 16, 17),
          paddingTop: conditionalVerticalScale(12, 13, 14, 15),
          paddingBottom: conditionalVerticalScale(30, 34, 38, 42),
        }}
        showsVerticalScrollIndicator={false}>
        {/* ── Date selector (tappable field → inline calendar) ── */}
        <Text style={styles.DSR_Label}>Date</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => (isPickerOpen ? setIsPickerOpen(false) : openPicker())}
          style={[
            styles.DSR_Input,
            {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            },
          ]}>
          <Text
            style={{
              fontSize: conditionalFontScale(13, 13.5, 14, 14),
              color: '#1A1A1A',
              fontWeight: '500',
            }}>
            {formatDateLabel(selectedDate)}
          </Text>
          <FeatherIcon
            name={isPickerOpen ? 'chevron-up' : 'calendar'}
            size={18}
            color={P.primaryStrong}
          />
        </TouchableOpacity>

        {/* Inline calendar — pick ANY date via month/year navigation. */}
        {isPickerOpen && (
          <View
            style={{
              backgroundColor: WHITE_CARD_BG,
              borderRadius: conditionalScale(16, 17, 18, 18),
              borderWidth: 1,
              borderColor: WHITE_CARD_BORDER,
              paddingVertical: conditionalVerticalScale(14, 15, 16, 16),
              paddingHorizontal: conditionalScale(10, 11, 12, 12),
              marginTop: conditionalVerticalScale(8, 9, 10, 10),
              shadowColor: '#000',
              shadowOffset: {width: 0, height: 2},
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: conditionalVerticalScale(10, 11, 12, 12),
              }}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <TouchableOpacity
                  onPress={goPrevYear}
                  hitSlop={{top: 10, bottom: 10, left: 6, right: 6}}
                  style={{paddingHorizontal: 2}}>
                  <FeatherIcon
                    name="chevrons-left"
                    size={20}
                    color={P.primaryStrong}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={goPrevMonth}
                  hitSlop={{top: 10, bottom: 10, left: 6, right: 6}}
                  style={{paddingHorizontal: 2}}>
                  <FeatherIcon
                    name="chevron-left"
                    size={22}
                    color={P.primaryStrong}
                  />
                </TouchableOpacity>
              </View>

              <Text
                style={{
                  fontSize: conditionalFontScale(15, 15.5, 16, 16),
                  fontWeight: '700',
                  color: '#1A1A1A',
                }}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </Text>

              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <TouchableOpacity
                  onPress={goNextMonth}
                  hitSlop={{top: 10, bottom: 10, left: 6, right: 6}}
                  style={{paddingHorizontal: 2}}>
                  <FeatherIcon
                    name="chevron-right"
                    size={22}
                    color={P.primaryStrong}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={goNextYear}
                  hitSlop={{top: 10, bottom: 10, left: 6, right: 6}}
                  style={{paddingHorizontal: 2}}>
                  <FeatherIcon
                    name="chevrons-right"
                    size={20}
                    color={P.primaryStrong}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: '#F0F0F0',
                marginBottom: conditionalVerticalScale(10, 11, 12, 12),
              }}
            />

            <View style={{flexDirection: 'row'}}>
              {WEEKDAY_ABBR.map((w, wi) => (
                <View
                  key={wi}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    paddingBottom: conditionalVerticalScale(6, 7, 8, 8),
                  }}>
                  <Text
                    style={{
                      fontSize: conditionalFontScale(10, 10.5, 11, 11),
                      fontWeight: '700',
                      letterSpacing: 0.4,
                      color: '#A6ACB3',
                    }}>
                    {w}
                  </Text>
                </View>
              ))}
            </View>

            {weeks.map((week, wi) => (
              <View
                key={wi}
                style={{
                  flexDirection: 'row',
                  marginBottom: conditionalVerticalScale(4, 4, 5, 5),
                }}>
                {week.map((date, di) => {
                  if (!date) {
                    return <View key={di} style={{flex: 1, aspectRatio: 1}} />;
                  }

                  const key = toYMD(date);
                  const isSelected = selectedKey === key;
                  const isToday = key === todayKey;

                  let ringWidth = 0;
                  let ringColor = 'transparent';
                  if (!isSelected && isToday) {
                    ringWidth = 2;
                    ringColor = TODAY_RING_COLOR;
                  }

                  return (
                    <TouchableOpacity
                      key={di}
                      onPress={() => handlePickDate(date)}
                      activeOpacity={0.65}
                      style={{
                        flex: 1,
                        aspectRatio: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <View
                        style={{
                          width: '76%',
                          height: '76%',
                          borderRadius: 999,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isSelected
                            ? P.primary
                            : 'transparent',
                          borderWidth: ringWidth,
                          borderColor: ringColor,
                        }}>
                        <Text
                          style={{
                            fontSize: conditionalFontScale(12, 12.5, 13, 13),
                            fontWeight: isSelected ? '700' : '500',
                            color: isSelected ? '#FFFFFF' : '#1A1A1A',
                          }}>
                          {date.getDate()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        {/* ── Team header + summary ── */}
        <View
          style={{
            backgroundColor: WHITE_CARD_BG,
            borderRadius: conditionalScale(16, 17, 18, 18),
            borderWidth: 1,
            borderColor: WHITE_CARD_BORDER,
            paddingVertical: conditionalVerticalScale(16, 17, 18, 18),
            paddingHorizontal: conditionalScale(16, 17, 18, 18),
            marginTop: conditionalVerticalScale(16, 17, 18, 18),
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}>
            <View style={{flex: 1, paddingRight: 10}}>
              <Text
                style={{
                  fontSize: conditionalFontScale(16, 16.5, 17, 17),
                  fontWeight: '800',
                  color: '#1A1A1A',
                  letterSpacing: 0.2,
                }}>
                Team Attendance
              </Text>
              {!!teamDepartment && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 4,
                  }}>
                  <FeatherIcon
                    name="briefcase"
                    size={13}
                    color={P.primaryStrong}
                    style={{marginRight: 5}}
                  />
                  <Text
                    numberOfLines={1}
                    style={{
                      flex: 1,
                      fontSize: conditionalFontScale(12.5, 13, 13.5, 13.5),
                      fontWeight: '700',
                      color: P.primaryStrong,
                    }}>
                    {teamDepartment}
                  </Text>
                </View>
              )}
              <Text
                style={{
                  fontSize: conditionalFontScale(11.5, 12, 12.5, 12.5),
                  fontWeight: '600',
                  color: '#9AA0A6',
                  marginTop: 4,
                }}>
                {formatDateLabel(selectedDate)}
              </Text>
            </View>

            {/* Headcount badge */}
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: conditionalScale(52, 54, 58, 60),
                paddingVertical: conditionalVerticalScale(8, 9, 10, 10),
                paddingHorizontal: conditionalScale(10, 11, 12, 12),
                borderRadius: conditionalScale(12, 13, 14, 14),
                backgroundColor: P.tint,
              }}>
              <Text
                style={{
                  fontSize: conditionalFontScale(20, 21, 22, 22),
                  fontWeight: '800',
                  color: P.primaryStrong,
                }}>
                {records.length}
              </Text>
              <Text
                style={{
                  fontSize: conditionalFontScale(9.5, 10, 10.5, 10.5),
                  fontWeight: '700',
                  color: P.primaryStrong,
                  letterSpacing: 0.3,
                }}>
                {records.length === 1 ? 'MEMBER' : 'MEMBERS'}
              </Text>
            </View>
          </View>

          {/* Summary strip — only meaningful once we have data */}
          {records.length > 0 && (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                marginTop: conditionalVerticalScale(14, 15, 16, 16),
                paddingTop: conditionalVerticalScale(12, 13, 14, 14),
                borderTopWidth: 1,
                borderTopColor: '#F0F0F0',
              }}>
              {SUMMARY_ORDER.map(key => (
                <View
                  key={key}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: conditionalScale(14, 15, 16, 16),
                    marginBottom: conditionalVerticalScale(6, 6, 8, 8),
                  }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 3,
                      backgroundColor: STATUS_COLORS[key].bg,
                      marginRight: 6,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: conditionalFontScale(12, 12.5, 13, 13),
                      fontWeight: '800',
                      color: '#1A1A1A',
                      marginRight: 4,
                    }}>
                    {summary[key]}
                  </Text>
                  <Text
                    style={{
                      fontSize: conditionalFontScale(11, 11.5, 12, 12),
                      fontWeight: '600',
                      color: '#9AA0A6',
                    }}>
                    {SUMMARY_SHORT[key]}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Results table (fixed full-width, no horizontal scroll) ── */}
        <View
          style={{
            backgroundColor: WHITE_CARD_BG,
            borderRadius: conditionalScale(16, 17, 18, 18),
            borderWidth: 1,
            borderColor: WHITE_CARD_BORDER,
            paddingVertical: conditionalVerticalScale(14, 15, 16, 16),
            paddingHorizontal: conditionalScale(12, 13, 14, 14),
            marginTop: conditionalVerticalScale(14, 15, 16, 16),
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
          }}>
          {isLoading ? (
            <View
              style={{
                paddingVertical: conditionalVerticalScale(40, 44, 48, 52),
                alignItems: 'center',
              }}>
              <CustomIndicator />
            </View>
          ) : records.length === 0 ? (
            <View
              style={{
                paddingVertical: conditionalVerticalScale(34, 38, 42, 46),
                alignItems: 'center',
              }}>
              <FeatherIcon
                name={hasFetched ? 'inbox' : 'calendar'}
                size={28}
                color="#C7CDD3"
                style={{marginBottom: 8}}
              />
              <Text
                style={{
                  color: T.subtitleText,
                  fontSize: conditionalFontScale(13, 14, 15, 15),
                  textAlign: 'center',
                }}>
                {hasFetched
                  ? 'No attendance records for this date.'
                  : 'Select a date to view team attendance.'}
              </Text>
            </View>
          ) : (
            <View style={{width: '100%'}}>
              {/* Table header row */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingBottom: conditionalVerticalScale(9, 10, 11, 11),
                  marginBottom: conditionalVerticalScale(2, 2, 3, 3),
                  borderBottomWidth: 1.5,
                  borderBottomColor: '#ECECEC',
                }}>
                {[
                  {label: 'WORKER', flex: 2, align: 'left'},
                  {label: 'IN', flex: 1, align: 'center'},
                  {label: 'OUT', flex: 1, align: 'center'},
                  {label: 'STATUS', flex: 1.4, align: 'center'},
                ].map((h, hi) => (
                  <Text
                    key={hi}
                    style={{
                      flex: h.flex,
                      textAlign: h.align,
                      fontSize: conditionalFontScale(10, 10.5, 11, 11),
                      fontWeight: '800',
                      letterSpacing: 0.4,
                      color: '#A6ACB3',
                      paddingHorizontal: 3,
                    }}>
                    {h.label}
                  </Text>
                ))}
              </View>

              {/* Table body rows */}
              {records.map((rec, ri) => {
                const status = deriveStatus(rec);
                const chip = STATUS_COLORS[status] || {
                  soft: '#F2F2F2',
                  text: '#757575',
                };
                const chipLabel = STATUS_LABELS_SHORT[status] || 'Off day';
                const name = rec.WorkerName || '';
                return (
                  <View
                    key={rec.AttendanceRecId || ri}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: conditionalVerticalScale(10, 11, 12, 12),
                      backgroundColor: ri % 2 === 1 ? '#FAFBFC' : '#FFFFFF',
                      borderRadius: 8,
                    }}>
                    {/* Worker name */}
                    <Text
                      numberOfLines={2}
                      style={{
                        flex: 2,
                        paddingHorizontal: 3,
                        fontSize: conditionalFontScale(12, 12.5, 13, 13),
                        fontWeight: '600',
                        color: '#1A1A1A',
                      }}>
                      {name || '—'}
                    </Text>

                    {/* Clock in */}
                    <Text
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        paddingHorizontal: 3,
                        fontSize: conditionalFontScale(11.5, 12, 12.5, 12.5),
                        fontWeight: '600',
                        color: '#1A1A1A',
                      }}>
                      {formatSecondsToTime(rec.ClockIn)}
                    </Text>

                    {/* Clock out */}
                    <Text
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        paddingHorizontal: 3,
                        fontSize: conditionalFontScale(11.5, 12, 12.5, 12.5),
                        fontWeight: '600',
                        color: '#1A1A1A',
                      }}>
                      {formatSecondsToTime(rec.ClockOut)}
                    </Text>

                    {/* Status chip */}
                    <View
                      style={{
                        flex: 1.4,
                        alignItems: 'center',
                        paddingHorizontal: 3,
                      }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: chip.soft,
                          borderRadius: 999,
                          paddingVertical: 4,
                          paddingHorizontal: 8,
                          maxWidth: '100%',
                        }}>
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: chip.bg || chip.text,
                            marginRight: 5,
                          }}
                        />
                        <Text
                          numberOfLines={1}
                          style={{
                            flexShrink: 1,
                            color: chip.text,
                            fontWeight: '700',
                            fontSize: conditionalFontScale(10, 10.5, 11, 11),
                          }}>
                          {chipLabel}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </ActionPaneContainer>
  );
};

export default DFTeamAttendanceScreen;
