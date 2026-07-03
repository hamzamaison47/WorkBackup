// ─────────────────────────────────────────────
// components/AttendanceManagement/theme.js
// Design tokens — light + dark palettes.
//
// Do NOT import `C` directly into new code and freeze it into a
// module-level StyleSheet — that locks the component to light mode.
// Instead use the useAttendanceTheme() hook and build styles in-render:
//
//   import useAttendanceTheme from './useAttendanceTheme';
//   const makeStyles = (C, R, Sh) => StyleSheet.create({ ... });
//   const {C, R, Sh} = useAttendanceTheme();
//   const S = useMemo(() => makeStyles(C, R, Sh), [C, R, Sh]);
//
// The static `C` export below stays pointed at the light palette purely
// for backward-compatibility with the still-light Home/Records screens.
// ─────────────────────────────────────────────

export const C_LIGHT = {
  // Brand
  blue: '#1B4FD8',
  blueLight: '#EEF3FF',
  blueMid: '#3B6FFF',
  blueDark: '#1340B8',

  // Accent
  amber: '#F59E0B',
  amberLight: '#FEF3C7',
  amberDark: '#B45309',

  // Status
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
  bg: '#F0F4F8',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  border: '#E2E8F0',
  borderMid: '#CBD5E1',

  // Text
  ink: '#0F172A',
  inkSub: '#334155',
  inkMuted: '#64748B',
  inkFaint: '#94A3B8',
  white: '#FFFFFF',
};

export const C_DARK = {
  // Brand — slightly brighter so accents read on dark surfaces
  blue: '#3B6FFF',
  blueLight: '#1E2A44', // dark tinted "blue background"
  blueMid: '#5B85FF',
  blueDark: '#1340B8',

  // Accent
  amber: '#FBBF24',
  amberLight: '#3A2E10',
  amberDark: '#F59E0B',

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
  surfaceAlt: '#1E293B',
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
  bg: '#F5F7FA',
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',
  surface: '#EEF2F7',
  accent: '#1B4FD8',
  accentGreen: '#059669',
  accentAmber: '#D97706',
  accentRed: '#DC2626',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  ring: '#CBD5E1',
};

export const DK_DARK = {
  bg: '#0B1220',
  card: '#111827',
  cardBorder: '#334155',
  surface: '#1E293B',
  accent: '#3B6FFF',
  accentGreen: '#34D399',
  accentAmber: '#FBBF24',
  accentRed: '#F87171',
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

export const Sh = {
  xs: {
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 3,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 5,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.13,
    shadowRadius: 20,
    elevation: 9,
  },
};
