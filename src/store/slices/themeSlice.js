// import {createSlice} from '@reduxjs/toolkit';

// const initialState = {
//   mode: 'light', // 'light' | 'dark'
// };

// const themeSlice = createSlice({
//   name: 'theme',
//   initialState,
//   reducers: {
//     setTheme: (state, action) => {
//       state.mode = action.payload; // 'light' or 'dark'
//     },
//     toggleTheme: state => {
//       state.mode = state.mode === 'light' ? 'dark' : 'light';
//     },
//     resetThemeState: state => {
//       state.mode = 'light';
//     },
//   },
// });

// export const {setTheme, toggleTheme, resetThemeState} = themeSlice.actions;
// export default themeSlice.reducer;
import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  mode: 'light', // 'light' | 'dark'
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.mode = action.payload;
    },
    toggleTheme: state => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
    },
    resetThemeState: state => {
      state.mode = 'light';
    },
  },
});

export const {setTheme, toggleTheme, resetThemeState} = themeSlice.actions;
export default themeSlice.reducer;
