// ─────────────────────────────────────────────
// components/AttendanceManagement/theme.js
// Design tokens — import everywhere, never hardcode.
// ─────────────────────────────────────────────

export const C = {
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
