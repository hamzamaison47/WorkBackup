// biometricUtils.js
import ReactNativeBiometrics from 'react-native-biometrics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Keychain from 'react-native-keychain';

const rnBiometrics = new ReactNativeBiometrics({allowDeviceCredentials: true});

// Storage keys
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const SELECTED_ACCOUNT_KEY = 'selected_account';
const ACCOUNTS_LIST_KEY = 'accounts_list';
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
export const saveAccountAfterLogin = async (email, provider, userData = {}) => {
  try {
    await AsyncStorage.removeItem(ACCOUNTS_LIST_KEY);

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

    await AsyncStorage.setItem(ACCOUNTS_LIST_KEY, JSON.stringify([newAccount]));

    return newAccount;
  } catch (error) {
    console.error('Error saving account:', error);
    return false;
  }
};

/**
 * Get all saved accounts
 */
export const getAccounts = async () => {
  try {
    const accounts = await AsyncStorage.getItem(ACCOUNTS_LIST_KEY);
    return accounts ? JSON.parse(accounts) : [];
  } catch (error) {
    console.error('Error getting accounts:', error);
    return [];
  }
};

/**
 * Get accounts grouped by provider
 */
export const getAccountsByProvider = async () => {
  try {
    const accounts = await getAccounts();
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
export const saveSelectedAccount = async account => {
  try {
    await AsyncStorage.setItem(SELECTED_ACCOUNT_KEY, JSON.stringify(account));
    return true;
  } catch (error) {
    console.error('Error saving selected account:', error);
    return false;
  }
};

/**
 * Get selected account
 */
export const getSelectedAccount = async () => {
  try {
    const account = await AsyncStorage.getItem(SELECTED_ACCOUNT_KEY);
    return account ? JSON.parse(account) : null;
  } catch (error) {
    console.error('Error getting selected account:', error);
    return null;
  }
};

/**
 * Remove an account
 */
export const removeAccount = async accountId => {
  try {
    const accounts = await getAccounts();
    const updatedAccounts = accounts.filter(acc => acc.id !== accountId);
    await AsyncStorage.setItem(
      ACCOUNTS_LIST_KEY,
      JSON.stringify(updatedAccounts),
    );

    const selectedAccount = await getSelectedAccount();
    if (selectedAccount && selectedAccount.id === accountId) {
      await AsyncStorage.removeItem(SELECTED_ACCOUNT_KEY);
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
export const clearAllAccounts = async () => {
  try {
    await AsyncStorage.multiRemove([
      ACCOUNTS_LIST_KEY,
      SELECTED_ACCOUNT_KEY,
      BIOMETRIC_ENABLED_KEY,
    ]);

    console.log('All accounts cleared successfully');
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

// Enable biometric - only store email and provider
export const enableBiometric = async (email, provider) => {
  try {
    await disableBiometric();

    const success = await storeBiometricCredentials(email, provider);

    if (success) {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
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

    await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    await AsyncStorage.removeItem(SELECTED_ACCOUNT_KEY);

    return true;
  } catch (error) {
    console.error('Error disabling biometric:', error);
    return false;
  }
};

// Check both Keychain and AsyncStorage
export const hasPersistentBiometricCredentials = async () => {
  try {
    const credentials = await getBiometricCredentials();
    const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);

    return (
      credentials !== null &&
      credentials.isBiometricEnabled === true &&
      enabled === 'true'
    );
  } catch (error) {
    console.error('Error checking biometric credentials:', error);
    return false;
  }
};

export const isBiometricEnabled = async () => {
  try {
    const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
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
export const saveSelectedEmail = async email => {
  try {
    const accounts = await getAccounts();
    const account = accounts.find(acc => acc.email === email);
    if (account) {
      return await saveSelectedAccount(account);
    }
    return false;
  } catch (error) {
    console.error('Error saving selected email:', error);
    return false;
  }
};

export const getSelectedEmail = async () => {
  try {
    const account = await getSelectedAccount();
    return account ? account.email : null;
  } catch (error) {
    console.error('Error getting selected email:', error);
    return null;
  }
};

export const getCachedEmails = async () => {
  try {
    const accounts = await getAccounts();
    return accounts.map(acc => acc.email);
  } catch (error) {
    console.error('Error getting cached emails:', error);
    return [];
  }
};
