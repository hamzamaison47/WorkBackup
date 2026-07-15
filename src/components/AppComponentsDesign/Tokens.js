import {DEFAULT_PALETTE} from '../../store/slices/colorPaletteSlice';
// ─────────────────────────────────────────────────────────────────────────────
// LIGHT TOKENS (default)
// ─────────────────────────────────────────────────────────────────────────────
export const LightTokens = {
  pageBg: '#F1F5F9',
  cardBg: '#FFFFFF',
  cardHeadingBg: '#FAFBFC',
  cardDivider: '#F1F5F9',
  rowDivider: '#F8FAFC',
  headingText: '#94A3B8',
  titleText: '#1E293B',
  subtitleText: '#94A3B8',
  chevronColor: '#CBD5E1',
  shadowColor: '#0F172A',
  emptyText: '#CBD5E1',
  footerText: '#CBD5E1',
};

// ─────────────────────────────────────────────────────────────────────────────
// DARK TOKENS
// ─────────────────────────────────────────────────────────────────────────────
export const DarkTokens = {
  pageBg: '#0F172A',
  cardBg: '#1E293B',
  cardHeadingBg: '#1A2744',
  cardDivider: '#2D3748',
  rowDivider: '#2D3748',
  headingText: '#64748B',
  titleText: '#F1F5F9',
  subtitleText: '#64748B',
  chevronColor: '#475569',
  shadowColor: '#000000',
  emptyText: '#475569',
  footerText: '#475569',
};

// ─────────────────────────────────────────────────────────────────────────────
// BRAND PALETTE — same in both modes
// ─────────────────────────────────────────────────────────────────────────────
export const BrandTokens = {
  // blue: '#0A66C2',
  blue: DEFAULT_PALETTE.primary,
  blueBg: '#E8F1FB',
  indigo: '#6366F1',
  indigoBg: '#EDEFFD',
  teal: '#0D9488',
  tealBg: '#CCFBF1',
  amber: '#F59E0B',
  amberBg: '#FEF3C7',
  red: '#DC2626',
  redBg: '#FEE2E2',
  green: '#16A34A',
  greenBg: '#DCFCE7',
  purple: '#7C3AED',
  purpleBg: '#EDE9FE',
  slate: '#475569',
  slateBg: '#F1F5F9',

  // Card shadow
  shadowOffset: {width: 0, height: 2},
  shadowOpacity: 0.07,
  shadowRadius: 10,
  elevation: 3,
};

// ─────────────────────────────────────────────────────────────────────────────
// AppTokens — static fallback (light) so existing imports don't break
// ─────────────────────────────────────────────────────────────────────────────
export const AppTokens = {
  ...LightTokens,
  ...BrandTokens,
};

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION CONSTANTS — unchanged
// ─────────────────────────────────────────────────────────────────────────────
export const CARD_STAGGER = 60;
export const CARD_FADE_DUR = 320;
export const CARD_SPRING_SPEED = 14;
export const CARD_SPRING_BOUNCE = 3;
export const CARD_TRANSLATE_START = 18;

export const ROW_STAGGER = 45;
export const ROW_FADE_DUR = 200;
export const ROW_SLIDE_DUR = 280;
