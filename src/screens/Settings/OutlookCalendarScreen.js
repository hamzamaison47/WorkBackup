// screens/OutlookCalendarScreen.js
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useCallback, useRef, useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import useAppTokens from '../../components/AppComponentsDesign/useAppTokens';
import {
  GetCalendarEvents,
  CreateCalendarEvent,
  DeleteCalendarEvent,
} from '../../API/Outlook/outlookCalendarApi';

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DAYS_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const MONTHS = [
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

export const useOutlookCalendar = () => {
  const [todayEvents, setTodayEvents] = useState([]);
  const [weekEvents, setWeekEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();

      // Today: midnight → 23:59:59
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      // Next 30 days (covers full month grid)
      const rangeEnd = new Date(now);
      rangeEnd.setDate(rangeEnd.getDate() + 30);
      rangeEnd.setHours(23, 59, 59, 999);

      const [todayData, rangeData] = await Promise.all([
        GetCalendarEvents(todayStart.toISOString(), todayEnd.toISOString(), 20),
        GetCalendarEvents(now.toISOString(), rangeEnd.toISOString(), 100),
      ]);

      setTodayEvents(todayData);

      // weekEvents holds everything beyond today to avoid duplication
      const todayIds = new Set(todayData.map(e => e.id));
      setWeekEvents(rangeData.filter(e => !todayIds.has(e.id)));
    } catch (err) {
      setError(err.message ?? 'Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  }, []);

  const createEvent = useCallback(
    async eventData => {
      const result = await CreateCalendarEvent(eventData);
      await fetchEvents(); // refresh after creation
      return result;
    },
    [fetchEvents],
  );

  const deleteEvent = useCallback(
    async eventId => {
      await DeleteCalendarEvent(eventId);
      await fetchEvents(); // refresh after deletion
    },
    [fetchEvents],
  );

  return {
    todayEvents,
    weekEvents,
    loading,
    error,
    fetchEvents,
    createEvent,
    deleteEvent,
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const formatTime = iso =>
  new Date(iso).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});

/** Returns array of Date objects for all cells in the month grid (incl. padding) */
const buildMonthGrid = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const cells = [];

  // Leading days from prev month
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      current: false,
    });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({date: new Date(year, month, d), current: true});
  }
  // Trailing days — fill to complete last row
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      cells.push({date: new Date(year, month + 1, d), current: false});
    }
  }
  return cells;
};

