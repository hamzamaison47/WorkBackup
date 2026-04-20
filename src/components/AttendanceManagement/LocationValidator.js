// ─────────────────────────────────────────────
// server/locationValidator.js
// ─────────────────────────────────────────────
/* eslint-disable curly */
/* eslint-disable no-undef */
const {Client} = require('@googlemaps/google-maps-services-js');
const mapsClient = new Client({});

// ── S11 — In-memory rate limit store ─────────────────────────
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_EVENTS = 10;

const checkRateLimit = userId => {
  const now = Date.now();
  const times = (rateLimitStore.get(userId) || []).filter(
    t => now - t < RATE_LIMIT_WINDOW_MS,
  );
  if (times.length >= RATE_LIMIT_MAX_EVENTS) {
    return {allowed: false, count: times.length};
  }
  times.push(now);
  rateLimitStore.set(userId, times);
  return {allowed: true, count: times.length};
};

// ── S12 — Duplicate event detection ─────────────────────────
const lastEventStore = new Map();
const DUPLICATE_WINDOW_MS = 30 * 1000;

const checkDuplicate = (userId, eventType, submittedAt) => {
  const last = lastEventStore.get(userId);
  if (!last) {
    lastEventStore.set(userId, {eventType, timestamp: Date.now()});
    return {isDuplicate: false};
  }
  const elapsed = Date.now() - last.timestamp;
  if (last.eventType === eventType && elapsed < DUPLICATE_WINDOW_MS) {
    return {isDuplicate: true, elapsedMs: elapsed};
  }
  lastEventStore.set(userId, {eventType, timestamp: Date.now()});
  return {isDuplicate: false};
};

// ── Office geofence ──────────────────────────────────────────
const getOfficeGeofence = () => {
  const raw = process.env.OFFICE_GEOFENCE_JSON;
  if (!raw) throw new Error('OFFICE_GEOFENCE_JSON not configured');
  return JSON.parse(raw);
};

