import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  menuItems: [],
};

const menuItemSlice = createSlice({
  name: 'menuItem',
  initialState,
  reducers: {
    setMenuItems: (state, action) => {
      state.menuItems = action.payload;
    },
    clearMenuItems: state => {
      state.menuItems = [];
    },
  },
});

export const {setMenuItems, clearMenuItems} = menuItemSlice.actions;
export default menuItemSlice.reducer;
