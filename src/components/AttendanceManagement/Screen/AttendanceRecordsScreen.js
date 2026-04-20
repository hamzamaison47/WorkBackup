/* eslint-disable react-native/no-inline-styles */
/* eslint-disable curly */
// ─────────────────────────────────────────────
// components/AttendanceManagement/screens/AttendanceRecordsScreen.js
// ─────────────────────────────────────────────
import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Platform,
  Modal,
} from 'react-native';
import {useSelector} from 'react-redux';
import {
  loadRecords,
  formatDuration,
  formatDurationShort,
  formatTime,
  formatDate,
  getSessionStats,
} from '../../../screens/AttendanceManagement/helpers';
import NavigationFAB from '../NavigationFAB';

const DK = {
  bg: '#F5F7FA',
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',
  surface: '#EEF2F7',
  accent: '#1B4FD8',
  accentGreen: '#059669',
  accentAmber: '#D97706',
  accentRed: '#DC2626',
  accentPurple: '#7C3AED',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  ring: '#CBD5E1',
  greenLight: '#D1FAE5',
  greenDark: '#065F46',
  purpleLight: '#EDE9FE',
  purpleDark: '#5B21B6',
  amberLight: '#FEF3C7',
  amberDark: '#92400E',
  redLight: '#FEE2E2',
  redDark: '#991B1B',
};

// ─────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────
const SkeletonBlock = ({width: w, height: h, borderRadius: br = 6, style}) => {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);
  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.5],
  });
  return (
    <Animated.View
      style={[
        {
          width: w,
          height: h,
          borderRadius: br,
          backgroundColor: DK.textMuted,
          opacity,
        },
        style,
      ]}
    />
  );
};

const SkeletonList = () => (
  <View
    style={{
      flex: 1,
      backgroundColor: DK.bg,
      paddingTop: 16,
      paddingHorizontal: 16,
    }}>
    {[0, 1, 2, 3].map(i => (
      <View key={i} style={{marginBottom: 10}}>
        <SkeletonBlock width="100%" height={80} borderRadius={12} />
      </View>
    ))}
  </View>
);

