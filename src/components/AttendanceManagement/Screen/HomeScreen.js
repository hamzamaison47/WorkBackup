/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
// ─────────────────────────────────────────────
// components/AttendanceManagement/screens/HomeScreen.js
// ─────────────────────────────────────────────
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Linking,
  Platform,
  Dimensions,
  StyleSheet,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useGeofence} from '../GeofenceContext';
import LocationPickerModal from '../LocationPickerModal';
import NavigationFAB from '../NavigationFAB';
import {
  loadRecords,
  formatTime,
  formatDateShort,
  formatDuration,
  formatDurationShort,
  isToday,
  getSessionStats,
} from '../../../screens/AttendanceManagement/helpers';
import {C, R, Sh} from '../theme';
import useAppTokens from '../../AppComponentsDesign/useAppTokens';
import PageBackground from '../../AppComponentsDesign/PageBackground';
import {
  conditionalScale,
  conditionalVerticalScale,
} from '../../../store/utils/scaling';

// ─────────────────────────────────────────────
// Permission denied
// ─────────────────────────────────────────────
const PermissionDeniedView = ({onNavigate}) => (
  <View style={S.stateWrap}>
    <View style={[S.stateIconCircle, {backgroundColor: C.redLight}]}>
      <Text style={S.stateEmoji}>📍</Text>
    </View>
    <Text style={S.stateTitle}>Location Access Required</Text>
    <Text style={S.stateSub}>
      Attendance tracking needs your location to confirm you are at an
      authorised office zone before clocking in or out.
    </Text>
    <TouchableOpacity
      style={S.stateBtn}
      onPress={() =>
        Platform.OS === 'android'
          ? Linking.openSettings()
          : Linking.openURL('app-settings:')
      }>
      <Text style={S.stateBtnTxt}>Open Settings</Text>
    </TouchableOpacity>
    <NavigationFAB activeScreen="Home" onNavigate={onNavigate} />
  </View>
);

// ─────────────────────────────────────────────
// GPS loading
// ─────────────────────────────────────────────
const LoadingView = ({onNavigate}) => (
  <View style={S.stateWrap}>
    <View style={[S.stateIconCircle, {backgroundColor: C.blueLight}]}>
      <ActivityIndicator size="large" color={C.blue} />
    </View>
    <Text style={S.stateTitle}>Getting Your Location</Text>
    <Text style={S.stateSub}>
      Verifying GPS signal and checking authorised office zones…
    </Text>
    <NavigationFAB activeScreen="Home" onNavigate={onNavigate} />
  </View>
);

