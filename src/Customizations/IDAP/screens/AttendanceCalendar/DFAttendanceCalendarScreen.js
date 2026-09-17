/* eslint-disable no-shadow */
/* eslint-disable curly */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useCallback, useEffect, useMemo} from 'react';
import {
  Text,
  View,
  ScrollView,
  BackHandler,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {Dropdown} from 'react-native-element-dropdown';
import FeatherIcon from 'react-native-vector-icons/Feather';

import {FindPayPeriod} from '../../API/AttendanceCalendar/Findpayperiod';
import {FindAttendanceCalendar} from '../../API/AttendanceCalendar/Findattendancecalendar';
import {findEmployeePenaltyLeaves} from '../../API/Leaves/findEmployeePenaltyLeaves';

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

const WEEKDAY_ABBR = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Explicit white — this card must always read white regardless of app theme.
const WHITE_CARD_BG = '#FFFFFF';
const WHITE_CARD_BORDER = '#E5E5E5';

// Fixed legend colors (point 7 of the spec) — these carry real-world meaning
// (green/red/yellow/grey/blue) so they stay constant regardless of the
// app's light/dark palette, same reasoning as WHITE_CARD_BG above.
// `soft` is a pale tint of `bg`, used for legend chip backgrounds so the
// chips read as calm labels rather than shouting the same saturated color
// used for the actual calendar dots.
const STATUS_COLORS = {
  onTime: {bg: '#2E7D32', text: '#1B5E20', soft: '#E6F4EA'}, // green
  irregular: {bg: '#C62828', text: '#B71C1C', soft: '#FDECEA'}, // red
  // "missing" is the waiting/attention family — slate, not yellow
  // (statusWaiting* in Tokens.js).

  // Mustard — was the slate "waiting" family (AppTokens.statusWaiting*).
  // A hardcoded, theme-independent tone, same reasoning as WHITE_CARD_BG:
  // this needs to read as "needs attention" at a glance regardless of
  // light/dark mode.
  missing: {bg: '#D4A017', text: '#8A6D0B', soft: '#FBF1D6'},

  absent: {
    bg: AppTokens.statusDraft,
    text: AppTokens.statusDraftText,
    soft: AppTokens.statusDraftBg,
  }, // unchanged

  leave: {bg: brand.primary, text: brand.primaryStrong, soft: brand.tint}, // unchanged

  // Grey — was a light blue (AppTokens.teal). A genuine off-day (weekend
  // etc.) should read as neutral/non-issue, and grey is the more standard
  // "nothing happened here" signal than blue, which was previously close
  // enough to "Leave"'s blue to risk confusion at a glance.
  offDay: {bg: '#9E9E9E', text: '#616161', soft: '#F1F1F1'},
};

const STATUS_LABELS = {
  onTime: 'On time',
  irregular: 'Late arrival / early departure',
  missing: 'Missing clock in/out',
  absent: 'Absent',
  leave: 'Leave',
  offDay: 'Off day',
};

const LEGEND_ITEMS = [
  {key: 'onTime', label: 'On time'},
  {key: 'irregular', label: 'Late arrival/early departure'},
  {key: 'missing', label: 'Missing clock in/out'},
  {key: 'absent', label: 'Absent'},
  {key: 'leave', label: 'Leave'},
  {key: 'offDay', label: 'Off day'},
];

// "Today" is a separate, temporal marker — not an attendance status — so it
// gets its own distinct blue, drawn as a ring rather than a fill. That keeps
// it visually separate from "Leave" (which is also blue) and lets a leave
// day that happens to be today show both: the leave fill plus the today ring.
const TODAY_RING_COLOR = brand.primaryStrong;

const startOfDay = d => {
  if (!d) return null;
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};

const formatRange = (start, end) => {
  if (!start || !end) return 'Select pay period';
  const s = `${String(start.getDate()).padStart(2, '0')} ${
    MONTH_ABBR[start.getMonth()]
  }`;
  const e = `${String(end.getDate()).padStart(2, '0')} ${
    MONTH_ABBR[end.getMonth()]
  } ${end.getFullYear()}`;
  return `${s} - ${e}`;
};

const formatSecondsToTime = seconds => {
  if (!seconds && seconds !== 0) return '—';
  if (seconds === 0) return '—';
  const hh = Math.floor(seconds / 3600);
  const mm = Math.floor((seconds % 3600) / 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

// Local (never UTC/toISOString) — avoids shifting the day backward for
// positive-UTC-offset zones like Pakistan.
const toYMD = d => {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Status derivation for the calendar dots / detail card.
//
// IMPORTANT (found via debug logging against real AX data): on a genuine
// off-day (weekend etc.) AX still returns a row with ClockIn/ClockOut both
// null — same as a real "forgot to clock in" workday — but it correctly
// sets IsAbsent to "No" for the off-day and "Yes" for the real miss. So
// "both clock times null" only means "missing" when IsAbsent is true or
// exactly one side is null; "both null AND IsAbsent false" is an off-day,
// shown with its own muted color instead of being confused with a real miss.
const deriveStatus = rec => {
  if (rec.IsLeave) return 'leave';
  if (rec.IsAbsent) return 'absent';

  const hasClockIn = rec.ClockIn !== null && rec.ClockIn !== undefined;
  const hasClockOut = rec.ClockOut !== null && rec.ClockOut !== undefined;

  if (!hasClockIn && !hasClockOut) return 'offDay';
  if (!hasClockIn || !hasClockOut) return 'missing'; // genuine partial miss

  if (rec.IsLateArrival || rec.IsEarlyDeparture) return 'irregular';
  return 'onTime';
};

// Builds a standard 7-column month grid; leading/trailing cells are null.
const buildMonthGrid = (year, month) => {
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstOfMonth.getDay(); // 0 = Sunday

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
};

// A pay period can span a month boundary — this returns every {year, month}
// touched by the period so the calendar card can render one block per month.
const getMonthsInRange = (start, end) => {
  if (!start || !end) return [];
  const months = [];
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= last) {
    months.push({year: cursor.getFullYear(), month: cursor.getMonth()});
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return months;
};

const DFAttendanceCalendarScreen = () => {
  const navigation = useNavigation();
  const T = useAppTokens();
  const P = usePalette();
  const route = useRoute();

  const {employeeId, userData: routeUserData} = route.params || {};

  const reduxUserData = useSelector(state => state.user && state.user.userData);
  const effectivePersonnelNumber =
    employeeId || (reduxUserData && reduxUserData.employeeId);

  const [payPeriods, setPayPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [isLoadingPeriods, setIsLoadingPeriods] = useState(true);

  // The whole period's records are fetched in one call now — no date param.
  const [periodRecords, setPeriodRecords] = useState([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

  // Tapping a highlighted date shows its detail card below the calendar.
  const [selectedDateKey, setSelectedDateKey] = useState(null);

  // Disables the outer ScrollView while the pay-period dropdown's list is
  // open, so its own list gets sole ownership of vertical touch/scroll —
  // no responder conflict, no need for a full-screen modal takeover.
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);

  const [penaltyLeaves, setPenaltyLeaves] = useState([]);

  const loadPenaltyLeaves = useCallback(async () => {
    if (!effectivePersonnelNumber) {
      setPenaltyLeaves([]);
      return;
    }
    try {
      const data = await findEmployeePenaltyLeaves({
        employeeId: effectivePersonnelNumber,
      });
      console.log('[Attendance] Penalty leaves:', data);
      setPenaltyLeaves(data || []);
    } catch (error) {
      setPenaltyLeaves([]);
    }
  }, [effectivePersonnelNumber]);

  useFocusEffect(
    useCallback(() => {
      loadPenaltyLeaves();
    }, [loadPenaltyLeaves]),
  );

  const pickCurrentPeriod = periods => {
    const today = startOfDay(new Date());
    const matching = periods.find(
      p =>
        p.PayPeriodStart &&
        p.PayPeriodEnd &&
        today >= startOfDay(p.PayPeriodStart) &&
        today <= startOfDay(p.PayPeriodEnd),
    );
    if (matching) return matching;

    const past = periods.filter(
      p => p.PayPeriodStart && startOfDay(p.PayPeriodStart) <= today,
    );
    return past.length > 0 ? past[0] : periods[0] || null;
  };

  const loadPayPeriods = useCallback(async () => {
    setIsLoadingPeriods(true);
    try {
      const periods = await FindPayPeriod();
      setPayPeriods(periods || []);
      const current = pickCurrentPeriod(periods || []);
      setSelectedPeriod(current);
    } catch (error) {
      setPayPeriods([]);
      setSelectedPeriod(null);
    } finally {
      setIsLoadingPeriods(false);
    }
  }, []);

  const loadPeriodRecords = useCallback(async () => {
    const periodRecId = selectedPeriod && selectedPeriod.PayPeriodRecId;
    if (!periodRecId || !effectivePersonnelNumber) {
      setPeriodRecords([]);
      return;
    }
    setIsLoadingRecords(true);
    try {
      const records = await FindAttendanceCalendar(
        periodRecId,
        effectivePersonnelNumber,
      );
      setPeriodRecords(records || []);
    } catch (error) {
      console.error('[Attendance] Failed to fetch attendance:', error);
      setPeriodRecords([]);
    } finally {
      setIsLoadingRecords(false);
    }
  }, [selectedPeriod, effectivePersonnelNumber]);

  useFocusEffect(
    useCallback(() => {
      loadPayPeriods();
    }, [loadPayPeriods]),
  );

  // Whenever the selected pay period changes, pull that period's full set
  // of attendance records in one shot (no per-date fetching anymore).
  useEffect(() => {
    setSelectedDateKey(null);
    loadPeriodRecords();
  }, [selectedPeriod]);

  const handleGoBack = useCallback(() => {
    navigation.reset({index: 0, routes: [{name: 'MainDashboard'}]});
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleGoBack();
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [handleGoBack]),
  );

  const handleRefresh = useCallback(() => {
    if (selectedPeriod) {
      loadPeriodRecords();
    } else {
      loadPayPeriods();
    }
  }, [selectedPeriod, loadPeriodRecords, loadPayPeriods]);

  const periodOptions = useMemo(
    () =>
      payPeriods.map(p => ({
        label: formatRange(p.PayPeriodStart, p.PayPeriodEnd),
        value: p.PayPeriodRecId,
      })),
    [payPeriods],
  );

  const handlePeriodChange = useCallback(
    item => {
      const period = payPeriods.find(p => p.PayPeriodRecId === item.value);
      setSelectedPeriod(period || null);
    },
    [payPeriods],
  );

  // 👇 ADD THE NEW renderPeriodItem HERE
  const renderPeriodItem = useCallback(
    (item, selected) => {
      const isActive =
        selected ??
        (selectedPeriod && item.value === selectedPeriod.PayPeriodRecId);
      return (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: conditionalVerticalScale(11, 12, 13, 13),
            paddingHorizontal: conditionalScale(14, 15, 16, 16),
            backgroundColor: isActive ? P.tint : 'transparent',
          }}>
          <Text
            style={{
              fontSize: conditionalFontScale(13, 13.5, 14, 14),
              color: isActive ? P.primaryStrong : '#1A1A1A',
              fontWeight: isActive ? '700' : '500',
            }}>
            {item.label}
          </Text>
          {isActive && (
            <FeatherIcon name="check" size={16} color={P.primaryStrong} />
          )}
        </View>
      );
    },
    [selectedPeriod, P.primary],
  );

  // Map each record to its YYYY-MM-DD key for O(1) lookup while rendering
  // the calendar grid.
  const recordsByDate = useMemo(() => {
    const map = {};
    periodRecords.forEach(rec => {
      const key = toYMD(rec.AttendanceDate);
      if (key) map[key] = rec;
    });
    return map;
  }, [periodRecords]);

  const periodStart = selectedPeriod
    ? startOfDay(selectedPeriod.PayPeriodStart)
    : null;
  const periodEnd = selectedPeriod
    ? startOfDay(selectedPeriod.PayPeriodEnd)
    : null;

  const monthsInRange = useMemo(
    () => getMonthsInRange(periodStart, periodEnd),
    [periodStart, periodEnd],
  );

  const selectedRecord = selectedDateKey
    ? recordsByDate[selectedDateKey]
    : null;

  const todayKey = toYMD(new Date());

  // Tally each status across the whole period for the summary card. Uses
  // the same deriveStatus as the calendar dots, so the numbers always
  // agree with what's drawn on the grid.
  const summaryCounts = useMemo(() => {
    const counts = {
      onTime: 0,
      irregular: 0,
      missing: 0,
      absent: 0,
      leave: 0,
      offDay: 0,
    };
    periodRecords.forEach(rec => {
      const status = deriveStatus(rec);
      if (counts[status] !== undefined) counts[status] += 1;
    });
    return counts;
  }, [periodRecords]);

  const now = new Date();
  const currentMonthPenaltyCount = useMemo(
    () =>
      penaltyLeaves
        .filter(item =>
          monthsInRange.some(
            ({year, month}) =>
              item.PenaltyMonth === MONTH_NAMES[month] &&
              Number(item.PenaltyYear) === year,
          ),
        )
        .reduce((sum, item) => sum + Number(item.PenaltyLeaveDays || 0), 0),
    [penaltyLeaves, monthsInRange],
  );

  return (
    <ActionPaneContainer
      pageTitle="Attendance Insights"
      isBackButton={true}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      onBackPress={handleGoBack}
      onRefresh={handleRefresh}
      showPageTitleRow={true}
      showSearchBar={false}>
      <ScrollView
        // Disabled while the pay-period dropdown is open — see
        // isPeriodDropdownOpen above — so the dropdown's own list handles
        // all vertical touches with no responder conflict.
        scrollEnabled={!isPeriodDropdownOpen}
        contentContainerStyle={{
          paddingHorizontal: conditionalScale(14, 15, 16, 17),
          paddingTop: conditionalVerticalScale(12, 13, 14, 15),
          paddingBottom: conditionalVerticalScale(30, 34, 38, 42),
        }}
        showsVerticalScrollIndicator={false}>
        {/* ── Pay period selector ── */}
        <Text style={styles.DSR_Label}>Pay period</Text>
        {isLoadingPeriods ? (
          <View
            style={[
              styles.DSR_Input,
              {
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
              },
            ]}>
            <ActivityIndicator size="small" color={P.primaryStrong} />
          </View>
        ) : (
          <Dropdown
            style={styles.DSR_Input}
            data={periodOptions}
            labelField="label"
            valueField="value"
            placeholder="Select pay period"
            value={selectedPeriod && selectedPeriod.PayPeriodRecId}
            onChange={handlePeriodChange}
            autoScroll={false}
            placeholderStyle={styles.DSR_DropdownPlaceholder}
            selectedTextStyle={styles.DSR_DropdownSelectedText}
            itemTextStyle={styles.DSR_DropdownItemText}
            activeColor={P.tint}
            containerStyle={[styles.DSR_DropdownContainer, {zIndex: 1000}]}
            itemContainerStyle={styles.DSR_DropdownItemContainer}
            maxHeight={320}
            dropdownPosition="auto"
            iconStyle={styles.DSR_DropdownIcon}
            renderItem={renderPeriodItem}
            search
            searchPlaceholder="Search pay period..."
            inputSearchStyle={[
              styles.DSR_DropdownInputSearch,
              {
                color: T.text || P.text || '#1A1A1A',
                backgroundColor: T.cardBg || P.cardBg || '#FFFFFF',
              },
            ]}
            // Fix for the earlier "can't scroll" issue, without taking over
            // the whole screen like mode="modal" did: while the list is
            // open we disable the outer ScrollView entirely (see
            // isPeriodDropdownOpen / scrollEnabled above), so there's no
            // responder conflict for the parent to win. The dropdown still
            // renders in its normal inline position under the field.
            onFocus={() => setIsPeriodDropdownOpen(true)}
            onBlur={() => setIsPeriodDropdownOpen(false)}
            flatListProps={{nestedScrollEnabled: true}}
            // Custom row so the currently-selected pay period stays visibly
            // marked (tinted background + check icon) while the list is
            // open, not just briefly on press.
          />
        )}

        {!selectedPeriod ? (
          <View
            style={{
              paddingVertical: conditionalVerticalScale(40, 44, 48, 52),
              alignItems: 'center',
            }}>
            <Text
              style={{
                color: T.subtitleText,
                fontSize: conditionalFontScale(13, 14, 15, 15),
              }}>
              No pay period data available.
            </Text>
          </View>
        ) : (
          <>
            {/* ── Period summary ── */}
            <View
              style={{
                backgroundColor: WHITE_CARD_BG,
                borderRadius: conditionalScale(16, 17, 18, 18),
                borderWidth: 1,
                borderColor: WHITE_CARD_BORDER,
                padding: conditionalScale(14, 15, 16, 16),
                marginTop: conditionalVerticalScale(16, 17, 18, 18),
                marginBottom: conditionalVerticalScale(12, 13, 14, 14),
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
                  marginBottom: conditionalVerticalScale(12, 13, 14, 14),
                  paddingBottom: conditionalVerticalScale(10, 11, 12, 12),
                  borderBottomWidth: 1,
                  borderBottomColor: '#F0F0F0',
                }}>
                <Text
                  style={{
                    fontSize: conditionalFontScale(13, 13.5, 14, 14),
                    fontWeight: '700',
                    color: '#1A1A1A',
                  }}>
                  Attendance summary
                </Text>
                <Text
                  style={{
                    fontSize: conditionalFontScale(11, 11.5, 12, 12),
                    fontWeight: '600',
                    color: '#9AA0A6',
                  }}>
                  {periodRecords.length} days
                </Text>
              </View>

              <View>
                {[0, 1].map(rowIdx => (
                  <View
                    key={rowIdx}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'stretch',
                      marginBottom: conditionalVerticalScale(14, 15, 16, 16),
                    }}>
                    {LEGEND_ITEMS.slice(rowIdx * 3, rowIdx * 3 + 3).map(
                      item => (
                        <View
                          key={item.key}
                          style={{
                            flex: 1,
                            paddingRight: conditionalScale(6, 7, 8, 8),
                          }}>
                          <View
                            style={{
                              flex: 1,
                              flexDirection: 'row',
                              alignItems: 'flex-start',
                              marginBottom: 3,
                            }}>
                            <View
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: 2,
                                backgroundColor: STATUS_COLORS[item.key].bg,
                                marginRight: 5,
                                marginTop: 3,
                              }}
                            />
                            <Text
                              numberOfLines={2}
                              style={{
                                flex: 1,
                                flexShrink: 1,
                                fontSize: conditionalFontScale(
                                  9.5,
                                  10,
                                  10.5,
                                  10.5,
                                ),
                                lineHeight: conditionalFontScale(
                                  13,
                                  13.5,
                                  14,
                                  14,
                                ),
                                fontWeight: '600',
                                color: '#9AA0A6',
                              }}>
                              {item.label}
                            </Text>
                          </View>
                          <Text
                            style={{
                              fontSize: conditionalFontScale(18, 19, 20, 20),
                              fontWeight: '700',
                              color: '#1A1A1A',
                            }}>
                            {summaryCounts[item.key]}
                          </Text>
                        </View>
                      ),
                    )}
                  </View>
                ))}
              </View>

              {/* Penalty leaves — separate from the status legend since it isn't
      derived from periodRecords/deriveStatus, it's this calendar month's
      penalty count regardless of the selected pay period. */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: conditionalVerticalScale(10, 11, 12, 12),
                  borderTopWidth: 1,
                  borderTopColor: '#F0F0F0',
                }}>
                <Text
                  style={{
                    fontSize: conditionalFontScale(11.5, 12, 12.5, 12.5),
                    fontWeight: '600',
                    color: '#9AA0A6',
                  }}>
                  Penalty leaves this month
                </Text>
                <Text
                  style={{
                    fontSize: conditionalFontScale(16, 17, 18, 18),
                    fontWeight: '700',
                    color: currentMonthPenaltyCount > 0 ? '#C62828' : '#1A1A1A',
                  }}>
                  {currentMonthPenaltyCount}
                </Text>
              </View>
            </View>

            {/* ── Calendar card ──
                Columns/cells are sized with flex + aspectRatio (not fixed
                pixels) so the 7-day grid always fills the card's full width
                on any screen, instead of leaving a gap on the right. */}
            <View
              style={{
                backgroundColor: WHITE_CARD_BG,
                borderRadius: conditionalScale(16, 17, 18, 18),
                borderWidth: 1,
                borderColor: WHITE_CARD_BORDER,
                paddingVertical: conditionalVerticalScale(14, 15, 16, 16),
                paddingHorizontal: conditionalScale(10, 11, 12, 12),
                marginTop: conditionalVerticalScale(16, 17, 18, 18),
                shadowColor: '#000',
                shadowOffset: {width: 0, height: 2},
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 2,
              }}>
              {isLoadingRecords ? (
                <View
                  style={{
                    paddingVertical: conditionalVerticalScale(40, 44, 48, 52),
                    alignItems: 'center',
                  }}>
                  <CustomIndicator />
                </View>
              ) : (
                monthsInRange.map(({year, month}, monthIdx) => {
                  const weeks = buildMonthGrid(year, month);
                  return (
                    <View key={`${year}-${month}`}>
                      {monthIdx > 0 && (
                        <View
                          style={{
                            height: 1,
                            backgroundColor: '#F0F0F0',
                            marginVertical: conditionalVerticalScale(
                              14,
                              15,
                              16,
                              16,
                            ),
                          }}
                        />
                      )}

                      <Text
                        style={{
                          fontSize: conditionalFontScale(15, 15.5, 16, 16),
                          fontWeight: '700',
                          color: '#1A1A1A',
                          marginBottom: conditionalVerticalScale(4, 4, 5, 5),
                          textAlign: 'center',
                        }}>
                        {MONTH_NAMES[month]} {year}
                      </Text>

                      <View
                        style={{
                          height: 1,
                          backgroundColor: '#F0F0F0',
                          marginBottom: conditionalVerticalScale(
                            10,
                            11,
                            12,
                            12,
                          ),
                        }}
                      />

                      <View style={{flexDirection: 'row'}}>
                        {WEEKDAY_ABBR.map((w, wi) => (
                          <View
                            key={wi}
                            style={{
                              flex: 1,
                              alignItems: 'center',
                              paddingBottom: conditionalVerticalScale(
                                6,
                                7,
                                8,
                                8,
                              ),
                            }}>
                            <Text
                              style={{
                                fontSize: conditionalFontScale(
                                  10,
                                  10.5,
                                  11,
                                  11,
                                ),
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
                              return (
                                <View
                                  key={di}
                                  style={{flex: 1, aspectRatio: 1}}
                                />
                              );
                            }

                            const key = toYMD(date);
                            const inPeriod =
                              periodStart &&
                              periodEnd &&
                              date >= periodStart &&
                              date <= periodEnd;
                            const record = inPeriod ? recordsByDate[key] : null;
                            const status = record ? deriveStatus(record) : null;
                            const isSelected = selectedDateKey === key;
                            const isToday = inPeriod && key === todayKey;

                            // Selection (a live tap) takes priority over the
                            // today ring when both apply to the same cell —
                            // otherwise tapping today would look unchanged.
                            let ringWidth = 0;
                            let ringColor = 'transparent';
                            if (isSelected) {
                              ringWidth = 2;
                              ringColor = P.primary;
                            } else if (isToday) {
                              ringWidth = 2;
                              ringColor = TODAY_RING_COLOR;
                            }

                            return (
                              <TouchableOpacity
                                key={di}
                                disabled={!inPeriod}
                                onPress={() => setSelectedDateKey(key)}
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
                                    backgroundColor: status
                                      ? STATUS_COLORS[status].bg
                                      : 'transparent',
                                    borderWidth: ringWidth,
                                    borderColor: ringColor,
                                  }}>
                                  <Text
                                    style={{
                                      fontSize: conditionalFontScale(
                                        12,
                                        12.5,
                                        13,
                                        13,
                                      ),
                                      fontWeight: status ? '700' : '500',
                                      color: status
                                        ? '#FFFFFF'
                                        : inPeriod
                                        ? '#1A1A1A'
                                        : '#D6D6D6',
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
                  );
                })
              )}
            </View>

            {/* ── Selected day detail ── */}
            {selectedDateKey && (
              <View
                style={{
                  backgroundColor: WHITE_CARD_BG,
                  borderRadius: conditionalScale(16, 17, 18, 18),
                  borderWidth: 1,
                  borderColor: WHITE_CARD_BORDER,
                  padding: conditionalScale(14, 15, 16, 16),
                  marginTop: conditionalVerticalScale(14, 15, 16, 16),
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
                    marginBottom: conditionalVerticalScale(12, 13, 14, 14),
                    paddingBottom: conditionalVerticalScale(10, 11, 12, 12),
                    borderBottomWidth: 1,
                    borderBottomColor: '#F0F0F0',
                  }}>
                  <Text
                    style={{
                      fontSize: conditionalFontScale(14, 14.5, 15, 15),
                      fontWeight: '700',
                      color: '#1A1A1A',
                    }}>
                    {selectedDateKey}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSelectedDateKey(null)}
                    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                    <FeatherIcon name="x" size={18} color="#999" />
                  </TouchableOpacity>
                </View>

                {!selectedRecord ? (
                  <Text
                    style={{
                      color: T.subtitleText,
                      fontSize: conditionalFontScale(13, 14, 15, 15),
                    }}>
                    No attendance record found for {selectedDateKey}.
                  </Text>
                ) : (
                  <>
                    {(() => {
                      const status = deriveStatus(selectedRecord);
                      // null = off-day (see deriveStatus comment) — show a
                      // plain neutral chip instead of indexing colors/labels
                      // that don't have an entry for "no status".
                      const chipColors = status
                        ? STATUS_COLORS[status]
                        : {soft: '#F2F2F2', text: '#757575'};
                      const chipLabel = status
                        ? STATUS_LABELS[status]
                        : 'Off day';
                      return (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: conditionalVerticalScale(
                              10,
                              11,
                              12,
                              12,
                            ),
                          }}>
                          <Text
                            style={{
                              color: '#666',
                              fontSize: conditionalFontScale(12, 12.5, 13, 13),
                            }}>
                            Status
                          </Text>
                          <View
                            style={{
                              backgroundColor: chipColors.soft,
                              borderRadius: 999,
                              paddingVertical: 3,
                              paddingHorizontal: 10,
                            }}>
                            <Text
                              style={{
                                color: chipColors.text,
                                fontWeight: '700',
                                fontSize: conditionalFontScale(
                                  11,
                                  11.5,
                                  12,
                                  12,
                                ),
                              }}>
                              {chipLabel}
                            </Text>
                          </View>
                        </View>
                      );
                    })()}

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 6,
                      }}>
                      <Text
                        style={{
                          color: '#666',
                          fontSize: conditionalFontScale(12, 12.5, 13, 13),
                        }}>
                        Clock in
                      </Text>
                      <Text
                        style={{
                          color: '#1A1A1A',
                          fontWeight: '600',
                          fontSize: conditionalFontScale(12, 12.5, 13, 13),
                        }}>
                        {formatSecondsToTime(selectedRecord.ClockIn)}
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}>
                      <Text
                        style={{
                          color: '#666',
                          fontSize: conditionalFontScale(12, 12.5, 13, 13),
                        }}>
                        Clock out
                      </Text>
                      <Text
                        style={{
                          color: '#1A1A1A',
                          fontWeight: '600',
                          fontSize: conditionalFontScale(12, 12.5, 13, 13),
                        }}>
                        {formatSecondsToTime(selectedRecord.ClockOut)}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ActionPaneContainer>
  );
};

export default DFAttendanceCalendarScreen;
