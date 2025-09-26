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
  ScrollView,
  Dimensions,
  Linking,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import moment from 'moment';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {CreateAttendance} from '../../API/Attendance/CreateAttendance';
import {GetAttendanceRegister} from '../../API/Attendance/GetAttendanceRegister';
import {GetRegisterDetails} from '../../API/Attendance/GetRegisterDetails';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import AlertModal from '../../components/Alert/AlertModal';
import {
  AttendanceButton,
  InfoItem,
  BottomTabs,
  SummaryItem,
} from '../../components/Attendance/AttendanceComponents';

// ===== Geofence constants
const OFFICE_LOCATION = {latitude: 31.462003, longitude: 74.30003};
const ALLOWED_RADIUS = 100; // meters

// Screen sizing
const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

const CreateAttendanceScreen = () => {
  // Loading states
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingRegister, setLoadingRegister] = useState(false);

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

  // Summary counts
  const [presentCount, setPresentCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);
  const [lateCount, setLateCount] = useState(0);
  const [earlyOutCount, setEarlyOutCount] = useState(0);

  // Month + tab
  const [selectedMonth, setSelectedMonth] = useState(moment());
  const [activeTab, setActiveTab] = useState('home');

  const {userData} = useSelector(state => state.user);

  // ===== location warm cache
  const lastCoordsRef = useRef(null);
  const watchIdRef = useRef(null);

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(moment()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Helpers
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

  // Data fetching
  const fetchAttendanceRegister = useCallback(async () => {
    if (!userData?.employeeId) return;
    try {
      setLoadingRegister(true);
      const fromDate = moment().format('YYYY-MM-DD');
      const data = await GetAttendanceRegister({
        employeeId: userData.employeeId,
        attendanceDate: fromDate,
      });

      if (data && data.length > 0) {
        const record = data[0];
        const inTime = secondsTo12Hour(record.ClockIn);
        const outTime = secondsTo12Hour(record.ClockOut);

        if (record.ClockIn === record.ClockOut) {
          setClockIn(inTime);
          setClockOut(null);
        } else {
          setClockIn(inTime);
          setClockOut(outTime);
        }

        if (record.ShiftHours && record.ClockIn != null) {
          setShiftHours(Number(record.ShiftHours));
          setClockInSeconds(Number(record.ClockIn));
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

  const fetchMonthlySummary = useCallback(async () => {
    if (!userData?.employeeId) return;
    try {
      setLoadingSummary(true);
      const fromDate = moment(selectedMonth)
        .startOf('month')
        .format('YYYY-MM-DD');
      const toDate = moment(selectedMonth).endOf('month').format('YYYY-MM-DD');

      const summary = await GetRegisterDetails({
        employeeId: userData.employeeId,
        fromDate,
        toDate,
      });

      // ===== UPDATED FOR NEW CONTRACT KEYS =====
      // Expecting object fields:
      // PresentCount, AbsentCount, LateArrivalCount, EarlyOutCount
      if (summary && summary.length > 0) {
        const s = summary[0];
        setPresentCount(Number(s.PresentCount || 0));
        setAbsentCount(Number(s.AbsentCount || 0));
        setLateCount(Number(s.LateArrivalCount || 0));
        setEarlyOutCount(Number(s.EarlyOutCount || 0));
      } else {
        setPresentCount(0);
        setAbsentCount(0);
        setLateCount(0);
        setEarlyOutCount(0);
      }
    } catch {
      setAlertMessage('Unable to load monthly summary');
      setAlertModal(true);
    } finally {
      setLoadingSummary(false);
    }
  }, [userData?.employeeId, selectedMonth]);

  useEffect(() => {
    fetchAttendanceRegister();
  }, [fetchAttendanceRegister]);

  useEffect(() => {
    fetchMonthlySummary();
  }, [fetchMonthlySummary]);

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

  // ===== Permissions (request on mount), then warm-up watch (no debug UI)
  const requestLocationPermission = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        const fine = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'We need your location to verify attendance',
            buttonNeutral: 'Ask Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        const coarse = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        );
        return (
          fine === PermissionsAndroid.RESULTS.GRANTED ||
          coarse === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const auth = await Geolocation.requestAuthorization('whenInUse');
        return auth === 'granted';
      }
    } catch {
      return false;
    }
  }, []);

  // Background warm watch (25s) to improve first fix reliability
  const startWarmWatch = useCallback(() => {
    try {
      if (watchIdRef.current != null) return;

      const id = Geolocation.watchPosition(
        pos => {
          const c = pos?.coords || {};
          lastCoordsRef.current = c;
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

      setTimeout(() => {
        if (watchIdRef.current != null) {
          Geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      }, 25000);
    } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      const ok = await requestLocationPermission();
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
  }, [requestLocationPermission, startWarmWatch]);

  // Utility: promisified getCurrentPosition
  const tryGetPosition = opts =>
    new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        pos => resolve(pos.coords),
        err => reject(err),
        opts,
      );
    });

  // Get current position with retries & fallbacks
  const getCurrentLocationFast = useCallback(async () => {
    try {
      // First try: last known/cached within 1 minute
      return await tryGetPosition({
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 60000, // accept 1 min old
      });
    } catch (e1) {
      // Second try: GPS fix with shorter timeout
      try {
        return await tryGetPosition({
          enableHighAccuracy: true,
          timeout: 7000,
          maximumAge: 5000,
        });
      } catch (e2) {
        // Fallback: warm cache ref
        if (lastCoordsRef.current) return lastCoordsRef.current;
        throw e2;
      }
    }
  }, []);

  // Standard Haversine distance (in meters)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
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
  };

  // Main action
  const handleAttendance = useCallback(async () => {
    try {
      setLoadingAttendance(true);

      // 1) Ensure permission
      const hasFine =
        Platform.OS === 'android'
          ? await PermissionsAndroid.check(
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            )
          : true;
      const hasCoarse =
        Platform.OS === 'android'
          ? await PermissionsAndroid.check(
              PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
            )
          : true;

      if (!hasFine && !hasCoarse) {
        const ok = await requestLocationPermission();
        if (!ok) {
          setAlertMessage(
            'Location permission is required. Please enable it in Settings.',
          );
          setAlertModal(true);
          return;
        }
      }

      // 2) Get location quickly
      const coords = await getCurrentLocationFast();
      if (!coords?.latitude || !coords?.longitude) {
        throw new Error('Invalid location from device');
      }

      const {latitude, longitude, accuracy = 9999} = coords;

      // 3) Geofence check
      const distance = calculateDistance(
        latitude,
        longitude,
        OFFICE_LOCATION.latitude,
        OFFICE_LOCATION.longitude,
      );

      // Allow for inaccuracy by subtracting up to ALLOWED_RADIUS from accuracy
      const effectiveDistance = Math.max(
        0,
        distance - Math.min(accuracy, ALLOWED_RADIUS),
      );

      if (effectiveDistance > ALLOWED_RADIUS) {
        setAlertMessage(
          `You are ~${Math.round(distance)}m from office (±${Math.round(
            accuracy,
          )}m). Must be within ${ALLOWED_RADIUS}m.`,
        );
        setAlertModal(true);
        return;
      }

      // 4) Create attendance
      const payload = {
        employeeId: userData?.employeeId,
        punchDateTime: moment().utc().format(),
        location: `${latitude},${longitude} (±${Math.round(accuracy)}m)`,
      };

      const response = await CreateAttendance(payload);
      if (response?.isSuccess || response === true) {
        setAlertMessage('Attendance recorded ✅');
        setAlertModal(true);
        await fetchAttendanceRegister();
        await fetchMonthlySummary();
      } else {
        throw new Error(response?.message || 'Failed to save attendance');
      }
    } catch (err) {
      setAlertMessage(err?.message || 'Failed to mark attendance.');
      setAlertModal(true);
    } finally {
      setLoadingAttendance(false);
    }
  }, [
    requestLocationPermission,
    getCurrentLocationFast,
    userData?.employeeId,
    fetchAttendanceRegister,
    fetchMonthlySummary,
  ]);

  // UI
  const renderHomeScreen = () => (
    <ScrollView
      contentContainerStyle={styles.homeContainer}
      showsVerticalScrollIndicator={false}>
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{currentTime.format('hh:mm:ss A')}</Text>
        <Text style={styles.dateText}>
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

      <View style={styles.buttonContainer}>
        <AttendanceButton
          onPress={handleAttendance}
          loading={loadingAttendance}
        />
      </View>

      {/* Compact 4-stat row — single line, non-wrapping */}
      <View style={styles.quickSummary}>
        <Text style={styles.quickSummaryTitle}>This Month Overview</Text>
        <View style={styles.quickSummaryRow}>
          <View style={styles.quickSummaryItem}>
            <Text style={[styles.quickSummaryValue, {color: '#4CAF50'}]}>
              {presentCount}
            </Text>
            <Text style={styles.quickSummaryLabel}>Present</Text>
          </View>
          <View style={styles.quickSummaryItem}>
            <Text style={[styles.quickSummaryValue, {color: '#F44336'}]}>
              {absentCount}
            </Text>
            <Text style={styles.quickSummaryLabel}>Absent</Text>
          </View>
          <View style={styles.quickSummaryItem}>
            <Text style={[styles.quickSummaryValue, {color: '#FF9800'}]}>
              {lateCount}
            </Text>
            <Text style={styles.quickSummaryLabel}>Late</Text>
          </View>
          <View style={styles.quickSummaryItem}>
            <Text style={[styles.quickSummaryValue, {color: '#9C27B0'}]}>
              {earlyOutCount}
            </Text>
            <Text style={styles.quickSummaryLabel}>Early Out</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderMonthlySummary = () => (
    <View style={styles.summaryScreenContainer}>
      <ScrollView
        style={styles.summaryContainer}
        showsVerticalScrollIndicator={false}>
        <View style={styles.monthSelector}>
          <TouchableOpacity
            onPress={() =>
              setSelectedMonth(moment(selectedMonth).subtract(1, 'month'))
            }>
            <Icon name="chevron-left" size={32} color="#1E88E5" />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {moment(selectedMonth).format('MMMM YYYY')}
          </Text>
          <TouchableOpacity
            onPress={() =>
              setSelectedMonth(moment(selectedMonth).add(1, 'month'))
            }>
            <Icon name="chevron-right" size={32} color="#1E88E5" />
          </TouchableOpacity>
        </View>

        {/* Same compact 4-stat row here too */}
        <View style={styles.quickSummary}>
          <Text style={styles.quickSummaryTitle}>This Month Overview</Text>
          <View style={styles.quickSummaryRow}>
            <View style={styles.quickSummaryItem}>
              <Text style={[styles.quickSummaryValue, {color: '#4CAF50'}]}>
                {presentCount}
              </Text>
              <Text style={styles.quickSummaryLabel}>Present</Text>
            </View>
            <View style={styles.quickSummaryItem}>
              <Text style={[styles.quickSummaryValue, {color: '#F44336'}]}>
                {absentCount}
              </Text>
              <Text style={styles.quickSummaryLabel}>Absent</Text>
            </View>
            <View style={styles.quickSummaryItem}>
              <Text style={[styles.quickSummaryValue, {color: '#FF9800'}]}>
                {lateCount}
              </Text>
              <Text style={styles.quickSummaryLabel}>Late</Text>
            </View>
            <View style={styles.quickSummaryItem}>
              <Text style={[styles.quickSummaryValue, {color: '#9C27B0'}]}>
                {earlyOutCount}
              </Text>
              <Text style={styles.quickSummaryLabel}>Early Out</Text>
            </View>
          </View>
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
            <>
              <SummaryItem
                label="Present Days"
                value={presentCount.toString()}
                color="#4CAF50"
              />
              <SummaryItem
                label="Absent Days"
                value={absentCount.toString()}
                color="#F44336"
              />
              <SummaryItem
                label="Late Arrivals"
                value={lateCount.toString()}
                color="#FF9800"
              />
              <SummaryItem
                label="Early Outs"
                value={earlyOutCount.toString()}
                color="#9C27B0"
              />
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total Working Days:</Text>
                <Text style={styles.totalValue}>
                  {presentCount + absentCount}
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
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
        <View style={styles.content}>
          {activeTab === 'home' ? renderHomeScreen() : renderMonthlySummary()}
        </View>
        <BottomTabs active={activeTab} onChange={setActiveTab} />
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

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F5F5F5'},
  content: {flex: 1},

  homeContainer: {
    flexGrow: 1,
    padding: SCREEN_WIDTH * 0.05,
    backgroundColor: '#F5F5F5',
  },

  timeContainer: {alignItems: 'center', marginVertical: SCREEN_HEIGHT * 0.02},
  timeText: {
    fontSize: isSmallDevice ? 36 : 48,
    fontWeight: '800',
    color: '#1E88E5',
    textAlign: 'center',
  },
  dateText: {
    fontSize: isSmallDevice ? 14 : 16,
    color: '#757575',
    marginTop: 5,
    textAlign: 'center',
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: SCREEN_HEIGHT * 0.02,
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    flexWrap: 'wrap',
  },

  buttonContainer: {
    alignItems: 'center',
    marginVertical: SCREEN_HEIGHT * 0.02,
    minHeight: 200,
  },

  // ===== Compact 4-stat card reused in both tabs
  quickSummary: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    marginTop: 10,
    marginBottom: 20,
  },
  quickSummaryTitle: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginBottom: 15,
    textAlign: 'center',
  },
  quickSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    flexWrap: 'nowrap', // keep all 4 on the same line
  },
  quickSummaryItem: {
    flex: 1, // equal-width columns
    minWidth: 0, // allow shrinking on small devices
    alignItems: 'center',
    marginVertical: 5,
    paddingHorizontal: 6,
  },
  quickSummaryValue: {
    fontSize: isSmallDevice ? 18 : 24,
    fontWeight: 'bold',
  },
  quickSummaryLabel: {
    fontSize: isSmallDevice ? 10 : 12,
    color: '#757575',
    marginTop: 5,
    textAlign: 'center',
  },

  summaryScreenContainer: {flex: 1},
  summaryContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: SCREEN_WIDTH * 0.05,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    marginBottom: 20,
    minHeight: 60,
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
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    minHeight: 300,
  },
  summaryCardTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginBottom: 20,
    textAlign: 'center',
  },
  loader: {marginVertical: 30},
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  totalLabel: {
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: 'bold',
    color: '#1E88E5',
  },
});

export default CreateAttendanceScreen;
