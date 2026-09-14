// ─────────────────────────────────────────────────────────────────────────────
// src/theme/brand.js
//
// SINGLE SOURCE OF TRUTH for the brand colour. Compile-time, frozen.
//
// Every brand-coloured surface in the app resolves to this object, either
// directly (styles.js, Tokens.js, colors.js, NotificationPanel.js) or through
// the hooks that wrap it (usePalette → P.primary/P.tint, useAppTokens →
// T.blue/T.blueBg/T.onPrimary). Change a value here and the whole app follows.
//
// The D365 colour-palette service (DFColorPaletteSvc.retrieveFirstOnly, client
// in src/API/ColorPalette/RetrieveFirstOnly.js) is INTENTIONALLY NOT CONSUMED.
// Colours live in code, not in the tenant database. The SOAP client is kept
// in the tree, unreferenced, so it can be wired back in for multi-tenant
// theming later without touching the backend.
//
// Because this is a static constant, reading it at module load (as
// StyleSheet.create() in styles.js does) is correct, not a bug.
// ─────────────────────────────────────────────────────────────────────────────

// Blend a hex colour toward white by `amount` (0..1). amount=0.88 keeps 12%
// of the source → a pale tint. Returns an opaque #RRGGBB.
export const lighten = (hex, amount) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!m) {
    return hex;
  }
  const mix = c =>
    Math.round(parseInt(c, 16) + (255 - parseInt(c, 16)) * amount);
  const to2 = n => n.toString(16).padStart(2, '0');
  return `#${to2(mix(m[1]))}${to2(mix(m[2]))}${to2(mix(m[3]))}`;
};

const primary = '#0A66C2';

const brand = Object.freeze({
  // Fills: app bar, tab bar, buttons, section headers, FAB, selected states.
  primary,

  // Text / thin borders / icons drawn in the brand colour on light surfaces.
  // Same as `primary` today; will diverge when a lighter primary needs a
  // darker companion for contrast.
  primaryStrong: primary,

  // Text and icons drawn ON a `primary` fill.
  onPrimary: '#FFFFFF',

  // Derived pale tint for selected rows / active chips (P.tint, T.blueBg).
  tint: lighten(primary, 0.88), // → #e2edf8

  // Designer-picked pale background used by the static AppTokens.blueBg
  // (dashboard icon tiles, profile chips, pill backgrounds). NOT the same
  // value as `tint` today (#E8F1FB vs #e2edf8) — kept as its own key so this
  // consolidation is pixel-identical. Candidate to merge into `tint` when the
  // palette itself changes.
  primaryBg: '#E8F1FB',
});

export default brand;
