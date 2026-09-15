// screens/OutlookCalendarScreen.js
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  StatusBar,
  Modal,
  TextInput,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  Pressable,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import {
  GetCalendarEvents,
  CreateCalendarEvent,
  DeleteCalendarEvent,
} from '../../API/Outlook/outlookCalendarApi';
import {authorize} from 'react-native-app-auth';
import {getGraphConsentConfiguration} from '../../Controller/configuration';
import {
  setGraphAccessToken,
  setGraphRefreshToken,
} from '../../store/slices/authSlice';
import {store} from '../../store';
import brand from '../../theme/brand';
import {AppTokens} from '../../components/AppComponentsDesign/Tokens';

const {width: SW} = Dimensions.get('window');

// ─── Design Tokens ────────────────────────────────────────────────────────────
// Local vocabulary for this screen, with values derived from the app brand
// (src/theme/brand.js) so it is no longer a parallel colour system.
//   brand      — the brand as a FILL (buttons, selected day, today badge)
//   brandMid   — the brand as TEXT / icon / spinner (= primaryStrong)
//   brandLight — thin rings / borders in the brand colour (= primaryStrong)
//   textInverse — content ON a brand fill (= onPrimary)
// The old warm-gold `accent` collided with the mustard primary; the today
// pill is now a pale tint with brand-coloured text.
const T = {
  // Backgrounds
  bgPage: brand.pageBg,
  bgCard: brand.surface,
  bgSurface: brand.surfaceAlt,

  // Brand
  brand: brand.primary,
  brandMid: brand.primaryStrong,
  brandLight: brand.primaryStrong,
  brandPale: brand.tint,
  brandGhost: brand.surfaceAlt,

  accent: brand.tint,
  accentLight: brand.tint,
  accentDark: brand.primaryStrong,

  // Semantic
  success: '#1A8754',
  successBg: '#E3F6EC',
  danger: '#C0392B',
  dangerBg: '#FDECEA',
  warning: AppTokens.statusWaitingText,
  warningBg: AppTokens.statusWaitingBg,
  info: brand.primaryStrong,
  infoBg: brand.tint,

  // Text
  textTitle: brand.text,
  textBody: brand.text,
  textMuted: brand.secondary,
  textHint: brand.secondary,
  textInverse: brand.onPrimary,

  // Borders
  borderFaint: brand.divider,
  borderMed: brand.divider,

  // Event category palette (6 distinct)
  eventPalette: [
    AppTokens.indigo, // was deep blue
    '#7B3DB5', // purple
    '#B83D6C', // rose
    '#C47800', // amber
    '#1A8754', // emerald
    AppTokens.teal, // was sky blue
  ],

  // Radius
  r4: 4,
  r8: 8,
  r12: 12,
  r16: 16,
  r24: 24,

  // Shadows
  sh1: {
    shadowColor: AppTokens.shadowColor,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sh2: {
    shadowColor: AppTokens.shadowColor,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 4,
  },
  sh3: {
    shadowColor: AppTokens.shadowColor,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  },
};

// ─── Constants ────────────────────────────────────────────────────────────────
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
const MONTHS_SHORT = [
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
const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const WEEK_DAYS_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

// ─── Utilities ────────────────────────────────────────────────────────────────
/**
 * Graph API returns dateTime as UTC ISO without 'Z'.
 * Appending 'Z' or passing directly both work since JS Date treats
 * bare ISO strings as UTC. We then display in local timezone.
 */
const parseGD = obj => {
  if (!obj) return null;
  const s = (obj.dateTime || obj).replace('Z', '');
  // Treat as UTC
  return new Date(s + 'Z');
};

const sameDay = (a, b) =>
  a &&
  b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const fmtTime = iso => {
  if (!iso) return '';
  return parseGD(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const fmtDuration = (s, e) => {
  if (!s || !e) return '';
  const mins = (parseGD(e) - parseGD(s)) / 60000;
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60),
    m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

const eventColor = (id, idx) => {
  const hash = id ? id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : idx;
  return T.eventPalette[hash % T.eventPalette.length];
};

const relativeDay = date => {
  const today = new Date();
  const diff = Math.round(
    (new Date(date.getFullYear(), date.getMonth(), date.getDate()) -
      new Date(today.getFullYear(), today.getMonth(), today.getDate())) /
      86400000,
  );
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff > 1 && diff < 7) return `In ${diff} days`;
  if (diff === -1) return 'Yesterday';
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
};

// ─── Calendar Data Hook ───────────────────────────────────────────────────────
export const useOutlookCalendar = () => {
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestConsent = useCallback(async retry => {
    try {
      const state = store.getState();
      const hint = state.user?.userData?.email ?? null;
      const cfg = await getGraphConsentConfiguration(hint);
      const res = await authorize({
        ...cfg,
        additionalParameters: {
          prompt: 'consent',
          ...(hint && {login_hint: hint}),
        },
      });
      store.dispatch(setGraphAccessToken(res.accessToken));
      store.dispatch(setGraphRefreshToken(res.refreshToken));
      await retry();
    } catch {
      Alert.alert(
        'Permission Required',
        'Please grant access to your Outlook calendar.',
      );
    }
  }, []);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const end = new Date(now);
      end.setDate(end.getDate() + 90);
      end.setHours(23, 59, 59, 999);
      const data = await GetCalendarEvents(
        now.toISOString(),
        end.toISOString(),
        100,
      );
      setAllEvents(data.sort((a, b) => parseGD(a.start) - parseGD(b.start)));
    } catch (err) {
      if (err.message === 'GRAPH_CONSENT_REQUIRED') await requestConsent(fetch);
      else setError(err.message ?? 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [requestConsent]);

  const create = useCallback(
    async eventData => {
      const result = await CreateCalendarEvent(eventData);
      await fetch();
      return result;
    },
    [fetch],
  );

  const remove = useCallback(
    async eventId => {
      await DeleteCalendarEvent(eventId);
      await fetch();
    },
    [fetch],
  );

  return {
    allEvents,
    loading,
    error,
    fetchEvents: fetch,
    createEvent: create,
    deleteEvent: remove,
  };
};

// ─── Calendar Grid ────────────────────────────────────────────────────────────
const CELL = Math.floor((SW - 32 - 32) / 7); // derived from wrapper padding

const CalendarGrid = ({selectedDate, onSelectDate, events}) => {
  const [viewMonth, setViewMonth] = useState(() => new Date(selectedDate));
  const slideAnim = useRef(new Animated.Value(0)).current;

  const yr = viewMonth.getFullYear();
  const mo = viewMonth.getMonth();

  const eventMap = useMemo(() => {
    const m = {};
    events.forEach(ev => {
      const start = parseGD(ev.start);
      const end = parseGD(ev.end);
      // Walk each calendar day the event touches
      const cursor = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
      );
      const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      while (cursor <= endDay) {
        const k = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
        m[k] = (m[k] || 0) + 1;
        cursor.setDate(cursor.getDate() + 1);
      }
    });
    return m;
  }, [events]);

  const days = useMemo(() => {
    const first = new Date(yr, mo, 1).getDay();
    const total = new Date(yr, mo + 1, 0).getDate();
    const prevTotal = new Date(yr, mo, 0).getDate();
    const cells = [];
    for (let i = first - 1; i >= 0; i--)
      cells.push({d: new Date(yr, mo - 1, prevTotal - i), cur: false});
    for (let i = 1; i <= total; i++)
      cells.push({d: new Date(yr, mo, i), cur: true});
    while (cells.length < 42)
      cells.push({
        d: new Date(yr, mo + 1, cells.length - total - first + 1),
        cur: false,
      });
    return cells;
  }, [yr, mo]);

  const slideMonth = dir => {
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: dir * -30,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
    setViewMonth(new Date(yr, mo + dir, 1));
  };

  const today = new Date();

  return (
    <View style={cg.wrapper}>
      {/* Month Nav */}
      <View style={cg.nav}>
        <TouchableOpacity onPress={() => slideMonth(-1)} style={cg.navBtn}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={22}
            color={T.brandMid}
          />
        </TouchableOpacity>
        <View style={cg.navCenter}>
          <Text style={cg.navMonth}>{MONTHS[mo]}</Text>
          <Text style={cg.navYear}>{yr}</Text>
        </View>
        <TouchableOpacity onPress={() => slideMonth(1)} style={cg.navBtn}>
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={T.brandMid}
          />
        </TouchableOpacity>
      </View>

      {/* Week day headers */}
      <View style={cg.weekRow}>
        {WEEK_DAYS.map((d, i) => (
          <Text key={i} style={[cg.weekLabel, i === 0 && {color: T.danger}]}>
            {d}
          </Text>
        ))}
      </View>

      {/* Grid */}
      <Animated.View style={[cg.grid, {transform: [{translateX: slideAnim}]}]}>
        {days.map((cell, i) => {
          const k = `${cell.d.getFullYear()}-${cell.d.getMonth()}-${cell.d.getDate()}`;
          const cnt = eventMap[k] || 0;
          const sel = sameDay(cell.d, selectedDate);
          const tod = sameDay(cell.d, today);

          return (
            <TouchableOpacity
              key={i}
              onPress={() => onSelectDate(cell.d)}
              activeOpacity={0.7}
              style={[cg.cell, {width: CELL, height: CELL + 8}]}>
              <View
                style={[
                  cg.dayCircle,
                  {width: CELL - 8, height: CELL - 8},
                  tod && cg.todayRing,
                  sel && cg.selCircle,
                ]}>
                <Text
                  style={[
                    cg.dayNum,
                    !cell.cur && cg.dimDay,
                    tod && cg.todayNum,
                    sel && cg.selNum,
                  ]}>
                  {cell.d.getDate()}
                </Text>
              </View>
              {cnt > 0 && (
                <View style={cg.dotsRow}>
                  {Array.from({length: Math.min(cnt, 3)}).map((_, j) => (
                    <View
                      key={j}
                      style={[cg.dot, sel && {backgroundColor: T.textInverse}]}
                    />
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </Animated.View>

      {/* Today shortcut */}
      <TouchableOpacity
        onPress={() => {
          setViewMonth(new Date());
          onSelectDate(new Date());
        }}
        style={cg.todayPill}>
        <Text style={cg.todayPillText}>Jump to Today</Text>
      </TouchableOpacity>
    </View>
  );
};

const cg = StyleSheet.create({
  wrapper: {
    backgroundColor: T.bgCard,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: T.r24,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 14,
    ...T.sh2,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.brandGhost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCenter: {alignItems: 'center'},
  navMonth: {
    fontSize: 18,
    fontWeight: '700',
    color: T.textTitle,
    letterSpacing: -0.3,
  },
  navYear: {fontSize: 12, color: T.textMuted, marginTop: 2, fontWeight: '500'},
  weekRow: {flexDirection: 'row', marginBottom: 6},
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: T.textHint,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  grid: {flexDirection: 'row', flexWrap: 'wrap'},
  cell: {alignItems: 'center', justifyContent: 'center', paddingVertical: 2},
  dayCircle: {
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayRing: {borderWidth: 2, borderColor: T.brandLight},
  selCircle: {backgroundColor: T.brand},
  dayNum: {fontSize: 14, fontWeight: '500', color: T.textBody},
  dimDay: {color: T.textHint},
  todayNum: {color: T.brandMid, fontWeight: '700'},
  selNum: {color: T.textInverse, fontWeight: '700'},
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
    height: 5,
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: T.accent,
  },
  todayPill: {
    alignSelf: 'center',
    marginTop: 10,
    backgroundColor: T.brandGhost,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: T.r24,
  },
  todayPillText: {fontSize: 12, fontWeight: '600', color: T.brandMid},
});

// ─── Upcoming Strip ───────────────────────────────────────────────────────────
const UpcomingStrip = ({events, onPressEvent}) => {
  const upcoming = useMemo(() => {
    const now = new Date();
    return events.filter(e => parseGD(e.start) >= now).slice(0, 6);
  }, [events]);

  if (!upcoming.length) return null;

  return (
    <View style={up.container}>
      <View style={up.header}>
        <MaterialCommunityIcons
          name="lightning-bolt"
          size={16}
          color={T.accent}
        />
        <Text style={up.heading}>Upcoming</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={up.scroll}>
        {upcoming.map((ev, i) => {
          const d = parseGD(ev.start);
          const col = eventColor(ev.id, i);
          return (
            <TouchableOpacity
              key={ev.id || i}
              onPress={() => onPressEvent && onPressEvent(ev)}
              activeOpacity={0.8}
              style={[up.card, {borderTopColor: col}]}>
              <View style={[up.colorDot, {backgroundColor: col}]} />
              <Text style={up.cardTime}>
                {ev.isAllDay ? 'All day' : fmtTime(ev.start?.dateTime)}
              </Text>
              <Text style={up.cardDate}>{relativeDay(d)}</Text>
              <Text style={up.cardSubject} numberOfLines={2}>
                {ev.subject}
              </Text>
              {ev.location?.displayName ? (
                <View style={up.locRow}>
                  <MaterialCommunityIcons
                    name="map-marker-outline"
                    size={11}
                    color={T.textHint}
                  />
                  <Text style={up.locText} numberOfLines={1}>
                    {ev.location.displayName}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const up = StyleSheet.create({
  container: {marginBottom: 8},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 20,
    marginBottom: 12,
    marginTop: 20,
  },
  heading: {
    fontSize: 14,
    fontWeight: '700',
    color: T.textTitle,
    letterSpacing: 0.2,
  },
  scroll: {paddingHorizontal: 16, paddingBottom: 4, gap: 10},
  card: {
    width: 162,
    backgroundColor: T.bgCard,
    borderRadius: T.r16,
    padding: 14,
    borderTopWidth: 3,
    ...T.sh1,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  cardTime: {
    fontSize: 12,
    fontWeight: '700',
    color: T.brandMid,
    marginBottom: 2,
  },
  cardDate: {
    fontSize: 10,
    color: T.textMuted,
    marginBottom: 6,
    fontWeight: '500',
  },
  cardSubject: {
    fontSize: 13,
    fontWeight: '600',
    color: T.textTitle,
    lineHeight: 18,
    marginBottom: 6,
  },
  locRow: {flexDirection: 'row', alignItems: 'center', gap: 3},
  locText: {fontSize: 11, color: T.textMuted, flex: 1},
});

// ─── Day Header Bar ───────────────────────────────────────────────────────────
const DayHeaderBar = ({date, count}) => {
  const tod = sameDay(date, new Date());
  return (
    <View style={dh.container}>
      <View style={[dh.badge, tod && dh.todayBadge]}>
        <Text style={[dh.badgeNum, tod && dh.todayBadgeNum]}>
          {date.getDate()}
        </Text>
        <Text style={[dh.badgeMo, tod && dh.todayBadgeMo]}>
          {MONTHS_SHORT[date.getMonth()]}
        </Text>
      </View>
      <View style={dh.info}>
        <Text style={[dh.dayName, tod && {color: T.brandMid}]}>
          {tod ? 'Today' : WEEK_DAYS_FULL[date.getDay()]}
        </Text>
        {count > 0 && (
          <Text style={dh.countText}>
            {count} {count === 1 ? 'event' : 'events'}
          </Text>
        )}
      </View>
      <View style={dh.line} />
    </View>
  );
};

const dh = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 6,
  },
  badge: {
    width: 46,
    height: 46,
    borderRadius: T.r12,
    backgroundColor: T.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: T.borderFaint,
  },
  todayBadge: {backgroundColor: T.brand, borderColor: T.brand},
  badgeNum: {
    fontSize: 18,
    fontWeight: '800',
    color: T.textTitle,
    lineHeight: 20,
  },
  badgeMo: {
    fontSize: 10,
    fontWeight: '600',
    color: T.textMuted,
    letterSpacing: 0.5,
  },
  todayBadgeNum: {color: T.textInverse},
  todayBadgeMo: {color: brand.onPrimaryMuted},
  info: {gap: 2},
  dayName: {fontSize: 16, fontWeight: '700', color: T.textTitle},
  countText: {fontSize: 12, color: T.textMuted, fontWeight: '500'},
  line: {flex: 1, height: 1, backgroundColor: T.borderFaint, marginLeft: 10},
});

// ─── Event Card ───────────────────────────────────────────────────────────────
const EventCard = ({event, index, onDelete}) => {
  const [expanded, setExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const col = eventColor(event.id, index);
  const isPast = parseGD(event.start) < new Date();

  const toggle = () => {
    Animated.timing(expandAnim, {
      toValue: expanded ? 0 : 1,
      duration: 220,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  const extraHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 80],
  });

  return (
    <TouchableOpacity
      onPress={toggle}
      activeOpacity={0.95}
      style={[ec.wrapper, isPast && ec.past]}>
      {/* Left accent stripe */}
      <View style={[ec.stripe, {backgroundColor: col}]} />

      <View style={ec.body}>
        {/* Top row */}
        <View style={ec.topRow}>
          <View style={ec.timeBlock}>
            {event.isAllDay ? (
              <Text style={[ec.timeMain, {color: col}]}>All Day</Text>
            ) : (
              <>
                <Text style={[ec.timeMain, {color: col}]}>
                  {fmtTime(event.start?.dateTime)}
                </Text>
                <Text style={ec.timeEnd}>{fmtTime(event.end?.dateTime)}</Text>
              </>
            )}
          </View>
          <View style={ec.main}>
            <Text style={ec.subject} numberOfLines={expanded ? 0 : 2}>
              {event.subject}
            </Text>
          </View>
          <View style={ec.actions}>
            <TouchableOpacity
              onPress={() => onDelete(event.id)}
              style={ec.delBtn}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={16}
                color={T.textHint}
              />
            </TouchableOpacity>
            <MaterialCommunityIcons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={T.textHint}
              style={{marginTop: 6}}
            />
          </View>
        </View>

        {/* Chips row */}
        <View style={ec.chips}>
          {!event.isAllDay && (
            <View style={[ec.chip, {backgroundColor: col + '18'}]}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={11}
                color={col}
              />
              <Text style={[ec.chipTxt, {color: col}]}>
                {fmtDuration(event.start?.dateTime, event.end?.dateTime)}
              </Text>
            </View>
          )}
          {event.location?.displayName ? (
            <View style={ec.chip}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={11}
                color={T.textMuted}
              />
              <Text style={ec.chipTxt} numberOfLines={1}>
                {event.location.displayName}
              </Text>
            </View>
          ) : null}
          {event.attendees?.length > 0 && (
            <View style={ec.chip}>
              <MaterialCommunityIcons
                name="account-multiple-outline"
                size={11}
                color={T.textMuted}
              />
              <Text style={ec.chipTxt}>{event.attendees.length} people</Text>
            </View>
          )}
          {event.onlineMeetingUrl && (
            <View style={[ec.chip, {backgroundColor: T.successBg}]}>
              <MaterialCommunityIcons
                name="video-outline"
                size={11}
                color={T.success}
              />
              <Text style={[ec.chipTxt, {color: T.success}]}>Teams</Text>
            </View>
          )}
        </View>

        {/* Expanded detail */}
        <Animated.View style={{overflow: 'hidden', maxHeight: extraHeight}}>
          {event.bodyPreview ? (
            <Text style={ec.preview}>{event.bodyPreview}</Text>
          ) : null}
          {event.organizer?.emailAddress?.address ? (
            <View style={ec.organizerRow}>
              <Text style={ec.orgLabel}>Organizer </Text>
              <Text style={ec.orgValue}>
                {event.organizer.emailAddress.address}
              </Text>
            </View>
          ) : null}
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

const ec = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    backgroundColor: T.bgCard,
    borderRadius: T.r16,
    marginBottom: 10,
    marginHorizontal: 16,
    overflow: 'hidden',
    ...T.sh1,
  },
  past: {opacity: 0.55},
  stripe: {width: 4},
  body: {flex: 1, padding: 14, gap: 8},
  topRow: {flexDirection: 'row', gap: 10, alignItems: 'flex-start'},
  timeBlock: {width: 62, gap: 3},
  timeMain: {fontSize: 13, fontWeight: '700', lineHeight: 16},
  timeEnd: {fontSize: 11, color: T.textMuted, fontWeight: '500'},
  main: {flex: 1},
  subject: {
    fontSize: 15,
    fontWeight: '600',
    color: T.textTitle,
    lineHeight: 21,
  },
  actions: {alignItems: 'center', gap: 2},
  delBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: T.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 6},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: T.bgSurface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: T.r8,
  },
  chipTxt: {fontSize: 11, color: T.textMuted, fontWeight: '500', maxWidth: 110},
  preview: {fontSize: 13, color: T.textMuted, lineHeight: 19},
  organizerRow: {flexDirection: 'row', alignItems: 'center'},
  orgLabel: {fontSize: 12, color: T.textHint, fontWeight: '600'},
  orgValue: {fontSize: 12, color: T.textBody, flex: 1},
});

// ─── Move this OUTSIDE CreateEventModal (at module level) ────────────────────
const Field = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  inputRef,
  onSubmitEditing,
  returnKeyType,
}) => (
  <View style={cm.fieldWrap}>
    <Text style={cm.fieldLabel}>{label}</Text>
    <TextInput
      ref={inputRef}
      style={cm.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={T.textHint}
      keyboardType={keyboardType || 'default'}
      autoCapitalize="none"
      blurOnSubmit={false}
      returnKeyType={returnKeyType || 'next'}
      onSubmitEditing={onSubmitEditing}
    />
  </View>
);

const CreateEventModal = ({visible, onClose, onSave, defaultDate}) => {
  const [subject, setSubject] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const opacAnim = useRef(new Animated.Value(0)).current;

  const subjectRef = useRef(null);
  const dateRef = useRef(null);
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);
  const locationRef = useRef(null);

  useEffect(() => {
    if (visible) {
      if (defaultDate) {
        const y = defaultDate.getFullYear();
        const m = String(defaultDate.getMonth() + 1).padStart(2, '0');
        const d = String(defaultDate.getDate()).padStart(2, '0');
        setDateStr(`${y}-${m}-${d}`);
      }
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(opacAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.92);
      opacAnim.setValue(0);
      setSubject('');
      setDateStr('');
      setStartTime('');
      setEndTime('');
      setLocation('');
    }
  }, [visible, defaultDate, opacAnim, scaleAnim]);

  const handleSave = async () => {
    if (!subject.trim()) {
      Alert.alert('Required', 'Please enter an event title.');
      return;
    }
    if (!dateStr || !startTime || !endTime) {
      Alert.alert('Required', 'Please enter date, start time, and end time.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        subject: subject.trim(),
        start: {dateTime: `${dateStr}T${startTime}:00`, timeZone: 'UTC'},
        end: {dateTime: `${dateStr}T${endTime}:00`, timeZone: 'UTC'},
        ...(location.trim() && {location: {displayName: location.trim()}}),
      });
      onClose();
    } catch (e) {
      Alert.alert('Error', e.message ?? 'Failed to create event.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape']}>
      <View style={cm.overlay}>
        <Pressable style={cm.backdropPressable} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          style={cm.keyboardView}>
          <Animated.View
            style={[
              cm.sheet,
              {transform: [{scale: scaleAnim}], opacity: opacAnim},
            ]}>
            {/* Header */}
            <View style={cm.modalHeader}>
              <View style={cm.headerLeft}>
                <View style={cm.headerIcon}>
                  <MaterialCommunityIcons
                    name="calendar-plus"
                    size={20}
                    color={T.brandMid}
                  />
                </View>
                <Text style={cm.modalTitle}>New Event</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={cm.closeBtn}>
                <MaterialCommunityIcons
                  name="close"
                  size={18}
                  color={T.textMuted}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={cm.formScroll}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="none">
              <Field
                label="Title *"
                value={subject}
                onChangeText={setSubject}
                placeholder="Event title"
                inputRef={subjectRef}
                returnKeyType="next"
                onSubmitEditing={() => dateRef.current?.focus()}
              />

              {/* Date row */}
              <View style={cm.fieldWrap}>
                <Text style={cm.fieldLabel}>Date *</Text>
                <TextInput
                  ref={dateRef}
                  style={cm.input}
                  value={dateStr}
                  onChangeText={setDateStr}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={T.textHint}
                  keyboardType="numbers-and-punctuation"
                  blurOnSubmit={false}
                  returnKeyType="next"
                  onSubmitEditing={() => startTimeRef.current?.focus()}
                />
              </View>

              {/* Time row */}
              <View style={cm.timeRow}>
                <View style={[cm.fieldWrap, {flex: 1}]}>
                  <Text style={cm.fieldLabel}>Start *</Text>
                  <TextInput
                    ref={startTimeRef}
                    style={cm.input}
                    value={startTime}
                    onChangeText={setStartTime}
                    placeholder="HH:MM"
                    placeholderTextColor={T.textHint}
                    keyboardType="numbers-and-punctuation"
                    blurOnSubmit={false}
                    returnKeyType="next"
                    onSubmitEditing={() => endTimeRef.current?.focus()}
                  />
                </View>
                <View style={cm.timeSep}>
                  <Text style={cm.timeSepText}>→</Text>
                </View>
                <View style={[cm.fieldWrap, {flex: 1}]}>
                  <Text style={cm.fieldLabel}>End *</Text>
                  <TextInput
                    ref={endTimeRef}
                    style={cm.input}
                    value={endTime}
                    onChangeText={setEndTime}
                    placeholder="HH:MM"
                    placeholderTextColor={T.textHint}
                    keyboardType="numbers-and-punctuation"
                    blurOnSubmit={false}
                    returnKeyType="next"
                    onSubmitEditing={() => locationRef.current?.focus()}
                  />
                </View>
              </View>

              <Field
                label="Location"
                value={location}
                onChangeText={setLocation}
                placeholder="Conference room, Teams link..."
                inputRef={locationRef}
                returnKeyType="done"
              />

              {/* Helper note */}
              <View style={cm.helperRow}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={13}
                  color={T.textHint}
                />
                <Text style={cm.helperText}>
                  Times are in UTC. Use 24-hour format (e.g. 14:30).
                </Text>
              </View>

              <View style={{height: 20}} />
            </ScrollView>

            {/* Footer */}
            <View style={cm.footer}>
              <TouchableOpacity onPress={onClose} style={cm.cancelBtn}>
                <Text style={cm.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={[cm.saveBtn, saving && {opacity: 0.6}]}>
                {saving ? (
                  <ActivityIndicator size="small" color={T.textInverse} />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="check"
                      size={16}
                      color={T.textInverse}
                    />
                    <Text style={cm.saveTxt}>Save Event</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const cm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,20,40,0.55)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardView: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: T.bgCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: T.borderFaint,
  },
  headerLeft: {flexDirection: 'row', alignItems: 'center', gap: 10},
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: T.r12,
    backgroundColor: T.brandGhost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {fontSize: 17, fontWeight: '700', color: T.textTitle},
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: T.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formScroll: {paddingHorizontal: 20, paddingTop: 8},
  fieldWrap: {marginBottom: 14},
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: T.textMuted,
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: T.bgSurface,
    borderRadius: T.r12,
    borderWidth: 1,
    borderColor: T.borderFaint,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: T.textTitle,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginBottom: 14,
  },
  timeSep: {paddingBottom: 12, alignItems: 'center'},
  timeSepText: {fontSize: 16, color: T.textHint},
  helperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: T.infoBg,
    padding: 12,
    borderRadius: T.r8,
    marginBottom: 20,
  },
  helperText: {fontSize: 12, color: T.info, flex: 1, lineHeight: 17},
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: T.borderFaint,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: T.bgSurface,
    borderRadius: T.r12,
    borderWidth: 1,
    borderColor: T.borderMed,
  },
  cancelTxt: {fontSize: 15, fontWeight: '600', color: T.textMuted},
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.brand,
    borderRadius: T.r12,
  },
  saveTxt: {fontSize: 15, fontWeight: '700', color: T.textInverse},
});

// ─── Empty / Loading / Error ──────────────────────────────────────────────────
const EmptyDay = ({onCreatePress}) => (
  <View style={st.emptyWrap}>
    <View style={st.emptyIcon}>
      <MaterialCommunityIcons
        name="calendar-blank-outline"
        size={44}
        color={T.textHint}
      />
    </View>
    <Text style={st.emptyTitle}>No events this day</Text>
    <Text style={st.emptySub}>Tap the button below to schedule something</Text>
    <TouchableOpacity onPress={onCreatePress} style={st.emptyBtn}>
      <MaterialCommunityIcons name="plus" size={16} color={T.brandMid} />
      <Text style={st.emptyBtnTxt}>New Event</Text>
    </TouchableOpacity>
  </View>
);

const Loader = () => (
  <View style={st.center}>
    <View style={st.loaderCard}>
      <ActivityIndicator size="large" color={T.brandMid} />
      <Text style={st.loaderTxt}>Syncing calendar…</Text>
    </View>
  </View>
);

const ErrView = ({msg, onRetry}) => (
  <View style={st.center}>
    <View style={st.errCard}>
      <View style={st.errIcon}>
        <MaterialCommunityIcons
          name="cloud-off-outline"
          size={40}
          color={T.danger}
        />
      </View>
      <Text style={st.errTitle}>Couldn't load calendar</Text>
      <Text style={st.errMsg}>{msg}</Text>
      <TouchableOpacity onPress={onRetry} style={st.retryBtn}>
        <MaterialCommunityIcons
          name="refresh"
          size={16}
          color={T.textInverse}
        />
        <Text style={st.retryTxt}>Retry</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const st = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loaderCard: {
    backgroundColor: T.bgCard,
    borderRadius: T.r24,
    padding: 32,
    alignItems: 'center',
    gap: 14,
    ...T.sh2,
  },
  loaderTxt: {fontSize: 15, color: T.textMuted, fontWeight: '500'},
  errCard: {
    backgroundColor: T.bgCard,
    borderRadius: T.r24,
    padding: 28,
    alignItems: 'center',
    gap: 10,
    ...T.sh2,
    width: '100%',
  },
  errIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: T.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  errTitle: {fontSize: 17, fontWeight: '700', color: T.textTitle},
  errMsg: {
    fontSize: 14,
    color: T.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: T.brand,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: T.r12,
    marginTop: 6,
  },
  retryTxt: {fontSize: 14, fontWeight: '600', color: T.textInverse},
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: T.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: T.borderFaint,
  },
  emptyTitle: {fontSize: 17, fontWeight: '600', color: T.textBody},
  emptySub: {
    fontSize: 14,
    color: T.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: T.brandGhost,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: T.r12,
  },
  emptyBtnTxt: {fontSize: 14, fontWeight: '600', color: T.brandMid},
});

// ─── FAB ──────────────────────────────────────────────────────────────────────
const FAB = ({onPress}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(scaleAnim, {toValue: 0.92, useNativeDriver: true}).start();
  const pressOut = () =>
    Animated.spring(scaleAnim, {toValue: 1, useNativeDriver: true}).start();

  return (
    <Animated.View style={[fab.wrap, {transform: [{scale: scaleAnim}]}]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={1}
        style={fab.btn}>
        <MaterialCommunityIcons name="plus" size={22} color={T.textInverse} />
        <Text style={fab.txt}>New Event</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const fab = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    ...T.sh3,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: T.brand,
    paddingLeft: 18,
    paddingRight: 22,
    paddingVertical: 14,
    borderRadius: 100,
  },
  txt: {fontSize: 15, fontWeight: '700', color: T.textInverse},
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const OutlookCalendarScreen = () => {
  const navigation = useNavigation();
  const {allEvents, loading, error, fetchEvents, createEvent, deleteEvent} =
    useOutlookCalendar();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const selectedEvents = useMemo(
    () =>
      allEvents.filter(e => {
        const start = parseGD(e.start);
        const end = parseGD(e.end);
        const selStart = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
        );
        const selEnd = new Date(selStart.getTime() + 86400000);
        return start < selEnd && end > selStart;
      }),
    [allEvents, selectedDate],
  );

  const handleDelete = useCallback(
    eventId => {
      Alert.alert('Delete Event', 'Remove this event from your calendar?', [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(eventId);
            } catch (e) {
              Alert.alert('Error', e.message ?? 'Could not delete event');
            }
          },
        },
      ]);
    },
    [deleteEvent],
  );

  const handleGoBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('MainDashboard');
  };

  const listData = useMemo(
    () => [
      {type: 'UPCOMING'},
      {type: 'CALENDAR'},
      {type: 'DAY_HEADER'},
      ...(selectedEvents.length > 0
        ? selectedEvents.map((ev, i) => ({type: 'EVENT', event: ev, index: i}))
        : [{type: 'EMPTY'}]),
    ],
    [selectedEvents],
  );

  const renderItem = ({item}) => {
    switch (item.type) {
      case 'UPCOMING':
        return (
          <UpcomingStrip
            events={allEvents}
            onPressEvent={ev => setSelectedDate(parseGD(ev.start))}
          />
        );
      case 'CALENDAR':
        return (
          <CalendarGrid
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            events={allEvents}
          />
        );
      case 'DAY_HEADER':
        return (
          <DayHeaderBar date={selectedDate} count={selectedEvents.length} />
        );
      case 'EVENT':
        return (
          <EventCard
            event={item.event}
            index={item.index}
            onDelete={handleDelete}
          />
        );
      case 'EMPTY':
        return <EmptyDay onCreatePress={() => setShowCreate(true)} />;
      default:
        return null;
    }
  };

  return (
    <>
      <ActionPaneContainer
        pageTitle="Calendar"
        showFooter
        isHeaderActive
        onBackPress={handleGoBack}
        onRefresh={fetchEvents}
        showFloatingButton={false}
        showPageTitleRow={true}
        showSearchBar={false}
        showFilterPills={false}>
        {loading ? (
          <Loader />
        ) : error ? (
          <ErrView msg={error} onRetry={fetchEvents} />
        ) : (
          <FlatList
            data={listData}
            keyExtractor={(item, i) =>
              item.type === 'EVENT' ? item.event?.id || i.toString() : item.type
            }
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 120,
            }}
          />
        )}
        <FAB onPress={() => setShowCreate(true)} />
      </ActionPaneContainer>

      <CreateEventModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSave={createEvent}
        defaultDate={selectedDate}
      />
    </>
  );
};

export default OutlookCalendarScreen;
