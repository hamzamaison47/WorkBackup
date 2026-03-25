/**
 * tokens.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for design tokens and animation constants.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
export const AppTokens = {
  // Colors
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

  // Brand palette
  blue: '#0A66C2',
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
// ANIMATION CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

// Card-level stagger (for AnimatedCard — settings/profile/form screens)
export const CARD_STAGGER = 60; // ms between each card
export const CARD_FADE_DUR = 320; // ms — opacity animation
export const CARD_SPRING_SPEED = 14;
export const CARD_SPRING_BOUNCE = 3;
export const CARD_TRANSLATE_START = 18; // dp — how far cards slide from

// Row-level stagger (for AnimatedRow in modals / lists)
export const ROW_STAGGER = 45;
export const ROW_FADE_DUR = 200;
export const ROW_SLIDE_DUR = 280;
