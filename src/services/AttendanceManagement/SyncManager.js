// ─────────────────────────────────────────────
// services/AttendanceManagement/SyncManager.js
//
// P1.4 OPTIMIZATION: Added submitAttendanceDirect() for online-first flow.
// In the fully online system, the confirm screens call submitAttendanceDirect
// instead of enqueueAttendance. This eliminates the EncryptedStorage
// round-trip from the critical path (reduces ~100ms + I/O).
//
// enqueueAttendance is preserved for genuine offline / retry scenarios.
// ─────────────────────────────────────────────
import EncryptedStorage from 'react-native-encrypted-storage';
import NetInfo from '@react-native-community/netinfo';
import {CreateUserAttendance} from '../../API/AttendanceManagement/CreateUserAttendance';

export const SYNC_QUEUE_KEY = '@attendance_sync_queue';

let syncing = false;

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const getSyncQueue = async () => {
  try {
    const raw = await EncryptedStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveSyncQueue = async queue => {
  try {
    await EncryptedStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to save sync queue', e);
  }
};

// ─────────────────────────────────────────────
// P1.4 — submitAttendanceDirect
//
// PRIMARY path for the online-first system.
// Calls CreateUserAttendance directly without EncryptedStorage queue.
// Throws on failure — callers must handle errors.
// ─────────────────────────────────────────────
export const submitAttendanceDirect = async attendanceData => {
  const result = await CreateUserAttendance({attendanceData});
  return result;
};

// ─────────────────────────────────────────────
// enqueueAttendance
//
// FALLBACK path for genuine offline scenarios and retry logic.
// Not called in the normal online flow — kept for future offline support.
// ─────────────────────────────────────────────
export const enqueueAttendance = async payload => {
  const queue = await getSyncQueue();
  const newRecord = {
    id: generateUUID(),
    payload,
    timestamp: Date.now(),
    status: 'pending',
    retryCount: 0,
  };
  queue.push(newRecord);
  await saveSyncQueue(queue);

  // Try immediate drain
  drainSyncQueue();
};

export const drainSyncQueue = async () => {
  if (syncing) {
    return;
  }

  const state = await NetInfo.fetch();
  if (!state.isConnected) {
    return;
  }

  syncing = true;

  try {
    const queue = await getSyncQueue();
    if (!queue.length) {
      return;
    }

    const newQueue = [...queue];
    let didChange = false;

    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    for (let i = 0; i < newQueue.length; i++) {
      const item = newQueue[i];
      if (item.status === 'synced' || item.status === 'permanent_failure') {
        continue;
      }

      // Prune ancient items
      if (now - item.timestamp > SEVEN_DAYS_MS) {
        item.status = 'permanent_failure';
        didChange = true;
        continue;
      }

      // Exponential backoff
      if (item.status === 'failed') {
        if (item.nextRetryAt && now < item.nextRetryAt) {
          continue;
        }
        item.status = 'pending';
        didChange = true;
      }

      try {
        const finalPayload = {
          ...item.payload,
          SequenceNumber: i + 1,
          OfflineRecordId: item.id,
        };

        await CreateUserAttendance({attendanceData: finalPayload});

        item.status = 'synced';
        didChange = true;
      } catch (error) {
        console.warn(`Failed to sync record ${item.id}:`, error.message);
        item.retryCount = (item.retryCount || 0) + 1;
        item.lastError = error.message;

        // Exponential backoff: 2^retryCount seconds, max 60s
        item.nextRetryAt =
          now + Math.min(Math.pow(2, item.retryCount) * 1000, 60_000);

        if (item.retryCount > 10) {
          item.status = 'permanent_failure';
        } else {
          item.status = 'failed';
        }
        didChange = true;
        break;
      }
    }

    if (didChange) {
      const remainingQueue = newQueue.filter(
        q => q.status !== 'synced' && q.status !== 'permanent_failure',
      );
      await saveSyncQueue(remainingQueue);
    }
  } finally {
    syncing = false;
  }
};

// Global network listener — call once from TimeClockScreen mount
let networkListenerActive = false;
export const initSyncListener = () => {
  if (networkListenerActive) {
    return;
  }
  networkListenerActive = true;
  NetInfo.addEventListener(state => {
    if (state.isConnected && state.isInternetReachable !== false) {
      drainSyncQueue();
    }
  });
};
