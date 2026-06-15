/* eslint-disable curly */
// ─────────────────────────────────────────────────────────────────────────────
// src/services/AttendanceHeadlessTask.js
//
// Two responsibilities:
//
// 1. HEADLESS TASK (registered in index.js as 'AttendanceAction')
//    Executed by AttendanceHeadlessTaskService.java when the app is KILLED
//    and the user taps a notification button.
//    Calls enqueueAttendance so the punch is synced to the server.
//    Emits DeviceEventEmitter so the app can sync when it relaunches.
//
// 2. FOREGROUND LISTENER SETUP (setupNotificationActionListener)
//    Called once from TimeClockScreen on mount.
//    Listens for 'AttendanceNotificationAction' events emitted by
//    AttendanceActionReceiver.java when the app IS running.
//    This keeps the in-app UI in sync with notification button taps.
// ─────────────────────────────────────────────────────────────────────────────
import AsyncStorage from '@react-native-async-storage/async-storage';
import {DeviceEventEmitter} from 'react-native';
import {enqueueAttendance} from './SyncManager';

// ── Debounce key (unchanged) ──────────────────────────────────────────────────
const DEBOUNCE_KEY = '@fs_action_debounce';
const DEBOUNCE_MS = 2000;

// ── Event name emitted by AttendanceActionReceiver.java ───────────────────────
export const NATIVE_ACTION_EVENT = 'AttendanceNotificationAction';

// ── DeviceEventEmitter event names consumed by TimeClockScreen ────────────────
export const FS_EVENT_BREAK_START = 'fs:break_start';
export const FS_EVENT_BREAK_END = 'fs:break_end';
export const FS_EVENT_CLOCK_OUT = 'fs:clock_out';

// ─────────────────────────────────────────────────────────────────────────────
// GenerationType mapping (matches helpers.js)
// ─────────────────────────────────────────────────────────────────────────────
const GEN_TYPE = {
  ClockIn: 1,
  ClockOut: 2,
  StartBreak: 3,
  EndBreak: 4,
};

// ─────────────────────────────────────────────────────────────────────────────
// Debounce helper — prevents double-tap on notification buttons
// ─────────────────────────────────────────────────────────────────────────────
const checkDebounce = async action => {
  try {
    const raw = await AsyncStorage.getItem(DEBOUNCE_KEY);
    if (raw) {
      const {lastAction, lastTime} = JSON.parse(raw);
      if (lastAction === action && Date.now() - lastTime < DEBOUNCE_MS)
        return false;
    }
    await AsyncStorage.setItem(
      DEBOUNCE_KEY,
      JSON.stringify({lastAction: action, lastTime: Date.now()}),
    );
    return true;
  } catch {
    return true;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// processAction
//
// Maps the notification action string to a GenerationType integer and
// enqueues the punch via SyncManager. Does NOT touch local @attendance_records.
// ─────────────────────────────────────────────────────────────────────────────
export const processAction = async (action, context = {}) => {
  if (!action) return;

  const allowed = await checkDebounce(action);
  if (!allowed) {
    console.log('[AttendanceTask] Debounced duplicate action:', action);
    return;
  }

  const now = new Date().toISOString();

  // context may carry { fence, personRecId, networkContext, coords }
  // passed in from the foreground listener or notification data.
  const basePayload = {
    PunchDateTime: now,
    PersonRecId: context.personRecId ? Number(context.personRecId) : undefined,
    FenceName: context.fence?.FenceName,
    GeoFenceID: context.fence?.GeoFenceID,
    LocationCode: context.fence?.LocationCode,
    Latitude: context.coords?.latitude,
    Longitude: context.coords?.longitude,
    NetworkID: context.networkContext?.networkId,
    NetworkName: context.networkContext?.networkName,
    BSSID: context.networkContext?.bssid,
    QRImage: '',
  };

  // Strip undefined fields
  const payload = Object.fromEntries(
    Object.entries(basePayload).filter(
      ([, v]) => v !== undefined && v !== null,
    ),
  );

  switch (action) {
    case 'START_BREAK': {
      payload.GenerationType = GEN_TYPE.StartBreak;
      await enqueueAttendance(payload);
      DeviceEventEmitter.emit(FS_EVENT_BREAK_START, {breakStart: now});
      console.log('[AttendanceTask] Break start enqueued at', now);
      break;
    }

    case 'END_BREAK': {
      payload.GenerationType = GEN_TYPE.EndBreak;
      await enqueueAttendance(payload);
      DeviceEventEmitter.emit(FS_EVENT_BREAK_END, {breakEnd: now});
      console.log('[AttendanceTask] Break end enqueued at', now);
      break;
    }

    case 'CLOCK_OUT': {
      payload.GenerationType = GEN_TYPE.ClockOut;
      await enqueueAttendance(payload);
      DeviceEventEmitter.emit(FS_EVENT_CLOCK_OUT, {clockOut: now});
      console.log('[AttendanceTask] Clock out enqueued at', now);
      break;
    }

    default:
      console.warn('[AttendanceTask] Unknown action:', action);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. Headless Task — app is KILLED
// ─────────────────────────────────────────────────────────────────────────────
const AttendanceHeadlessTask = async taskData => {
  console.log('[HeadlessTask] Received:', taskData);
  // taskData.action is the string action key (e.g. 'START_BREAK')
  // taskData may also carry personRecId, fenceData, etc. from the notification payload
  await processAction(taskData?.action, {
    personRecId: taskData?.personRecId,
    fence: taskData?.fence,
    coords: taskData?.coords,
    networkContext: taskData?.networkContext,
  });
};

export default AttendanceHeadlessTask;

// ─────────────────────────────────────────────────────────────────────────────
// 2. Foreground listener — app IS running
//    Call once in TimeClockScreen useEffect. Returns cleanup function.
// ─────────────────────────────────────────────────────────────────────────────
export const setupNotificationActionListener = () => {
  const subscription = DeviceEventEmitter.addListener(
    NATIVE_ACTION_EVENT,
    async ({action, ...rest}) => {
      console.log(
        '[NotificationListener] Action from notification bar:',
        action,
      );
      await processAction(action, rest);
    },
  );
  return () => subscription.remove();
};