// ── S3 — Play Integrity verification ─────────────────────────
const verifyIntegrityToken = async token => {
  if (!token) return {verdict: 'MISSING', deviceIntegrity: false};

  const pkg = process.env.ANDROID_PACKAGE_NAME ?? 'com.yourapp';
  const url = `https://playintegrity.googleapis.com/v1/${pkg}:decodeIntegrityToken`;

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GOOGLE_OAUTH_TOKEN}`,
      },
      body: JSON.stringify({integrity_token: token}),
      signal: AbortSignal.timeout(8000),
    });

    if (!resp.ok) return {verdict: 'UNVERIFIED', deviceIntegrity: false};

    const data = await resp.json();
    const labels =
      data?.tokenPayloadExternal?.deviceIntegrity?.deviceRecognitionVerdict ??
      [];

    return {
      verdict: labels.join(','),
      deviceIntegrity: labels.includes('MEETS_DEVICE_INTEGRITY'),
      basicIntegrity: labels.includes('MEETS_BASIC_INTEGRITY'),
    };
  } catch (err) {
    console.warn('[locationValidator] Integrity check failed:', err.message);
    return {verdict: 'CHECK_FAILED', deviceIntegrity: false};
  }
};

// ── S6 — Distance Matrix API ─────────────────────────────────
const getDistanceMetres = async (userLat, userLng, officeLat, officeLng) => {
  const resp = await mapsClient.distancematrix({
    params: {
      origins: [`${userLat},${userLng}`],
      destinations: [`${officeLat},${officeLng}`],
      mode: 'walking',
      key: process.env.GOOGLE_MAPS_API_KEY,
    },
    timeout: 8000,
  });

  const element = resp.data.rows?.[0]?.elements?.[0];
  if (element?.status !== 'OK') {
    throw new Error(`Distance Matrix error: ${element?.status}`);
  }
  return element.distance.value;
};

// ── S8 — Reverse geocode for audit log ───────────────────────
const reverseGeocode = async (lat, lng) => {
  try {
    const resp = await mapsClient.reverseGeocode({
      params: {
        latlng: `${lat},${lng}`,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
      timeout: 5000,
    });
    return resp.data.results?.[0]?.formatted_address ?? 'Unknown address';
  } catch {
    return 'Geocoding unavailable';
  }
};

// ── NEW: Network (WiFi) validation ───────────────────────────
//
// Called only for CLOCK_IN.
// The office geofence JSON may include an optional `networks` array:
//   { ..., "networks": [{ "NetworkID": "xx:xx:xx", "NetworkName": "MAISON" }] }
//
// If the array is absent or empty → no WiFi check is performed.
// If present → submitted wifiSsid / wifiBssid must match at least one entry.
//
// Matching is case-insensitive on both sides.
//
// The client already collects wifi.details.ssid and wifi.details.bssid inside
// collectAttendanceData() and should forward them in the payload as
// `wifiSsid` and `wifiBssid`.

const normalizeNet = s =>
  String(s ?? '')
    .trim()
    .toLowerCase();

const checkNetworkPolicy = (officeNetworks, wifiSsid, wifiBssid) => {
  // No networks configured → skip
  if (!officeNetworks || officeNetworks.length === 0) {
    return {networkRequired: false, networkAllowed: true};
  }

  const ssid = normalizeNet(wifiSsid);
  const bssid = normalizeNet(wifiBssid);

  // Device wasn't on WiFi at all
  if (!ssid && !bssid) {
    return {
      networkRequired: true,
      networkAllowed: false,
      reason: 'NOT_ON_WIFI',
    };
  }

  const matched = officeNetworks.some(net => {
    const nameMatch =
      net.NetworkName && ssid && normalizeNet(net.NetworkName) === ssid;
    const idMatch =
      net.NetworkID && bssid && normalizeNet(net.NetworkID) === bssid;
    return nameMatch || idMatch;
  });

  if (!matched) {
    const allowed = officeNetworks
      .map(n => n.NetworkName || n.NetworkID)
      .filter(Boolean)
      .join(', ');
    return {
      networkRequired: true,
      networkAllowed: false,
      reason: `WRONG_NETWORK:detected_ssid=${
        wifiSsid ?? 'none'
      },allowed=${allowed}`,
    };
  }

  return {networkRequired: true, networkAllowed: true};
};

// ══════════════════════════════════════════════════════════════
//  Main validator
// ══════════════════════════════════════════════════════════════
/**
 * validateAttendanceEvent
 *
 * @param {object} payload
 * @param {string} payload.userId
 * @param {string} payload.eventType        CLOCK_IN | CLOCK_OUT | BREAK_START | BREAK_END
 * @param {object} payload.coords           { latitude, longitude, accuracy }
 * @param {string} payload.gpsTimestamp     ISO-8601
 * @param {boolean} payload.isMockLocation
 * @param {string} payload.integrityToken
 * @param {string} payload.submittedAt      ISO-8601
 * @param {string} [payload.wifiSsid]       NEW — from collectAttendanceData wifi.details.ssid
 * @param {string} [payload.wifiBssid]      NEW — from collectAttendanceData wifi.details.bssid
 *
 * @returns {{ ok: boolean, error?: string, address?: string, distanceMetres?: number }}
 */
const validateAttendanceEvent = async payload => {
  const {
    userId,
    eventType,
    coords,
    gpsTimestamp,
    isMockLocation,
    integrityToken,
    submittedAt,
    wifiSsid, // NEW
    wifiBssid, // NEW
  } = payload;

  // ── S1: Auth handled by middleware ──────────────────────

  // ── S11: Rate limiting ───────────────────────────────────
  const rateCheck = checkRateLimit(userId);
  if (!rateCheck.allowed) {
    return {
      ok: false,
      error: `RATE_LIMIT_EXCEEDED:${rateCheck.count}_events_in_last_hour`,
    };
  }

  // ── S12: Duplicate event detection ───────────────────────
  const dupCheck = checkDuplicate(userId, eventType, submittedAt);
  if (dupCheck.isDuplicate) {
    return {
      ok: false,
      error: `DUPLICATE_EVENT:same_${eventType}_within_${Math.round(
        dupCheck.elapsedMs / 1000,
      )}s`,
    };
  }

  // ── S2: Mock location flag ───────────────────────────────
  if (isMockLocation === true) {
    return {ok: false, error: 'MOCK_LOCATION_DETECTED'};
  }

  // ── S3: Play Integrity ───────────────────────────────────
  const integrity = await verifyIntegrityToken(integrityToken);
  if (!integrity.deviceIntegrity) {
    return {ok: false, error: `INTEGRITY_FAILED:${integrity.verdict}`};
  }

  // ── S4: Timestamp validation ─────────────────────────────
  const now = new Date(submittedAt ?? Date.now()).getTime();
  const gpsTime = gpsTimestamp ? new Date(gpsTimestamp).getTime() : 0;
  const deltaMs = Math.abs(now - gpsTime);
  if (deltaMs > 60_000) {
    return {
      ok: false,
      error: `STALE_TIMESTAMP:delta=${Math.round(deltaMs / 1000)}s`,
    };
  }

  // ── S5: Server-side geofence (not client config) ─────────
  const office = getOfficeGeofence();

  // G6 Policy: BREAK_START and BREAK_END skip distance check
  const skipDistanceCheck =
    eventType === 'BREAK_START' || eventType === 'BREAK_END';

  let distanceMetres = null;

  if (!skipDistanceCheck) {
    try {
      distanceMetres = await getDistanceMetres(
        coords.latitude,
        coords.longitude,
        office.latitude,
        office.longitude,
      );
    } catch (e) {
      return {ok: false, error: `DISTANCE_MATRIX_ERROR:${e.message}`};
    }

    if (eventType === 'CLOCK_IN' && distanceMetres > office.radius) {
      return {
        ok: false,
        error: `OUTSIDE_ZONE:distance=${Math.round(distanceMetres)}m,allowed=${
          office.radius
        }m`,
      };
    }
  }

  // ── NEW: Network validation ──────────────────────────────
  // Only enforced for CLOCK_IN. Mirrors client-side G6/G7 policy.
  // Office geofence JSON should include a `networks` array if WiFi check
  // is desired server-side:
  //   { ..., "networks": [{ "NetworkID": "xx:xx:xx", "NetworkName": "MAISON" }] }
  if (eventType === 'CLOCK_IN') {
    const officeNetworks = office.networks ?? [];
    const networkCheck = checkNetworkPolicy(
      officeNetworks,
      wifiSsid,
      wifiBssid,
    );

    if (!networkCheck.networkAllowed) {
      return {
        ok: false,
        error: `NETWORK_VALIDATION_FAILED:${networkCheck.reason}`,
      };
    }
  }
  // For CLOCK_OUT, BREAK_START, BREAK_END: log WiFi for audit but don't block

  // ── S7: GPS accuracy check ───────────────────────────────
  if (coords.accuracy == null || coords.accuracy > 50) {
    return {ok: false, error: `LOW_ACCURACY:accuracy=${coords.accuracy}m`};
  }

  // ── S8: Reverse geocode for audit log ────────────────────
  const address = await reverseGeocode(coords.latitude, coords.longitude);

  // ── S9: Write to DB ──────────────────────────────────────
  // await db.attendanceEvents.create({
  //   userId, eventType, coords, address,
  //   distanceMetres, integrityVerdict: integrity.verdict,
  //   wifiSsid, wifiBssid,    // ← also store for audit
  //   submittedAt,
  // });

  return {ok: true, address, distanceMetres};
};

module.exports = {validateAttendanceEvent};
