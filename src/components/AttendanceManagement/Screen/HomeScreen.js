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
      <ActivityIndicator size="large" color={C.blueDark} />
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
            <ActivityIndicator size="small" color={C.blueDark} />
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
        <PermissionDeniedView onNavigate={onNavigate} />
      </SafeAreaView>
    );
  }

  // ── Loading GPS ──────────────────────────────────────────
  if (permissionStatus === 'unknown' || (locationLoading && !coords)) {
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: T.pageBg}}>
        <LoadingView onNavigate={onNavigate} />
      </SafeAreaView>
    );
  }

  // ── No GPS fix ───────────────────────────────────────────
  if (!locationLoading && !coords && permissionStatus === 'granted') {
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: T.pageBg}}>
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
    color: C.blueDark,
  },

  cardActionArrow: {
    fontSize: 18,
    color: C.blueDark,
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
    color: C.onBlue,
    fontWeight: '700',
  },
});
//* eslint-disable react-native/no-inline-styles */
// ─────────────────────────────────────────────────────────────────────────────
// components/AttendanceManagement/screens/HomeScreen.js
// ─────────────────────────────────────────────────────────────────────────────
// import React, {useState, useEffect, useRef} from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   ScrollView,
//   SafeAreaView,
//   StatusBar,
//   ActivityIndicator,
//   Linking,
//   Platform,
//   StyleSheet,
//   Animated,
// } from 'react-native';
// import {useSelector} from 'react-redux';
// import {useGeofence} from '../GeofenceContext';
// import LocationPickerModal from '../LocationPickerModal';
// import NavigationFAB from '../NavigationFAB';
// import {
//   loadRecords,
//   formatTime,
//   formatDateShort,
//   formatDuration,
//   formatDurationShort,
//   isToday,
//   getSessionStats,
// } from '../../../screens/AttendanceManagement/helpers';
// import useAppTokens from '../../AppComponentsDesign/useAppTokens';
// import PageBackground from '../../AppComponentsDesign/PageBackground';
// import {
//   conditionalScale,
//   conditionalVerticalScale,
//   conditionalFontScale,
// } from '../../../store/utils/scaling';

// // ─────────────────────────────────────────────────────────────────────────────
// // Helpers
// // ─────────────────────────────────────────────────────────────────────────────
// const getGreeting = () => {
//   const h = new Date().getHours();
//   if (h < 12) return 'Good morning';
//   if (h < 17) return 'Good afternoon';
//   return 'Good evening';
// };

// const getTodayLabel = () => {
//   return new Date().toLocaleDateString('en-US', {
//     weekday: 'long',
//     day: 'numeric',
//     month: 'short',
//     year: 'numeric',
//   });
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // Skeleton Box
// // ─────────────────────────────────────────────────────────────────────────────
// const SkeletonBox = ({width, height, style}) => (
//   <View
//     style={[
//       {
//         width,
//         height,
//         borderRadius: conditionalScale(6, 6, 7, 7),
//         backgroundColor: '#E5E7EB',
//       },
//       style,
//     ]}
//   />
// );

// // ─────────────────────────────────────────────────────────────────────────────
// // Permission Denied
// // ─────────────────────────────────────────────────────────────────────────────
// const PermissionDeniedView = ({onNavigate, T}) => (
//   <View style={[S.stateWrap, {backgroundColor: T.pageBg}]}>
//     <View style={[S.stateIconCircle, {backgroundColor: T.redBg}]}>
//       <Text style={S.stateEmoji}>📍</Text>
//     </View>
//     <Text style={[S.stateTitle, {color: T.titleText}]}>
//       Location Access Required
//     </Text>
//     <Text style={[S.stateSub, {color: T.subtitleText}]}>
//       Attendance tracking needs your location to confirm you are at an
//       authorised office zone before clocking in or out.
//     </Text>
//     <TouchableOpacity
//       style={[S.stateBtn, {backgroundColor: T.blue}]}
//       onPress={() =>
//         Platform.OS === 'android'
//           ? Linking.openSettings()
//           : Linking.openURL('app-settings:')
//       }>
//       <Text style={S.stateBtnTxt}>Open Settings</Text>
//     </TouchableOpacity>
//     <NavigationFAB activeScreen="Home" onNavigate={onNavigate} />
//   </View>
// );

// // ─────────────────────────────────────────────────────────────────────────────
// // GPS Loading
// // ─────────────────────────────────────────────────────────────────────────────
// const LoadingView = ({onNavigate, T}) => (
//   <View style={[S.stateWrap, {backgroundColor: T.pageBg}]}>
//     <View style={[S.stateIconCircle, {backgroundColor: T.blueBg}]}>
//       <ActivityIndicator size="large" color={T.blue} />
//     </View>
//     <Text style={[S.stateTitle, {color: T.titleText}]}>
//       Getting Your Location
//     </Text>
//     <Text style={[S.stateSub, {color: T.subtitleText}]}>
//       Verifying GPS signal and checking authorised office zones…
//     </Text>
//     <NavigationFAB activeScreen="Home" onNavigate={onNavigate} />
//   </View>
// );

