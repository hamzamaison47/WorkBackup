// ─────────────────────────────────────────────
// services/AttendanceManagement/AttendanceOrchestrator.js
//
// P2.1 — Core orchestration layer.
//
// RESPONSIBILITIES:
//   1. Fires RetrieveByPerson + RetrieveByPersonAttendance in PARALLEL.
//   2. Validates geofence, QR code (if enabled), and network against
//      the fresh server data in one coordinated step.
//   3. Returns a ValidationToken — a short-lived (60s) opaque object
//      containing all validation results and the fetched data.
//   4. On confirm: verifies the token is still fresh; if so, re-derives
//      workflow state from the token's embedded data and calls
//      CreateUserAttendance directly (zero extra SOAP fetches needed).
//      If token has expired (> 60s), transparently re-validates.
//
// SOAP API FILES ARE NOT TOUCHED — all SOAP calls go through the
// existing API layer unchanged.
//
// PERFORMANCE:
//   Before: 3–4 sequential SOAP calls (~3.2s)
//   After:  2 parallel SOAP calls + 1 optional QR call (~0.9s)
// ─────────────────────────────────────────────
/* eslint-disable curly */
import {RetrieveByPerson} from '../../API/AttendanceManagement/RetrieveByPerson';
import {RetrieveByPersonAttendance} from '../../API/AttendanceManagement/RetrieveByPersonAttendance';
import {ValidateQRCode} from '../../API/AttendanceManagement/ValidateQRCode';
import {
  aggregateServerPunches,
  canClockIn,
  canClockOut,
  canStartBreak,
  canEndBreak,
} from '../../screens/AttendanceManagement/helpers';
import {
  checkNetworkMatch,
  buildNetworkErrorMessage,
} from '../../components/AttendanceManagement/GeofenceContext';
import {
  ACTION_TYPES,
  buildAttendancePayload,
  ATTENDANCE_MODE,
  getTrueTime,
} from '../../components/AttendanceManagement/Screen/attendanceActionHelpers';
import {submitAttendanceDirect} from './SyncManager';
import NetInfo from '@react-native-community/netinfo';
import {haversineDistance} from '../../hooks/useLocation';

const SOFT_BUFFER_METRES = 15;
const TOKEN_TTL_MS = 60_000; // Validation token valid for 60 seconds

// ─────────────────────────────────────────────
// Internal utilities
// ─────────────────────────────────────────────
const isActiveFlag = val => {
  const s = String(val).trim().toLowerCase();
  return s === '1' || s === 'yes' || s === 'true';
};

const normalizeNet = s =>
  String(s ?? '')
    .trim()
    .toLowerCase();

const isUnknownSsid = ssid =>
  !ssid ||
  ssid === '<unknown ssid>' ||
  ssid === '0x' ||
  ssid === '"<unknown ssid>"';

// ─────────────────────────────────────────────
// Enrich a raw fence array with GPS distance data
// ─────────────────────────────────────────────
const enrichFences = (rawFences, coords) => {
  const now = new Date();
  return rawFences.map(f => {
    const lat = parseFloat(f.Latitude);
    const lng = parseFloat(f.Longitude);
    const radius = parseFloat(f.AllowedRadius);
    const active =
      isActiveFlag(f.IsFenceActive) && isActiveFlag(f.IsUserFenceActive);
    const vFrom = f.ValidFrom ? new Date(f.ValidFrom) : null;
    const vTo = f.ValidTo ? new Date(f.ValidTo) : null;
    const dateValid = (!vFrom || now >= vFrom) && (!vTo || now <= vTo);

    let distanceMetres = null;
    let withinRadius = false;
    if (coords && !isNaN(lat) && !isNaN(lng)) {
      distanceMetres = Math.round(
        haversineDistance(coords.latitude, coords.longitude, lat, lng),
      );
      withinRadius = !isNaN(radius) && distanceMetres <= radius + SOFT_BUFFER_METRES;
    }

    const networks = Array.isArray(f.Networks)
      // Guard against null entries (e.g. fence with Networks: null flattened
      // to [null] by normalizeObject before the null-check fix propagated).
      ? f.Networks.filter(n => n != null).flatMap(n =>
          Array.isArray(n?.DFGeoFencesNetworksSvcContract)
            ? n.DFGeoFencesNetworksSvcContract.filter(e => e != null)
            : (n != null ? [n] : [])
        ).filter(e => e != null && typeof e === 'object')
      : [];

    return {
      ...f,
      fenceLat: lat,
      fenceLng: lng,
      allowedRadius: radius,
      active,
      dateValid,
      distanceMetres,
      withinRadius,
      networks,
    };
  });
};

