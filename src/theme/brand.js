// ─────────────────────────────────────────────────────────────────────────────
// src/theme/brand.js
//
// SINGLE SOURCE OF TRUTH for the brand colour. Compile-time, frozen.
//
// Every brand-coloured surface in the app resolves to this object, either
// directly (styles.js, Tokens.js, colors.js, NotificationPanel.js) or through
// the hooks that wrap it (usePalette → P.*, useAppTokens → T.blue/T.blueBg/
// T.onPrimary). Change the active brand and the whole app follows.
//
// The D365 colour-palette service (DFColorPaletteSvc.retrieveFirstOnly, client
// in src/API/ColorPalette/RetrieveFirstOnly.js) is INTENTIONALLY NOT CONSUMED.
// Colours live in code, not in the tenant database. The SOAP client is kept
// in the tree, unreferenced, so it can be wired back in for multi-tenant
// theming later without touching the backend.
//
// Because this is a static constant, reading it at module load (as
// StyleSheet.create() in styles.js does) is correct, not a bug.
//
// Standing this codebase up for another application: see src/theme/README.md.
// ─────────────────────────────────────────────────────────────────────────────
import {assertValidBrand} from './brandContract';

// ▼▼▼ ACTIVE BRAND — the ONE line to change for another application. ▼▼▼
import activeBrand from './brands/idap';
// ▲▲▲ Point this at a file in src/theme/brands/ that satisfies brandContract.js,
//     then run `npm run contrast` and `npm run sync-native-theme`.

const brand = Object.freeze(assertValidBrand(activeBrand));

export default brand;
