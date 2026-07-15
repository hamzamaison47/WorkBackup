import {createSlice} from '@reduxjs/toolkit';

// Canonical brand defaults. #0A66C2 is the real app brand color
// (promoted here from the 78 files that hardcode it).
export const DEFAULT_PALETTE = {
  primary: '#0A66C2',
  onPrimary: '#FFFFFF',
  selection: '#0A66C2', // tab-active / selected role; may diverge from primary
};

const initialState = {
  ...DEFAULT_PALETTE,
  hydrated: false, // true once we've merged an API response at least once
};

const colorPaletteSlice = createSlice({
  name: 'colorPalette',
  initialState,
  reducers: {
    // Merge an API response. Empty strings fall back to defaults —
    // matches the API returning '' on miss.
    setPalette: (state, action) => {
      const api = action.payload || {};
      state.primary = api.primary || DEFAULT_PALETTE.primary;
      state.onPrimary = api.onPrimary || DEFAULT_PALETTE.onPrimary;
      // selection falls back to the *resolved* primary, not the default
      state.selection =
        api.selection || api.primary || DEFAULT_PALETTE.selection;
      state.hydrated = true;
    },
    resetPalette: () => ({...DEFAULT_PALETTE, hydrated: false}),
  },
});

export const {setPalette, resetPalette} = colorPaletteSlice.actions;
export default colorPaletteSlice.reducer;
