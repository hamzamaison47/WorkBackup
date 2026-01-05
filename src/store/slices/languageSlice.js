import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  currentLanguage: 'en', // 'en' or 'ur' - UI language code
  languageCode: 'en-us', // API language code for SOAP headers ('en-us', 'ar', 'ur', etc.)
  isRTL: false,
  skipLoginAfterRestart: false,
  appRestarting: false,
};

const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    setLanguage: (state, action) => {
      // Accept either a string (backward compatibility) or an object with languageCode and apiCode
      if (typeof action.payload === 'string') {
        // Backward compatibility - single language code
        const languageCode = action.payload;
        state.currentLanguage = languageCode;
        state.isRTL = languageCode === 'ur' || languageCode === 'ar';
        // Map to API codes
        const apiCodeMap = {
          en: 'en-us',
          ur: 'ur',
          ar: 'ar',
        };
        state.languageCode = apiCodeMap[languageCode] || 'en-us';
      } else {
        // New format - object with code and apiCode
        const {code, apiCode, isRTL} = action.payload;
        state.currentLanguage = code;
        state.languageCode = apiCode;
        state.isRTL = isRTL;
      }
    },
    setSkipLoginAfterRestart: (state, action) => {
      state.skipLoginAfterRestart = action.payload;
    },
    setAppRestarting: (state, action) => {
      state.appRestarting = action.payload;
    },
    resetLanguageState: state => {
      state.currentLanguage = 'en';
      state.languageCode = 'en-us';
      state.isRTL = false;
      state.skipLoginAfterRestart = false;
      state.appRestarting = false;
    },
  },
});

export const {
  setLanguage,
  setSkipLoginAfterRestart,
  setAppRestarting,
  resetLanguageState,
} = languageSlice.actions;

export default languageSlice.reducer;
