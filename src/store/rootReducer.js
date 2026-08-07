import {combineReducers} from '@reduxjs/toolkit';

import companyReducer from './slices/companySlice';
import userReducer from './slices/userSlice';
import menuItemReducer from './slices/menuItemSlice';
import languageReducer from './slices/languageSlice';
import biometricReducer from './slices/biometricSlice';
import firebaseReducer from './slices/firebaseSlice';
import authReducer from './slices/authSlice';
import chatbotReducer from './slices/chatbotSlice';
import dateFormatReducer from './slices/dateFormatSlice';
import themeReducer from './slices/themeSlice';
import colorPaletteReducer from './slices/colorPaletteSlice';

/**
 * The one action that wipes the app. Dispatched at logout, at the start of
 * every login, and at cold start — see src/Controller/sessionUtils.js.
 *
 * Deliberately a plain action type rather than a slice action: no single slice
 * owns it, and every slice must be able to be reset without knowing about it.
 */
export const RESET_APP_STATE = 'app/resetState';
export const resetAppState = () => ({type: RESET_APP_STATE});

const appReducer = combineReducers({
  company: companyReducer,
  user: userReducer,
  menuItem: menuItemReducer,
  language: languageReducer,
  biometric: biometricReducer,
  firebase: firebaseReducer,
  auth: authReducer,
  chatbot: chatbotReducer,
  dateFormat: dateFormatReducer,
  theme: themeReducer,
  colorPalette: colorPaletteReducer,
});

/**
 * Slices that survive RESET_APP_STATE. Everything else is wiped by being
 * ABSENT from the state handed to appReducer — each slice reducer then
 * receives `undefined` and returns its own initialState.
 *
 * This is why nothing here enumerates what to clear: a slice added tomorrow
 * is wiped by default, which is the only safe default on a shared device.
 * Adding a slice to this list is the deliberate, reviewable act.
 *
 *   biometric        — enrolment (Keychain credentials + the accounts list used
 *                      to offer biometric sign-in). Must outlive logout.
 *   language/theme/  — device preferences, not user data.
 *   dateFormat
 *
 * Tenant/client configuration is NOT here because it is not in Redux at all:
 * it lives in the Keychain (src/Controller/secureConfig.js) and is untouched
 * by any reset.
 */
const PRESERVE = ['biometric', 'language', 'theme', 'dateFormat'];

const rootReducer = (state, action) => {
  if (action.type !== RESET_APP_STATE) {
    return appReducer(state, action);
  }

  const preserved = {};

  PRESERVE.forEach(key => {
    if (state?.[key] !== undefined) {
      preserved[key] = state[key];
    }
  });

  // redux-persist 6 strips `_persist` before calling this reducer and
  // re-attaches its own copy afterwards (persistReducer.js), so in practice
  // `state._persist` is undefined here and the bookkeeping cannot be lost.
  // Carried through only when actually present — passing an explicit
  // `_persist: undefined` would trip combineReducers' unexpected-key warning.
  if (state?._persist !== undefined) {
    preserved._persist = state._persist;
  }

  return appReducer(preserved, action);
};

export default rootReducer;
