import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  currentLanguage: 'en', // 'en' or 'ur'
  isRTL: false,
  skipLoginAfterRestart: false,
  appRestarting: false,
};

const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    setLanguage: (state, action) => {
      const languageCode = action.payload;
      state.currentLanguage = languageCode;
      state.isRTL = languageCode === 'ur';
    },
    setSkipLoginAfterRestart: (state, action) => {
      state.skipLoginAfterRestart = action.payload;
    },
    setAppRestarting: (state, action) => {
      state.appRestarting = action.payload;
    },
    resetLanguageState: state => {
      state.currentLanguage = 'en';
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
