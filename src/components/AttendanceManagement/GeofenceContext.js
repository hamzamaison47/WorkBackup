// ─────────────────────────────────────────────
// components/AttendanceManagement/GeofenceContext.js
//
// OPTIMIZATIONS:
//   P0.2 — Added inflight deduplication: concurrent refresh() calls share
//           the same in-flight promise instead of spawning parallel SOAP calls.
//   P0.2 — Removed AsyncStorage geofence cache (online-first; cache caused
//           stale-data confusion with QA workflow).
//   P1.2 — Removed fetchPublicIP / api.ipify.org dependency entirely.
//           Network validation is now SSID + BSSID only (more reliable,
//           no external HTTP call in the critical path).
//   P3.2 — Unknown SSID detection: warns when Android 9+ returns
//           '<unknown ssid>' due to location permission not being granted.
//
// Location verification = GPS + coordinates ONLY.
// Network (WiFi SSID + BSSID) check is done at confirm-time in Orchestrator.
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
import {Platform, PermissionsAndroid} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {RetrieveByPerson} from '../../API/AttendanceManagement/RetrieveByPerson';
import {haversineDistance} from '../../hooks/useLocation';

const SOFT_BUFFER_METRES = 15;
const CLOCK_IN_FENCE_KEY = '@attendance_clock_in_fence';

const isActiveFlag = val => {
  const s = String(val).trim().toLowerCase();
  return s === '1' || s === 'yes' || s === 'true';
};

const tryPos = options =>
  new Promise((resolve, reject) =>
    Geolocation.getCurrentPosition(resolve, reject, options),
  );