const selectBestFence = fences => {
  const candidates = fences.filter(f => f.active && f.dateValid && f.withinRadius);
  if (!candidates.length) return null;
  return candidates.reduce((a, b) => (b.distanceMetres < a.distanceMetres ? b : a));
};

// ─────────────────────────────────────────────
// getActionFenceFromFences — fence selection logic for each action type
// ─────────────────────────────────────────────
const getActionFenceFromFences = (actionType, matchedFence, clockInFence) => {
  if (actionType === ACTION_TYPES.CLOCK_IN) return matchedFence ?? null;
  return clockInFence ?? matchedFence ?? null;
};

// ─────────────────────────────────────────────
// workflowCheck — validate action is legal given current punch state
// ─────────────────────────────────────────────
const workflowCheck = (actionType, records) => {
  switch (actionType) {
    case ACTION_TYPES.CLOCK_IN:
      if (!canClockIn(records))
        return 'You already have an active session. Clock out first.';
      return null;
    case ACTION_TYPES.CLOCK_OUT:
      if (!canClockOut(records)) {
        if (canEndBreak(records))
          return 'You are on a break. End your break before clocking out.';
        return 'No active session to clock out of.';
      }
      return null;
    case ACTION_TYPES.BREAK_START:
      if (!canStartBreak(records))
        return records.length === 0
          ? 'Clock in before starting a break.'
          : 'Cannot start a break right now.';
      return null;
    case ACTION_TYPES.BREAK_END:
      if (!canEndBreak(records)) return 'No active break to end.';
      return null;
    default:
      return 'Unknown action type.';
  }
};

// ─────────────────────────────────────────────
// Network info fetch (inline — no hook needed)
// ─────────────────────────────────────────────
const fetchNetworkInfo = async () => {
  try {
    let state = await (NetInfo.refresh ? NetInfo.refresh() : NetInfo.fetch());
    if (state.type === 'wifi' && !state.details?.ssid) {
      state = await NetInfo.fetch('wifi');
    }
    if (state.type === 'wifi' && state.details) {
      return {
        isWifi: true,
        ssid: state.details.ssid ?? null,
        bssid: state.details.bssid ?? null,
      };
    }
  } catch {}
  return {isWifi: false, ssid: null, bssid: null};
};

// ─────────────────────────────────────────────
// Public IP fetch — NetworkID field
// Uses api.ipify.org with a 5-second abort timeout.
// Returns null on any failure (offline, timeout, error) so the
// rest of the flow is never blocked by this call.
// Called in parallel with fetchNetworkInfo() to add zero latency.
// ─────────────────────────────────────────────
const fetchPublicIP = async () => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch('https://api.ipify.org?format=json', {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) return null;
    const data = await resp.json();
    return data?.ip ?? null;
  } catch {
    // Offline, timeout, or parse error — degrade gracefully
    return null;
  }
};

