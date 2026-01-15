// src/store/utils/translate.js
import {store} from '../../store';
import en from '../../i18n/locales/en.json';
import ar from '../../i18n/locales/ar.json';
import ur from '../../i18n/locales/ur.json';

// Translation resources
const translations = {
  en,
  ur,
  ar,
};

/**
 * Main translation function - works like t() in i18n
 * @param {string} key - Translation key (e.g., 'profile.title')
 * @param {object} variables - Optional variables for interpolation
 * @returns {string} - Translated text
 */
export const translate = (key, variables = {}) => {
  try {
    // Get current language from Redux
    const state = store.getState();
    const currentLanguage = state.language.currentLanguage || 'en';

    // Get the translation resource for current language
    const resource = translations[currentLanguage] || translations.en;

    // Split the key by dots and traverse the object
    const keys = key.split('.');
    let translation = resource;

    for (const k of keys) {
      if (translation && translation[k]) {
        translation = translation[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key; // Return key itself if translation not found
      }
    }

    // Handle variable interpolation (e.g., {{leaveCode}})
    if (typeof translation === 'string' && Object.keys(variables).length > 0) {
      return translation.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
        return variables[variable] !== undefined ? variables[variable] : match;
      });
    }

    return translation;
  } catch (error) {
    console.error('Translation error:', error);
    return key;
  }
};

/**
 * Get current language from Redux
 * @returns {string} - Current language code
 */
export const getCurrentLanguage = () => {
  const state = store.getState();
  return state.language.currentLanguage || 'en';
};

/**
 * Get current language direction (RTL/LTR)
 * @returns {boolean} - true if RTL, false if LTR
 */
export const isRTL = () => {
  const state = store.getState();
  return state.language.isRTL || false;
};

/**
 * Get API language code for SOAP calls
 * @returns {string} - API language code (e.g., 'en-us', 'ar')
 */
export const getAPILanguageCode = () => {
  const state = store.getState();
  return state.language.languageCode || 'en-us';
};

/**
 * Translate dynamic values from Dynamics (like workflow status)
 * @param {string} category - Category (e.g., 'workflowStatus')
 * @param {string} value - Value to translate
 * @returns {string} - Translated value
 */
export const translateDynamic = (category, value) => {
  try {
    const currentLanguage = getCurrentLanguage();
    const resource = translations[currentLanguage] || translations.en;

    if (
      resource.dynamic &&
      resource.dynamic[category] &&
      resource.dynamic[category][value]
    ) {
      return resource.dynamic[category][value];
    }

    return value; // Return original if no translation
  } catch (error) {
    console.error('Dynamic translation error:', error);
    return value;
  }
};

// Shorthand alias for translate function
export const t = translate;

// Export default as an object with all utilities
export default {
  translate,
  t,
  getCurrentLanguage,
  isRTL,
  getAPILanguageCode,
  translateDynamic,
};
