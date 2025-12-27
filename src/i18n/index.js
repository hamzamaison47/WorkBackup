/* eslint-disable no-unused-vars */
import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import {I18nManager} from 'react-native';
import {store} from '../store';
import {setLanguage} from '../store/slices/languageSlice';

import en from './locales/en.json';
import ur from './locales/ur.json';

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: callback => {
    try {
      // Get language from Redux store
      const state = store.getState();
      const language = state.language.currentLanguage;

      if (language) {
        callback(language);
      } else {
        callback('en');
      }
    } catch (error) {
      console.error('Error detecting language:', error);
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: language => {
    try {
      // Update Redux store
      store.dispatch(setLanguage(language));
    } catch (error) {
      console.error('Error saving language', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      en: {translation: en},
      ur: {translation: ur},
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
