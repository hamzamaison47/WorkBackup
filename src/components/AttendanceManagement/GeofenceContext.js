// ─────────────────────────────────────────────
// components/AttendanceManagement/GeofenceContext.js
//
// FLOW CHANGE:
//   Location verification = GPS + coordinates ONLY.
//   Network (WiFi/IP) check is NOT done here anymore.
//   It is done at confirm-time in each ConfirmScreen.
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
// Network helpers — exported so ConfirmScreens
// can call them at confirm-time.
// ─────────────────────────────────────────────
//
// API Networks entry:
//   { NetworkID: "58.27.244.226", NetworkName: "MAISON" }
//   NetworkName = WiFi SSID
//   NetworkID   = Public IP address of that network
//
// Rule: BOTH must match on the SAME entry (AND logic).

const normalizeNet = s =>
  String(s ?? '')
    .trim()
    .toLowerCase();

export const fetchPublicIP = async () => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch('https://api.ipify.org?format=text', {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const ip = (await res.text()).trim();
    return ip.length > 0 ? ip : null;
  } catch {
    return null;
  }
};

// checkNetworkMatch — called at confirm-time, not at location-match time.
//
//   fenceNetworks  Networks[] from the matched fence
//   wifiSsid       device WiFi SSID (from NetInfo)
//   isWifi         device is on WiFi
//   publicIP       device public IP (from fetchPublicIP)
//
// Returns { networkRequired, networkMatched, networkFailReason }
export const checkNetworkMatch = (
  fenceNetworks,
  wifiSsid,
  wifiBssid,
  isWifi,
  publicIP,
  isInternetReachable = true,
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

  if (!publicIP && isInternetReachable)
    return {
      networkRequired: true,
      networkMatched: false,
      networkFailReason: 'PUBLIC_IP_UNAVAILABLE',
    };

  const deviceSsid = normalizeNet(wifiSsid);
  const deviceIp = normalizeNet(publicIP);
  const deviceBssid = normalizeNet(wifiBssid);

  // Both NetworkName AND NetworkID AND BSSID must match on the same entry
  const matched = fenceNetworks.some(
    net =>
      net.NetworkName &&
      net.NetworkID &&
      net.BSSID &&
      normalizeNet(net.NetworkName) === deviceSsid &&
      (!isInternetReachable || normalizeNet(net.NetworkID) === deviceIp) &&
      normalizeNet(net.BSSID) === deviceBssid,
  );

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
  if (failReason === 'PUBLIC_IP_UNAVAILABLE')
    return 'Unable to verify your network. Check your internet connection.';
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

  // wifiInfo exposed so ConfirmScreens can read current SSID
  const [wifiInfo, setWifiInfo] = useState({ssid: null, isWifi: false});

  const watchId = useRef(null);
  const latestCoordsRef = useRef(null);
  const wifiInfoRef = useRef(wifiInfo);

  useEffect(() => {
    wifiInfoRef.current = wifiInfo;
  }, [wifiInfo]);

  // ── Subscribe to NetInfo ──────────────────────────────────
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const next =
        state.type === 'wifi' && state.details
          ? {ssid: state.details.ssid ?? null, isWifi: true}
          : {ssid: null, isWifi: false};

      setWifiInfo(prev => {
        if (prev.isWifi === next.isWifi && prev.ssid === next.ssid) return prev;
        wifiInfoRef.current = next;
        return next;
      });
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
  // Networks array is stored on each fence for use at confirm-time.
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
        // Store networks for confirm-time validation — not used for matching here
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

  // ── selectBestFence ───────────────────────────────────────
  // GPS-only: active + valid dates + within radius.
  // Closest wins when multiple qualify.
  const selectBestFence = fences => {
    const candidates = fences.filter(
      f => f.active && f.dateValid && f.withinRadius,
    );
    if (candidates.length === 0) return null;
    return candidates.reduce((a, b) =>
      b.distanceMetres < a.distanceMetres ? b : a,
    );
  };

  // ── reEnrichWithCoords (G5) ───────────────────────────────
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

        // M1 — clear manual selection if no longer in radius
        // (multi-select feature commented out — see LocationPickerModal)
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

  // ── Main refresh ──────────────────────────────────────────
  const refresh = useCallback(async () => {
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

      let raw = null;
      try {
        raw = await RetrieveByPerson({person});
        if (raw && raw.length > 0) {
          await AsyncStorage.setItem('@cached_geofences', JSON.stringify({
            fetchedAt: Date.now(),
            fences: raw,
          }));
        }
      } catch (apiError) {
        console.warn('RetrieveByPerson failed, attempting to use cache', apiError.message);
        const cachedStr = await AsyncStorage.getItem('@cached_geofences');
        if (cachedStr) {
          const cachedData = JSON.parse(cachedStr);
          const ageHours = (Date.now() - cachedData.fetchedAt) / (1000 * 60 * 60);
          if (ageHours > 24) {
            throw new Error('Offline geofence data is older than 24 hours. Please connect to the internet to update security policies.');
          }
          raw = cachedData.fences;
          console.log('Using cached geofences from', new Date(cachedData.fetchedAt).toISOString());
        } else {
          throw new Error('Network error and no offline geofence data available.');
        }
      }

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

    return () => {
      mounted = false;
      if (watchId.current !== null) {
        Geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const recordClockInFence = useCallback(fence => setClockInFence(fence), []);

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
        wifiInfo, // current WiFi state for ConfirmScreens
      }}>
      {children}
    </GeofenceContext.Provider>
  );
};
