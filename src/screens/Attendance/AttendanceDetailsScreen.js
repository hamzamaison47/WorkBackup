/* eslint-disable react-native/no-inline-styles */
/* eslint-disable no-bitwise */
/* eslint-disable curly */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import moment from 'moment';
import {useSelector} from 'react-redux';
import {useIsFocused, useNavigation} from '@react-navigation/native';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import AlertModal from '../../components/Alert/AlertModal';
import {getRegisterDetailsByDate} from '../../API/Attendance/getRegisterDetailsByDate';
import {MonthFilter} from '../../components/Attendance/AttendanceDetailsComponents';

/** <<< EDIT THIS IF YOUR SCREENS ARE IN A NESTED STACK >>> */
const PARENT_STACK_NAME = null;

/* ------------ utils ------------ */
const parseISO = iso =>
  iso ? moment.parseZone(iso, moment.ISO_8601, true).utc() : null;

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

/** seconds → "HH:MM:SS" duration */
const secToHHMMSS = sec => {
  if (!Number.isFinite(sec)) return '--:--';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(
    s,
  ).padStart(2, '0')}`;
};

/** Convert 24h h:m to 12h with AM/PM */
const to12h = (h24, m = 0) => {
  if (!Number.isFinite(h24) || !Number.isFinite(m)) return '--';
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

/** Accepts "HH:MM(:SS)" or seconds. Returns 12h with AM/PM for in/out display */
const formatInOut12h = value => {
  if (isBlankTime(value)) return '--';
  if (typeof value === 'string' && value.includes(':')) {
    const [hStr, mStr] = value.split(':');
    const h = Number(hStr);
    const m = Number(mStr);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return '--';
    return to12h(h, m);
  }
  const sec = Number(value);
  if (!Number.isFinite(sec)) return '--';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return to12h(h, m);
};

/** Accepts "HH:MM(:SS)" or seconds for duration fields */
const formatDuration = value => {
  if (isBlankTime(value)) return '--:--';
  if (typeof value === 'string' && value.includes(':')) {
    return value.length === 5 ? `${value}:00` : value;
  }
  const n = Number(value);
  return secToHHMMSS(n);
};

/* ------------ color helpers ------------ */
const DEFAULT_COLOR = '#6ce66c';

const isHex = c => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(c || ''));
const clamp01 = n => Math.max(0, Math.min(1, n));

const hexToRgb = hex => {
  if (!isHex(hex)) return {r: 108, g: 230, b: 108};
  let h = hex.replace('#', '');
  if (h.length === 3)
    h = h
      .split('')
      .map(ch => ch + ch)
      .join('');
  const num = parseInt(h, 16);
  return {r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255};
};
const rgba = (hex, a) => {
  const {r, g, b} = hexToRgb(hex);
  return `rgba(${r},${g},${b},${clamp01(a)})`;
};
const readableTextOn = hex => {
  const {r, g, b} = hexToRgb(hex);
  const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return L > 0.7 ? '#1A1A1A' : '#0E1521';
};

/** Build a guaranteed-unique, stable key for FlatList */
const buildKey = (d, idx) => {
  const recId = d.RecId ?? d.RecID ?? d.recId ?? d.ID ?? d.Id ?? d.id ?? '';
  const parts = [
    d.AttendanceDate || 'NA',
    d.ClockIn || 'NA',
    d.ClockOut || 'NA',
    recId || 'noid',
    idx,
  ];
  return String(parts.join('|'));
};

/* ---------- NEW: robust normalizers for params ---------- */

/** Normalize any date-ish value to "YYYY-MM-DD" (local) */
const normalizeDateISO = v => {
  if (!v) return '';
  // If already YYYY-MM-DD
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  // ISO with time or other → moment
  const m =
    typeof v === 'string' && v.length >= 10 ? moment(v) : moment(parseISO(v));
  if (!m || !m.isValid()) return '';
  return m.local().format('YYYY-MM-DD');
};

/** Normalize mixed time formats to strict "HH:mm" (24h) */
const normalizeTimeTo24h = v => {
  if (isBlankTime(v)) return '';
  // seconds (number or numeric string)
  if (/^\d{1,5}$/.test(String(v))) {
    const sec = Number(v);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  const sv = String(v).trim();

  // 12h like "9:05 AM" / "09:05 pm"
  const t12 = moment(sv, ['h:mm A', 'hh:mm A'], true);
  if (t12.isValid()) return t12.format('HH:mm');

  // 24h "HH:mm" or "HH:mm:ss"
  const t24 = moment(sv, ['HH:mm', 'HH:mm:ss'], true);
  if (t24.isValid()) return t24.format('HH:mm');

  // Last resort: parse loosely
  const mx = moment(sv);
  return mx.isValid() ? mx.format('HH:mm') : '';
};

const AttendanceDetailsScreen = () => {
  const navigation = useNavigation();
  const {userData} = useSelector(state => state.user || {});
  const [month, setMonth] = useState(moment());
  const [raw, setRaw] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [alert, setAlert] = useState({visible: false, text: ''});

  const isFocused = useIsFocused();

  const fromDate = useMemo(
    () => moment(month).startOf('month').format('YYYY-MM-DD'),
    [month],
  );
  const toDate = useMemo(
    () => moment(month).endOf('month').format('YYYY-MM-DD'),
    [month],
  );

  const fetchData = useCallback(async () => {
    if (!userData?.employeeId) return;
    try {
      setLoading(true);

      const list = await getRegisterDetailsByDate({
        employeeId: userData.employeeId,
        fromDate,
        toDate,
      });

      const arr = normalizeArray(list)
        .filter(Boolean)
        .map((d, idx) => {
          const dt = parseISO(d.AttendanceDate);
          return {
            ...d,
            __parsedDate: dt,
            _key: buildKey(d, idx),
          };
        });

      setRaw(arr);
    } catch (e) {
      setAlert({
        visible: true,
        text: e?.message || 'Failed to load attendance details.',
      });
      setRaw([]);
    } finally {
      setLoading(false);
    }
  }, [userData?.employeeId, fromDate, toDate]);

  useEffect(() => {
    if (isFocused) fetchData();
  }, [isFocused, fetchData]);

  useEffect(() => {
    if (isFocused) fetchData();
  }, [month, isFocused, fetchData]);

  useEffect(() => {
    const filtered = raw
      .filter(it => it.__parsedDate && it.__parsedDate.isSame(month, 'month'))
      .sort((a, b) => a.__parsedDate.valueOf() - b.__parsedDate.valueOf());
    setData(filtered);
  }, [raw, month]);

  useEffect(() => {
    if (__DEV__) {
      const s = [...new Set(raw.map(r => (r.Status || '').toString()))];
      console.log('Sample statuses this month:', s);
    }
  }, [raw]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  const goTo = useCallback(
    (screenName, params) => {
      if (PARENT_STACK_NAME) {
        navigation.navigate(PARENT_STACK_NAME, {screen: screenName, params});
      } else {
        navigation.navigate(screenName, params);
      }
    },
    [navigation],
  );

  const renderItem = ({item}) => {
    const dateLabel = item.__parsedDate
      ? item.__parsedDate.local().format('ddd, MMM D, YYYY')
      : '--';

    const showClockIn =
      !looksLikeMissingDate(item.ClockInDate) && !isBlankTime(item.ClockIn);
    const showClockOut =
      !looksLikeMissingDate(item.ClockOutDate) && !isBlankTime(item.ClockOut);

    const apiColor = isHex(item?.Color) ? item.Color : DEFAULT_COLOR;
    const chipBg = rgba(apiColor, 0.14);
    const chipText = readableTextOn(apiColor);
    const underline = rgba(apiColor, 0.45);

    const rawStatus = (item.Status ?? '').toString().trim().toLowerCase();
    const ABSENT_ALIASES = [
      'absent',
      'a',
      'no in/out',
      'no in out',
      'missing',
      'abs',
      'leave without pay',
    ];

    const noIn =
      isBlankTime(item.ClockIn) || looksLikeMissingDate(item.ClockInDate);
    const noOut =
      isBlankTime(item.ClockOut) || looksLikeMissingDate(item.ClockOutDate);
    const computedAbsent = noIn && noOut;

    const isAbsent = computedAbsent || ABSENT_ALIASES.includes(rawStatus);
    const isPresent =
      rawStatus === 'present' || (!noIn && !noOut && rawStatus === '');
    const isEditableIssue = !isPresent && !isAbsent;

    const isTouchable = isAbsent || isEditableIssue;

    // ----- NEW: build clean params -----
    const selectedDateISO = item?.__parsedDate
      ? item.__parsedDate.local().format('YYYY-MM-DD')
      : normalizeDateISO(item.AttendanceDate);

    const normalizedClockIn = normalizeTimeTo24h(item.ClockIn);
    const normalizedClockOut = normalizeTimeTo24h(item.ClockOut);

    const onPressRow = () => {
      if (!selectedDateISO) return;

      if (isAbsent) {
        // Only date is needed for marking present
        goTo('MarkPresentScreen', {
          employeeId: userData?.employeeId,
          employeeName: userData?.employeeName,
          attendanceDate: selectedDateISO,
          sourceScreen: 'AttendanceDetailsScreen',
        });
      } else if (isEditableIssue) {
        // Bind date AND times for editing
        goTo('EditAttendanceScreen', {
          employeeId: userData?.employeeId,
          employeeName: userData?.employeeName,
          attendanceDate: selectedDateISO,
          clockIn: normalizedClockIn,
          clockOut: normalizedClockOut,
          remarks: item?.Remarks || '',
          sourceScreen: 'AttendanceDetailsScreen',
        });
      }
    };
    // -----------------------------------

    return (
      <TouchableOpacity
        activeOpacity={isTouchable ? 0.7 : 1}
        onPress={isTouchable ? onPressRow : undefined}
        style={[
          styles.rowCard,
          {borderLeftColor: apiColor, borderLeftWidth: 5},
        ]}>
        {/* header */}
        <View style={[styles.cardHeader, {borderBottomColor: underline}]}>
          <Text style={styles.dateText}>{dateLabel}</Text>
          <View
            style={[
              styles.chip,
              {backgroundColor: chipBg, borderColor: rgba(apiColor, 0.5)},
            ]}>
            <Text
              style={[styles.chipText, {color: chipText}]}
              numberOfLines={1}>
              {item.Status || '—'}
            </Text>
          </View>
        </View>

        {/* values row */}
        <View style={styles.rowGrid}>
          <View style={styles.cell}>
            <Text style={styles.value}>
              {showClockIn ? formatInOut12h(item.ClockIn) : '--'}
            </Text>
            <Text style={styles.label}>Clock In</Text>
          </View>

          <View style={styles.cell}>
            <Text style={styles.value}>
              {showClockOut ? formatInOut12h(item.ClockOut) : '--'}
            </Text>
            <Text style={styles.label}>Clock Out</Text>
          </View>

          <View style={styles.cell}>
            <Text style={styles.value}>
              {formatDuration(item.ShiftWorkingTime)}
            </Text>
            <Text style={styles.label}>Working Hours</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ActionPaneContainer
      pageTitle="Attendance Detail"
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}>
      <View style={styles.container}>
        <View className="headerRow" style={styles.headerRow}>
          <Text style={styles.title}>Attendance Monthly</Text>
          <MonthFilter
            month={month}
            onPrev={() => setMonth(m => moment(m).subtract(1, 'month'))}
            onNext={() => setMonth(m => moment(m).add(1, 'month'))}
          />
        </View>

        <FlatList
          style={{flex: 1}}
          contentContainerStyle={styles.listContent}
          data={data}
          keyExtractor={(it, idx) => it._key || String(idx)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          nestedScrollEnabled
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No records for this month</Text>
              </View>
            ) : null
          }
        />
      </View>

      <AlertModal
        visible={alert.visible}
        heading="Alert"
        text={alert.text}
        onPress={() => setAlert(s => ({...s, visible: false}))}
      />
    </ActionPaneContainer>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F5F5F5', padding: 16},
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  title: {fontSize: 18, fontWeight: '800', color: '#263238'},
  listContent: {paddingTop: 8, paddingBottom: 16},

  rowCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  dateText: {fontSize: 15, fontWeight: '700', color: '#263238'},

  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {fontSize: 11, fontWeight: '700'},

  rowGrid: {flexDirection: 'row', columnGap: 10},
  cell: {flex: 1},
  value: {fontSize: 16, fontWeight: '800', color: '#263238'},
  label: {fontSize: 11, color: '#607D8B', marginTop: 2},

  empty: {alignItems: 'center', paddingTop: 36, paddingHorizontal: 12},
  emptyText: {color: '#78909C'},
});

export default AttendanceDetailsScreen;
