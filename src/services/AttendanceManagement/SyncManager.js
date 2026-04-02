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

// services/AttendanceManagement/SyncManager.js

// Change mergeQueuedPunches filter in helpers.js to match this intent.
// Also: reset failed items to pending on next drain attempt (retry logic).

export const drainSyncQueue = async () => {
  if (syncing) return;

  const state = await NetInfo.fetch();
  if (!state.isConnected) return;

  syncing = true;

  try {
    const queue = await getSyncQueue();
    if (!queue.length) return;

    const newQueue = [...queue];
    let didChange = false;

    for (let i = 0; i < newQueue.length; i++) {
      const item = newQueue[i];
      if (item.status === 'synced') continue;

      // Reset failed items for retry on next connectivity restore
      if (item.status === 'failed') {
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
        item.status = 'failed';
        didChange = true;
        break;
      }
    }

    if (didChange) {
      // Keep failed items in queue (for retry) but mark them so UI can
      // distinguish. Synced items are pruned.
      const remainingQueue = newQueue.filter(q => q.status !== 'synced');
      await saveSyncQueue(remainingQueue);
    }
  } finally {
    syncing = false;
  }
};

// Global network listener to auto-drain. Only call this once in the app lifetime (e.g. from TimeClockScreen mount)
let networkListenerActive = false;
export const initSyncListener = () => {
  if (networkListenerActive) return;
  networkListenerActive = true;
  NetInfo.addEventListener(state => {
    if (state.isConnected && state.isInternetReachable !== false) {
      drainSyncQueue();
    }
  });
};
