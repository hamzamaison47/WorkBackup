/* eslint-disable no-unused-vars */
// biometricUtils.js
import ReactNativeBiometrics from 'react-native-biometrics';
import Keychain from 'react-native-keychain';
import {store} from '../index';
import {
  setBiometricEnabled,
  setSelectedAccount,
  setAccounts,
  addAccount as addAccountAction,
  removeAccount as removeAccountAction,
  setBiometricCredentials,
  clearBiometric,
} from '../slices/biometricSlice';

const rnBiometrics = new ReactNativeBiometrics({allowDeviceCredentials: true});

// Keychain service for secure credential storage
const BIOMETRIC_CREDENTIALS_SERVICE = 'biometric_credentials';

// Store ONLY email and provider, nothing else
export const storeBiometricCredentials = async (email, provider) => {
  try {
    await Keychain.setGenericPassword(
      'biometric_email',
      JSON.stringify({
        email,
        provider,
        isBiometricEnabled: true,
        timestamp: Date.now(),
      }),
      {
        service: BIOMETRIC_CREDENTIALS_SERVICE,
        accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
      },
    );
    return true;
  } catch (error) {
    console.error('Error storing biometric credentials:', error);
    return false;
  }
};

export const getBiometricCredentials = async () => {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: BIOMETRIC_CREDENTIALS_SERVICE,
    });
    return credentials ? JSON.parse(credentials.password) : null;
  } catch (error) {
    console.error('Error getting biometric credentials:', error);
    return null;
  }
};

/**
 * Save account only for currently logged-in user
 * Clear previous accounts and only keep the current one
 */
export const saveAccountAfterLogin = (email, provider, userData = {}) => {
  try {
    // Clear previous accounts from Redux
    store.dispatch(setAccounts([]));

    const newAccount = {
      email,
      provider,
      id: `${provider}_${email}_${Date.now()}`,
      addedAt: new Date().toISOString(),
      displayName: userData.displayName || email.split('@')[0],
      employeeName: userData.employeeName,
      employeeId: userData.employeeId,
      userName: userData.userName,
      defaultLegalEntity: userData.defaultLegalEntity,
    };

    // Set the new account in Redux
    store.dispatch(setAccounts([newAccount]));

    return newAccount;
  } catch (error) {
    console.error('Error saving account:', error);
    return false;
  }
};

/**
 * Get all saved accounts from Redux
 */
export const getAccounts = () => {
  try {
    const state = store.getState();
    return state.biometric.accounts || [];
  } catch (error) {
    console.error('Error getting accounts:', error);
    return [];
  }
};

/**
 * Get accounts grouped by provider
 */
export const getAccountsByProvider = () => {
  try {
    const accounts = getAccounts();
    const grouped = {
      Azure: [],
      Google: [],
    };

    accounts.forEach(account => {
      if (grouped[account.provider]) {
        grouped[account.provider].push(account);
      }
    });

    return grouped;
  } catch (error) {
    console.error('Error grouping accounts:', error);
    return {Azure: [], Google: []};
  }
};

/**
 * Save selected account for biometric login
 */
export const saveSelectedAccount = account => {
  try {
    store.dispatch(setSelectedAccount(account));
    return true;
  } catch (error) {
    console.error('Error saving selected account:', error);
    return false;
  }
};

/**
 * Get selected account from Redux
 */
export const getSelectedAccount = () => {
  try {
    const state = store.getState();
    return state.biometric.selectedAccount;
  } catch (error) {
    console.error('Error getting selected account:', error);
    return null;
  }
};

/**
 * Remove an account
 */
export const removeAccount = accountId => {
  try {
    const accounts = getAccounts();
    const updatedAccounts = accounts.filter(acc => acc.id !== accountId);
    store.dispatch(setAccounts(updatedAccounts));

    const selectedAccount = getSelectedAccount();
    if (selectedAccount && selectedAccount.id === accountId) {
      store.dispatch(setSelectedAccount(null));
    }

    return true;
  } catch (error) {
    console.error('Error removing account:', error);
    return false;
  }
};

/**
 * Clear all accounts and reset biometric settings
 */
export const clearAllAccounts = () => {
  try {
    store.dispatch(clearBiometric());
    console.log('All accounts cleared successfully from Redux');
    return true;
  } catch (error) {
    console.error('Error clearing accounts:', error);
    throw error;
  }
};

// Biometric functions
export const checkBiometricAvailability = async () => {
  try {
    const {available, biometryType} = await rnBiometrics.isSensorAvailable();
    return {available, biometryType};
  } catch (error) {
    console.error('Error checking biometric availability:', error);
    return {available: false, biometryType: null};
  }
};

// Enable biometric - only store email and provider in Keychain
export const enableBiometric = async (email, provider) => {
  try {
    await disableBiometric();

    const success = await storeBiometricCredentials(email, provider);

    if (success) {
      store.dispatch(setBiometricEnabled(true));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error enabling biometric:', error);
    return false;
  }
};

// Complete cleanup
export const disableBiometric = async () => {
  try {
    await Keychain.resetGenericPassword({
      service: BIOMETRIC_CREDENTIALS_SERVICE,
    });

    store.dispatch(setBiometricEnabled(false));
    store.dispatch(setSelectedAccount(null));

    return true;
  } catch (error) {
    console.error('Error disabling biometric:', error);
    return false;
  }
};

// Check both Keychain and Redux
export const hasPersistentBiometricCredentials = async () => {
  try {
    const credentials = await getBiometricCredentials();
    const state = store.getState();
    const enabled = state.biometric.enabled;

    return (
      credentials !== null &&
      credentials.isBiometricEnabled === true &&
      enabled === true
    );
  } catch (error) {
    console.error('Error checking biometric credentials:', error);
    return false;
  }
};

export const isBiometricEnabled = () => {
  try {
    const state = store.getState();
    return state.biometric.enabled === true;
  } catch (error) {
    console.error('Error checking biometric status:', error);
    return false;
  }
};

export const authenticateWithBiometrics = async () => {
  try {
    const {success} = await rnBiometrics.simplePrompt({
      promptMessage: 'Confirm your identity',
      cancelButtonText: 'Cancel',
    });
    return success;
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return false;
  }
};

// Legacy support
export const saveSelectedEmail = email => {
  try {
    const accounts = getAccounts();
    const account = accounts.find(acc => acc.email === email);
    if (account) {
      return saveSelectedAccount(account);
    }
    return false;
  } catch (error) {
    console.error('Error saving selected email:', error);
    return false;
  }
};

export const getSelectedEmail = () => {
  try {
    const account = getSelectedAccount();
    return account ? account.email : null;
  } catch (error) {
    console.error('Error getting selected email:', error);
    return null;
  }
};

export const getCachedEmails = () => {
  try {
    const accounts = getAccounts();
    return accounts.map(acc => acc.email);
  } catch (error) {
    console.error('Error getting cached emails:', error);
    return [];
  }
};
