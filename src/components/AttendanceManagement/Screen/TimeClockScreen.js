/* eslint-disable no-unused-vars */
// ─────────────────────────────────────────────────────────────────────────────
// components/AttendanceManagement/screens/TimeClockScreen.js
//
// FLOW CHANGE:
//   • checkClockInGeofence() checks GPS + coordinates ONLY.
//   • Network (WiFi/IP) check moved to confirm-time in each ConfirmScreen.
//   • NetworkWarningBanner removed from main screen (no pre-flight network UI).
// ─────────────────────────────────────────────────────────────────────────────
/* eslint-disable curly */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useRef, useCallback} from 'react';
import {useSelector} from 'react-redux';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  DeviceEventEmitter,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {useGeofence} from '../GeofenceContext';
import useLocation from '../../../hooks/useLocation';
import LocationPickerModal from '../LocationPickerModal';
import NavigationFAB from '../NavigationFAB';
import ConfirmClockInScreen from './ConfirmClockInScreen';
import ConfirmBreakScreen from './ConfirmBreakScreen';
import ConfirmClockOutScreen from './ConfirmClockOutScreen';
import QRScannerModal, {
  isQRCodeActive,
  isFaceRecognitionActive,
} from '../QRScannerModal';
import FaceVerificationModal from '../FaceVerificationModal';
import {getActionFence, ACTION_TYPES} from './attendanceActionHelpers';
import {
  loadRecords,
  formatElapsed,
  formatTime,
  formatDateShort,
  canClockIn,
  canStartBreak,
  canEndBreak,
  canClockOut,
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
import {C, R, Sh} from '../theme';
import useAttendanceNotificationAction from '../../../hooks/useAttendanceNotificationAction';
import {ValidateQRCode} from '../../../API/AttendanceManagement/ValidateQRCode';
import {initSyncListener} from '../../../services/AttendanceManagement/SyncManager';
import DeviceInfo from 'react-native-device-info';

// ─────────────────────────────────────────────────────────────────────────────
// Status card
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  out: {
    label: 'Not Clocked In',
    color: C.inkMuted,
    pillBg: C.surfaceAlt,
    dot: C.inkFaint,
  },
  in: {
    label: 'Clocked In',
    color: C.greenDark,
    pillBg: C.greenLight,
    dot: C.greenMid,
  },
  break: {
    label: 'On Break',
    color: C.purpleDark,
    pillBg: C.purpleLight,
    dot: C.purple,
  },
};

const StatusCard = ({status, elapsed, clockInTime, lastOut}) => {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.out;
  return (
    <View style={CS.card}>
      <View style={[CS.pill, {backgroundColor: cfg.pillBg}]}>
        <View style={[CS.pillDot, {backgroundColor: cfg.dot}]} />
        <Text style={[CS.pillTxt, {color: cfg.color}]}>{cfg.label}</Text>
      </View>
      {status === 'in' && (
        <Text style={CS.elapsed}>{formatElapsed(elapsed)}</Text>
      )}
      {status === 'break' && (
        <Text style={[CS.elapsed, {color: C.purple}]}>On Break ☕</Text>
      )}
      {status === 'out' && (
        <Text style={CS.idleMsg}>
          {lastOut ? `Last out  ${formatTime(lastOut)}` : 'Ready to clock in'}
        </Text>
      )}
      {status === 'in' && clockInTime && (
        <Text style={CS.since}>
          Since {formatTime(clockInTime)} · {formatDateShort(clockInTime)}
        </Text>
      )}
    </View>
  );
};

const CS = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: R.lg,
    padding: 22,
    ...Sh.sm,
    borderWidth: 1,
    borderColor: C.border,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: R.full,
    gap: 6,
    marginBottom: 14,
  },
  pillDot: {width: 7, height: 7, borderRadius: 4},
  pillTxt: {fontSize: 12, fontWeight: '600'},
  elapsed: {fontSize: 44, fontWeight: '800', color: C.ink, letterSpacing: -1.5},
  idleMsg: {fontSize: 20, fontWeight: '600', color: C.inkMuted},
  since: {fontSize: 13, color: C.inkMuted, marginTop: 6},
});

