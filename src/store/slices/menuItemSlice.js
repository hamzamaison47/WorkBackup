import {createSlice} from '@reduxjs/toolkit';
import {withCustomizationScreens} from '../../Customizations/IDAP/navigation/customizationScreens';

const initialState = {
  menuItems: [],
};

const menuItemSlice = createSlice({
  name: 'menuItem',
  initialState,
  reducers: {
    setMenuItems: (state, action) => {
      // Merge in IDAP customization sub-pages that the backend menu does not
      // enumerate, so the navigators register them the same way. De-duped by
      // MenuId (backend wins).
      state.menuItems = withCustomizationScreens(action.payload);
    },
    clearMenuItems: state => {
      state.menuItems = [];
    },
  },
});

export const {setMenuItems, clearMenuItems} = menuItemSlice.actions;
export default menuItemSlice.reducer;
