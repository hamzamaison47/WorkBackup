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
  isUnknownSsid,
  isPlaceholderBssid,
} from '../../components/AttendanceManagement/GeofenceContext';
import {
  ACTION_TYPES,
  buildAttendancePayload,
  ATTENDANCE_MODE,
  getTrueTime,
} from '../../components/AttendanceManagement/Screen/attendanceActionHelpers';
import {submitAttendanceDirect} from './SyncManager';
import NetInfo from '@react-native-community/netinfo';
import {
  haversineDistance,
  getFreshPositionWithTimeout,
} from '../../hooks/useLocation';

const SOFT_BUFFER_METRES = 15;
const TOKEN_TTL_MS = 60_000; // Validation token valid for 60 seconds
// Cap on a single NetInfo read. Raised from 4000 — a COLD SSID/BSSID native
// lookup (first read after foreground) routinely needs >4s, and racing it to
// null made the whole network read come back empty → false "wrong network".
const NETINFO_READ_TIMEOUT_MS = 8000;
// Shorter cap for the wifi-specific re-read (a supplementary read, not the
// primary) so retries stay bounded.
const NETINFO_REREAD_TIMEOUT_MS = 4000;
// One retry after a short delay when the first read came back empty/placeholder.
const NETINFO_RETRY_DELAY_MS = 700;

// ─────────────────────────────────────────────
// Internal utilities
// ─────────────────────────────────────────────
const isActiveFlag = val => {
  const s = String(val).trim().toLowerCase();
  return s === '1' || s === 'yes' || s === 'true';
};

// Race a promise against a JS timer so a hung native call can't stall the punch
// flow. On timeout OR rejection this resolves with `onTimeoutValue` — never
// hangs, never throws.
const withTimeout = (promise, ms, onTimeoutValue) =>
  new Promise(resolve => {
    let done = false;
    const settle = v => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(v);
    };
    const timer = setTimeout(() => settle(onTimeoutValue), ms);
    promise.then(
      v => settle(v),
      () => settle(onTimeoutValue),
    );
  });

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

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
      withinRadius =
        !isNaN(radius) && distanceMetres <= radius + SOFT_BUFFER_METRES;
    }

    const networks = Array.isArray(f.Networks)
      ? // Guard against null entries (e.g. fence with Networks: null flattened
        // to [null] by normalizeObject before the null-check fix propagated).
        f.Networks.filter(n => n != null)
          .flatMap(n =>
            Array.isArray(n?.DFGeoFencesNetworksSvcContract)
              ? n.DFGeoFencesNetworksSvcContract.filter(e => e != null)
              : n != null
              ? [n]
              : [],
          )
          .filter(e => e != null && typeof e === 'object')
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
  const candidates = fences.filter(
    f => f.active && f.dateValid && f.withinRadius,
  );
  if (!candidates.length) return null;
  return candidates.reduce((a, b) =>
    b.distanceMetres < a.distanceMetres ? b : a,
  );
};

// ─────────────────────────────────────────────
// getActionFenceFromFences — fence selection logic for each action type
// ─────────────────────────────────────────────
const getActionFenceFromFences = (actionType, matchedFence, clockInFence) => {
  if (actionType === ACTION_TYPES.CLOCK_IN) return matchedFence ?? null;
  return clockInFence ?? matchedFence ?? null;
};

// ─────────────────────────────────────────────
// hasValidFenceId — the exact condition the backend enforces
//
// D365's create service runs DFGeoFenceTable::find(geoFenceID) and returns
// 'Invalid GeoFence ID.' when no record matches — which is what a blank ID
// produces. A null fence AND a fence carrying an empty/whitespace GeoFenceID
// both serialize to <GeoFenceID xsi:nil="true"/> (buildAttendancePayload strips
// empty strings; buildContractXml nils anything missing), so both must be
// treated as invalid here. Live IDs are strings ('Maison', 'Lahore'), never
// numeric, so a plain trim-and-length test is sufficient.
// ─────────────────────────────────────────────
const hasValidFenceId = fence =>
  String(fence?.GeoFenceID ?? '').trim().length > 0;

