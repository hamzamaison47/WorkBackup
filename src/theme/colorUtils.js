// ─────────────────────────────────────────────────────────────────────────────
// src/theme/colorUtils.js — small pure helpers used by brand files.
// ─────────────────────────────────────────────────────────────────────────────

// Blend a hex colour toward white by `amount` (0..1). amount=0.88 keeps 12%
// of the source → a pale tint. Returns an opaque #rrggbb (lower-case).
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
