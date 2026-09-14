import brand from '../../theme/brand';
// ─────────────────────────────────────────────────────────────────────────────
// LIGHT TOKENS (default)
// ─────────────────────────────────────────────────────────────────────────────
export const LightTokens = {
  pageBg: '#F1F5F9',
  formPageBg: '#FFFFFF',
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

  // ── Added for DSR (Save Record form) screens ──
  inputBg: '#FFFFFF',
  inputBorder: '#E0E0E0',
  inputText: '#1A1A1A',
  placeholderText: '#A0A0A0',
  disabledBg: '#F8F9FA',
  disabledText: '#A0A0A0',
  disabledBorder: '#F0F0F0',
  dropdownBg: '#FFFFFF',
  dropdownBorder: '#E0E0E0',
  dropdownItemBorder: '#F0F0F0',
  overlayBg: 'rgba(255, 255, 255, 0.9)',
  dropdownActiveBg: '#E8F1FB',
};

// ─────────────────────────────────────────────────────────────────────────────
// DARK TOKENS
// ─────────────────────────────────────────────────────────────────────────────
export const DarkTokens = {
  pageBg: '#0F172A',
  formPageBg: '#0F172A',
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

  // ── Added for DSR (Save Record form) screens ──
  inputBg: '#1E293B',
  inputBorder: '#334155',
  inputText: '#F1F5F9',
  placeholderText: '#64748B',
  disabledBg: '#17223A',
  disabledText: '#64748B',
  disabledBorder: '#263449',
  dropdownBg: '#1E293B',
  dropdownBorder: '#334155',
  dropdownItemBorder: '#263449',
  overlayBg: 'rgba(0, 0, 0, 0.85)',
  dropdownActiveBg: '#28374D',
};

// ─────────────────────────────────────────────────────────────────────────────
// BRAND PALETTE — same in both modes
// ─────────────────────────────────────────────────────────────────────────────
export const BrandTokens = {
  blue: brand.primary,
  blueStrong: brand.primaryStrong, // primary as text / thin border / icon
  blueBg: brand.primaryBg,
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

  // ── Semantic status tokens ──────────────────────────────────────────────
  // "Waiting" family: Pending / In review / Pending Approval / Assigned /
  // Unposted — anything that means "not decided yet". Deliberately NOT amber:
  // the mustard primary (#F4B400) is 1.16:1 against amber #F59E0B, so a
  // yellow "waiting" pill would be indistinguishable from a brand-coloured
  // one. Slate keeps the meaning readable next to any primary.
  //   statusWaiting     — dot / icon / active-pill fill
  //   statusWaitingBg   — pill background
  //   statusWaitingText — text on statusWaitingBg (6.6:1)
  statusWaiting: '#475569',
  statusWaitingBg: '#E2E8F0',
  statusWaitingText: '#334155',

  // Pending-count badge on the bottom tab bar. Today's values, named — still
  // mustard because the bar is blue today. It WILL collide with a mustard
  // primary (1.23:1); re-derive from statusWaiting when the tab bar is
  // inverted in the palette step.
  tabBadgeBg: '#D9A404',
  tabBadgeText: '#1A1A1A',

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
