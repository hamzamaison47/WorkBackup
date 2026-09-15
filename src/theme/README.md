# src/theme — brand colours

The brand colour is a **compile-time constant**. It is not fetched from D365 and
not stored in Redux. One file per application lives in `brands/`; `brand.js`
selects one, validates it against `brandContract.js`, freezes it and exports it.
Everything brand-coloured in the app resolves to that object — directly
(`styles.js`, `AppComponentsDesign/Tokens.js`, `theme/colors.js`) or through the
hooks (`usePalette()` → `P.*`, `useAppTokens()` → `T.blue` / `T.blueBg` /
`T.onPrimary`).

```
brands/idap.js ──► brand.js (select · validate · freeze) ──► usePalette / useAppTokens / styles.js
                         ▲
                 brandContract.js (REQUIRED_BRAND_KEYS, assertValidBrand)
```

## Standing this codebase up for another application

1. **Copy a brand file.** `cp src/theme/brands/idap.js src/theme/brands/<app>.js`.
2. **Fill every key** in `REQUIRED_BRAND_KEYS` (`brandContract.js`). Each key's
   comment says what it paints and what it must contrast with. Leave nothing
   empty — `brand.js` throws at import time naming the missing key.
3. **Select it** in `brand.js`: change the single `import activeBrand from
   './brands/<app>'` line. That is the only edit outside `brands/`.
4. **Run the contrast gate:** `npm run contrast`. It loads the real brand and
   token modules and fails on any pairing that would be unreadable (WCAG AA)
   or ambiguous (status colours too close to the primary). Fix the brand
   values until it passes; do not ship on a failure.
5. **Sync the native mirrors:** `npm run sync-native-theme`. The JS theme cannot
   reach `android/.../values/styles.xml` (picker dialogs), the foreground-
   service notification colour, or the local-notification accent; this
   rewrites them from `brand.primary`. Re-run any time the brand changes; it
   is a no-op when already in sync. Rebuild the native app afterwards.
6. **Assets** are not themed by code: replace the launcher icons, splash and
   logo images under `src/assets/`, `android/.../mipmap-*` and
   `ios/.../Images.xcassets` yourself.

## Token vocabulary (what goes where)

| Key | Paints | Must contrast with |
|---|---|---|
| `primary` | filled surfaces ≥ 3px: buttons, section headers, FAB, selected rows | `onPrimary` ≥ 4.5:1 |
| `primaryStrong` | primary **as text**, links, 1–2px borders, small icons, spinners, switch tracks | `surface` and `pageBg` ≥ 4.5:1 |
| `onPrimary` | content on a `primary` fill | `primary` ≥ 4.5:1 |
| `onPrimaryMuted` | de-emphasised content on a `primary` fill (captions, inactive tab labels) | `primary` ≥ 4.5:1 |
| `tint` | pale primary for selected rows, active chips, icon tiles (hook `T.blueBg` and static `AppTokens.blueBg`) | — |
| `text` / `secondary` / `divider` / `surface` / `pageBg` / `surfaceAlt` | neutrals; feed `LightTokens` in `AppComponentsDesign/Tokens.js` | `secondary` on `surface` ≥ 4.5:1 |

Semantic status colours (`statusWaiting*`, `statusDraft*`, green/red/purple)
are **not** brand keys — they live in `AppComponentsDesign/Tokens.js` and are
shared by every brand, precisely so they never collide with a primary.

## Things that do not follow the brand (on purpose)

- `src/components/AttendanceManagement/theme.js` — the attendance kiosk has its
  own light/dark token set (being folded in separately).
- Pre-login screens (Login, QR setup, config selection) render before any
  network call; they read the same compile-time brand, so they *do* follow it —
  but they cannot follow anything server-driven, which is one reason the
  server palette was abandoned.
- `src/API/ColorPalette/RetrieveFirstOnly.js` — the old D365 palette client,
  intentionally unreferenced; kept for possible multi-tenant use.
