/* eslint-disable no-unused-vars */
/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
// ─────────────────────────────────────────────────────────────────────────────
// components/AttendanceManagement/screens/TimeClockScreen.js
//
// P0.3 — Reordered validation pipeline: local checks → Face → SOAP.
//         If Face fails, zero SOAP calls are wasted. The QR gate now runs on
//         the confirm screens' Confirm button, not here.
// P2.5 — AttendanceOrchestrator wired in. prepare() fires 2 parallel SOAP
//         calls and returns a ValidationToken passed to confirm screens.
// P3.2 — prewarmToken() + NetInfo.fetch() called on mount so token and
//         network info are ready before the first action press.
// P4.1 — Wi-Fi pre-flight banner: fences with a network policy now show a
//         banner + disable Clock In BEFORE the button is pressed, instead of
//         letting the user discover NOT_ON_WIFI only after prepare() fails.
// P4.2 — Fixed silent failure: handlePreFaceSuccess used to swallow errors
//         from _runOrchestratorPrepare with `.catch(() => {})`. Any throw
//         after a successful Face check (e.g. SOAP failure) used to clear the
//         spinner with zero feedback to the user. Now shows the real error.
// ─────────────────────────────────────────────────────────────────────────────
import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {useSelector} from 'react-redux';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  DeviceEventEmitter,
  ScrollView,
  RefreshControl,
  Animated,
  Dimensions,
  BackHandler,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import {useGeofence} from '../GeofenceContext';
import useLocation from '../../../hooks/useLocation';
import LocationPickerModal from '../LocationPickerModal';
import NavigationFAB from '../NavigationFAB';
import ConfirmClockInScreen from './ConfirmClockInScreen';
import ConfirmBreakScreen from './ConfirmBreakScreen';
import ConfirmClockOutScreen from './ConfirmClockOutScreen';
import {isFaceRecognitionActive} from '../QRScannerModal';
import useAlertModal from '../../../hooks/useAlertModal';
import AlertModal from '../../Alert/AlertModal';
import FaceVerificationModal from '../FaceVerificationModal';
import {
  getActionFence,
  ACTION_TYPES,
  prewarmToken,
} from './attendanceActionHelpers';
import {
  loadRecords,
  formatElapsed,
  formatTime,
  formatDateShort,
  formatDuration,
  formatDurationShort,
  canClockIn,
  canStartBreak,
  canEndBreak,
  canClockOut,
  getSessionStats,
  isToday, // add this
} from '../../../screens/AttendanceManagement/helpers';
import {
  startAttendanceService,
  markBreakStarted,
  markBreakEnded,
  stopAttendanceService,
  resumeAttendanceService,
  loadPersistedFSState,
} from '../../../services/AttendanceManagement/AttendanceForegroundService';
import {
  FS_EVENT_BREAK_START,
  FS_EVENT_BREAK_END,
  FS_EVENT_CLOCK_OUT,
} from '../../../services/AttendanceManagement/AttendanceHeadlessTask';
import useAttendanceTheme from '../useAttendanceTheme';
import useAttendanceNotificationAction from '../../../hooks/useAttendanceNotificationAction';
import {initSyncListener} from '../../../services/AttendanceManagement/SyncManager';
import AttendanceOrchestrator from '../../../services/AttendanceManagement/AttendanceOrchestrator';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────
// P6.1 — Persisted attendance snapshot
//
// Survives app restarts. On a cold launch, if the first server sync fails
// (e.g. boot-time SOAP congestion), this lets the screen paint real
// last-known values instead of blank fields until the network call
// eventually succeeds.
// ─────────────────────────────────────────────
const ATTENDANCE_SNAPSHOT_KEY = '@attendance_last_known_snapshot';

const saveSnapshot = async snapshot => {
  try {
    await AsyncStorage.setItem(
      ATTENDANCE_SNAPSHOT_KEY,
      JSON.stringify(snapshot),
    );
  } catch {}
};

