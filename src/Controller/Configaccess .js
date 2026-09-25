// src/Controller/configAccess.js
//
// Per-device switch for the QR environment-configuration screen.
// Hidden for everyone by default; unlocked on a single device by tapping the
// login logo 7 times and entering the PIN. The flag lives in the Keychain /
// Android Keystore under its own service so it never collides with the
// biometric credentials or the saved environment configs.
//
// NOTE: the PIN is compiled into the JS bundle, so it can be pulled out of the
// APK by someone determined. It keeps regular users out of the screen; it is
// not a security boundary. Move verification to a server call if that matters.

import * as Keychain from 'react-native-keychain';

const SERVICE = 'idap360.configAccess';
const UNLOCKED_VALUE = 'unlocked';

export const CONFIG_UNLOCK_PIN = '1234';
export const CONFIG_UNLOCK_TAP_COUNT = 7;

export const verifyConfigPin = pin => pin === CONFIG_UNLOCK_PIN;

export const isConfigAccessUnlocked = async () => {
  try {
    const creds = await Keychain.getGenericPassword({service: SERVICE});
    return !!creds && creds.password === UNLOCKED_VALUE;
  } catch (error) {
    console.warn('configAccess: could not read unlock flag', error);
    return false;
  }
};

export const unlockConfigAccess = async () => {
  await Keychain.setGenericPassword('configAccess', UNLOCKED_VALUE, {
    service: SERVICE,
  });
};

export const lockConfigAccess = async () => {
  try {
    await Keychain.resetGenericPassword({service: SERVICE});
  } catch (error) {
    console.warn('configAccess: could not clear unlock flag', error);
  }
};
