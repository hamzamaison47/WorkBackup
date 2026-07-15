/* eslint-disable curly */
// ─────────────────────────────────────────────
// src/hooks/usePalette.js
//
// Returns the active color palette (API values || defaults) plus a
// client-derived `tint` (primary lightened toward white, ~12%) for
// selected-state backgrounds. Mirrors useAttendanceTheme().
//
// Usage:
//   const P = usePalette();
//   <View style={{backgroundColor: P.primary}} />
//   const S = useMemo(() => makeStyles(P), [P]);
// ─────────────────────────────────────────────
import {useMemo} from 'react';
import {useSelector} from 'react-redux';
import {DEFAULT_PALETTE} from '../store/slices/colorPaletteSlice';

// Blend a hex color toward white by `amount` (0..1). amount=0.88 keeps 12%
// of the source → a pale tint. Returns an opaque #RRGGBB.
const lighten = (hex, amount) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!m) return hex;
  const mix = c =>
    Math.round(parseInt(c, 16) + (255 - parseInt(c, 16)) * amount);
  const to2 = n => n.toString(16).padStart(2, '0');
  return `#${to2(mix(m[1]))}${to2(mix(m[2]))}${to2(mix(m[3]))}`;
};

const usePalette = () => {
  const palette = useSelector(state => state.colorPalette);

  return useMemo(() => {
    // TEMP [PALETTE-DEBUG] — remove after diagnosis
    // console.log('[PALETTE-DEBUG] usePalette store:', palette);
    const primary = palette?.primary || DEFAULT_PALETTE.primary;
    const onPrimary = palette?.onPrimary || DEFAULT_PALETTE.onPrimary;
    const selection = palette?.selection || primary;
    return {
      primary,
      onPrimary,
      selection,
      tint: lighten(primary, 0.88), // selected-card / active-row background
      hydrated: !!palette?.hydrated,
    };
  }, [palette]);
};

export default usePalette;
