/* eslint-disable curly */
// ─────────────────────────────────────────────────────────────────────────────
// src/services/AttendanceForegroundService.js
//
// JS-side wrapper around the native AttendanceService NativeModule.
// Replaces the @supersami/rn-foreground-service approach entirely.
//
// The actual foreground service, timer tick, and notification updates all
// run natively in AttendanceForegroundService.java.
// This file is responsible for:
//   • Calling NativeModules.AttendanceService.startService / stopService /
//     updateBreakState at the right moments
//   • Persisting state to AsyncStorage so the app can resume after a kill
//   • Providing loadPersistedFSState / clearPersistedFSState for TimeClockScreen
// ─────────────────────────────────────────────────────────────────────────────
import {NativeModules, Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {AttendanceService} = NativeModules;

// ── Storage key ───────────────────────────────────────────────────────────────
const FS_STATE_KEY = '@fs_attendance_state';

// ── Internal mirror of service state (for JS callers that need to query it) ──
let _isRunning = false;
let _clockInEpoch = 0;
let _breakStartEpoch = 0;
let _totalBreakMs = 0;
let _isOnBreak = false;

// ─────────────────────────────────────────────────────────────────────────────
// Persistence helpers
// ─────────────────────────────────────────────────────────────────────────────
export const loadPersistedFSState = async () => {
  try {
    const raw = await AsyncStorage.getItem(FS_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearPersistedFSState = async () => {
  try {
    await AsyncStorage.removeItem(FS_STATE_KEY);
  } catch {}
};

const persistState = async () => {
  try {
    await AsyncStorage.setItem(
      FS_STATE_KEY,
      JSON.stringify({
        isRunning: _isRunning,
        isOnBreak: _isOnBreak,
        clockInEpoch: _clockInEpoch,
        breakStartEpoch: _breakStartEpoch,
        totalBreakMs: _totalBreakMs,
      }),
    );
  } catch {}
};

// ─────────────────────────────────────────────────────────────────────────────
// Guard: log a clear error if the native module is not linked
// ─────────────────────────────────────────────────────────────────────────────
const checkNativeModule = () => {
  if (!AttendanceService) {
    console.error(
      '[AttendanceForegroundService] NativeModule "AttendanceService" is not available.\n' +
        'Make sure AttendanceServicePackage is registered in MainApplication.java\n' +
        'and that you have run a fresh `./gradlew clean assembleDebug`.',
    );
    return false;
  }
  return true;
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * startAttendanceService
 * Call immediately after a successful clock-in record is saved.
 *
 * @param {string|number} clockInTimestamp  ISO string or ms epoch
 */
export const startAttendanceService = async clockInTimestamp => {
  if (Platform.OS !== 'android') return; // iOS: no-op
  if (!checkNativeModule()) return;
  if (_isRunning) return; // idempotent guard

  _clockInEpoch =
    typeof clockInTimestamp === 'string'
      ? new Date(clockInTimestamp).getTime()
      : Number(clockInTimestamp);
  _breakStartEpoch = 0;
  _totalBreakMs = 0;
  _isOnBreak = false;
  _isRunning = true;

  await persistState();

  try {
    AttendanceService.startService(_clockInEpoch);
    if (__DEV__) {
      console.log(
        '[AttendanceForegroundService] Started — clock-in at',
        new Date(_clockInEpoch).toISOString(),
      );
    }
  } catch (err) {
    _isRunning = false;
    if (__DEV__) {
      console.error('[AttendanceForegroundService] startService failed:', err);
    }
  }
};

/**
 * markBreakStarted
 * Updates the notification to "On Break" state.
 *
 * @param {string|number} breakStartTimestamp
 */
export const markBreakStarted = async breakStartTimestamp => {
  if (Platform.OS !== 'android') return;
  if (!checkNativeModule() || !_isRunning) return;

  _breakStartEpoch =
    typeof breakStartTimestamp === 'string'
      ? new Date(breakStartTimestamp).getTime()
      : Number(breakStartTimestamp);
  _isOnBreak = true;

  await persistState();

  try {
    AttendanceService.updateBreakState(true, _breakStartEpoch, _totalBreakMs);
    if (__DEV__) {
      console.log('[AttendanceForegroundService] Break started');
    }
  } catch (err) {
    if (__DEV__) {
      console.error(
        '[AttendanceForegroundService] updateBreakState(true) failed:',
        err,
      );
    }
  }
};

/**
 * markBreakEnded
 * Reverts the notification back to the clocked-in timer.
 */
export const markBreakEnded = async () => {
  if (Platform.OS !== 'android') return;
  if (!checkNativeModule() || !_isRunning) return;

  if (_isOnBreak && _breakStartEpoch > 0) {
    _totalBreakMs += Date.now() - _breakStartEpoch;
  }

  _isOnBreak = false;
  _breakStartEpoch = 0;

  await persistState();

  try {
    AttendanceService.updateBreakState(false, 0, _totalBreakMs);
    if (__DEV__) {
      console.log(
        '[AttendanceForegroundService] Break ended, total breaks:',
        _totalBreakMs,
      );
    }
  } catch (err) {
    if (__DEV__) {
      console.error(
        '[AttendanceForegroundService] updateBreakState(false) failed:',
        err,
      );
    }
  }
};

/**
 * stopAttendanceService
 * Call after a successful clock-out. Stops the service and dismisses the notification.
 */
export const stopAttendanceService = async () => {
  if (Platform.OS !== 'android') return;
  if (!checkNativeModule()) return;

  _isRunning = false;
  _isOnBreak = false;
  _clockInEpoch = 0;
  _breakStartEpoch = 0;
  _totalBreakMs = 0;

  await clearPersistedFSState();

  try {
    AttendanceService.stopService();
    if (__DEV__) {
      console.log('[AttendanceForegroundService] Stopped');
    }
  } catch (err) {
    if (__DEV__) {
      console.error('[AttendanceForegroundService] stopService failed:', err);
    }
  }
};

/**
 * resumeAttendanceService
 * Called on app mount when persisted FS state is found.
 * The native service is already running; we just restore JS-side state.
 *
 * @param {object} savedState  from loadPersistedFSState()
 */
export const resumeAttendanceService = async savedState => {
  if (!savedState?.isRunning) return;

  _clockInEpoch = savedState.clockInEpoch ?? 0;
  _breakStartEpoch = savedState.breakStartEpoch ?? 0;
  _totalBreakMs = savedState.totalBreakMs ?? 0;
  _isOnBreak = savedState.isOnBreak ?? false;
  _isRunning = true;

  // The native service is already running and ticking — nothing else needed.
  if (__DEV__) {
    console.log(
      '[AttendanceForegroundService] JS state resumed after app restart',
    );
  }
};

/**
 * resetAttendanceServiceState
 * Teardown entry point for logout / login / cold start — see
 * src/Controller/sessionUtils.js.
 *
 * Deliberately NOT stopAttendanceService(): that one returns early on iOS and
 * whenever the native module is missing, which would leave _isRunning and the
 * clock-in epoch describing the PREVIOUS user's shift in module memory. The
 * JS-side mirror is zeroed unconditionally here; the native stop is best-effort
 * on top of it.
 */
export const resetAttendanceServiceState = async () => {
  _isRunning = false;
  _isOnBreak = false;
  _clockInEpoch = 0;
  _breakStartEpoch = 0;
  _totalBreakMs = 0;

  await clearPersistedFSState();

  if (Platform.OS === 'android' && AttendanceService) {
    try {
      AttendanceService.stopService();
    } catch (err) {
      if (__DEV__) {
        console.error(
          '[AttendanceForegroundService] stopService during reset failed:',
          err,
        );
      }
    }
  }
};

/**
 * isServiceRunning — synchronous status check
 */
export const isServiceRunning = () => _isRunning;

export const getTotalBreakMs = () => _totalBreakMs;