// ─────────────────────────────────────────────
// prepare()
//
// Called when the user presses an action button (Clock In, etc.).
// Fires all SOAP fetches in parallel, validates everything, and
// returns a ValidationToken if all checks pass.
//
// Parameters:
//   person       — personRecId from Redux
//   actionType   — ACTION_TYPES constant
//   coords       — current GPS coords from GeofenceContext
//   clockInFence — fence recorded at clock-in (for Clock Out / Break)
//   qrRawValue   — scanned QR string (if QR gate was passed before prepare)
//   faceVerified — boolean (true if face gate was passed before prepare)
//   spoofingDetected — boolean from useLocation hook
//
// Returns: { ok: true, token } | { ok: false, error: string }
// ─────────────────────────────────────────────
const prepare = async ({
  person,
  actionType,
  coords,
  clockInFence,
  qrRawValue = null,
  faceVerified = false,
  spoofingDetected = false,
}) => {
  // ── Safety: GPS spoofing hard block ─────────
  if (spoofingDetected)
    return {ok: false, error: 'Suspicious GPS activity detected. Cannot record attendance.'};

  // ── Parallel SOAP fetch ──────────────────────
  // P0 CORE: Both retrieve APIs called simultaneously.
  let rawFences, rawPunches;
  try {
    [rawFences, rawPunches] = await Promise.all([
      RetrieveByPerson({person}),
      RetrieveByPersonAttendance({person}),
    ]);
  } catch (err) {
    return {ok: false, error: `Failed to fetch server data: ${err.message}`};
  }

  // ── Geofence evaluation ──────────────────────
  const enriched = coords ? enrichFences(rawFences ?? [], coords) : [];
  const matchedFence = coords ? selectBestFence(enriched) : null;
  const actionFence = getActionFenceFromFences(actionType, matchedFence, clockInFence);

  // Clock In requires a matched fence
  if (actionType === ACTION_TYPES.CLOCK_IN && !actionFence) {
    return {ok: false, error: 'You are outside all authorised zones. Move closer to an authorised location.'};
  }

  // ── Workflow check ───────────────────────────
  const records = aggregateServerPunches(rawPunches ?? []);
  const workflowError = workflowCheck(actionType, records);
  if (workflowError) return {ok: false, error: workflowError};

  // ── QR validation (parallel-friendly) ───────
  let qrValidated = false;
  const qrRequired =
    actionFence &&
    (() => {
      const val = String(actionFence?.IsQRCodeActive ?? '').trim().toLowerCase();
      return val === 'yes' || val === '1' || val === 'true';
    })();

  if (qrRequired) {
    if (!qrRawValue)
      return {ok: false, error: 'QR code scan is required for this location.'};

    try {
      const qrString =
        qrRawValue && typeof qrRawValue === 'object'
          ? qrRawValue.value
          : qrRawValue;
      const validationResult = await ValidateQRCode({
        qrImage: qrString,
        geoFenceID: String(actionFence?.GeoFenceID ?? ''),
      });
      if (!validationResult || validationResult === 0)
        return {ok: false, error: 'Invalid QR code for this location. Please scan the correct QR.'};
      qrValidated = true;
    } catch (err) {
      return {ok: false, error: `QR validation failed: ${err.message}`};
    }
  }

  // ── Network context capture (always) + validation (when configured) ────────
  // IMPORTANT: WiFi data is ALWAYS captured for audit trail and DB persistence,
  // regardless of whether this fence has a network policy configured.
  // Validation (blocking) is only enforced when fenceNetworks.length > 0.
  // fetchNetworkInfo and fetchPublicIP run in parallel — zero added latency.
  const [netInfo, publicIp] = await Promise.all([
    fetchNetworkInfo(),
    fetchPublicIP(),
  ]);

  // Default: always send all three network fields.
  //   NetworkID   = device public IP  (unique per network, backend audit field)
  //   NetworkName = WiFi SSID          (human-readable network name)
  //   BSSID       = AP hardware MAC   (unique per access point)
  let networkContext = {
    networkId: publicIp ?? null,         // public IP — always recorded
    networkName: netInfo.ssid ?? null,   // device SSID — always recorded
    bssid: netInfo.bssid ?? null,        // device BSSID — always recorded
  };

  const fenceNetworks = actionFence?.networks ?? [];

  if (__DEV__) {
    console.log(
      '[Orchestrator] actionFence.networks:',
      JSON.stringify(fenceNetworks),
      '→ count:', fenceNetworks.length,
    );
  }

  if (fenceNetworks.length > 0) {
    // This fence enforces a network policy — run validation.
    if (isUnknownSsid(netInfo.ssid) && netInfo.isWifi) {
      return {
        ok: false,
        error:
          'Unable to read WiFi network name. Ensure Location permission is granted and Location Services are enabled.',
      };
    }

    const {networkMatched, networkFailReason} = checkNetworkMatch(
      fenceNetworks,
      netInfo.ssid,
      netInfo.bssid,
      netInfo.isWifi,
    );

    if (!networkMatched)
      return {ok: false, error: buildNetworkErrorMessage(actionFence, networkFailReason)};

    // Upgrade networkContext with canonical values from the matched fence entry.
    // Falls back to live device values if the fence entry has no configured value.
    const matchedNet = fenceNetworks.find(net => {
      const ssidMatch =
        net.NetworkName &&
        normalizeNet(net.NetworkName) === normalizeNet(netInfo.ssid);
      // Mirror the same [] guard used in checkNetworkMatch so both checks
      // are guaranteed to agree on whether BSSID is "configured".
      const bssidConfigured =
        net.BSSID &&
        !(Array.isArray(net.BSSID) && net.BSSID.length === 0) &&
        normalizeNet(net.BSSID).length > 0;
      const bssidMatch =
        !bssidConfigured ||
        (netInfo.bssid && normalizeNet(net.BSSID) === normalizeNet(netInfo.bssid));
      return ssidMatch && bssidMatch;
    });
    networkContext = {
      // Priority: admin-configured NetworkID in fence entry → device public IP
      networkId: matchedNet?.NetworkID ?? publicIp ?? null,
      networkName: matchedNet?.NetworkName ?? netInfo.ssid,
      bssid: matchedNet?.BSSID ?? netInfo.bssid,
    };

    console.log('[Orchestrator] Network validated. networkContext:', networkContext);
  } else {
    console.log('[Orchestrator] No fence network policy. WiFi captured for audit:', networkContext);
  }

  // ── Build and return ValidationToken ────────
  const token = {
    actionType,
    person,
    fenceId: actionFence?.GeoFenceID ?? null,
    matchedFence: actionFence,           // Full fence object embedded
    serverPunches: rawPunches ?? [],     // Raw punches for re-check on confirm
    networkContext,
    coords,
    qrRawValue,
    qrValidated,
    faceVerified,
    fetchedAt: Date.now(),
  };

  return {ok: true, token};
};

