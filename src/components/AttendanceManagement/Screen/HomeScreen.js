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
          <LocationCard
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
  scroll: {padding: 16, paddingBottom: 100},

  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    backgroundColor: C.bg,
  },
  stateIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    ...Sh.sm,
  },
  stateEmoji: {fontSize: 38},
  stateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: C.ink,
    textAlign: 'center',
    marginBottom: 10,
  },
  stateSub: {
    fontSize: 14,
    color: C.inkSub,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  stateBtn: {
    backgroundColor: C.blue,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: R.full,
    marginBottom: 12,
    ...Sh.sm,
  },
  stateBtnTxt: {color: C.white, fontWeight: '700', fontSize: 15},

  // ── Welcome banner ────────────────────────────────────────
  welcomeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.blue,
    borderRadius: R.lg,
    padding: 16,
    marginBottom: 12,
    ...Sh.sm,
  },
  welcomeGreeting: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  welcomeName: {fontSize: 18, fontWeight: '700', color: C.white},
  welcomeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeAvatarTxt: {fontSize: 18, fontWeight: '700', color: C.white},

  // ── Warning ──────────────────────────────────────────────
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.amberLight,
    borderRadius: R.md,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: C.amber,
    ...Sh.xs,
  },
  warningIcon: {fontSize: 18},
  warningTitle: {fontSize: 13, fontWeight: '600', color: C.ink},
  warningText: {fontSize: 12, color: C.inkSub, marginTop: 2},

  // ── Location card ─────────────────────────────────────────
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: R.md,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    ...Sh.sm,
    backgroundColor: C.surface,
  },
  locationCardGreen: {borderColor: C.greenMid},
  locationCardRed: {borderColor: C.redMid},
  locationBar: {width: 4, alignSelf: 'stretch'},
  locationCardBody: {flex: 1, padding: 14},
  locationCardLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: C.inkFaint,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  locationCardLoading: {flexDirection: 'row', alignItems: 'center', gap: 8},
  locationCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: C.ink,
    marginBottom: 2,
  },
  locationCardMeta: {fontSize: 12, color: C.greenDark, fontWeight: '500'},
  locationCardCoords: {fontSize: 11, color: C.inkFaint, marginTop: 3},
  locationCardArrow: {fontSize: 20, paddingRight: 14},

  // ── Stats ─────────────────────────────────────────────────
  statsRow: {flexDirection: 'row', gap: 10, marginBottom: 12},
  statCard: {
    flex: 1,
    borderRadius: R.md,
    padding: 14,
    alignItems: 'center',
    ...Sh.xs,
  },
  statNum: {fontSize: 22, fontWeight: '800', textAlign: 'center'},
  statLabel: {fontSize: 11, color: C.inkMuted, marginTop: 2, fontWeight: '500'},

  // ── Card ──────────────────────────────────────────────────
  card: {
    backgroundColor: C.surface,
    borderRadius: R.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    ...Sh.xs,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: {fontSize: 15, fontWeight: '700', color: C.ink},
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.greenLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: R.full,
  },
  activePillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.greenMid,
  },
  activePillTxt: {fontSize: 11, fontWeight: '600', color: C.greenDark},
  cardSub: {fontSize: 13, color: C.inkMuted, lineHeight: 19},
  cardDivider: {height: 1, backgroundColor: C.border, marginVertical: 12},
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardActionTxt: {fontSize: 14, fontWeight: '600', color: C.blue},
  cardActionArrow: {fontSize: 16, color: C.blue},

  // ── Activity timeline ─────────────────────────────────────
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  activityLeft: {flexDirection: 'row', alignItems: 'center', gap: 10},
  activityDot: {width: 8, height: 8, borderRadius: 4},
  activityLabel: {fontSize: 13, color: C.inkSub},
  activityTime: {fontSize: 13, fontWeight: '600', color: C.ink},
});