// ─────────────────────────────────────────────
// GPS unavailable
// ─────────────────────────────────────────────
const GPSUnavailableView = ({onNavigate, onRetry}) => (
  <View style={S.stateWrap}>
    <View style={[S.stateIconCircle, {backgroundColor: C.amberLight}]}>
      <Text style={S.stateEmoji}>🛰</Text>
    </View>
    <Text style={S.stateTitle}>GPS Unavailable</Text>
    <Text style={S.stateSub}>
      Unable to get your location. Make sure GPS / Location Services are enabled
      on your device.
    </Text>
    <TouchableOpacity
      style={[S.stateBtn, {marginBottom: 12}]}
      onPress={() =>
        Platform.OS === 'android'
          ? Linking.openSettings()
          : Linking.openURL('app-settings:')
      }>
      <Text style={S.stateBtnTxt}>Open Settings</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[
        S.stateBtn,
        {backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border},
      ]}
      onPress={onRetry}>
      <Text style={[S.stateBtnTxt, {color: C.ink}]}>Retry</Text>
    </TouchableOpacity>
    <NavigationFAB activeScreen="Home" onNavigate={onNavigate} />
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Location Status Banner
// ─────────────────────────────────────────────────────────────────────────────
const LocationBanner = ({
  matchedFence,
  locationLoading,
  locationError,
  coords,
  onPress,
}) => {
  const T = useAppTokens();
  const matched = !!matchedFence;

  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: matched ? T.greenBg : T.redBg,
        borderRadius: conditionalScale(10, 11, 12, 12),
        padding: conditionalScale(12, 13, 14, 14),
        marginBottom: conditionalVerticalScale(14, 15, 16, 16),
        borderLeftWidth: 4,
        borderLeftColor: matched ? T.green : T.red,
      }}
      onPress={onPress}
      activeOpacity={0.7}>
      <View
        style={{
          width: conditionalScale(36, 38, 40, 40),
          height: conditionalScale(36, 38, 40, 40),
          borderRadius: conditionalScale(18, 19, 20, 20),
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: matched ? T.green : T.red,
          marginRight: conditionalScale(10, 11, 12, 12),
        }}>
        <Text style={{fontSize: 16}}>{matched ? '📍' : '⚠️'}</Text>
      </View>

      <View style={{flex: 1}}>
        {locationLoading ? (
          <View style={S.locationCardLoading}>
            <ActivityIndicator size="small" color={C.blue} />
            <Text
              style={[S.locationCardName, {color: C.inkMuted, fontSize: 13}]}>
              Verifying…
            </Text>
          </View>
        ) : (
          <>
            <Text
              style={[S.locationCardName, !matched && {color: C.redDark}]}
              numberOfLines={1}>
              {matched
                ? matchedFence.FenceName
                : locationError ?? 'No authorised zone matched'}
            </Text>
            {matched && matchedFence.distanceMetres != null && (
              <Text style={S.locationCardMeta}>
                Within zone · {matchedFence.distanceMetres} m away
              </Text>
            )}
            {matched && coords && (
              <Text style={S.locationCardCoords}>
                {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                {coords.accuracy
                  ? `  ·  ±${Math.round(coords.accuracy)} m`
                  : ''}
              </Text>
            )}
          </>
        )}
      </View>
      <Text
        style={[
          S.locationCardArrow,
          {color: matched ? C.greenDark : C.redDark},
        ]}>
        ›
      </Text>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────
// Today's activity timeline
// ─────────────────────────────────────────────
const ActivityTimeline = ({events}) => {
  if (!events.length) return null;

  const DOT_COLORS = {
    ClockIn: C.greenMid,
    BreakStart: C.amber,
    ClockOut: C.redMid,
  };

  const LABELS = {
    ClockIn: 'Clock In',
    BreakStart: 'Break',
    ClockOut: 'Clock Out',
  };

  return (
    <View style={S.card}>
      <Text style={S.cardTitle}>Today's Activity</Text>
      <View style={S.cardDivider} />
      {events.map((ev, i) => (
        <View key={i} style={S.activityRow}>
          <View style={S.activityLeft}>
            <View
              style={[
                S.activityDot,
                {backgroundColor: DOT_COLORS[ev.type] ?? C.inkFaint},
              ]}
            />
            <Text style={S.activityLabel}>
              {LABELS[ev.type] ?? ev.type}
              {ev.durationMs ? ` (${formatDurationShort(ev.durationMs)})` : ''}
            </Text>
          </View>
          <Text style={S.activityTime}>{formatTime(ev.time)}</Text>
        </View>
      ))}
    </View>
  );
};

// ─────────────────────────────────────────────
// Skeleton Loader
// ─────────────────────────────────────────────
const SkeletonBox = ({width, height, style}) => (
  <View
    style={[
      {
        width,
        height,
        borderRadius: 6,
        backgroundColor: '#E5E7EB',
        overflow: 'hidden',
      },
      style,
    ]}
  />
);

// ─────────────────────────────────────────────
// Main HomeScreen
// ─────────────────────────────────────────────
const HomeScreen = ({onNavigate}) => {
  const T = useAppTokens();
  const [lastOut, setLastOut] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [todayEvents, setTodayEvents] = useState([]);
  const [todayStats, setTodayStats] = useState({sessions: 0, worked: 0});
  const [recordsLoading, setRecordsLoading] = useState(true);

  const {
    permissionStatus,
    locationLoading,
    locationError,
    matchedFence,
    coords,
    refresh,
  } = useGeofence();

  const {userData} = useSelector(s => s.user);
  const person = userData?.Person;

  useEffect(() => {
    (async () => {
      if (!person) {
        setRecordsLoading(false);
        return;
      }
      setRecordsLoading(true);
      const records = await loadRecords({person});
      if (!records.length) {
        setRecordsLoading(false);
        return;
      }

      // Last session status
      const last = records[records.length - 1];
      if (last.clockOut) setLastOut(last.clockOut);
      setIsActive(!last.clockOut);

      // Build today's events
      const todayRecords = records.filter(r => r.clockIn && isToday(r.clockIn));
      const events = [];
      let totalWorkedMs = 0;

      todayRecords.forEach(r => {
        if (r.clockIn) {
          events.push({type: 'ClockIn', time: r.clockIn});
        }
        (r.breaks || []).forEach(b => {
          if (b.breakStart) {
            const durationMs = b.breakEnd
              ? new Date(b.breakEnd) - new Date(b.breakStart)
              : null;
            events.push({type: 'BreakStart', time: b.breakStart, durationMs});
          }
        });
        if (r.clockOut) {
          events.push({type: 'ClockOut', time: r.clockOut});
        }
        const stats = getSessionStats(r);
        if (stats) totalWorkedMs += stats.netMs;
      });

      events.sort((a, b) => new Date(a.time) - new Date(b.time));
      setTodayEvents(events);
      setTodayStats({
        sessions: todayRecords.length,
        worked: totalWorkedMs,
      });
      setRecordsLoading(false);
    })();
  }, [person]);

  // ── Permission denied ─────────────────────────────────────
  if (permissionStatus === 'denied') {
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: T.pageBg}}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={T.pageBg}
          translucent={false}
        />
        <PermissionDeniedView onNavigate={onNavigate} />
      </SafeAreaView>
    );
  }

  // ── Loading GPS ──────────────────────────────────────────
  if (permissionStatus === 'unknown' || (locationLoading && !coords)) {
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: T.pageBg}}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={T.pageBg}
          translucent={false}
        />
        <LoadingView onNavigate={onNavigate} />
      </SafeAreaView>
    );
  }

  // ── No GPS fix ───────────────────────────────────────────
  if (!locationLoading && !coords && permissionStatus === 'granted') {
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: T.pageBg}}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={T.pageBg}
          translucent={false}
        />
        <GPSUnavailableView onNavigate={onNavigate} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  const showWarning = !locationLoading && !!locationError && !matchedFence;
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();
  const employeeName = userData?.employeeName || userData?.Name || 'there';

  return (
    <PageBackground>
      <SafeAreaView style={{flex: 1}}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={T.pageBg}
          translucent={false}
        />

        <ScrollView
          contentContainerStyle={S.scroll}
          showsVerticalScrollIndicator={false}>
          {/* ── Warning banner ── */}
          {showWarning && (
            <TouchableOpacity
              style={S.warningBanner}
              onPress={refresh}
              activeOpacity={0.8}>
              <Text style={S.warningIcon}>⚠️</Text>
              <View style={{flex: 1}}>
                <Text style={S.warningTitle}>Location Issue</Text>
                <Text style={S.warningText} numberOfLines={2}>
                  {locationError} Tap to retry.
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* ── Location card ── */}
          <LocationBanner
            matchedFence={matchedFence}
            locationLoading={locationLoading}
            locationError={locationError}
            coords={coords}
            onPress={() => setModalVisible(true)}
          />

          {/* ── Stats row ── */}
          {recordsLoading ? (
            <View style={S.statsRow}>
              <SkeletonBox width="31%" height={72} style={{borderRadius: 12}} />
              <SkeletonBox width="31%" height={72} style={{borderRadius: 12}} />
              <SkeletonBox width="31%" height={72} style={{borderRadius: 12}} />
            </View>
          ) : (
            <View style={S.statsRow}>
              <View style={[S.statCard, {backgroundColor: C.greenLight}]}>
                <Text style={[S.statNum, {color: C.greenDark}]}>
                  {todayStats.sessions}
                </Text>
                <Text style={S.statLabel}>Sessions</Text>
              </View>
              <View style={[S.statCard, {backgroundColor: C.blueLight}]}>
                <Text style={[S.statNum, {color: C.blueDark, fontSize: 18}]}>
                  {formatDuration(todayStats.worked)}
                </Text>
                <Text style={S.statLabel}>Worked</Text>
              </View>
              <View
                style={[
                  S.statCard,
                  {
                    backgroundColor: C.surfaceAlt,
                    borderWidth: 1,
                    borderColor: C.border,
                  },
                ]}>
                <Text
                  style={[
                    S.statNum,
                    {color: isActive ? C.greenDark : C.inkSub},
                  ]}>
                  {isActive ? 'In' : 'Out'}
                </Text>
                <Text style={S.statLabel}>Status</Text>
              </View>
            </View>
          )}

          {/* ── Time Clock card ── */}
          {recordsLoading ? (
            <View style={[S.card, {gap: 10}]}>
              <SkeletonBox width="40%" height={16} />
              <SkeletonBox width="70%" height={12} />
              <View style={S.cardDivider} />
              <SkeletonBox width="50%" height={14} />
            </View>
          ) : (
            <View style={S.card}>
              <View style={S.cardTitleRow}>
                <Text style={S.cardTitle}>Time Clock</Text>
                {isActive && (
                  <View style={S.activePill}>
                    <View style={S.activePillDot} />
                    <Text style={S.activePillTxt}>Active</Text>
                  </View>
                )}
              </View>
              <Text style={S.cardSub}>
                {lastOut
                  ? `Last clocked out at ${formatTime(
                      lastOut,
                    )} · ${formatDateShort(lastOut)}`
                  : "You haven't clocked in yet today"}
              </Text>
              <View style={S.cardDivider} />
              <TouchableOpacity
                style={S.cardAction}
                onPress={() => onNavigate('TimeClock')}>
                <Text style={S.cardActionTxt}>
                  {isActive ? 'View Time Clock' : 'Clock In Now'}
                </Text>
                <Text style={S.cardActionArrow}>→</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Today's activity timeline ── */}
          {recordsLoading ? (
            <View style={S.card}>
              <SkeletonBox width="35%" height={14} style={{marginBottom: 12}} />
              <View style={S.cardDivider} />
              {[1, 2, 3].map(i => (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingVertical: 6,
                  }}>
                  <SkeletonBox width="45%" height={12} />
                  <SkeletonBox width="20%" height={12} />
                </View>
              ))}
            </View>
          ) : (
            <ActivityTimeline events={todayEvents} />
          )}
        </ScrollView>

        <NavigationFAB activeScreen="Home" onNavigate={onNavigate} />
        <LocationPickerModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
        />
      </SafeAreaView>
    </PageBackground>
  );
};

