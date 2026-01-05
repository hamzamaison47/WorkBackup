import {configureStore} from '@reduxjs/toolkit';
import {persistStore, persistReducer} from 'redux-persist';
import {combineReducers} from '@reduxjs/toolkit';
import RNFS from 'react-native-fs';

import companyReducer from './slices/companySlice';
import userReducer from './slices/userSlice';
import menuItemReducer from './slices/menuItemSlice';
import languageReducer from './slices/languageSlice';
import biometricReducer from './slices/biometricSlice';
import firebaseReducer from './slices/firebaseSlice';
import authReducer from './slices/authSlice';
import chatbotReducer from './slices/chatbotSlice';

// Redux Persist configuration
const persistConfig = {
  key: 'root',
  storage: {
    setItem: async (key: string, value: string) => {
      const safeKey = key.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${RNFS.DocumentDirectoryPath}/${safeKey}.json`;
      await RNFS.writeFile(path, value, 'utf8');
    },
    getItem: async (key: string) => {
      try {
        const safeKey = key.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${RNFS.DocumentDirectoryPath}/${safeKey}.json`;
        return await RNFS.readFile(path, 'utf8');
      } catch (e) {
        return null;
      }
    },
    removeItem: async (key: string) => {
      try {
        const safeKey = key.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${RNFS.DocumentDirectoryPath}/${safeKey}.json`;
        await RNFS.unlink(path);
      } catch (e) {}
    },
  },
  whitelist: [
    'language',
    'biometric',
    'firebase',
    'auth',
    'user',
    'company',
    'menuItem',
    'chatbot',
  ], // Persist these reducers
  blacklist: [], // Don't persist these reducers
};

// Combine all reducers
const rootReducer = combineReducers({
  company: companyReducer,
  user: userReducer,
  menuItem: menuItemReducer,
  language: languageReducer,
  biometric: biometricReducer,
  firebase: firebaseReducer,
  auth: authReducer,
  chatbot: chatbotReducer, // ✅ ADD THIS
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store with persisted reducer
export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for redux-persist
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

// Create persistor
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
