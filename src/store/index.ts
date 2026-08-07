import {configureStore} from '@reduxjs/toolkit';
import {persistStore, persistReducer} from 'redux-persist';
import RNFS from 'react-native-fs';

import rootReducer from './rootReducer';

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
    'dateFormat',
    'theme',
    'colorPalette',
  ],
  blacklist: [],
};

// Create persisted reducer
// rootReducer wraps combineReducers to handle RESET_APP_STATE — see
// ./rootReducer.js for the preserve list.
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
