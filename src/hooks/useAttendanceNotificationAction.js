/* eslint-disable curly */
// ─────────────────────────────────────────────────────────────────────────────
// hooks/useAttendanceNotificationAction.js
//
// Drop this hook into TimeClockScreen (or any parent screen).
// It handles both scenarios:
//
//   A) Cold start  — app was killed, user tapped a notification button
//      → reads via NativeModules.AttendanceIntent.getInitialAction()
//
//   B) Warm/foreground — app is running, user tapped a notification button
//      → listens to DeviceEventEmitter 'AttendanceNotificationAction'
//
// In both cases it calls onAction(action) with one of:
//   'OPEN_TIMECLOCK' | 'START_BREAK' | 'END_BREAK' | 'CLOCK_OUT'
//
// Usage in TimeClockScreen:
//
//   useAttendanceNotificationAction(action => {
//     if (action === 'CLOCK_OUT')   setSubScreen('confirmOut');
//     if (action === 'START_BREAK') setSubScreen('confirmBreak');
//     if (action === 'END_BREAK')   setSubScreen('confirmBreakEnd');
//     // 'OPEN_TIMECLOCK' → just stay on main, no navigation needed
//   });
// ─────────────────────────────────────────────────────────────────────────────
import {useEffect} from 'react';
import {DeviceEventEmitter, NativeModules, Platform} from 'react-native';

const {AttendanceIntent} = NativeModules;
const NATIVE_EVENT = 'AttendanceNotificationAction';

/**
 * @param {(action: string) => void} onAction  called with the action string
 * @param {any[]} deps  extra deps to re-register the listener (usually [])
 */
const useAttendanceNotificationAction = (onAction, deps = []) => {
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    // ── A) Cold start: read the intent extra that launched the app ────────────
    if (AttendanceIntent?.getInitialAction) {
      AttendanceIntent.getInitialAction()
        .then(action => {
          if (action) {
            console.log('[NotificationNav] Cold-start action:', action);
            onAction(action);
          }
        })
        .catch(err =>
          console.warn('[NotificationNav] getInitialAction error:', err),
        );
    }

    // ── B) Warm / foreground: listen for new intent events ───────────────────
    const subscription = DeviceEventEmitter.addListener(
      NATIVE_EVENT,
      ({action}) => {
        if (action) {
          console.log('[NotificationNav] Foreground action:', action);
          onAction(action);
        }
      },
    );

    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

export default useAttendanceNotificationAction;
