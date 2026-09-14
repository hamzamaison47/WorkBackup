// ─────────────────────────────────────────────────────────────────────────────
// src/theme/brands/idap.js — the IDAP360 brand (mustard / charcoal).
//
// One file per application. Every key in src/theme/brandContract.js must be
// present and non-empty; brand.js validates this at import time. Run
// `npm run contrast` after editing — it reads THIS file through brand.js and
// fails on any pairing that would be unreadable or ambiguous — then
// `npm run sync-native-theme` to push `primary` into the native mirrors.
// ─────────────────────────────────────────────────────────────────────────────
import {lighten} from '../colorUtils';

const primary = '#F4B400'; // mustard
const charcoal = '#1F1F1F';

const idap = {
  name: 'idap',

  // ── Brand colour ────────────────────────────────────────────────────────
  // FILLED SURFACES ≥ 3px: buttons, section headers, FAB, selected rows,
  // connectors, the active-tab indicator. Never text or thin borders —
  // #F4B400 on white is 1.85:1.
  primary,

  // Primary AS text / link / 1–2px border / small icon / spinner on a light
  // background. Dark mustard: 5.1:1 on white, 4.7:1 on pageBg and on tint.
  primaryStrong: '#8A6A00',

  // Content ON a primary fill: button labels, icons, badge text. 8.9:1.
  onPrimary: charcoal,

  // De-emphasised content ON a primary fill (captions, secondary labels).
  // An alpha of onPrimary over primary; 0.71 is the lowest alpha that clears
  // the 4.5:1 gate (0.70 → 4.49). Resolves to ≈ #5D4A16 on mustard.
  onPrimaryMuted: 'rgba(31,31,31,0.71)',

  // Derived pale tint for selected rows / active chips / icon tiles
  // (P.tint, T.blueBg, static AppTokens.blueBg). Warm cream on mustard.
  tint: lighten(primary, 0.88), // → #fef6e0

  // ── Neutrals (feed LightTokens) ─────────────────────────────────────────
  text: charcoal, // headings, body, the inverted chrome's title/icons
  secondary: '#6B6B6B', // subtitles, captions, inactive tab icons/labels
  divider: '#E9E9E9', // hairlines, card borders, app-bar / tab-bar edges
  surface: '#FFFFFF', // cards, sheets, app bar, tab bar, drawer
  // Deliberately NOT pure white: the mockup shows white cards on a white
  // page; a light grey page keeps the cards legible without borders.
  pageBg: '#F7F7F7',
  // Slightly darker than surface: icon/avatar chips on the inverted app bar,
  // close/clear buttons on inverted sheet headers.
  surfaceAlt: '#F2F2F2',
};

export default idap;
