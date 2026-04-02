/* eslint-disable curly */
// ─────────────────────────────────────────────
// screens/AttendanceManagement/helpers.js
// Shared formatters + server-fetch helpers
// ─────────────────────────────────────────────
import {RetrieveByPersonAttendance} from '../../API/AttendanceManagement/RetrieveByPersonAttendance';
import {getSyncQueue} from '../../services/AttendanceManagement/SyncManager';

export const STORAGE_KEY = '@attendance_records';

// ─────────────────────────────────────────────
// Formatters
// ─────────────────────────────────────────────
export const formatTime = date => {
  const d = new Date(date);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ap = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
};

export const formatDate = date => {
  const d = new Date(date);
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
  return `${days[d.getDay()]}, ${
    months[d.getMonth()]
  } ${d.getDate()}, ${d.getFullYear()}`;
};

export const formatDateShort = date => {
  const d = new Date(date);
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
  return `${months[d.getMonth()]} ${d.getDate()}`;
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
  if (!ms) return '0h 0m';
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}m`;
};

// ─────────────────────────────────────────────
// GenerationType integer → action string mapping
//   1 = ClockIn
//   2 = ClockOut
//   3 = StartBreak
//   4 = EndBreak
// ─────────────────────────────────────────────
const GEN_TYPE = {
  ClockIn: 1,
  ClockOut: 2,
  StartBreak: 3,
  EndBreak: 4,
};

// ─────────────────────────────────────────────
// aggregateServerPunches
//
// Converts a flat array of server punch records:
//   [ { GenerationType, PunchDateTime, RecId, ... }, ... ]
// into the grouped shift format the UI expects:
//   [ { id, clockIn, clockOut, breaks: [...], RecId, FenceName, ... } ]
//
// Punches are sorted chronologically (oldest first) so we can
// reconstruct a sessionable timeline.
// ─────────────────────────────────────────────
export const aggregateServerPunches = flatPunches => {
  if (!flatPunches || !flatPunches.length) return [];

  // Automatically drop completely invalid payloads (e.g. phantom XML nodes lacking required fields)
  const validPunches = flatPunches.filter(
    p =>
      p.GenerationType !== undefined &&
      p.GenerationType !== null &&
      p.PunchDateTime,
  );

  if (!validPunches.length) return [];

  // Sort ascending by PunchDateTime
  const sorted = [...validPunches].sort(
    (a, b) =>
      new Date(a.PunchDateTime).getTime() - new Date(b.PunchDateTime).getTime(),
  );

  const shifts = [];
  let currentShift = null;

  for (const punch of sorted) {
    // GenerationType can arrive as a string ("ClockIn") or integer (1).
    // Normalise to integer so the switch always works.
    const rawType = punch.GenerationType;
    const type =
      typeof rawType === 'string' && isNaN(Number(rawType))
        ? GEN_TYPE[rawType] // "ClockIn" → 1, "ClockOut" → 2, …
        : Number(rawType); // "1" or 1 → 1
    const time = punch.PunchDateTime;
    const recId = punch.RecId;

    switch (type) {
      case GEN_TYPE.ClockIn: {
        // Start a new shift — even if one was already open (handles edge cases)
        currentShift = {
          // Use the RecId of the clock-in punch as the shift id
          id: recId,
          RecId: recId,
          clockIn: time,
          clockOut: null,
          breaks: [],
          // Metadata from the server punch
          FenceName: punch.FenceName,
          LocationCode: punch.LocationCode,
          GeoFenceID: punch.GeoFenceID,
          // Collect all RecIds belonging to this shift
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
          // Orphan clock-out — no open shift; create a synthetic one
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
        // Reset — clock-out closes the session
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
            // Orphan end-break
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
// mergeQueuedPunches
//
// Injects pending offline-queue entries on top of
// already-aggregated server shifts so the UI shows
// optimistic state before the server has the data.
// ─────────────────────────────────────────────
const mergeQueuedPunches = (serverShifts, queueItems) => {
  if (!queueItems || !queueItems.length) return serverShifts;

  // Only process items that haven't been synced yet
  const pending = queueItems.filter(q => q.status === 'pending');
  if (!pending.length) return serverShifts;

  // Build a synthetic flat punch array from the queue
  const syntheticPunches = pending.map(item => ({
    GenerationType: item.payload.GenerationType,
    PunchDateTime: item.payload.PunchDateTime,
    RecId: `offline_${item.id}`, // temporary id
    FenceName: item.payload.FenceName,
    LocationCode: item.payload.LocationCode,
    GeoFenceID: item.payload.GeoFenceID,
    _isOffline: true,
  }));

  // Find server punches (already flat) — re-flatten the server shifts then re-aggregate
  // so ordering is deterministic across online + offline punches
  const serverPunches = serverShifts.flatMap(shift => {
    const punches = [];
    if (shift.clockIn) {
      punches.push({
        GenerationType: GEN_TYPE.ClockIn,
        PunchDateTime: shift.clockIn,
        RecId: shift.RecId,
        FenceName: shift.FenceName,
        LocationCode: shift.LocationCode,
        GeoFenceID: shift.GeoFenceID,
      });
    }
    (shift.breaks || []).forEach(b => {
      if (b.breakStart)
        punches.push({
          GenerationType: GEN_TYPE.StartBreak,
          PunchDateTime: b.breakStart,
          RecId: b.breakStartRecId,
          FenceName: shift.FenceName,
          LocationCode: shift.LocationCode,
          GeoFenceID: shift.GeoFenceID,
        });
      if (b.breakEnd)
        punches.push({
          GenerationType: GEN_TYPE.EndBreak,
          PunchDateTime: b.breakEnd,
          RecId: b.breakEndRecId,
          FenceName: shift.FenceName,
          LocationCode: shift.LocationCode,
          GeoFenceID: shift.GeoFenceID,
        });
    });
    if (shift.clockOut) {
      punches.push({
        GenerationType: GEN_TYPE.ClockOut,
        PunchDateTime: shift.clockOut,
        RecId: shift.clockOutRecId,
        FenceName: shift.FenceName,
        LocationCode: shift.LocationCode,
        GeoFenceID: shift.GeoFenceID,
      });
    }
    return punches;
  });

  return aggregateServerPunches([...serverPunches, ...syntheticPunches]);
};

// ─────────────────────────────────────────────
// loadRecords  (the new server-first version)
//
// Requires `person` (PersonRecId) to query the API.
// Falls back to an empty array on error.
// Always merges unsynced offline-queue entries on top.
// ─────────────────────────────────────────────
export const loadRecords = async ({person} = {}) => {
  try {
    let serverShifts = [];

    if (person) {
      const flatPunches = await RetrieveByPersonAttendance({person});
      serverShifts = aggregateServerPunches(flatPunches);
    }

    // Merge unsynced offline queue on top
    const queue = await getSyncQueue();
    return mergeQueuedPunches(serverShifts, queue);
  } catch (err) {
    console.warn(
      '[loadRecords] Error fetching from server, using queue only:',
      err.message,
    );
    // Fallback: try to show at least the offline queue
    try {
      const queue = await getSyncQueue();
      const pending = queue.filter(q => q.status !== 'synced');
      const syntheticPunches = pending.map(item => ({
        GenerationType: item.payload.GenerationType,
        PunchDateTime: item.payload.PunchDateTime,
        RecId: `offline_${item.id}`,
        FenceName: item.payload.FenceName,
        LocationCode: item.payload.LocationCode,
        GeoFenceID: item.payload.GeoFenceID,
        _isOffline: true,
      }));
      return aggregateServerPunches(syntheticPunches);
    } catch {
      return [];
    }
  }
};

// saveRecords is intentionally removed — the server is the source of truth.
// All writes go through CreateUserAttendance via SyncManager.enqueueAttendance.

// ─────────────────────────────────────────────
// Attendance workflow guard helpers
// Used across TimeClockScreen to prevent:
//   A5 — Clock out without clock in
//   A6 — Break without clock in
//   A7 — Double clock in
//   A8 — Break start twice
//   A9 — Break end without active break
// ─────────────────────────────────────────────
export const canClockIn = records => {
  if (!records.length) return true;
  const last = records[records.length - 1];
  return !!last.clockOut; // A7: must not have an open session
};

export const canStartBreak = records => {
  if (!records.length) return false; // A6
  const last = records[records.length - 1];
  if (last.clockOut) return false; // A6: already clocked out
  const breaks = last.breaks || [];
  if (!breaks.length) return true;
  const lastBreak = breaks[breaks.length - 1];
  return !!lastBreak.breakEnd; // A8: last break must be ended
};

export const canEndBreak = records => {
  if (!records.length) return false; // A9
  const last = records[records.length - 1];
  if (last.clockOut) return false;
  const breaks = last.breaks || [];
  if (!breaks.length) return false;
  const lastBreak = breaks[breaks.length - 1];
  return !lastBreak.breakEnd; // A9: must have an open break
};

export const canClockOut = records => {
  if (!records.length) return false; // A5
  const last = records[records.length - 1];
  return !last.clockOut; // A5: must have an open session
};
