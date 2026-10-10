#!/usr/bin/env node

/**
 * scripts/sync-native-theme.js
 *
 * The JS theme cannot reach three places that paint the brand colour:
 *
 *   1. android/app/src/main/res/values/styles.xml
 *        colorPrimary / colorAccent → Android date/time picker dialogs,
 *        OK/CANCEL buttons, ripples.
 *   2. android/.../attendance/AttendanceForegroundService.java
 *        .setColor(0xFFRRGGBB) → the persistent clock-in notification.
 *   3. src/Controller/notificationService.js
 *        color: '#RRGGBB' → local (download) notification accent.
 *
 * This script rewrites those mirrors from the ACTIVE brand
 * (src/theme/brand.js → brand.primary). Run with `npm run sync-native-theme`
 * after changing the brand. Idempotent: a second run is a no-op and says so.
 * Files are only written when their content actually changes; line endings
 * and everything else in the files are preserved.
 *
 * Exit code 0 on success (changed or not), 1 if a mirror site could not be
 * found — a silent miss would leave a blue notification under a new brand.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
require('@babel/register')({
  presets: ['module:metro-react-native-babel-preset'],
  babelrc: false,
  configFile: false,
  only: [path.join(ROOT, 'src', 'theme')],
  cache: false,
});
const brand = require(path.join(ROOT, 'src/theme/brand.js')).default;

const HEX6 = /^#([0-9a-f]{6})$/i;
const m = HEX6.exec(String(brand.primary).trim());
if (!m) {
  console.error(
    `sync-native-theme: brand.primary must be an opaque #RRGGBB hex, got "${brand.primary}"`,
  );
  process.exit(1);
}
const HEX = '#' + m[1].toUpperCase(); // #RRGGBB
const ARGB = '0xFF' + m[1].toUpperCase(); // 0xFFRRGGBB (Java int literal)

// Each mirror: file, and a list of {pattern, replace, expect} where `expect`
// is the minimum number of matches (so a refactored file fails loudly).
const MIRRORS = [
  {
    file: 'android/app/src/main/res/values/styles.xml',
    edits: [
      {
        label: 'colorPrimary',
        pattern: /(<item name="colorPrimary">)#[0-9a-fA-F]{6}(<\/item>)/g,
        replace: `$1${HEX}$2`,
        expect: 1,
      },
      {
        label: 'colorAccent',
        pattern: /(<item name="colorAccent">)#[0-9a-fA-F]{6}(<\/item>)/g,
        replace: `$1${HEX}$2`,
        expect: 1,
      },
    ],
  },
  {
    file: 'android/app/src/main/java/com/idap360/attendance/AttendanceForegroundService.java',
    edits: [
      {
        label: 'NotificationCompat setColor',
        pattern: /(\.setColor\()0x[0-9a-fA-F]{8}(\))/g,
        replace: `$1${ARGB}$2`,
        expect: 1,
      },
    ],
  },
  {
    file: 'src/Controller/notificationService.js',
    edits: [
      {
        label: "notification color: '#…'",
        pattern: /(\bcolor:\s*')#[0-9a-fA-F]{6}(')/g,
        replace: `$1${HEX}$2`,
        expect: 3,
      },
    ],
  },
];

let failed = 0;
let changedFiles = 0;
console.log(`sync-native-theme — brand "${brand.name}", primary ${HEX}\n`);

for (const mirror of MIRRORS) {
  const abs = path.join(ROOT, mirror.file);
  if (!fs.existsSync(abs)) {
    console.error(`  MISSING  ${mirror.file}`);
    failed++;
    continue;
  }
  const before = fs.readFileSync(abs, 'utf8');
  let after = before;
  const notes = [];
  for (const e of mirror.edits) {
    const count = (after.match(e.pattern) || []).length;
    if (count < e.expect) {
      console.error(
        `  FAIL     ${mirror.file}: expected ≥${e.expect} match(es) for ${e.label}, found ${count}`,
      );
      failed++;
      continue;
    }
    after = after.replace(e.pattern, e.replace);
    notes.push(`${e.label} ×${count}`);
  }
  if (after !== before) {
    fs.writeFileSync(abs, after);
    changedFiles++;
    console.log(`  UPDATED  ${mirror.file}   (${notes.join(', ')})`);
  } else {
    console.log(`  in sync  ${mirror.file}   (${notes.join(', ')})`);
  }
}

console.log('');
if (failed) {
  console.error(`sync-native-theme: ${failed} problem(s) — see above.`);
  process.exit(1);
}
console.log(
  changedFiles
    ? `sync-native-theme: rewrote ${changedFiles} file(s) to ${HEX}. Rebuild the native app.`
    : `sync-native-theme: all native mirrors already match ${HEX}; nothing to do.`,
);
