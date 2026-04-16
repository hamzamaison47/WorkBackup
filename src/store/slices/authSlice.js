/* eslint-disable curly */
import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  accessToken: null,
  idToken: null,
  refreshToken: null,
  userToken: null,
  lastBackgroundTime: null,
  graphAccessToken: null, // ← ADD
  graphRefreshToken: null, // ← ADD
  graphUserId: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
    },
    setIdToken: (state, action) => {
      state.idToken = action.payload;
    },
    setRefreshToken: (state, action) => {
      state.refreshToken = action.payload;
    },
    setUserToken: (state, action) => {
      state.userToken = action.payload;
    },
    setLastBackgroundTime: (state, action) => {
      state.lastBackgroundTime = action.payload;
    },
    setGraphAccessToken: (state, action) => {
      // ← ADD
      state.graphAccessToken = action.payload;
    },
    setGraphRefreshToken: (state, action) => {
      // ← ADD
      state.graphRefreshToken = action.payload;
    },
    setGraphUserId: (state, action) => {
      state.graphUserId = action.payload;
    },
    setAuthTokens: (state, action) => {
      const {accessToken, idToken, refreshToken} = action.payload;
      if (accessToken !== undefined) state.accessToken = accessToken;
      if (idToken !== undefined) state.idToken = idToken;
      if (refreshToken !== undefined) state.refreshToken = refreshToken;
    },
    clearAuthTokens: state => {
      state.accessToken = null;
      state.idToken = null;
      state.refreshToken = null;
      state.userToken = null;
      state.lastBackgroundTime = null;
      state.graphAccessToken = null; // ← ADD
      state.graphRefreshToken = null; // ← ADD
      state.graphUserId = null;
    },
  },
});

export const {
  setAccessToken,
  setIdToken,
  setRefreshToken,
  setUserToken,
  setLastBackgroundTime,
  setGraphAccessToken, // ← ADD
  setGraphRefreshToken, // ← ADD
  setGraphUserId,
  setAuthTokens,
  clearAuthTokens,
} = authSlice.actions;

export default authSlice.reducer;