const loadSnapshot = async () => {
  try {
    const raw = await AsyncStorage.getItem(ATTENDANCE_SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const {width: SCREEN_W} = Dimensions.get('window');

// DK palette now comes from useAttendanceTheme() (light/dark). Each component
// below pulls `DK` from the hook and memoizes its styles from it.

// ─────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────
const SkeletonBlock = ({width: w, height: h, borderRadius: br = 6, style}) => {
  const {DK} = useAttendanceTheme();
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

const SkeletonScreen = () => {
  const {DK} = useAttendanceTheme();
  return (
    <View style={{flex: 1, backgroundColor: DK.bg, paddingTop: 20}}>
      <View style={{alignItems: 'center', marginBottom: 24}}>
        <SkeletonBlock width={120} height={14} borderRadius={7} />
      </View>
      <View style={{alignItems: 'center', marginBottom: 20}}>
        <SkeletonBlock width={160} height={160} borderRadius={80} />
      </View>
      <View style={{alignItems: 'center', marginBottom: 30}}>
        <SkeletonBlock
          width={180}
          height={40}
          borderRadius={8}
          style={{marginBottom: 8}}
        />
        <SkeletonBlock width={100} height={12} borderRadius={6} />
      </View>
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 16,
          gap: 10,
          marginBottom: 14,
        }}>
        <SkeletonBlock
          width={(SCREEN_W - 42) / 2}
          height={60}
          borderRadius={12}
        />
        <SkeletonBlock
          width={(SCREEN_W - 42) / 2}
          height={60}
          borderRadius={12}
        />
      </View>
      <View style={{paddingHorizontal: 16}}>
        <SkeletonBlock width={SCREEN_W - 32} height={48} borderRadius={12} />
      </View>
      <View style={{paddingHorizontal: 16, marginTop: 14}}>
        <SkeletonBlock width={SCREEN_W - 32} height={44} borderRadius={22} />
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────
// Clock Ring
// ─────────────────────────────────────────────
const RING_SIZE = 155;
const RING_STROKE = 5;

const ClockRing = ({status}) => {
  const {DK} = useAttendanceTheme();
  const CL = useMemo(() => makeCL(DK), [DK]);
  const pulse = useRef(new Animated.Value(1)).current;
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (status === 'in' || status === 'break') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.06,
            duration: 1400,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1400,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    pulse.setValue(1);
  }, [status, pulse]);

  const ringColor =
    status === 'in'
      ? DK.accentGreen
      : status === 'break'
      ? DK.accentAmber
      : DK.ring;

  const now = new Date();
  const hh = now.getHours();
  const mm = now.getMinutes().toString().padStart(2, '0');
  const ampm = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 || 12;

  return (
    <View style={CL.wrap}>
      <Animated.View
        style={[
          CL.outerGlow,
          {borderColor: ringColor, transform: [{scale: pulse}]},
        ]}
      />
      <View style={[CL.ring, {borderColor: ringColor}]}>
        <View style={CL.inner}>
          <Text style={CL.time}>{`${h12}:${mm}`}</Text>
          <Text style={CL.ampm}>{ampm}</Text>
        </View>
      </View>
    </View>
  );
};

const makeCL = DK =>
  StyleSheet.create({
    wrap: {alignItems: 'center', justifyContent: 'center', marginBottom: 18},
    outerGlow: {
      position: 'absolute',
      width: RING_SIZE + 18,
      height: RING_SIZE + 18,
      borderRadius: (RING_SIZE + 18) / 2,
      borderWidth: 1.5,
      opacity: 0.3,
    },
    ring: {
      width: RING_SIZE,
      height: RING_SIZE,
      borderRadius: RING_SIZE / 2,
      borderWidth: RING_STROKE,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: DK.card,
    },
    inner: {alignItems: 'center'},
    time: {
      fontSize: 38,
      fontWeight: '800',
      color: DK.textPrimary,
      letterSpacing: -1,
    },
    ampm: {
      fontSize: 11,
      fontWeight: '600',
      color: DK.textSecondary,
      letterSpacing: 1.5,
      marginTop: -2,
    },
  });

// ─────────────────────────────────────────────
// Status pill
// ─────────────────────────────────────────────
const StatusPill = ({status}) => {
  const {DK} = useAttendanceTheme();
  const SP = useMemo(() => makeSP(DK), [DK]);
  const STATUS_CFG = {
    out: {
      label: 'Not Clocked In',
      color: DK.textSecondary,
      dotColor: DK.textMuted,
    },
    in: {label: 'Clocked In', color: DK.accentGreen, dotColor: DK.accentGreen},
    break: {label: 'On Break', color: DK.accentAmber, dotColor: DK.accentAmber},
  };
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.out;
  return (
    <View style={SP.wrap}>
      <View style={[SP.dot, {backgroundColor: cfg.dotColor}]} />
      <Text style={[SP.text, {color: cfg.color}]}>{cfg.label}</Text>
    </View>
  );
};

const makeSP = DK =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 20,
      backgroundColor: DK.surface,
      borderWidth: 1,
      borderColor: DK.cardBorder,
      marginBottom: 14,
    },
    dot: {width: 6, height: 6, borderRadius: 3},
    text: {fontSize: 11, fontWeight: '700', letterSpacing: 0.4},
  });

// ─────────────────────────────────────────────
// Time summary — shows elapsed, clock-in time, breaks
// ─────────────────────────────────────────────
const TimeSummary = ({status, elapsed, clockInTime, clockOutTime}) => {
  const {DK} = useAttendanceTheme();
  const TS = useMemo(() => makeTS(DK), [DK]);

  const totalTimeStr =
    status !== 'out'
      ? formatElapsed(elapsed)
      : clockInTime && clockOutTime
      ? formatElapsed(
          Math.floor(
            (new Date(clockOutTime).getTime() -
              new Date(clockInTime).getTime()) /
              1000,
          ),
        )
      : '--:--:--';

  const clockInStr = clockInTime ? formatTime(clockInTime) : '--:--';
  const clockOutStr = clockOutTime ? formatTime(clockOutTime) : '--:--';

  return (
    <View style={TS.container}>
      <View style={TS.heroCard}>
        <Text style={TS.heroLabel}>TOTAL TIME</Text>
        <Text
          style={[
            TS.heroValue,
            status === 'out' && !clockOutTime && {color: DK.textMuted},
          ]}>
          {totalTimeStr}
        </Text>
      </View>
      <View style={TS.row}>
        <View style={TS.miniCard}>
          <Text style={TS.miniLabel}>CLOCK IN</Text>
          <Text style={TS.miniValue}>{clockInStr}</Text>
        </View>
        <View style={TS.miniCard}>
          <Text style={TS.miniLabel}>CLOCK OUT</Text>
          <Text style={TS.miniValue}>{clockOutStr}</Text>
        </View>
      </View>
    </View>
  );
};

const makeTS = DK =>
  StyleSheet.create({
    container: {paddingHorizontal: 16, marginBottom: 12},
    heroCard: {
      backgroundColor: DK.card,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: DK.cardBorder,
      alignItems: 'center',
      marginBottom: 8,
    },
    heroLabel: {
      fontSize: 9,
      fontWeight: '700',
      color: DK.textMuted,
      letterSpacing: 1.2,
      marginBottom: 4,
    },
    heroValue: {
      fontSize: 34,
      fontWeight: '800',
      color: DK.textPrimary,
      letterSpacing: -1,
    },
    row: {flexDirection: 'row', gap: 8},
    miniCard: {
      flex: 1,
      backgroundColor: DK.card,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: DK.cardBorder,
      alignItems: 'center',
    },
    miniLabel: {
      fontSize: 8,
      fontWeight: '700',
      color: DK.textMuted,
      letterSpacing: 1,
      marginBottom: 3,
    },
    miniValue: {fontSize: 15, fontWeight: '700', color: DK.textPrimary},
  });

