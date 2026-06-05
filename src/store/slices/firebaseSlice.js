import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  fcmToken: null,
  deviceId: null,
  lastSyncedToken: null,
  isInitialized: false,
  userEmail: null,
  employeeId: null,
  company: null,
  dynamicsSynced: false,
  inAppNotifications: [], // 👈 ADD
};

const firebaseSlice = createSlice({
  name: 'firebase',
  initialState,
  reducers: {
    setFirebaseToken: (state, action) => {
      state.fcmToken = action.payload;
    },
    addInAppNotification: (state, action) => {
      state.inAppNotifications.unshift({
        RecId: `local_${Date.now()}`,
        CreatedDateTime: new Date().toISOString(),
        NotificationText: action.payload.text,
        EmailLogType: action.payload.type, // 'Success' | 'Error' | 'Firebase' | 'Delete'
        NotificationActivityStatus: 'Unread',
        EmailStatus: null,
        EmployeeName: '',
        source: 'local', // marks it as local, not from API
      });
    },
    markInAppNotificationRead: (state, action) => {
      const n = state.inAppNotifications.find(n => n.RecId === action.payload);
      if (n) n.NotificationActivityStatus = 'Read';
    },
    clearInAppNotifications: state => {
      state.inAppNotifications = [];
    },
    setDeviceId: (state, action) => {
      state.deviceId = action.payload;
    },
    setLastSyncedToken: (state, action) => {
      state.lastSyncedToken = action.payload;
    },
    setFirebaseInitialized: (state, action) => {
      state.isInitialized = action.payload;
    },
    setFirebaseUserData: (state, action) => {
      const {userEmail, employeeId, company} = action.payload;
      state.userEmail = userEmail;
      state.employeeId = employeeId;
      state.company = company;
      state.isInitialized = true;
    },
    setDynamicsSynced: (state, action) => {
      state.dynamicsSynced = action.payload;
    },
    clearFirebaseData: state => {
      state.fcmToken = null;
      state.deviceId = null;
      state.lastSyncedToken = null;
      state.isInitialized = false;
      state.userEmail = null;
      state.employeeId = null;
      state.company = null;
      state.dynamicsSynced = false;
      state.inAppNotifications = []; // 👈 ADD THIS LINE
    },
  },
});

export const {
  setFirebaseToken,
  setDeviceId,
  setLastSyncedToken,
  setFirebaseInitialized,
  setFirebaseUserData,
  setDynamicsSynced,
  clearFirebaseData,
  addInAppNotification, // 👈 ADD
  markInAppNotificationRead, // 👈 ADD
  clearInAppNotifications, // 👈 ADD
} = firebaseSlice.actions;

export default firebaseSlice.reducer;
