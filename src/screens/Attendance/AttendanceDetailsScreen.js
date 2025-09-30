/* eslint-disable curly */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {View, Text, StyleSheet, FlatList, RefreshControl} from 'react-native';
import moment from 'moment';
import {useSelector} from 'react-redux';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import AlertModal from '../../components/Alert/AlertModal';
import {getRegisterDetailsByDate} from '../../API/Attendance/getRegisterDetailsByDate';
import {MonthFilter} from '../../components/Attendance/AttendanceDetailsComponents';

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

/** Convert 24h h:m(:s) to 12h with AM/PM */
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
  // String with colon
  if (typeof value === 'string' && value.includes(':')) {
    const [hStr, mStr] = value.split(':');
    const h = Number(hStr);
    const m = Number(mStr);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return '--';
    return to12h(h, m);
  }
  // Seconds
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
    // Show as-is if API already gives "HH:MM:SS" / "HH:MM"
    return value.length === 5 ? `${value}:00` : value;
  }
  const n = Number(value);
  return secToHHMMSS(n);
};

const AttendanceDetailsScreen = () => {
  const {userData} = useSelector(state => state.user || {});
  const [month, setMonth] = useState(moment());
  const [raw, setRaw] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [alert, setAlert] = useState({visible: false, text: ''});

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

      const arr = normalizeArray(list).map((d, idx) => {
        const dt = parseISO(d.AttendanceDate);
        return {
          ...d, // keep EXACT API fields
          __parsedDate: dt,
          id:
            d.id ??
            `${d.AttendanceDate || 'NA'}-${d.ClockIn ?? 'NA'}-${
              d.ClockOut ?? 'NA'
            }-${idx}`,
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
    fetchData();
  }, [fetchData]);

  // month filter + newest first
  useEffect(() => {
    const filtered = raw
      .filter(it => it.__parsedDate && it.__parsedDate.isSame(month, 'month'))
      .sort((a, b) => b.__parsedDate.valueOf() - a.__parsedDate.valueOf());
    setData(filtered);
  }, [raw, month]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  const renderItem = ({item}) => {
    const dateLabel = item.__parsedDate
      ? item.__parsedDate.local().format('ddd, MMM D, YYYY')
      : '--';

    const showClockIn =
      !looksLikeMissingDate(item.ClockInDate) && !isBlankTime(item.ClockIn);
    const showClockOut =
      !looksLikeMissingDate(item.ClockOutDate) && !isBlankTime(item.ClockOut);

    return (
      <View
        style={[styles.rowCard, {borderLeftColor: item.Color || '#6ce66c'}]}>
        <View style={styles.rowTop}>
          <Text style={styles.dateText}>{dateLabel}</Text>
          <Text style={styles.badge}>{item.Status || '—'}</Text>
        </View>

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
            <Text style={styles.label}>Shift Working Time</Text>
          </View>
        </View>
      </View>
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
          keyExtractor={it => String(it.id)}
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
    marginBottom: 10,
    elevation: 2,
    borderLeftWidth: 5,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  dateText: {fontSize: 15, fontWeight: '700', color: '#263238'},
  badge: {
    fontSize: 11,
    color: '#455A64',
    backgroundColor: '#ECEFF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },

  rowGrid: {flexDirection: 'row', columnGap: 10},
  cell: {flex: 1},
  value: {fontSize: 16, fontWeight: '800', color: '#263238'},
  label: {fontSize: 11, color: '#607D8B', marginTop: 2},

  empty: {alignItems: 'center', paddingTop: 36, paddingHorizontal: 12},
  emptyText: {color: '#78909C'},
});

export default AttendanceDetailsScreen;
