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
};

const firebaseSlice = createSlice({
  name: 'firebase',
  initialState,
  reducers: {
    setFirebaseToken: (state, action) => {
      state.fcmToken = action.payload;
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
} = firebaseSlice.actions;

export default firebaseSlice.reducer;
