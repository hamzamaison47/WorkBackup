/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable curly */
import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
  PermissionsAndroid,
  Platform,
  Dimensions,
  ScrollView,
  RefreshControl,
  AppState,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {CreateAttendance} from '../../API/Attendance/CreateAttendance';
import {GetAttendanceRegister} from '../../API/Attendance/GetAttendanceRegister';
import {getRegisterSummaryColorByDate} from '../../API/Attendance/getRegisterSummaryColorByDate';
import {GetGPSCoordinates} from '../../API/Attendance/GetGPSCoordinates';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import AlertModal from '../../components/Alert/AlertModal';
import {
  AttendanceButton,
  InfoItem,
  SummaryItem,
} from '../../components/Attendance/AttendanceComponents';
import {useNavigation} from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import brand from '../../theme/brand';

// Screen sizing
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

/* =================== Tunables =================== */
const GEO_TTL_MS = 30 * 60 * 1000; // 30m for less frequent network calls
const FRESH_FIX_MS = 30 * 1000; // 30s to allow more cache hits
const MAX_ALLOWED_ACCURACY = 150; // Relaxed to 150m for faster fixes
const GEOF_KEY = 'df_geofences_v1';
const OFFLINE_ATTENDANCE_KEY = 'offline_attendance_queue';
const FAILED_ATTENDANCE_KEY = 'failed_attendance_queue'; // For permanently failed records

/* =================== Helper to get device IP =================== */
const getDeviceIPAddress = async () => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetch('https://api.ipify.org?format=json', {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.log('Error getting device IP:', error);
    return null;
  }
};

/* =================== Network connectivity check =================== */
/**
 * Returns true only when we are confident internet is reachable.
 */
const checkInternetConnectivity = async () => {
  try {
    const netInfoState = await NetInfo.fetch();

    if (!netInfoState.isConnected) return false;

    // isInternetReachable is explicitly false → offline
    if (netInfoState.isInternetReachable === false) return false;

    // isInternetReachable is null (indeterminate on Android) → probe manually
    if (netInfoState.isInternetReachable === null) {
      return await probeInternet();
    }

    // isInternetReachable === true → still probe to handle "connected WiFi, no backend"
    return await probeInternet();
  } catch (error) {
    console.log('Error checking connectivity:', error);
    return false;
  }
};

/**
 * Quick HEAD request to a reliable endpoint to confirm actual internet.
 */
const probeInternet = async () => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://clients3.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.status === 204 || res.ok;
  } catch {
    return false;
  }
};

/* =================== Offline Attendance Storage =================== */
const saveOfflineAttendance = async attendanceData => {
  try {
    const existingQueue = await loadOfflineAttendanceQueue();

    const newRecord = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...attendanceData,
      createdAt: moment().toISOString(),
      retryCount: 0,
      lastAttempt: null,
      failureReason: null,
    };

    const updatedQueue = [...existingQueue, newRecord];
    await AsyncStorage.setItem(
      OFFLINE_ATTENDANCE_KEY,
      JSON.stringify(updatedQueue),
    );

    console.log('Saved offline attendance:', newRecord);
    return true;
  } catch (error) {
    console.log('Error saving offline attendance:', error);
    return false;
  }
};

