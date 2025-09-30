/* eslint-disable curly */
import React, {memo, useMemo} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';

/* ===================== MonthFilter ===================== */
export const MonthFilter = memo(function MonthFilter({month, onPrev, onNext}) {
  return (
    <View style={styles.monthSelector}>
      <TouchableOpacity
        onPress={onPrev}
        activeOpacity={0.8}
        style={styles.monthBtn}>
        <Icon name="chevron-left" size={24} color="#1E88E5" />
      </TouchableOpacity>

      <View style={styles.monthPill}>
        <Text style={styles.monthText}>
          {moment(month).format('MMM').toUpperCase()}
        </Text>
      </View>

      <TouchableOpacity
        onPress={onNext}
        activeOpacity={0.8}
        style={styles.monthBtn}>
        <Icon name="chevron-right" size={24} color="#1E88E5" />
      </TouchableOpacity>
    </View>
  );
});

/* ======================= DayCard ======================= */
export const DayCard = memo(function DayCard({item, expanded, onToggle}) {
  const dateLabel = useMemo(
    () => moment(item.AttendanceDate).format('ddd, MMM D, YYYY'),
    [item.AttendanceDate],
  );

  const timeOrDash = v => (v == null || v === '' ? '--:--' : toTime(v));
  const workingHrs = secondsToHHMMSS(item.TotalWorkingTime);

  const tagText =
    item.LeaveCode && item.LeaveCode !== ''
      ? item.LeaveCode
      : item.StatusTag || 'GENERAL';

  const color = item.Color || '#6ce66c';

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onToggle}
      style={[styles.card, {borderLeftColor: color}]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardDate}>{dateLabel}</Text>
        <View style={styles.tagPill}>
          <Text style={styles.tagText}>{tagText}</Text>
        </View>
      </View>

      {/* Collapsed preview */}
      <View style={styles.row}>
        <TimeCell
          title="Check In"
          value={timeOrDash(item.CheckIn)}
          color="#4CAF50"
        />
        <TimeCell
          title="Check Out"
          value={timeOrDash(item.CheckOut)}
          color="#F44336"
        />
        <TimeCell title="Working HRS" value={workingHrs} color="#FF9800" />
      </View>

      {/* Expanded */}
      {expanded ? (
        <View
          style={[styles.expandedBox, {backgroundColor: fade(color, 0.12)}]}>
          <DetailRow label="Status" value={statusLine(item)} />
          {item.Color ? (
            <DetailRow label="Color" value={String(item.Color)} />
          ) : null}
          {item.LeaveCode ? (
            <DetailRow label="Leave Code" value={item.LeaveCode} />
          ) : null}
        </View>
      ) : null}
    </TouchableOpacity>
  );
});

/* ===================== Internal bits ===================== */
const TimeCell = memo(({title, value, color}) => (
  <View style={styles.timeCell}>
    <Text style={[styles.timeValue, {color}]}>{value}</Text>
    <Text style={styles.timeLabel}>{title}</Text>
  </View>
));

const DetailRow = memo(({label, value}) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
));

/* ====================== Helpers ====================== */
const toTime = secOrStr => {
  // Accepts seconds (number) or "hh:mm:ss"
  if (secOrStr == null) return '--:--';
  if (typeof secOrStr === 'string' && secOrStr.includes(':')) return secOrStr;
  const seconds = Number(secOrStr);
  if (!Number.isFinite(seconds)) return '--:--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const secondsToHHMMSS = total => {
  if (total == null) return '--:--';
  const s = Number(total);
  if (!Number.isFinite(s)) return '--:--';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(
    sec,
  ).padStart(2, '0')}`;
};

const statusLine = item => {
  if (item.OffDay || item.GazettedDay) return 'Off / Holiday';
  if (item.Absent && !item.LeaveCode) return 'Absent';
  if (item.LeaveCode) return 'On Leave';
  if (item.LateArrival || item.EarlyOut) return 'Deductions';
  return 'General';
};

const fade = (hex, alpha) => {
  // expects #RRGGBB
  const c = (hex || '#6ce66c').replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

/* ======================= Styles ======================= */
const styles = StyleSheet.create({
  monthSelector: {flexDirection: 'row', alignItems: 'center', gap: 10},
  monthBtn: {backgroundColor: '#E3F2FD', borderRadius: 12, padding: 6},
  monthPill: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    elevation: 2,
  },
  monthText: {
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: '700',
    letterSpacing: 1,
  },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    borderLeftWidth: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardDate: {fontSize: 15, fontWeight: '700', color: '#263238'},
  tagPill: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  tagText: {fontSize: 11, color: '#2E7D32', fontWeight: '700'},

  row: {flexDirection: 'row', justifyContent: 'space-between', gap: 10},
  timeCell: {flex: 1, alignItems: 'flex-start'},
  timeValue: {fontSize: 16, fontWeight: '800'},
  timeLabel: {fontSize: 11, color: '#607D8B', marginTop: 2},

  expandedBox: {marginTop: 10, padding: 10, borderRadius: 10},
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {fontSize: 12, color: '#455A64', fontWeight: '600'},
  detailValue: {fontSize: 12, color: '#263238', fontWeight: '700'},
});
