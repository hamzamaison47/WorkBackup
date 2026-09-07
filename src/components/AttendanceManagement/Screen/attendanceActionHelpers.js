// ─────────────────────────────────────────────
// components/AttendanceManagement/Screen/attendanceActionHelpers.js
//
// OPTIMIZATIONS:
//   P1.1 — prewarmToken(): fires getToken() early on screen mount so the
//           token is already in-flight or cached when SOAP calls are needed.
//   P3.1 — TokenManager singleton: centralizes token lifecycle.
//           Shares in-flight token refresh across concurrent callers.
//           Proactively refreshes token 60s before expiry to eliminate
//           cold-path token delays during confirm press.
// ─────────────────────────────────────────────
import {
  canClockIn,
  canClockOut,
  canEndBreak,
  canStartBreak,
} from '../../../screens/AttendanceManagement/helpers';
import {getToken} from '../../../API/Token/getToken';
import ntpClient from 'react-native-ntp-client';

export const ACTION_TYPES = {
  CLOCK_IN: 'CLOCK_IN',
  CLOCK_OUT: 'CLOCK_OUT',
  BREAK_START: 'BREAK_START',
  BREAK_END: 'BREAK_END',
};

export const ATTENDANCE_MODE = {
  NONE: 'None',
  ONLINE: 'Online',
  OFFLINE: 'Offline',
};

// ─────────────────────────────────────────────
// P3.1 — TokenManager
// Centralizes OAuth token lifecycle. All callers share one in-flight
// promise. Proactive refresh fires 60s before expiry.
// ─────────────────────────────────────────────
const _tokenManager = (() => {
  let _token = null;
  let _expiresAt = 0; // epoch ms
  let _inflightPromise = null;
  const EXPIRE_BUFFER_MS = 60_000; // refresh 60s before actual expiry

  // Estimate expiry: most Azure tokens are 3600s; we assume 3500s to be safe.
  const TOKEN_LIFETIME_MS = 3_500_000;

  const _fetchToken = async () => {
    const t = await getToken();
    _token = t;
    _expiresAt = Date.now() + TOKEN_LIFETIME_MS;
    return t;
  };

  const get = async () => {
    const now = Date.now();
    const needsRefresh = !_token || now >= _expiresAt - EXPIRE_BUFFER_MS;
    if (!needsRefresh) {
      return _token;
    }

    if (_inflightPromise) {
      return _inflightPromise;
    }

    _inflightPromise = _fetchToken().finally(() => {
      _inflightPromise = null;
    });
    return _inflightPromise;
  };

  // P1.1 — prewarmToken: call on screen mount so token is ready
  const prewarm = () => {
    // Fire and forget — errors intentionally swallowed here
    get().catch(() => {});
  };

  return {get, prewarm};
})();

export const TokenManager = _tokenManager;

// Convenience export for screen-mount pre-warming
export const prewarmToken = () => _tokenManager.prewarm();

// ─────────────────────────────────────────────
export const getActionFence = ({actionType, matchedFence, clockInFence}) => {
  if (actionType === ACTION_TYPES.CLOCK_IN) {
    return matchedFence ?? null;
  }
  return clockInFence ?? matchedFence ?? null;
};

export const getValidationMessage = ({
  actionType,
  records,
  matchedFence,
  locationError,
}) => {
  switch (actionType) {
    case ACTION_TYPES.CLOCK_IN: {
      if (!matchedFence) {
        return (
          locationError ??
          'Unable to verify your location. Please refresh and ensure GPS is enabled.'
        );
      }
      if (!canClockIn(records)) {
        return 'You already have an active session. Clock out first, or pull down to refresh.';
      }
      return null;
    }

    case ACTION_TYPES.CLOCK_OUT:
      if (!canClockOut(records)) {
        return records.length === 0
          ? 'No active session found. Please clock in first.'
          : canEndBreak(records)
          ? 'You are on a break. End your break before clocking out.'
          : 'You are not currently clocked in.';
      }
      return null;

    case ACTION_TYPES.BREAK_START:
      if (!canStartBreak(records)) {
        return records.length === 0
          ? 'You must be clocked in to start a break.'
          : 'You cannot start a break right now. Check your current status.';
      }
      return null;

    case ACTION_TYPES.BREAK_END:
      if (!canEndBreak(records)) {
        return 'There is no active break to end.';
      }
      return null;

    default:
      return 'This attendance action is not available right now.';
  }
};

// ─────────────────────────────────────────────
// getTrueTime — NTP-synced timestamp with device-time fallback
// ─────────────────────────────────────────────
export const getTrueTime = () => {
  return new Promise(resolve => {
    const timeout = setTimeout(() => {
      console.warn('NTP sync timed out, using device time.');
      resolve({time: new Date().toISOString(), isOfflineTime: true});
    }, 3000);

    try {
      ntpClient.getNetworkTime('pool.ntp.org', 123, (err, date) => {
        clearTimeout(timeout);
        if (err) {
          console.warn('NTP sync failed, using device time:', err);
          resolve({time: new Date().toISOString(), isOfflineTime: true});
        } else {
          resolve({time: date.toISOString(), isOfflineTime: false});
        }
      });
    } catch (e) {
      clearTimeout(timeout);
      console.warn('NTP exception, using device time:', e);
      resolve({time: new Date().toISOString(), isOfflineTime: true});
    }
  });
};

// ─────────────────────────────────────────────
// buildAttendancePayload
// ─────────────────────────────────────────────
export const buildAttendancePayload = async ({
  fence,
  coords,
  generationType,
  networkContext,
  personRecId,
  qrValue,
  faceResult,
  biometricVerified = false,
  deviceContext,
  mode,
}) => {
  const qrString =
    qrValue && typeof qrValue === 'object' ? qrValue.value : qrValue ?? null;

  const {time: punchTime, isOfflineTime} = await getTrueTime();

  const payload = {
    FenceName: fence?.FenceName,
    GenerationType: generationType,
    GeoFenceID: fence?.GeoFenceID,
    Latitude: coords?.latitude,
    LocationCode: fence?.LocationCode,
    Longitude: coords?.longitude,
    Mode: mode ?? ATTENDANCE_MODE.NONE,
    NetworkID: networkContext?.networkId,
    NetworkName: networkContext?.networkName,
    BSSID: networkContext?.bssid,
    PersonRecId: personRecId ? Number(personRecId) : undefined,
    PunchDateTime: punchTime,
    IsOfflineTime: isOfflineTime,
    DeviceId: deviceContext?.id || null,
    QRImage: qrString,
    VerifyFaceId: faceResult?.verified === true,
    VerifyBiometric: biometricVerified === true,
  };

  if (__DEV__) {
    console.log('[buildAttendancePayload] raw payload:', {
      NetworkID: payload.NetworkID,
      NetworkName: payload.NetworkName,
      BSSID: payload.BSSID,
      DeviceId: payload.DeviceId,
      GenerationType: payload.GenerationType,
    });
  }

  const filtered = Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => {
      if (key === 'DeviceId') {
        return true;
      } // always send, SOAP builder handles nil
      if (value === null || value === undefined) {
        return false;
      }
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      return true;
    }),
  );

  if (__DEV__) {
    const missing = ['NetworkID', 'NetworkName', 'BSSID'].filter(
      k => !(k in filtered),
    );
    if (missing.length) {
      console.warn(
        '[buildAttendancePayload] ⚠️ Fields stripped from payload:',
        missing,
      );
    } else {
      console.log(
        '[buildAttendancePayload] ✓ Network fields present in payload.',
      );
    }
  }

  return filtered;
};
