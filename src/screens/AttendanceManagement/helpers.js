/* eslint-disable curly */
// ─────────────────────────────────────────────
// screens/AttendanceManagement/helpers.js
// Shared formatters + server-fetch helper
// PKT = UTC+5 — all PunchDateTime values from server are UTC
//
// OPTIMIZATION: Removed 5s debounce cache (was always invalidated before use).
// Removed offline queue merge (system is online-first, no offline support).
// Fixed canClockOut: now blocks when an open break exists.
// ─────────────────────────────────────────────
import {RetrieveByPersonAttendance} from '../../API/AttendanceManagement/RetrieveByPersonAttendance';

export const STORAGE_KEY = '@attendance_records';

// ─────────────────────────────────────────────
// UTC → PKT helper  (server stores in UTC, display in PKT = UTC+5)
// ─────────────────────────────────────────────
const toPKT = date => new Date(new Date(date).getTime() + 5 * 60 * 60 * 1000);

// ─────────────────────────────────────────────
// Formatters
// ─────────────────────────────────────────────
export const formatTime = date => {
  const d = toPKT(date);
  let h = d.getUTCHours();
  const m = d.getUTCMinutes().toString().padStart(2, '0');
  const ap = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
};

export const formatDate = date => {
  const d = toPKT(date);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${days[d.getUTCDay()]}, ${
    months[d.getUTCMonth()]
  } ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
};

export const formatDateShort = date => {
  const d = toPKT(date);
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
};

