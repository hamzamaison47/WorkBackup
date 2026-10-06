// ─────────────────────────────────────────────
// components/AttendanceManagement/Screen/attendanceActionHelpers.js
//
// OPTIMIZATIONS:
//   P1.1 — prewarmToken(): fires getToken() early on screen mount so the
//           token is already in-flight or cached when SOAP calls are needed.
//   P7.1 — Removed the separate TokenManager cache. It fed its own private
//           cache that no SOAP call ever actually read from — RetrieveByPerson,
//           RetrieveByPersonAttendance, etc. all call getToken() directly,
//           which has its OWN cache in getToken.js. Two independent caches
//           meant prewarmToken() was warming a cache nothing consumed. Now
//           there is exactly ONE token cache (in getToken.js) and prewarmToken
//           warms that same cache every SOAP call actually reads from.
// ─────────────────────────────────────────────
import {
  canClockIn,
  canClockOut,
  canEndBreak,
  canStartBreak,
} from '../../../screens/AttendanceManagement/helpers';
import {getToken, invalidateTokenCache} from '../../../API/Token/getToken';
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

// ── Friendly, honest messages for integrity failures ──
// Only mock_flag names a cause, because it is direct evidence. The rest
// describe what the check found, never accuse the user.
const SPOOF_MESSAGES = {
  mock_flag: {
    title: 'Location Check Failed',
    message:
      'A fake-location app appears to be active on this phone. Turn it off, then try again.',
  },
  accuracy_too_perfect: {
    title: 'Location Check Failed',
    message:
      "We couldn't verify your location. Move to an open area, wait a few seconds, and try again.",
  },
  impossible_speed: {
    title: 'Location Check Failed',
    message:
      'Your location signal looks unreliable. Wait a few seconds for GPS to settle, then try again.',
  },
  position_jump: {
    title: 'Location Check Failed',
    message:
      'Your location changed suddenly. Wait a few seconds for GPS to settle, then try again.',
  },
  rooted_device: {
    title: 'Device Security Check',
    message:
      "Our security check flagged this device as modified, so attendance can't be recorded on it. If you think this is a mistake, please contact HR or IT.",
  },
  untrusted_device: {
    title: 'Device Security Check',
    message:
      "This device didn't pass our security check. If you think this is a mistake, please contact HR or IT.",
  },
  emulator: {
    title: 'Unsupported Device',
    message: 'Attendance can only be recorded from a physical phone.',
  },
};

export const getSpoofMessage = reason =>
  SPOOF_MESSAGES[reason] ?? {
    title: 'Location Check Failed',
    message:
      "We couldn't verify your location. Please check that GPS is on and try again.",
  };

// P1.1 — prewarmToken: call on screen mount so the token is fetched (or
// served from cache) before the user presses an action button. Fire and
// forget — errors are intentionally swallowed here; a real failure will
// surface naturally the next time something actually needs the token.
export const prewarmToken = () => {
  getToken().catch(() => {});
};

// Re-exported for any caller that needs to force a fresh token (e.g. after
// a 401 from a SOAP call, or an explicit re-login).
export {invalidateTokenCache};

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