// // ─────────────────────────────────────────────────────────────────────────────
// // GPS Unavailable
// // ─────────────────────────────────────────────────────────────────────────────
// const GPSUnavailableView = ({onNavigate, onRetry, T}) => (
//   <View style={[S.stateWrap, {backgroundColor: T.pageBg}]}>
//     <View style={[S.stateIconCircle, {backgroundColor: T.amberBg}]}>
//       <Text style={S.stateEmoji}>🛰</Text>
//     </View>
//     <Text style={[S.stateTitle, {color: T.titleText}]}>GPS Unavailable</Text>
//     <Text style={[S.stateSub, {color: T.subtitleText}]}>
//       Unable to get your location. Make sure GPS / Location Services are enabled
//       on your device.
//     </Text>
//     <TouchableOpacity
//       style={[S.stateBtn, {backgroundColor: T.blue, marginBottom: 12}]}
//       onPress={() =>
//         Platform.OS === 'android'
//           ? Linking.openSettings()
//           : Linking.openURL('app-settings:')
//       }>
//       <Text style={S.stateBtnTxt}>Open Settings</Text>
//     </TouchableOpacity>
//     <TouchableOpacity
//       style={[
//         S.stateBtn,
//         {
//           backgroundColor: 'transparent',
//           borderWidth: 1,
//           borderColor: T.chevronColor,
//         },
//       ]}
//       onPress={onRetry}>
//       <Text style={[S.stateBtnTxt, {color: T.titleText}]}>Retry</Text>
//     </TouchableOpacity>
//     <NavigationFAB activeScreen="Home" onNavigate={onNavigate} />
//   </View>
// );

// // ─────────────────────────────────────────────────────────────────────────────
// // Location Banner
// // ─────────────────────────────────────────────────────────────────────────────
// const LocationBanner = ({
//   matchedFence,
//   locationLoading,
//   locationError,
//   coords,
//   onPress,
//   T,
// }) => {
//   const matched = !!matchedFence;
//   return (
//     <TouchableOpacity
//       style={[
//         S.locationBanner,
//         {
//           backgroundColor: matched ? T.greenBg : T.redBg,
//           borderLeftColor: matched ? T.green : T.red,
//         },
//       ]}
//       onPress={onPress}
//       activeOpacity={0.7}>
//       <View
//         style={[S.locationDot, {backgroundColor: matched ? T.green : T.red}]}>
//         <Text style={{fontSize: 14}}>📍</Text>
//       </View>
//       <View style={{flex: 1}}>
//         {locationLoading ? (
//           <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
//             <ActivityIndicator size="small" color={T.blue} />
//             <Text style={[S.locationName, {color: T.subtitleText}]}>
//               Verifying…
//             </Text>
//           </View>
//         ) : (
//           <>
//             <Text
//               style={[S.locationName, {color: matched ? '#166534' : T.red}]}
//               numberOfLines={1}>
//               {matched
//                 ? matchedFence.FenceName
//                 : locationError ?? 'No authorised zone matched'}
//             </Text>
//             {matched && matchedFence.distanceMetres != null && (
//               <Text style={[S.locationMeta, {color: T.green}]}>
//                 Within zone · {matchedFence.distanceMetres} m away
//               </Text>
//             )}
//             {matched && coords && (
//               <Text style={[S.locationCoords, {color: T.subtitleText}]}>
//                 {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
//                 {coords.accuracy
//                   ? `  ·  ±${Math.round(coords.accuracy)} m`
//                   : ''}
//               </Text>
//             )}
//           </>
//         )}
//       </View>
//       <Text style={[S.locationArrow, {color: matched ? '#166534' : T.red}]}>
//         ›
//       </Text>
//     </TouchableOpacity>
//   );
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // Stats Row  (Sessions · Worked · Status)
// // ─────────────────────────────────────────────────────────────────────────────
// const StatsRow = ({todayStats, isActive, T}) => (
//   <View style={S.statsRow}>
//     <View style={[S.statCard, {backgroundColor: T.greenBg}]}>
//       <Text style={[S.statNum, {color: '#15803D'}]}>{todayStats.sessions}</Text>
//       <Text style={[S.statLabel, {color: T.subtitleText}]}>Sessions</Text>
//     </View>
//     <View style={[S.statCard, {backgroundColor: T.blueBg}]}>
//       <Text
//         style={[
//           S.statNum,
//           {color: T.blue, fontSize: conditionalFontScale(15, 16, 17, 17)},
//         ]}>
//         {formatDuration(todayStats.worked)}
//       </Text>
//       <Text style={[S.statLabel, {color: T.subtitleText}]}>Worked</Text>
//     </View>
//     <View
//       style={[
//         S.statCard,
//         {
//           backgroundColor: T.cardBg,
//           borderWidth: 0.5,
//           borderColor: T.cardDivider,
//         },
//       ]}>
//       <Text style={[S.statNum, {color: isActive ? '#15803D' : T.subtitleText}]}>
//         {isActive ? 'In' : 'Out'}
//       </Text>
//       <Text style={[S.statLabel, {color: T.subtitleText}]}>Status</Text>
//     </View>
//   </View>
// );

// // ─────────────────────────────────────────────────────────────────────────────
// // Time Summary Row  (Clock In · Break · Clock Out)
// // ─────────────────────────────────────────────────────────────────────────────
// const TimeSummaryRow = ({todayEvents, T}) => {
//   const clockIn = todayEvents.find(e => e.type === 'ClockIn');
//   const breaks = todayEvents.filter(e => e.type === 'BreakStart');
//   const clockOut = todayEvents.find(e => e.type === 'ClockOut');