const FENCE_UNRESOLVED_MESSAGE =
  'Could not determine your work location. Pull down to refresh on the Time Clock screen and try again.';

// ─────────────────────────────────────────────
// recoverFenceFromPunches — server-side fallback for Clock Out / Break
//
// WHY THIS EXISTS (fresh-install 'Invalid GeoFence ID.' bug):
// For CLOCK_OUT / BREAK_*, the fence comes from `clockInFence ?? matchedFence`.
// `clockInFence` is persisted to AsyncStorage only AFTER a successful clock-in
// on THIS device, so on a fresh install it is null. `matchedFence` is null
// whenever the user is outside every zone — which clock-out deliberately allows.
// Both null meant a nil GeoFenceID went to the server and D365 rejected it.
//
// The server already knows the answer: every punch row carries the GeoFenceID it
// was made at, and aggregateServerPunches copies it onto the shift. So resolve
// the open shift's GeoFenceID against the fences we already fetched — zero extra
// SOAP calls, and it is the same fence the session was opened at.
//
// If the ID no longer appears in the user's assigned fences (fence unassigned
// mid-shift), fall back to a minimal fence carrying just the ID: the record
// still exists in DFGeoFenceTable so find() succeeds, and the user must remain
// able to close an open shift. `networks: []` means no network policy is
// enforced for that case — correct, since we hold no policy data for it.
// ─────────────────────────────────────────────
const recoverFenceFromPunches = (enrichedFences, serverPunches) => {
  const records = aggregateServerPunches(serverPunches ?? []);
  if (!records.length) return null;

  const openShift = records[records.length - 1];
  if (!openShift || openShift.clockOut || !openShift.clockIn) return null;

  const shiftFenceId = String(openShift.GeoFenceID ?? '').trim();
  if (!shiftFenceId) return null;

  const match = (enrichedFences ?? []).find(
    f => String(f?.GeoFenceID ?? '').trim() === shiftFenceId,
  );
  if (match) {
    console.log(
      '[Orchestrator] Fence recovered from open shift →',
      shiftFenceId,
    );
    return match;
  }

  console.warn(
    '[Orchestrator] Open shift fence no longer assigned to user; using ID only →',
    shiftFenceId,
  );
  return {
    GeoFenceID: openShift.GeoFenceID,
    FenceName: openShift.FenceName ?? shiftFenceId,
    LocationCode: openShift.LocationCode ?? null,
    networks: [],
  };
};