export default HomeScreen;

const S = StyleSheet.create({
  screen: {flex: 1, backgroundColor: C.bg},

  scroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
  },

  // ── GLOBAL CARD ─────────────────────────────
  card: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
    ...Sh.sm,
  },

  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.ink,
  },

  cardSub: {
    fontSize: 13,
    color: C.inkMuted,
    marginTop: 6,
    lineHeight: 18,
  },

  cardDivider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 14,
  },

  cardAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardActionTxt: {
    fontSize: 15,
    fontWeight: '600',
    color: C.blue,
  },

  cardActionArrow: {
    fontSize: 18,
    color: C.blue,
  },

  // ── LOCATION BANNER FIX ─────────────────────
  locationCardLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  locationCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.ink,
  },

  locationCardMeta: {
    fontSize: 12,
    color: C.greenDark,
    marginTop: 2,
  },

  locationCardCoords: {
    fontSize: 11,
    color: C.inkFaint,
    marginTop: 4,
  },

  locationCardArrow: {
    fontSize: 18,
    marginLeft: 6,
  },

  // ── WARNING ─────────────────────────────
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.amberLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: C.amber,
  },

  warningIcon: {fontSize: 18},

  warningTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: C.ink,
  },

  warningText: {
    fontSize: 12,
    color: C.inkSub,
    marginTop: 2,
  },

  // ── STATS ROW FIX (BIG IMPROVEMENT) ─────────
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },

  statCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Sh.sm,
  },

  statNum: {
    fontSize: 20,
    fontWeight: '800',
  },

  statLabel: {
    fontSize: 11,
    color: C.inkMuted,
    marginTop: 4,
  },

  // ── ACTIVE PILL ─────────────────────────
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.greenLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  activePillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.greenMid,
    marginRight: 6,
  },

  activePillTxt: {
    fontSize: 11,
    fontWeight: '600',
    color: C.greenDark,
  },

  // ── ACTIVITY TIMELINE FIX ────────────────
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },

  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  activityLabel: {
    fontSize: 13,
    color: C.inkSub,
  },

  activityTime: {
    fontSize: 13,
    fontWeight: '600',
    color: C.ink,
  },

  // ── STATE SCREENS (UNCHANGED BUT CLEANED) ─
  stateWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: C.bg,
  },

  stateIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...Sh.sm,
  },

  stateEmoji: {fontSize: 36},

  stateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: C.ink,
    textAlign: 'center',
  },

  stateSub: {
    fontSize: 14,
    color: C.inkSub,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 24,
    lineHeight: 20,
  },

  stateBtn: {
    backgroundColor: C.blue,
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 30,
  },

  stateBtnTxt: {
    color: C.white,
    fontWeight: '700',
  },
});