//   const totalBreakMs = breaks.reduce((acc, b) => acc + (b.durationMs || 0), 0);

//   const items = [
//     {
//       iconBg: T.greenBg,
//       iconColor: T.green,
//       icon: '⏰',
//       label: 'Clock In',
//       value: clockIn ? formatTime(clockIn.time) : '—',
//       sub: clockIn ? 'Clocked in' : 'Not yet',
//     },
//     {
//       iconBg: T.amberBg,
//       iconColor: T.amber,
//       icon: '☕',
//       label: 'Break',
//       value: totalBreakMs ? formatDurationShort(totalBreakMs) : '—',
//       sub: breaks.length
//         ? `${breaks.length} break${breaks.length > 1 ? 's' : ''}`
//         : 'No breaks',
//     },
//     {
//       iconBg: T.redBg,
//       iconColor: T.red,
//       icon: '🔒',
//       label: 'Clock Out',
//       value: clockOut ? formatTime(clockOut.time) : '—',
//       sub: clockOut ? 'Clocked out' : 'Still active',
//     },
//   ];

//   return (
//     <View style={S.timeSummaryRow}>
//       {items.map((item, idx) => (
//         <View
//           key={idx}
//           style={[
//             S.timeSummaryCard,
//             {
//               backgroundColor: T.cardBg,
//               borderColor: T.cardDivider,
//             },
//           ]}>
//           <View style={[S.timeSummaryIcon, {backgroundColor: item.iconBg}]}>
//             <Text style={{fontSize: 13}}>{item.icon}</Text>
//           </View>
//           <Text style={[S.timeSummaryLabel, {color: T.subtitleText}]}>
//             {item.label}
//           </Text>
//           <Text style={[S.timeSummaryValue, {color: T.titleText}]}>
//             {item.value}
//           </Text>
//           <Text style={[S.timeSummarySub, {color: T.subtitleText}]}>
//             {item.sub}
//           </Text>
//         </View>
//       ))}
//     </View>
//   );
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // Working Hours Bar Chart  (pure RN — no external lib needed)
// // ─────────────────────────────────────────────────────────────────────────────
// const WorkingHoursChart = ({weekData, T}) => {
//   // weekData: [{ label: 'Mon', hours: 7.5, isToday: false }, ...]
//   const TARGET = 8;
//   const MAX = 10;
//   const BAR_H = conditionalScale(90, 95, 100, 100);

//   return (
//     <View>
//       <View style={[S.chartLegendRow]}>
//         <View style={S.legendItem}>
//           <View style={[S.legendDot, {backgroundColor: T.blue}]} />
//           <Text style={[S.legendText, {color: T.subtitleText}]}>
//             Hours worked
//           </Text>
//         </View>
//         <View style={S.legendItem}>
//           <View
//             style={[
//               S.legendDot,
//               {
//                 backgroundColor: 'transparent',
//                 borderWidth: 1.5,
//                 borderColor: T.subtitleText,
//                 borderStyle: 'dashed',
//               },
//             ]}
//           />
//           <Text style={[S.legendText, {color: T.subtitleText}]}>
//             Target (8h)
//           </Text>
//         </View>
//       </View>

//       <View style={[S.chartArea, {height: BAR_H + 28}]}>
//         <View style={S.chartClip}>
//           {/* Target line */}
//           <View
//             style={[
//               S.targetLine,
//               {
//                 bottom: 24 + (TARGET / MAX) * BAR_H,
//                 borderColor: T.chevronColor,
//               },
//             ]}
//           />

//           {/* Bars */}
//           <View style={S.barsRow}>
//             {weekData.map((d, i) => {
//               const barH = Math.max(4, (d.hours / MAX) * BAR_H);
//               const isOver = d.hours >= TARGET;
//               return (
//                 <View key={i} style={S.barCol}>
//                   <Text
//                     style={[
//                       S.barValueText,
//                       {
//                         color: d.isToday ? T.blue : T.subtitleText,
//                         fontWeight: d.isToday ? '600' : '400',
//                       },
//                     ]}>
//                     {d.hours > 0 ? `${d.hours}h` : ''}
//                   </Text>
//                   <View style={[S.barTrack, {height: BAR_H}]}>
//                     <View
//                       style={[
//                         S.bar,
//                         {
//                           height: barH,
//                           backgroundColor: d.isToday
//                             ? T.blue
//                             : isOver
//                             ? '#B5D4F4'
//                             : '#DBEAFE',
//                           borderRadius: conditionalScale(4, 4, 5, 5),
//                         },
//                       ]}
//                     />
//                   </View>
//                   <Text
//                     style={[
//                       S.barLabel,
//                       {
//                         color: d.isToday ? T.blue : T.subtitleText,
//                         fontWeight: d.isToday ? '600' : '400',
//                       },
//                     ]}
//                     numberOfLines={1}>
//                     {d.label}
//                   </Text>
//                 </View>
//               );
//             })}
//           </View>
//         </View>
//       </View>
//     </View>
//   );
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // Today's Activity Timeline
// // ─────────────────────────────────────────────────────────────────────────────
// const ActivityTimeline = ({events, onNavigate, T}) => {
//   if (!events.length) return null;

//   const DOT_COLORS = {
//     ClockIn: T.green,
//     BreakStart: T.amber,
//     ClockOut: T.red,
//   };

