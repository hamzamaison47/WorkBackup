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

// Screen sizing
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

/* =================== Tunables =================== */
const GEO_TTL_MS = 30 * 60 * 1000; // 30m for less frequent network calls
const FRESH_FIX_MS = 30 * 1000; // 30s to allow more cache hits
const MAX_ALLOWED_ACCURACY = 150; // Relaxed to 150m for faster fixes
const GEOF_KEY = 'df_geofences_v1';

/* =================== Helper to get device IP =================== */
const getDeviceIPAddress = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.log('Error getting device IP:', error);
    return null;
  }
};

/* =================== Helpers =================== */
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
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [loadingGeo, setLoadingGeo] = useState(false);

  // UI
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Time and values
  const [currentTime, setCurrentTime] = useState(moment());
  const [clockIn, setClockIn] = useState(null);
  const [clockOut, setClockOut] = useState(null);
  const [shiftHours, setShiftHours] = useState(null);
  const [clockInSeconds, setClockInSeconds] = useState(null);
  const [remainingShiftTime, setRemainingShiftTime] = useState(null);

  // Overview counts (ALWAYS current month)
  const [presentCount, setPresentCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);
  const [lateCount, setLateCount] = useState(0);
  const [earlyOutCount, setEarlyOutCount] = useState(0);
  const [overviewPresentColor, setOverviewPresentColor] = useState('');
  const [overviewAbsentColor, setOverviewAbsentColor] = useState('');
  const [overviewLateColor, setOverviewLateColor] = useState('');
  const [overviewEarlyOutColor, setOverviewEarlyOutColor] = useState('');

  // Summary counts (DEPEND on selected month)
  const [summaryPresentCount, setSummaryPresentCount] = useState(0);
  const [summaryAbsentCount, setSummaryAbsentCount] = useState(0);
  const [summaryLateCount, setSummaryLateCount] = useState(0);
  const [summaryEarlyOutCount, setSummaryEarlyOutCount] = useState(0);
  const [summaryLeaveCount, setSummaryLeaveCount] = useState(0);
  const [summaryOffDayCount, setSummaryOffDayCount] = useState(0);
  const [summaryGazettedDayCount, setSummaryGazettedDayCount] = useState(0);
  const [summaryErrorCount, setSummaryErrorCount] = useState(0);
  const [summaryPresentColor, setSummaryPresentColor] = useState('');
  const [summaryAbsentColor, setSummaryAbsentColor] = useState('');
  const [summaryLateColor, setSummaryLateColor] = useState('');
  const [summaryEarlyOutColor, setSummaryEarlyOutColor] = useState('');
  const [summaryLeaveColor, setSummaryLeaveColor] = useState('');
  const [summaryOffDayColor, setSummaryOffDayColor] = useState('');
  const [summaryGazettedDayColor, setSummaryGazettedDayColor] = useState('');
  const [summaryErrorColor, setSummaryErrorColor] = useState('');

  // Month & View
  const [activeTab, setActiveTab] = useState('home');
  const [selectedMonthYM, setSelectedMonthYM] = useState({
    year: moment().year(),
    monthIndex: moment().month(),
  });

  const getSelectedRange = useCallback(() => {
    const m = moment()
      .year(selectedMonthYM.year)
      .month(selectedMonthYM.monthIndex);
    return {
      fromDate: m.clone().startOf('month').format('YYYY-MM-DD'),
      toDate: m.clone().endOf('month').format('YYYY-MM-DD'),
      label: m.clone().format('MMMM YYYY'),
      key: m.clone().format('YYYY-MM'),
    };
  }, [selectedMonthYM]);

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

  // Track last geofence error to force refresh on retry
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

  useEffect(() => {
    const unsub = navigation.addListener('blur', () => setActiveTab('home'));
    return unsub;
  }, [navigation]);

  // Add this useEffect to refresh data when legal entity changes
  useEffect(() => {
    if (userData?.employeeId) {
      // Clear all cached data
      lastCoordsRef.current = null;
      geofenceCacheRef.current = {sites: [], ts: 0};

      // Refresh all data
      fetchAttendanceRegister();
      fetchOverviewSummary();
      getGeofencesCached(true); // Force refresh geofences

      // If on summary tab, refresh monthly summary too
      if (activeTab === 'summary') {
        fetchMonthlySummary();
      }
    }
  }, [
    activeTab,
    fetchAttendanceRegister,
    fetchMonthlySummary,
    fetchOverviewSummary,
    getGeofencesCached,
    selectedLegalEntity,
    userData?.employeeId,
  ]);

  // Helpers for UI
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

  // TODAY register
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

  // Overview summary (current month)
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

  // Monthly summary (selected month)
  const fetchMonthlySummary = useCallback(async () => {
    if (!userData?.employeeId) return;
    try {
      setLoadingSummary(true);
      const {fromDate, toDate} = getSelectedRange();
      const summary = await getRegisterSummaryColorByDate({
        employeeId: userData.employeeId,
        fromDate,
        toDate,
      });

      if (Array.isArray(summary) && summary.length > 0) {
        const s = summary[0] || {};
        setSummaryPresentCount(Number(s.PresentCount ?? 0));
        setSummaryAbsentCount(Number(s.AbsentCount ?? 0));
        setSummaryLateCount(Number(s.LateArrivalCount ?? 0));
        setSummaryEarlyOutCount(Number(s.EarlyOutCount ?? 0));
        setSummaryLeaveCount(Number(s.LeaveCount ?? 0));
        setSummaryOffDayCount(Number(s.OffDayCount ?? 0));
        setSummaryGazettedDayCount(Number(s.GazettedDayCount ?? 0));
        setSummaryErrorCount(Number(s.ErrorCount ?? 0));

        setSummaryPresentColor(String(s.PresentColor));
        setSummaryAbsentColor(String(s.AbsentColor));
        setSummaryLateColor(String(s.LateArrivalColor));
        setSummaryEarlyOutColor(String(s.EarlyOutColor));
        setSummaryLeaveColor(String(s.LeaveColor));
        setSummaryOffDayColor(String(s.OffDayColor));
        setSummaryGazettedDayColor(String(s.GazettedDayColor));
        setSummaryErrorColor(String(s.ErrorColor));
      } else {
        setSummaryPresentCount(0);
        setSummaryAbsentCount(0);
        setSummaryLateCount(0);
        setSummaryEarlyOutCount(0);
        setSummaryLeaveCount(0);
        setSummaryOffDayCount(0);
        setSummaryGazettedDayCount(0);
        setSummaryErrorCount(0);
        setSummaryPresentColor('');
        setSummaryAbsentColor('');
        setSummaryLateColor('');
        setSummaryEarlyOutColor('');
        setSummaryLeaveColor('');
        setSummaryOffDayColor('');
        setSummaryGazettedDayColor('');
        setSummaryErrorColor('');
      }
    } catch {
      // ignore
    } finally {
      setLoadingSummary(false);
    }
  }, [userData?.employeeId, getSelectedRange]);

  // Geofences (persistent cache)
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

  // Initial loads
  useEffect(() => {
    fetchAttendanceRegister();
    fetchOverviewSummary();
    getGeofencesCached();
  }, [fetchAttendanceRegister, fetchOverviewSummary, getGeofencesCached]);

  // Reload summary when month changes or when entering summary tab
  useEffect(() => {
    if (activeTab === 'summary') fetchMonthlySummary();
  }, [fetchMonthlySummary, activeTab]);

  // Remaining shift timer
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

  // Permissions + warm watch
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

  // NEW FUNCTION: Find any geofence that matches both location AND IP
  const findMatchingGeofence = useCallback(
    (userLat, userLon, accuracy, deviceIP, points) => {
      if (!points || points.length === 0) return null;

      console.log('Checking all geofence records for match...');
      console.log('Device IP:', deviceIP);

      // Track the best location match for error messaging
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

        // Calculate distance
        const distance = calculateDistance(userLat, userLon, lat1, lon1);
        const acc = Number.isFinite(accuracy) ? Math.max(0, accuracy) : 0;
        const effectiveDistance = Math.max(0, distance - Math.min(acc, radius));
        const isWithinRange = effectiveDistance <= radius;

        // Check if IP matches (if geofence has an IP)
        const ipMatches = !geofenceIP || geofenceIP === deviceIP;

        console.log(`Geofence ${p.latitude},${p.longitude}:`, {
          geofenceIP,
          ipMatches,
          isWithinRange,
          distance: Math.round(distance),
          effectiveDistance: Math.round(effectiveDistance),
          radius,
        });

        // Track if we found an IP match
        if (geofenceIP === deviceIP) {
          ipMatchFound = true;
          ipMatchRecord = p;
        }

        // If both conditions are met, return this geofence immediately
        if (isWithinRange && ipMatches) {
          console.log('✅ Found matching geofence with both location and IP');
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

        // Track the best location match (for error messages)
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

      // No geofence satisfied both conditions
      console.log('❌ No geofence matched both location and IP');

      // Determine the failure reason
      if (ipMatchFound && ipMatchRecord) {
        // We found an IP match but location is wrong
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
        // Location matches but IP is wrong
        return {
          ...bestLocationMatch,
          failureReason: 'ip',
          matchedBy: 'location_only',
        };
      } else {
        // Neither matches
        return {
          ...bestLocationMatch,
          failureReason: 'both',
          matchedBy: 'none',
        };
      }
    },
    [calculateDistance],
  );

  // fire-and-forget helper so UI doesn't wait
  const refreshAfterMark = useCallback(() => {
    try {
      fetchAttendanceRegister();
      fetchOverviewSummary();
    } catch {}
  }, [fetchAttendanceRegister, fetchOverviewSummary]);

  const handleAttendance = useCallback(async () => {
    if (markInFlightRef.current) return;
    markInFlightRef.current = true;

    try {
      setLoadingAttendance(true);
      setLoadingGeo(true);

      // Get device IP address first
      const deviceIP = await getDeviceIPAddress();
      if (!deviceIP) {
        throw new Error(
          'Unable to get device IP address. Please check your network connection.',
        );
      }

      console.log('Device IP:', deviceIP);

      const forceRefresh = lastGeofenceErrorRef.current !== null;

      const [freshSites, coords] = await Promise.all([
        getGeofencesCached(forceRefresh),
        getCurrentLocationFast(),
      ]);

      console.log('All geofence records:', freshSites);

      setLoadingGeo(false);

      if (!Array.isArray(freshSites) || freshSites.length === 0) {
        lastGeofenceErrorRef.current =
          'No office geofence available from D365.';
        throw new Error(lastGeofenceErrorRef.current);
      }
      if (!coords?.latitude || !coords?.longitude) {
        lastGeofenceErrorRef.current = 'Invalid location from device';
        throw new Error(lastGeofenceErrorRef.current);
      }

      const {latitude, longitude, accuracy = 9999} = coords;

      // Find matching geofence (checks ALL records for both location AND IP)
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

      // Handle different match scenarios
      if (matchResult.matchedBy === 'both') {
        // Perfect match found - proceed with attendance
        console.log(
          'Found matching geofence with IP:',
          matchResult.machineIPAddress,
        );

        // Double-check range (should be true, but just to be safe)
        if (matchResult.effectiveDistance > matchResult.radius) {
          const displayDist = Math.max(0, Math.round(matchResult.distance));
          lastGeofenceErrorRef.current = `You are ~${displayDist}m from office (±${Math.round(
            accuracy,
          )}m). Must be within ${Math.round(matchResult.radius)}m.`;
          throw new Error(lastGeofenceErrorRef.current);
        }
      } else if (matchResult.matchedBy === 'ip_only') {
        // IP matches but location is wrong
        const distToCorrectLocation = Math.round(
          matchResult.distanceToIPMatch || matchResult.distance,
        );
        // lastGeofenceErrorRef.current = `You are connected to the correct network (IP: ${deviceIP}), but your location is ${distToCorrectLocation}m from the authorized location for this IP. Please move to the correct location.`;
        lastGeofenceErrorRef.current = `Your location is ${distToCorrectLocation}m from the authorized location for this IP. Please move to the correct location.`;

        throw new Error(lastGeofenceErrorRef.current);
      } else if (matchResult.matchedBy === 'location_only') {
        // Location matches but IP is wrong
        // lastGeofenceErrorRef.current = `Your location is correct, but your device IP (${deviceIP}) does not match the authorized office IP for this location. Please connect to the office network.`;
        lastGeofenceErrorRef.current =
          'Please connect to the office network for mark attendance.';

        throw new Error(lastGeofenceErrorRef.current);
      } else {
        // Neither matches
        // lastGeofenceErrorRef.current = `Your location (${displayDist}m from office) and IP (${deviceIP}) do not match any authorized office configuration. Please ensure you are at the office and connected to the office network.`;
        lastGeofenceErrorRef.current =
          'Please ensure you are at the office and connected to the office network.';

        throw new Error(lastGeofenceErrorRef.current);
      }

      // All checks passed - mark attendance
      lastGeofenceErrorRef.current = null;

      const payload = {
        employeeId: userData?.employeeId,
        punchDateTime: moment().format('YYYY-MM-DDTHH:mm:ss[Z]'),
        location: `${latitude},${longitude} (±${Math.round(
          accuracy,
        )}m) - IP: ${deviceIP}`,
        machineIPAddress: deviceIP,
      };

      const response = await CreateAttendance(payload);

      if (response?.isSuccess || response === true) {
        setLoadingAttendance(false);
        markInFlightRef.current = false;
        setAlertMessage('Attendance recorded successfully');
        setAlertModal(true);
        refreshAfterMark();
        return;
      }

      throw new Error(response?.message || 'Failed to save attendance');
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
  ]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      if (activeTab === 'home') {
        await Promise.all([
          fetchAttendanceRegister(),
          fetchOverviewSummary(),
          getGeofencesCached(true),
        ]);
      } else {
        await fetchMonthlySummary();
      }
    } finally {
      setRefreshing(false);
    }
  }, [
    activeTab,
    fetchAttendanceRegister,
    fetchOverviewSummary,
    fetchMonthlySummary,
    getGeofencesCached,
  ]);

  const renderHomeScreen = () => (
    <View style={styles.homeRoot}>
      <View style={styles.timeContainer}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.timeText}>
          {currentTime.format('hh:mm:ss A')}
        </Text>
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.dateText}>
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
            Getting location and verifying IP…
          </Text>
        ) : null}
      </View>

      <View style={styles.quickSummaryCard}>
        <View style={styles.quickSummaryHeaderRow}>
          <Text style={styles.quickSummaryTitle}>This Month Overview</Text>
          <TouchableOpacity
            onPress={() => setActiveTab('summary')}
            style={styles.summarySwitchBtn}
            activeOpacity={0.8}>
            <Text style={styles.summarySwitchBtnText}>Monthly Summary</Text>
            <Icon name="chevron-right" size={18} color="#1E88E5" />
          </TouchableOpacity>
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

  const renderMonthlySummary = () => {
    const keyForMonth = getSelectedRange().key;
    return (
      <View key={keyForMonth} style={styles.summaryRoot}>
        <View style={styles.topRow}>
          <TouchableOpacity
            onPress={() => setActiveTab('home')}
            style={styles.backBtn}
            activeOpacity={0.8}>
            <Icon name="chevron-left" size={20} color="#1E88E5" />
            <Text style={styles.backBtnText}>Overview</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.monthSelector}>
          <TouchableOpacity
            onPress={() =>
              setSelectedMonthYM(prev => {
                const m = moment()
                  .year(prev.year)
                  .month(prev.monthIndex)
                  .subtract(1, 'month');
                return {year: m.year(), monthIndex: m.month()};
              })
            }>
            <Icon name="chevron-left" size={28} color="#1E88E5" />
          </TouchableOpacity>
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.monthText}>
            {getSelectedRange().label}
          </Text>
          <TouchableOpacity
            onPress={() =>
              setSelectedMonthYM(prev => {
                const m = moment()
                  .year(prev.year)
                  .month(prev.monthIndex)
                  .add(1, 'month');
                return {year: m.year(), monthIndex: m.month()};
              })
            }>
            <Icon name="chevron-right" size={28} color="#1E88E5" />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardTitle}>Attendance Summary</Text>
          {loadingSummary ? (
            <ActivityIndicator
              size="large"
              color="#1E88E5"
              style={styles.loader}
            />
          ) : (
            <View style={styles.summaryList}>
              <SummaryItem
                label="Present Days"
                value={String(summaryPresentCount)}
                color={summaryPresentColor}
              />
              <SummaryItem
                label="Absent Days"
                value={String(summaryAbsentCount)}
                color={summaryAbsentColor}
              />
              <SummaryItem
                label="Late Arrivals"
                value={String(summaryLateCount)}
                color={summaryLateColor}
              />
              <SummaryItem
                label="Early Outs"
                value={String(summaryEarlyOutCount)}
                color={summaryEarlyOutColor}
              />
              <SummaryItem
                label="Leave Days"
                value={String(summaryLeaveCount)}
                color={summaryLeaveColor}
              />
              <SummaryItem
                label="Off Days"
                value={String(summaryOffDayCount)}
                color={summaryOffDayColor}
              />
              <SummaryItem
                label="Gazetted Days"
                value={String(summaryGazettedDayCount)}
                color={summaryGazettedDayColor}
              />
              <SummaryItem
                label="Error Days"
                value={String(summaryErrorCount)}
                color={summaryErrorColor}
              />
            </View>
          )}
        </View>
      </View>
    );
  };

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
          scrollEnabled={activeTab === 'summary'}
          alwaysBounceVertical
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          {activeTab === 'home' ? renderHomeScreen() : renderMonthlySummary()}
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
    color: '#1E88E5',
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
    color: '#1E88E5',
  },
  summarySwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    marginLeft: 6,
  },
  summarySwitchBtnText: {
    fontSize: isSmallDevice ? 11 : 12,
    color: '#1E88E5',
    fontWeight: '600',
    marginRight: 2,
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
  summaryRoot: {flex: 1, padding: PAD, backgroundColor: '#F5F5F5', gap: 10},
  topRow: {flexDirection: 'row', justifyContent: 'flex-start'},
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    alignSelf: 'flex-start',
  },
  backBtnText: {
    fontSize: isSmallDevice ? 12 : 13,
    color: '#1E88E5',
    fontWeight: '600',
    marginLeft: 2,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: isSmallDevice ? 10 : 12,
    borderRadius: 12,
    elevation: 2,
    minHeight: 52,
    justifyContent: 'space-between',
  },
  monthText: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: '600',
    color: '#1E88E5',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 10,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    padding: isSmallDevice ? 12 : 16,
    borderRadius: 12,
    elevation: 2,
    alignSelf: 'stretch',
  },
  summaryCardTitle: {
    fontSize: isSmallDevice ? 17 : 19,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginBottom: 8,
    textAlign: 'center',
  },
  summaryList: {gap: isSmallDevice ? 6 : 8},
  loader: {marginVertical: 16},
});

export default CreateAttendanceScreen;