// ─────────────────────────────────────────────
// Mini Calendar
// ─────────────────────────────────────────────
const MONTHS = [
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
const DAYS_HEADER = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const MiniCalendar = ({selectedDate, onSelect, onClose}) => {
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isSelected = d =>
    d === selectedDate.getDate() &&
    viewMonth === selectedDate.getMonth() &&
    viewYear === selectedDate.getFullYear();

  const isToday = d => {
    const now = new Date();
    return (
      d === now.getDate() &&
      viewMonth === now.getMonth() &&
      viewYear === now.getFullYear()
    );
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else setViewMonth(m => m + 1);
  };

  return (
    <View style={CAL.container}>
      <View style={CAL.monthRow}>
        <TouchableOpacity onPress={prevMonth} style={CAL.navBtn}>
          <Text style={CAL.navTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={CAL.monthLabel}>
          {MONTHS[viewMonth]} {viewYear}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={CAL.navBtn}>
          <Text style={CAL.navTxt}>›</Text>
        </TouchableOpacity>
      </View>
      <View style={CAL.headerRow}>
        {DAYS_HEADER.map(d => (
          <Text key={d} style={CAL.headerCell}>
            {d}
          </Text>
        ))}
      </View>
      <View style={CAL.grid}>
        {cells.map((day, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              CAL.cell,
              day && isSelected(day) && CAL.cellSelected,
              day && isToday(day) && !isSelected(day) && CAL.cellToday,
            ]}
            disabled={!day}
            onPress={() => {
              onSelect(new Date(viewYear, viewMonth, day));
              onClose();
            }}>
            {day ? (
              <Text
                style={[
                  CAL.cellTxt,
                  isSelected(day) && CAL.cellTxtSelected,
                  isToday(day) && !isSelected(day) && CAL.cellTxtToday,
                ]}>
                {day}
              </Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const CAL = StyleSheet.create({
  container: {
    backgroundColor: DK.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: DK.cardBorder,
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  navBtn: {padding: 6},
  navTxt: {fontSize: 20, color: DK.textPrimary, fontWeight: '600'},
  monthLabel: {fontSize: 14, fontWeight: '700', color: DK.textPrimary},
  headerRow: {flexDirection: 'row', marginBottom: 4},
  headerCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
    color: DK.textMuted,
    paddingVertical: 4,
  },
  grid: {flexDirection: 'row', flexWrap: 'wrap'},
  cell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 16,
  },
  cellSelected: {backgroundColor: DK.accentPurple},
  cellToday: {borderWidth: 1, borderColor: DK.accentPurple},
  cellTxt: {fontSize: 12, color: DK.textSecondary, fontWeight: '500'},
  cellTxtSelected: {color: '#FFFFFF', fontWeight: '700'},
  cellTxtToday: {color: DK.accentPurple, fontWeight: '700'},
});

// ─────────────────────────────────────────────
// Expandable Record Card
// ─────────────────────────────────────────────
const RecordItem = ({item, index, totalForDay}) => {
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    Animated.timing(rotateAnim, {
      toValue: expanded ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setExpanded(v => !v);
  };

  const iconRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const stats = getSessionStats(item);
  const isActive = !item.clockOut;
  const breaks = item.breaks || [];

  return (
    <View style={RC.card}>
      <TouchableOpacity style={RC.header} onPress={toggle} activeOpacity={0.7}>
        <View
          style={[
            RC.statusBar,
            {backgroundColor: isActive ? DK.accentGreen : DK.accentPurple},
          ]}
        />
        <View style={RC.headerContent}>
          <View style={RC.headerTop}>
            <View style={{flex: 1}}>
              <Text style={RC.dateText} numberOfLines={1}>
                {item.clockIn ? formatDate(item.clockIn) : 'Unknown date'}
                {totalForDay > 1 ? `  ·  Session ${index + 1}` : ''}
              </Text>
              <View style={RC.quickRow}>
                <Text style={RC.timeRange}>
                  {item.clockIn ? formatTime(item.clockIn) : '--'}
                  {' → '}
                  {item.clockOut
                    ? formatTime(item.clockOut)
                    : isActive
                    ? 'Now'
                    : '—'}
                </Text>
                {stats?.netMs > 0 && (
                  <View style={[RC.pill, {backgroundColor: DK.greenLight}]}>
                    <Text style={[RC.pillTxt, {color: DK.greenDark}]}>
                      {formatDuration(stats.netMs)}
                    </Text>
                  </View>
                )}
                {isActive && (
                  <View style={[RC.pill, {backgroundColor: DK.greenLight}]}>
                    <Text style={[RC.pillTxt, {color: DK.greenDark}]}>
                      Active
                    </Text>
                  </View>
                )}
                {!item.clockIn && item.clockOut && (
                  <View style={[RC.pill, {backgroundColor: DK.amberLight}]}>
                    <Text style={[RC.pillTxt, {color: DK.amberDark}]}>
                      Incomplete
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <Animated.Text
              style={[RC.chevron, {transform: [{rotate: iconRotation}]}]}>
              ▾
            </Animated.Text>
          </View>

          {/* Mini summary always visible */}
          {stats && (stats.completedBreaks > 0 || item.FenceName) && (
            <View style={RC.miniSummary}>
              {stats.completedBreaks > 0 && (
                <Text style={RC.miniTag}>
                  {stats.completedBreaks} break
                  {stats.completedBreaks > 1 ? 's' : ''} ·{' '}
                  {formatDurationShort(stats.breakMs)}
                </Text>
              )}
              {item.FenceName && (
                <Text style={RC.miniTag}>{item.FenceName}</Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={RC.details}>
          <View style={RC.detailDivider} />

          {/* Timeline */}
          <View style={RC.timeline}>
            {item.clockIn && (
              <View style={RC.timelineRow}>
                <View
                  style={[RC.timelineDot, {backgroundColor: DK.accentGreen}]}
                />
                <View style={RC.timelineLine} />
                <Text style={RC.timelineLabel}>Clock In</Text>
                <Text style={RC.timelineValue}>{formatTime(item.clockIn)}</Text>
              </View>
            )}

            {breaks.map((b, idx) => {
              const bDurMs =
                b.breakStart && b.breakEnd
                  ? new Date(b.breakEnd) - new Date(b.breakStart)
                  : null;
              return (
                <View key={idx}>
                  {b.breakStart && (
                    <View style={RC.timelineRow}>
                      <View
                        style={[
                          RC.timelineDot,
                          {backgroundColor: DK.accentPurple},
                        ]}
                      />
                      <View style={RC.timelineLine} />
                      <Text style={RC.timelineLabel}>
                        Break {idx + 1} start
                        {bDurMs
                          ? `  ·  ${formatDurationShort(bDurMs)}`
                          : '  ·  ongoing'}
                      </Text>
                      <Text style={RC.timelineValue}>
                        {formatTime(b.breakStart)}
                      </Text>
                    </View>
                  )}
                  {b.breakEnd && (
                    <View style={RC.timelineRow}>
                      <View
                        style={[
                          RC.timelineDot,
                          {backgroundColor: DK.accentAmber},
                        ]}
                      />
                      <View style={RC.timelineLine} />
                      <Text style={RC.timelineLabel}>Break {idx + 1} end</Text>
                      <Text style={RC.timelineValue}>
                        {formatTime(b.breakEnd)}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}

            {item.clockOut && (
              <View style={[RC.timelineRow, {marginBottom: 0}]}>
                <View
                  style={[RC.timelineDot, {backgroundColor: DK.accentRed}]}
                />
                <Text style={RC.timelineLabel}>Clock Out</Text>
                <Text style={RC.timelineValue}>
                  {formatTime(item.clockOut)}
                </Text>
              </View>
            )}
          </View>

          {/* Summary grid */}
          {stats && (
            <View style={RC.summaryGrid}>
              <View style={RC.summaryItem}>
                <Text style={RC.summaryLabel}>Net Work</Text>
                <Text style={[RC.summaryVal, {color: DK.accentGreen}]}>
                  {stats.netMs > 0 ? formatDuration(stats.netMs) : '—'}
                </Text>
              </View>
              {stats.completedBreaks > 0 && (
                <View style={RC.summaryItem}>
                  <Text style={RC.summaryLabel}>Break Time</Text>
                  <Text style={[RC.summaryVal, {color: DK.accentPurple}]}>
                    {stats.completedBreaks} ·{' '}
                    {formatDurationShort(stats.breakMs)}
                  </Text>
                </View>
              )}
              {stats.grossMs > 0 && (
                <View style={RC.summaryItem}>
                  <Text style={RC.summaryLabel}>Total Time</Text>
                  <Text style={RC.summaryVal}>
                    {formatDuration(stats.grossMs)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {item.FenceName && (
            <View style={RC.fenceRow}>
              <Text style={RC.fenceLabel}>Location</Text>
              <Text style={RC.fenceVal}>{item.FenceName}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const RC = StyleSheet.create({
  card: {
    backgroundColor: DK.card,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: DK.cardBorder,
    overflow: 'hidden',
  },
  header: {flexDirection: 'row', alignItems: 'stretch'},
  statusBar: {width: 4},
  headerContent: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 12,
    paddingRight: 10,
  },
  headerTop: {flexDirection: 'row', alignItems: 'flex-start'},
  dateText: {
    fontSize: 12,
    fontWeight: '700',
    color: DK.textPrimary,
    marginBottom: 3,
  },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  timeRange: {fontSize: 11, color: DK.textSecondary, fontWeight: '500'},
  pill: {paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10},
  pillTxt: {fontSize: 10, fontWeight: '700'},
  chevron: {fontSize: 14, color: DK.textMuted, marginLeft: 4, marginTop: 2},
  miniSummary: {flexDirection: 'row', gap: 8, marginTop: 5, flexWrap: 'wrap'},
  miniTag: {fontSize: 10, color: DK.textMuted, fontWeight: '500'},

  details: {paddingHorizontal: 12, paddingBottom: 12},
  detailDivider: {height: 1, backgroundColor: DK.cardBorder, marginBottom: 10},

  timeline: {marginBottom: 10},
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    position: 'relative',
  },
  timelineDot: {width: 6, height: 6, borderRadius: 3, flexShrink: 0},
  timelineLine: {
    position: 'absolute',
    left: 2.5,
    top: 10,
    width: 1,
    height: 16,
    backgroundColor: DK.cardBorder,
  },
  timelineLabel: {
    flex: 1,
    fontSize: 11,
    color: DK.textSecondary,
    fontWeight: '500',
  },
  timelineValue: {fontSize: 12, color: DK.textPrimary, fontWeight: '600'},

  summaryGrid: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  summaryItem: {
    flex: 1,
    minWidth: 80,
    backgroundColor: DK.surface,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: DK.cardBorder,
  },
  summaryLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: DK.textMuted,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  summaryVal: {fontSize: 12, fontWeight: '700', color: DK.textPrimary},

  fenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: DK.cardBorder,
  },
  fenceLabel: {fontSize: 11, color: DK.textMuted},
  fenceVal: {fontSize: 11, fontWeight: '600', color: DK.textPrimary},
});

// ─────────────────────────────────────────────
// Date filter bar
// ─────────────────────────────────────────────
const DateFilterBar = ({fromDate, toDate, onFromPress, onToPress, onReset}) => {
  const fmt = d => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  return (
    <View style={DF.wrap}>
      <TouchableOpacity
        style={DF.chip}
        onPress={onFromPress}
        activeOpacity={0.7}>
        <Text style={DF.chipLabel}>FROM</Text>
        <Text style={DF.chipValue}>{fmt(fromDate)}</Text>
      </TouchableOpacity>
      <Text style={DF.dash}>–</Text>
      <TouchableOpacity style={DF.chip} onPress={onToPress} activeOpacity={0.7}>
        <Text style={DF.chipLabel}>TO</Text>
        <Text style={DF.chipValue}>{fmt(toDate)}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onReset}
        style={DF.resetBtn}
        activeOpacity={0.7}>
        <Text style={DF.resetTxt}>Today</Text>
      </TouchableOpacity>
    </View>
  );
};

const DF = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  chip: {
    flex: 1,
    backgroundColor: DK.card,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: DK.cardBorder,
  },
  chipLabel: {
    fontSize: 7,
    fontWeight: '700',
    color: DK.textMuted,
    letterSpacing: 0.8,
    marginBottom: 1,
  },
  chipValue: {fontSize: 11, fontWeight: '600', color: DK.textPrimary},
  dash: {color: DK.textMuted, fontSize: 12, fontWeight: '600'},
  resetBtn: {
    backgroundColor: DK.accentPurple,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  resetTxt: {fontSize: 11, fontWeight: '700', color: '#FFFFFF'},
});

// ─────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────
const AttendanceRecordsScreen = ({onNavigate}) => {
  const {userData} = useSelector(s => s.user);
  const person = userData?.Person;

  const [records, setRecords] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayEnd = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);

  const [fromDate, setFromDate] = useState(todayStart);
  const [toDate, setToDate] = useState(todayEnd);
  const [calendarTarget, setCalendarTarget] = useState(null);

  const load = useCallback(async () => {
    const r = await loadRecords({person});
    setRecords([...r].reverse());
  }, [person]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await load();
      setIsLoading(false);
    };
    init();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filteredRecords = useMemo(() => {
    if (!records.length) return [];
    return records.filter(r => {
      if (!r.clockIn) return false;
      const d = new Date(r.clockIn);
      const dayStart = new Date(fromDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(toDate);
      dayEnd.setHours(23, 59, 59, 999);
      return d >= dayStart && d <= dayEnd;
    });
  }, [records, fromDate, toDate]);

  // Group records by date for session index display
  const dateGroups = useMemo(() => {
    const groups = {};
    filteredRecords.forEach(r => {
      if (!r.clockIn) return;
      const d = new Date(r.clockIn);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(r.id || r.RecId);
    });
    return groups;
  }, [filteredRecords]);

  const getSessionIndex = item => {
    if (!item.clockIn) return 0;
    const d = new Date(item.clockIn);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const group = dateGroups[key] || [];
    return group.indexOf(item.id || item.RecId);
  };

  const getTotalForDay = item => {
    if (!item.clockIn) return 1;
    const d = new Date(item.clockIn);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    return (dateGroups[key] || []).length;
  };

  const totalWorked = useMemo(() => {
    let total = 0;
    filteredRecords.forEach(r => {
      const stats = getSessionStats(r);
      if (stats && r.clockOut) total += stats.netMs;
    });
    return total;
  }, [filteredRecords]);

  const completedCount = useMemo(
    () => filteredRecords.filter(r => r.clockOut).length,
    [filteredRecords],
  );

  const totalBreaksAll = useMemo(() => {
    let count = 0;
    filteredRecords.forEach(r => {
      const stats = getSessionStats(r);
      if (stats) count += stats.completedBreaks;
    });
    return count;
  }, [filteredRecords]);

  const resetToToday = () => {
    const s = new Date();
    s.setHours(0, 0, 0, 0);
    setFromDate(s);
    const e = new Date();
    e.setHours(23, 59, 59, 999);
    setToDate(e);
  };

  const handleCalendarSelect = d => {
    if (calendarTarget === 'from') {
      d.setHours(0, 0, 0, 0);
      setFromDate(d);
      if (d > toDate) {
        const e = new Date(d);
        e.setHours(23, 59, 59, 999);
        setToDate(e);
      }
    } else {
      d.setHours(23, 59, 59, 999);
      setToDate(d);
      if (d < fromDate) {
        const s = new Date(d);
        s.setHours(0, 0, 0, 0);
        setFromDate(s);
      }
    }
  };

  return (
    <SafeAreaView style={S.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={DK.bg} />

      <View style={S.header}>
        <Text style={S.headerTitle}>Timesheets</Text>
        <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
          <Text style={[S.refreshBtn, refreshing && {opacity: 0.5}]}>↻</Text>
        </TouchableOpacity>
      </View>

      <DateFilterBar
        fromDate={fromDate}
        toDate={toDate}
        onFromPress={() => setCalendarTarget('from')}
        onToPress={() => setCalendarTarget('to')}
        onReset={resetToToday}
      />

      {/* Summary strip */}
      <View style={S.summary}>
        <View style={S.summaryItem}>
          <Text style={[S.summaryVal, {color: DK.accentAmber}]}>
            {completedCount}
          </Text>
          <Text style={S.summaryLbl}>Sessions</Text>
        </View>
        <View style={S.summaryDivider} />
        <View style={S.summaryItem}>
          <Text style={[S.summaryVal, {color: DK.accentGreen, fontSize: 15}]}>
            {formatDuration(totalWorked)}
          </Text>
          <Text style={S.summaryLbl}>Net Worked</Text>
        </View>
        <View style={S.summaryDivider} />
        <View style={S.summaryItem}>
          <Text style={[S.summaryVal, {color: DK.accentPurple}]}>
            {totalBreaksAll}
          </Text>
          <Text style={S.summaryLbl}>Breaks</Text>
        </View>
        <View style={S.summaryDivider} />
        <View style={S.summaryItem}>
          <Text style={S.summaryVal}>{filteredRecords.length}</Text>
          <Text style={S.summaryLbl}>Records</Text>
        </View>
      </View>

      {isLoading ? (
        <SkeletonList />
      ) : filteredRecords.length === 0 ? (
        <View style={S.empty}>
          <Text style={S.emptyEmoji}>📋</Text>
          <Text style={S.emptyTitle}>No records found</Text>
          <Text style={S.emptySub}>
            No attendance records found for the selected date range.
          </Text>
          <TouchableOpacity
            style={S.emptyBtn}
            onPress={() => onNavigate('TimeClock')}>
            <Text style={S.emptyBtnTxt}>Go to Time Clock</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredRecords}
          keyExtractor={item => String(item.id ?? item.RecId)}
          renderItem={({item}) => (
            <RecordItem
              item={item}
              index={getSessionIndex(item)}
              totalForDay={getTotalForDay(item)}
            />
          )}
          contentContainerStyle={S.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={DK.accentPurple}
              colors={[DK.accentPurple]}
            />
          }
        />
      )}

      <Modal
        visible={calendarTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarTarget(null)}>
        <TouchableOpacity
          style={S.calOverlay}
          activeOpacity={1}
          onPress={() => setCalendarTarget(null)}>
          <View style={S.calWrap}>
            <Text style={S.calTitle}>
              Select {calendarTarget === 'from' ? 'Start' : 'End'} Date
            </Text>
            <MiniCalendar
              selectedDate={calendarTarget === 'from' ? fromDate : toDate}
              onSelect={handleCalendarSelect}
              onClose={() => setCalendarTarget(null)}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <NavigationFAB activeScreen="Records" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

export default AttendanceRecordsScreen;

const S = StyleSheet.create({
  screen: {flex: 1, backgroundColor: DK.bg},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {fontSize: 18, fontWeight: '800', color: DK.textPrimary},
  refreshBtn: {fontSize: 20, color: DK.accentPurple, fontWeight: '600'},

  summary: {
    flexDirection: 'row',
    backgroundColor: DK.card,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DK.cardBorder,
    overflow: 'hidden',
  },
  summaryItem: {flex: 1, alignItems: 'center', paddingVertical: 10},
  summaryVal: {fontSize: 16, fontWeight: '800', color: DK.textPrimary},
  summaryLbl: {
    fontSize: 8,
    color: DK.textMuted,
    marginTop: 2,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  summaryDivider: {width: 1, backgroundColor: DK.cardBorder},

  list: {padding: 16, paddingBottom: 100},

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
    paddingHorizontal: 32,
  },
  emptyEmoji: {fontSize: 40, marginBottom: 12},
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DK.textPrimary,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: DK.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyBtn: {
    backgroundColor: DK.accentPurple,
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 20,
  },
  emptyBtnTxt: {color: '#FFFFFF', fontWeight: '700', fontSize: 13},

  calOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  calWrap: {
    backgroundColor: DK.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: DK.cardBorder,
  },
  calTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: DK.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
});