//   const LABELS = {
//     ClockIn: 'Clock In',
//     BreakStart: 'Break',
//     ClockOut: 'Clock Out',
//   };

//   return (
//     <View
//       style={[S.card, {backgroundColor: T.cardBg, borderColor: T.cardDivider}]}>
//       <Text style={[S.cardTitle, {color: T.titleText}]}>Today's Activity</Text>
//       <View style={[S.cardDivider, {backgroundColor: T.rowDivider}]} />
//       {events.map((ev, i) => (
//         <View key={i}>
//           <View style={S.activityRow}>
//             <View style={S.activityLeft}>
//               <View
//                 style={[
//                   S.activityDot,
//                   {backgroundColor: DOT_COLORS[ev.type] ?? T.chevronColor},
//                 ]}
//               />
//               <Text style={[S.activityLabel, {color: T.subtitleText}]}>
//                 {LABELS[ev.type] ?? ev.type}
//                 {ev.durationMs
//                   ? ` (${formatDurationShort(ev.durationMs)})`
//                   : ''}
//               </Text>
//             </View>
//             <Text style={[S.activityTime, {color: T.titleText}]}>
//               {formatTime(ev.time)}
//             </Text>
//           </View>
//           {i < events.length - 1 && (
//             <View
//               style={[S.activityDivider, {backgroundColor: T.rowDivider}]}
//             />
//           )}
//         </View>
//       ))}
//       <View style={[S.cardDivider, {backgroundColor: T.rowDivider}]} />
//       <TouchableOpacity
//         style={S.cardAction}
//         onPress={() => onNavigate('TimeClock')}
//         activeOpacity={0.7}>
//         <Text style={[S.cardActionTxt, {color: T.blue}]}>
//           View Full Time Clock
//         </Text>
//         <Text style={[S.cardActionArrow, {color: T.blue}]}>→</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // Upcoming Holidays
// // ─────────────────────────────────────────────────────────────────────────────

// // Replace with your real holidays data source / API call
// const UPCOMING_HOLIDAYS = [
//   {
//     day: '23',
//     month: 'Apr',
//     name: 'Pakistan Day (observed)',
//     daysAway: 9,
//     type: 'National',
//   },
//   {day: '01', month: 'May', name: 'Labour Day', daysAway: 17, type: 'National'},
//   {
//     day: '02',
//     month: 'Jun',
//     name: 'Eid ul-Adha (est.)',
//     daysAway: 49,
//     type: 'Religious',
//   },
// ];

// const UpcomingHolidays = ({T}) => (
//   <View
//     style={[S.card, {backgroundColor: T.cardBg, borderColor: T.cardDivider}]}>
//     <Text style={[S.cardTitle, {color: T.titleText}]}>Upcoming Holidays</Text>
//     <View style={[S.cardDivider, {backgroundColor: T.rowDivider}]} />
//     {UPCOMING_HOLIDAYS.map((h, i) => (
//       <View key={i}>
//         <View style={S.holidayRow}>
//           <View style={[S.holidayDateBox, {backgroundColor: T.purpleBg}]}>
//             <Text style={[S.holidayDay, {color: '#5B21B6'}]}>{h.day}</Text>
//             <Text style={[S.holidayMonth, {color: T.purple}]}>{h.month}</Text>
//           </View>
//           <View style={{flex: 1}}>
//             <Text
//               style={[S.holidayName, {color: T.titleText}]}
//               numberOfLines={1}>
//               {h.name}
//             </Text>
//             <Text style={[S.holidayDaysAway, {color: T.subtitleText}]}>
//               {h.daysAway === 0
//                 ? 'Today'
//                 : h.daysAway === 1
//                 ? 'Tomorrow'
//                 : `${h.daysAway} days away`}
//             </Text>
//           </View>
//           <View style={[S.holidayBadge, {backgroundColor: T.purpleBg}]}>
//             <Text style={[S.holidayBadgeTxt, {color: T.purple}]}>{h.type}</Text>
//           </View>
//         </View>
//         {i < UPCOMING_HOLIDAYS.length - 1 && (
//           <View style={[S.activityDivider, {backgroundColor: T.rowDivider}]} />
//         )}
//       </View>
//     ))}
//   </View>
// );

// // ─────────────────────────────────────────────────────────────────────────────
// // Section Label
// // ─────────────────────────────────────────────────────────────────────────────
// const SectionLabel = ({label, T}) => (
//   <Text style={[S.sectionLabel, {color: T.headingText}]}>{label}</Text>
// );

// // ─────────────────────────────────────────────────────────────────────────────
// // Main HomeScreen
// // ─────────────────────────────────────────────────────────────────────────────
// const HomeScreen = ({onNavigate}) => {
//   const T = useAppTokens();

//   const [lastOut, setLastOut] = useState(null);
//   const [isActive, setIsActive] = useState(false);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [todayEvents, setTodayEvents] = useState([]);
//   const [todayStats, setTodayStats] = useState({sessions: 0, worked: 0});
//   const [weekData, setWeekData] = useState([]);
//   const [recordsLoading, setRecordsLoading] = useState(true);

//   const {
//     permissionStatus,
//     locationLoading,
//     locationError,
//     matchedFence,
//     coords,
//     refresh,
//   } = useGeofence();

//   const {userData} = useSelector(s => s.user);
//   const person = userData?.Person;
//   const employeeName = userData?.employeeName || userData?.Name || 'there';