// ─────────────────────────────────────────────
// Location strip
// ─────────────────────────────────────────────
const LocationStrip = ({
  matchedFence,
  locationLoading,
  locationError,
  onPress,
}) => {
  const {DK} = useAttendanceTheme();
  const LS = useMemo(() => makeLS(DK), [DK]);
  if (locationLoading) {
    return (
      <View style={[LS.strip, LS.stripLoading]}>
        <ActivityIndicator size="small" color={DK.accent} />
        <Text style={LS.loadingTxt}>Verifying location…</Text>
      </View>
    );
  }
  const ok = !!matchedFence;
  return (
    <TouchableOpacity
      style={[LS.strip, ok ? LS.stripOk : LS.stripBad]}
      onPress={onPress}
      activeOpacity={0.8}>
      <View
        style={[LS.dot, {backgroundColor: ok ? DK.accentGreen : DK.accentRed}]}
      />
      <View style={LS.body}>
        <Text style={LS.label}>CURRENT LOCATION</Text>
        <Text
          style={[LS.value, {color: ok ? DK.accentGreen : DK.accentRed}]}
          numberOfLines={1}>
          {ok
            ? matchedFence.FenceName
            : locationError ?? 'Outside authorised zone'}
        </Text>
        {ok && matchedFence.distanceMetres != null && (
          <Text style={[LS.sub, {color: DK.accentGreen}]}>
            {matchedFence.distanceMetres} m away
          </Text>
        )}
      </View>
      <Text style={[LS.arrow, {color: ok ? DK.accentGreen : DK.accentRed}]}>
        ›
      </Text>
    </TouchableOpacity>
  );
};

const makeLS = DK =>
  StyleSheet.create({
    strip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginHorizontal: 16,
      marginBottom: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
    },
    stripLoading: {
      backgroundColor: 'rgba(27,79,216,0.06)',
      borderColor: 'rgba(27,79,216,0.2)',
    },
    stripOk: {
      backgroundColor: 'rgba(5,150,105,0.06)',
      borderColor: 'rgba(5,150,105,0.2)',
    },
    stripBad: {
      backgroundColor: 'rgba(220,38,38,0.06)',
      borderColor: 'rgba(220,38,38,0.2)',
    },
    loadingTxt: {fontSize: 12, color: DK.accent, fontWeight: '500'},
    dot: {width: 7, height: 7, borderRadius: 3.5, flexShrink: 0},
    body: {flex: 1},
    label: {
      fontSize: 8,
      fontWeight: '700',
      color: DK.textMuted,
      letterSpacing: 0.6,
      marginBottom: 1,
    },
    value: {fontSize: 12, fontWeight: '600'},
    sub: {fontSize: 10, marginTop: 1},
    arrow: {fontSize: 16},
  });

// ─────────────────────────────────────────────
// Spoofing banner
// ─────────────────────────────────────────────
const SPOOF_LABELS = {
  mock_flag: 'Mock location app detected',
  accuracy_too_perfect: 'Suspiciously perfect GPS accuracy',
  impossible_speed: 'Impossible movement speed detected',
  stale_fix: 'GPS fix is too old',
  position_jump: 'Sudden location jump detected',
  rooted_device: 'Device appears to be rooted or jailbroken',
  emulator: 'Cannot run attendance from an emulator',
};

const SpoofingBanner = ({reason}) => {
  const {DK} = useAttendanceTheme();
  const SBN = useMemo(() => makeSBN(DK), [DK]);
  return (
    <View style={SBN.wrap}>
      <Text style={SBN.icon}>⚠️</Text>
      <View style={{flex: 1}}>
        <Text style={SBN.title}>GPS Integrity Warning</Text>
        <Text style={SBN.sub}>
          {SPOOF_LABELS[reason] ?? 'Suspicious GPS activity detected'}
        </Text>
      </View>
    </View>
  );
};

const makeSBN = DK =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 16,
      marginBottom: 8,
      padding: 10,
      borderRadius: 10,
      backgroundColor: 'rgba(217,119,6,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(217,119,6,0.25)',
    },
    icon: {fontSize: 16},
    title: {fontSize: 12, fontWeight: '700', color: DK.accentAmber},
    sub: {fontSize: 11, color: DK.accentAmber, marginTop: 1, opacity: 0.85},
  });

// ─────────────────────────────────────────────
// P4.1 — Wi-Fi required banner (new)
// ─────────────────────────────────────────────
const WifiRequiredBanner = ({networkName}) => {
  const {DK} = useAttendanceTheme();
  const WB = useMemo(() => makeWB(DK), [DK]);
  return (
    <View style={WB.wrap}>
      <Text style={WB.icon}>📶</Text>
      <View style={{flex: 1}}>
        <Text style={WB.title}>Wi-Fi Required</Text>
        <Text style={WB.sub}>
          {networkName
            ? `Connect to "${networkName}" Wi-Fi to clock in at this location`
            : 'Connect to the required Wi-Fi network to clock in at this location'}
        </Text>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────
// Today's attendance complete banner
// ─────────────────────────────────────────────
const TodayCompleteBanner = () => {
  const {DK} = useAttendanceTheme();
  const TC = useMemo(() => makeTC(DK), [DK]);
  return (
    <View style={TC.wrap}>
      <Text style={TC.icon}>✓</Text>
      <View style={{flex: 1}}>
        <Text style={TC.title}>Today's Attendance Complete</Text>
        <Text style={TC.sub}>Thank you! See you tomorrow.</Text>
      </View>
    </View>
  );
};

const makeTC = DK =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 16,
      marginBottom: 8,
      padding: 10,
      borderRadius: 10,
      backgroundColor: 'rgba(5,150,105,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(5,150,105,0.25)',
    },
    icon: {fontSize: 16, color: DK.accentGreen, fontWeight: '700'},
    title: {fontSize: 12, fontWeight: '700', color: DK.accentGreen},
    sub: {fontSize: 11, color: DK.accentGreen, marginTop: 1, opacity: 0.85},
  });