// ─────────────────────────────────────────────
// resolveActionFence — single fence-resolution path shared by prepare() and
// confirm() so the two can never drift (same rationale as resolveNetworkContext).
//
// Returns a fence with a usable GeoFenceID, or null. CLOCK_IN never recovers
// from history — being inside a zone is the whole precondition for clocking in —
// so callers emit their own CLOCK_IN-specific message.
// ─────────────────────────────────────────────
const resolveActionFence = ({
  actionType,
  matchedFence,
  clockInFence,
  enrichedFences,
  serverPunches,
}) => {
  const direct = getActionFenceFromFences(
    actionType,
    matchedFence,
    clockInFence,
  );
  if (hasValidFenceId(direct)) return direct;
  if (actionType === ACTION_TYPES.CLOCK_IN) return null;
  return recoverFenceFromPunches(enrichedFences, serverPunches);
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
//
// MITIGATION, NOT A CURE: on Android, NetInfo.fetch()/refresh() resolve from a
// module-level cache fed by a network callback registered once per process
// (ConnectivityReceiver / NetworkCallbackConnectivityReceiver). If that callback
// misses a transition, this can still return the previous network's state until
// the process restarts. Here we (a) force a refresh so the module re-queries the
// OS where supported, (b) read the ACTIVE connection's interface — never a
// hardcoded 'wifi', which would describe a cellular connection with stale wifi
// fields after a switch — and (c) cap every read with a JS timeout so a hung
// native call can't stall the punch. The real guarantee that the SUBMITTED
// network is current comes from re-reading at Confirm time (Task 5).
// ─────────────────────────────────────────────
// Every network read resolves to this shape, so callers never have to guard
// against a missing key. WiFi fills ssid/bssid; cellular fills
// carrier/cellularGeneration; both come off the SAME NetInfo state object we
// already fetch — no extra call, library, or permission.
const EMPTY_NET_INFO = {
  isWifi: false,
  isCellular: false,
  ssid: null,
  bssid: null,
  carrier: null,
  cellularGeneration: null,
};

// One read attempt. Returns a network-info object, or null if the read timed
// out entirely (so the caller can decide whether to retry).
const readNetworkInfoOnce = async () => {
  const read = NetInfo.refresh ? NetInfo.refresh() : NetInfo.fetch();
  let state = await withTimeout(read, NETINFO_READ_TIMEOUT_MS, null);

  // If wifi is active but SSID didn't come through, re-read the ACTIVE
  // interface (state.type), not a hardcoded 'wifi' — so after a wifi→cellular
  // switch we never re-describe the connection with stale wifi details.
  if (state && state.type === 'wifi' && !state.details?.ssid) {
    const reread = await withTimeout(
      NetInfo.fetch(state.type),
      NETINFO_REREAD_TIMEOUT_MS,
      null,
    );
    if (reread) state = reread;
  }

  if (state && state.type === 'wifi' && state.details) {
    return {
      ...EMPTY_NET_INFO,
      isWifi: true,
      ssid: state.details.ssid ?? null,
      bssid: state.details.bssid ?? null,
    };
  }
  // Cellular: there is no SSID/BSSID by definition (NetInfo's cellular state
  // has no such fields), but it does carry carrier + generation. Capture them
  // so the punch can record a meaningful NetworkName instead of a nil.
  if (state && state.type === 'cellular') {
    return {
      ...EMPTY_NET_INFO,
      isCellular: true,
      carrier: state.details?.carrier ?? null,
      cellularGeneration: state.details?.cellularGeneration ?? null,
    };
  }
  // Connected but neither wifi nor cellular (ethernet/none/unknown).
  if (state) return {...EMPTY_NET_INFO};
  // Read timed out — signal "unknown" so the caller retries.
  return null;
};

const fetchNetworkInfo = async () => {
  try {
    let info = await readNetworkInfoOnce();

    // Retry ONCE (after a short delay) when the first read was useless: it timed
    // out, OR it came back on wifi but with an empty/placeholder SSID *and*
    // BSSID (the classic cold-read permission/timing quirk). A single empty read
    // must never be the reason a punch is rejected — give it one more chance.
    const emptyWifiRead =
      info &&
      info.isWifi &&
      isUnknownSsid(info.ssid) &&
      isPlaceholderBssid(info.bssid);
    if (!info || emptyWifiRead) {
      await sleep(NETINFO_RETRY_DELAY_MS);
      const retry = await readNetworkInfoOnce();
      if (retry) info = retry;
    }

    const result = info ?? {...EMPTY_NET_INFO};
    if (__DEV__) {
      console.log('[Orchestrator] fetchNetworkInfo raw read →', result);
    }
    return result;
  } catch {
    return {...EMPTY_NET_INFO};
  }
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
// acquireFreshCoords — timeout-safe live GPS read
//
// Uses getFreshPositionWithTimeout (never the library's own timeout, which is
// a no-op on the Play-Services path) with a high-accuracy attempt falling back
// to low-accuracy. Returns null if no fix can be obtained. This is the ONLY
// coordinate source used to build the submitted payload at Confirm time.
// ─────────────────────────────────────────────
const acquireFreshCoords = async () => {
  const toCoords = p => ({
    latitude: p.coords.latitude,
    longitude: p.coords.longitude,
    accuracy: p.coords.accuracy,
    timestamp: p.timestamp,
  });
  try {
    return toCoords(
      await getFreshPositionWithTimeout({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }),
    );
  } catch {
    try {
      return toCoords(
        await getFreshPositionWithTimeout({
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 30000,
        }),
      );
    } catch {
      return null;
    }
  }
};

// ─────────────────────────────────────────────
// resolveNetworkLabel — the human-readable NetworkName written to the record
//
// WiFi     → the real SSID. Unchanged.
// Cellular → 'Mobile Data', plus carrier/generation when they are readable.
// Anything else (ethernet/none/unknown) → null, as before.
//
// WHY THE FIXED PREFIX: NetworkName previously went up as <NetworkName
// xsi:nil="true"/> on mobile data, which in D365 is indistinguishable from a
// WiFi punch whose SSID could not be read (Location permission off / cold read
// → isUnknownSsid). A guaranteed 'Mobile Data' prefix makes those two cases
// tellable apart in the attendance report.
//
// The carrier name is BEST-EFFORT ONLY and must never gate the prefix: Android
// returns a real name, but iOS 16+ deprecated CTCarrier.carrierName and hands
// back '--' or nil. So '--', null, undefined and blank are all rejected before
// the carrier is appended, and the label degrades to plain 'Mobile Data'.
// ─────────────────────────────────────────────
const CELLULAR_LABEL = 'Mobile Data';

// iOS 16+ returns this placeholder in place of the deprecated carrier name.
const IOS_CARRIER_PLACEHOLDER = '--';

const isUsableCarrier = carrier => {
  const c = String(carrier ?? '').trim();
  return c.length > 0 && c !== IOS_CARRIER_PLACEHOLDER;
};

const resolveNetworkLabel = netInfo => {
  if (netInfo?.isWifi) return netInfo.ssid ?? null;
  if (!netInfo?.isCellular) return null;

  const parts = [];
  if (isUsableCarrier(netInfo.carrier)) {
    parts.push(String(netInfo.carrier).trim());
  }
  // NetInfo reports '2g' | '3g' | '4g' | '5g' | null — surface it uppercased.
  const generation = String(netInfo.cellularGeneration ?? '')
    .trim()
    .toUpperCase();
  if (generation.length > 0 && generation !== 'UNKNOWN') {
    parts.push(generation);
  }

  return parts.length
    ? `${CELLULAR_LABEL} (${parts.join(', ')})`
    : CELLULAR_LABEL;
};

// ─────────────────────────────────────────────
// resolveNetworkContext — capture + policy-enforce network from a live read
//
// Shared by prepare() and confirm() so the two can never drift. Given the
// action fence and a live network read, it ALWAYS captures the three network
// fields (audit trail), and enforces the fence's network policy only when
// fenceNetworks.length > 0. Returns {ok:true, networkContext} on success, or
// {ok:false, error} when a configured policy is violated.
// ─────────────────────────────────────────────
const resolveNetworkContext = (actionFence, netInfo, publicIp) => {
  // Default: always send all three network fields.
  //   NetworkID   = device public IP (unique per network, backend audit field)
  //   NetworkName = WiFi SSID, or a 'Mobile Data' label on cellular
  //                 (see resolveNetworkLabel)
  //   BSSID       = AP hardware MAC   (unique per access point)
  let networkContext = {
    networkId: publicIp ?? null,
    networkName: resolveNetworkLabel(netInfo),
    bssid: netInfo.bssid ?? null,
  };

  const fenceNetworks = actionFence?.networks ?? [];
  if (fenceNetworks.length === 0) {
    return {ok: true, networkContext};
  }

  // This fence enforces a network policy. Run the match rule (SSID name is
  // authoritative; BSSID never blocks — multi-AP office WiFi; public IP is a
  // fallback consulted ONLY when the SSID is unreadable). We deliberately do
  // NOT pre-fail on an unknown SSID here — the matcher owns that decision.
  const {networkMatched, networkFailReason, matchedSignal, matchedNetwork} =
    checkNetworkMatch(
      fenceNetworks,
      netInfo.ssid,
      netInfo.bssid,
      netInfo.isWifi,
      publicIp,
    );

  if (__DEV__) {
    console.log('[Orchestrator] network match →', {
      device: {
        ssid: netInfo.ssid,
        bssid: netInfo.bssid,
        isWifi: netInfo.isWifi,
        isCellular: netInfo.isCellular,
        carrier: netInfo.carrier,
        cellularGeneration: netInfo.cellularGeneration,
        publicIp: publicIp ?? null,
      },
      matched: networkMatched,
      matchedSignal, // 'SSID' | 'BSSID+SSID' | 'NetworkID-fallback' | null
      failReason: networkFailReason,
    });
  }

  if (!networkMatched) {
    return {
      ok: false,
      error: buildNetworkErrorMessage(actionFence, networkFailReason),
    };
  }

  // Upgrade networkContext with canonical values from the matched fence entry
  // (returned by checkNetworkMatch so the two can never disagree). Falls back to
  // live device values if the fence entry left a field unset.
  networkContext = {
    // Priority: admin-configured NetworkID in fence entry → device public IP
    networkId: matchedNetwork?.NetworkID ?? publicIp ?? null,
    // Same live-value fallback as before; resolveNetworkLabel returns exactly
    // netInfo.ssid on WiFi, so WiFi behaviour here is unchanged. It only differs
    // when this path is reached on cellular — possible via checkNetworkMatch's
    // NetworkID (public IP) fallback — where it yields the 'Mobile Data' label
    // instead of a nil.
    networkName: matchedNetwork?.NetworkName ?? resolveNetworkLabel(netInfo),
    bssid: matchedNetwork?.BSSID ?? netInfo.bssid,
  };
  return {ok: true, networkContext};
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
    return {
      ok: false,
      error: 'Suspicious GPS activity detected. Cannot record attendance.',
    };

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
  // Always enrich, even without coords: enrichFences leaves distanceMetres null
  // and withinRadius false when coords is null (so selectBestFence still returns
  // null, exactly as the previous `coords ? … : []` did), but the enriched list
  // is now available to recoverFenceFromPunches, which needs the fences' network
  // policy regardless of whether we have a GPS fix.
  const enriched = enrichFences(rawFences ?? [], coords);
  const matchedFence = selectBestFence(enriched);
  const actionFence = resolveActionFence({
    actionType,
    matchedFence,
    clockInFence,
    enrichedFences: enriched,
    serverPunches: rawPunches,
  });

  // Clock In requires a matched fence
  if (actionType === ACTION_TYPES.CLOCK_IN && !actionFence) {
    return {
      ok: false,
      error:
        'You are outside all authorised zones. Move closer to an authorised location.',
    };
  }

  // ── Workflow check ───────────────────────────
  // Runs BEFORE the blank-fence guard on purpose: when there is no open shift,
  // recoverFenceFromPunches legitimately returns null, and "No active session to
  // clock out of." diagnoses that far better than a location message would.
  const records = aggregateServerPunches(rawPunches ?? []);
  const workflowError = workflowCheck(actionType, records);
  if (workflowError) return {ok: false, error: workflowError};

  // Clock Out / Break: never let a blank GeoFenceID reach the server — D365
  // answers 'Invalid GeoFence ID.' and the user sees a meaningless error.
  if (!hasValidFenceId(actionFence)) {
    return {ok: false, error: FENCE_UNRESOLVED_MESSAGE};
  }

  // ── QR validation (parallel-friendly) ───────
  let qrValidated = false;
  const qrRequired =
    actionFence &&
    (() => {
      const val = String(actionFence?.IsQRCodeActive ?? '')
        .trim()
        .toLowerCase();
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
        return {
          ok: false,
          error:
            'Invalid QR code for this location. Please scan the correct QR.',
        };
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

  const fenceNetworks = actionFence?.networks ?? [];
  if (__DEV__) {
    console.log(
      '[Orchestrator] actionFence.networks:',
      JSON.stringify(fenceNetworks),
      '→ count:',
      fenceNetworks.length,
    );
  }

  const netResult = resolveNetworkContext(actionFence, netInfo, publicIp);
  if (!netResult.ok) return {ok: false, error: netResult.error};
  const networkContext = netResult.networkContext;

  console.log(
    fenceNetworks.length > 0
      ? '[Orchestrator] Network validated. networkContext:'
      : '[Orchestrator] No fence network policy. WiFi captured for audit:',
    networkContext,
  );

  // ── Build and return ValidationToken ────────
  const token = {
    actionType,
    person,
    fenceId: actionFence?.GeoFenceID ?? null,
    matchedFence: actionFence, // Full fence object embedded (display fallback)
    rawFences: rawFences ?? [], // Raw fences — re-matched vs fresh coords on confirm
    serverPunches: rawPunches ?? [], // Raw punches for re-check on confirm
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
//
// ARCHITECTURE (Task 5): the token is an ordering/integrity guard, NOT the
// source of the submitted coordinates or network. Everything actually written
// to the record — GPS coords, matched fence, network context — is (re-)read
// LIVE here, milliseconds before the SOAP call, so a location drift or network
// switch between prepare() and confirm() can never slip a stale value into the
// punch. A fresh read that fails geofence/network validation BLOCKS with a
// specific message; we never fall back to the token's stale snapshot.
//
// The freshness check only governs the workflow re-check: a fresh token
// re-checks workflow from embedded punches; an expired token re-runs prepare()
// (with FRESH coords, never token.coords) to refresh punches/QR/fences.
//
// Parameters:
//   token          — ValidationToken from prepare()
//   generationType — SOAP GenerationType string ('ClockIn', 'ClockOut', etc.)
//   personRecId    — from Redux
//   deviceId       — from DeviceInfo.getUniqueId()
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
  if (!token)
    throw new Error('No validation token. Please restart the action.');

  // Spoofing re-check at confirm time
  if (spoofingDetected)
    throw new Error(
      'Suspicious GPS activity detected. Cannot record attendance.',
    );

  let activeToken = token;

  // ── Token freshness → workflow guard ─────────
  const tokenAge = Date.now() - token.fetchedAt;
  if (tokenAge > TOKEN_TTL_MS) {
    // Token expired — re-validate. Acquire FRESH coords for the re-validation;
    // never re-feed token.coords (which would re-validate against a stale fix).
    console.log(
      `[Orchestrator] Token expired after ${Math.round(
        tokenAge / 1000,
      )}s — re-validating`,
    );
    const coordsForRevalidation = await acquireFreshCoords();
    const result = await prepare({
      person: token.person,
      actionType: token.actionType,
      coords: coordsForRevalidation,
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

  // ── AUTHORITATIVE LIVE READ (the values actually submitted) ──────────────
  const freshCoords = await acquireFreshCoords();
  if (!freshCoords)
    throw new Error(
      'Unable to get a current GPS location. Move to an open area and try again.',
    );

  // Re-match geofence against fresh coords using the fences embedded in the
  // (possibly re-validated) token — zero extra SOAP calls.
  const enriched = enrichFences(activeToken.rawFences ?? [], freshCoords);
  const matchedFence = selectBestFence(enriched);
  const actionFence = resolveActionFence({
    actionType: activeToken.actionType,
    matchedFence,
    clockInFence,
    enrichedFences: enriched,
    serverPunches: activeToken.serverPunches,
  });

  // Clock In still requires a live matched fence — block, don't fall back.
  if (activeToken.actionType === ACTION_TYPES.CLOCK_IN && !actionFence)
    throw new Error(
      'You are no longer within an authorised zone. Move closer to an authorised location and try again.',
    );

  // Final backstop before the payload is built: a blank GeoFenceID here is
  // exactly what D365 rejects with 'Invalid GeoFence ID.', so fail with a
  // message the user can act on instead of surfacing the backend's.
  if (!hasValidFenceId(actionFence)) throw new Error(FENCE_UNRESOLVED_MESSAGE);

  // Re-read the network live and re-enforce the action fence's policy.
  const [netInfo, publicIp] = await Promise.all([
    fetchNetworkInfo(),
    fetchPublicIP(),
  ]);
  const netResult = resolveNetworkContext(actionFence, netInfo, publicIp);
  if (!netResult.ok) throw new Error(netResult.error);
  const networkContext = netResult.networkContext;

  if (__DEV__) {
    console.log('[Orchestrator] confirm() live read →', {
      coords: freshCoords,
      fence: actionFence?.GeoFenceID,
      networkContext,
    });
  }

  // ── Build attendance payload from FRESH values ───────────
  const attendanceData = await buildAttendancePayload({
    fence: actionFence,
    coords: freshCoords,
    generationType,
    networkContext,
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
