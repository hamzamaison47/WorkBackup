// ─────────────────────────────────────────────
// components/AttendanceManagement/GeofenceContext.js
// ─────────────────────────────────────────────
/* eslint-disable curly */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {Platform, PermissionsAndroid, AppState} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {RetrieveByPerson} from '../../API/AttendanceManagement/RetrieveByPerson';
import {
  haversineDistance,
  getFreshPositionWithTimeout,
} from '../../hooks/useLocation';

const SOFT_BUFFER_METRES = 15;
const CLOCK_IN_FENCE_KEY = '@attendance_clock_in_fence';

// Watch is re-armed after a fatal/availability-lost error, but never more than
// once per this interval — prevents a dead provider from tight-looping restarts.
const WATCH_REARM_DELAY_MS = 3000;
const WATCH_OPTIONS = {
  enableHighAccuracy: true,
  distanceFilter: 10,
  interval: 5000, // Android only
  fastestInterval: 2000, // Android only
  timeout: 20000, // ← iOS required
  maximumAge: 10000, // ← iOS required
  useSignificantChanges: false, // ← iOS required
};

const isActiveFlag = val => {
  const s = String(val).trim().toLowerCase();
  return s === '1' || s === 'yes' || s === 'true';
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const fetchFreshCoords = async () => {
  try {
    const p = await getFreshPositionWithTimeout({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
    });
    return {
      latitude: p.coords.latitude,
      longitude: p.coords.longitude,
      accuracy: p.coords.accuracy,
      timestamp: p.timestamp,
    };
  } catch {
    try {
      const p = await getFreshPositionWithTimeout({
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 30000,
      });
      return {
        latitude: p.coords.latitude,
        longitude: p.coords.longitude,
        accuracy: p.coords.accuracy,
        timestamp: p.timestamp,
      };
    } catch {
      // P5.1 — one more short attempt after a brief pause. Right after an
      // app resume from background, the GPS radio is often mid cold-start on
      // both attempts above and settles within a few more seconds. This is
      // NOT called on every refresh — only reached when both normal attempts
      // already failed — so it doesn't add latency to the common case.
      try {
        await sleep(2000);
        const p = await getFreshPositionWithTimeout({
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 0,
        });
        return {
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
          accuracy: p.coords.accuracy,
          timestamp: p.timestamp,
        };
      } catch {
        return null;
      }
    }
  }
};

const normalizeNet = s =>
  String(s ?? '')
    .trim()
    .toLowerCase();

export const isUnknownSsid = ssid =>
  !ssid ||
  ssid === '<unknown ssid>' ||
  ssid === '0x' ||
  ssid === '"<unknown ssid>"';

// Android returns a placeholder MAC for BSSID (and iOS for missing perms) when
// Location permission is not granted / Location Services are off. A placeholder
// BSSID must never be treated as a real MAC — otherwise it either "matches"
// nothing (false mismatch) or, worse, could collide. Treat it as "unavailable".
export const isPlaceholderBssid = bssid => {
  const b = normalizeNet(bssid);
  return (
    b.length === 0 || b === '02:00:00:00:00:00' || b === '00:00:00:00:00:00'
  );
};

// A fence-side value counts as "configured" only if it is a non-empty string.
// Mirrors the [] guard historically used for BSSID so all checks agree on
// whether a signal is actually set on the fence entry.
const isConfiguredValue = v =>
  v != null &&
  !(Array.isArray(v) && v.length === 0) &&
  normalizeNet(v).length > 0;

// ─────────────────────────────────────────────
// checkNetworkMatch — SSID is authoritative; BSSID NEVER blocks
//
// Office WiFi here is multi-AP / roaming: a single SSID ("MAISON") is served by
// many access points, each with its own BSSID. AX stores only ONE AP's BSSID, so
// any employee associated with a different AP on the same network has a real but
// non-matching BSSID. BSSID equality is therefore useless as a blocking
// condition — it produces constant false rejections — and is demoted to an
// optional, log-only corroborator. It is REMOVED from every pass/fail decision.
//
// Rule:
//   • Empty allowed-networks list → validation skipped (PASS).
//   • For each allowed net: if the device SSID is real (not '<unknown ssid>' /
//     empty) AND equals net.NetworkName (case-insensitive) → MATCH. A BSSID
//     mismatch does NOT block; if BSSID also matches we just log 'BSSID+SSID'.
//   • If NOTHING matched by SSID AND the device SSID was unreadable, fall back
//     to public IP: device publicIp == an allowed net.NetworkID → MATCH.
//   • Else REJECT. A cleanly-read SSID that matches no allowed name is REJECTED
//     WITHOUT consulting public IP (preserves the MAISON-5G reject).
//
// Returns: {networkRequired, networkMatched, networkFailReason, matchedSignal,
//   matchedNetwork}. matchedSignal ∈ 'SSID' | 'BSSID+SSID' | 'NetworkID-fallback'.
// ─────────────────────────────────────────────
export const checkNetworkMatch = (
  fenceNetworks,
  wifiSsid,
  wifiBssid,
  isWifi,
  publicIp = null,
) => {
  if (!fenceNetworks || fenceNetworks.length === 0)
    return {
      networkRequired: false,
      networkMatched: true,
      networkFailReason: null,
      matchedSignal: null,
      matchedNetwork: null,
    };

  const deviceSsid = normalizeNet(wifiSsid);
  const deviceBssid = normalizeNet(wifiBssid);
  const devicePublicIp = normalizeNet(publicIp);

  // Is the device's SSID readable on THIS read? (The one gate that matters.)
  const ssidReal = isWifi && !isUnknownSsid(wifiSsid);
  // BSSID readability is used ONLY to decorate the log — never to decide.
  const bssidReal = isWifi && !isPlaceholderBssid(wifiBssid);

  // ── Primary pass: SSID name match (authoritative). BSSID never blocks. ─────
  let matchedNetwork = null;
  let matchedSignal = null;
  if (ssidReal) {
    for (const net of fenceNetworks) {
      if (
        isConfiguredValue(net.NetworkName) &&
        normalizeNet(net.NetworkName) === deviceSsid
      ) {
        matchedNetwork = net;
        // BSSID is a non-blocking corroborator: note it if it happens to agree.
        const bssidAgrees =
          bssidReal &&
          isConfiguredValue(net.BSSID) &&
          normalizeNet(net.BSSID) === deviceBssid;
        matchedSignal = bssidAgrees ? 'BSSID+SSID' : 'SSID';
        break;
      }
    }
  }

  // ── Fallback: public IP, ONLY when the SSID was unreadable ────────────────
  if (!matchedNetwork && !ssidReal && devicePublicIp.length > 0) {
    for (const net of fenceNetworks) {
      if (
        isConfiguredValue(net.NetworkID) &&
        normalizeNet(net.NetworkID) === devicePublicIp
      ) {
        matchedNetwork = net;
        matchedSignal = 'NetworkID-fallback';
        break;
      }
    }
  }

  if (matchedNetwork)
    return {
      networkRequired: true,
      networkMatched: true,
      networkFailReason: null,
      matchedSignal,
      matchedNetwork,
    };

  // Nothing matched. Pick the clearest reason for the user.
  //   • SSID unreadable → couldn't read the network (retryable) — or NOT_ON_WIFI
  //     if we aren't on WiFi at all.
  //   • SSID readable but matches no allowed name → on a real, non-allowed net.
  let networkFailReason;
  if (!ssidReal)
    networkFailReason = isWifi ? 'NETWORK_UNAVAILABLE' : 'NOT_ON_WIFI';
  else networkFailReason = 'NETWORK_MISMATCH';

  return {
    networkRequired: true,
    networkMatched: false,
    networkFailReason,
    matchedSignal: null,
    matchedNetwork: null,
  };
};

export const buildNetworkErrorMessage = (fence, failReason) => {
  const names = (fence?.networks ?? [])
    .map(n => n.NetworkName)
    .filter(Boolean)
    .join(', ');
  if (failReason === 'NOT_ON_WIFI')
    return `This location requires office WiFi.\nRequired network: ${
      names || 'office WiFi'
    }`;
  // "Couldn't determine the network" — distinct from "wrong network". This is a
  // read/permission problem, not a policy violation, so the message points at
  // the fix (permission + location services) and invites a retry.
  if (failReason === 'SSID_UNAVAILABLE' || failReason === 'NETWORK_UNAVAILABLE')
    return 'Unable to determine your network. Ensure Location permission is granted and Location Services are on, then try again.';
  return `Wrong WiFi network.\nPlease connect to: ${
    names || 'required office network'
  }`;
};

const GeofenceContext = createContext(null);

export const useGeofence = () => {
  const ctx = useContext(GeofenceContext);
  if (!ctx) throw new Error('useGeofence must be inside <GeofenceProvider>');
  return ctx;
};

export const GeofenceProvider = ({children, person}) => {
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const [coords, setCoords] = useState(null);
  const [allFences, setAllFences] = useState([]);
  const [matchedFence, setMatchedFence] = useState(null);
  const [manualSelectedFence, setManualSelectedFence] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [clockInFence, setClockInFence] = useState(null);
  const [wifiInfo, setWifiInfo] = useState({
    ssid: null,
    bssid: null,
    isWifi: false,
    isUnknown: false,
  });

  const watchId = useRef(null);
  const latestCoordsRef = useRef(null);
  const wifiInfoRef = useRef(wifiInfo);
  const inflightRefreshRef = useRef(null);
  const isMountedRef = useRef(true);
  const rearmTimerRef = useRef(null);
  const startWatchRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    wifiInfoRef.current = wifiInfo;
  }, [wifiInfo]);

  // ── Subscribe to NetInfo ──────────────────────────────────
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.type === 'wifi' && state.details) {
        const ssid = state.details.ssid ?? null;
        const bssid = state.details.bssid ?? null;
        const unknown = isUnknownSsid(ssid);
        const next = {ssid, bssid, isWifi: true, isUnknown: unknown};
        setWifiInfo(prev => {
          if (
            prev.isWifi === next.isWifi &&
            prev.ssid === next.ssid &&
            prev.bssid === next.bssid
          )
            return prev;
          wifiInfoRef.current = next;
          return next;
        });
      } else {
        const next = {ssid: null, bssid: null, isWifi: false, isUnknown: false};
        setWifiInfo(prev => {
          if (!prev.isWifi) return prev;
          wifiInfoRef.current = next;
          return next;
        });
      }
    });

    // Initial snapshot
    NetInfo.fetch().then(state => {
      if (state.type === 'wifi' && state.details) {
        const ssid = state.details.ssid ?? null;
        const bssid = state.details.bssid ?? null;
        const unknown = isUnknownSsid(ssid);
        const next = {ssid, bssid, isWifi: true, isUnknown: unknown};
        setWifiInfo(next);
        wifiInfoRef.current = next;
      }
    });

    return () => unsubscribe();
  }, []);

  // ── Permission — FIXED FOR BOTH ANDROID AND iOS ───────────
  const requestPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      const r = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Attendance tracking needs your location.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        },
      );
      return r === PermissionsAndroid.RESULTS.GRANTED;
    }

    // ── iOS FIX: Check if already granted first ──────────────
    // requestAuthorization returns a STATUS STRING not true/false.
    // Routed through getFreshPositionWithTimeout so a hung Play-Services fix
    // can't stall mount — on timeout it rejects with code undefined and falls
    // through to the "assume granted" branch, matching prior behaviour.
    try {
      await getFreshPositionWithTimeout({
        enableHighAccuracy: false,
        timeout: 3000,
        maximumAge: 60000,
      });
      // Can get position = permission already granted
      console.log('✅ GeofenceContext: iOS location already granted');
      return true;
    } catch (error) {
      console.log('📍 GeofenceContext iOS check:', error?.code, error?.message);
      if (error?.code === 1) {
        // PERMISSION_DENIED — need to request it
        return new Promise(resolve => {
          Geolocation.requestAuthorization(
            status => {
              console.log('📍 GeofenceContext iOS auth status:', status);
              const isGranted =
                status === 'authorizedWhenInUse' ||
                status === 'authorizedAlways' ||
                status === 'whenInUse' ||
                status === 'always' ||
                status === 'granted';
              resolve(isGranted);
            },
            () => resolve(false),
          );
        });
      }
      // Timeout or other error — permission likely granted, GPS just slow
      console.log(
        '📍 GeofenceContext iOS: assuming granted, error:',
        error?.code,
      );
      return true;
    }
  }, []);

  // ── enrichFences ──────────────────────────────────────────
  const enrichFences = useCallback((raw, cur) => {
    const now = new Date();
    return raw.map(f => {
      const lat = parseFloat(f.Latitude);
      const lng = parseFloat(f.Longitude);
      const radius = parseFloat(f.AllowedRadius);
      const active =
        isActiveFlag(f.IsFenceActive) && isActiveFlag(f.IsUserFenceActive);
      const vFrom = f.ValidFrom ? new Date(f.ValidFrom) : null;
      const vTo = f.ValidTo ? new Date(f.ValidTo) : null;
      const dateValid = (!vFrom || now >= vFrom) && (!vTo || now <= vTo);

      let distanceMetres = null;
      let withinRadius = false;
      if (cur && !isNaN(lat) && !isNaN(lng)) {
        distanceMetres = Math.round(
          haversineDistance(cur.latitude, cur.longitude, lat, lng),
        );
        withinRadius =
          !isNaN(radius) && distanceMetres <= radius + SOFT_BUFFER_METRES;
      }

      return {
        ...f,
        fenceLat: lat,
        fenceLng: lng,
        allowedRadius: radius,
        active,
        dateValid,
        distanceMetres,
        withinRadius,
        networks: Array.isArray(f.Networks)
          ? f.Networks.flatMap(n =>
              Array.isArray(n.DFGeoFencesNetworksSvcContract)
                ? n.DFGeoFencesNetworksSvcContract
                : n,
            )
          : [],
      };
    });
  }, []);

  const selectBestFence = fences => {
    const candidates = fences.filter(
      f => f.active && f.dateValid && f.withinRadius,
    );
    if (candidates.length === 0) return null;
    return candidates.reduce((a, b) =>
      b.distanceMetres < a.distanceMetres ? b : a,
    );
  };

  const reEnrichWithCoords = useCallback(
    newCoords => {
      setAllFences(prev => {
        if (!prev.length) return prev;
        const enriched = enrichFences(
          prev.map(f => ({
            ...f,
            Latitude: f.fenceLat,
            Longitude: f.fenceLng,
            AllowedRadius: f.allowedRadius,
            IsFenceActive: f.active ? '1' : '0',
            IsUserFenceActive: f.active ? '1' : '0',
            ValidFrom: null,
            ValidTo: null,
            Networks: f.networks ?? [],
          })),
          newCoords,
        );
        const matched = selectBestFence(enriched);
        setMatchedFence(matched);
        setLocationError(
          matched ? null : 'You are outside all authorised zones.',
        );
        setManualSelectedFence(prev2 => {
          if (!prev2) return null;
          const stillValid = enriched.find(
            f =>
              String(f.GeoFenceID) === String(prev2.GeoFenceID) &&
              f.withinRadius &&
              f.active &&
              f.dateValid,
          );
          return stillValid ?? null;
        });
        return enriched;
      });
    },
    [enrichFences],
  );

  // ── Watch lifecycle (single source of truth = watchId.current) ────────────
  const stopWatch = useCallback(() => {
    if (watchId.current !== null) {
      Geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  const startWatch = useCallback(() => {
    // Never run two watches at once — re-arming must not leak subscriptions.
    if (watchId.current !== null) return;

    watchId.current = Geolocation.watchPosition(
      pos => {
        if (!isMountedRef.current) return;
        const newCoords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        };
        setCoords(newCoords);
        latestCoordsRef.current = newCoords;
        reEnrichWithCoords(newCoords);
      },
      err => {
        console.warn('📍 watchPosition error:', err?.message);
        if (!isMountedRef.current) return;
        setLocationError('GPS signal lost. Please check location services.');
        // The subscription is dead / GPS availability was lost. Tear it down
        // and re-arm — otherwise a one-off error leaves the watch silent for
        // the whole session. Coalesced via rearmTimerRef so a burst of errors
        // can only restart the watch once per WATCH_REARM_DELAY_MS.
        stopWatch();
        if (rearmTimerRef.current) return;
        rearmTimerRef.current = setTimeout(() => {
          rearmTimerRef.current = null;
          if (isMountedRef.current) startWatchRef.current?.();
        }, WATCH_REARM_DELAY_MS);
      },
      WATCH_OPTIONS,
    );
  }, [reEnrichWithCoords, stopWatch]);

  // Keep a ref to the latest startWatch so the error handler (captured inside a
  // long-lived native subscription) can re-arm without a stale closure.
  useEffect(() => {
    startWatchRef.current = startWatch;
  }, [startWatch]);

  const resetFenceState = useCallback(errorMessage => {
    setAllFences([]);
    setMatchedFence(null);
    setManualSelectedFence(null);
    setLocationError(errorMessage);
  }, []);

  // ── Core refresh ──────────────────────────────────────────
  const _doRefresh = useCallback(async () => {
    setLocationLoading(true);
    setLocationError(null);
    try {
      const fresh = await fetchFreshCoords();
      if (!fresh) {
        const errorMessage =
          'Unable to get GPS location. Please enable location services.';
        if (!latestCoordsRef.current) {
          resetFenceState(errorMessage);
        } else {
          setLocationError(errorMessage);
        }
        throw new Error(errorMessage);
      }
      setCoords(fresh);
      latestCoordsRef.current = fresh;

      const raw = await RetrieveByPerson({person});

      if (!raw || raw.length === 0) {
        const errorMessage =
          'No geofence configured for your account. Contact HR.';
        resetFenceState(errorMessage);
        throw new Error(errorMessage);
      }

      const enriched = enrichFences(raw, fresh);
      const matched = selectBestFence(enriched);
      const errorMessage = matched
        ? null
        : 'You are outside all authorised zones.';

      setAllFences(enriched);
      setMatchedFence(matched);
      setManualSelectedFence(null);
      setLocationError(errorMessage);

      return {
        coords: fresh,
        allFences: enriched,
        matchedFence: matched,
        locationError: errorMessage,
      };
    } catch (err) {
      console.error('[GeofenceContext]', err.message);
      const errorMessage =
        err?.message || 'Failed to verify location. Check your connection.';
      resetFenceState(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLocationLoading(false);
    }
  }, [person, enrichFences, resetFenceState]);

  // Deduplicated refresh.
  // Cleanup is attached to the promise itself via .finally() rather than to a
  // single caller's await, so the in-flight ref is released the moment the
  // refresh settles — success, failure, or timeout — no matter who (if anyone)
  // is still awaiting it. This is what prevents a wedged ref from permanently
  // disabling pull-to-refresh for the rest of the session. Belt-and-suspenders
  // with Task 1: the timeout-safe reads guarantee _doRefresh always settles,
  // and this guarantees the ref clears even if something unexpected throws.
  const refresh = useCallback(() => {
    if (inflightRefreshRef.current) return inflightRefreshRef.current;
    const p = _doRefresh().finally(() => {
      inflightRefreshRef.current = null;
    });
    inflightRefreshRef.current = p;
    return p;
  }, [_doRefresh]);

  // ── Foreground re-sync ────────────────────────────────────
  // The GeofenceProvider mounts once per session and never remounts on
  // screen re-entry, so nothing otherwise recovers a watch the OS paused/killed
  // while backgrounded. On every background/inactive → active transition, force
  // a fresh watch and a fresh refresh so coords can't stay frozen at the value
  // captured before the app was backgrounded.
  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (/inactive|background/.test(prev) && next === 'active') {
        // Nudge NetInfo's process-level cache toward truth on foreground so a
        // network switch made while backgrounded is more likely reflected by
        // the time the user punches (Task 4 mitigation).
        if (NetInfo.refresh) NetInfo.refresh().catch(() => {});
        stopWatch();
        startWatchRef.current?.();
        refresh().catch(() => {});
      }
    });
    return () => sub.remove();
  }, [stopWatch, refresh]);

  // ── Mount ─────────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;
    (async () => {
      const granted = await requestPermission();
      if (!isMountedRef.current) return;
      if (!granted) {
        setPermissionStatus('denied');
        return;
      }

      setPermissionStatus('granted');
      startWatch();

      try {
        await refresh();
      } catch {}
    })();

    // Restore persisted clock in fence
    AsyncStorage.getItem(CLOCK_IN_FENCE_KEY).then(raw => {
      if (raw) setClockInFence(JSON.parse(raw));
    });

    return () => {
      isMountedRef.current = false;
      if (rearmTimerRef.current) {
        clearTimeout(rearmTimerRef.current);
        rearmTimerRef.current = null;
      }
      stopWatch();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const recordClockInFence = useCallback(async fence => {
    setClockInFence(fence);
    if (fence) {
      await AsyncStorage.setItem(CLOCK_IN_FENCE_KEY, JSON.stringify(fence));
    } else {
      await AsyncStorage.removeItem(CLOCK_IN_FENCE_KEY);
    }
  }, []);

  const effectiveMatchedFence = manualSelectedFence ?? matchedFence;

  return (
    <GeofenceContext.Provider
      value={{
        permissionStatus,
        coords,
        allFences,
        matchedFence: effectiveMatchedFence,
        locationLoading,
        locationError,
        refresh,
        setManualSelectedFence,
        clockInFence,
        recordClockInFence,
        wifiInfo,
      }}>
      {children}
    </GeofenceContext.Provider>
  );
};