const fetchFreshCoords = async () => {
  try {
    const p = await tryPos({
      enableHighAccuracy: true,
      timeout: 10000,
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
      const p = await tryPos({
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 30000,
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
};

// ─────────────────────────────────────────────
// Network helpers — exported so the Orchestrator
// can call them at validation time.
//
// API Networks entry:
//   { NetworkID: "xx:xx:xx:xx", NetworkName: "MAISON", BSSID: "aa:bb:cc:dd" }
//   NetworkName = WiFi SSID
//   BSSID       = Access point hardware address
//
// Rule: SSID must match. BSSID must match if configured.
// fetchPublicIP REMOVED — external HTTP call in critical path eliminated.
// ─────────────────────────────────────────────

const normalizeNet = s =>
  String(s ?? '')
    .trim()
    .toLowerCase();

// P3.2 — Detect Android 9+ returning placeholder instead of real SSID
export const isUnknownSsid = ssid =>
  !ssid ||
  ssid === '<unknown ssid>' ||
  ssid === '0x' ||
  ssid === '"<unknown ssid>"';

// checkNetworkMatch — called at validation time by the Orchestrator.
//
//   fenceNetworks  Networks[] from the matched fence
//   wifiSsid       device WiFi SSID (from NetInfo)
//   wifiBssid      device WiFi BSSID (from NetInfo)
//   isWifi         device is on WiFi
//
// Returns { networkRequired, networkMatched, networkFailReason }
export const checkNetworkMatch = (
  fenceNetworks,
  wifiSsid,
  wifiBssid,
  isWifi,
) => {
  if (!fenceNetworks || fenceNetworks.length === 0)
    return {
      networkRequired: false,
      networkMatched: true,
      networkFailReason: null,
    };

  if (!isWifi)
    return {
      networkRequired: true,
      networkMatched: false,
      networkFailReason: 'NOT_ON_WIFI',
    };

  // P3.2 — Unknown SSID: Android 9+ requires location services for SSID
  if (isUnknownSsid(wifiSsid))
    return {
      networkRequired: true,
      networkMatched: false,
      networkFailReason: 'SSID_UNAVAILABLE',
    };

  const deviceSsid = normalizeNet(wifiSsid);
  const deviceBssid = normalizeNet(wifiBssid);

  // SSID must match. BSSID must match if it is configured on the entry.
  const matched = fenceNetworks.some(net => {
    const ssidMatch =
      net.NetworkName && normalizeNet(net.NetworkName) === deviceSsid;
    // Treat BSSID as "not configured" if it is null, undefined, or an empty
    // array ([] can appear from old cached data before the normalizeValue fix).
    const bssidConfigured =
      net.BSSID &&
      !(Array.isArray(net.BSSID) && net.BSSID.length === 0) &&
      normalizeNet(net.BSSID).length > 0;
    const bssidMatch =
      !bssidConfigured ||
      (deviceBssid && normalizeNet(net.BSSID) === deviceBssid);
    return ssidMatch && bssidMatch;
  });

  return {
    networkRequired: true,
    networkMatched: matched,
    networkFailReason: matched ? null : 'NETWORK_MISMATCH',
  };
};

// Human-readable error from a fail reason
export const buildNetworkErrorMessage = (fence, failReason) => {
  const names = (fence?.networks ?? [])
    .map(n => n.NetworkName)
    .filter(Boolean)
    .join(', ');
  if (failReason === 'NOT_ON_WIFI')
    return `This location requires office WiFi.\nRequired network: ${
      names || 'office WiFi'
    }`;
  if (failReason === 'SSID_UNAVAILABLE')
    return 'Unable to read WiFi network name. Ensure Location permission is granted and Location Services are enabled on your device.';
  return `Wrong WiFi network.\nPlease connect to: ${
    names || 'required office network'
  }`;
};

// ─────────────────────────────────────────────
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

  // wifiInfo exposed so Orchestrator can read current SSID/BSSID
  const [wifiInfo, setWifiInfo] = useState({
    ssid: null,
    bssid: null,
    isWifi: false,
    isUnknown: false,
  });

  const watchId = useRef(null);
  const latestCoordsRef = useRef(null);
  const wifiInfoRef = useRef(wifiInfo);

  // P0.2 — Inflight deduplication: share one promise across concurrent callers
  const inflightRefreshRef = useRef(null);

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
    
    // P1.3 — Initial snapshot fetch because event listener may take a few seconds
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

  // ── Permission ────────────────────────────────────────────
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
    return new Promise(resolve =>
      Geolocation.requestAuthorization(resolve, () => resolve(false)),
    );
  }, []);

  // ── enrichFences ──────────────────────────────────────────
  // GPS + coordinates ONLY. No network check here.
  // Networks array is stored on each fence for Orchestrator use.
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
        // Store networks for Orchestrator validation at confirm-time.
        // Filter null/undefined entries so flatMap never crashes on n.property.
        networks: Array.isArray(f.Networks)
          ? f.Networks.filter(n => n != null).flatMap(n =>
              Array.isArray(n?.DFGeoFencesNetworksSvcContract)
                ? n.DFGeoFencesNetworksSvcContract.filter(e => e != null)
                : (n != null ? [n] : [])
            ).filter(e => e != null && typeof e === 'object')
          : [],
      };
    });
  }, []);

  // ── selectBestFence ───────────────────────────────────────
  const selectBestFence = fences => {
    const candidates = fences.filter(
      f => f.active && f.dateValid && f.withinRadius,
    );
    if (candidates.length === 0) return null;
    return candidates.reduce((a, b) =>
      b.distanceMetres < a.distanceMetres ? b : a,
    );
  };

  // ── reEnrichWithCoords ────────────────────────────────────
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

  const resetFenceState = useCallback(errorMessage => {
    setAllFences([]);
    setMatchedFence(null);
    setManualSelectedFence(null);
    setLocationError(errorMessage);
  }, []);

  // ── Core refresh ──────────────────────────────────────────
  // P0.2 — _doRefresh is the actual implementation.
  // refresh() deduplicates concurrent callers.
  const _doRefresh = useCallback(async () => {
    setLocationLoading(true);
    setLocationError(null);

    try {
      const fresh = await fetchFreshCoords();
      if (!fresh) {
        const errorMessage =
          'Unable to get GPS location. Please enable location services.';
        resetFenceState(errorMessage);
        throw new Error(errorMessage);
      }
      setCoords(fresh);
      latestCoordsRef.current = fresh;

      // Always fetch fresh from server — no AsyncStorage cache (online-first)
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
  }, [person, enrichFences, resetFenceState]); // eslint-disable-line react-hooks/exhaustive-deps

  // P0.2 — Deduplicated refresh: concurrent callers receive the same promise
  const refresh = useCallback(async () => {
    if (inflightRefreshRef.current) {
      return inflightRefreshRef.current;
    }
    inflightRefreshRef.current = _doRefresh();
    try {
      return await inflightRefreshRef.current;
    } finally {
      inflightRefreshRef.current = null;
    }
  }, [_doRefresh]);

  // ── Mount ─────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      const granted = await requestPermission();
      if (!mounted) return;
      if (!granted) {
        setPermissionStatus('denied');
        return;
      }

      setPermissionStatus('granted');

      watchId.current = Geolocation.watchPosition(
        pos => {
          if (!mounted) return;
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
        () => {
          if (mounted)
            setLocationError(
              'GPS signal lost. Please check location services.',
            );
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 10,
          interval: 5000,
          fastestInterval: 2000,
        },
      );

      try {
        await refresh();
      } catch {}
    })();

    // Restore persisted clock in fence
    AsyncStorage.getItem(CLOCK_IN_FENCE_KEY).then(raw => {
      if (raw) setClockInFence(JSON.parse(raw));
    });

    return () => {
      mounted = false;
      if (watchId.current !== null) {
        Geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
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
        wifiInfo, // current WiFi state for Orchestrator (includes bssid now)
      }}>
      {children}
    </GeofenceContext.Provider>
  );
};