//   useEffect(() => {
//     (async () => {
//       if (!person) {
//         setRecordsLoading(false);
//         return;
//       }
//       setRecordsLoading(true);
//       const records = await loadRecords({person});

//       if (!records.length) {
//         setRecordsLoading(false);
//         return;
//       }

//       // Last session status
//       const last = records[records.length - 1];
//       if (last.clockOut) setLastOut(last.clockOut);
//       setIsActive(!last.clockOut);

//       // Today's events
//       const todayRecords = records.filter(r => r.clockIn && isToday(r.clockIn));
//       const events = [];
//       let totalWorkedMs = 0;

//       todayRecords.forEach(r => {
//         if (r.clockIn) events.push({type: 'ClockIn', time: r.clockIn});
//         (r.breaks || []).forEach(b => {
//           if (b.breakStart) {
//             const durationMs = b.breakEnd
//               ? new Date(b.breakEnd) - new Date(b.breakStart)
//               : null;
//             events.push({type: 'BreakStart', time: b.breakStart, durationMs});
//           }
//         });
//         if (r.clockOut) events.push({type: 'ClockOut', time: r.clockOut});
//         const stats = getSessionStats(r);
//         if (stats) totalWorkedMs += stats.netMs;
//       });

//       events.sort((a, b) => new Date(a.time) - new Date(b.time));
//       setTodayEvents(events);
//       setTodayStats({sessions: todayRecords.length, worked: totalWorkedMs});

//       // Build last 7 days chart data
//       const days = [];
//       for (let i = 6; i >= 0; i--) {
//         const d = new Date();
//         d.setDate(d.getDate() - i);
//         const dayStart = new Date(d.setHours(0, 0, 0, 0));
//         const dayEnd = new Date(d.setHours(23, 59, 59, 999));
//         const dayRecs = records.filter(r => {
//           if (!r.clockIn) return false;
//           const t = new Date(r.clockIn);
//           return t >= dayStart && t <= dayEnd;
//         });
//         let hoursWorked = 0;
//         dayRecs.forEach(r => {
//           const stats = getSessionStats(r);
//           if (stats) hoursWorked += stats.netMs / (1000 * 60 * 60);
//         });
//         days.push({
//           label:
//             i === 0
//               ? 'Today'
//               : dayStart.toLocaleDateString('en-US', {weekday: 'short'}),
//           hours: Math.round(hoursWorked * 10) / 10,
//           isToday: i === 0,
//         });
//       }
//       setWeekData(days);
//       setRecordsLoading(false);
//     })();
//   }, [person]);

//   // ── State screens ─────────────────────────────────────────────────────────
//   if (permissionStatus === 'denied') {
//     return (
//       <SafeAreaView style={{flex: 1, backgroundColor: T.pageBg}}>
//         <StatusBar
//           barStyle="dark-content"
//           backgroundColor={T.pageBg}
//           translucent={false}
//         />
//         <PermissionDeniedView onNavigate={onNavigate} T={T} />
//       </SafeAreaView>
//     );
//   }

//   if (permissionStatus === 'unknown' || (locationLoading && !coords)) {
//     return (
//       <SafeAreaView style={{flex: 1, backgroundColor: T.pageBg}}>
//         <StatusBar
//           barStyle="dark-content"
//           backgroundColor={T.pageBg}
//           translucent={false}
//         />
//         <LoadingView onNavigate={onNavigate} T={T} />
//       </SafeAreaView>
//     );
//   }

//   if (!locationLoading && !coords && permissionStatus === 'granted') {
//     return (
//       <SafeAreaView style={{flex: 1, backgroundColor: T.pageBg}}>
//         <StatusBar
//           barStyle="dark-content"
//           backgroundColor={T.pageBg}
//           translucent={false}
//         />
//         <GPSUnavailableView onNavigate={onNavigate} onRetry={refresh} T={T} />
//       </SafeAreaView>
//     );
//   }

//   const showWarning = !locationLoading && !!locationError && !matchedFence;

//   return (
//     <PageBackground>
//       <SafeAreaView style={{flex: 1}}>
//         <StatusBar
//           barStyle="dark-content"
//           backgroundColor={T.pageBg}
//           translucent={false}
//         />

//         <ScrollView
//           contentContainerStyle={S.scroll}
//           showsVerticalScrollIndicator={false}>
//           {/* ── Greeting ── */}
//           <View style={S.greetingBlock}>
//             <Text style={[S.greetingDate, {color: T.headingText}]}>
//               {getTodayLabel()}
//             </Text>
//             <Text style={[S.greetingName, {color: T.titleText}]}>
//               {getGreeting()}, {employeeName} 👋
//             </Text>
//           </View>

//           {/* ── Warning banner ── */}
//           {showWarning && (
//             <TouchableOpacity
//               style={[
//                 S.warningBanner,
//                 {backgroundColor: T.amberBg, borderLeftColor: T.amber},
//               ]}
//               onPress={refresh}
//               activeOpacity={0.8}>
//               <Text style={{fontSize: 16}}>⚠️</Text>
//               <View style={{flex: 1, marginLeft: 10}}>
//                 <Text style={[S.warningTitle, {color: T.titleText}]}>
//                   Location Issue
//                 </Text>
//                 <Text
//                   style={[S.warningText, {color: T.subtitleText}]}
//                   numberOfLines={2}>
//                   {locationError} Tap to retry.
//                 </Text>
//               </View>
//             </TouchableOpacity>
//           )}