const loadOfflineAttendanceQueue = async () => {
  try {
    const queue = await AsyncStorage.getItem(OFFLINE_ATTENDANCE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.log('Error loading offline queue:', error);
    return [];
  }
};

const removeOfflineAttendanceRecord = async recordId => {
  try {
    const queue = await loadOfflineAttendanceQueue();
    const updatedQueue = queue.filter(record => record.id !== recordId);
    await AsyncStorage.setItem(
      OFFLINE_ATTENDANCE_KEY,
      JSON.stringify(updatedQueue),
    );
    return true;
  } catch (error) {
    console.log('Error removing offline record:', error);
    return false;
  }
};

// Save permanently failed records (for debugging/admin review)
const saveFailedAttendance = async (record, reason) => {
  try {
    const failedQueue = await loadFailedAttendanceQueue();
    const failedRecord = {
      ...record,
      failedAt: moment().toISOString(),
      failureReason: reason,
    };
    const updatedQueue = [...failedQueue, failedRecord];
    await AsyncStorage.setItem(
      FAILED_ATTENDANCE_KEY,
      JSON.stringify(updatedQueue),
    );
    return true;
  } catch (error) {
    console.log('Error saving failed attendance:', error);
    return false;
  }
};

const loadFailedAttendanceQueue = async () => {
  try {
    const queue = await AsyncStorage.getItem(FAILED_ATTENDANCE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.log('Error loading failed queue:', error);
    return [];
  }
};

/* =================== Geofence helpers =================== */
const saveGeofences = async sites => {
  try {
    const payload = {ts: Date.now(), sites: Array.isArray(sites) ? sites : []};
    await AsyncStorage.setItem(GEOF_KEY, JSON.stringify(payload));
  } catch {}
};

const loadGeofences = async () => {
  try {
    const raw = await AsyncStorage.getItem(GEOF_KEY);
    if (!raw) return {ts: 0, sites: []};
    const obj = JSON.parse(raw);
    return {
      ts: obj?.ts || 0,
      sites: Array.isArray(obj?.sites) ? obj.sites : [],
    };
  } catch {
    return {ts: 0, sites: []};
  }
};

const CreateAttendanceScreen = () => {
  // Loading states
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [processingOffline, setProcessingOffline] = useState(false);

  // UI
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [failedQueueCount, setFailedQueueCount] = useState(0);

  // Time and values
  const [currentTime, setCurrentTime] = useState(moment());
  const [clockIn, setClockIn] = useState(null);
  const [clockOut, setClockOut] = useState(null);
  const [shiftHours, setShiftHours] = useState(null);
  const [clockInSeconds, setClockInSeconds] = useState(null);
  const [remainingShiftTime, setRemainingShiftTime] = useState(null);

  // Overview counts (current month)
  const [presentCount, setPresentCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);
  const [lateCount, setLateCount] = useState(0);
  const [earlyOutCount, setEarlyOutCount] = useState(0);
  const [overviewPresentColor, setOverviewPresentColor] = useState('');
  const [overviewAbsentColor, setOverviewAbsentColor] = useState('');
  const [overviewLateColor, setOverviewLateColor] = useState('');
  const [overviewEarlyOutColor, setOverviewEarlyOutColor] = useState('');

  const {userData} = useSelector(state => state.user || {});
  const navigation = useNavigation();
  const selectedLegalEntity = useSelector(
    state => state.company.selectedLegalEntity,
  );

  // Location & geofence caches
  const lastCoordsRef = useRef(null);
  const watchIdRef = useRef(null);
  const geofenceCacheRef = useRef({sites: [], ts: 0});
  const permissionStatusRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const netInfoUnsubscribeRef = useRef(null);

  const lastGeofenceErrorRef = useRef(null);

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  // Block concurrent mark attempts
  const markInFlightRef = useRef(false);

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(moment()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load queue counts
  const updateQueueCounts = useCallback(async () => {
    const queue = await loadOfflineAttendanceQueue();
    setOfflineQueueCount(queue.length);
    const failed = await loadFailedAttendanceQueue();
    setFailedQueueCount(failed.length);
  }, []);

  // ─── TODAY register ────────────────────────────────────────────────────────
  const fetchAttendanceRegister = useCallback(async () => {
    if (!userData?.employeeId) return;
    try {
      setLoadingRegister(true);
      const fromDate = moment().format('YYYY-MM-DD');
      const data = await GetAttendanceRegister({
        employeeId: userData.employeeId,
        attendanceDate: fromDate,
      });

      if (Array.isArray(data) && data.length > 0) {
        const record = data[0];
        const inSec = record?.ClockIn != null ? Number(record.ClockIn) : null;
        const outSec =
          record?.ClockOut != null ? Number(record.ClockOut) : null;
        const inTime = secondsTo12Hour(inSec);
        const outTime = secondsTo12Hour(outSec);

        if (inSec != null && outSec != null && inSec === outSec) {
          setClockIn(inTime);
          setClockOut(null);
        } else {
          setClockIn(inTime ?? null);
          setClockOut(outTime ?? null);
        }

        if (record?.ShiftHours != null && inSec != null) {
          setShiftHours(Number(record.ShiftHours));
          setClockInSeconds(inSec);
        } else {
          setShiftHours(null);
          setClockInSeconds(null);
        }
      } else {
        setClockIn(null);
        setClockOut(null);
        setShiftHours(null);
        setClockInSeconds(null);
        setRemainingShiftTime(null);
      }
    } catch {
      setAlertMessage('Unable to load attendance');
      setAlertModal(true);
    } finally {
      setLoadingRegister(false);
    }
  }, [userData?.employeeId]);

  // ─── Overview summary ──────────────────────────────────────────────────────
  const fetchOverviewSummary = useCallback(async () => {
    if (!userData?.employeeId) return;
    try {
      const fromDate = moment().startOf('month').format('YYYY-MM-DD');
      const toDate = moment().endOf('month').format('YYYY-MM-DD');
      const summary = await getRegisterSummaryColorByDate({
        employeeId: userData.employeeId,
        fromDate,
        toDate,
      });

      if (Array.isArray(summary) && summary.length > 0) {
        const s = summary[0] || {};
        setPresentCount(Number(s.PresentCount ?? 0));
        setAbsentCount(Number(s.AbsentCount ?? 0));
        setLateCount(Number(s.LateArrivalCount ?? 0));
        setEarlyOutCount(Number(s.EarlyOutCount ?? 0));
        setOverviewPresentColor(String(s.PresentColor));
        setOverviewAbsentColor(String(s.AbsentColor));
        setOverviewLateColor(String(s.LateArrivalColor));
        setOverviewEarlyOutColor(String(s.EarlyOutColor));
      } else {
        setPresentCount(0);
        setAbsentCount(0);
        setLateCount(0);
        setEarlyOutCount(0);
        setOverviewPresentColor('');
        setOverviewAbsentColor('');
        setOverviewLateColor('');
        setOverviewEarlyOutColor('');
      }
    } catch {
      // keep existing values
    }
  }, [userData?.employeeId]);

  // ─── Geofences (persistent cache) ─────────────────────────────────────────
  const getGeofencesCached = useCallback(async (forceRefresh = false) => {
    const now = Date.now();

    if (forceRefresh) {
      const sites = await GetGPSCoordinates().catch(() => []);
      const clean = Array.isArray(sites) ? sites : [];
      geofenceCacheRef.current = {sites: clean, ts: Date.now()};
      saveGeofences(clean);
      return clean;
    }

    if (
      geofenceCacheRef.current.sites.length &&
      now - geofenceCacheRef.current.ts < GEO_TTL_MS
    ) {
      return geofenceCacheRef.current.sites;
    }

    const persisted = await loadGeofences();
    if (persisted.sites.length && now - persisted.ts < GEO_TTL_MS) {
      geofenceCacheRef.current = {sites: persisted.sites, ts: persisted.ts};
      return persisted.sites;
    }

    const sites = await GetGPSCoordinates().catch(() => []);
    const clean = Array.isArray(sites) ? sites : [];
    geofenceCacheRef.current = {sites: clean, ts: Date.now()};
    saveGeofences(clean);
    return clean;
  }, []);

  // ─── Validate attendance against geofences (reuses online validation logic) ───
  const validateAttendanceWithGeofences = useCallback(
    async (latitude, longitude, accuracy, deviceIP) => {
      try {
        const freshSites = await getGeofencesCached(false);

        if (!Array.isArray(freshSites) || freshSites.length === 0) {
          return {
            isValid: false,
            reason: 'No office geofence available from D365.',
          };
        }

        const matchResult = findMatchingGeofence(
          latitude,
          longitude,
          accuracy,
          deviceIP,
          freshSites,
        );

        if (!matchResult) {
          return {
            isValid: false,
            reason:
              'No matching geofence found. Please check your location and network connection.',
          };
        }

        if (matchResult.matchedBy === 'both') {
          if (matchResult.effectiveDistance > matchResult.radius) {
            const displayDist = Math.max(0, Math.round(matchResult.distance));
            return {
              isValid: false,
              reason: `You are ~${displayDist}m from office (±${Math.round(
                accuracy,
              )}m). Must be within ${Math.round(matchResult.radius)}m.`,
            };
          }
          return {isValid: true};
        } else if (matchResult.matchedBy === 'ip_only') {
          const distToCorrectLocation = Math.round(
            matchResult.distanceToIPMatch || matchResult.distance,
          );
          return {
            isValid: false,
            reason: `Your location is ${distToCorrectLocation}m from the authorized location for this IP. Please move to the correct location.`,
          };
        } else if (matchResult.matchedBy === 'location_only') {
          return {
            isValid: false,
            reason:
              'Please connect to the office network for attendance marking.',
          };
        } else {
          return {
            isValid: false,
            reason:
              'Please ensure you are at the office and connected to the office network.',
          };
        }
      } catch (error) {
        return {
          isValid: false,
          reason: error?.message || 'Validation failed',
        };
      }
    },
    [getGeofencesCached, findMatchingGeofence],
  );

  // ─── Process offline queue with validation ─────────────────────────────────
  const processOfflineQueue = useCallback(async () => {
    const isOnline = await checkInternetConnectivity();
    if (!isOnline) return;

    const queue = await loadOfflineAttendanceQueue();
    if (queue.length === 0) return;

    setProcessingOffline(true);
    console.log(
      `Processing ${queue.length} offline attendance records with validation`,
    );

    const failedRecords = [];
    const successCount = 0;
    const failureDetails = [];

    for (const record of queue) {
      try {
        // Get current device IP for validation
        const currentDeviceIP = await getDeviceIPAddress();

        // Parse coordinates from the stored location string
        const locationMatch = record.location.match(
          /([-+]?\d+\.\d+),\s*([-+]?\d+\.\d+)/,
        );
        let latitude,
          longitude,
          accuracy = 150;

        if (locationMatch) {
          latitude = parseFloat(locationMatch[1]);
          longitude = parseFloat(locationMatch[2]);

          // Try to extract accuracy if present
          const accuracyMatch = record.location.match(/±(\d+)m/);
          if (accuracyMatch) {
            accuracy = parseInt(accuracyMatch[1], 10);
          }
        } else {
          // If we can't parse coordinates, we can't validate properly
          throw new Error('Invalid location data in offline record');
        }

        // STEP 1: Validate with current geofences and IP
        const validation = await validateAttendanceWithGeofences(
          latitude,
          longitude,
          accuracy,
          currentDeviceIP,
        );

        if (!validation.isValid) {
          // Validation failed - move to failed queue with reason
          await saveFailedAttendance(record, validation.reason);
          await removeOfflineAttendanceRecord(record.id);
          failureDetails.push({
            id: record.id,
            reason: validation.reason,
            timestamp: record.punchDateTime,
          });
          continue;
        }

        // STEP 2: Validation passed - try to submit to API
        const payload = {
          employeeId: record.employeeId,
          punchDateTime: record.punchDateTime,
          location: `${record.location} (synced from offline)`,
          machineIPAddress: currentDeviceIP || record.machineIPAddress,
          isOfflineSync: true,
          originalOfflineTimestamp: record.createdAt,
        };

        const response = await CreateAttendance(payload);

        if (response?.isSuccess || response === true) {
          // Success - remove from queue
          await removeOfflineAttendanceRecord(record.id);
          // eslint-disable-next-line no-const-assign
          successCount++;
          console.log('Successfully synced offline record:', record.id);
        } else {
          // API returned failure - retry logic
          record.retryCount += 1;
          record.lastAttempt = moment().toISOString();

          if (record.retryCount < 3) {
            failedRecords.push(record);
          } else {
            // Max retries exceeded - move to failed queue
            await saveFailedAttendance(
              record,
              response?.message || 'Max retries exceeded',
            );
            await removeOfflineAttendanceRecord(record.id);
            failureDetails.push({
              id: record.id,
              reason: response?.message || 'Max retries exceeded',
              timestamp: record.punchDateTime,
            });
          }
        }
      } catch (error) {
        console.log('Error syncing offline record:', record.id, error);
        record.retryCount += 1;
        record.lastAttempt = moment().toISOString();

        if (record.retryCount < 3) {
          failedRecords.push(record);
        } else {
          // Max retries exceeded - move to failed queue
          await saveFailedAttendance(record, error?.message || 'Network error');
          await removeOfflineAttendanceRecord(record.id);
          failureDetails.push({
            id: record.id,
            reason: error?.message || 'Network error',
            timestamp: record.punchDateTime,
          });
        }
      }
    }

    // Update queue with failed records
    await AsyncStorage.setItem(
      OFFLINE_ATTENDANCE_KEY,
      JSON.stringify(failedRecords),
    );

    setProcessingOffline(false);
    updateQueueCounts();

    // Show appropriate message
    const processedCount = queue.length - failedRecords.length;
    if (processedCount > 0) {
      let message = `${processedCount} offline attendance record${
        processedCount > 1 ? 's' : ''
      } synced successfully.`;

      if (failureDetails.length > 0) {
        message += `\n\n${failureDetails.length} record${
          failureDetails.length > 1 ? 's' : ''
        } failed:`;
        failureDetails.slice(0, 2).forEach(f => {
          message += `\n• ${f.reason}`; // Removed the timestamp
        });
        if (failureDetails.length > 2) {
          message += `\n• ...and ${failureDetails.length - 2} more`;
        }
      }

      setAlertMessage(message);
      setAlertModal(true);

      // Refresh UI
      fetchAttendanceRegister();
      fetchOverviewSummary();
    }
  }, [
    fetchAttendanceRegister,
    fetchOverviewSummary,
    updateQueueCounts,
    validateAttendanceWithGeofences,
  ]);

  // ─── IMMEDIATE SYNC when internet returns ─────────────────────────────────
  useEffect(() => {
    // Set up NetInfo listener for immediate connectivity changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const hasInternet =
        state.isConnected && state.isInternetReachable !== false;

      if (hasInternet) {
        console.log('Internet connection detected - attempting immediate sync');
        // Check if we have offline records
        loadOfflineAttendanceQueue().then(queue => {
          if (queue.length > 0) {
            // Small delay to ensure network is fully ready
            setTimeout(() => {
              processOfflineQueue();
            }, 1000);
          }
        });
      }
    });

    netInfoUnsubscribeRef.current = unsubscribe;

    return () => {
      if (netInfoUnsubscribeRef.current) {
        netInfoUnsubscribeRef.current();
      }
    };
  }, [processOfflineQueue]);

  // ─── App foreground sync ───────────────────────────────────────────────────
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground - check for internet and sync
        checkInternetConnectivity().then(isOnline => {
          if (isOnline) {
            processOfflineQueue();
          }
        });
      }
      appStateRef.current = nextAppState;
    });

    // Initial check
    checkInternetConnectivity().then(isOnline => {
      if (isOnline) {
        processOfflineQueue();
      }
    });

    return () => subscription.remove();
  }, [processOfflineQueue]);

  // ─── Periodic fallback check (every 2 min) ─────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      checkInternetConnectivity().then(isOnline => {
        if (isOnline) {
          processOfflineQueue();
        }
      });
    }, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [processOfflineQueue]);

  // ─── Refresh on legal entity change ───────────────────────────────────────
  useEffect(() => {
    if (userData?.employeeId) {
      lastCoordsRef.current = null;
      geofenceCacheRef.current = {sites: [], ts: 0};
      fetchAttendanceRegister();
      fetchOverviewSummary();
      getGeofencesCached(true);
      updateQueueCounts();
    }
  }, [
    fetchAttendanceRegister,
    fetchOverviewSummary,
    getGeofencesCached,
    selectedLegalEntity,
    userData?.employeeId,
    updateQueueCounts,
  ]);

  // ─── Initial loads ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchAttendanceRegister();
    fetchOverviewSummary();
    getGeofencesCached();
    updateQueueCounts();
  }, [
    fetchAttendanceRegister,
    fetchOverviewSummary,
    getGeofencesCached,
    updateQueueCounts,
  ]);

  // ─── Remaining shift timer ─────────────────────────────────────────────────
  useEffect(() => {
    if (!shiftHours || !clockInSeconds) {
      setRemainingShiftTime(null);
      return;
    }
    const interval = setInterval(() => {
      const nowSeconds = moment().diff(moment().startOf('day'), 'seconds');
      const elapsed = nowSeconds - clockInSeconds;
      const remaining = shiftHours - elapsed;
      setRemainingShiftTime(remaining > 0 ? remaining : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [shiftHours, clockInSeconds]);

  // ─── Helpers for UI ────────────────────────────────────────────────────────
  const secondsTo12Hour = seconds => {
    if (seconds == null || seconds === 0) return null;
    const date = new Date(0);
    date.setSeconds(seconds);
    return moment.utc(date).format('hh:mm A');
  };

  const formatSeconds = totalSeconds => {
    if (totalSeconds == null) return '-';
    const duration = moment.duration(totalSeconds, 'seconds');
    const hours = String(Math.floor(duration.asHours())).padStart(2, '0');
    const minutes = String(duration.minutes()).padStart(2, '0');
    const seconds = String(duration.seconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  // ─── Permissions + warm watch ──────────────────────────────────────────────
  const ensureLocationPermission = useCallback(async () => {
    if (permissionStatusRef.current === true) return true;
    try {
      if (Platform.OS === 'android') {
        const fine = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (fine) {
          permissionStatusRef.current = true;
          return true;
        }
        const coarse = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        );
        if (coarse) {
          permissionStatusRef.current = true;
          return true;
        }

        const fineResult = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'We need your location to verify attendance',
            buttonNeutral: 'Ask Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (fineResult === PermissionsAndroid.RESULTS.GRANTED) {
          permissionStatusRef.current = true;
          return true;
        }

        const coarseResult = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        );
        permissionStatusRef.current =
          coarseResult === PermissionsAndroid.RESULTS.GRANTED;
        return permissionStatusRef.current;
      } else {
        const auth = await Geolocation.requestAuthorization('whenInUse');
        permissionStatusRef.current = auth === 'granted';
        return permissionStatusRef.current;
      }
    } catch {
      permissionStatusRef.current = false;
      return false;
    }
  }, []);

  const startWarmWatch = useCallback(() => {
    if (watchIdRef.current != null) return;
    try {
      const id = Geolocation.watchPosition(
        pos => {
          const c = (pos && pos.coords) || {};
          lastCoordsRef.current = {...c, timestamp: Date.now()};
        },
        () => {},
        {
          enableHighAccuracy: true,
          distanceFilter: 0,
          interval: 3000,
          fastestInterval: 2000,
          useSignificantChanges: false,
        },
      );
      watchIdRef.current = id;
    } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      const ok = await ensureLocationPermission();
      if (!ok) {
        setAlertMessage(
          'Location permission is required to mark attendance. Please enable it in Settings.',
        );
        setAlertModal(true);
        return;
      }
      startWarmWatch();
    })();
    return () => {
      if (watchIdRef.current != null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [ensureLocationPermission, startWarmWatch]);

  const tryGetPosition = opts =>
    new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        pos => resolve(pos.coords),
        err => reject(err),
        opts,
      );
    });

  const getCurrentLocationFast = useCallback(async () => {
    const now = Date.now();
    const cached = lastCoordsRef.current;

    if (
      cached?.timestamp &&
      now - cached.timestamp < FRESH_FIX_MS &&
      (cached.accuracy ?? 9999) <= MAX_ALLOWED_ACCURACY
    ) {
      return cached;
    }

    const lowP = tryGetPosition({
      enableHighAccuracy: false,
      timeout: 3000,
      maximumAge: 15000,
    });
    const hiP = tryGetPosition({
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 10000,
    });

    let first;
    try {
      first = await Promise.race([lowP, hiP]);
    } catch {
      if (lastCoordsRef.current) return lastCoordsRef.current;
      first = await tryGetPosition({
        enableHighAccuracy: true,
        timeout: 4000,
        maximumAge: 5000,
      });
    }

    lastCoordsRef.current = {...first, timestamp: Date.now()};
    return first;
  }, []);

  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const toRad = d => (d * Math.PI) / 180;
    const R = 6371e3;
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const dφ = toRad(lat2 - lat1);
    const dλ = toRad(lon2 - lon1);
    const a =
      Math.sin(dφ / 2) * Math.sin(dφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) * Math.sin(dλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const findMatchingGeofence = useCallback(
    (userLat, userLon, accuracy, deviceIP, points) => {
      if (!points || points.length === 0) return null;

      let bestLocationMatch = null;
      let ipMatchFound = false;
      let ipMatchRecord = null;

      for (const p of points) {
        const lat1 = Number(p.latitude);
        const lon1 = Number(p.longitude);
        const radius = Number(p.radius);
        const geofenceIP = p.machineIPAddress;

        if (
          !Number.isFinite(lat1) ||
          !Number.isFinite(lon1) ||
          !Number.isFinite(radius)
        )
          continue;

        const distance = calculateDistance(userLat, userLon, lat1, lon1);
        const acc = Number.isFinite(accuracy) ? Math.max(0, accuracy) : 0;
        const effectiveDistance = Math.max(0, distance - Math.min(acc, radius));
        const isWithinRange = effectiveDistance <= radius;
        const ipMatches = !geofenceIP || geofenceIP === deviceIP;

        if (geofenceIP === deviceIP) {
          ipMatchFound = true;
          ipMatchRecord = p;
        }

        if (isWithinRange && ipMatches) {
          return {
            latitude: lat1,
            longitude: lon1,
            radius,
            machineIPAddress: geofenceIP,
            distance,
            effectiveDistance,
            matchedBy: 'both',
          };
        }

        if (!bestLocationMatch || distance < bestLocationMatch.distance) {
          bestLocationMatch = {
            latitude: lat1,
            longitude: lon1,
            radius,
            machineIPAddress: geofenceIP,
            distance,
            effectiveDistance,
          };
        }
      }

      if (ipMatchFound && ipMatchRecord) {
        const distance = calculateDistance(
          userLat,
          userLon,
          Number(ipMatchRecord.latitude),
          Number(ipMatchRecord.longitude),
        );
        return {
          ...bestLocationMatch,
          failureReason: 'location',
          ipMatchRecord,
          distanceToIPMatch: distance,
          matchedBy: 'ip_only',
        };
      } else if (
        bestLocationMatch &&
        bestLocationMatch.effectiveDistance <= bestLocationMatch.radius
      ) {
        return {
          ...bestLocationMatch,
          failureReason: 'ip',
          matchedBy: 'location_only',
        };
      } else {
        return {
          ...bestLocationMatch,
          failureReason: 'both',
          matchedBy: 'none',
        };
      }
    },
    [calculateDistance],
  );

  const refreshAfterMark = useCallback(() => {
    try {
      fetchAttendanceRegister();
      fetchOverviewSummary();
      updateQueueCounts();
    } catch {}
  }, [fetchAttendanceRegister, fetchOverviewSummary, updateQueueCounts]);

  // ─── Save and queue attendance ────────────────────────────────────────────
  const saveAndQueueAttendance = useCallback(
    async (payload, reason) => {
      const saved = await saveOfflineAttendance(payload);
      setLoadingAttendance(false);
      markInFlightRef.current = false;

      if (saved) {
        setAlertMessage(
          reason ||
            'Internet is not available right now. Your attendance will be marked automatically once internet is available.',
        );
        setAlertModal(true);
        refreshAfterMark();
      } else {
        setAlertMessage('Failed to save attendance. Please try again.');
        setAlertModal(true);
      }
    },
    [refreshAfterMark],
  );

  // ─── Main attendance handler ───────────────────────────────────────────────
  const handleAttendance = useCallback(async () => {
    if (markInFlightRef.current) return;
    markInFlightRef.current = true;

    try {
      setLoadingAttendance(true);
      setLoadingGeo(true);

      // ── 1. Check real internet connectivity
      const isOnline = await checkInternetConnectivity();

      // ── 2. Get IP (may be null if offline)
      const deviceIP = isOnline ? await getDeviceIPAddress() : null;

      console.log('Device IP:', deviceIP, '| Is Online:', isOnline);

      const forceRefresh = lastGeofenceErrorRef.current !== null;

      // ── 3. Get GPS coordinates (works fully offline)
      const coords = await getCurrentLocationFast();

      setLoadingGeo(false);

      if (!coords?.latitude || !coords?.longitude) {
        lastGeofenceErrorRef.current = 'Unable to get location from device.';
        throw new Error(lastGeofenceErrorRef.current);
      }

      const {latitude, longitude, accuracy = 9999} = coords;

      // ── 4. Build payload
      const payload = {
        employeeId: userData?.employeeId,
        punchDateTime: moment().format('YYYY-MM-DDTHH:mm:ss[Z]'),
        location: `${latitude},${longitude} (±${Math.round(accuracy)}m)${
          deviceIP ? ` - IP: ${deviceIP}` : ''
        }`,
        machineIPAddress: deviceIP || 'unknown',
      };

      // ── 5. OFFLINE PATH — save for later sync
      if (!isOnline) {
        console.log('Offline mode — queuing attendance');
        await saveAndQueueAttendance(
          payload,
          'No internet connection. Your attendance has been saved and will sync automatically when connectivity is restored.',
        );
        return;
      }

      // ── 6. ONLINE PATH — geofence verification
      const freshSites = await getGeofencesCached(forceRefresh);

      if (!Array.isArray(freshSites) || freshSites.length === 0) {
        lastGeofenceErrorRef.current =
          'No office geofence available from D365.';
        throw new Error(lastGeofenceErrorRef.current);
      }

      const matchResult = findMatchingGeofence(
        latitude,
        longitude,
        accuracy,
        deviceIP,
        freshSites,
      );

      if (!matchResult) {
        lastGeofenceErrorRef.current =
          'No matching geofence found. Please check your location and network connection.';
        throw new Error(lastGeofenceErrorRef.current);
      }

      if (matchResult.matchedBy === 'both') {
        if (matchResult.effectiveDistance > matchResult.radius) {
          const displayDist = Math.max(0, Math.round(matchResult.distance));
          lastGeofenceErrorRef.current = `You are ~${displayDist}m from office (±${Math.round(
            accuracy,
          )}m). Must be within ${Math.round(matchResult.radius)}m.`;
          throw new Error(lastGeofenceErrorRef.current);
        }
      } else if (matchResult.matchedBy === 'ip_only') {
        const distToCorrectLocation = Math.round(
          matchResult.distanceToIPMatch || matchResult.distance,
        );
        lastGeofenceErrorRef.current = `Your location is ${distToCorrectLocation}m from the authorized location for this IP. Please move to the correct location.`;
        throw new Error(lastGeofenceErrorRef.current);
      } else if (matchResult.matchedBy === 'location_only') {
        lastGeofenceErrorRef.current =
          'Please connect to the office network for attendance marking.';
        throw new Error(lastGeofenceErrorRef.current);
      } else {
        lastGeofenceErrorRef.current =
          'Please ensure you are at the office and connected to the office network.';
        throw new Error(lastGeofenceErrorRef.current);
      }

      // ── 7. All checks passed — attempt API call
      lastGeofenceErrorRef.current = null;

      let response;
      try {
        response = await CreateAttendance(payload);
      } catch (apiErr) {
        console.log(
          'API call failed, falling back to offline queue:',
          apiErr?.message,
        );
        await saveAndQueueAttendance(
          payload,
          'Could not reach the server right now. Your attendance has been saved and will sync automatically.',
        );
        return;
      }

      if (response?.isSuccess || response === true) {
        setLoadingAttendance(false);
        markInFlightRef.current = false;
        setAlertMessage('Attendance recorded successfully');
        setAlertModal(true);
        refreshAfterMark();
        return;
      }

      // ── API returned a failure response — fall back to offline queue
      console.log('API returned failure, falling back to offline queue');
      await saveAndQueueAttendance(
        payload,
        response?.message
          ? `Server: ${response.message}. Your attendance has been saved offline and will sync automatically.`
          : 'Failed to save attendance on server. Saved offline — will sync when available.',
      );
    } catch (err) {
      setAlertMessage(err?.message || 'Failed to mark attendance.');
      setAlertModal(true);
    } finally {
      setLoadingGeo(false);
      setLoadingAttendance(false);
      markInFlightRef.current = false;
    }
  }, [
    getGeofencesCached,
    getCurrentLocationFast,
    userData?.employeeId,
    findMatchingGeofence,
    refreshAfterMark,
    saveAndQueueAttendance,
  ]);

  // ─── Manual sync ───────────────────────────────────────────────────────────
  const handleManualSync = useCallback(async () => {
    if (processingOffline) return;

    const isOnline = await checkInternetConnectivity();
    if (!isOnline) {
      setAlertMessage(
        'Still no internet connection. Attendance will sync automatically when connectivity is restored.',
      );
      setAlertModal(true);
      return;
    }

    setAlertMessage('Syncing offline attendance records...');
    setAlertModal(true);
    await processOfflineQueue();
  }, [processingOffline, processOfflineQueue]);

  // ─── Pull-to-refresh ───────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        fetchAttendanceRegister(),
        fetchOverviewSummary(),
        getGeofencesCached(true),
        processOfflineQueue(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [
    fetchAttendanceRegister,
    fetchOverviewSummary,
    getGeofencesCached,
    processOfflineQueue,
  ]);

  // ─── Render ────────────────────────────────────────────────────────────────
  const renderHomeScreen = () => (
    <View style={styles.homeRoot}>
      {/* Offline Queue Indicator */}
      {(offlineQueueCount > 0 || failedQueueCount > 0) && (
        <View>
          {offlineQueueCount > 0 && (
            <TouchableOpacity
              style={styles.offlineIndicator}
              onPress={handleManualSync}
              disabled={processingOffline}>
              <Icon name="cloud-off" size={20} color="#FFA000" />
              <Text style={styles.offlineText}>
                {processingOffline
                  ? 'Syncing...'
                  : `${offlineQueueCount} offline attendance${
                      offlineQueueCount > 1 ? 's' : ''
                    } pending sync`}
              </Text>
              {!processingOffline && (
                <Icon name="sync" size={20} color={brand.primaryStrong} />
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.timeContainer}>
        <Text numberOfLines={1} adjustsFontToSizeFit style={styles.timeText}>
          {currentTime.format('hh:mm:ss A')}
        </Text>
        <Text numberOfLines={1} adjustsFontToSizeFit style={styles.dateText}>
          {currentTime.format('dddd, MMM D, YYYY')}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <InfoItem
          icon="login"
          label="Clock In"
          value={clockIn}
          loading={loadingRegister}
        />
        <InfoItem
          icon="logout"
          label="Clock Out"
          value={clockOut}
          loading={loadingRegister}
        />
        <InfoItem
          icon="access-time"
          label="Remaining"
          value={formatSeconds(remainingShiftTime)}
          loading={loadingRegister}
        />
      </View>

      <View style={styles.centeredButtonContainer}>
        <AttendanceButton
          onPress={handleAttendance}
          loading={loadingAttendance || loadingGeo}
        />
        {loadingGeo ? (
          <Text style={{marginTop: 8, color: '#757575', fontSize: 12}}>
            Getting location and verifying…
          </Text>
        ) : null}
      </View>

      <View style={styles.quickSummaryCard}>
        <View style={styles.quickSummaryHeaderRow}>
          <Text style={styles.quickSummaryTitle}>This Month Overview</Text>
        </View>
        <View style={styles.quickSummaryRow}>
          <View className="item" style={styles.quickSummaryItem}>
            <Text
              style={[styles.quickSummaryValue, {color: overviewPresentColor}]}>
              {String(presentCount)}
            </Text>
            <Text style={styles.quickSummaryLabel}>Present</Text>
          </View>
          <View className="item" style={styles.quickSummaryItem}>
            <Text
              style={[styles.quickSummaryValue, {color: overviewAbsentColor}]}>
              {String(absentCount)}
            </Text>
            <Text style={styles.quickSummaryLabel}>Absent</Text>
          </View>
          <View className="item" style={styles.quickSummaryItem}>
            <Text
              style={[styles.quickSummaryValue, {color: overviewLateColor}]}>
              {String(lateCount)}
            </Text>
            <Text style={styles.quickSummaryLabel}>Late</Text>
          </View>
          <View className="item" style={styles.quickSummaryItem}>
            <Text
              style={[
                styles.quickSummaryValue,
                {color: overviewEarlyOutColor},
              ]}>
              {String(earlyOutCount)}
            </Text>
            <Text style={styles.quickSummaryLabel}>Early Out</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <ActionPaneContainer
      pageTitle="Attendance"
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}>
      <View style={styles.container}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          alwaysBounceVertical
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          {renderHomeScreen()}
        </ScrollView>
      </View>
      <AlertModal
        visible={alertModal}
        heading="Alert"
        text={alertMessage}
        onPress={() => setAlertModal(false)}
      />
    </ActionPaneContainer>
  );
};

const PAD = SCREEN_WIDTH * 0.05;
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F5F5F5'},
  content: {flex: 1},
  contentContainer: {flexGrow: 1, paddingBottom: 8},
  homeRoot: {
    flex: 1,
    padding: PAD,
    backgroundColor: '#F5F5F5',
    justifyContent: 'space-between',
    gap: 10,
  },
  timeContainer: {alignItems: 'center', marginBottom: 8},
  timeText: {
    fontSize: isSmallDevice ? 34 : 46,
    fontWeight: '800',
    color: brand.primaryStrong,
    textAlign: 'center',
  },
  dateText: {
    fontSize: isSmallDevice ? 13 : 15,
    color: '#757575',
    marginTop: 6,
    marginBottom: 10,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: isSmallDevice ? 10 : 14,
    borderRadius: 12,
    elevation: 2,
    flexWrap: 'wrap',
    gap: 8,
  },
  centeredButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: isSmallDevice ? 140 : 180,
  },
  quickSummaryCard: {
    backgroundColor: '#FFF',
    padding: isSmallDevice ? 12 : 16,
    borderRadius: 12,
    elevation: 2,
  },
  quickSummaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 2,
    columnGap: 12,
  },
  quickSummaryTitle: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: 'bold',
    color: brand.primaryStrong,
  },
  quickSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  quickSummaryItem: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  quickSummaryValue: {fontSize: isSmallDevice ? 18 : 22, fontWeight: 'bold'},
  quickSummaryLabel: {
    fontSize: isSmallDevice ? 10 : 12,
    color: '#757575',
    marginTop: 4,
    textAlign: 'center',
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    gap: 8,
  },
  offlineText: {
    fontSize: 14,
    color: '#FFA000',
    flex: 1,
    textAlign: 'center',
  },
});

export default CreateAttendanceScreen;
