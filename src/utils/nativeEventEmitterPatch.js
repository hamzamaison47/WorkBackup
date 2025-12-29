import {NativeModules} from 'react-native';

// Some native modules don't expose removeListeners, which NativeEventEmitter expects.
// Provide a safe fallback to silence warnings on newer RN versions.
const ensureRemoveListeners = moduleName => {
  const mod = NativeModules[moduleName];
  if (mod && !mod.removeListeners) {
    mod.removeListeners =
      mod.removeAllListeners ||
      mod.removeAllSubscriptions ||
      (() => {});
  }
};

// Modules used in this app that rely on NativeEventEmitter.
ensureRemoveListeners('Voice'); // @react-native-voice/voice
ensureRemoveListeners('RNCGeolocation'); // @react-native-community/geolocation
ensureRemoveListeners('TextToSpeech'); // react-native-tts

export {};
