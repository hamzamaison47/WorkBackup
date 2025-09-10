import {configureStore} from '@reduxjs/toolkit';
import companyReducer from './slices/companySlice';
import userReducer from './slices/userSlice';
import menuItemReducer from './slices/menuItemSlice';

export const store = configureStore({
  reducer: {
    company: companyReducer,
    user: userReducer,
    menuItem: menuItemReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
