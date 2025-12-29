import {configureStore} from '@reduxjs/toolkit';
import {persistStore, persistReducer} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {combineReducers} from '@reduxjs/toolkit';

import companyReducer from './slices/companySlice';
import userReducer from './slices/userSlice';
import menuItemReducer from './slices/menuItemSlice';
import languageReducer from './slices/languageSlice';
import biometricReducer from './slices/biometricSlice';
import firebaseReducer from './slices/firebaseSlice';
import authReducer from './slices/authSlice';

// Redux Persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['language', 'biometric', 'firebase', 'auth', 'user', 'company'], // Persist these reducers
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