//           {/* ── Location banner ── */}
//           <LocationBanner
//             matchedFence={matchedFence}
//             locationLoading={locationLoading}
//             locationError={locationError}
//             coords={coords}
//             onPress={() => setModalVisible(true)}
//             T={T}
//           />

//           {/* ── Stats row ── */}
//           {recordsLoading ? (
//             <View style={S.statsRow}>
//               <SkeletonBox width="31%" height={72} style={{borderRadius: 14}} />
//               <SkeletonBox width="31%" height={72} style={{borderRadius: 14}} />
//               <SkeletonBox width="31%" height={72} style={{borderRadius: 14}} />
//             </View>
//           ) : (
//             <StatsRow todayStats={todayStats} isActive={isActive} T={T} />
//           )}

//           {/* ── Time summary ── */}
//           <SectionLabel label="TIME SUMMARY" T={T} />
//           {recordsLoading ? (
//             <View style={S.timeSummaryRow}>
//               <SkeletonBox width="31%" height={90} style={{borderRadius: 12}} />
//               <SkeletonBox width="31%" height={90} style={{borderRadius: 12}} />
//               <SkeletonBox width="31%" height={90} style={{borderRadius: 12}} />
//             </View>
//           ) : (
//             <TimeSummaryRow todayEvents={todayEvents} T={T} />
//           )}

//           {/* ── Working hours chart ── */}
//           <SectionLabel label="WORKING HOURS — LAST 7 DAYS" T={T} />
//           <View
//             style={[
//               S.card,
//               {backgroundColor: T.cardBg, borderColor: T.cardDivider},
//             ]}>
//             {recordsLoading ? (
//               <View style={{gap: 8}}>
//                 <SkeletonBox width="50%" height={12} />
//                 <SkeletonBox
//                   width="100%"
//                   height={100}
//                   style={{borderRadius: 8}}
//                 />
//               </View>
//             ) : (
//               <WorkingHoursChart weekData={weekData} T={T} />
//             )}
//           </View>

//           {/* ── Activity timeline ── */}
//           <SectionLabel label="TODAY'S ACTIVITY" T={T} />
//           {recordsLoading ? (
//             <View
//               style={[
//                 S.card,
//                 {
//                   backgroundColor: T.cardBg,
//                   borderColor: T.cardDivider,
//                   gap: 10,
//                 },
//               ]}>
//               {[1, 2, 3].map(i => (
//                 <View
//                   key={i}
//                   style={{
//                     flexDirection: 'row',
//                     justifyContent: 'space-between',
//                     paddingVertical: 4,
//                   }}>
//                   <SkeletonBox width="45%" height={12} />
//                   <SkeletonBox width="20%" height={12} />
//                 </View>
//               ))}
//             </View>
//           ) : todayEvents.length > 0 ? (
//             <ActivityTimeline
//               events={todayEvents}
//               onNavigate={onNavigate}
//               T={T}
//             />
//           ) : (
//             <View
//               style={[
//                 S.card,
//                 {backgroundColor: T.cardBg, borderColor: T.cardDivider},
//               ]}>
//               <Text style={[S.emptyText, {color: T.emptyText}]}>
//                 No activity recorded today yet.
//               </Text>
//               <View style={[S.cardDivider, {backgroundColor: T.rowDivider}]} />
//               <TouchableOpacity
//                 style={S.cardAction}
//                 onPress={() => onNavigate('TimeClock')}
//                 activeOpacity={0.7}>
//                 <Text style={[S.cardActionTxt, {color: T.blue}]}>
//                   Clock In Now
//                 </Text>
//                 <Text style={[S.cardActionArrow, {color: T.blue}]}>→</Text>
//               </TouchableOpacity>
//             </View>
//           )}

//           {/* ── Upcoming holidays ── */}
//           <SectionLabel label="UPCOMING HOLIDAYS" T={T} />
//           <UpcomingHolidays T={T} />
//         </ScrollView>

//         <NavigationFAB activeScreen="Home" onNavigate={onNavigate} />
//         <LocationPickerModal
//           visible={modalVisible}
//           onClose={() => setModalVisible(false)}
//         />
//       </SafeAreaView>
//     </PageBackground>
//   );
// };

// export default HomeScreen;

// // ─────────────────────────────────────────────────────────────────────────────
// // Styles
// // ─────────────────────────────────────────────────────────────────────────────
// const S = StyleSheet.create({
//   scroll: {
//     paddingHorizontal: conditionalScale(6, 8, 10, 10), // Reduced from 14,16,18,18
//     paddingTop: conditionalVerticalScale(12, 14, 16, 16),
//     paddingBottom: conditionalVerticalScale(12, 14, 16, 16), // Minimal bottom padding
//   },

//   // ── Greeting ────────────────────────────────────────────────────────────────
//   greetingBlock: {
//     marginBottom: conditionalVerticalScale(14, 16, 18, 18),
//   },
//   greetingDate: {
//     fontSize: conditionalFontScale(11, 11, 12, 12),
//     fontWeight: '500',
//     textTransform: 'uppercase',
//     letterSpacing: 0.6,
//     marginBottom: 2,
//   },
//   greetingName: {
//     fontSize: conditionalFontScale(20, 21, 22, 22),
//     fontWeight: '600',
//   },