// ─── Month Grid ───────────────────────────────────────────────────────────────
const MonthGrid = ({selectedDate, onSelectDate, eventDates, T}) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  const cells = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const eventSet = useMemo(() => {
    const s = new Set();
    eventDates.forEach(d =>
      s.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`),
    );
    return s;
  }, [eventDates]);

  const hasEvent = d =>
    eventSet.has(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(y => y - 1);
      setViewMonth(11);
    } else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(y => y + 1);
      setViewMonth(0);
    } else setViewMonth(m => m + 1);
  };
  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onSelectDate(today);
  };

  const s = gridStyles(T);

  return (
    <View style={s.wrapper}>
      {/* Nav row */}
      <View style={s.navRow}>
        <TouchableOpacity
          onPress={prevMonth}
          style={s.navBtn}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={22}
            color={T.textPrimary}
          />
        </TouchableOpacity>
        <Text style={s.monthLabel}>
          {MONTHS[viewMonth]} {viewYear}
        </Text>
        <TouchableOpacity
          onPress={nextMonth}
          style={s.navBtn}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={T.textPrimary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={goToday}
          style={[s.todayBtn, {borderColor: T.primary}]}>
          <Text style={[s.todayText, {color: T.primary}]}>Today</Text>
        </TouchableOpacity>
      </View>

      {/* Day-of-week headers */}
      <View style={s.dowRow}>
        {DAYS_SHORT.map(d => (
          <Text key={d} style={s.dow}>
            {d}
          </Text>
        ))}
      </View>

      {/* Day cells — 6 rows max */}
      <View style={s.grid}>
        {cells.map(({date, current}, i) => {
          const isToday = isSameDay(date, today);
          const isSelected = isSameDay(date, selectedDate);
          const hasDot = hasEvent(date);

          return (
            <TouchableOpacity
              key={i}
              style={s.cell}
              onPress={() => {
                if (!current) {
                  // navigate view to that month when tapping overflow cell
                  setViewYear(date.getFullYear());
                  setViewMonth(date.getMonth());
                }
                onSelectDate(new Date(date));
              }}
              activeOpacity={0.7}>
              <View
                style={[
                  s.dayCircle,
                  isSelected && {backgroundColor: T.primary},
                  isToday &&
                    !isSelected && {borderWidth: 1.5, borderColor: T.primary},
                ]}>
                <Text
                  style={[
                    s.dayNum,
                    !current && s.otherMonth,
                    isSelected && {color: '#fff', fontWeight: '600'},
                    isToday &&
                      !isSelected && {color: T.primary, fontWeight: '600'},
                  ]}>
                  {date.getDate()}
                </Text>
              </View>
              {hasDot && (
                <View
                  style={[
                    s.dot,
                    {backgroundColor: isSelected ? '#fff' : T.primary},
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const gridStyles = T =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: T.cardBg ?? '#fff',
      paddingHorizontal: 10,
      paddingTop: 8,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: T.border ?? '#eee',
    },
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 4,
    },
    navBtn: {padding: 4},
    monthLabel: {
      flex: 1,
      fontSize: 15,
      fontWeight: '700',
      color: T.textPrimary,
      textAlign: 'center',
    },
    todayBtn: {
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    todayText: {fontSize: 12, fontWeight: '600'},
    dowRow: {
      flexDirection: 'row',
      marginBottom: 2,
    },
    dow: {
      flex: 1,
      textAlign: 'center',
      fontSize: 11,
      fontWeight: '600',
      color: T.textSecondary ?? '#888',
      paddingVertical: 2,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    cell: {
      width: `${100 / 7}%`,
      alignItems: 'center',
      paddingVertical: 3,
    },
    dayCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayNum: {
      fontSize: 13,
      color: T.textPrimary,
    },
    otherMonth: {
      color: T.textMuted ?? '#ccc',
    },
    dot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      marginTop: 1,
    },
  });

// ─── Event Card ───────────────────────────────────────────────────────────────
const STRIPE_COLORS = ['#185FA5', '#0F6E56', '#993556', '#534AB7', '#854F0B'];
const getStripeColor = id =>
  STRIPE_COLORS[Math.abs(id.charCodeAt(0)) % STRIPE_COLORS.length];

const EventCard = ({item, T, onDelete}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start();
  }, [scaleAnim]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${item.subject}"?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Animated.timing(scaleAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start(() => onDelete(item.id));
          },
        },
      ],
    );
  };

  const startTime = item.isAllDay ? null : formatTime(item.start?.dateTime);
  const endTime = item.isAllDay ? null : formatTime(item.end?.dateTime);
  const stripeColor = getStripeColor(item.id ?? 'x');
  const s = cardStyles(T);

  return (
    <Animated.View style={[s.card, {transform: [{scaleY: scaleAnim}]}]}>
      <View style={[s.stripe, {backgroundColor: stripeColor}]} />
      <View style={s.body}>
        <View style={s.topRow}>
          <Text style={s.subject} numberOfLines={1}>
            {item.subject}
          </Text>
          <TouchableOpacity
            onPress={handleDelete}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={17}
              color={T.textMuted ?? '#bbb'}
            />
          </TouchableOpacity>
        </View>

        <Text style={s.meta}>
          {item.isAllDay ? '⬤  All day' : `🕐  ${startTime} – ${endTime}`}
          {item.location?.displayName
            ? `    📍  ${item.location.displayName}`
            : ''}
        </Text>

        {!!item.bodyPreview && (
          <Text style={s.preview} numberOfLines={2}>
            {item.bodyPreview}
          </Text>
        )}

        {!!item.onlineMeetingUrl && (
          <View style={[s.badge, {backgroundColor: stripeColor + '18'}]}>
            <MaterialCommunityIcons
              name="video-outline"
              size={12}
              color={stripeColor}
            />
            <Text style={[s.badgeText, {color: stripeColor}]}>
              {' '}
              Online meeting
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const cardStyles = T =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: T.cardBg ?? '#fff',
      borderRadius: 12,
      marginBottom: 10,
      overflow: 'hidden',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.06,
      shadowRadius: 4,
    },
    stripe: {width: 4, flexShrink: 0},
    body: {flex: 1, padding: 12},
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    subject: {
      flex: 1,
      fontSize: 14,
      fontWeight: '700',
      color: T.textPrimary,
    },
    meta: {
      fontSize: 12,
      color: T.textSecondary ?? '#888',
      marginTop: 5,
      lineHeight: 17,
    },
    preview: {
      fontSize: 12,
      color: T.textMuted ?? '#bbb',
      marginTop: 6,
      lineHeight: 17,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      marginTop: 8,
    },
    badgeText: {fontSize: 11, fontWeight: '600'},
  });

// ─── Main Screen ──────────────────────────────────────────────────────────────
const OutlookCalendarScreen = () => {
  const navigation = useNavigation();
  const T = useAppTokens();

  const {
    todayEvents,
    weekEvents,
    loading,
    error,
    fetchEvents,
    createEvent,
    deleteEvent,
  } = useOutlookCalendar();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);

  // Load events covering the current month ± a little buffer
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // All events flat (today + rest of week)
  const allEvents = useMemo(
    () => [...todayEvents, ...weekEvents],
    [todayEvents, weekEvents],
  );

  // Events for the selected day
  const selectedDayEvents = useMemo(
    () =>
      allEvents.filter(e => {
        const d = new Date(e.start?.dateTime ?? e.start?.date);
        return isSameDay(d, selectedDate);
      }),
    [allEvents, selectedDate],
  );

  // Dates that have at least one event (for dots)
  const eventDates = useMemo(
    () => allEvents.map(e => new Date(e.start?.dateTime ?? e.start?.date)),
    [allEvents],
  );

  const handleCreate = async eventData => {
    setCreating(true);
    try {
      await createEvent(eventData);
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Error', err.message ?? 'Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = useCallback(
    async eventId => {
      try {
        await deleteEvent(eventId);
      } catch (err) {
        Alert.alert('Error', err.message ?? 'Failed to delete event');
      }
    },
    [deleteEvent],
  );

  const handleGoBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('MainDashboard');
  };

  const isToday = isSameDay(selectedDate, new Date());
  const dateLabel = isToday
    ? 'Today'
    : `${DAYS_FULL[selectedDate.getDay()]}, ${
        MONTHS[selectedDate.getMonth()]
      } ${selectedDate.getDate()}`;

  const s = screenStyles(T);

  return (
    <ActionPaneContainer
      pageTitle="Outlook Calendar"
      isBackButton={true}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={true}
      showPageTitleRow={true}
      onBackPress={handleGoBack}>
      {/* ── Month Grid (non-scrolling, sits above the list) ── */}
      <MonthGrid
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        eventDates={eventDates}
        T={T}
      />

      {/* ── Event list for selected day ── */}
      {loading ? (
        <ActivityIndicator color={T.primary} style={{marginTop: 40}} />
      ) : error ? (
        <View style={s.centered}>
          <MaterialCommunityIcons
            name="cloud-off-outline"
            size={48}
            color={T.textMuted ?? '#ccc'}
          />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={fetchEvents}
            style={[s.retryBtn, {borderColor: T.primary}]}>
            <Text style={[s.retryText, {color: T.primary}]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={selectedDayEvents}
          keyExtractor={item => item.id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
          renderItem={({item}) => (
            <EventCard item={item} T={T} onDelete={handleDelete} />
          )}
          ListHeaderComponent={
            <View style={s.dateHeader}>
              <Text style={s.dateLabel}>{dateLabel}</Text>
              <Text style={s.eventCount}>
                {selectedDayEvents.length} event
                {selectedDayEvents.length !== 1 ? 's' : ''}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <MaterialCommunityIcons
                name="calendar-check-outline"
                size={52}
                color={T.textMuted ?? '#ccc'}
              />
              <Text style={s.emptyText}>No events this day</Text>
              <Text style={s.emptyHint}>Tap + to create one</Text>
            </View>
          }
        />
      )}

      {/* ── FAB ── */}
      <TouchableOpacity
        style={[s.fab, {backgroundColor: T.primary}]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}>
        <MaterialCommunityIcons name="plus" size={26} color="#fff" />
      </TouchableOpacity>

      {/* <CreateEventModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleCreate}
        loading={creating}
        defaultDate={selectedDate} // pre-fills date when tapping FAB
      /> */}
    </ActionPaneContainer>
  );
};

const screenStyles = T =>
  StyleSheet.create({
    listContent: {
      padding: 14,
      paddingBottom: 100,
    },
    dateHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    dateLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: T.textPrimary,
    },
    eventCount: {
      fontSize: 13,
      color: T.textSecondary ?? '#888',
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      paddingTop: 60,
    },
    errorText: {
      fontSize: 14,
      color: '#e53935',
      marginTop: 12,
      textAlign: 'center',
      paddingHorizontal: 32,
    },
    retryBtn: {
      marginTop: 14,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 20,
      paddingVertical: 8,
    },
    retryText: {fontSize: 14, fontWeight: '600'},
    emptyBox: {
      alignItems: 'center',
      paddingTop: 40,
    },
    emptyText: {
      fontSize: 15,
      color: T.textSecondary ?? '#aaa',
      marginTop: 12,
      fontWeight: '600',
    },
    emptyHint: {
      fontSize: 13,
      color: T.textMuted ?? '#ccc',
      marginTop: 4,
    },
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 20,
      width: 54,
      height: 54,
      borderRadius: 27,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.2,
      shadowRadius: 6,
    },
  });

export default OutlookCalendarScreen;
