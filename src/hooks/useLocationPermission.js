// ─────────────────────────────────────────────
// hooks/useLocationPermission.js
//
// Tracks the OS location permission and lets the UI ask for it.
// Never prompts on its own — the screen decides when to ask.
// ─────────────────────────────────────────────
import {useCallback, useEffect, useRef, useState} from 'react';
import {AppState, Linking, PermissionsAndroid, Platform} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {getFreshPositionWithTimeout} from './useLocation';

export const LOCATION_PERMISSION = {
  UNKNOWN: 'unknown', // first check not finished yet
  GRANTED: 'granted',
  DENIED: 'denied', // can still be asked from inside the app
  BLOCKED: 'blocked', // system won't prompt again — only Settings can fix it
};

const FINE = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;

// Silent check — never shows a system dialog.
const checkPermission = async () => {
  if (Platform.OS === 'android') {
    const ok = await PermissionsAndroid.check(FINE);
    return ok ? LOCATION_PERMISSION.GRANTED : LOCATION_PERMISSION.DENIED;
  }
  // iOS: @react-native-community/geolocation has no status API, so probe
  // with a cheap read (same approach useLocation already uses).
  try {
    await getFreshPositionWithTimeout({
      enableHighAccuracy: false,
      timeout: 3000,
      maximumAge: 60000,
    });
    return LOCATION_PERMISSION.GRANTED;
  } catch (e) {
    // code 1 = PERMISSION_DENIED. Timeout/unavailable means permission is
    // fine and GPS is just slow.
    return e?.code === 1
      ? LOCATION_PERMISSION.DENIED
      : LOCATION_PERMISSION.GRANTED;
  }
};

// Shows the system dialog when the OS still allows it.
const requestPermission = async () => {
  if (Platform.OS === 'android') {
    const res = await PermissionsAndroid.request(FINE, {
      title: 'Location Permission',
      message: 'Attendance tracking needs your location.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    });
    if (res === PermissionsAndroid.RESULTS.GRANTED)
      return LOCATION_PERMISSION.GRANTED;
    if (res === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN)
      return LOCATION_PERMISSION.BLOCKED;
    return LOCATION_PERMISSION.DENIED;
  }

  // iOS shows its prompt only once. If we're still not granted after asking,
  // Settings is the only way forward.
  await new Promise(resolve =>
    Geolocation.requestAuthorization(resolve, resolve),
  );
  const after = await checkPermission();
  return after === LOCATION_PERMISSION.GRANTED
    ? LOCATION_PERMISSION.GRANTED
    : LOCATION_PERMISSION.BLOCKED;
};

const useLocationPermission = () => {
  const [status, setStatus] = useState(LOCATION_PERMISSION.UNKNOWN);
  const [asking, setAsking] = useState(false);
  const askingRef = useRef(false);
  const deniedCountRef = useRef(0);

  const refreshStatus = useCallback(async () => {
    const next = await checkPermission();
    // A silent check can't tell DENIED from BLOCKED on Android, so don't
    // downgrade a known BLOCKED just because it's still not granted.
    setStatus(prev =>
      prev === LOCATION_PERMISSION.BLOCKED &&
      next === LOCATION_PERMISSION.DENIED
        ? prev
        : next,
    );
    return next;
  }, []);

  // Initial check, plus a re-check whenever the app returns to the foreground
  // (covers the user toggling permission in system Settings).
  useEffect(() => {
    refreshStatus().catch(() => {});
    const sub = AppState.addEventListener('change', s => {
      if (s === 'active') refreshStatus().catch(() => {});
    });
    return () => sub.remove();
  }, [refreshStatus]);

  const ask = useCallback(async () => {
    if (askingRef.current) return status;
    askingRef.current = true;
    setAsking(true);
    try {
      // iOS can't re-prompt once decided, and Android can't once blocked.
      // Either way, go straight to Settings.
      if (
        status === LOCATION_PERMISSION.BLOCKED ||
        (Platform.OS === 'ios' && status === LOCATION_PERMISSION.DENIED)
      ) {
        setStatus(LOCATION_PERMISSION.BLOCKED);
        await Linking.openSettings();
        return LOCATION_PERMISSION.BLOCKED;
      }

      const startedAt = Date.now();
      let next = await requestPermission();
      const elapsed = Date.now() - startedAt;

      if (next === LOCATION_PERMISSION.DENIED) {
        deniedCountRef.current += 1;
        if (elapsed < 500 || deniedCountRef.current >= 2) {
          next = LOCATION_PERMISSION.BLOCKED;
        }
      }

      setStatus(next);

      if (next === LOCATION_PERMISSION.BLOCKED) {
        await Linking.openSettings();
      }
      return next;
    } catch {
      return status;
    } finally {
      askingRef.current = false;
      setAsking(false);
    }
  }, [status]);

  return {
    status,
    isGranted: status === LOCATION_PERMISSION.GRANTED,
    needsSettings: status === LOCATION_PERMISSION.BLOCKED,
    asking,
    ask,
    refreshStatus,
  };
};

export default useLocationPermission;