//   // ── Section label ────────────────────────────────────────────────────────────
//   sectionLabel: {
//     fontSize: conditionalFontScale(10, 10, 11, 11),
//     fontWeight: '500',
//     textTransform: 'uppercase',
//     letterSpacing: 0.6,
//     marginBottom: conditionalVerticalScale(6, 7, 8, 8),
//     marginLeft: 2,
//   },

//   // ── Warning banner ────────────────────────────────────────────────────────────
//   warningBanner: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderRadius: conditionalScale(10, 11, 12, 12),
//     padding: conditionalScale(12, 13, 14, 14),
//     marginBottom: conditionalVerticalScale(12, 13, 14, 14),
//     borderLeftWidth: 4,
//     borderTopLeftRadius: 0,
//     borderBottomLeftRadius: 0,
//   },
//   warningTitle: {
//     fontSize: conditionalFontScale(13, 13, 14, 14),
//     fontWeight: '600',
//   },
//   warningText: {
//     fontSize: conditionalFontScale(12, 12, 13, 13),
//     marginTop: 2,
//   },

//   // ── Location banner ───────────────────────────────────────────────────────────
//   locationBanner: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderRadius: conditionalScale(10, 11, 12, 12),
//     padding: conditionalScale(12, 13, 14, 14),
//     marginBottom: conditionalVerticalScale(14, 15, 16, 16),
//     borderLeftWidth: 4,
//     borderTopLeftRadius: 0,
//     borderBottomLeftRadius: 0,
//     gap: conditionalScale(10, 11, 12, 12),
//   },
//   locationDot: {
//     width: conditionalScale(34, 36, 38, 38),
//     height: conditionalScale(34, 36, 38, 38),
//     borderRadius: conditionalScale(17, 18, 19, 19),
//     alignItems: 'center',
//     justifyContent: 'center',
//     flexShrink: 0,
//   },
//   locationName: {
//     fontSize: conditionalFontScale(13, 13, 14, 14),
//     fontWeight: '600',
//   },
//   locationMeta: {
//     fontSize: conditionalFontScale(11, 11, 12, 12),
//     marginTop: 2,
//   },
//   locationCoords: {
//     fontSize: conditionalFontScale(10, 10, 11, 11),
//     marginTop: 3,
//   },
//   locationArrow: {
//     fontSize: 20,
//     marginLeft: 6,
//   },

//   // ── Stats row ─────────────────────────────────────────────────────────────────
//   statsRow: {
//     flexDirection: 'row',
//     gap: conditionalScale(10, 10, 12, 12),
//     marginBottom: conditionalVerticalScale(14, 15, 16, 16),
//   },
//   statCard: {
//     flex: 1,
//     borderRadius: conditionalScale(12, 13, 14, 14),
//     paddingVertical: conditionalVerticalScale(14, 15, 16, 16),
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 4,
//   },
//   statNum: {
//     fontSize: conditionalFontScale(18, 19, 20, 20),
//     fontWeight: '700',
//   },
//   statLabel: {
//     fontSize: conditionalFontScale(10, 10, 11, 11),
//   },

//   // ── Time summary row ──────────────────────────────────────────────────────────
//   timeSummaryRow: {
//     flexDirection: 'row',
//     gap: conditionalScale(8, 9, 10, 10),
//     marginBottom: conditionalVerticalScale(14, 15, 16, 16),
//   },
//   timeSummaryCard: {
//     flex: 1,
//     borderRadius: conditionalScale(10, 11, 12, 12),
//     padding: conditionalScale(10, 11, 12, 12),
//     borderWidth: 0.5,
//     alignItems: 'center',
//     gap: 3,
//   },
//   timeSummaryIcon: {
//     width: conditionalScale(30, 32, 34, 34),
//     height: conditionalScale(30, 32, 34, 34),
//     borderRadius: conditionalScale(15, 16, 17, 17),
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 3,
//   },
//   timeSummaryLabel: {
//     fontSize: conditionalFontScale(9, 9, 10, 10),
//     textTransform: 'uppercase',
//     letterSpacing: 0.4,
//   },
//   timeSummaryValue: {
//     fontSize: conditionalFontScale(13, 13, 14, 14),
//     fontWeight: '600',
//   },
//   timeSummarySub: {
//     fontSize: conditionalFontScale(9, 9, 10, 10),
//   },

//   // ── Chart ─────────────────────────────────────────────────────────────────────
//   chartLegendRow: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 16,
//     marginBottom: conditionalVerticalScale(10, 11, 12, 12),
//   },
//   legendItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 5,
//   },
//   legendDot: {
//     width: 10,
//     height: 10,
//     borderRadius: 2,
//   },
//   legendText: {
//     fontSize: conditionalFontScale(11, 11, 12, 12),
//   },
//   chartArea: {
//     position: 'relative',
//     width: '100%',
//     overflow: 'hidden',
//   },
//   chartClip: {
//     flex: 1,
//     paddingHorizontal: conditionalScale(4, 5, 6, 6),
//     overflow: 'hidden',
//   },
//   targetLine: {
//     position: 'absolute',
//     left: 0,
//     right: 0,
//     height: 1,
//     borderTopWidth: 1.5,
//     borderStyle: 'dashed',
//     zIndex: 1,
//   },
//   barsRow: {
//     flexDirection: 'row',
//     alignItems: 'flex-end',
//     justifyContent: 'space-between',
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     top: 0,
//   },
//   barCol: {
//     flex: 1,
//     minWidth: 0,
//     alignItems: 'center',
//     justifyContent: 'flex-end',
//     paddingHorizontal: 2,
//   },
//   barValueText: {
//     fontSize: conditionalFontScale(9, 9, 10, 10),
//     marginBottom: 2,
//   },
//   barTrack: {
//     width: '100%',
//     maxWidth: conditionalScale(24, 26, 28, 28),
//     justifyContent: 'flex-end',
//   },
//   bar: {
//     width: '100%',
//   },
//   barLabel: {
//     fontSize: conditionalFontScale(10, 10, 11, 11),
//     marginTop: 5,
//     maxWidth: '100%',
//   },