// ─────────────────────────────────────────────────────────────────────────────
// Location strip
// ─────────────────────────────────────────────────────────────────────────────
const LocationStrip = ({
  matchedFence,
  locationLoading,
  locationError,
  onPress,
}) => {
  if (locationLoading) {
    return (
      <View style={[LS.strip, LS.stripLoading]}>
        <ActivityIndicator size="small" color={C.blue} />
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
      <View style={[LS.dot, {backgroundColor: ok ? C.greenMid : C.redMid}]} />
      <View style={LS.body}>
        <Text style={[LS.label, {color: ok ? C.greenDark : C.redDark}]}>
          AUTHORISED LOCATION
        </Text>
        <Text
          style={[LS.value, {color: ok ? C.greenDark : C.redDark}]}
          numberOfLines={1}>
          {ok
            ? matchedFence.FenceName
            : locationError ?? 'Outside all authorised zones'}
        </Text>
      </View>
      <Text style={[LS.arrow, {color: ok ? C.greenDark : C.redDark}]}>›</Text>
    </TouchableOpacity>
  );
};

const LS = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: R.sm,
    borderWidth: 1,
  },
  stripLoading: {backgroundColor: C.blueLight, borderColor: C.blueLight},
  stripOk: {backgroundColor: C.greenLight, borderColor: C.greenMid},
  stripBad: {backgroundColor: C.redLight, borderColor: C.redMid},
  loadingTxt: {fontSize: 13, color: C.blue, fontWeight: '500'},
  dot: {width: 8, height: 8, borderRadius: 4},
  body: {flex: 1},
  label: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  value: {fontSize: 13, fontWeight: '600'},
  arrow: {fontSize: 18},
});

// ─────────────────────────────────────────────────────────────────────────────
// Spoofing banner
// ─────────────────────────────────────────────────────────────────────────────
const SPOOF_LABELS = {
  mock_flag: 'Mock location app detected',
  accuracy_too_perfect: 'Suspiciously perfect GPS accuracy',
  impossible_speed: 'Impossible movement speed detected',
  stale_fix: 'GPS fix is too old',
  position_jump: 'Sudden location jump detected',
  rooted_device: 'Device appears to be rooted or jailbroken',
  emulator: 'Cannot run attendance from an emulator',
};

const SpoofingBanner = ({reason}) => (
  <View style={SB.wrap}>
    <Text style={SB.icon}>⚠️</Text>
    <View style={{flex: 1}}>
      <Text style={SB.title}>GPS Integrity Warning</Text>
      <Text style={SB.sub}>
        {SPOOF_LABELS[reason] ?? 'Suspicious GPS activity detected'}
      </Text>
    </View>
  </View>
);

const SB = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: R.sm,
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  icon: {fontSize: 18},
  title: {fontSize: 13, fontWeight: '700', color: '#856404'},
  sub: {fontSize: 12, color: '#856404', marginTop: 2},
});

// NetworkWarningBanner removed — network check now happens at confirm-time
// in ConfirmClockInScreen / ConfirmClockOutScreen / ConfirmBreakScreen.

// ─────────────────────────────────────────────────────────────────────────────
// Notification source banner
// ─────────────────────────────────────────────────────────────────────────────
const NotificationActionBanner = ({action, onDismiss}) => {
  const messages = {
    break_start: '☕  Break started from notification',
    break_end: '▶  Break ended from notification',
    clock_out: '■  Clocked out from notification',
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

const NB = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: R.sm,
    backgroundColor: C.blueLight,
    borderWidth: 1,
    borderColor: C.blueMid,
  },
  txt: {fontSize: 13, color: C.blueDark, fontWeight: '500', flex: 1},
  dismiss: {fontSize: 14, color: C.blueDark, fontWeight: '700'},
});

