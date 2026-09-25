// hooks/useDashboardAlerts.js
import {useMemo} from 'react';
import {
  deriveAttendanceStatus,
  ATTENDANCE_STATUS,
} from '../store/utils/attendanceStatus';

export default function useDashboardAlerts(
  attendanceRecords,
  attendanceLoading,
) {
  const alerts = useMemo(() => {
    const list = [];

    if (!attendanceLoading) {
      const status = deriveAttendanceStatus(attendanceRecords);

      if (status === ATTENDANCE_STATUS.MISSING_CLOCK_IN) {
        list.push({
          id: 'attendance-missing-clockin',
          severity: 'error',
          title: 'Clock In Missing',
          message: "You haven't clocked in yet today.",
        });
      } else if (status === ATTENDANCE_STATUS.MISSING_CLOCK_OUT) {
        list.push({
          id: 'attendance-missing-clockout',
          severity: 'warning',
          title: 'Clock Out Missing',
          message: "Don't forget to clock out before you leave today.",
        });
      } else if (status === ATTENDANCE_STATUS.COMPLETE) {
        list.push({
          id: 'attendance-complete',
          severity: 'success',
          title: 'Attendance Completed',
          message: "Today's clock in and clock out are recorded.",
        });
      }
    }

    return list;
  }, [attendanceRecords, attendanceLoading]);

  return {alerts};
}
