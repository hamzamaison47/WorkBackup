import AsyncStorage from '@react-native-async-storage/async-storage';
import EncryptedStorage from 'react-native-encrypted-storage';

import {store, persistor} from '../store';
import {resetAppState} from '../store/rootReducer';
import {
  setSkipLoginAfterRestart,
  setAppRestarting,
} from '../store/slices/languageSlice';
import {apiCache} from '../utils/apiCache';
import {clearAIServiceToken} from '../services/AzureAuthService';
import firebaseService from '../store/FirebaseService';
import {resetAttendanceServiceState} from '../services/AttendanceManagement/AttendanceForegroundService';
import {SYNC_QUEUE_KEY} from '../services/AttendanceManagement/SyncManager';

/**
 * Attendance state written straight to AsyncStorage, bypassing Redux.
 *
 * These are private consts in their own modules, so the list is duplicated
 * here rather than imported — importing GEOF_KEY et al. from
 * screens/Attendance/CreateAttendanceScreen would drag a whole screen
 * component graph into teardown. Keep in sync with:
 *
 *   @attendance_location        hooks/useLocation.js:13
 *   @attendance_last_coords     hooks/useLocation.js:14
 *   @attendance_clock_in_fence  components/AttendanceManagement/GeofenceContext.js:24
 *   @fs_attendance_state        services/AttendanceManagement/AttendanceForegroundService.js:22
 *   @fs_action_debounce         services/AttendanceManagement/AttendanceHeadlessTask.js:24
 *   df_geofences_v1             screens/Attendance/CreateAttendanceScreen.js:45
 *   offline_attendance_queue    screens/Attendance/CreateAttendanceScreen.js:46
 *   failed_attendance_queue     screens/Attendance/CreateAttendanceScreen.js:47
 */
const ATTENDANCE_STORAGE_KEYS = [
  '@attendance_location',
  '@attendance_last_coords',
  '@attendance_clock_in_fence',
  '@fs_attendance_state',
  '@fs_action_debounce',
  'df_geofences_v1',
  'offline_attendance_queue',
  'failed_attendance_queue',
];

/**
 * Runs one teardown step, swallowing (but reporting) its failure.
 *
 * Every step is isolated because this function is the last thing standing
 * between two users on a shared device: a Keychain hiccup in step 3 must not
 * be able to skip the Redux wipe in step 7. Previously a single throw
 * (`dispatch is not a function`) aborted the entire logout silently.
 */
const step = async (name, fn) => {
  try {
    await fn();
    return true;
  } catch (error) {
    console.error(`[clearSession] step "${name}" failed:`, error);
    return false;
  }
};

/**
 * clearSession — the single teardown for logout, login and cold start.
 *
 * Wipes everything that belongs to a user session: Redux (via
 * RESET_APP_STATE, which preserves only biometric enrolment and device
 * preferences), the in-memory caches, and the attendance state held outside
 * Redux.
 *
 * Deliberately NOT cleared:
 *   • Keychain tenant/client config (Controller/secureConfig.js)
 *   • Keychain biometric credentials (store/utils/biometricUtils.js)
 *
 * Never throws. Returns a per-step result so callers can log or assert on it.
 */
export const clearSession = async () => {
  const results = {};

  results.apiCache = await step('apiCache', () => apiCache.clear());

  results.aiToken = await step('aiServiceToken', () => clearAIServiceToken());

  results.firebase = await step('firebase', () => firebaseService.cleanup());

  results.attendanceService = await step('attendanceService', () =>
    resetAttendanceServiceState(),
  );

  results.attendanceStorage = await step('attendanceStorage', () =>
    AsyncStorage.multiRemove(ATTENDANCE_STORAGE_KEYS),
  );

  results.syncQueue = await step('syncQueue', () =>
    EncryptedStorage.removeItem(SYNC_QUEUE_KEY),
  );

  // The Redux wipe comes after the caches so nothing can read a live store
  // and write a stale value back into it mid-teardown.
  results.redux = await step('redux', () => store.dispatch(resetAppState()));

  // `language` is preserved, but two of its fields are transient navigation
  // flags rather than device preferences, and a stuck `skipLoginAfterRestart`
  // makes the next cold start try to resume a session that no longer exists.
  // Reset just those two. FLAGGED FOR REVIEW — see Phase 3 notes.
  results.languageFlags = await step('languageFlags', () => {
    store.dispatch(setSkipLoginAfterRestart(false));
    store.dispatch(setAppRestarting(false));
  });

  // Force the reset state to disk immediately. Without this the cleared store
  // is only written on redux-persist's next throttled tick, so a process kill
  // between logout and that tick leaves the previous user's blob on disk.
  results.flush = await step('persistFlush', () => persistor.flush());

  return results;
};

export default clearSession;
