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
      const p = await tryPos({
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
      return null;
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

export const checkNetworkMatch = (
  fenceNetworks,
  wifiSsid,
  wifiBssid,
  isWifi,
) => {
  if (!fenceNetworks || fenceNetworks.length === 0)
    return {networkRequired: false, networkMatched: true, networkFailReason: null};

  if (!isWifi)
    return {networkRequired: true, networkMatched: false, networkFailReason: 'NOT_ON_WIFI'};

  if (isUnknownSsid(wifiSsid))
    return {networkRequired: true, networkMatched: false, networkFailReason: 'SSID_UNAVAILABLE'};

  const deviceSsid = normalizeNet(wifiSsid);
  const deviceBssid = normalizeNet(wifiBssid);

  const matched = fenceNetworks.some(net => {
    const ssidMatch = net.NetworkName && normalizeNet(net.NetworkName) === deviceSsid;
    const bssidMatch = !net.BSSID || (deviceBssid && normalizeNet(net.BSSID) === deviceBssid);
    return ssidMatch && bssidMatch;
  });

  return {
    networkRequired: true,
    networkMatched: matched,
    networkFailReason: matched ? null : 'NETWORK_MISMATCH',
  };
};

export const buildNetworkErrorMessage = (fence, failReason) => {
  const names = (fence?.networks ?? [])
    .map(n => n.NetworkName)
    .filter(Boolean)
    .join(', ');
  if (failReason === 'NOT_ON_WIFI')
    return `This location requires office WiFi.\nRequired network: ${names || 'office WiFi'}`;
  if (failReason === 'SSID_UNAVAILABLE')
    return 'Unable to read WiFi network name. Ensure Location permission is granted and Location Services are enabled.';
  return `Wrong WiFi network.\nPlease connect to: ${names || 'required office network'}`;
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
          if (prev.isWifi === next.isWifi && prev.ssid === next.ssid && prev.bssid === next.bssid)
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
    // requestAuthorization returns a STATUS STRING not true/false
    return new Promise(resolve => {
      Geolocation.getCurrentPosition(
        () => {
          // Can get position = permission already granted
          console.log('✅ GeofenceContext: iOS location already granted');
          resolve(true);
        },
        error => {
          console.log('📍 GeofenceContext iOS check:', error.code, error.message);
          if (error.code === 1) {
            // PERMISSION_DENIED — need to request it
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
          } else {
            // Timeout or other error — permission likely granted
            // GPS just took too long on first try
            console.log('📍 GeofenceContext iOS: assuming granted, error:', error.code);
            resolve(true);
          }
        },
        {enableHighAccuracy: false, timeout: 3000, maximumAge: 60000},
      );
    });
  }, []);

  // ── enrichFences ──────────────────────────────────────────
  const enrichFences = useCallback((raw, cur) => {
    const now = new Date();
    return raw.map(f => {
      const lat = parseFloat(f.Latitude);
      const lng = parseFloat(f.Longitude);
      const radius = parseFloat(f.AllowedRadius);
      const active = isActiveFlag(f.IsFenceActive) && isActiveFlag(f.IsUserFenceActive);
      const vFrom = f.ValidFrom ? new Date(f.ValidFrom) : null;
      const vTo = f.ValidTo ? new Date(f.ValidTo) : null;
      const dateValid = (!vFrom || now >= vFrom) && (!vTo || now <= vTo);

      let distanceMetres = null;
      let withinRadius = false;
      if (cur && !isNaN(lat) && !isNaN(lng)) {
        distanceMetres = Math.round(
          haversineDistance(cur.latitude, cur.longitude, lat, lng),
        );
        withinRadius = !isNaN(radius) && distanceMetres <= radius + SOFT_BUFFER_METRES;
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
                : n
            )
          : [],
      };
    });
  }, []);

  const selectBestFence = fences => {
    const candidates = fences.filter(f => f.active && f.dateValid && f.withinRadius);
    if (candidates.length === 0) return null;
    return candidates.reduce((a, b) => b.distanceMetres < a.distanceMetres ? b : a);
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
        setLocationError(matched ? null : 'You are outside all authorised zones.');
        setManualSelectedFence(prev2 => {
          if (!prev2) return null;
          const stillValid = enriched.find(
            f =>
              String(f.GeoFenceID) === String(prev2.GeoFenceID) &&
              f.withinRadius && f.active && f.dateValid,
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
  const _doRefresh = useCallback(async () => {
    setLocationLoading(true);
    setLocationError(null);
    try {
      const fresh = await fetchFreshCoords();
      if (!fresh) {
        const errorMessage = 'Unable to get GPS location. Please enable location services.';
        resetFenceState(errorMessage);
        throw new Error(errorMessage);
      }
      setCoords(fresh);
      latestCoordsRef.current = fresh;

      const raw = await RetrieveByPerson({person});

      if (!raw || raw.length === 0) {
        const errorMessage = 'No geofence configured for your account. Contact HR.';
        resetFenceState(errorMessage);
        throw new Error(errorMessage);
      }

      const enriched = enrichFences(raw, fresh);
      const matched = selectBestFence(enriched);
      const errorMessage = matched ? null : 'You are outside all authorised zones.';

      setAllFences(enriched);
      setMatchedFence(matched);
      setManualSelectedFence(null);
      setLocationError(errorMessage);

      return {coords: fresh, allFences: enriched, matchedFence: matched, locationError: errorMessage};
    } catch (err) {
      console.error('[GeofenceContext]', err.message);
      const errorMessage = err?.message || 'Failed to verify location. Check your connection.';
      resetFenceState(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLocationLoading(false);
    }
  }, [person, enrichFences, resetFenceState]);

  // Deduplicated refresh
  const refresh = useCallback(async () => {
    if (inflightRefreshRef.current) return inflightRefreshRef.current;
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

      // ── watchPosition with iOS-required options ────────────
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
        err => {
          console.warn('📍 watchPosition error:', err.message);
          if (mounted)
            setLocationError('GPS signal lost. Please check location services.');
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 10,
          interval: 5000,           // Android only
          fastestInterval: 2000,    // Android only
          timeout: 20000,           // ← iOS required
          maximumAge: 10000,        // ← iOS required
          useSignificantChanges: false, // ← iOS required
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
        wifiInfo,
      }}>
      {children}
    </GeofenceContext.Provider>
  );
};