const makeWB = DK =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 16,
      marginBottom: 8,
      padding: 10,
      borderRadius: 10,
      backgroundColor: 'rgba(217,119,6,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(217,119,6,0.25)',
    },
    icon: {fontSize: 16},
    title: {fontSize: 12, fontWeight: '700', color: DK.accentAmber},
    sub: {fontSize: 11, color: DK.accentAmber, marginTop: 1, opacity: 0.85},
  });

// ─────────────────────────────────────────────
// Notification banner
// ─────────────────────────────────────────────
const NotificationActionBanner = ({action, onDismiss}) => {
  const {DK} = useAttendanceTheme();
  const NB = useMemo(() => makeNB(DK), [DK]);
  const messages = {
    break_start: 'Break started from notification',
    break_end: 'Break ended from notification',
    clock_out: 'Clocked out from notification',
  };
  return (
    <View style={NB.wrap}>
      <Text style={NB.txt}>
        {messages[action] ?? 'Action from notification'}
      </Text>
      <TouchableOpacity
        onPress={onDismiss}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        <Text style={NB.dismiss}>✕</Text>
      </TouchableOpacity>
    </View>
  );
};

const makeNB = DK =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: 16,
      marginBottom: 8,
      padding: 10,
      borderRadius: 10,
      backgroundColor: 'rgba(27,79,216,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(27,79,216,0.2)',
    },
    txt: {fontSize: 12, color: DK.accent, fontWeight: '500', flex: 1},
    dismiss: {fontSize: 13, color: DK.accent, fontWeight: '700'},
  });