//   // ── Card ─────────────────────────────────────────────────────────────────────
//   card: {
//     borderRadius: conditionalScale(12, 13, 14, 14),
//     padding: conditionalScale(14, 15, 16, 16),
//     marginBottom: conditionalVerticalScale(14, 15, 16, 16),
//     borderWidth: 0.5,
//   },
//   cardTitle: {
//     fontSize: conditionalFontScale(14, 15, 15, 15),
//     fontWeight: '600',
//     marginBottom: 2,
//   },
//   cardDivider: {
//     height: 1,
//     marginVertical: conditionalVerticalScale(10, 11, 12, 12),
//   },
//   cardAction: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   cardActionTxt: {
//     fontSize: conditionalFontScale(13, 14, 14, 14),
//     fontWeight: '500',
//   },
//   cardActionArrow: {
//     fontSize: 16,
//   },
//   emptyText: {
//     fontSize: conditionalFontScale(13, 13, 14, 14),
//     textAlign: 'center',
//     paddingVertical: 8,
//   },

//   // ── Activity timeline ─────────────────────────────────────────────────────────
//   activityRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: conditionalVerticalScale(8, 8, 9, 9),
//   },
//   activityLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//   },
//   activityDot: {
//     width: conditionalScale(8, 9, 10, 10),
//     height: conditionalScale(8, 9, 10, 10),
//     borderRadius: conditionalScale(4, 4, 5, 5),
//   },
//   activityLabel: {
//     fontSize: conditionalFontScale(13, 13, 14, 14),
//   },
//   activityTime: {
//     fontSize: conditionalFontScale(13, 13, 14, 14),
//     fontWeight: '600',
//   },
//   activityDivider: {
//     height: 1,
//     marginLeft: conditionalScale(18, 19, 20, 20),
//   },

//   // ── Holidays ──────────────────────────────────────────────────────────────────
//   holidayRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: conditionalScale(10, 11, 12, 12),
//     paddingVertical: conditionalVerticalScale(9, 9, 10, 10),
//   },
//   holidayDateBox: {
//     borderRadius: conditionalScale(8, 8, 9, 9),
//     paddingHorizontal: conditionalScale(9, 9, 10, 10),
//     paddingVertical: conditionalVerticalScale(5, 5, 6, 6),
//     alignItems: 'center',
//     minWidth: conditionalScale(42, 43, 44, 44),
//   },
//   holidayDay: {
//     fontSize: conditionalFontScale(15, 16, 16, 16),
//     fontWeight: '600',
//   },
//   holidayMonth: {
//     fontSize: conditionalFontScale(9, 9, 10, 10),
//     textTransform: 'uppercase',
//     letterSpacing: 0.4,
//   },
//   holidayName: {
//     fontSize: conditionalFontScale(13, 13, 14, 14),
//     fontWeight: '500',
//   },
//   holidayDaysAway: {
//     fontSize: conditionalFontScale(11, 11, 12, 12),
//     marginTop: 2,
//   },
//   holidayBadge: {
//     borderRadius: conditionalScale(20, 20, 20, 20),
//     paddingHorizontal: conditionalScale(9, 9, 10, 10),
//     paddingVertical: conditionalVerticalScale(3, 3, 4, 4),
//   },
//   holidayBadgeTxt: {
//     fontSize: conditionalFontScale(10, 10, 11, 11),
//     fontWeight: '500',
//   },

//   // ── State screens ─────────────────────────────────────────────────────────────
//   stateWrap: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 30,
//   },
//   stateIconCircle: {
//     width: conditionalScale(72, 76, 80, 80),
//     height: conditionalScale(72, 76, 80, 80),
//     borderRadius: conditionalScale(36, 38, 40, 40),
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: conditionalVerticalScale(18, 19, 20, 20),
//   },
//   stateEmoji: {fontSize: 32},
//   stateTitle: {
//     fontSize: conditionalFontScale(18, 19, 20, 20),
//     fontWeight: '700',
//     textAlign: 'center',
//   },
//   stateSub: {
//     fontSize: conditionalFontScale(13, 13, 14, 14),
//     textAlign: 'center',
//     marginTop: 10,
//     marginBottom: 24,
//     lineHeight: 20,
//   },
//   stateBtn: {
//     paddingHorizontal: 30,
//     paddingVertical: 14,
//     borderRadius: 30,
//     marginBottom: 4,
//   },
//   stateBtnTxt: {
//     color: '#FFFFFF',
//     fontWeight: '700',
//     fontSize: conditionalFontScale(14, 14, 15, 15),
//   },
// });
