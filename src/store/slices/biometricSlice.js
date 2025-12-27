import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  enabled: false,
  selectedAccount: null,
  accounts: [],
  credentials: null, // {email, provider, isBiometricEnabled, timestamp}
};

const biometricSlice = createSlice({
  name: 'biometric',
  initialState,
  reducers: {
    setBiometricEnabled: (state, action) => {
      state.enabled = action.payload;
    },
    setSelectedAccount: (state, action) => {
      state.selectedAccount = action.payload;
    },
    setAccounts: (state, action) => {
      state.accounts = action.payload;
    },
    addAccount: (state, action) => {
      const newAccount = action.payload;
      // Remove existing account with same id if exists
      state.accounts = state.accounts.filter(acc => acc.id !== newAccount.id);
      // Add new account
      state.accounts.push(newAccount);
    },
    removeAccount: (state, action) => {
      const accountId = action.payload;
      state.accounts = state.accounts.filter(acc => acc.id !== accountId);
      // Clear selected account if it was removed
      if (state.selectedAccount && state.selectedAccount.id === accountId) {
        state.selectedAccount = null;
      }
    },
    setBiometricCredentials: (state, action) => {
      state.credentials = action.payload;
    },
    clearBiometric: state => {
      state.enabled = false;
      state.selectedAccount = null;
      state.accounts = [];
      state.credentials = null;
    },
  },
});

export const {
  setBiometricEnabled,
  setSelectedAccount,
  setAccounts,
  addAccount,
  removeAccount,
  setBiometricCredentials,
  clearBiometric,
} = biometricSlice.actions;

export default biometricSlice.reducer;
