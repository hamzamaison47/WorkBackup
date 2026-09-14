#!/usr/bin/env node

/**
 * scripts/contrast-guard.js
 *
 * Fails (exit 1) when the brand / status tokens would produce unreadable or
 * ambiguous UI. Run with `npm run contrast`. Intended to gate the palette
 * swap: change src/theme/brand.js, run this, fix what it flags.
 *
 * Reads the REAL modules (src/theme/brand.js, src/components/AppComponentsDesign/
 * Tokens.js) through @babel/register so the numbers can never drift from the
 * app. Nothing in src/ is modified.
 *
 * Checks
 *   1. onPrimary on primary            ≥ 4.5  (button labels, header icons)
 *   2. primaryStrong on white          ≥ 4.5  (brand text / thin borders on cards)
 *   3. primaryStrong on page/form bg   ≥ 4.5
 *   4. statusWaiting on statusWaitingBg ≥ 4.5 (dot / icon on pill)
 *   5. statusWaitingText on statusWaitingBg ≥ 4.5 (pill text)
 *   6. white on statusWaiting          ≥ 4.5  (active-pill text)
 *   7. primary vs statusWaiting distinguishable: CIE76 ΔE ≥ 20
 *      A WCAG luminance ratio was first proposed for this check, but it
 *      cannot measure hue difference: today's blue vs slate is only 1.33:1
 *      by luminance while being obviously different colours (ΔE 43.7), and
 *      the real collision — mustard #F4B400 vs amber #F59E0B — is ΔE 13.9.
 *      ΔE catches the collision and lets the blue palette pass; the
 *      luminance ratio is still printed for reference.
 *
 * Informational (never fails): primary vs the amber still used by warning
 * alerts and category chips, so you can see that collision coming.
 */
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
require('@babel/register')({
  presets: ['module:metro-react-native-babel-preset'],
  babelrc: false,
  configFile: false,
  only: [
    path.join(ROOT, 'src', 'theme'),
    path.join(ROOT, 'src', 'components', 'AppComponentsDesign'),
  ],
  cache: false,
});

const brand = require(path.join(ROOT, 'src/theme/brand.js')).default;
const {LightTokens, BrandTokens} = require(path.join(
  ROOT,
  'src/components/AppComponentsDesign/Tokens.js',
));

// ── colour maths ────────────────────────────────────────────────────────────
const norm = h => {
  const s = String(h).trim();
  const m3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(s);
  if (m3) {
    return ('#' + m3[1] + m3[1] + m3[2] + m3[2] + m3[3] + m3[3]).toUpperCase();
  }
  const m6 = /^#([0-9a-f]{6})/i.exec(s);
  if (!m6) {
    throw new Error(`contrast-guard: not an opaque hex colour: ${h}`);
  }
  return ('#' + m6[1]).toUpperCase();
};
const rgb = h => [1, 3, 5].map(i => parseInt(norm(h).slice(i, i + 2), 16));
const lin = c => {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const luminance = h => {
  const [r, g, b] = rgb(h);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
// WCAG 2.x contrast ratio — same function as THEME_AUDIT.md Appendix B.
const ratio = (a, b) => {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
};
// CIE76 ΔE in L*a*b* (D65) — perceptual colour difference, hue-aware.
const lab = h => {
  const [r, g, b] = rgb(h).map(lin);
  const X = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const Y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const Z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(X);
  const fy = f(Y);
  const fz = f(Z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
};
const deltaE = (a, b) => {
  const [l1, a1, b1] = lab(a);
  const [l2, a2, b2] = lab(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
};

// ── checks ──────────────────────────────────────────────────────────────────
const AA = 4.5;
const DISTINCT = 20;
const WHITE = '#FFFFFF';

const checks = [
  {
    label: 'onPrimary on primary',
    fg: brand.onPrimary,
    bg: brand.primary,
    min: AA,
  },
  {
    label: 'primaryStrong on white (cards)',
    fg: brand.primaryStrong,
    bg: WHITE,
    min: AA,
  },
  {
    label: 'primaryStrong on pageBg',
    fg: brand.primaryStrong,
    bg: LightTokens.pageBg,
    min: AA,
  },
  {
    label: 'primaryStrong on formPageBg',
    fg: brand.primaryStrong,
    bg: LightTokens.formPageBg,
    min: AA,
  },
  {
    label: 'statusWaiting on statusWaitingBg',
    fg: BrandTokens.statusWaiting,
    bg: BrandTokens.statusWaitingBg,
    min: AA,
  },
  {
    label: 'statusWaitingText on statusWaitingBg',
    fg: BrandTokens.statusWaitingText,
    bg: BrandTokens.statusWaitingBg,
    min: AA,
  },
  {
    label: 'white on statusWaiting (active pill)',
    fg: WHITE,
    bg: BrandTokens.statusWaiting,
    min: AA,
  },
];

const distinct = [
  {
    label: 'primary vs statusWaiting (semantic distinguishability)',
    a: brand.primary,
    b: BrandTokens.statusWaiting,
    min: DISTINCT,
  },
];

const info = [
  {
    label: 'primary vs amber (warning alerts / category chips — still amber)',
    a: brand.primary,
    b: BrandTokens.amber,
  },
  {
    label: 'primary vs tabBadgeBg (bottom-tab pending count)',
    a: brand.primary,
    b: BrandTokens.tabBadgeBg,
  },
  {
    label: 'tint vs statusWaitingBg (selected row vs waiting pill)',
    a: brand.tint,
    b: BrandTokens.statusWaitingBg,
  },
];

let failed = 0;
const pad = s => String(s).padEnd(58);
const f2 = n => n.toFixed(2).padStart(6);

console.log('\ncontrast-guard — palette: primary ' + norm(brand.primary));
console.log('\nWCAG contrast (minimum ' + AA + ':1)');
for (const c of checks) {
  const r = ratio(c.fg, c.bg);
  const ok = r >= c.min;
  if (!ok) {
    failed++;
  }
  console.log(
    `  ${ok ? 'PASS' : 'FAIL'}  ${pad(c.label)} ${f2(r)}:1   ${norm(
      c.fg,
    )} on ${norm(c.bg)}`,
  );
}

console.log('\nDistinguishability (CIE76 ΔE, minimum ' + DISTINCT + ')');
for (const d of distinct) {
  const e = deltaE(d.a, d.b);
  const ok = e >= d.min;
  if (!ok) {
    failed++;
  }
  console.log(
    `  ${ok ? 'PASS' : 'FAIL'}  ${pad(d.label)} ΔE ${f2(e)}   (luminance ${f2(
      ratio(d.a, d.b),
    )}:1)   ${norm(d.a)} vs ${norm(d.b)}`,
  );
}

console.log('\nInformational (not gated)');
for (const d of info) {
  const e = deltaE(d.a, d.b);
  const flag = e < DISTINCT ? 'WARN' : 'ok  ';
  console.log(
    `  ${flag}  ${pad(d.label)} ΔE ${f2(e)}   (luminance ${f2(
      ratio(d.a, d.b),
    )}:1)   ${norm(d.a)} vs ${norm(d.b)}`,
  );
}

console.log('');
if (failed) {
  console.error(
    `contrast-guard: ${failed} check(s) FAILED — do not ship this palette.`,
  );
  process.exit(1);
}
console.log('contrast-guard: all checks passed.');
