// ─────────────────────────────────────────────
// src/hooks/usePalette.js
//
// Returns the brand palette (src/theme/brand.js) plus the derived `tint`
// (primary lightened toward white, ~12%) for selected-state backgrounds.
// Mirrors useAttendanceTheme().
//
// The palette is a compile-time constant — this hook no longer reads Redux.
// It stays a hook (rather than a plain import) so the ~80 existing call
// sites keep working unchanged; the returned object is referentially stable,
// so `useMemo(() => makeStyles(P), [P])` never recomputes.
//
// Usage:
//   const P = usePalette();
//   <View style={{backgroundColor: P.primary}} />
//   const S = useMemo(() => makeStyles(P), [P]);
// ─────────────────────────────────────────────
import brand from '../theme/brand';

const PALETTE = Object.freeze({
  primary: brand.primary,
  onPrimary: brand.onPrimary,
  tint: brand.tint, // selected-card / active-row background
});

const usePalette = () => PALETTE;

export default usePalette;
