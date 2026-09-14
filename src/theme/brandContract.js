// ─────────────────────────────────────────────────────────────────────────────
// src/theme/brandContract.js
//
// The shape every brand file under src/theme/brands/ must satisfy. brand.js
// validates the active brand against this at import time, so a missing or
// empty key fails the app at startup with a message naming the key — not as
// an invisible button three screens deep.
//
// Adding a key here means adding it to EVERY brand file. That is deliberate:
// the contract is the checklist for standing the codebase up for another
// application (see src/theme/README.md).
// ─────────────────────────────────────────────────────────────────────────────

export const REQUIRED_BRAND_KEYS = [
  // Identity — printed by the contrast gate and the native sync script.
  'name',

  // ── Brand colour ────────────────────────────────────────────────────────
  // FILLED SURFACES ≥ 3px: buttons, section headers, FAB, selected rows,
  // connectors, the primary-filled chrome. Never text or thin borders.
  'primary',
  // Primary used AS text / a link / a 1–2px border / a small icon / a spinner /
  // a switch track on a LIGHT background. Must be ≥ 4.5:1 on `surface` and
  // `pageBg` — the contrast gate enforces it.
  'primaryStrong',
  // Content drawn ON a `primary` fill: button labels, icons, badge text.
  'onPrimary',
  // De-emphasised content ON a `primary` fill: secondary labels, captions,
  // inactive tab labels. A darker/lighter variant of onPrimary, never a
  // different hue.
  'onPrimaryMuted',
  // Pale tint of primary for selected rows, active chips, icon tiles
  // (both the hook-level T.blueBg and the static AppTokens.blueBg).
  'tint',

  // ── Neutrals ────────────────────────────────────────────────────────────
  'text', // primary text / headings
  'secondary', // secondary text, subtitles, inactive icons
  'divider', // hairlines, card borders, list separators
  'surface', // cards, sheets, the app bar / tab bar / drawer
  'pageBg', // the page behind the cards
  'surfaceAlt', // chips / buttons drawn on `surface` (app-bar icon chips)
];

const isNonEmpty = v =>
  (typeof v === 'string' && v.trim().length > 0) ||
  (typeof v === 'number' && !Number.isNaN(v));

/**
 * Throws a descriptive Error if `brand` is missing any contract key or has an
 * empty value for one. Returns `brand` unchanged so it can be chained.
 */
export const assertValidBrand = brand => {
  if (!brand || typeof brand !== 'object') {
    throw new Error(
      'brandContract: the active brand is not an object — check the import in src/theme/brand.js',
    );
  }
  const missing = REQUIRED_BRAND_KEYS.filter(k => !(k in brand));
  const empty = REQUIRED_BRAND_KEYS.filter(
    k => k in brand && !isNonEmpty(brand[k]),
  );
  if (missing.length || empty.length) {
    const who = brand.name ? `brand "${brand.name}"` : 'the active brand';
    const parts = [];
    if (missing.length) {
      parts.push(`missing key(s): ${missing.join(', ')}`);
    }
    if (empty.length) {
      parts.push(`empty value(s): ${empty.join(', ')}`);
    }
    throw new Error(
      `brandContract: ${who} does not satisfy the brand contract — ${parts.join(
        '; ',
      )}. Every key in REQUIRED_BRAND_KEYS (src/theme/brandContract.js) must be set.`,
    );
  }
  return brand;
};