// ─────────────────────────────────────────────
// Action buttons
// ─────────────────────────────────────────────
const ActionButtons = ({
  status,
  locationLoading,
  matchedFence,
  spoofingDetected,
  canBreak,
  canBreakEnd,
  canOut,
  onClockIn,
  onBreakStart,
  onBreakEnd,
  onClockOut,
}) => {
  const {DK} = useAttendanceTheme();
  const clockInDisabled = locationLoading || !matchedFence || spoofingDetected;
  const clockOutDisabled = spoofingDetected || !canOut;
  const breakDisabled = spoofingDetected || !canBreak;
  const breakEndDisabled = !canBreakEnd;

  return (
    <View style={AB.wrap}>
      {status === 'out' && (
        <TouchableOpacity
          style={[
            AB.btn,
            {backgroundColor: DK.accentGreen},
            clockInDisabled && AB.disabled,
          ]}
          onPress={onClockIn}
          disabled={clockInDisabled}>
          <Text style={AB.txt}>▶ Clock In</Text>
        </TouchableOpacity>
      )}
      {status === 'in' && (
        <>
          <TouchableOpacity
            style={[
              AB.btn,
              {backgroundColor: DK.accentRed},
              clockOutDisabled && AB.disabled,
            ]}
            onPress={onClockOut}
            disabled={clockOutDisabled}>
            <Text style={AB.txt}>■ Clock Out</Text>
          </TouchableOpacity>
        </>
      )}
      {status === 'break' && (
        <>
          <TouchableOpacity
            style={[
              AB.btn,
              {backgroundColor: DK.accentFill},
              breakEndDisabled && AB.disabled,
            ]}
            onPress={onBreakEnd}
            disabled={breakEndDisabled}>
            <Text style={[AB.txt, {color: DK.onAccentFill}]}>▶ End Break</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              AB.btn,
              {backgroundColor: DK.accentRed},
              clockOutDisabled && AB.disabled,
            ]}
            onPress={onClockOut}
            disabled={clockOutDisabled}>
            <Text style={AB.txt}>■ Clock Out</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const AB = StyleSheet.create({
  wrap: {paddingHorizontal: 16, paddingBottom: 6, gap: 8},
  btn: {borderRadius: 26, paddingVertical: 15, alignItems: 'center'},
  disabled: {opacity: 0.35},
  txt: {color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: 0.3},
});

// ─────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────
const TimeClockScreen = ({onNavigate}) => {
  const {DK, isDark} = useAttendanceTheme();
  const S = useMemo(() => makeS(DK), [DK]);
  const {userData} = useSelector(s => s.user);
  const person = userData?.Person;

  const [subScreen, setSubScreen] = useState('main');
  const [status, setStatus] = useState('out');
  const [clockInTime, setClockInTime] = useState(null);
  const [lastOut, setLastOut] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notifAction, setNotifAction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const {showSuccess, showError, showWarning, alertModalProps} =
    useAlertModal();
  const [breakCount, setBreakCount] = useState(0);
  const [totalBreakMs, setTotalBreakMs] = useState(0);
  const [workflowFlags, setWorkflowFlags] = useState({
    canIn: true,
    canBreak: false,
    canBreakEnd: false,
    canOut: false,
  });
  const [todayComplete, setTodayComplete] = useState(false);
  const [syncError, setSyncError] = useState(null); // add this state
  const [isSyncRetrying, setIsSyncRetrying] = useState(false); // add this line

  const [pendingAction, setPendingAction] = useState(null);
  const [preFaceModalVisible, setPreFaceModalVisible] = useState(false);
  const [preFaceResult, setPreFaceResult] = useState(null);
  // P2.5 — Validation token from AttendanceOrchestrator.prepare()
  const [validationToken, setValidationToken] = useState(null);

  // P4.1 — live NetInfo snapshot, used only for the Wi-Fi pre-flight banner.
  // This is separate from the orchestrator's own network read at prepare()/
  // confirm() time — that one remains the source of truth for what's
  // actually submitted. This is purely a fast, non-blocking UI signal.
  const [currentNetInfo, setCurrentNetInfo] = useState(null);

  const actionInProgress = useRef(false);
  const timerRef = useRef(null);

  useAttendanceNotificationAction(action => {
    switch (action) {
      case 'START_BREAK':
        setSubScreen('confirmBreak');
        break;
      case 'END_BREAK':
        setSubScreen('confirmBreakEnd');
        break;
      case 'CLOCK_OUT':
        setSubScreen('confirmOut');
        break;
      default:
        setSubScreen('main');
        break;
    }
  });

  const {
    permissionStatus,
    coords,
    matchedFence,
    clockInFence,
    locationLoading,
    locationError,
    recordClockInFence,
    refresh,
    wifiInfo,
  } = useGeofence();

  const {spoofingDetected, spoofingReason} = useLocation();

  // P4.1 — subscribe to live network changes for the Wi-Fi banner.
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setCurrentNetInfo(state);
    });
    return () => unsubscribe();
  }, []);

  // P4.1 — does the CLOCK_IN fence (the one the banner/button care about)
  // enforce a network policy, and is the device currently on it?
  // Mirrors the exact shape AttendanceOrchestrator's checkNetworkMatch reads:
  // fence.networks[].NetworkName vs the live wifi SSID.
  const fenceNetworks = matchedFence?.networks ?? [];
  const fenceRequiresWifi = fenceNetworks.length > 0;
  const requiredNetworkName = fenceNetworks[0]?.NetworkName ?? null;
  const isOnRequiredWifi =
    !fenceRequiresWifi ||
    (currentNetInfo?.type === 'wifi' &&
      !!currentNetInfo?.details?.ssid &&
      currentNetInfo.details.ssid === requiredNetworkName);

  const syncStateFromStorage = useCallback(async () => {
    setIsSyncRetrying(true);
    try {
      const records = await loadRecords({person});
      setSyncError(null);
      setWorkflowFlags({
        canIn: canClockIn(records),
        canBreak: canStartBreak(records),
        canBreakEnd: canEndBreak(records),
        canOut: canClockOut(records),
      });

      let snapshotToSave = {
        status: 'out',
        clockInTime: null,
        lastOut: null,
        breakCount: 0,
        totalBreakMs: 0,
      };

      if (!records.length) {
        setStatus('out');
        setClockInTime(null);
        setLastOut(null);
        setElapsed(0);
        setBreakCount(0);
        setTotalBreakMs(0);
        setTodayComplete(false); // add this
      } else {
        const last = records[records.length - 1];
        const breaks = last.breaks || [];
        const completedBreakCount = breaks.filter(b => b.breakEnd).length;
        let bMs = 0;
        breaks.forEach(b => {
          if (b.breakStart && b.breakEnd)
            bMs += new Date(b.breakEnd) - new Date(b.breakStart);
        });
        setBreakCount(completedBreakCount);
        setTotalBreakMs(bMs);

        let newStatus = 'out';
        if (last.clockOut) {
          setLastOut(last.clockOut);
          setStatus('out');
          setClockInTime(last.clockIn);
          newStatus = 'out';
          // If this completed shift's clock-out was today, block further clock-in
          // until tomorrow and show the "today's attendance is done" banner.
          setTodayComplete(isToday(last.clockOut));
        } else if (
          last.breaks?.length &&
          !last.breaks[last.breaks.length - 1].breakEnd
        ) {
          setStatus('break');
          setClockInTime(last.clockIn);
          setLastOut(null);
          newStatus = 'break';
          setTodayComplete(false); // any open/in-progress shift means today isn't "done"
        } else if (last.clockIn) {
          setStatus('in');
          setClockInTime(last.clockIn);
          setLastOut(null);
          setElapsed(
            Math.floor((Date.now() - new Date(last.clockIn).getTime()) / 1000),
          );
          newStatus = 'in';
        }

        snapshotToSave = {
          status: newStatus,
          clockInTime: last.clockIn ?? null,
          lastOut: last.clockOut ?? null,
          breakCount: completedBreakCount,
          totalBreakMs: bMs,
        };
      }

      saveSnapshot(snapshotToSave);
    } catch (err) {
      console.warn(
        '[syncStateFromStorage] failed, keeping last known state:',
        err.message,
      );
      setSyncError('Unable to verify current status.');
    } finally {
      setIsSyncRetrying(false);
    }
  }, [person]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
      await syncStateFromStorage();
    } catch (e) {
      console.warn('Refresh failed', e);
    } finally {
      setRefreshing(false);
    }
  }, [refresh, syncStateFromStorage]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      // P6.1 — Paint last-known state INSTANTLY from disk, before any network
      // call resolves. This is what prevents a cold app launch during a
      // network hiccup from showing blank Total Time / Clock In / Clock Out.
      const snapshot = await loadSnapshot();
      if (snapshot) {
        setStatus(snapshot.status);
        setClockInTime(snapshot.clockInTime);
        setLastOut(snapshot.lastOut);
        setBreakCount(snapshot.breakCount);
        setTotalBreakMs(snapshot.totalBreakMs);
        if (snapshot.status === 'in' && snapshot.clockInTime) {
          setElapsed(
            Math.floor(
              (Date.now() - new Date(snapshot.clockInTime).getTime()) / 1000,
            ),
          );
        }
      }

      initSyncListener();
      // P1.1 + P3.2 — Pre-warm OAuth token + NetInfo cache on mount.
      // Both fire concurrently with data sync, so they're ready before
      // the first action press.
      prewarmToken();
      NetInfo.fetch().catch(() => {});
      await syncStateFromStorage(); // overwrites the snapshot with fresh server truth if it succeeds
      const savedFS = await loadPersistedFSState();
      if (savedFS?.isRunning) {
        await resumeAttendanceService(savedFS);
      }
      setIsLoading(false);
    };
    init();
  }, [syncStateFromStorage]);

  useEffect(() => {
    if (status === 'in' && clockInTime) {
      timerRef.current = setInterval(
        () =>
          setElapsed(
            Math.floor((Date.now() - new Date(clockInTime).getTime()) / 1000),
          ),
        1000,
      );
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status, clockInTime]);

  useEffect(() => {
    const onBreakStart = () => {
      setStatus('break');
      setNotifAction('break_start');
      setWorkflowFlags(prev => ({...prev, canBreak: false, canBreakEnd: true}));
    };
    const onBreakEnd = () => {
      setStatus('in');
      setNotifAction('break_end');
      setWorkflowFlags(prev => ({...prev, canBreak: true, canBreakEnd: false}));
    };
    const onClockOut = ({clockOut}) => {
      setStatus('out');
      setLastOut(clockOut);
      setClockInTime(null);
      setElapsed(0);
      setNotifAction('clock_out');
      setWorkflowFlags({
        canIn: true,
        canBreak: false,
        canBreakEnd: false,
        canOut: false,
      });
      clearInterval(timerRef.current);
    };

    const sub1 = DeviceEventEmitter.addListener(
      FS_EVENT_BREAK_START,
      onBreakStart,
    );
    const sub2 = DeviceEventEmitter.addListener(FS_EVENT_BREAK_END, onBreakEnd);
    const sub3 = DeviceEventEmitter.addListener(FS_EVENT_CLOCK_OUT, onClockOut);
    return () => {
      sub1.remove();
      sub2.remove();
      sub3.remove();
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (modalVisible) {
          setModalVisible(false);
          return true; // Swallowed by TimeClockScreen
        }
        if (preFaceModalVisible) {
          handlePreFaceCancel();
          return true;
        }
        if (subScreen !== 'main') {
          setSubScreen('main');
          setValidationToken(null);
          return true; // Swallowed by TimeClockScreen
        }
        // Let it bubble up to AttendanceManagement
        return false;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [subScreen, modalVisible, preFaceModalVisible, handlePreFaceCancel]),
  );

  const checkCommonIntegrity = (requireFence = false) => {
    if (locationLoading) {
      showWarning('Location is still being verified. Try again in a moment.');
      return false;
    }
    if (permissionStatus === 'denied') {
      showWarning('Please enable location access in your device Settings.');
      return false;
    }
    if (spoofingDetected) {
      showError(SPOOF_LABELS[spoofingReason] ?? 'Suspicious GPS detected.');
      return false;
    }
    if (requireFence && !matchedFence) {
      showError(locationError ?? 'You are outside all authorised zones.');
      return false;
    }
    return true;
  };

  const guardedAction = useCallback(async fn => {
    if (actionInProgress.current) return;
    actionInProgress.current = true;
    try {
      await fn();
    } finally {
      actionInProgress.current = false;
    }
  }, []);

  const handleActionPress = useCallback(
    async actionKey => {
      if (actionInProgress.current) return;

      // ── Phase 1: Instant local checks (zero network cost) ──
      const needsFence = actionKey === 'confirmIn';
      if (!checkCommonIntegrity(needsFence)) return;

      // P4.1 — Wi-Fi policy check, same phase as the other instant local
      // checks: block BEFORE any SOAP call if the fence requires a specific
      // network and the device isn't on it. The button is already disabled
      // for this case, but this guards direct calls / race conditions too.
      if (needsFence && fenceRequiresWifi && !isOnRequiredWifi) {
        showError(
          requiredNetworkName
            ? `Connect to "${requiredNetworkName}" Wi-Fi to clock in at this location.`
            : 'Connect to the required Wi-Fi network to clock in at this location.',
        );
        return;
      }

      // if (needsFence && todayComplete) {
      //   showError("You've already completed your attendance for today.");
      //   return;
      // }

      actionInProgress.current = true;
      setIsProcessing(true);
      try {
        // Emulator check (fast local, ~50ms)
        const runningOnEmulator = await DeviceInfo.isEmulator();
        if (runningOnEmulator) {
          showError(
            'Attendance actions cannot be performed from an emulator. Please use a physical device.',
          );
          return;
        }

        // ── Phase 2: User-gated checks BEFORE any SOAP call ──
        // P0.3: If Face fails here, zero SOAP calls are wasted.
        const actionTypeMap = {
          confirmIn: ACTION_TYPES.CLOCK_IN,
          confirmOut: ACTION_TYPES.CLOCK_OUT,
          confirmBreak: ACTION_TYPES.BREAK_START,
          confirmBreakEnd: ACTION_TYPES.BREAK_END,
        };
        const fenceForGating = getActionFence({
          actionType: actionTypeMap[actionKey],
          matchedFence,
          clockInFence,
        });
        setPendingAction(actionKey);
        setPreFaceResult(null);
        setValidationToken(null);

        // Face gate: open modal and STOP here — handlePreFaceSuccess
        // will continue the flow once the user passes.
        if (isFaceRecognitionActive(fenceForGating)) {
          setPreFaceModalVisible(true);
          // Release the processing lock — the modal is now in control
          setIsProcessing(false);
          actionInProgress.current = false;
          return;
        }

        // ── Phase 3: Single parallel SOAP validation ──
        // No Face gate → go straight to orchestrator.
        await _runOrchestratorPrepare({
          actionKey,
          actionType: actionTypeMap[actionKey],
          faceVerified: false,
        });
      } catch (err) {
        showError(
          err.message || 'Unable to complete action. Please try again.',
        );
      } finally {
        setIsProcessing(false);
        actionInProgress.current = false;
      }
    },
    [
      matchedFence,
      clockInFence,
      refresh,
      spoofingDetected,
      locationLoading,
      permissionStatus,
      fenceRequiresWifi,
      isOnRequiredWifi,
      requiredNetworkName,
    ],
  );

  // ── _runOrchestratorPrepare ──────────────────────────────────────────────
  // Fires the parallel SOAP validation, stores the token, and navigates
  // to the confirm screen. Called after all user-gated checks pass.
  const _runOrchestratorPrepare = useCallback(
    async ({actionKey, actionType, faceVerified}) => {
      setIsProcessing(true);
      try {
        const result = await AttendanceOrchestrator.prepare({
          person,
          actionType,
          coords,
          clockInFence,
          faceVerified,
          spoofingDetected,
        });

        if (!result.ok) {
          showError(result.error);
          return;
        }

        setValidationToken(result.token);
        setSubScreen(actionKey);
      } finally {
        setIsProcessing(false);
        actionInProgress.current = false;
      }
    },
    [person, coords, clockInFence, spoofingDetected],
  );

  const handlePreFaceSuccess = useCallback(
    result => {
      setPreFaceModalVisible(false);
      setPreFaceResult(result);
      // Face gate passed — go straight to SOAP validation. The QR gate (when
      // the fence requires one) now runs on the confirm screen's Confirm press.
      const actionTypeMap = {
        confirmIn: ACTION_TYPES.CLOCK_IN,
        confirmOut: ACTION_TYPES.CLOCK_OUT,
        confirmBreak: ACTION_TYPES.BREAK_START,
        confirmBreakEnd: ACTION_TYPES.BREAK_END,
      };
      // P4.2 — was `.catch(() => {})`, silently swallowing any throw from
      // _runOrchestratorPrepare (e.g. a SOAP failure) with zero feedback to
      // the user. Now surfaces it exactly like the non-face-gated path does.
      _runOrchestratorPrepare({
        actionKey: pendingAction,
        actionType: actionTypeMap[pendingAction],
        faceVerified: result?.verified === true,
      }).catch(err => {
        showError(
          err.message || 'Unable to complete action. Please try again.',
        );
      });
    },
    [pendingAction, _runOrchestratorPrepare, showError],
  );

  const handlePreFaceCancel = useCallback(() => {
    setPreFaceModalVisible(false);
    setPendingAction(null);
    setPreFaceResult(null);
    setValidationToken(null);
    actionInProgress.current = false;
  }, []);

  const handleClockIn = useCallback(
    async note => {
      await guardedAction(async () => {
        const now = new Date().toISOString();
        recordClockInFence(matchedFence);
        setClockInTime(now);
        setLastOut(null);
        setElapsed(0);
        setStatus('in');
        setSubScreen('main');
        setBreakCount(0);
        setTotalBreakMs(0);
        setValidationToken(null);
        await startAttendanceService(now);
        setWorkflowFlags({
          canIn: false,
          canBreak: true,
          canBreakEnd: false,
          canOut: true,
        });
        setTimeout(() => syncStateFromStorage().catch(() => {}), 3000);
      });
    },
    [matchedFence, recordClockInFence, syncStateFromStorage, guardedAction],
  );

  const handleBreakStart = useCallback(
    async note => {
      await guardedAction(async () => {
        const now = new Date().toISOString();
        setStatus('break');
        setSubScreen('main');
        setValidationToken(null);
        await markBreakStarted(now);
        setWorkflowFlags({
          canIn: false,
          canBreak: false,
          canBreakEnd: true,
          canOut: false,
        });
        setTimeout(() => syncStateFromStorage().catch(() => {}), 3000);
      });
    },
    [syncStateFromStorage, guardedAction],
  );

  const handleBreakEnd = useCallback(
    async (note = '') => {
      await guardedAction(async () => {
        setIsProcessing(true);
        try {
          setStatus('in');
          setSubScreen('main');
          setValidationToken(null);
          await markBreakEnded();
          setWorkflowFlags({
            canIn: false,
            canBreak: true,
            canBreakEnd: false,
            canOut: true,
          });
          setTimeout(() => syncStateFromStorage().catch(() => {}), 3000);
        } finally {
          setIsProcessing(false);
        }
      });
    },
    [syncStateFromStorage, guardedAction],
  );

  const handleClockOut = useCallback(
    async (note, endWorkDay) => {
      await guardedAction(async () => {
        const now = new Date().toISOString();
        setLastOut(now);
        setElapsed(0);
        setStatus('out');
        setSubScreen('main');
        setValidationToken(null);
        await stopAttendanceService();
        setWorkflowFlags({
          canIn: true,
          canBreak: false,
          canBreakEnd: false,
          canOut: false,
        });
        setTimeout(() => syncStateFromStorage().catch(() => {}), 3000);
      });
    },
    [syncStateFromStorage, guardedAction],
  );

  // ── Sub-screens ─────────────────────────────────────────────────────────────
  // P2.5: validationToken passed to all confirm screens.
  // Confirm screens use Orchestrator.confirm(token) — no redundant SOAP calls.
  if (subScreen === 'confirmIn')
    return (
      <ConfirmClockInScreen
        lastOut={lastOut}
        validationToken={validationToken}
        onConfirm={handleClockIn}
        onBack={() => {
          setSubScreen('main');
          setValidationToken(null);
        }}
      />
    );
  if (subScreen === 'confirmBreak')
    return (
      <ConfirmBreakScreen
        breakType="BREAK_START"
        validationToken={validationToken}
        onConfirm={handleBreakStart}
        onBack={() => {
          setSubScreen('main');
          setValidationToken(null);
        }}
      />
    );
  if (subScreen === 'confirmBreakEnd')
    return (
      <ConfirmBreakScreen
        breakType="BREAK_END"
        validationToken={validationToken}
        onConfirm={handleBreakEnd}
        onBack={() => {
          setSubScreen('main');
          setValidationToken(null);
        }}
      />
    );
  if (subScreen === 'confirmOut')
    return (
      <ConfirmClockOutScreen
        validationToken={validationToken}
        onConfirm={handleClockOut}
        onBack={() => {
          setSubScreen('main');
          setValidationToken(null);
        }}
      />
    );

  if (isLoading) return <SkeletonScreen />;

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={S.screen}>
      <View style={{height: Platform.OS === 'android' ? 6 : 0}} />

      {isProcessing && (
        <View style={S.processingOverlay}>
          <View style={S.processingContainer}>
            <ActivityIndicator size="large" color={DK.accent} />
            <Text style={S.processingText}>Processing…</Text>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={S.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={DK.accent}
            colors={[DK.accent]}
          />
        }
        showsVerticalScrollIndicator={false}>
        <StatusPill status={status} />
        <ClockRing status={status} />
        <Text style={S.dateLabel}>{todayStr}</Text>

        <TimeSummary
          status={status}
          elapsed={elapsed}
          clockInTime={clockInTime}
          clockOutTime={lastOut}
        />

        {notifAction && (
          <NotificationActionBanner
            action={notifAction}
            onDismiss={() => setNotifAction(null)}
          />
        )}

        {spoofingDetected && <SpoofingBanner reason={spoofingReason} />}

        {syncError && (
          <TouchableOpacity
            onPress={() => {
              if (!isSyncRetrying) syncStateFromStorage();
            }}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginHorizontal: 16,
              marginBottom: 8,
              padding: 10,
              borderRadius: 10,
              backgroundColor: 'rgba(107,114,128,0.08)',
              borderWidth: 1,
              borderColor: 'rgba(107,114,128,0.2)',
            }}>
            {isSyncRetrying ? (
              <ActivityIndicator size="small" color={DK.textSecondary} />
            ) : (
              <Text style={{fontSize: 14}}>↻</Text>
            )}
            <Text style={{fontSize: 11, color: DK.textSecondary, flex: 1}}>
              {syncError} Tap to retry.
            </Text>
          </TouchableOpacity>
        )}

        {/* P4.1 — only relevant pre-clock-in, and only once we actually
            have a matched fence to check a policy against. */}
        {status === 'out' &&
          fenceRequiresWifi &&
          matchedFence &&
          !isOnRequiredWifi && (
            <WifiRequiredBanner networkName={requiredNetworkName} />
          )}

        {status === 'out' && todayComplete && <TodayCompleteBanner />}

        <LocationStrip
          matchedFence={matchedFence}
          locationLoading={locationLoading}
          locationError={locationError}
          onPress={() => setModalVisible(true)}
        />

        <View style={{flex: 1, minHeight: 20}} />

        <ActionButtons
          status={status}
          locationLoading={locationLoading}
          matchedFence={
            (status === 'out' && fenceRequiresWifi && !isOnRequiredWifi) ||
            todayComplete
              ? null
              : matchedFence
          }
          spoofingDetected={spoofingDetected}
          canBreak={workflowFlags.canBreak}
          canBreakEnd={workflowFlags.canBreakEnd}
          canOut={workflowFlags.canOut}
          onClockIn={() => handleActionPress('confirmIn')}
          onBreakStart={() => handleActionPress('confirmBreak')}
          onBreakEnd={() => handleActionPress('confirmBreakEnd')}
          onClockOut={() => handleActionPress('confirmOut')}
        />
      </ScrollView>

      {/* NavigationFAB hidden — Home and Timesheets are disabled, so the FAB
          has no other destinations to switch to. */}
      {/* <NavigationFAB activeScreen="TimeClock" onNavigate={onNavigate} /> */}
      <LocationPickerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
      <FaceVerificationModal
        visible={preFaceModalVisible}
        eventLabel={
          pendingAction === 'confirmIn'
            ? 'CLOCK_IN'
            : pendingAction === 'confirmOut'
            ? 'CLOCK_OUT'
            : pendingAction === 'confirmBreak'
            ? 'BREAK_START'
            : 'BREAK_END'
        }
        onSuccess={handlePreFaceSuccess}
        onFailure={() => {
          showError('Could not verify your identity.');
          handlePreFaceCancel();
        }}
        onCancel={handlePreFaceCancel}
      />
      <AlertModal {...alertModalProps} />
    </SafeAreaView>
  );
};

export default TimeClockScreen;

const makeS = DK =>
  StyleSheet.create({
    screen: {flex: 1, backgroundColor: DK.bg},
    dateLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: DK.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
      letterSpacing: 0.3,
    },
    processingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(245,247,250,0.92)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
    },
    processingContainer: {
      alignItems: 'center',
      backgroundColor: DK.card,
      paddingHorizontal: 40,
      paddingVertical: 28,
      borderRadius: 16,
      gap: 12,
      borderWidth: 1,
      borderColor: DK.cardBorder,
    },
    processingText: {fontSize: 14, color: DK.textSecondary, fontWeight: '600'},
    scrollContent: {flexGrow: 1, paddingBottom: 90, paddingTop: 14},
  });
