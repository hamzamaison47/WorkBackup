// utils/attendanceStatus.js

export const ATTENDANCE_STATUS = {
  MISSING_CLOCK_IN: 'MISSING_CLOCK_IN',
  MISSING_CLOCK_OUT: 'MISSING_CLOCK_OUT',
  COMPLETE: 'COMPLETE',
};

// Pure function — easy to unit test independent of the hook/network layer.
export const deriveAttendanceStatus = records => {
  const hasClockIn = (records || []).some(r => r.GenerationType === 'ClockIn');
  const hasClockOut = (records || []).some(
    r => r.GenerationType === 'ClockOut',
  );

  if (!hasClockIn) return ATTENDANCE_STATUS.MISSING_CLOCK_IN;
  if (!hasClockOut) return ATTENDANCE_STATUS.MISSING_CLOCK_OUT;
  return ATTENDANCE_STATUS.COMPLETE;
};
