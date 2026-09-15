// ─────────────────────────────────────────────
// components/AttendanceManagement/theme.js
// Design tokens — light + dark palettes.
//
// The LIGHT palettes derive from the app brand (src/theme/brand.js) and the
// shared design tokens (AppComponentsDesign/Tokens.js), so this module is no
// longer a parallel colour system: change the brand and the kiosk follows.
// Token NAMES are kept so the 14 consumer files did not need restructuring.
//
// Two names are load-bearing under the mustard brand:
//   blue     — FILLS only (buttons, FAB, avatar). Never text or spinners:
//              #F4B400 on white is 1.85:1.
//   blueDark — the brand AS text / spinner / thin border (= primaryStrong).
//   onBlue   — content drawn ON a `blue` fill (= onPrimary). `white` is for
//              content on the green/red/purple/waiting fills only.
//
// The DARK palettes have no brand equivalent yet (app-wide dark mode is
// undecided — THEME_AUDIT.md §D 3.13); only their brand/amber slots are
// re-pointed, the rest stay as designed.
//
// Do NOT import `C` directly into new code and freeze it into a
// module-level StyleSheet — that locks the component to light mode.
// Instead use the useAttendanceTheme() hook and build styles in-render:
//
//   import useAttendanceTheme from './useAttendanceTheme';
//   const makeStyles = (C, R, Sh) => StyleSheet.create({ ... });
//   const {C, R, Sh} = useAttendanceTheme();
//   const S = useMemo(() => makeStyles(C, R, Sh), [C, R, Sh]);
// ─────────────────────────────────────────────
import brand from '../../theme/brand';
import {AppTokens} from '../AppComponentsDesign/Tokens';

// Dark surfaces (no brand equivalent yet); hoisted so the palettes share them.
const DARK_SURFACE_ALT = '#1E293B';

export const C_LIGHT = {
  // Brand
  blue: brand.primary, // fills
  blueLight: brand.tint, // pale fill: selected rows, icon wells
  blueMid: brand.primary, // legacy alias for a mid fill
  blueDark: brand.primaryStrong, // brand as text / spinner / border
  onBlue: brand.onPrimary, // content on a `blue` fill

  // "On break" / waiting family — slate, not amber (see statusWaiting* in
  // Tokens.js: amber is indistinguishable from the mustard primary).
  amber: AppTokens.statusWaiting,
  amberLight: AppTokens.statusWaitingBg,
  amberDark: AppTokens.statusWaitingText,

  // Status (shared with the rest of the app's meaning, values kept)
  green: '#059669',
  greenLight: '#D1FAE5',
  greenMid: '#10B981',
  greenDark: '#065F46',

  red: '#DC2626',
  redLight: '#FEE2E2',
  redMid: '#EF4444',
  redDark: '#991B1B',

  purple: '#7C3AED',
  purpleLight: '#EDE9FE',
  purpleDark: '#5B21B6',

  // Surfaces
  bg: brand.pageBg,
  surface: brand.surface,
  surfaceAlt: brand.surfaceAlt,
  border: brand.divider,
  borderMid: AppTokens.chevronColor,

  // Text
  ink: brand.text,
  inkSub: brand.text,
  inkMuted: brand.secondary,
  inkFaint: brand.secondary,
  white: '#FFFFFF', // text on the green / red / purple / waiting fills
};

export const C_DARK = {
  // Brand — the mustard reads on dark surfaces (9.9:1), so no dark variant
  blue: brand.primary,
  blueLight: '#1E2A44', // dark tinted "blue background"
  blueMid: brand.primary,
  blueDark: brand.primary, // on a dark surface the fill colour IS readable
  onBlue: brand.onPrimary,

  // "On break" / waiting family (dark)
  amber: AppTokens.statusWaitingBg,
  amberLight: DARK_SURFACE_ALT,
  amberDark: AppTokens.statusWaitingBg,

  // Status
  green: '#10B981',
  greenLight: '#0E2A22',
  greenMid: '#34D399',
  greenDark: '#065F46',

  red: '#F87171',
  redLight: '#3A1A1A',
  redMid: '#EF4444',
  redDark: '#B91C1C',

  purple: '#A78BFA',
  purpleLight: '#241B3A',
  purpleDark: '#7C3AED',

  // Surfaces — inverted
  bg: '#0B1220',
  surface: '#111827',
  surfaceAlt: DARK_SURFACE_ALT,
  border: '#334155',
  borderMid: '#475569',

  // Text — inverted. `white` stays literally white for text-on-accent.
  ink: '#F1F5F9',
  inkSub: '#CBD5E1',
  inkMuted: '#94A3B8',
  inkFaint: '#64748B',
  white: '#FFFFFF',
};

// TimeClockScreen's local palette, promoted to a light/dark pair.
export const DK_LIGHT = {
  bg: brand.pageBg,
  card: brand.surface,
  cardBorder: brand.divider,
  surface: brand.surfaceAlt,
  accent: brand.primaryStrong, // brand as text / spinner / tint
  accentFill: brand.primary, // brand as a fill
  onAccentFill: brand.onPrimary,
  accentGreen: '#059669',
  accentAmber: AppTokens.statusWaiting, // "on break"
  accentRed: '#DC2626',
  amberLight: AppTokens.statusWaitingBg,
  amberDark: AppTokens.statusWaitingText,
  accentPurple: '#7C3AED',
  greenLight: '#D1FAE5',
  greenDark: '#065F46',
  purpleLight: '#EDE9FE',
  purpleDark: '#5B21B6',
  redLight: '#FEE2E2',
  redDark: '#991B1B',
  textPrimary: brand.text,
  textSecondary: brand.secondary,
  textMuted: brand.secondary,
  ring: AppTokens.chevronColor,
};

export const DK_DARK = {
  bg: '#0B1220',
  card: '#111827',
  cardBorder: '#334155',
  surface: DARK_SURFACE_ALT,
  accent: brand.primary,
  accentFill: brand.primary,
  onAccentFill: brand.onPrimary,
  accentGreen: '#34D399',
  accentAmber: AppTokens.statusWaitingBg,
  accentRed: '#F87171',
  amberLight: DARK_SURFACE_ALT,
  amberDark: AppTokens.statusWaitingBg,
  accentPurple: '#A78BFA',
  greenLight: '#0E2A22',
  greenDark: '#065F46',
  purpleLight: '#241B3A',
  purpleDark: '#7C3AED',
  redLight: '#3A1A1A',
  redDark: '#B91C1C',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  ring: '#475569',
};

// Back-compat default: light palette (used by disabled Home/Records screens).
export const C = C_LIGHT;

export const R = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 999,
};

const shadowColor = AppTokens.shadowColor;
export const Sh = {
  xs: {
    shadowColor,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 3,
  },
  md: {
    shadowColor,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 5,
  },
  lg: {
    shadowColor,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.13,
    shadowRadius: 20,
    elevation: 9,
  },
};
