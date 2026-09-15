import {useState, useEffect, useCallback} from 'react';
import {useSelector} from 'react-redux';
import {useFocusEffect} from '@react-navigation/native';
import {DeviceEventEmitter} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {RetrieveByPersonAttendance} from '../API/AttendanceManagement/RetrieveByPersonAttendance';
import {
  FS_EVENT_BREAK_START,
  FS_EVENT_BREAK_END,
  FS_EVENT_CLOCK_OUT,
} from '../services/AttendanceManagement/AttendanceHeadlessTask';

// P6.2 — Persisted snapshot, same pattern as TimeClockScreen's
// ATTENDANCE_SNAPSHOT_KEY. Keyed separately since this hook stores the raw
// flat punch array (DashboardHeader's expected shape), not the aggregated
// shift objects TimeClockScreen uses. Survives app restarts so a cold launch
// during boot-time SOAP congestion shows real last-known data instead of a
// blank dashboard header.
const TODAY_ATTENDANCE_SNAPSHOT_KEY = '@today_attendance_last_known_snapshot';

const saveSnapshot = async records => {
  try {
    await AsyncStorage.setItem(
      TODAY_ATTENDANCE_SNAPSHOT_KEY,
      JSON.stringify(records),
    );
  } catch {}
};

const loadSnapshot = async () => {
  try {
    const raw = await AsyncStorage.getItem(TODAY_ATTENDANCE_SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const useTodayAttendance = () => {
  const {userData} = useSelector(s => s.user);
  const person = userData?.Person;

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snapshotLoaded, setSnapshotLoaded] = useState(false);

  // P6.2 — Paint last-known data INSTANTLY from disk, before the first
  // network call resolves. Runs once, before `load` ever fires.
  useEffect(() => {
    (async () => {
      const snapshot = await loadSnapshot();
      console.log('[useTodayAttendance] loaded snapshot:', snapshot);
      if (snapshot) setAttendanceRecords(snapshot);
      setSnapshotLoaded(true);
    })();
  }, []);

  const load = useCallback(async () => {
    if (!person) {
      setAttendanceRecords([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const records = await RetrieveByPersonAttendance({person});
      setAttendanceRecords(records || []);
      saveSnapshot(records || []); // persist on every success
    } catch (err) {
      setError(err);
      // Do NOT clear attendanceRecords here — a failed fetch is not the
      // same as "no attendance today". Keep whatever's currently shown
      // (either a previous successful load this session, or the disk
      // snapshot loaded above) rather than flashing a false-empty state.
    } finally {
      setIsLoading(false);
    }
  }, [person]);

  // Only start fetching once the snapshot has had a chance to paint first —
  // avoids a race where load() resolves before the snapshot read finishes
  // and briefly overwrites good data with an empty initial state.
  useFocusEffect(
    useCallback(() => {
      if (snapshotLoaded) load();
    }, [load, snapshotLoaded]),
  );

  // Re-fetch the instant a punch completes, even if the consuming screen
  // never lost focus — same events TimeClockScreen listens to, so the
  // Dashboard updates live without requiring navigation or app relaunch.
  useEffect(() => {
    const onPunch = () => load();
    const sub1 = DeviceEventEmitter.addListener(FS_EVENT_BREAK_START, onPunch);
    const sub2 = DeviceEventEmitter.addListener(FS_EVENT_BREAK_END, onPunch);
    const sub3 = DeviceEventEmitter.addListener(FS_EVENT_CLOCK_OUT, onPunch);
    return () => {
      sub1.remove();
      sub2.remove();
      sub3.remove();
    };
  }, [load]);

  return {attendanceRecords, isLoading, error, refresh: load};
};

export default useTodayAttendance;
