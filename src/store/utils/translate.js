// src/store/utils/translate.js
import en from '../../i18n/locales/en.json';
import ar from '../../i18n/locales/ar.json';
import ur from '../../i18n/locales/ur.json';

// NOTE: do NOT statically import { store } here — it creates a circular
// dependency with store/index.js (or a reducer/slice/api file that imports
// this module). Require it lazily instead, inside each function.

const translations = {en, ur, ar};

const getStore = () => require('../../store').store;

export const translate = (key, variables = {}) => {
  try {
    const state = getStore().getState();
    const currentLanguage = state.language.currentLanguage || 'en';
    const resource = translations[currentLanguage] || translations.en;

    const keys = key.split('.');
    let translation = resource;
    for (const k of keys) {
      if (translation && translation[k]) {
        translation = translation[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    if (typeof translation === 'string' && Object.keys(variables).length > 0) {
      return translation.replace(/\{\{(\w+)\}\}/g, (match, variable) =>
        variables[variable] !== undefined ? variables[variable] : match,
      );
    }

    return translation;
  } catch (error) {
    console.error('Translation error:', error);
    return key;
  }
};

export const getCurrentLanguage = () =>
  getStore().getState().language.currentLanguage || 'en';
export const isRTL = () => getStore().getState().language.isRTL || false;
export const getAPILanguageCode = () =>
  getStore().getState().language.languageCode || 'en-us';

export const translateDynamic = (category, value) => {
  try {
    const currentLanguage = getCurrentLanguage();
    const resource = translations[currentLanguage] || translations.en;
    if (resource.dynamic?.[category]?.[value]) {
      return resource.dynamic[category][value];
    }
    return value;
  } catch (error) {
    console.error('Dynamic translation error:', error);
    return value;
  }
};

export const t = translate;

export default {
  translate,
  t,
  getCurrentLanguage,
  isRTL,
  getAPILanguageCode,
  translateDynamic,
};
