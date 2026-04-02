/* eslint-disable curly */
// ─────────────────────────────────────────────
// hooks/useLocation.js
// ─────────────────────────────────────────────
import {useState, useEffect, useRef, useCallback} from 'react';
import {Platform, PermissionsAndroid} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import DeviceInfo from 'react-native-device-info';
import JailMonkey from 'jail-monkey';

const LOCATION_KEY = '@attendance_location';
const COORDS_KEY = '@attendance_last_coords';

// ── Haversine distance (metres) ───────────────────────────
export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ── S1–S5: Multi-reason spoofing detection ────────────────
const checkSpoofing = (position, prevPosition) => {
  const {accuracy, speed, latitude, longitude} = position.coords;
  const ts = position.timestamp;

  if (accuracy !== null && accuracy < 1)
    return {detected: true, reason: 'accuracy_too_perfect'};
  if (speed !== null && speed > 55.6)
    return {detected: true, reason: 'impossible_speed'};
  if (ts && Date.now() - ts > 180_000)
    return {detected: true, reason: 'stale_fix'};

  if (JailMonkey.isJailBroken() || JailMonkey.trustFall())
    return {detected: true, reason: 'rooted_device'};

  try {
    if (DeviceInfo.isEmulatorSync())
      return {detected: true, reason: 'emulator'};
  } catch {}

  if (prevPosition) {
    const prevTs = prevPosition.timestamp;
    const elapsedSec = (ts - prevTs) / 1000;
    if (elapsedSec > 0 && elapsedSec < 60) {
      const dist = haversineDistance(
        prevPosition.coords.latitude,
        prevPosition.coords.longitude,
        latitude,
        longitude,
      );
      if (dist / elapsedSec > 55.6)
        return {detected: true, reason: 'position_jump'};
    }
  }

  if (Platform.OS === 'android' && position.coords.isFromMockProvider === true)
    return {detected: true, reason: 'mock_flag'};

  return {detected: false, reason: null};
};

