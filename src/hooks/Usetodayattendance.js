import {useState, useEffect, useCallback, useRef} from 'react';
import {useSelector} from 'react-redux';
import {useFocusEffect} from '@react-navigation/native';
import {DeviceEventEmitter} from 'react-native';
import {RetrieveByPersonAttendance} from '../API/AttendanceManagement/RetrieveByPersonAttendance';
import {
  FS_EVENT_CLOCK_IN,
  FS_EVENT_BREAK_START,
  FS_EVENT_BREAK_END,
  FS_EVENT_CLOCK_OUT,
} from '../services/AttendanceManagement/AttendanceHeadlessTask';

// PunchDateTime is a TRUE UTC instant (backend stores it via
// DateTimeUtil::utcNow(); the retrieveByPerson query already filters to the
// user's local "today" by converting local midnight boundaries back to UTC).
// So convert with `new Date()` and compare the LOCAL calendar day — matching
// both the backend logic and DashboardHeader.getTodayPunch. Do NOT slice the
// raw string: that treats the 'Z' as wall-clock and lands on the wrong day.
const isSameLocalDay = (isoString, reference) => {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === reference.getFullYear() &&
    d.getMonth() === reference.getMonth() &&
    d.getDate() === reference.getDate()
  );
};

const isRecordToday = record => {
  const raw = record?.PunchDateTime;
  if (!raw) return false;
  return isSameLocalDay(raw, new Date());
};

const filterToday = records => (records || []).filter(isRecordToday);

const useTodayAttendance = () => {
  const {userData} = useSelector(s => s.user);
  const person = userData?.Person;

  // In-memory / session only — never written to or read from disk. On a
  // cold app launch this starts empty and stays empty until the first
  // successful fetch this session. A failed fetch never overwrites it, so
  // a network blip can't blank out data that was genuinely confirmed today.
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ref, not state — keeps `load` stable so the focus effect and the four
  // DeviceEventEmitter listeners don't re-subscribe/re-fetch every time the
  // first successful fetch flips this. Was previously a state value in the
  // useCallback deps, which caused repeated fetches on every mount.
  const hasFetchedOnce = useRef(false);

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
      const todaysRecords = filterToday(records);
      setAttendanceRecords(todaysRecords);
      hasFetchedOnce.current = true;
    } catch (err) {
      console.warn('[useTodayAttendance] fetch failed:', err.message, err);
      setError(err);
      // If we've never successfully fetched this session, there is nothing
      // trustworthy to fall back on — show empty rather than guessing.
      // If we HAVE fetched successfully before this session, keep that
      // in-memory result: it's real data, not a stale disk artifact.
      if (!hasFetchedOnce.current) {
        setAttendanceRecords([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [person]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Re-fetch the instant any punch completes, even if the consuming screen
  // never lost focus.
  useEffect(() => {
    const onPunch = () => load();
    const sub0 = DeviceEventEmitter.addListener(FS_EVENT_CLOCK_IN, onPunch);
    const sub1 = DeviceEventEmitter.addListener(FS_EVENT_BREAK_START, onPunch);
    const sub2 = DeviceEventEmitter.addListener(FS_EVENT_BREAK_END, onPunch);
    const sub3 = DeviceEventEmitter.addListener(FS_EVENT_CLOCK_OUT, onPunch);
    return () => {
      sub0.remove();
      sub1.remove();
      sub2.remove();
      sub3.remove();
    };
  }, [load]);

  return {attendanceRecords, isLoading, error, refresh: load};
};

export default useTodayAttendance;