export const formatElapsed = seconds => {
  const h = Math.floor(seconds / 3600).toString();
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

export const formatDuration = ms => {
  if (!ms || ms <= 0) return '0h 0m';
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
};

export const formatDurationShort = ms => {
  if (!ms || ms <= 0) return '—';
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

// Returns true if the given date (UTC string) is "today" in PKT
export const isToday = dateStr => {
  if (!dateStr) return false;
  const d = toPKT(dateStr);
  const now = toPKT(new Date().toISOString());
  return (
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate()
  );
};

// ─────────────────────────────────────────────
// GenerationType string → integer mapping
// ─────────────────────────────────────────────
const GEN_TYPE = {
  ClockIn: 1,
  ClockOut: 2,
  StartBreak: 3,
  EndBreak: 4,
};

// ─────────────────────────────────────────────
// aggregateServerPunches
// ─────────────────────────────────────────────
export const aggregateServerPunches = flatPunches => {
  if (!flatPunches || !flatPunches.length) return [];

  const validPunches = flatPunches.filter(
    p =>
      p.GenerationType !== undefined &&
      p.GenerationType !== null &&
      p.PunchDateTime,
  );

  if (!validPunches.length) return [];

  const sorted = [...validPunches].sort(
    (a, b) =>
      new Date(a.PunchDateTime).getTime() - new Date(b.PunchDateTime).getTime(),
  );

  const shifts = [];
  let currentShift = null;

  for (const punch of sorted) {
    const rawType = punch.GenerationType;
    const type =
      typeof rawType === 'string' && isNaN(Number(rawType))
        ? GEN_TYPE[rawType]
        : Number(rawType);
    const time = punch.PunchDateTime;
    const recId = punch.RecId;

    switch (type) {
      case GEN_TYPE.ClockIn: {
        currentShift = {
          id: recId,
          RecId: recId,
          clockIn: time,
          clockOut: null,
          breaks: [],
          FenceName: punch.FenceName,
          LocationCode: punch.LocationCode,
          GeoFenceID: punch.GeoFenceID,
          punchRecIds: [recId],
        };
        shifts.push(currentShift);
        break;
      }

      case GEN_TYPE.ClockOut: {
        if (currentShift && !currentShift.clockOut) {
          currentShift.clockOut = time;
          currentShift.punchRecIds.push(recId);
          currentShift.clockOutRecId = recId;
        } else {
          const orphan = {
            id: recId,
            RecId: recId,
            clockIn: null,
            clockOut: time,
            breaks: [],
            FenceName: punch.FenceName,
            LocationCode: punch.LocationCode,
            GeoFenceID: punch.GeoFenceID,
            punchRecIds: [recId],
            clockOutRecId: recId,
          };
          shifts.push(orphan);
        }
        currentShift = null;
        break;
      }

      case GEN_TYPE.StartBreak: {
        if (currentShift && !currentShift.clockOut) {
          currentShift.breaks.push({
            breakStart: time,
            breakEnd: null,
            breakStartRecId: recId,
          });
          currentShift.punchRecIds.push(recId);
        }
        break;
      }

      case GEN_TYPE.EndBreak: {
        if (currentShift && !currentShift.clockOut) {
          const breaks = currentShift.breaks;
          const lastBreak = breaks[breaks.length - 1];
          if (lastBreak && !lastBreak.breakEnd) {
            lastBreak.breakEnd = time;
            lastBreak.breakEndRecId = recId;
          } else {
            currentShift.breaks.push({
              breakStart: null,
              breakEnd: time,
              breakEndRecId: recId,
            });
          }
          currentShift.punchRecIds.push(recId);
        }
        break;
      }

      default:
        console.warn('[aggregateServerPunches] Unknown GenerationType:', type);
    }
  }

  return shifts;
};

// ─────────────────────────────────────────────
// loadRecords  — always fetches fresh from server (online-first).
// No local caching — QA constraint requires fresh data every time.
// ─────────────────────────────────────────────
export const loadRecords = async ({person} = {}) => {
  if (!person) return [];
  try {
    const flatPunches = await RetrieveByPersonAttendance({person});
    return aggregateServerPunches(flatPunches);
  } catch (err) {
    console.warn('[loadRecords] Error fetching from server:', err.message);
    return [];
  }
};

// ─────────────────────────────────────────────
// Workflow guard helpers
//
// P1.3 FIX: canClockOut now returns false if there is an open (unended) break.
// Previously this was UI-only — a race condition could bypass it.
// ─────────────────────────────────────────────
// export const canClockIn = records => {
//   if (!records.length) return true;
//   const last = records[records.length - 1];
//   return !!last.clockOut;
// };

export const canClockIn = records => {
  if (!records.length) return true;
  const last = records[records.length - 1];
  if (!last.clockOut) return false; // still in an open shift
  // Once a cycle has completed TODAY, block a further clock-in until
  // tomorrow — the file already has isToday() (PKT-aware) for this.
  if (isToday(last.clockOut)) return false;
  return true;
};

export const canStartBreak = records => {
  if (!records.length) return false;
  const last = records[records.length - 1];
  if (last.clockOut) return false;
  const breaks = last.breaks || [];
  if (!breaks.length) return true;
  const lastBreak = breaks[breaks.length - 1];
  return !!lastBreak.breakEnd;
};

export const canEndBreak = records => {
  if (!records.length) return false;
  const last = records[records.length - 1];
  if (last.clockOut) return false;
  const breaks = last.breaks || [];
  if (!breaks.length) return false;
  const lastBreak = breaks[breaks.length - 1];
  return !lastBreak.breakEnd;
};

// FIX: Clock out is blocked when there is an open break (breakEnd is null).
// Must end break before clocking out.
export const canClockOut = records => {
  if (!records.length) return false;
  const last = records[records.length - 1];
  if (last.clockOut) return false; // already clocked out
  // Block if there is an ongoing break
  const breaks = last.breaks || [];
  if (breaks.length) {
    const lastBreak = breaks[breaks.length - 1];
    if (lastBreak.breakStart && !lastBreak.breakEnd) return false;
  }
  return true;
};

// ─────────────────────────────────────────────
// getSessionStats — compute stats for a shift record
// ─────────────────────────────────────────────
export const getSessionStats = record => {
  if (!record) return null;
  const breaks = record.breaks || [];
  let breakMs = 0;
  breaks.forEach(b => {
    if (b.breakStart && b.breakEnd) {
      breakMs += new Date(b.breakEnd) - new Date(b.breakStart);
    }
  });
  const completedBreaks = breaks.filter(b => b.breakEnd).length;
  const grossMs = record.clockIn
    ? (record.clockOut ? new Date(record.clockOut) : Date.now()) -
      new Date(record.clockIn)
    : 0;
  const netMs = Math.max(0, grossMs - breakMs);
  return {breakMs, completedBreaks, grossMs, netMs};
};