// ─────────────────────────────────────────────
const useLocation = () => {
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const [userCoords, setUserCoords] = useState(null);
  const [locationConfig, setLocationConfig] = useState(null);
  const [withinRadius, setWithinRadius] = useState(null);
  const [spoofingDetected, setSpoofingDetected] = useState(false);
  const [spoofingReason, setSpoofingReason] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // ── NEW: live WiFi info so components can read it synchronously ──
  // { ssid: string|null, bssid: string|null, isWifi: boolean }
  const [wifiInfo, setWifiInfo] = useState({
    ssid: null,
    bssid: null,
    isWifi: false,
  });

  const watchId = useRef(null);
  const prevPositionRef = useRef(null);

  const loadLocationConfig = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(LOCATION_KEY);
      if (raw) setLocationConfig(JSON.parse(raw));
    } catch {}
  }, []);

  const saveLocationConfig = useCallback(async config => {
    try {
      await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(config));
      setLocationConfig(config);
    } catch {}
  }, []);

  const requestPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Attendance tracking needs your location.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return new Promise(resolve => {
      Geolocation.requestAuthorization(resolve, () => resolve(false));
    });
  }, []);

  const startWatching = useCallback(() => {
    if (watchId.current !== null) return;

    watchId.current = Geolocation.watchPosition(
      position => {
        const spoof = checkSpoofing(position, prevPositionRef.current);
        if (spoof.detected) {
          setSpoofingDetected(true);
          setSpoofingReason(spoof.reason);
          prevPositionRef.current = position;
          return;
        }

        setSpoofingDetected(false);
        setSpoofingReason(null);
        setLocationError(null);
        prevPositionRef.current = position;

        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };

        setUserCoords(coords);
        AsyncStorage.setItem(COORDS_KEY, JSON.stringify(coords)).catch(
          () => {},
        );

        setLocationConfig(cfg => {
          if (cfg) {
            const dist = haversineDistance(
              coords.latitude,
              coords.longitude,
              cfg.latitude,
              cfg.longitude,
            );
            setWithinRadius(dist <= cfg.radius);
          }
          return cfg;
        });
      },
      error => setLocationError(error.message),
      {
        enableHighAccuracy: true,
        distanceFilter: 10,
        interval: 5000,
        fastestInterval: 2000,
      },
    );
  }, []);

  const stopWatching = useCallback(() => {
    if (watchId.current !== null) {
      Geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  // ── NEW: subscribe to NetInfo for live WiFi state ─────────
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.type === 'wifi' && state.details) {
        setWifiInfo({
          ssid: state.details.ssid ?? null,
          bssid: state.details.bssid ?? null,
          isWifi: true,
        });
      } else {
        setWifiInfo({ssid: null, bssid: null, isWifi: false});
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await loadLocationConfig();
      const granted = await requestPermission();
      if (!mounted) return;
      if (granted) {
        setPermissionStatus('granted');
        startWatching();
      } else {
        setPermissionStatus('denied');
      }
    })();
    return () => {
      mounted = false;
      stopWatching();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── collectAttendanceData ─────────────────────────────────
  const collectAttendanceData = useCallback(
    async (eventLabel = 'EVENT') => {
      let gpsCoords = userCoords;

      const tryGetPosition = options =>
        new Promise((resolve, reject) =>
          Geolocation.getCurrentPosition(resolve, reject, options),
        );

      try {
        const pos = await tryGetPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        });
        gpsCoords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        };
      } catch (err) {
        console.warn(
          'High-accuracy GPS failed:',
          err.message,
          '— trying low accuracy',
        );
        try {
          const pos = await tryGetPosition({
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 30000,
          });
          gpsCoords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          };
        } catch (err2) {
          console.warn('Low-accuracy GPS also failed:', err2.message);
        }
      }

      let wifiSSID = 'Unknown';
      let wifiDetails = {};
      try {
        const netState = await NetInfo.fetch();
        if (netState.type === 'wifi' && netState.details) {
          wifiSSID = netState.details.ssid ?? 'Hidden/Unknown';
          wifiDetails = {
            ssid: netState.details.ssid,
            bssid: netState.details.bssid,
            ipAddress: netState.details.ipAddress,
            strength: netState.details.strength,
          };
        } else {
          wifiSSID = `Not on WiFi (${netState.type})`;
        }
      } catch {}

      const REQUIRED_RADIUS = 200;
      let radiusCheck = {
        officeConfigured: false,
        distanceMetres: null,
        withinRequiredZone: null,
      };
      if (gpsCoords && locationConfig) {
        const dist = haversineDistance(
          gpsCoords.latitude,
          gpsCoords.longitude,
          locationConfig.latitude,
          locationConfig.longitude,
        );
        radiusCheck = {
          officeConfigured: true,
          officeLocation: {
            latitude: locationConfig.latitude,
            longitude: locationConfig.longitude,
          },
          distanceMetres: Math.round(dist),
          withinRequiredZone: dist <= REQUIRED_RADIUS,
        };
      }

      let deviceId = 'unavailable';
      let deviceName = 'unavailable';
      try {
        deviceId = await DeviceInfo.getUniqueId();
        deviceName = await DeviceInfo.getDeviceName();
      } catch {}

      const snapshot = {
        event: eventLabel,
        timestamp: new Date().toISOString(),
        gps: gpsCoords
          ? {
              latitude: gpsCoords.latitude,
              longitude: gpsCoords.longitude,
              accuracy: gpsCoords.accuracy,
            }
          : null,
        wifi: {ssid: wifiSSID, details: wifiDetails},
        radius: radiusCheck,
        device: {id: deviceId, name: deviceName},
        spoofing: {detected: spoofingDetected, reason: spoofingReason},
      };

      console.log(`\n========== ATTENDANCE: ${eventLabel} ==========`);
      console.log('📍 GPS:', snapshot.gps ?? 'N/A');
      console.log('📶 WiFi SSID:', snapshot.wifi.ssid);
      console.log('📏 Radius:', radiusCheck);
      console.log('📱 Device:', snapshot.device);
      console.log('🔍 Spoofing:', snapshot.spoofing);
      console.log('================================================\n');

      return snapshot;
    },
    [userCoords, locationConfig, spoofingDetected, spoofingReason],
  );

  return {
    permissionStatus,
    userCoords,
    locationConfig,
    withinRadius,
    spoofingDetected,
    spoofingReason,
    locationError,
    wifiInfo, // ← NEW: { ssid, bssid, isWifi }
    saveLocationConfig,
    startWatching,
    stopWatching,
    collectAttendanceData,
  };
};

export default useLocation;
