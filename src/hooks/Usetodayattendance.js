// ─────────────────────────────────────────────
// hooks/useTodayAttendance.js
//
// The Dashboard needs today's Clock In/Out for DashboardHeader, but that
// data (RetrieveByPersonAttendance) is currently only ever fetched inside
// AttendanceOrchestrator.prepare() — which only runs when the user presses
// an action button on TimeClockScreen, and the result lives only in that
// screen's local `validationToken` state. Nothing persists or exposes it
// anywhere else, so the Dashboard has no way to see it.
//
// This hook calls the SAME read-only API directly (no orchestrator, no
// validation, no side effects) so any screen — Dashboard included — can
// get today's punches on its own, independent of whether the user has
// ever opened Time Clock this session.
// ─────────────────────────────────────────────
import {useState, useEffect, useCallback} from 'react';
import {useSelector} from 'react-redux';
import {RetrieveByPersonAttendance} from '../API/AttendanceManagement/RetrieveByPersonAttendance';

const useTodayAttendance = () => {
  const {userData} = useSelector(s => s.user);
  const person = userData?.Person;

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
    } catch (err) {
      setError(err);
      setAttendanceRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [person]);

  useEffect(() => {
    load();
  }, [load]);

  // Exposed so a pull-to-refresh on the Dashboard (or a focus effect) can
  // force a re-fetch the same way TimeClockScreen's onRefresh does.
  return {attendanceRecords, isLoading, error, refresh: load};
};

export default useTodayAttendance;
