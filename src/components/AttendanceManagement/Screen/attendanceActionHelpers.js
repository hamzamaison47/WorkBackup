import {
  canClockIn,
  canClockOut,
  canEndBreak,
  canStartBreak,
} from '../../../screens/AttendanceManagement/helpers';
import {checkIsOnline} from '../../../hooks/useNetworkCheck';

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

import ntpClient from 'react-native-ntp-client';

export const getTrueTime = () => {
  return new Promise(resolve => {
    // using a timeout approach to not block forever if port 123 is blocked
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

export const buildAttendancePayload = async ({
  fence,
  coords,
  generationType,
  networkContext,
  personRecId,
  qrValue,
  faceResult,   // NEW: { verified: boolean } | null — from FaceVerificationModal
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
    DeviceId: deviceContext?.id || undefined,
    QRImage: qrString,
    // Face verification — true when the user passed the liveness gate
    VerifyFaceId: faceResult?.verified === true,
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      return true;
    }),
  );
};