// ─────────────────────────────────────────────────────────────────────────────
// Action buttons
// ─────────────────────────────────────────────────────────────────────────────
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
  // Clock-in disabled if: loading, no fence, or spoofing detected
  // Network check happens at confirm-time — not here
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
            {backgroundColor: C.greenMid},
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
              {backgroundColor: C.purple},
              breakDisabled && AB.disabled,
            ]}
            onPress={onBreakStart}
            disabled={breakDisabled}>
            <Text style={AB.txt}>☕ Start Break</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              AB.btn,
              {backgroundColor: C.redMid},
              clockOutDisabled && AB.disabled,
            ]}
            onPress={onClockOut}
            disabled={clockOutDisabled}>
            <Text style={AB.txt}>■ Clock Out</Text>
          </TouchableOpacity>
        </>
      )}
      {status === 'break' && (
        <TouchableOpacity
          style={[
            AB.btn,
            {backgroundColor: C.amber},
            breakEndDisabled && AB.disabled,
          ]}
          onPress={onBreakEnd}
          disabled={breakEndDisabled}>
          <Text style={AB.txt}>▶ End Break</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const AB = StyleSheet.create({
  wrap: {paddingHorizontal: 16, paddingBottom: 8, gap: 10},
  btn: {
    borderRadius: R.full,
    paddingVertical: 17,
    alignItems: 'center',
    ...Sh.md,
  },
  disabled: {opacity: 0.45},
  txt: {color: C.white, fontSize: 16, fontWeight: '700'},
});

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
const TimeClockScreen = ({onNavigate}) => {
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
  const [workflowFlags, setWorkflowFlags] = useState({
    canIn: true,
    canBreak: false,
    canBreakEnd: false,
    canOut: false,
  });

  // ── Pre-action Face & QR state ─────────────────────────────────────────────
  // Face / QR is scanned BEFORE the confirm screen opens.
  const [pendingAction, setPendingAction] = useState(null); // 'confirmIn' | 'confirmOut' | 'confirmBreak' | 'confirmBreakEnd'
  const [preFaceModalVisible, setPreFaceModalVisible] = useState(false);
  const [preFaceResult, setPreFaceResult] = useState(null); // { verified: boolean }
  const [preQrModalVisible, setPreQrModalVisible] = useState(false);
  const [preQrFence, setPreQrFence] = useState(null);
  const [preQrValue, setPreQrValue] = useState(null); // the scanned value carried into the confirm screen

  const actionInProgress = useRef(false);
  const preQrFenceRef = useRef(null);
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
      case 'OPEN_TIMECLOCK':
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

  const {collectAttendanceData, spoofingDetected, spoofingReason} =
    useLocation();

  const syncStateFromStorage = useCallback(async () => {
    const records = await loadRecords({person});
    setWorkflowFlags({
      canIn: canClockIn(records),
      canBreak: canStartBreak(records),
      canBreakEnd: canEndBreak(records),
      canOut: canClockOut(records),
    });
    if (!records.length) return;
    const last = records[records.length - 1];
    if (last.clockOut) {
      setLastOut(last.clockOut);
      setStatus('out');
    } else if (last.breaks?.length) {
      const lastBreak = last.breaks[last.breaks.length - 1];
      if (lastBreak.breakStart && !lastBreak.breakEnd) {
        setStatus('break');
        setClockInTime(last.clockIn);
      } else {
        setStatus('in');
        setClockInTime(last.clockIn);
        setElapsed(
          Math.floor((Date.now() - new Date(last.clockIn).getTime()) / 1000),
        );
      }
    } else if (last.clockIn && !last.clockOut) {
      setStatus('in');
      setClockInTime(last.clockIn);
      setElapsed(
        Math.floor((Date.now() - new Date(last.clockIn).getTime()) / 1000),
      );
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

  // ── Mount ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      initSyncListener();
      await syncStateFromStorage();
      const savedFS = await loadPersistedFSState();
      if (savedFS?.isRunning) {
        await resumeAttendanceService(savedFS);
        console.log('[TimeClockScreen] Foreground service resumed');
      }
    };
    init();
  }, [syncStateFromStorage]);

  // ── Elapsed timer ──────────────────────────────────────────────────────────
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

  // ── DeviceEventEmitter: notification button actions ───────────────────────
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

  // ── Guards ─────────────────────────────────────────────────────────────────
  // Shared spoof + permission check for any action.
  const checkCommonIntegrity = (requireFence = false) => {
    if (locationLoading) {
      Alert.alert(
        '⏳ Please Wait',
        'Location is still being verified. Try again in a moment.',
      );
      return false;
    }
    if (permissionStatus === 'denied') {
      Alert.alert(
        '📍 Permission Required',
        'Please enable location access in your device Settings.',
      );
      return false;
    }
    if (spoofingDetected) {
      Alert.alert(
        '🔍 GPS Integrity Issue',
        SPOOF_LABELS[spoofingReason] ?? 'Suspicious GPS detected.',
      );
      return false;
    }
    if (requireFence && !matchedFence) {
      Alert.alert(
        '📍 Location Check Failed',
        locationError ?? 'You are outside all authorised zones.',
      );
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

  // ── Face-first / QR-first action handler ───────────────────────────────────
  // Called by every action button. Checks integrity, refreshes fence data,
  // then opens Face/QR gates sequentially or goes straight to the confirm screen.
  const handleActionPress = useCallback(
    async actionKey => {
      if (actionInProgress.current) return;

      // Require fence only for Clock In
      const needsFence = actionKey === 'confirmIn';
      if (!checkCommonIntegrity(needsFence)) return;

      actionInProgress.current = true;
      setIsProcessing(true);
      try {
        // ── Emulator hard-block ──────────────────────────────────────────
        // Runs before any face modal or confirm screen can open.
        // DeviceInfo.isEmulator() is async — we await it here so the user
        // sees an immediate, blocking alert instead of a passive banner.
        const runningOnEmulator = await DeviceInfo.isEmulator();
        if (runningOnEmulator) {
          Alert.alert(
            '⛔ Device Not Supported',
            'Attendance actions cannot be performed from an emulator or ' +
              'virtual device. Please use a physical Android/iOS device.',
            [{text: 'OK', style: 'default'}],
          );
          return;
        }

        // Always get fresh fence + flags from server
        const latestState = await refresh();
        const actionTypeMap = {
          confirmIn:       ACTION_TYPES.CLOCK_IN,
          confirmOut:      ACTION_TYPES.CLOCK_OUT,
          confirmBreak:    ACTION_TYPES.BREAK_START,
          confirmBreakEnd: ACTION_TYPES.BREAK_END,
        };
        const fence = getActionFence({
          actionType: actionTypeMap[actionKey],
          matchedFence: latestState?.matchedFence ?? matchedFence,
          clockInFence,
        });

        preQrFenceRef.current = fence;
        console.log('🔍 preQrFenceRef set to:', JSON.stringify(fence, null, 2));
        setPendingAction(actionKey);
        setPreQrFence(fence);
        setPreQrValue(null);
        setPreFaceResult(null);

        // Sequence: Face → QR → Confirm Screen
        if (isFaceRecognitionActive(fence)) {
          setPreFaceModalVisible(true);
        } else if (isQRCodeActive(fence)) {
          setPreQrModalVisible(true);
        } else {
          setSubScreen(actionKey);
        }
      } catch (err) {
        Alert.alert(
          'Refresh Failed',
          err.message || 'Unable to verify location. Please try again.',
        );
      } finally {
        setIsProcessing(false);
        actionInProgress.current = false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      matchedFence,
      clockInFence,
      refresh,
      spoofingDetected,
      locationLoading,
      permissionStatus,
    ],
  );

  // ── Face Verification Gate ─────────────────────────────────────────────────
  const handlePreFaceSuccess = useCallback(
    result => {
      setPreFaceModalVisible(false);
      setPreFaceResult(result);

      // Check if we also need QR
      const fence = preQrFenceRef.current;
      if (isQRCodeActive(fence)) {
        // slight delay to let the modal fully close before opening next
        setTimeout(() => setPreQrModalVisible(true), 300);
      } else {
        setSubScreen(pendingAction);
      }
    },
    [pendingAction],
  );

  const handlePreFaceCancel = useCallback(() => {
    setPreFaceModalVisible(false);
    setPendingAction(null);
    setPreQrFence(null);
    setPreQrValue(null);
    setPreFaceResult(null);
  }, []);

  // ── QR Code Gate ───────────────────────────────────────────────────────────
  // Called when the pre-action QR scanner successfully scans a code.
  const handlePreQrSuccess = useCallback(
    async rawValue => {
      setPreQrModalVisible(false);
      setIsProcessing(true);

      try {
        const fence = preQrFenceRef.current;
        console.log('🔍 fence from ref:', JSON.stringify(fence, null, 2));
        const geoFenceID = String(fence?.GeoFenceID ?? '');
        console.log('🔍 geoFenceID:', geoFenceID);
        const qrString =
          rawValue && typeof rawValue === 'object' ? rawValue.value : rawValue;

        const validationResult = await ValidateQRCode({
          qrImage: qrString,
          geoFenceID,
        });

        // API returns 1 for valid, 0 for invalid
        if (!validationResult || validationResult === 0) {
          Alert.alert(
            '❌ Invalid QR Code',
            'This QR code is not valid for this location. Please scan the correct attendance QR code.',
          );
          return; // Stay on main screen, do not navigate
        }

        // QR is valid — proceed to confirm screen
        setPreQrValue(rawValue);
        setSubScreen(pendingAction);
      } catch (err) {
        Alert.alert(
          'QR Validation Failed',
          err.message || 'Unable to validate QR code. Please try again.',
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [pendingAction],
  );

  const handlePreQrCancel = useCallback(() => {
    setPreQrModalVisible(false);
    setPendingAction(null);
    setPreQrFence(null);
    setPreQrValue(null);
  }, []);

  // ── Clock In ────────────────────────────────────────────────────────────────
  const handleClockIn = useCallback(
    async (note, qrValue = null) => {
      await guardedAction(async () => {
        if (qrValue) console.log('🔐 Clock In QR payload:', qrValue);
        const now = new Date().toISOString();

        // Record the fence for subsequent break/clock-out actions
        recordClockInFence(matchedFence);
        setClockInTime(now);
        setElapsed(0);
        setStatus('in');
        setSubScreen('main');

        await startAttendanceService(now);
        // Re-sync from server/queue to get the latest authoritative state
        await syncStateFromStorage();
      });
    },
    [matchedFence, recordClockInFence, syncStateFromStorage, guardedAction],
  );

  // ── Break Start ─────────────────────────────────────────────────────────────
  // G7 policy: no WiFi check for breaks
  const handleBreakStart = useCallback(
    async (note, qrValue = null) => {
      await guardedAction(async () => {
        if (qrValue) console.log('🔐 Break Start QR payload:', qrValue);
        const now = new Date().toISOString();

        setStatus('break');
        setSubScreen('main');

        await markBreakStarted(now);
        await syncStateFromStorage();
      });
    },
    [syncStateFromStorage, guardedAction],
  );

  // ── Break End ───────────────────────────────────────────────────────────────
  const handleBreakEnd = useCallback(
    async (note = '', qrValue = null) => {
      await guardedAction(async () => {
        setIsProcessing(true);
        try {
          if (qrValue) console.log('🔐 Break End QR payload:', qrValue);

          setStatus('in');
          setSubScreen('main');

          await markBreakEnded();
          await syncStateFromStorage();
        } finally {
          setIsProcessing(false);
        }
      });
    },
    [syncStateFromStorage, guardedAction],
  );

  // ── Clock Out ─────────────────────────────────────────────────────────────────
  const handleClockOut = useCallback(
    async (note, endWorkDay, qrValue = null) => {
      await guardedAction(async () => {
        if (qrValue) console.log('🔐 Clock Out QR payload:', qrValue);
        const now = new Date().toISOString();

        setLastOut(now);
        setClockInTime(null);
        setElapsed(0);
        setStatus('out');
        setSubScreen('main');

        await stopAttendanceService();
        await syncStateFromStorage();
      });
    },
    [syncStateFromStorage, guardedAction],
  );

  // ── Sub-screen routing ─────────────────────────────────────────────────────
  if (subScreen === 'confirmIn')
    return (
      <ConfirmClockInScreen
        lastOut={lastOut}
        initialQrValue={preQrValue}
        initialFaceResult={preFaceResult}
        onConfirm={handleClockIn}
        onBack={() => setSubScreen('main')}
      />
    );
  if (subScreen === 'confirmBreak')
    return (
      <ConfirmBreakScreen
        breakType="BREAK_START"
        initialQrValue={preQrValue}
        initialFaceResult={preFaceResult}
        onConfirm={handleBreakStart}
        onBack={() => setSubScreen('main')}
      />
    );
  if (subScreen === 'confirmBreakEnd')
    return (
      <ConfirmBreakScreen
        breakType="BREAK_END"
        initialQrValue={preQrValue}
        initialFaceResult={preFaceResult}
        onConfirm={handleBreakEnd}
        onBack={() => setSubScreen('main')}
      />
    );
  if (subScreen === 'confirmOut')
    return (
      <ConfirmClockOutScreen
        initialQrValue={preQrValue}
        initialFaceResult={preFaceResult}
        onConfirm={handleClockOut}
        onBack={() => setSubScreen('main')}
      />
    );

  return (
    <SafeAreaView style={S.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <View style={{height: Platform.OS === 'android' ? 8 : 0}} />

      {isProcessing && (
        <View style={S.processingOverlay}>
          <View style={S.processingContainer}>
            <ActivityIndicator size="large" color={C.blue} />
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
            tintColor={C.blue}
            colors={[C.blue]}
          />
        }
        showsVerticalScrollIndicator={false}>
        <StatusCard
          status={status}
          elapsed={elapsed}
          clockInTime={clockInTime}
          lastOut={lastOut}
        />

        {notifAction && (
          <NotificationActionBanner
            action={notifAction}
            onDismiss={() => setNotifAction(null)}
          />
        )}

        {spoofingDetected && <SpoofingBanner reason={spoofingReason} />}

        <LocationStrip
          matchedFence={matchedFence}
          locationLoading={locationLoading}
          locationError={locationError}
          onPress={() => setModalVisible(true)}
        />

        {/* Spacer pushes buttons to bottom when content is short */}
        <View style={{flex: 1, minHeight: 40}} />

        {/* Action buttons INSIDE the scroll view so pull-to-refresh
          works from anywhere on screen */}
        <ActionButtons
          status={status}
          locationLoading={locationLoading}
          matchedFence={matchedFence}
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

      <NavigationFAB activeScreen="TimeClock" onNavigate={onNavigate} />
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
        onFailure={reason => {
          Alert.alert('Verification Failed', 'Could not verify your identity.');
          handlePreFaceCancel();
        }}
        onCancel={handlePreFaceCancel}
      />
      <QRScannerModal
        visible={preQrModalVisible}
        eventLabel={
          pendingAction === 'confirmIn'
            ? 'CLOCK_IN'
            : pendingAction === 'confirmOut'
            ? 'CLOCK_OUT'
            : pendingAction === 'confirmBreak'
            ? 'BREAK_START'
            : 'BREAK_END'
        }
        fenceName={preQrFence?.FenceName}
        onScanSuccess={handlePreQrSuccess}
        onCancel={handlePreQrCancel}
      />
    </SafeAreaView>
  );
};

export default TimeClockScreen;

const S = StyleSheet.create({
  screen: {flex: 1, backgroundColor: C.bg},
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(240,244,248,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  processingContainer: {
    alignItems: 'center',
    backgroundColor: C.surface,
    paddingHorizontal: 40,
    paddingVertical: 32,
    borderRadius: R.lg,
    gap: 14,
    ...Sh.lg,
  },
  processingText: {fontSize: 15, color: C.inkSub, fontWeight: '600'},
  scrollContent: {flexGrow: 1, paddingBottom: 100},
});