// ─────────────────────────────────────────────
// confirm()
//
// Called when the user presses "Confirm" on the confirm screen.
// Validates the token is still fresh (< 60s) and re-checks
// workflow state from the embedded data. If token is expired,
// transparently re-validates.
//
// Parameters:
//   token          — ValidationToken from prepare()
//   generationType — SOAP GenerationType string ('ClockIn', 'ClockOut', etc.)
//   personRecId    — from Redux
//   deviceId       — from DeviceInfo.getUniqueId()
//   note           — optional user note (not sent to SOAP but kept for future)
//   clockInFence   — fence at clock-in time (for Clock Out / Break)
//   spoofingDetected — current spoofing state at confirm time
//
// Returns: SOAP CreateUserAttendance result
// Throws on any validation or SOAP failure
// ─────────────────────────────────────────────
const confirm = async ({
  token,
  generationType,
  personRecId,
  deviceId,
  clockInFence,
  spoofingDetected = false,
}) => {
  if (!token) throw new Error('No validation token. Please restart the action.');

  // Spoofing re-check at confirm time
  if (spoofingDetected)
    throw new Error('Suspicious GPS activity detected. Cannot record attendance.');

  let activeToken = token;

  // ── Token freshness check ────────────────────
  const tokenAge = Date.now() - token.fetchedAt;
  if (tokenAge > TOKEN_TTL_MS) {
    // Token expired — transparently re-validate
    console.log(`[Orchestrator] Token expired after ${Math.round(tokenAge / 1000)}s — re-validating`);
    const result = await prepare({
      person: token.person,
      actionType: token.actionType,
      coords: token.coords,
      clockInFence,
      qrRawValue: token.qrRawValue,
      faceVerified: token.faceVerified,
      spoofingDetected,
    });
    if (!result.ok) throw new Error(result.error);
    activeToken = result.token;
  } else {
    // Token is fresh — re-check workflow state from embedded punches only
    const records = aggregateServerPunches(activeToken.serverPunches ?? []);
    const workflowError = workflowCheck(activeToken.actionType, records);
    if (workflowError) throw new Error(workflowError);
  }

  // ── Build attendance payload ─────────────────
  const attendanceData = await buildAttendancePayload({
    fence: activeToken.matchedFence,
    coords: activeToken.coords,
    generationType,
    networkContext: activeToken.networkContext,
    personRecId,
    qrValue: activeToken.qrRawValue,
    faceResult: {verified: activeToken.faceVerified},
    deviceContext: {id: deviceId},
    mode: ATTENDANCE_MODE.ONLINE,
  });

  // ── Submit directly (no queue) ───────────────
  return await submitAttendanceDirect(attendanceData);
};

// ─────────────────────────────────────────────
// Re-export for convenience
// ─────────────────────────────────────────────
export const AttendanceOrchestrator = {prepare, confirm};
export default AttendanceOrchestrator;
