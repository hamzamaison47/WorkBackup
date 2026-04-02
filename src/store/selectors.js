/**
 * Memoized Redux Selectors
 * Using these selectors prevents unnecessary component re-renders
 */

import {createSelector} from '@reduxjs/toolkit';

// User Selectors
export const selectUserData = state => state.user.userData;
export const selectUserEmail = createSelector(
  [selectUserData],
  userData => userData?.email || '',
);

export const selectUserName = createSelector(
  [selectUserData],
  userData => userData?.employeeName || '',
);

export const selectEmployeeId = createSelector(
  [selectUserData],
  userData => userData?.employeeId || '',
);

export const selectIsUserLoaded = createSelector(
  [selectUserData],
  userData => !!userData,
);

// Firebase Selectors
export const selectFirebaseState = state => state.firebase;

export const selectFirebaseUserEmail = createSelector(
  [selectFirebaseState],
  firebase => firebase?.userEmail || '',
);

export const selectFirebaseEmployeeId = createSelector(
  [selectFirebaseState],
  firebase => firebase?.employeeId || '',
);

export const selectFirebaseCompany = createSelector(
  [selectFirebaseState],
  firebase => firebase?.company || '',
);

export const selectIsLoggedIn = createSelector(
  [selectFirebaseUserEmail, selectFirebaseEmployeeId],
  (email, id) => !!(email && id),
);

// Language Selectors
export const selectLanguageState = state => state.language;

export const selectCurrentLanguage = createSelector(
  [selectLanguageState],
  language => language?.currentLanguage || 'en',
);

export const selectIsRTL = createSelector(
  [selectLanguageState],
  language => language?.isRTL || false,
);

// Company Selectors
export const selectCompanyState = state => state.company;

export const selectSelectedCompany = createSelector(
  [selectCompanyState],
  company => company?.selectedCompany || null,
);

export const selectCompanies = createSelector(
  [selectCompanyState],
  company => company?.companies || [],
);

// Authentication Selectors
export const selectAuthState = state => state.auth;

export const selectAuthToken = createSelector(
  [selectAuthState],
  auth => auth?.token || null,
);

export const selectIsAuthenticating = createSelector(
  [selectAuthState],
  auth => auth?.isAuthenticating || false,
);

// Menu Item Selectors
export const selectMenuItems = state => state.menuItem?.items || [];

export const selectMenuItemsByCategory = createSelector(
  [selectMenuItems],
  items => {
    const grouped = {};
    items.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    return grouped;
  },
);

// Chatbot Selectors
export const selectChatbotState = state => state.chatbot;

export const selectChatMessages = createSelector(
  [selectChatbotState],
  chatbot => chatbot?.messages || [],
);

export const selectChatbotLoading = createSelector(
  [selectChatbotState],
  chatbot => chatbot?.loading || false,
);

// Combined selectors for common use cases
export const selectUserInfo = createSelector(
  [selectUserEmail, selectUserName, selectEmployeeId],
  (email, name, id) => ({email, name, id}),
);

export const selectAuthInfo = createSelector(
  [selectAuthToken, selectIsLoggedIn],
  (token, isLoggedIn) => ({token, isLoggedIn}),
);

// Date Format Selectors
export const selectDateFormat = state => state.dateFormat.selectedFormat;

import {TIME_FORMAT_OPTIONS, TIMEZONE_OPTIONS} from './slices/dateFormatSlice';

export const selectTimeFormat = state =>
  state.dateFormat.selectedTimeFormat ?? TIME_FORMAT_OPTIONS[0];

export const selectTimezone = state =>
  state.dateFormat.selectedTimezone ?? TIMEZONE_OPTIONS[0];
