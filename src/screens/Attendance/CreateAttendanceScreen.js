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

// Screen sizing
const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

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

  // ===== Overview counts (ALWAYS current month)
  const [presentCount, setPresentCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);
  const [lateCount, setLateCount] = useState(0);
  const [earlyOutCount, setEarlyOutCount] = useState(0);
  const [overviewColor, setOverviewColor] = useState('#00FF00'); // default

  // ===== Summary-screen counts (DEPEND on selectedMonth)
  const [summaryPresentCount, setSummaryPresentCount] = useState(0);
  const [summaryAbsentCount, setSummaryAbsentCount] = useState(0);
  const [summaryLateCount, setSummaryLateCount] = useState(0);
  const [summaryEarlyOutCount, setSummaryEarlyOutCount] = useState(0);
  const [summaryLeaveCount, setSummaryLeaveCount] = useState(0);
  const [summaryOffDayCount, setSummaryOffDayCount] = useState(0);
  const [summaryGazettedDayCount, setSummaryGazettedDayCount] = useState(0);
  const [summaryErrorCount, setSummaryErrorCount] = useState(0);
  const [summaryColor, setSummaryColor] = useState('#00FF00'); // default

  // Month + view
  const [selectedMonth, setSelectedMonth] = useState(moment()); // summary screen only
  const [activeTab, setActiveTab] = useState('home');

  const {userData} = useSelector(state => state.user || {});

  // ===== location warm cache
  const lastCoordsRef = useRef(null);
  const watchIdRef = useRef(null);

  // ===== Geofences
  // eslint-disable-next-line no-unused-vars
  const [sites, setSites] = useState([]);

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      if (activeTab === 'home') {
        await Promise.all([fetchAttendanceRegister(), fetchOverviewSummary()]);
      } else {
        await fetchMonthlySummary();
      }
      await fetchSites();
    } finally {
      setRefreshing(false);
    }
  }, [
    activeTab,
    fetchAttendanceRegister,
    fetchMonthlySummary,
    fetchOverviewSummary,
    fetchSites,
  ]);

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
        setOverviewColor(String(s.Color ?? '#00FF00'));
      } else {
        setPresentCount(0);
        setAbsentCount(0);
        setLateCount(0);
        setEarlyOutCount(0);
        setOverviewColor('#00FF00');
      }
    } catch {
      // keep existing values
    }
  }, [userData?.employeeId]);

  // Monthly summary (selectedMonth)
  const fetchMonthlySummary = useCallback(async () => {
    if (!userData?.employeeId) return;
    try {
      setLoadingSummary(true);
      const fromDate = moment(selectedMonth)
        .startOf('month')
        .format('YYYY-MM-DD');
      const toDate = moment(selectedMonth).endOf('month').format('YYYY-MM-DD');

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
        setSummaryColor(String(s.Color ?? '#00FF00'));
      } else {
        setSummaryPresentCount(0);
        setSummaryAbsentCount(0);
        setSummaryLateCount(0);
        setSummaryEarlyOutCount(0);
        setSummaryLeaveCount(0);
        setSummaryOffDayCount(0);
        setSummaryGazettedDayCount(0);
        setSummaryErrorCount(0);
        setSummaryColor('#00FF00');
      }
    } catch {
      // ignore
    } finally {
      setLoadingSummary(false);
    }
  }, [userData?.employeeId, selectedMonth]);

  // Geofences
  const fetchSites = useCallback(async () => {
    try {
      const list = await GetGPSCoordinates();
      setSites(Array.isArray(list) ? list : []);
    } catch {
      setSites([]);
    }
  }, []);

  // Initial loads
  useEffect(() => {
    fetchAttendanceRegister();
    fetchOverviewSummary();
    fetchSites();
  }, [fetchAttendanceRegister, fetchOverviewSummary, fetchSites]);

  // Reload summary when month changes
  useEffect(() => {
    if (activeTab === 'summary') {
      fetchMonthlySummary();
    }
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

  // ===== Permissions + warm watch
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

  const startWarmWatch = useCallback(() => {
    try {
      if (watchIdRef.current != null) return;
      const id = Geolocation.watchPosition(
        pos => {
          const c = (pos && pos.coords) || {};
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

  const tryGetPosition = opts =>
    new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        pos => resolve(pos.coords),
        err => reject(err),
        opts,
      );
    });

  const getCurrentLocationFast = useCallback(async () => {
    try {
      return await tryGetPosition({
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 60000,
      });
    } catch (e1) {
      try {
        return await tryGetPosition({
          enableHighAccuracy: true,
          timeout: 7000,
          maximumAge: 5000,
        });
      } catch (e2) {
        if (lastCoordsRef.current) return lastCoordsRef.current;
        throw e2;
      }
    }
  }, []);

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

  const nearestWithEffective = useCallback(
    (userLat, userLon, accuracy, points) => {
      if (!points || points.length === 0) return null;
      let best = null;
      for (const p of points) {
        const lat1 = Number(p.latitude);
        const lon1 = Number(p.longitude);
        if (!Number.isFinite(lat1) || !Number.isFinite(lon1)) continue;

        const dNormal = calculateDistance(userLat, userLon, lat1, lon1);
        const dSwapped = calculateDistance(userLat, userLon, lon1, lat1);

        const useSwap = dSwapped < dNormal;
        const chosenLat = useSwap ? lon1 : lat1;
        const chosenLon = useSwap ? lat1 : lon1;
        const d = useSwap ? dSwapped : dNormal;

        if (!best || d < best.distance) {
          best = {
            latitude: chosenLat,
            longitude: chosenLon,
            radius: Number(p.radius),
            distance: d,
          };
        }
      }

      if (!best) return null;
      const acc = Number.isFinite(accuracy) ? Math.max(0, accuracy) : 0;
      const effectiveDistance = Math.max(
        0,
        best.distance - Math.min(acc, best.radius),
      );
      return {...best, effectiveDistance};
    },
    [],
  );

  const handleAttendance = useCallback(async () => {
    try {
      setLoadingAttendance(true);
      setLoadingGeo(true);

      // Always fetch latest geofences
      let freshSites = [];
      try {
        freshSites = await GetGPSCoordinates();
        if (!Array.isArray(freshSites)) freshSites = [];
      } catch (geoError) {
        console.error('Error fetching GPS coordinates:', geoError);
        setAlertMessage('Unable to fetch office geofence. Please try again.');
        setAlertModal(true);
        return;
      } finally {
        setLoadingGeo(false);
      }

      if (freshSites.length === 0) {
        setAlertMessage('No office geofence available from D365.');
        setAlertModal(true);
        return;
      }

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

      const coords = await getCurrentLocationFast();
      if (!coords?.latitude || !coords?.longitude) {
        throw new Error('Invalid location from device');
      }
      const {latitude, longitude, accuracy = 9999} = coords;

      const nearest = nearestWithEffective(
        latitude,
        longitude,
        accuracy,
        freshSites,
      );
      if (!nearest) {
        setAlertMessage('Unable to evaluate geofence. Please try again.');
        setAlertModal(true);
        return;
      }

      if (nearest.effectiveDistance > nearest.radius) {
        const displayDist = Math.max(0, Math.round(nearest.distance));
        setAlertMessage(
          `You are ~${displayDist}m from office (±${Math.round(
            accuracy,
          )}m). Must be within ${Math.round(nearest.radius)}m.`,
        );
        setAlertModal(true);
        return;
      }

      const payload = {
        employeeId: userData?.employeeId,
        punchDateTime: moment().format('YYYY-MM-DDTHH:mm:ss[Z]'), // keep 24h ISO with literal Z
        location: `${latitude},${longitude} (±${Math.round(accuracy)}m)`,
      };

      const response = await CreateAttendance(payload);
      if (response?.isSuccess || response === true) {
        setAlertMessage('Attendance recorded');
        setAlertModal(true);
        await fetchAttendanceRegister();
        await fetchOverviewSummary();
      } else {
        throw new Error(response?.message || 'Failed to save attendance');
      }
    } catch (err) {
      setAlertMessage(err?.message || 'Failed to mark attendance.');
      setAlertModal(true);
    } finally {
      setLoadingAttendance(false);
      setLoadingGeo(false);
    }
  }, [
    requestLocationPermission,
    getCurrentLocationFast,
    userData?.employeeId,
    fetchAttendanceRegister,
    fetchOverviewSummary,
    nearestWithEffective,
  ]);

  // ====== RENDER ======
  const renderHomeScreen = () => (
    <View style={styles.homeRoot}>
      {/* top section: time/date */}
      <View style={styles.timeContainer}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.timeText}>
          {currentTime.format('hh:mm:ss A')}
        </Text>

        {/* lifted slightly with extra bottom space so it doesn't touch next card */}
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.dateText}>
          {currentTime.format('dddd, MMM D, YYYY')}
        </Text>
      </View>

      {/* info tiles */}
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

      {/* Centered button */}
      <View style={styles.centeredButtonContainer}>
        <AttendanceButton
          onPress={handleAttendance}
          loading={loadingAttendance || loadingGeo}
        />
        {loadingGeo ? (
          <Text style={{marginTop: 8, color: '#757575', fontSize: 12}}>
            Loading office geofence…
          </Text>
        ) : null}
      </View>

      {/* Month overview (ONLY 4 items now) */}
      <View
        style={[
          styles.quickSummaryCard,
          // {borderLeftColor: overviewColor, borderLeftWidth: 4},
        ]}>
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
            <Text style={[styles.quickSummaryValue, {color: '#4CAF50'}]}>
              {String(presentCount)}
            </Text>
            <Text style={styles.quickSummaryLabel}>Present</Text>
          </View>
          <View className="item" style={styles.quickSummaryItem}>
            <Text style={[styles.quickSummaryValue, {color: '#F44336'}]}>
              {String(absentCount)}
            </Text>
            <Text style={styles.quickSummaryLabel}>Absent</Text>
          </View>
          <View className="item" style={styles.quickSummaryItem}>
            <Text style={[styles.quickSummaryValue, {color: '#FF9800'}]}>
              {String(lateCount)}
            </Text>
            <Text style={styles.quickSummaryLabel}>Late</Text>
          </View>
          <View className="item" style={styles.quickSummaryItem}>
            <Text style={[styles.quickSummaryValue, {color: '#9C27B0'}]}>
              {String(earlyOutCount)}
            </Text>
            <Text style={styles.quickSummaryLabel}>Early Out</Text>
          </View>
        </View>
        {/* Removed: Leave / Off Day / Gazetted / Errors row (now only on Summary screen) */}
      </View>
    </View>
  );

  const renderMonthlySummary = () => (
    <View style={styles.summaryRoot}>
      {/* back */}
      <View style={styles.topRow}>
        <TouchableOpacity
          onPress={() => setActiveTab('home')}
          style={styles.backBtn}
          activeOpacity={0.8}>
          <Icon name="chevron-left" size={20} color="#1E88E5" />
          <Text style={styles.backBtnText}>Overview</Text>
        </TouchableOpacity>
      </View>

      {/* month selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity
          onPress={() =>
            setSelectedMonth(moment(selectedMonth).subtract(1, 'month'))
          }>
          <Icon name="chevron-left" size={28} color="#1E88E5" />
        </TouchableOpacity>

        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.monthText}>
          {moment(selectedMonth).format('MMMM YYYY')}
        </Text>

        <TouchableOpacity
          onPress={() =>
            setSelectedMonth(moment(selectedMonth).add(1, 'month'))
          }>
          <Icon name="chevron-right" size={28} color="#1E88E5" />
        </TouchableOpacity>
      </View>

      {/* summary card (added vertical gap above via monthSelector marginBottom & card marginTop) */}
      <View
        style={[
          styles.summaryCard,
          // {borderLeftColor: summaryColor, borderLeftWidth: 4},
        ]}>
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
              value={String(summaryPresentCount)}
              color="#4CAF50"
            />
            <SummaryItem
              label="Absent Days"
              value={String(summaryAbsentCount)}
              color="#F44336"
            />
            <SummaryItem
              label="Late Arrivals"
              value={String(summaryLateCount)}
              color="#FF9800"
            />
            <SummaryItem
              label="Early Outs"
              value={String(summaryEarlyOutCount)}
              color="#9C27B0"
            />
            <SummaryItem
              label="Leave Days"
              value={String(summaryLeaveCount)}
              color="#2196F3"
            />
            <SummaryItem
              label="Off Days"
              value={String(summaryOffDayCount)}
              color="#FFB6C1"
            />
            <SummaryItem
              label="Gazetted Days"
              value={String(summaryGazettedDayCount)}
              color="#FF69B4"
            />
            <SummaryItem
              label="Error Days"
              value={String(summaryErrorCount)}
              color="#FFA500"
            />

            {/* <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total Working Days:</Text>
              <Text style={styles.totalValue}>
                {String(
                  summaryPresentCount +
                    summaryAbsentCount +
                    summaryLeaveCount +
                    summaryOffDayCount +
                    summaryGazettedDayCount,
                )}
              </Text>
            </View> */}
          </>
        )}
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
          scrollEnabled={false}
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
  contentContainer: {flexGrow: 1},

  /* ================== HOME ================== */
  homeRoot: {
    flex: 1,
    padding: PAD,
    backgroundColor: '#F5F5F5',
    justifyContent: 'space-between',
  },
  timeContainer: {
    alignItems: 'center',
    marginBottom: 8, // extra breathing room under the date block
  },
  timeText: {
    fontSize: isSmallDevice ? 34 : 46,
    fontWeight: '800',
    color: '#1E88E5',
    textAlign: 'center',
    marginBottom: 0,
  },
  // ⬆️ Lifted visually by adding bottom margin so it doesn't touch the next card
  dateText: {
    fontSize: isSmallDevice ? 13 : 15,
    color: '#757575',
    marginTop: 6,
    marginBottom: 10, // <- key: creates a small gap from the next section (no “touching”)
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: isSmallDevice ? 140 : 180,
  },

  quickSummaryCard: {
    backgroundColor: '#FFF',
    padding: isSmallDevice ? 14 : 18,
    borderRadius: 12,
    elevation: 2,
  },
  quickSummaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
    columnGap: 12,
  },
  quickSummaryTitle: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginRight: 6,
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
    fontSize: isSmallDevice ? 12 : 13,
    color: '#1E88E5',
    fontWeight: '600',
    marginRight: 2,
  },
  quickSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginBottom: 0,
  },
  quickSummaryItem: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  quickSummaryValue: {
    fontSize: isSmallDevice ? 18 : 22,
    fontWeight: 'bold',
  },
  quickSummaryLabel: {
    fontSize: isSmallDevice ? 10 : 12,
    color: '#757575',
    marginTop: 4,
    textAlign: 'center',
  },

  /* ================== SUMMARY ================== */
  summaryRoot: {
    flex: 1,
    padding: PAD,
    backgroundColor: '#F5F5F5',
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
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

  // Added bottom margin so it doesn’t “touch” the summary card
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: isSmallDevice ? 10 : 14,
    borderRadius: 12,
    elevation: 2,
    minHeight: 56,
    justifyContent: 'space-between',
    marginBottom: 10, // <- gap below month selector
  },
  monthText: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: '600',
    color: '#1E88E5',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 10,
  },

  // Also add a small top margin for extra breathing room
  summaryCard: {
    backgroundColor: '#FFF',
    padding: isSmallDevice ? 14 : 18,
    borderRadius: 12,
    elevation: 2,
    minHeight: SCREEN_HEIGHT * 0.38,
    justifyContent: 'center',
    marginTop: 6, // <- tiny extra gap from monthSelector
  },
  summaryCardTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginBottom: 12,
    textAlign: 'center',
  },
  loader: {marginVertical: 18},
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
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
