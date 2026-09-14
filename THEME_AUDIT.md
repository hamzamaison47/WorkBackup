# THEME_AUDIT.md — Blue → Mustard/Charcoal palette impact audit

**Scope:** Read-only audit of the Dynaface / IDAP360 React Native app (branch `operational`, HEAD `0236020`).
**Date:** 2026-09-14
**Constraint honoured:** no source file was modified; this document is the only file added.
**Method:** static analysis of `src/`, `App.js`, `index.js`, `android/`, `ios/`, plus visual inspection of image assets. Numbers come from a reproducible scan (script in Appendix B). Anything I could not confirm from code is marked **UNVERIFIED**.

Proposed palette under evaluation:

| Role | Hex | Name |
|---|---|---|
| primary | `#F4B400` | Mustard Yellow |
| text / header | `#1F1F1F` | Charcoal Black |
| secondary | `#6B6B6B` | Grey |
| dividers | `#E9E9E9` | Light Grey |
| background | `#FFFFFF` | White |

Plus a **surface inversion**: app bar and bottom tab bar become white with charcoal content and a yellow active indicator (today: solid primary-blue with white content).

---

## A. Executive summary

**This is a refactor, not a config or data change.** There *is* a server-driven palette (D365 `DFColorPaletteSvc.retrieveFirstOnly` → Redux `colorPalette` → `usePalette()`), and ~300 call sites do follow it. But it only carries `primary`, `onPrimary`, `selection`; it is fetched *after* login; and — the decisive point — the largest style file (`src/styles/styles.js`, 9,303 lines, imported by 106 files) reads the palette **once at module load** through `DEFAULT_PALETTE.primary`, so it is frozen at `#0A66C2` forever. On top of that there are 95 distinct blue-family hex literals (503 occurrences) hardcoded across 90+ files, a second independent brand blue in the Attendance module (`#1B4FD8`), a third in the AI chatbot (`#1A56DB`), and Material blues (`#1E88E5`, `#2196F3`, `#007AFF`) in legacy attendance screens. If D365 returned `#F4B400` tomorrow, roughly **40–50 % of primary-coloured surfaces would turn mustard and the rest would stay blue** — and the mustard half would immediately fail WCAG, because `onPrimary` is only consumed in **one screen plus the tab bar**; everywhere else white text/icons are hardcoded next to `backgroundColor: P.primary` (white on `#F4B400` = **1.85:1**). The white app bar / white tab bar is a structural change (active-state treatment, chip overlays, status-bar icon style, elevation/borders), not a colour swap. Finally, mustard is visually identical to the amber already used for *Pending / In review* status pills (`#F59E0B` vs `#F4B400` = **1.16:1**), so the status colour system needs re-semanticising, not re-tinting.

**Honest estimate**

| Scenario | Files touched | Effort |
|---|---|---|
| **Minimum viable** — server sends new hex, fix the 3 static leak points, wire `onPrimary`, invert app bar + tab bar + drawer header, status bar, status-pill collision. Leaves ~85 files with legacy blues (attendance, chatbot, setup, list-card gradients). | ~40–50 files | 8–12 eng-days (65–95 h) + 3–4 days QA |
| **Complete** — everything above plus sweep of all hardcoded blues, neutrals (text/grey/divider/background) to the new tokens, native/config, dark-mode decision. | ~140–150 files (161 files contain hex literals; ~15 have no blue) | 18–25 eng-days (145–200 h) + 5 days QA across ~60 screens, both platforms |

Assets (logo, splash, launcher icon) are **already orange/charcoal, not blue** — they need no redesign for this palette; only the dashboard stock PNG icons carry baked-in blue.

---

## B. How colour currently flows through the app

There are **seven** colour mechanisms, four of which matter:

```
D365 SOAP: DFColorPaletteSvcGroup.retrieveFirstOnly
   └─ src/API/ColorPalette/RetrieveFirstOnly.js  → {primaryColor, onPrimaryColor, selectionColor}
        └─ dispatched in src/Controller/authUtils.js:276-285 (normal login)
           and src/screens/LoginScreen.js:205-222 (biometric login)
              └─ store.dispatch(setPalette({primary, onPrimary, selection}))
                   └─ src/store/slices/colorPaletteSlice.js  (state.colorPalette; '' → DEFAULT_PALETTE fallback)
                        │   persisted by redux-persist → RNFS DocumentDirectoryPath/persist_root.json
                        │   (src/store/index.ts:8-47, whitelist includes 'colorPalette')
                        │   WIPED by RESET_APP_STATE at logout / login start / cold start
                        │   (src/store/rootReducer.js:59 — not in PRESERVE list)
                        │
        ┌───────────────┴────────────────────────────────────────────────┐
        │ DYNAMIC (reacts to store)            │ STATIC (frozen at import time)
        │                                       │
        │ src/hooks/usePalette.js               │ DEFAULT_PALETTE.primary read at module load by:
        │   → P.primary / P.onPrimary /         │   • src/styles/styles.js (87 style keys)
        │     P.selection / P.tint (derived)    │   • src/components/AppComponentsDesign/Tokens.js:73 (BrandTokens.blue)
        │   292 + 12 + 0 + 18 usages            │   • src/components/AppComponentsDesign/Index.js:29 (dead file, 0 importers)
        │                                       │   • src/theme/colors.js:34 (lightTheme.primary)
        │ src/components/AppComponentsDesign/   │   • src/components/PageHeader/MainPageHeader.js:20 (default prop only)
        │   useAppTokens.js → T.blue = P.primary│   • src/components/PageHeader/NotificationPanel.js:41-42,97-110
        │   T.blueBg = P.tint, T.onPrimary      │
        │   57 + 7 + 4 usages ("T.*" tokens)    │ AppTokens (static merge of LightTokens+BrandTokens):
        │                                       │   AppTokens.blue ×22, AppTokens.blueBg ×17
        │ useAppStyles() → getDSRStyles(tokens) │   (DashboardHeader, MenuCard, QuickAccessSheet, Profile,
        │   tokens.blue ×11 (form screens only) │    Settings, PILL_COLORS in ActionPaneContainer, styles.js 8200-8810)
        └───────────────────────────────────────┴────────────────────────────────────────────────
```

Other mechanisms:

5. **`src/theme/colors.js` + `useTheme()`** — a light/dark token set (`primary`, `background`, `card`, `text`…) used by only two consumers: `App.js:51-80` (feeds `NavigationContainer theme`) and `Settingsscreen.js:188-199` (switch track colours). Its `lightTheme.primary` is the *static* default; dark `primary` is purple `#BB86FC`.
6. **`src/components/AttendanceManagement/theme.js` + `useAttendanceTheme()`** — a completely separate token set for the Attendance kiosk (14 files). Brand blue is `#1B4FD8` (light) / `#3B6FFF` (dark). **Does not read the server palette at all.**
7. **Local `const C = {...}` / `const T = {...}` objects** — e.g. `AIChatModal.js:29-43` (`headerBg: '#1A56DB'`), `OutlookCalendarScreen.js:41`, `NotificationPanel.js:39` (`makeNotifTokens`).

Additional server-driven colours, *data* not theme: `getRegisterSummaryColorByDate` returns `PresentColor/AbsentColor/LeaveColor` per employee (consumed by `AttendanceSummary.js:64-66`, `LeaveColor` defaults to blue `#2196F3`); `retrieveInventColorIds` is an inventory attribute. Out of scope but worth knowing.

A dead mechanism: `styles.js:2` imports `COLOR_PALETTE` from `react-native`, which does not export it. All 29 `COLOR_PALETTE?.x || '#…'` expressions therefore resolve to their fallback literal. Recommendation: treat those fallbacks as plain hardcoded values.

### B.1 Shape of the server-driven palette (verified from code)

SOAP response node: `s:Envelope > s:Body > retrieveFirstOnlyResponse > result > a:DFColorPaletteContract` with children (namespace prefix stripped by `cleanObject`):

| Backend key | Mapped to | Written at | Read via |
|---|---|---|---|
| `PrimaryColor` | `primaryColor` → `state.colorPalette.primary` | `colorPaletteSlice.js:24` | `usePalette().primary`, `useAppTokens().blue` |
| `OnPrimary` | `onPrimaryColor` → `state.colorPalette.onPrimary` | `colorPaletteSlice.js:25` | `usePalette().onPrimary`, `useAppTokens().onPrimary` — **16 usages total** |
| `SelectionColor` | `selectionColor` → `state.colorPalette.selection` | `colorPaletteSlice.js:27-28` | **0 usages** — stored, never read |

Derived on the client: `tint = lighten(primary, 0.88)` (`usePalette.js:20-27,42`) — for `#0A66C2` that is `#E2EDF8`; for `#F4B400` it becomes `#FEF6E0`.

The backend sends **no** text, secondary, divider, background, surface, or status colours. The slice cannot represent the proposed palette's other four roles without a contract change.

**UNVERIFIED:** whether the tenant's `DFColorPalette` table currently has a row at all (the code handles "no row" by falling back to defaults and logs `No data found in DFParameter table`), and whether `OnPrimary` is populated. The `[PALETTE-DEBUG]` console logs in `RetrieveFirstOnly.js:42-71` suggest this was recently being diagnosed. Please confirm with the D365 side before relying on it.

### B.2 CRITICAL QUESTION — if D365 returned the new hex values tomorrow

Assume the backend returns `PrimaryColor=#F4B400`, `OnPrimary=#1F1F1F`, `SelectionColor=#F4B400`, and the user logs in (palette is fetched post-login; pre-login screens never see it).

**Would change by itself (Bucket 1, ~46 files, ~400 property sites):**
- Bottom tab bar background, active/inactive icon colours, active label (`CustomTabBar.js:179-202`) → mustard bar, charcoal icons/labels *(then contrast is fine for icons, but see the rgba-white overlays below)*
- App bar background (`ActionPaneContainer.js:797` → `MainPageHeader.js:80`) and the drawer's fallback header (`DrawerNavigator.js:489`) → mustard, **with hardcoded white icons/title** (`MainPageHeader.js:34,51,68,93,132,151`) → 1.85:1
- Drawer header block (`DrawerNavigator.js:126`), avatar initials, online-dot border → mustard with hardcoded white text (`:152,220,229`)
- FAB (`ActionPaneContainer.js:851`) → mustard with white `+` (`:869`)
- All 17 list pages' header icon buttons (edit/delete/attachment: `backgroundColor: P.primary` + `iconColor: '#fff'`, e.g. `LeaveRequestListPage.js:394-418`) → mustard with white icons
- Section headers (`SectionHeader.js:12` with white title `:29`), Quick Access sheet header + StatusBar (`QuickAccessSheet.js:179,221`), filter radio dots/badges, BadgePill defaults, search bar active states, workflow comment modal, IDAP expense/travel screens, form-screen DSR styles (`tokens.blue`, 11 sites), NavigationContainer `primary`/`notification`? — **no**: `App.js:77-78` reads `colors.primary` from `useTheme()` which is the *static* default.

**Would stay blue (and why):**

| Stays blue | Why | Where |
|---|---|---|
| Every button, header row, connector, badge and text painted by `styles.js` — Save/Submit buttons on every form (`SRBtn_SubmitButton :5634-5635`, `SRBtn_ButtonText :5650`), attachment/receipt modal Save (`DAM_saveButton :6635`), Alert OK (`Alert_OkButton :7176`), calendar modal header/OK (`:5729,5772`), org-chart lines/cards (`orgStyles_* :7567-7763`, `WorkerATM_* :1420-1643`), notification panel header/buttons (`notif_* :3811-4045`), AI float button (`:4981`), chat bubbles (`:5199`), legacy tab bar (`TNav_TabBar :3715-3759`), dashboard header container (`:1191`), filter underlines (`:6721,7047`), form header accent (`formHeader :6975-6981`), edit/create icon circles (`:7392-7544`), ID button (`:8023`), site-survey bar (`SSB_container :9084`) — **87 style keys** | `DEFAULT_PALETTE.primary` is evaluated once inside `StyleSheet.create()` at import time | `src/styles/styles.js` (imported by 106 files) |
| Dashboard profile card: accent bar, avatar ring/initials, "Profile" chip, department tag, stat icons | Static `AppTokens.blue`/`blueBg` | `DashboardHeader.js:81,207-208,221,242-248,265-272`; `styles.js:8289-8398` |
| Dashboard menu tile icon backgrounds (the "light blue icon tiles on white cards") | Static `AppTokens.blueBg` (`#E8F1FB`) | `MenuCard.js:56`; `QuickAccessSheet.js:147` |
| Profile / Settings / Personal-info icon badges | Static `AppTokens.blue`/`blueBg` props | `Profile.js:171-172`, `Settingsscreen.js:220-221`, `DisplayPersonalInfo.js:46-47`, `styles.js:8758-8809` |
| The **"All"** filter pill (active colour, bg, text) | `PILL_COLORS.All` uses static `AppTokens.blue` | `ActionPaneContainer.js:58-63` |
| Attendance calendar "leave" legend | Static `AppTokens.blue` | `Attendancecalendargrid.js:44` |
| Notification panel icon/type colours (`Firebase`, `Info`, `default`), `navy`, `blue` tokens | `DEFAULT_PALETTE.primary` read at module scope; only partially patched at `:283` | `NotificationPanel.js:41-42,97-110` |
| Settings switches, NavigationContainer `primary`/`notification` (back-button tint on default headers) | `lightTheme.primary` static | `theme/colors.js:34`; `App.js:77-78`; `Settingsscreen.js:188,198` |
| Entire Attendance Management kiosk (Home, TimeClock, Records, Confirm* screens, FAB, map) | Independent `#1B4FD8`/`#3B6FFF` tokens | `AttendanceManagement/theme.js:20-23,62-65,108,123` (39 `C.blue*` + 8 `DK.accent` sites, 14 files) |
| Legacy attendance screens (Create/Details/Adjustment/Roster/Calendar) | Material blues `#1E88E5`, `#2196F3`, `#007AFF`, `#0EA5E9` hardcoded | `components/Attendance/*`, `screens/Attendance/*` (~45 sites) |
| AI chatbot header, bubbles, send button, float button, gradients | `#1A56DB`, `#0765A2`, `#054A8C` hardcoded; gradients mix `P.primary` with `#0765A2` → would render mustard→navy | `AIChatModal.js:29-43`, `AIChatbot.js:76,113,596,660`, `AIFloatingButton.js:72` |
| List-card background gradient on 17 list pages | `['#6ee0ff','#bddeff','#cce6ff']` copy-pasted | e.g. `LeaveRequestListPage.js:708`, `EntitlementCards.js:10` (full list Appendix A) |
| Dropdown `activeColor="#E6F0FF"` on forms (31 sites), `#E8F0FE`/`#E3F2FD`/`#DBEAFE`… tints | hardcoded | forms, alerts, cards |
| Advances StatusBadge "approved" (`#1565C0`), workflow timeline "Created" (`#2563EB`), certificate accents (`#2563EB`, `#0369A1`) | hardcoded | `EmployeeAdvancesList.js:97`, `WorkflowHistoryListPage.js:217`, `CertificateCard.js` |
| **Pre-login surfaces**: Login, QR setup, config selection, splash | Rendered before the palette exists; and `RESET_APP_STATE` at login start wipes any persisted palette | `LoginScreen.js:73,649,692,829`; `QRSetupScreen.js` (11 sites); `ConfigSelectionScreen.js` (8 sites) |
| Android date/time picker dialogs, notification accent, foreground-service notification | Native | `styles.xml:9,11`; `AttendanceForegroundService.java:122`; `notificationService.js:363,405,429` |

Net: the server palette reaches the *chrome* (tab bar, app bar background, section headers, list-page buttons, FAB) and *some* components, but not the global stylesheet, the dashboard card, the icon tiles, the "All" pill, the attendance module, the chatbot, or anything pre-login. The visible result would be an app that is half mustard (with unreadable white text) and half blue.

---

## C. Colour mapping table

Usage counts are live (non-commented) occurrences in `src/` + `App.js`. "Where defined" is the canonical definition; raw duplicates are counted separately.

| Current | Proposed | Role | Where defined | Usages |
|---|---|---|---|---|
| `#0A66C2` | `#F4B400` | primary | `store/slices/colorPaletteSlice.js:6` (default; server `PrimaryColor`) | 292 `P.primary` + 57 `T.blue` + 11 `tokens.blue` + 4 `colors.primary` (dynamic) · 97 `DEFAULT_PALETTE.primary` + 22 `AppTokens.blue` + 3 `AT.blue` (static) · 59 raw `#0A66C2` |
| `#FFFFFF` (on-primary) | `#1F1F1F` | text on primary | `colorPaletteSlice.js:7` (server `OnPrimary`) | 12 `P.onPrimary` + 4 `T.onPrimary`. Hardcoded white instead: ≥54 sites within 4 lines of a primary background (25 files), plus cross-component pairings (`styles.js` text keys) |
| `#0A66C2` (selection) | — | selection | `colorPaletteSlice.js:8` (server `SelectionColor`) | **0** — dead field |
| `#E2EDF8` (derived tint) | `#FEF6E0` (derived) | selected-row / chip bg | `hooks/usePalette.js:42` | 18 `P.tint` + 7 `T.blueBg` |
| `#E8F1FB` | (tint) | blueBg static | `AppComponentsDesign/Tokens.js:74`; `Index.js:30` | 17 `AppTokens.blueBg` + 6 raw |
| `#1B4FD8` / `#3B6FFF` | `#F4B400` ? | Attendance brand | `AttendanceManagement/theme.js:20,62,108,123` | 39 `C.blue*` + 8 `DK.accent` + 3 raw |
| `#1A56DB`, `#0765A2`, `#054A8C` | `#F4B400` ? | AI chat brand | `AIChatModal.js:31,35,40`; `AIChatbot.js` | 8 + 5 + 1 raw |
| `#1E88E5`, `#2196F3`, `#007AFF`, `#0EA5E9`, `#2563EB`, `#3B82F6`, `#1565C0`, `#007BFF`… (30 more) | `#F4B400` or a neutral | legacy/secondary blues | scattered | 19+19+8+9+11+5+2+6… ≈ 130 |
| `#6ee0ff→#bddeff→#cce6ff` | ? | list-card gradient | 17 list pages | 58 |
| `#E6F0FF` | tint | dropdown `activeColor` | forms | 31 |
| `#1E293B` (titleText) / `#1A1A1A` / `#0F172A` / `#111827` / `#000000` | `#1F1F1F` | text/header | `Tokens.js:13`, `colors.js:38-40`, `AttendanceManagement/theme.js:53` | 30 + 62 + 39 + 14 + 149 raw; 18 `T.titleText` |
| `#94A3B8` (subtitle/heading) / `#64748B` / `#6B7280` / `#666666` / `#888888` / `#757575` | `#6B6B6B` | secondary | `Tokens.js:12,14`, `colors.js:39,41`, `theme.js:55-56` | 34 + 34 + 28 + 40 + 62 + 26 raw |
| `#F1F5F9` (cardDivider) / `#F8FAFC` (rowDivider) / `#F0F0F0` / `#E0E0E0` / `#E2E8F0` / `#E5E7EB` / `#CCCCCC` | `#E9E9E9` | dividers/borders | `Tokens.js:10-11,22,27,29`, `colors.js:42-43`, `theme.js:49` | 33 + 25 + 35 + 40 + 21 + 20 + 20 raw |
| `#F1F5F9` (pageBg) / `#F5F7FA` / `#F0F4F8` / `#F2F2F2` | `#FFFFFF` | page background | `Tokens.js:6`, `colors.js:35,45`, `theme.js:46` | pageBg used via `T.pageBg` widely; note `CustomTabBar.js:180-200` **string-compares `T.pageBg === '#0F172A'` to detect dark mode** |
| `#FFFFFF` (cardBg) | `#FFFFFF` | cards | `Tokens.js:8` | 529 raw `#FFFFFF` (all roles) |
| `#F59E0B` amber / `#FEF3C7` amberBg / `#92400E` | **collides with primary** | Pending / In review status | `Tokens.js:79-80`; `ActionPaneContainer.js:70-93`; `DynamicRequestCard.js:63`; `WorkflowHistoryListPage.js:249` | 14 + 13 + 17 |
| `#D9A404` / `#1A1A1A` | collides with primary | tab-bar pending-count badge (already mustard) | `CustomTabBar.js:17-18` | 2 |
| `#0A66C2` | `#F4B400` | Android `colorPrimary` / `colorAccent` (pickers) | `android/app/src/main/res/values/styles.xml:9,11` | 2 |
| `0xFF0A66C2` | ? | foreground-service notification accent | `AttendanceForegroundService.java:122` | 1 |
| `#0A66C2` | ? | local notification accent | `Controller/notificationService.js:363,405,429` | 3 |
| `#0A2540` | `#1F1F1F` / none | app-bar shadow tint | `MainPageHeader.js:86` | 1 |
| `#BB86FC` | (undecided) | **dark-mode** primary | `theme/colors.js:61,75` | dark mode is out of the mockup's scope — open question |

---

## D. Bucketed file list

Legend: **dyn** = references `P.*`/`T.blue*`/`tokens.blue`; **static** = `AppTokens.blue*`/`DEFAULT_PALETTE.primary`; **raw** = hardcoded blue-family hex (brand or tint). A file in Bucket 1 can still inherit static blue through `styles.<key>` from `styles.js` — 106 files import it.

### Bucket 1 — changes automatically via token/server palette (no code edit for the *colour*)

46 files reference only dynamic tokens. ⚠ marks those that also hardcode white beside a primary background and therefore move straight into Bucket 3 for contrast.

| File | Dyn sites | What it paints |
|---|---|---|
| `App.js` | 2 | NavigationContainer theme (`colors.primary` — actually static via `useTheme`) |
| `src/Navigation/DrawerNavigator.js` ⚠ | 8 | Drawer header bg `:126`, active item `:74`, stack header fallback `:489`; white text `:152,220,229,500,502` |
| `src/components/ActionPaneMenuModal.js` | 5 | Brand stripe `:268`, avatar circle `:273` |
| `src/components/DynamicRequestCard.js` | 6 | Buttons, selected tint `:809` |
| `src/components/Filters/FilterPanel.js` | 8 | Radio dot `:129`, chips |
| `src/components/Filters/ListFilterBar.js` | 5 | Filter badge `:178` |
| `src/components/SearchBar.js` | 12 | Active dropdown, apply button `:497` |
| `src/components/PersonalInformation/SectionHeader.js` ⚠ | 1 | Section header bg `:12`, white title `:29` |
| `src/components/AppComponentsDesign/BadgePill.js` | 2 | Pill text/bg defaults |
| `src/components/AppComponentsDesign/useAppTokens.js` | 3 | Token bridge |
| `src/components/CommentModal/WorkflowCommentModal.js` | 1 | Submit `:161` |
| `src/components/Alert/LanguageModal.js` | 1 | Selected language |
| `src/components/Attendance/TimeFlicker.js` | 1 | Digit colour |
| `src/components/AttendanceManagement/MapBackground.js` | 2 | Marker/pulse `:234,240` |
| `src/components/CustomIndicator/CustomIndicator.js` | 1 | Spinner |
| `src/components/EmployeeAdvanceRequest/RequestTypeSelectionModal.js` | 1 | Selected option |
| `src/components/PageHeader/CompanyDropdown.js` | 1 | Selected company |
| `src/components/PurchaseRequisition/PurchaseRequisitionListPageCard.js` | 2 | Card accents |
| `src/Customizations/IDAP/components/MedicalReceiptDetailsModal.js` | 7 | Buttons — **uses `P.onPrimary` correctly** `:501-566` |
| `src/Customizations/IDAP/screens/ExpenseManagement/Header/ExpenseManagementSaveRecord.js` | 4 | Form accents |
| `src/Customizations/IDAP/screens/ExpenseManagement/Lines/ExpenseManagementLineSaveRecord.js` | 8 | Form accents |
| `src/Customizations/IDAP/screens/ExpenseManagement/Lines/ExpenseManagementLinesListPage.js` ⚠ | 6 | Header icon buttons `:651-673` + white icons |
| `src/Customizations/IDAP/screens/ExpenseManagement/Lines/MedicalExpenseLinesListPage.js` | 12 | Header icon buttons — **uses `P.onPrimary`** `:441-464` |
| `src/Customizations/IDAP/screens/ExpenseManagement/Lines/MedicalExpenseLinesSaveRecord.js` | 4 | Form accents |
| `src/Customizations/IDAP/screens/ExpenseManagement/Lines/TravelRequisitionSiteSurveyReport.js` | 8 | Report header `:332` (`tokens.blue`) |
| `src/Customizations/IDAP/screens/TravelRequisition/Header/TravelRequisitionSaveRecord.js` | 4 | Form accents |
| `src/Customizations/IDAP/screens/TravelRequisition/Lines/TravelRequisitionLinesListPage.js` ⚠ | 5 | Header icon buttons `:475-486` |
| `src/Customizations/IDAP/screens/TravelRequisition/Lines/TravelRequisitionLinesSaveRecord.js` | 7 | Form accents |
| `src/screens/Certificates/ESSEmployeeCertificate_Saverecord.js` | 3 | Submit `:231` |
| `src/screens/EmployeeAdvanceRequest/EmployeeAdvanceSalary_Create.js` | 3 | Submit `:395` |
| `src/screens/ESSEmployeeTask/ESSEmployeeTaskDetail.js` ⚠ | 2 | Action button `:170` + white |
| `src/screens/ExitInterview/HRExitInterview_ListPage.js` | 1 | Accent |
| `src/screens/OPD Expense/ESSOPDMedicalExpense_SaveRecord.js` | 1 | Submit `:222` |
| `src/screens/OutstandingAdvances/OutstandingAdvancesScreen.js` | 6 | Header `:546`, buttons `:839`, spinner tint `:814`, shadow `:551` |
| `src/screens/OvertimePlanner/OvertimePlanner_Create.js` ⚠ | 8 | Buttons `:307,350,807` |
| `src/screens/Profile/PersonalInformation/BankAccount/BankAccountSaveRecord.js` | 1 | Accent |
| `src/screens/Profile/PersonalInformation/ChangeProfileImage/ChangeProfileImage.js` | 4 | Button `:398`, spinner `:254` |
| `src/screens/Profile/PersonalInformation/Identification/IdentificationNumberSaveRecord.js` | 8 | Form accents |
| `src/screens/Profile/PersonalInformation/PersonalEducation/PersonalEducationSaveRecord.js` | 3 | Form accents |
| `src/screens/Profile/Preferences/Preferences.js` | 3 | Gradient header `:63` |
| `src/screens/PurchaseRequisition/PurchaseRequisitionSaveRecord.js` | 3 | Form accents |
| `src/screens/PurchaseRequisitionLines/PurchaseRequisitionLinesListPage.js` | 1 | Accent |
| `src/screens/RequestForRegistration/RequestForRegistration.js` | 6 | Dialog button `:137` (route retired) |
| `src/screens/SalarySlip/PRSalarySlip.js` | 3 | Gradient `:202` |
| `src/screens/TaxCertificate/PRTaxCertificate.js` | 3 | Gradient `:212` |
| `src/screens/WorkflowDetailScreen.js` | 8 | Header `:217`, table head |

### Bucket 2 — hardcoded, single-line swap (mechanical, no layout change)

Grouped by the literal to replace. Full per-file line numbers in Appendix A.

**2a. Static primary leaks (3 root causes → fixes the 87 style keys and 39 AppTokens sites at once if refactored; otherwise 126 single-line edits):**
- `src/styles/styles.js` — 87 `DEFAULT_PALETTE.primary` keys (lines 1191–9088; list in §B.2) + 12 `AppTokens.blue*` keys (`:8208,8289,8310,8321,8363,8371,8387,8398,8758,8759,8774,8809`) + 61 raw blue literals (`:618,784,898,1035,1145` shadows `#0A66C2`; `#007BFF`, `#0066CC`, `#3B82F6`, `#2563EB`, `#4A90E2`, `#3D95ED`, `#0C5298`, `#084C94`, `#004AAD`, `#EEF2FF`, `#EBF5FF`, `#DCE6F5`, `#BED8F6`, `#EAF2FB`, `#E6F2FF`, `#EBF4FF`, `#E8F3FF`, `#D0EBFF`, `#E3F0FB`…)
- `src/components/AppComponentsDesign/Tokens.js:73-74` — `BrandTokens.blue/blueBg`
- `src/theme/colors.js:34` — `lightTheme.primary`
- `src/components/AppComponentsDesign/Index.js:29-30` — dead duplicate (0 importers); recommend deletion, not edit

**2b. Raw `#0A66C2` outside styles.js (35 sites, 8 files):** `Controller/notificationService.js:363,405,429` · `LoginScreen.js:73,649,692,829` · `Setup/ConfigSelectionScreen.js:211,263,389,402,405,417,449,501` · `Setup/QRSetupScreen.js:924,1041,1146,1302,1305,1379` · `IDAP/…/MedicalExpenseManagementSaveRecord.js:578,631` · `IDAP/…/DFEmployeeLeaveRequestListPage.js:987,998,1008,1073` · `IDAP/…/DFEmployeeLeaveREquestSaveRecord.js:554,658,694,715,798,819,856` · `AppComponentsDesign/Appcomponents.js:36` (doc comment)

**2c. Static `AppTokens.blue/blueBg` props (27 sites, 9 files):** `DashboardHeader.js:81,207,208,221,242,246,248,265,269,272` · `MenuCard.js:56` · `QuickAccessSheet.js:147` · `Profile.js:171-172` · `Settingsscreen.js:220-221` · `DisplayPersonalInfo.js:46-47` · `Attendancecalendargrid.js:44` · `ActionPaneContainer.js:59-61` (see Bucket 3 — semantic) · `NotificationPanel.js:97,103,110` (`DEFAULT_PALETTE.primary`)

**2d. Light-blue list-card gradient `['#6ee0ff','#bddeff','#cce6ff']` (17 files, 1 line each):** `EntitlementCards.js:10` · `DFEmployeeLeaveRequestListPage.js:1047` · `ESSEmployeeCertificate_Listpage.js:67` · `GenericAdvanceListScreen.js:892` · `EmployeeEOSClearanceItems_ListPage.js:281` · `EmployeeEOSRequest_ListPage.js:321` · `ESSEmployeeTask_ListPage.js:256` · `ExpenseManagmentLinesListPage.js:509` · `HRHelpDeskList_Screen.js:562` · `LeaveEncashment_ListPage.js:236` · `LeaveRequestListPage.js:708` · `BankAccountListPage.js:458` · `FamilyContact_ListPage.js:402` · plus `ESSEmployeeCourse_ListPage.js`, `ESSOPDMedicalExpense_ListPage.js`, `WorkItemAssignedToMe.js:636`, `IdentificationDetailsSection.js:187` (see `grep -i "#6ee0ff"`)

**2e. Dropdown `activeColor="#E6F0FF"` and sibling tints (31 sites):** `RequestedForDropdown.js:32,109` · `MedicalExpenseManagementSaveRecord.js:604` · `DFEmployeeLeaveREquestSaveRecord.js:593,754` · `GenericAdvanceSaveScreen.js:1242,1357,1397` · and the remaining form screens (Appendix A rows with `#E6F0FF`)

**2f. Second/third brand blues:**
- `src/components/AttendanceManagement/theme.js:20-23,62-65,108,123` — `blue/blueLight/blueMid/blueDark`, `DK.accent` (token file; 14 consumer files follow automatically once changed)
- `src/components/AIChatbot/AIChatModal.js:31,35,40,41` · `AIChatbot.js:76,113,596,660` (gradients mixing `P.primary` with `#0765A2`,`#054A8C`) · `AIFloatingButton.js:72`
- `src/screens/Settings/OutlookCalendarScreen.js:41-…` local `T` object (`#0A6CB5`, `#2A4A7F`, `#3D6CB5`, `#0D1B2E` shadows)

**2g. Material/legacy blues in attendance (45 sites, 10 files):** `components/Attendance/AttendanceComponents.js:26,32,49,58,72,97,116,133…` (`#1E88E5` ×12) · `AttendanceDetailsComponents.js` · `EmployeeAdjustmentLineDetails.js` (`#2196F3`, `#90CAF9`) · `DFCalendar.js`, `CreateEmployeeAdjustment.js` (`#007AFF`) · `AttendanceCalender.js`, `screens/Attendance/AttendanceCalendarScreen.js` (`#0EA5E9` ×9) · `screens/Attendance/{Create,Details,Adjustment,Roster}*.js` · `MainDashboard/AttendanceSummary.js:54,66` (`LeaveColor` default `#2196F3`) · `LeaveEntitlementProgress.js` (`#2196F3`, `#3F51B5`)

**2h. Isolated accents:** `EmployeeAdvancesList.js:97` (`#1565C0` approved) · `WorkflowHistoryListPage.js:217-219` (`#2563EB` Created) · `CertificateCard.js`, `CertificateDetailsModal.js:284` (`#2563EB`, `#0369A1`) · `PRLinesList.js`, `PRHeaderList.js` (`#3B82F6`, `#2196F3`) · `WorkItemAssigned.js:90` (`tintColor="#2e6dd8"`) · `HrNewsUpdatesScreen.js:185` (`tintColor="#6366F1"`) · `BiometricSettings.js` (`#0078D4`, `#007AFF`) · `FamilyContact_SaveRecord.js`, `ContactDetailsSaveRecord.js` (`#81B0FF`, `#2196F3`, `#04739C`) · `PurchaseRequisitionLinesSaveRecord.js` (`#0275D8`) · `GenericAdvanceListScreen.js` (`#1877F2`) · `utils/lazyLoadScreens.js` (`#0000FF` — dev placeholder)

### Bucket 3 — needs real work (surface inversion, status bar, contrast rework, semantics)

| # | File(s) | Lines | What / why it is not a colour swap |
|---|---|---|---|
| 3.1 | `src/Controller/CustomTabBar.js` | 17-18, 179-202, 209-210, 230-246, 280-289, 303-308, 336-338, 347-357 | **Tab bar inversion.** Today: primary bg; active tab = *white pill gradient* (`['#ffffff','#f0f0f0']`) with primary icon; inactive icons `P.onPrimary` inside `rgba(255,255,255,0.15)` wells; inactive label `rgba(255,255,255,0.7)`; top border = `P.primary`; `elevation: 20`. On a white bar the white pill and white wells vanish, labels become invisible, and the 1 px mustard top border is 1.85:1 against white. Needs a new active treatment (mustard indicator/underline `:280-289` is the natural candidate, but then `activeLabelColor` must become charcoal, not `P.onPrimary`), grey inactive colours, `#E9E9E9` top border, reduced elevation. Dark-mode detection by `T.pageBg === '#0F172A'` string compare must not break. The pending-count badge `#D9A404` is already mustard — against a mustard active indicator it loses meaning. |
| 3.2 | `src/components/PageHeader/MainPageHeader.js` | 20, 34, 51, 68, 79-93, 106-113, 116-128, 132, 137-146, 148-153 | **App bar inversion.** White icons/title, `rgba(255,255,255,0.14/0.22/0.35)` icon and avatar chips, `headerTintColor '#fff'`, `#0A2540` tinted shadow, `borderBottomWidth: 0`. On white: chips invisible, icons invisible, no separation from a white page. Needs charcoal content, grey chips (`#E9E9E9`-ish), a 1 px bottom divider, and the red badge's border (`borderColor: headerBg`) re-checked. `headerBg` default prop is static `DEFAULT_PALETTE.primary`. |
| 3.3 | `src/components/ActionPaneContainer.js` | 797, 851-869 | Passes `headerBg: T.blue` → becomes `'#FFFFFF'`/token; FAB `T.blue` + white `+` → charcoal `+` on mustard (8.9:1 ✓). |
| 3.4 | `src/Navigation/DrawerNavigator.js` | 30-95, 105-236, 485-502 | Drawer header is primary bg with white text/avatar; active drawer item is primary bg with white text/icon; stack `screenOptions.headerStyle` is a second app-bar definition (primary bg, white title/tint, `elevation: 0`, `shadowColor: 'transparent'`). All three need the same inversion decisions as 3.1/3.2. |
| 3.5 | **Status bar** | `LoginScreen.js:550`, `QRSetupScreen.js:892`, `ConfigSelectionScreen.js:238`, `HrNewsUpdatesScreen.js:162`, `QuickAccessSheet.js:179`, `AttendanceManagement/Screen/*` (own handling), `MainPageHeader.js:77`, `DrawerNavigator.js:484` | There is **no app-level `<StatusBar>`** for the post-login shell. Login mounts `dark-content` + `backgroundColor #FFFFFF` and navigates with `navigate()` (stays mounted), so post-login status-bar style is emergent. `QuickAccessSheet` explicitly sets `light-content` over `T.blue`. Android reserves the strip via `headerStatusBarHeight: insets.top` (comment says "edge-to-edge"). **UNVERIFIED at runtime** which style actually shows over the blue header today. For a white app bar the correct state is `dark-content` on both platforms; iOS has `UIViewControllerBasedStatusBarAppearance=false` (`Info.plist:142`), so RN's `StatusBar` controls it. Recommend one explicit `<StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />` policy at shell level and removal of the per-screen overrides. |
| 3.6 | **`onPrimary` adoption** (≥54 sites, 25 files) | see §E.1 list | Every `backgroundColor: P.primary` + `iconColor: '#fff'` pairing in the 17 list pages (`LeaveRequestListPage.js:394-418` pattern ×3 per page), `QuickAccessSheet.js:48-52`, `IdentificationInfoModal.js:411-414`, `ESSEmployeeTaskDetail.js:169-170`, `HrPoliciesScreen.js:117-118`, `OvertimePlanner_Create.js:807-811`, `PurchaseOrderListPage.js:123-124`, `WorkItemAssignedToMe.js:535-536`; plus cross-file pairings where the bg is a `styles.js` key and the text is another key (`SRBtn_SubmitButton`/`SRBtn_SubmitButtonText`, `Alert_OkButton`/text, `DAM_saveButton`/`DAM_saveButtonText`, `SB_saveButton` with `ActivityIndicator color="#FFFFFF"` in `SaveButton.js:9`, `CalModal_header`, `notif_MarkReadButton`…). Not a find/replace: `styles.js` cannot call hooks, so either styles move into `getDSRStyles(tokens)`/`makeStyles(P)` factories, or `onPrimary` is threaded through inline overrides. |
| 3.7 | **Status-colour semantic collision** | `ActionPaneContainer.js:57-112` (`PILL_COLORS`), `DynamicRequestCard.js:44-73` (`getStatusColors`), `WorkflowHistoryListPage.js:212-296` (`getStatusConfig`), `EmployeeAdvancesList.js:93-122` (`StatusBadge`), `EmployeeAdjustmentLineDetails.js:201-215`, `NotificationPanel.js:39-50,85-115`, `Tokens.js:79-80` (`amber/amberBg`), `Attendancecalendargrid.js:39-46`, `DFAttendanceCalendarScreen.js:79-88`, `CustomTabBar.js:17` | Amber `#F59E0B` (+ `#FEF3C7` bg, `#92400E`/`#B45309`/`#D97706`/`#F57F17` text) currently means **Pending / In review / Pending Approval / Assigned / Unposted**. Mustard `#F4B400` vs `#F59E0B` = 1.16:1; mustard's derived tint `#FEF6E0` vs `amberBg #FEF3C7` = near-identical. After the change, the **"All"** pill (primary) and the **"Pending"** pill (amber) become indistinguishable, a selected row (tint) looks like a pending row, and the tab-bar badge (`#D9A404`) looks like the active indicator. Requires a decision: recolour the pending/in-review family (e.g. to orange-red or blue-grey) or make the primary non-semantic. Also `Approved` in `EmployeeAdvancesList.js:97` is blue `#1565C0` today — pick green or neutral. |
| 3.8 | `src/components/MainDashboard/QuickAccessSheet.js` | 48-52, 147, 179, 221 | Full-height sheet with primary header, `StatusBar light-content`, white text; comment says "brand blue — intentionally static". Same inversion + status-bar decision as 3.2. |
| 3.9 | `src/components/PageHeader/NotificationPanel.js` | 39-50, 85-115, 139, 283, 395, 466, 536, 546 | Local token factory mixes `DEFAULT_PALETTE.primary` (static) with `AT.*` (dynamic) and hardcodes `#3B82F6`, `#E8F1FB`, `#10B981`, `#F59E0B`; `statusBarTranslucent` modal with `StatusBar.currentHeight` padding; `tintColor={P.primary}` on refresh control. |
| 3.10 | `src/components/AIChatbot/AIChatbot.js` + `AIChatModal.js` + `AIFloatingButton.js` | `AIChatbot.js:76,113,596,660,777,822`; `AIChatModal.js:29-43,380-503`; `AIFloatingButton.js:72` | Gradients interpolate `P.primary` → hardcoded navy; with mustard primary they become mustard→navy. Needs a redesigned gradient/solid, white-on-primary text fixed. |
| 3.11 | `src/components/AttendanceManagement/**` (14 files) + `theme.js` | token file `:18-131`; `HomeScreen.js:343-396` (4 `StatusBar` variants), `TimeClockScreen.js:1364`, `ConfirmSheet.js:57`, `AttendanceRecordsScreen.js:785` | Separate design system with its own blue, light/dark pairs, and its own status-bar handling. Decide: fold into the app palette (structural) or re-token in isolation (Bucket 2f). Either way its `amber`/`amberDark`/`accentAmber` (`#F59E0B`,`#D97706`,`#B45309`) hit the same collision as 3.7. |
| 3.12 | **Neutral tokens vs. mockup** | `Tokens.js:5-33`, `colors.js:31-57`, `theme.js:45-57,103-116` | Mockup wants white page background; today pages are `#F1F5F9`/`#F5F7FA` with white cards — the card/page contrast disappears on white-on-white, so cards need borders/shadows (`#E9E9E9`) to remain legible. That is a layout/elevation decision, not a token value. `CustomTabBar.js:180` dark-mode sniffing on `pageBg` must be replaced with `isDark`. |
| 3.13 | **Dark mode** | `colors.js:59-84`, `Tokens.js:38-66`, `theme.js:60-100,118-131` | Not addressed by the mockup. Mustard on `#0F172A` is 9.9:1 (fine), but the dark primaries are currently purple (`#BB86FC`) and bright blue (`#3B6FFF`); `useTheme` and `useAppTokens` disagree. Needs a decision before any token consolidation. |
| 3.14 | **Pre-login screens** | `LoginScreen.js`, `Setup/QRSetupScreen.js`, `Setup/ConfigSelectionScreen.js`, `SplashScreens.js` | Cannot be server-driven (palette fetched post-login; `RESET_APP_STATE` wipes the persisted copy at login start). Must use compile-time brand tokens → `DEFAULT_PALETTE` becomes the *real* source of truth for these, so it must change in code regardless of what D365 sends. |

### Bucket 4 — native / config files

| File | Lines | What | Note |
|---|---|---|---|
| `android/app/src/main/res/values/styles.xml` | 9, 11 | `colorPrimary`, `colorAccent` = `#0A66C2` — DatePicker/TimePicker dialogs, OK/CANCEL, ripple; `colorPrimaryDark` commented out (`:10`) | Only native colour source; no `colors.xml` exists |
| `android/app/src/main/res/values/styles.xml` | 4 | `Theme.AppCompat.DayNight.NoActionBar` — no `windowLightStatusBar`, no `statusBarColor`, no `navigationBarColor` | Status/navigation bar colours therefore come from RN `<StatusBar>` at runtime (see 3.5). A white app bar with default (light) status icons on Android would be unreadable if the JS layer forgets to set `dark-content` |
| `android/app/src/main/java/com/dynaface365/attendance/AttendanceForegroundService.java` | 122-123 | `.setColor(0xFF0A66C2).setColorized(true)` — the persistent clock-in notification is painted solid blue | Mustard with `setColorized(true)` paints the whole notification mustard; verify white system text on it |
| `android/app/src/main/java/com/dynaface365/MyFirebaseMessagingService.java` | 85 | `.setSmallIcon(R.drawable.notification_icon)`; **no `.setColor`** — accent falls back to system default | Add accent when theming; `AndroidManifest.xml` has no `com.google.firebase.messaging.default_notification_color` meta-data |
| `android/app/src/main/res/drawable/notification_icon.xml` | 9 | Vector, `fillColor #FFFFFF` — tinted by system; OK | No change |
| `android/app/src/main/res/mipmap-*/ic_launcher*.png` | — | Launcher icons: **orange/charcoal on white, not blue** (inspected `xxxhdpi`). No adaptive-icon XML (`mipmap-anydpi-v26` absent) → no background colour resource to change | No change for palette; consider adaptive icon separately |
| `android/app/src/main/AndroidManifest.xml` | 31-37 | `android:theme="@style/AppTheme"`; no splash theme, no notification colour meta-data | — |
| **Splash (Android)** | — | `react-native-splash-screen` is linked in `build.gradle:132` but **never called** in JS (`SplashScreen.show/hide` absent) and there is no `launch_screen.xml`/drawable → native splash is the default white window; the branded splash is the JS `SplashScreens.js` with `assets/IDAPSplash.jpg` | No blue involved |
| `ios/Authentication/LaunchScreen.storyboard` | 19 | `systemBackgroundColor` (white), empty subviews | No change |
| `ios/Authentication/Info.plist` | 142-143 | `UIViewControllerBasedStatusBarAppearance = false` → RN `StatusBar` governs; no `UIStatusBarStyle` key, no `UIUserInterfaceStyle` (follows system dark mode — see 3.13) | Behaviour depends on 3.5 |
| `ios/Authentication/AppDelegate.mm` | — | No colour/status-bar code | — |
| `ios/Authentication/Images.xcassets/AppIcon.appiconset/*` | — | Same orange/charcoal icon | No change |
| `app.json` | 1-4 | `{name, displayName}` only — no Expo `splash`/`backgroundColor`/`primaryColor`; no `app.config.js` | Nothing to change |
| `src/Controller/notificationService.js` | 363, 405, 429 | `color: '#0A66C2'` on local (download) notifications | Bucket 2b, listed here for completeness |

### Bucket 5 — assets

All under `src/assets/`. **Baked** = pixels can't be re-themed; **runtime-tinted** = colour comes from code.

| Asset | Used by | Colour content | Verdict |
|---|---|---|---|
| `IDAPSplash.jpg` | `SplashScreens.js:307` | Orange `#F58220`-ish + charcoal/grey, construction photo, **no blue** | Baked — **already matches the new direction**; only question is orange vs mustard (see §E) |
| `IDAPNewLogo.jpg` | `LoginScreen.js:590` | Orange "IDAP" + grey "360" on white | Baked — no change needed |
| `IDAPNewLogoNOBG.png` | `DrawerNavigator.js:140` (on the primary drawer header) | Same, transparent bg | Baked — fine on white/mustard; check on charcoal |
| `IDAPLogoForSiteSurveyReport.png` | `TravelRequisitionSiteSurveyReport.js:53` | Not inspected; same logo family (UNVERIFIED) | Likely fine |
| `Maindashboard/dashboard.png` | `screenMapping.js:188` (`MainDashboard` tile) | **Solid blue** `#1E88E5`/`#2196F3`-style grid glyph | Baked blue — replace |
| `Maindashboard/calendar.png` (+ root `calendar.png`) | Leaves tiles, `useMenuBuilder.js:78` fallback, `DisplayListPage.js:110` | **Blue** outline calendar | Baked blue — replace |
| `Maindashboard/helpDesk.png` | HR help desk tile | Charcoal + **blue** headset | Baked blue — replace |
| `Maindashboard/signing.png` | Advances list tile | Cream/brown with **blue** pen cap | Baked (minor blue) |
| `Maindashboard/payment.png`, `Expense.png`, `certificate.png`, `policies.png`, `news.png`, `Loan.png`, `PurchaseRequisition.png`, `EOSRequestNew.png`, `justice.png`, `loan-approved.png` | dashboard tiles | Multi-colour stock flat icons (red, teal, pink, yellow, purple…) — inconsistent styles from ≥3 icon packs | Baked, not blue — but they clash with any single-hue brand; consider replacing the set with Lucide vectors (already used for 5 IDAP tiles) |
| `Maindashboard/attendance.png`, `image.png`, `EmploymentCertificate.png`, `IDAPLOGO.jpeg`, `userLogo.jpg`, `cloud-mini.png`, `DrawerNavigator/*.jpg|png` | **unreferenced** (0 importers) | — | Dead assets; ignore |
| `Certificate/pdf.png`, `doc.png`, `file.png` | `EmploymentCertificate/utils.js:9-13` | File-type glyphs (PDF red, DOC Word-blue) | Baked but semantically file-type, not brand — keep |
| `google.png`, `microsoft.png` | `LoginScreen.js:610,624` | Third-party logos | Keep |
| `cloud.png` | `RequestForRegistration.js:94` (retired route) | Maison Consulting logo (orange) | Dead |
| `immigration.png`, `machine.png`, `OJ91AO0.jpg` | attendance screen tiles | Not inspected (UNVERIFIED) | Check if those tiles are reachable |

**Runtime-tinted vectors (follow code, no asset work):** Lucide icons for `DFEmployeeLeaveRequestListPage`, `MedicalExpenseManagmentListPage`, `TravelRequisitionListPage`, `ExpenseManagementHeaderListPage`, `DFAttendanceCalendarScreen` (`screenMapping.js:216-220`, coloured with `P.primary` in `MenuCard.js:60`); all `react-native-vector-icons` glyphs; `notification_icon.xml`. `tintColor` on `<Image>`/`RefreshControl` at `NotificationPanel.js:466`, `OutstandingAdvancesScreen.js:814`, `ChangeProfileImage.js:254` (dynamic), `WorkItemAssigned.js:90` (`#2e6dd8` hardcoded), `HrNewsUpdatesScreen.js:185` and `styles.js:2783` (`#6366F1` hardcoded).

Note on brand consistency: the logo/splash orange is visibly **more red-orange than `#F4B400`**. UNVERIFIED which is canonical; if the mockup's mustard is the brand, the logo family should be re-exported too.

---

## E. Risks and open questions (ranked)

1. **WCAG failure on every primary surface — white on `#F4B400` = 1.85:1** (AA needs 4.5:1 text / 3:1 UI). Charcoal on mustard is 8.93:1 ✓. `onPrimary` is the fix but is consumed at only 16 sites; hardcoded white appears in ≥54 same-file pairings (25 files, list below) and in cross-file `styles.js` pairs. Screens affected if the server flips primary today: **all 17 list pages** (Leave, Expense ×3, Travel ×2, EOS, HR Help Desk, Purchase Req/Order, Advances, Bank/Family/Contact/Education/Identification lists, IDAP Medical/Expense/Travel), Dashboard app bar + drawer + tab bar, Quick Access sheet, Section headers (personal info), Notification panel header, every form's Submit button, Alert OK, calendar modal header, attachment/receipt Save, ID/Contact edit circles, org chart, workflow comment modal, task detail, overtime planner, HR policies, work items, site-survey bar, AI chat bubbles/float. Same-file list: `ExpenseManagementHeaderListPage.js:317-340`, `MedicalExpenseManagmentListPage.js:351-374`, `ExpenseManagementLinesListPage.js:650-673`, `TravelRequisitionListPage.js:340-363`, `GenericAdvanceListScreen.js:613-636`, `EmployeeEOSRequest_ListPage.js:204-227`, `ExpenseManagmentLinesListPage.js:289-312`, `HRHelpDeskList_Screen.js:484-507`, `LeaveRequestListPage.js:394-418`, `IdentificationNumberListPage.js:367-393`, `PersonalEducationListPage.js:303-327`, `PurchaseRequisitionListPage.js:152-175`, `TravelRequisitionLinesListPage.js:474-486`, `ExpenseManagmentListPage.js:273-285`, `BankAccountListPage.js:254-266`, `FamilyContact_ListPage.js:218-230`, `ContactDetailsListPage.js:205-215`, `QuickAccessSheet.js:48-52`, `IdentificationInfoModal.js:411-414`, `ESSEmployeeTaskDetail.js:169-170`, `HrPoliciesScreen.js:117-118`, `OvertimePlanner_Create.js:807-811`, `PurchaseOrderListPage.js:123-124`, `WorkItemAssignedToMe.js:535-536`, `styles.js:7480-7483`.

2. **Status-colour semantic collision.** Amber already means *Pending / In review / Pending Approval / Assigned / Unposted* in five independent maps (§D 3.7). Mustard primary vs amber = 1.16:1; mustard tint vs amberBg ≈ identical; tab badge `#D9A404` vs mustard = 1.23:1. The "All" pill and "Pending" pill will read as the same state. Decision needed before implementation: (a) recolour the pending family, or (b) reserve mustard for chrome only and pick a different "selected/active" colour, or (c) both.

3. **Mustard on white for thin elements fails the 3:1 non-text minimum (1.85:1).** Affected: tab-bar `borderTopColor: P.primary` (`CustomTabBar.js:210`), 1-1.5 px `borderColor: DEFAULT_PALETTE.primary` on cards/avatars/buttons (`styles.js:1420,1443,3423,3653,4159,4731,5089,5464,5617,5634,7567,7580,7675,7728,7741,8023,8309`), `borderLeftColor` accents (`:2573,3934,6975,7600`), `borderBottomColor` filter underlines (`:6721,7047`), primary-coloured text links (`SRBtn_ButtonText :5650`, `DRC_TextButtonText :5473`, `CD_SelectedCompanyName :4246`, `formHeaderText :6981`, `DH_positionText :8375`, `orgStyles_rootRole :7763`), radio dots, small icons, spinners (`ActivityIndicator color={P.primary}`), switch tracks (`trackColor true: '#0A66C2'`), disabled states derived from primary. Mustard on `#F1F5F9` is 1.69:1. Charcoal or a darker mustard (e.g. ≥ `#9A6F00` for text) is required for anything thinner than ~3 px or any text.

4. **White tab bar / app bar are structural** (§D 3.1–3.4, 3.8): white pill gradient, `rgba(255,255,255,·)` wells and chips, white labels, `headerTintColor`, `elevation: 0` + `shadowColor: 'transparent'` on the drawer header, and the drawer header's white-on-primary block. The active tab needs a new visual (indicator/underline exists at `CustomTabBar.js:280-289` but is coloured with `activeLabelColor = P.onPrimary`). White-on-white page/app-bar separation needs a divider or elevation.

5. **Status bar policy is emergent, not designed** (§D 3.5). No shell-level `<StatusBar>`; Login's `dark-content/#FFFFFF` may or may not persist; `QuickAccessSheet` forces `light-content`; Android theme sets nothing. **UNVERIFIED** what a user sees today over the blue bar. A white app bar makes `dark-content` mandatory and any lingering `light-content` an invisible status bar.

6. **`styles.js` freezes the palette at import** — 87 keys + 12 `AppTokens` keys. Any palette approach (server or code) is blind to them until they move into a factory (`getDSRStyles` pattern already exists at `:9113`) or get inline overrides. This is the single biggest reason the answer to "would it change by itself" is "no".

7. **Three brand-blue sources with drift.** `#0A66C2` (app), `#1B4FD8`/`#3B6FFF` (attendance), `#1A56DB` (chatbot) plus `#1565C0`/`#1566C1`-class near-duplicates: 34 distinct saturated mid-blues, 95 distinct blue-family values, 401 distinct hex values overall in 2,797 literals. The palette has drifted; a swap must be a *consolidation* or the drift simply becomes yellow drift.

8. **Pre-login screens can never follow D365** (login, QR, config, splash) — `DEFAULT_PALETTE` must change in code. Also `RESET_APP_STATE` wipes the persisted palette on cold start/login, so the first frames after login (before `RetrieveFirstOnly` resolves) render with `DEFAULT_PALETTE` → a visible blue→mustard flash unless the default is changed too.

9. **Server contract is too narrow.** Only `PrimaryColor`, `OnPrimary`, `SelectionColor` (unused). Text, secondary, divider, background cannot be tenant-driven without extending `DFColorPaletteContract` and the slice. **Open question for D365:** is the intent that tenants control the whole palette, or only the accent? That decides whether the neutrals are code tokens or server fields.

10. **Dark mode undecided** — two hooks disagree (`useTheme` purple vs `useAppTokens` blue), attendance has its own dark pair, and `CustomTabBar` sniffs dark mode by comparing `pageBg` to `'#0F172A'`. Changing `LightTokens.pageBg` to white is safe for that check, but any future dark token change breaks it silently.

11. **Foreground-service notification is `setColorized(true)` blue** — mustard colorized notifications with white system text may be unreadable on some OEM skins; test on device. FCM notifications have no accent at all today.

12. **Logo orange ≠ mustard.** Splash, login logo, drawer logo, launcher icon use a red-orange. If `#F4B400` is canonical the assets need re-export; if the orange is canonical the mockup hex should change. UNVERIFIED which.

13. **Light-blue list-card gradient** (17 files) and `activeColor="#E6F0FF"` (31) are decorative but ubiquitous; leaving them makes every list page half-blue.

14. **Dead/misleading code that will confuse the work:** `AppComponentsDesign/Index.js` (duplicate tokens, 0 importers); `COLOR_PALETTE` import from `react-native` (always `undefined`); `selection` palette field never read; `[PALETTE-DEBUG]` logs in `RetrieveFirstOnly.js`, `LoginScreen.js`, `usePalette.js`; `AppTokens` comment in `Appcomponents.js:36-45` documents hardcoded `#0A66C2`.

15. **Tests** reference palette shapes only (`__tests__/store/logoutPaths.test.js:187`, `reset.test.js:35`); no snapshot tests will break, but nothing guards contrast either.

---

## F. Recommended sequencing (if you proceed) — phases, not steps

**Phase 0 — Decisions (no code).** Resolve §E 2, 9, 10, 12: pending-status colour, server vs code ownership of neutrals, dark-mode stance, canonical brand hue. Confirm with D365 what `retrieveFirstOnly` returns today (UNVERIFIED) and whether `OnPrimary` will be populated.

**Phase 1 — Make the palette actually flow.** Consolidate to one token source (extend `colorPaletteSlice`/`usePalette` with `onPrimary`, `text`, `secondary`, `divider`, `background`, `tint`; make `useAppTokens` the only bridge). Convert `styles.js` primary-bearing keys into a `makeStyles(P)` factory or inline overrides; delete `Index.js`; retire `AppTokens.blue*` static usage; fix `theme/colors.js` and `NotificationPanel` static reads; change `DEFAULT_PALETTE` for pre-login. Deliverable: flipping one hex (server or default) recolours 100 % of app-brand surfaces. Still blue-looking, but now provably single-sourced.

**Phase 2 — Contrast and semantics.** Adopt `onPrimary` everywhere primary is a background (Bucket 3.6); introduce a `primaryText`/`primaryStrong` token for text/borders on light backgrounds (§E 3); re-semanticise the five status maps (§D 3.7) and the tab badge. Ship behind the *existing* blue so it is a no-visual-change refactor with the new rules already enforced.

**Phase 3 — Surface inversion.** Tab bar, app bar (both definitions), drawer header, Quick Access sheet, notification panel header; one shell-level status-bar policy; white page background with card borders/elevation. This is the phase where the app first *looks* different. QA on Android (edge-to-edge + notch) and iOS.

**Phase 4 — Legacy blue sweep.** Attendance Management tokens (decide fold-in vs isolate), legacy attendance Material blues, AI chatbot, list-card gradients, dropdown `activeColor`, isolated accents (Bucket 2d–2h). Mechanical, parallelisable, low risk per file, high file count.

**Phase 5 — Native, notifications, assets.** `styles.xml`, foreground-service and FCM notification accents, adaptive icon (optional), dashboard PNG icon set → Lucide vectors, logo/splash re-export if Phase 0 chose mustard.

**Phase 6 — Verification.** Automated contrast check over the token table (the WCAG function in Appendix B is enough), a grep gate in CI that fails on new raw blue/white-on-primary literals, screenshot pass across the ~60 screens in light and (if kept) dark mode.

---

## Appendix A — Per-file colour inventory

Scan of 535 JS/TS files (`src/`, `App.js`, `index.js`; `node_modules` excluded). Comment-only lines excluded from "live" counts.

**Totals (live):** 2,797 hex literals in 161 files · 401 distinct hex (399 distinct 6-digit bases) · 171 `rgb()/rgba()` · 58 named colours (`transparent` 27, `white` 18, `grey` 11, `black` 2) · 192 `shadowColor` props (111× `'#000'`, 18× `T.shadowColor`, 10× `'#0F172A'`, 7× `'#6366F1'`, 6× `'#0A66C2'`, 5× `DEFAULT_PALETTE.primary`…) · 214 `elevation` props (values 0–99, 40× `2`, 26× `3`, 25× `4`). Plus 71 hex literals on commented-out lines.

**Blue family** (hue 195–250°, sat ≥ 0.35): 95 distinct values, 503 occurrences. **Saturated mid-blues that function as "primary"** (lum 0.30–0.60): 34 distinct — `#0A66C2`(59) `#1E88E5`(19) `#2196F3`(19) `#2563EB`(11) `#0EA5E9`(9) `#1A56DB`(8) `#007AFF`(8) `#007BFF`(6) `#0765A2`(5) `#3B82F6`(5) `#0369A1`(4) `#1B4FD8`(3) `#38BDF8`(3) `#2E6DD8`(3) `#0066CC`(3) `#1340B8`(2) `#4A90E2`(2) `#1565C0`(2) `#1877F2`(2) `#0275D8`(2) `#2A4A7F`(2) `#0A6CB5`(2) `#3D95ED`(2) `#0D47A1` `#0277BD` `#0288D1` `#4F46E5` `#04739C` `#0078D4` `#3D6CB5` `#08539D` `#0C5298` `#084C94` `#004AAD` `#0000FF`. Near-duplicate pairs that signal drift: `#0A66C2`/`#0A6CB5`/`#0C5298`/`#084C94`/`#08539D`/`#0066CC`/`#054A8C`; `#1E88E5`/`#2196F3`/`#1877F2`/`#3D95ED`; `#2563EB`/`#1A56DB`/`#1B4FD8`/`#2E6DD8`/`#1340B8`; `#007AFF`/`#007BFF`/`#0078D4`/`#0275D8`; tints `#E6F0FF`/`#E8F1FB`/`#E8F0FE`/`#EBF3FB`/`#EBF5FF`/`#EBF4FF`/`#E8F3FF`/`#E6F2FF`/`#EAF2FB`/`#E3F0FB`/`#E3F2FD`/`#EFF6FF`/`#EEF2FF`/`#EEF3FF`.

Top hex overall: `#FFFFFF` 529 · `#000000` 149 · `#888888` 62 · `#1A1A1A` 62 · `#0A66C2` 59 · `#BDBDBD` 45 · `#666666` 40 · `#E0E0E0` 40 · `#0F172A` 39 · `#333333` 36 · `#F0F0F0` 35 · `#94A3B8` 34 · `#64748B` 34 · `#F1F5F9` 33 · `#999999` 32 · `#E6F0FF` 31 · `#1E293B` 30 · `#6B7280` 28 · `#6366F1` 26 · `#757575` 26.

Per-file table (sorted by hex count; "Hex literal lines" truncated for the largest files — regenerate with Appendix B for the full list):

| # | File | hex | rgb() | named | shadowColor | elevation | blue-family hex (n / distinct) | Paints | Hex literal lines |
|---|------|----:|------:|------:|------------:|----------:|-------------------------------|--------|-------------------|
| 1 | `src/styles/styles.js` | 770 | 59 | 20 | 103 | 113 | 108 / 32: #EEF2FF #0A66C2 #EAF2FB #BED8F6 #DCE6F5 #111827 … | Global StyleSheet — buttons, headers, tab bar, cards, modals, org chart, forms (static; 87× DEFAULT_PALETTE.primary) | 33, 37, 47, 61, 68, 77, 83, 89, 96, 107, 136, 146, 162, 171, 180, 212, 214, 218, 231, 233, 237, 256, 263, 284, 287-288, 296, 317, 326, 334, 341, 364, 380, 386, 403, 413, 415-416, 429, 440, 445, 455, 459-460, 469-470, 477, 487, 510, 517, 523, 529, 544, 548, 566 … (770 total) |
| 2 | `src/components/AttendanceManagement/theme.js` | 84 | 0 | 0 | 4 | 4 | 24 / 12: #1B4FD8 #EEF3FF #3B6FFF #1340B8 #F0F4F8 #0F172A … | Attendance Management design tokens (independent blue #1B4FD8, light+dark) | 20-23, 26-28, 31-34, 36-39, 41-43, 46-50, 53-57, 62-65, 68-70, 73-76, 78-81, 83-85, 88-92, 95-99, 104-115, 119-130, 147, 154, 161, 168 |
| 3 | `src/components/AppComponentsDesign/Tokens.js` | 63 | 2 | 0 | 2 | 1 | 14 / 7: #F1F5F9 #0F172A #E8F1FB #1A2744 #17223A #6366F1 … | App design tokens light/dark + BrandTokens (blueBg #E8F1FB, amber, green, red…) | 6-18, 21-30, 32, 39-51, 54-63, 65, 74-88 |
| 4 | `src/Customizations/IDAP/screens/AttendanceCalendar/DFAttendanceCalendarScreen.js` | 50 | 0 | 3 | 3 | 3 | 8 / 8: #1565C0 #0D47A1 #E8F0FE #4FC3F7 #0277BD #E1F5FE … | Attendance calendar — STATUS_COLORS, day cells | 70-71, 80-84, 88, 113, 354, 359, 480-481, 528, 551, 566, 576, 610, 694, 696-697, 723, 737, 743, 751, 809, 818, 840, 854, 860, 867, 888, 907, 945, 952, 967, 974 |
| 5 | `src/screens/Attendance/AttendanceCalendarScreen.js` | 50 | 1 | 0 | 2 | 2 | 11 / 2: #0EA5E9 #0F172A | Legacy attendance screens — Material blue #1E88E5/#2196F3/#007AFF | 29, 33, 43, 45, 471, 482, 519, 566-574, 892, 895, 901-902, 917-918, 924, 933, 935, 945, 964, 966-972, 981, 993, 995, 997, 1016, 1018, 1022, 1040, 1043, 1046, 1049, 1052, 1057, 1060, 1071 |
| 6 | `src/screens/Setup/QRSetupScreen.js` | 47 | 4 | 0 | 3 | 3 | 18 / 7: #0A66C2 #0F172A #08539D #F1F5F9 #38BDF8 #E0EEFF … | QR / config setup (pre-palette) — brand #0A66C2 buttons, cards | 892, 903, 916, 924, 926, 985, 1002, 1010, 1041, 1043, 1063, 1103, 1115, 1122, 1146, 1153, 1164, 1166-1167, 1177, 1191, 1226-1227, 1237, 1242, 1253, 1267, 1283, 1285, 1291, 1293, 1302, 1305, 1314, 1323, 1325, 1330, 1339, 1348, 1356, 1361, 1371, 1374, 1379, 1382 |
| 7 | `src/screens/WorkflowHistory/WorkflowHistoryListPage.js` | 47 | 0 | 0 | 1 | 1 | 7 / 6: #2563EB #EFF6FF #BFDBFE #0F172A #38BDF8 #0369A1 | Workflow timeline — getStatusConfig map (own hex per status) | 217-219, 225-227, 233-235, 241-243, 249-251, 257-259, 265-267, 273-275, 281-283, 289-291, 456, 470, 474, 482, 522, 526, 543, 576, 582, 598, 604, 609, 613, 619, 624, 629, 635 |
| 8 | `src/theme/colors.js` | 43 | 2 | 0 | 0 | 0 | 1 / 1: #111827 | useTheme() light/dark tokens (NavigationContainer theme, Settings switches) | 35-53, 55-56, 61-80, 82-83 |
| 9 | `src/components/PurchaseRequisition/PRHeaderList.js` | 41 | 0 | 1 | 2 | 2 | 3 / 1: #2196F3 | PR header/lines lists — status, buttons | 115, 141, 155, 169, 189, 191, 193, 195-196, 199, 201, 203, 205-206, 215, 217, 219, 221-222, 237, 271, 274-275, 292, 295-296, 313, 316-317, 350-351, 357, 383, 390, 407, 433, 436, 442, 458, 463 |
| 10 | `src/screens/EmployeeAdvanceRequest/GenericAdvanceListScreen.js` | 40 | 2 | 0 | 3 | 3 | 4 / 3: #1877F2 #BDDEFF #CCE6FF | Screen — see file | 51-52, 613, 616, 624, 627, 635, 892-893, 906, 911-912, 920, 947, 955, 965, 980, 989, 993, 1015, 1028, 1043, 1060, 1080, 1095, 1114, 1116, 1122, 1136, 1141, 1147, 1213, 1218, 1227, 1245, 1249, 1257 |
| 11 | `src/screens/Setup/ConfigSelectionScreen.js` | 40 | 1 | 0 | 0 | 0 | 12 / 2: #0A66C2 #F1F5F9 | QR / config setup (pre-palette) — brand #0A66C2 buttons, cards | 185, 211, 221, 228, 247, 263, 283, 351, 358, 360, 366, 371, 374, 381, 386, 389-390, 398, 402, 404-406, 417, 422, 434, 439, 442, 449, 455, 463, 472, 480, 484, 486, 490, 498, 501, 506 |
| 12 | `src/screens/PurchaseRequisitionLines/PurchaseRequisitionLinesSaveRecord.js` | 39 | 0 | 0 | 0 | 0 | 12 / 2: #E6F0FF #0275D8 | Form / save-record screen — inputs, dropdown activeColor #E6F0FF, switches | 1033, 1063-1064, 1084, 1104, 1115, 1130, 1142, 1168, 1175, 1181, 1203-1204, 1239-1240, 1263, 1280-1281, 1320-1321, 1357-1358, 1394-1395, 1431-1432, 1460, 1474, 1488, 1502, 1524-1525, 1561-1562, 1594, 1599, 1607, 1612, 1614 |
| 13 | `src/screens/EmployeeAdvances/EmployeeAdvancesList.js` | 38 | 0 | 0 | 0 | 0 | 2 / 2: #E3F2FD #1565C0 | Advances list — StatusBadge maps (#1565C0 approved, #F57F17 pending) | 96, 98, 100, 102, 104, 111, 113, 115, 117, 119, 167, 182, 220, 241, 252, 262, 275, 298, 310, 322, 339, 512, 522, 557, 567, 578, 589 |
| 14 | `src/components/Attendance/AttendanceCalender.js` | 37 | 2 | 0 | 1 | 1 | 9 / 2: #0EA5E9 #0F172A | Legacy attendance screens — Material blue #1E88E5/#2196F3/#007AFF | 23, 27, 36, 38, 340, 405, 419, 498, 507, 512, 527-528, 577-585, 883, 895, 897, 899, 908, 910, 914, 930, 933, 936, 939, 942, 947, 950, 961 |
| 15 | `src/shared/SearchFilterBar.js` | 37 | 1 | 0 | 0 | 0 | 4 / 2: #E8F0FE #C5D8FB | Search + filter bar — active states | 261, 271, 293, 310, 374, 400, 468, 574, 578, 605, 619, 628, 646, 648, 664, 669, 672-673, 676-677, 692, 714, 718, 724, 728, 745, 748, 754, 771, 774, 780, 799, 808-809, 817, 821, 833 |
| 16 | `src/screens/Settings/OutlookCalendarScreen.js` | 36 | 2 | 0 | 4 | 4 | 13 / 8: #1A2E4A #2A4A7F #3D6CB5 #E8EFF9 #F2F5FC #0A6CB5 … | Settings / Outlook — local token object, switches | 43-45, 48-52, 54-56, 59-66, 69-73, 76-77, 81-86, 98, 105, 112, 1186 |
| 17 | `src/screens/Attendance/RosterDetailsScreen.js` | 35 | 1 | 2 | 0 | 2 | 3 / 1: #2196F3 | Legacy attendance screens — Material blue #1E88E5/#2196F3/#007AFF | 325, 327-328, 344, 349, 532, 554, 562, 574, 580, 595, 602, 611, 618, 630, 636, 647, 652, 667-668, 671, 683-684, 687, 704, 709, 712, 718, 722, 730, 734, 740, 746 |
| 18 | `src/screens/LoginScreen.js` | 34 | 1 | 0 | 2 | 2 | 12 / 5: #0A66C2 #0F172A #EFF6FF #F1F5F9 #E0E7FF | Login (pre-palette) — brand #0A66C2 buttons, links, StatusBar white/dark-content | 73, 94, 99, 104, 109, 115, 550, 571, 582, 649, 684, 692, 714, 722, 732, 749, 751, 761, 768, 780, 790, 795, 798, 804, 808, 811, 822, 827, 829, 835, 845, 860, 866, 885 |
| 19 | `src/screens/Profile/Preferences/DateSettings/DateFormatSettingsScreen.js` | 33 | 3 | 0 | 2 | 2 | 6 / 2: #EBF3FB #111827 | Profile / preferences — icon badges, switches, cards | 70, 112, 270, 280, 285, 296, 387, 400, 413, 433, 442, 447-448, 454, 460, 475, 480, 488, 493, 508, 518, 524, 542, 554, 556, 560, 568, 570, 573, 588, 590, 592, 595 |
| 20 | `src/components/AIChatbot/AIChatModal.js` | 31 | 3 | 0 | 3 | 3 | 7 / 5: #1A56DB #DDE3F0 #A0B4E8 #E8ECF4 #E8F0FE | AI chatbot — independent blue #1A56DB/#0765A2 header, bubbles, gradients | 30-42, 155, 300, 316, 342, 346, 358, 366, 371, 394-395, 406, 420, 431, 449, 456, 491, 510, 515 |
| 21 | `src/components/AIChatbot/AIChatbot.js` | 27 | 0 | 0 | 0 | 0 | 6 / 2: #0765A2 #054A8C | AI chatbot — independent blue #1A56DB/#0765A2 header, bubbles, gradients | 76, 78, 113, 115, 596, 598, 660, 667, 681, 743, 756, 779, 781-782, 788, 804, 824-825, 833-834, 843 |
| 22 | `src/components/AppComponentsDesign/Index.js` | 27 | 0 | 0 | 1 | 1 | 7 / 5: #F1F5F9 #0F172A #E8F1FB #6366F1 #EDEFFD | Duplicate/legacy token file (no importers found) | 15-26, 30-44 |
| 23 | `src/components/EmploymentCertificate/CertificateDetailsModal.js` | 27 | 1 | 0 | 5 | 3 | 4 / 2: #F1F5F9 #2563EB | Certificate cards/modals — #2563EB/#0369A1 accents | 96, 151, 156, 173, 180, 183, 190, 196, 200, 209, 218, 224, 236, 241, 245, 247-248, 254-255, 259, 273, 283-284, 291, 295, 300, 305 |
| 24 | `src/screens/Profile/PersonalInformation/FamilyContact/FamilyContact_SaveRecord.js` | 27 | 0 | 0 | 0 | 0 | 10 / 4: #E6F0FF #81B0FF #04739C #2196F3 | Form / save-record screen — inputs, dropdown activeColor #E6F0FF, switches | 657, 667, 677, 697, 717-718, 737-738, 760, 762, 770, 778, 807, 839, 846, 860, 863-864, 881, 884-885 |
| 25 | `src/components/PageHeader/NotificationPanel.js` | 26 | 9 | 1 | 2 | 2 | 4 / 2: #3B82F6 #E8F1FB | Notification side panel — header, type icon colours, read/unread | 45-47, 54, 64-65, 70-71, 76-77, 84-85, 90-91, 94, 98, 104, 111, 359, 413, 443, 568, 597, 679, 813 |
| 26 | `src/screens/HrNewsUpdates/HrNewsUpdatesScreen.js` | 26 | 3 | 0 | 0 | 0 | 8 / 3: #F1F5F9 #6366F1 #4F46E5 | Screen — see file | 49, 94, 117, 143, 146, 185, 247, 260, 293-295, 304, 319, 326, 330, 335, 340, 351, 354, 358, 363, 375, 380, 382 |
| 27 | `src/screens/Attendance/AttendanceDetailsScreen.js` | 25 | 5 | 3 | 1 | 3 | 3 / 2: #0E1521 #2196F3 | Legacy attendance screens — Material blue #1E88E5/#2196F3/#007AFF | 108, 131, 617, 680, 688, 700, 712, 718, 724, 736, 743, 754, 759, 774, 786-787, 790, 807, 815, 821, 839, 842, 859, 862 |
| 28 | `src/screens/Attendance/EmployeeAdjustmentScreen.js` | 25 | 0 | 1 | 0 | 4 | 3 / 2: #007AFF #2196F3 | Legacy attendance screens — Material blue #1E88E5/#2196F3/#007AFF | 363, 383, 397, 399, 421, 427, 435, 441, 447, 465, 472, 483, 492, 497, 501, 512, 519, 526-527, 530, 534, 553, 559, 565, 573 |
| 29 | `src/components/Attendance/AttendanceComponents.js` | 24 | 0 | 0 | 2 | 2 | 12 / 1: #1E88E5 | Legacy attendance screens — Material blue #1E88E5/#2196F3/#007AFF | 26, 32, 49, 58, 72, 97, 116, 133, 138-139, 159, 178, 190, 207, 211, 229, 238, 240, 242, 258, 261, 272 |
| 30 | `src/components/AttendanceManagement/Screen/AttendanceRecordsScreen.js` | 24 | 1 | 0 | 0 | 0 | 3 / 3: #EEF2F7 #1B4FD8 #0F172A | Component — see file | 33-53, 258, 641, 961 |
| 31 | `src/components/Attendance/EmployeeAdjustmentLineDetails.js` | 22 | 0 | 0 | 0 | 0 | 3 / 2: #2196F3 #90CAF9 | Legacy attendance screens — Material blue #1E88E5/#2196F3/#007AFF | 206, 209, 212, 214, 221, 337, 345, 356, 363, 367, 372, 387, 394, 400, 412, 419, 424, 434, 439, 444, 450, 453 |
| 32 | `src/components/MainDashboard/AttendanceSummary.js` | 22 | 0 | 0 | 3 | 3 | 2 / 1: #2196F3 | Component — see file | 52-54, 64-66, 259, 262, 274, 280, 285, 303, 323, 345, 360, 372, 386, 395, 403, 412, 417, 424 |
| 33 | `src/screens/OvertimePlanner/OvertimePlanner_Create.js` | 21 | 2 | 0 | 1 | 1 | — | Form / save-record screen — inputs, dropdown activeColor #E6F0FF, switches | 119, 252, 259, 266, 279, 291, 304, 312, 315, 338, 343, 355, 656, 678, 700, 731, 787-788, 799, 803, 811 |
| 34 | `src/components/MainDashboard/LeaveEntitlementProgress.js` | 20 | 0 | 0 | 0 | 0 | 3 / 2: #3F51B5 #2196F3 | Component — see file | 24-38, 43, 179, 251, 310, 338 |
| 35 | `src/Customizations/IDAP/screens/Leaves/DFEmployeeLeaveREquestSaveRecord.js` | 20 | 0 | 0 | 0 | 0 | 9 / 2: #0A66C2 #E6F0FF | Form / save-record screen — inputs, dropdown activeColor #E6F0FF, switches | 554, 593, 613, 625, 658, 682, 694, 715-716, 754, 768, 780, 798, 819, 856-857, 877 |
| 36 | `src/components/ActionPaneMenuModal.js` | 19 | 1 | 1 | 1 | 1 | 2 / 2: #6366F1 #EDEFFD | Header avatar menu — brand stripe, avatar circle | 108, 292, 319-320, 340-341, 353, 384, 401, 403, 425-426, 452, 456, 504, 595, 608, 635, 644 |
| 37 | `src/components/AttendanceManagement/Screen/ConfirmBreakScreen.js` | 18 | 0 | 0 | 0 | 0 | — | Component — see file | 90, 281, 284, 289, 292, 298, 302, 432, 434, 439, 441, 443, 448, 475, 477, 482-483 |
| 38 | `src/components/Attendance/AttendanceDetailsComponents.js` | 17 | 1 | 0 | 0 | 2 | 4 / 2: #1E88E5 #E3F2FD | Legacy attendance screens — Material blue #1E88E5/#2196F3/#007AFF | 15, 28, 49, 68, 73, 75, 144, 154, 156, 164, 170, 183, 185, 190, 195, 203-204 |
| 39 | `src/components/PersonalInformation/IdentificationInfoModal.js` | 17 | 1 | 4 | 0 | 1 | 1 / 1: #007BFF | Component — see file | 210, 229-230, 270-271, 290, 307, 359, 374, 381, 385, 392, 395, 404, 414, 421, 426 |
| 40 | `src/components/PurchaseRequisition/PRLinesList.js` | 17 | 0 | 0 | 2 | 2 | 3 / 2: #3B82F6 #0F172A | PR header/lines lists — status, buttons | 76, 111, 134-135, 144-145, 165, 167-168, 183, 190, 208, 216, 233, 237, 239 |
| 41 | `src/components/SearchBar.js` | 17 | 3 | 0 | 1 | 1 | 2 / 1: #F0F4F8 | Search + filter bar — active states | 150, 172, 186, 201, 249, 404, 408, 415, 423, 441, 448, 453, 457, 466, 469, 486, 501 |
| 42 | `src/Controller/CustomTabBar.js` | 17 | 4 | 1 | 1 | 1 | 8 / 2: #0F172A #93C5FD | Bottom tab bar — bg, active pill gradient, inactive rgba white, mustard badge | 17-18, 180-181, 186-188, 191, 195, 198, 200, 303, 351 |
| 43 | `src/Customizations/IDAP/screens/Leaves/DFEmployeeLeaveRequestListPage.js` | 17 | 0 | 0 | 1 | 1 | 6 / 3: #0A66C2 #BDDEFF #CCE6FF | List page — header icon buttons (bg P.primary + white icon), light-blue card gradient | 87, 113, 141, 154, 157, 986-987, 989, 997-998, 1008, 1047-1048, 1073 |
| 44 | `src/components/EmploymentCertificate/CertificateCard.js` | 14 | 0 | 0 | 1 | 1 | 7 / 5: #0F172A #F1F5F9 #E0F2FE #0369A1 #2563EB | Certificate cards/modals — #2563EB/#0369A1 accents | 75, 80-81, 105, 111, 116, 124, 134, 143-144, 146-147, 150-151 |
| 45 | `src/components/EmploymentCertificate/RequestedForDropdown.js` | 14 | 0 | 0 | 1 | 1 | 3 / 2: #E6F0FF #4A90E2 | Certificate cards/modals — #2563EB/#0369A1 accents | 32, 59, 64-65, 68, 72, 77, 82, 84-85, 95-96, 106, 109 |
| 46 | `src/Customizations/IDAP/screens/ExpenseManagement/Lines/ExpenseManagementLinesListPage.js` | 14 | 0 | 0 | 0 | 0 | — | List page — header icon buttons (bg P.primary + white icon), light-blue card gradient | 650, 653, 661, 664, 672, 741, 746, 749, 757, 759-760, 765, 770 |
| 47 | `src/components/Attendance/CreateEmployeeAdjustment.js` | 13 | 0 | 2 | 1 | 1 | 1 / 1: #007AFF | Legacy attendance screens — Material blue #1E88E5/#2196F3/#007AFF | 490-491, 499, 504, 512, 518, 533, 535, 540, 553, 560 |
| 48 | `src/components/MainDashboard/MenuGrid.js` | 13 | 0 | 0 | 0 | 0 | 3 / 3: #1A56DB #EBF1FD #E0F2FE | Dashboard grid / section headers | 29-41 |
| 49 | `src/screens/Attendance/CreateAttendanceScreen.js` | 13 | 0 | 0 | 0 | 2 | 3 / 1: #1E88E5 | Legacy attendance screens — Material blue #1E88E5/#2196F3/#007AFF | 1244, 1253, 1296, 1373, 1379, 1387, 1392, 1400, 1413, 1429, 1445, 1453, 1461 |
| 50 | `src/screens/EmployeeOpenCourse/ESSEmployeeCourse_ListPage.js` | 13 | 0 | 0 | 0 | 0 | 4 / 2: #BDDEFF #CCE6FF | List page — header icon buttons (bg P.primary + white icon), light-blue card gradient | 101, 110, 128, 213, 221, 224, 238 |
| 51 | `src/components/ActionPaneContainer.js` | 12 | 1 | 1 | 2 | 2 | — | Page shell — status PILL_COLORS map, FAB, sub-header, filter badge | 73, 79, 85, 91, 97, 103, 109, 408, 415, 514, 562, 894 |
| 52 | `src/components/Alert/ConfirmationAlert.js` | 12 | 0 | 0 | 0 | 0 | 1 / 1: #E3F2FD | Alert / confirmation modals — buttons, icon tints | 59, 63-65, 69-71, 75-77, 264-265 |
| 53 | `src/components/Attendance/DFCalendar.js` | 12 | 0 | 0 | 0 | 0 | 4 / 1: #007AFF | Legacy attendance screens — Material blue #1E88E5/#2196F3/#007AFF | 95-106 |
| 54 | `src/screens/Profile/PersonalInformation/PersonalContacts/ContactDetailsSaveRecord.js` | 12 | 0 | 0 | 0 | 0 | 5 / 3: #E6F0FF #81B0FF #2196F3 | Form / save-record screen — inputs, dropdown activeColor #E6F0FF, switches | 435, 451, 473, 486, 497-498, 507-508 |
| 55 | `src/screens/WorkItemsAssignedToMe/WorkItemAssigned.js` | 12 | 0 | 0 | 2 | 2 | 3 / 1: #2E6DD8 | Screen — see file | 89-90, 159, 162, 167, 172, 180, 184, 194, 198, 206, 218 |
| 56 | `src/screens/WorkItemsAssignedToMe/WorkItemAssignedToMe.js` | 12 | 0 | 0 | 2 | 2 | 4 / 3: #DBEAFE #EFF6FF #E0F2FE | Screen — see file | 535, 638-639, 721, 727, 798, 809, 1018 |
| 57 | `src/shared/DynamicAttachmentModal.js` | 12 | 0 | 0 | 0 | 0 | 1 / 1: #2563EB | Shared modals — attachment/receipt, save buttons | 890, 892, 899, 941, 946, 966, 971, 987, 992, 1007, 1012, 1046 |
| 58 | `src/components/DynamicRequestCard.js` | 11 | 0 | 0 | 3 | 3 | — | Generic list card — getStatusColors map, buttons, highlight | 47, 50, 62, 65, 68, 70, 95, 452, 750, 870, 1294 |
| 59 | `src/screens/OutstandingAdvances/OutstandingAdvancesScreen.js` | 11 | 5 | 0 | 1 | 1 | — | Screen — see file | 451, 465, 473, 497, 520, 530, 581, 620, 655, 849, 859 |
| 60 | `src/screens/Profile/PersonalInformation/PersonalEducation/PersonalEducationListPage.js` | 11 | 0 | 0 | 0 | 0 | 2 / 2: #BDDEFF #CCE6FF | List page — header icon buttons (bg P.primary + white icon), light-blue card gradient | 303, 307, 315, 318, 326, 329, 603-604 |
| 61 | `src/screens/Profile/Preferences/BiometricSettings/BiometricSettings.js` | 11 | 0 | 0 | 0 | 0 | 2 / 2: #0078D4 #007AFF | Profile / preferences — icon badges, switches, cards | 396, 501-503, 551, 591, 615, 653 |
| 62 | `src/components/Alert/AlertModal.js` | 10 | 0 | 0 | 0 | 0 | 1 / 1: #E3F2FD | Alert / confirmation modals — buttons, icon tints | 44, 48-50, 54-56, 60-62 |
| 63 | `src/components/Attendance/TimeFlicker.js` | 10 | 0 | 0 | 0 | 0 | 2 / 1: #0E1521 | Legacy attendance screens — Material blue #1E88E5/#2196F3/#007AFF | 92, 106, 110, 120, 124, 127, 155-156, 160 |
| 64 | `src/components/AttendanceManagement/FaceVerificationModal.js` | 10 | 10 | 4 | 0 | 0 | — | Component — see file | 182, 662, 672, 717, 728, 738, 745, 779, 842, 852 |
| 65 | `src/components/PersonalInformation/IdentificationDetailsSection.js` | 10 | 0 | 2 | 0 | 1 | 2 / 2: #BDDEFF #CCE6FF | Component — see file | 82, 88, 156, 187, 192, 208, 213, 220, 226, 247 |
| 66 | `src/screens/EmployeeEOSRequest/EmployeeEOSRequest_ListPage.js` | 10 | 0 | 0 | 0 | 0 | 2 / 2: #BDDEFF #CCE6FF | List page — header icon buttons (bg P.primary + white icon), light-blue card gradient | 204, 207, 215, 218, 226, 321-322 |
| 67 | `src/screens/HRHelpDeskRequest/HRHelpDeskList_Screen.js` | 10 | 0 | 0 | 0 | 0 | 2 / 2: #BDDEFF #CCE6FF | List page — header icon buttons (bg P.primary + white icon), light-blue card gradient | 484, 487, 495, 498, 506, 562-563 |
| 68 | `src/screens/Leaves/LeaveRequestListPage.js` | 10 | 0 | 0 | 0 | 0 | 2 / 2: #BDDEFF #CCE6FF | List page — header icon buttons (bg P.primary + white icon), light-blue card gradient | 394, 398, 406, 409, 417, 708-709 |
| 69 | `src/screens/Profile/PersonalInformation/Identification/IdentificationNumberListPage.js` | 10 | 0 | 0 | 0 | 0 | 2 / 2: #BDDEFF #CCE6FF | List page — header icon buttons (bg P.primary + white icon), light-blue card gradient | 367, 371, 379, 383, 392, 668-669 |
| 70 | `src/screens/Profile/Preferences/Preferences.js` | 10 | 0 | 0 | 2 | 2 | 3 / 3: #E0E7FF #EEF2FF #111827 | Profile / preferences — icon badges, switches, cards | 45, 90, 98, 106, 110, 119, 123, 132, 143, 147 |
| 71 | `src/screens/RequestForRegistration/RequestForRegistration.js` | 10 | 0 | 0 | 0 | 1 | — | Screen — see file | 101, 110, 131, 164, 186, 188, 191, 208, 223, 240 |
| 72 | `src/components/AttendanceManagement/ActionButtons.js` | 9 | 0 | 0 | 0 | 0 | — | Component — see file | 43, 65, 70, 73, 78, 81, 86, 89, 94 |
| 73 | `src/components/AttendanceManagement/QRScannerModal.js` | 9 | 12 | 1 | 0 | 0 | — | Component — see file | 408, 419, 429, 440, 460, 505, 523, 569, 592 |
| 74 | `src/components/PersonalInformation/ContactInfoModal.js` | 9 | 0 | 2 | 0 | 0 | — | Component — see file | 101, 127-128, 150-151, 162-163, 174-175 |
| 75 | `src/components/PurchaseRequisition/AlertSubmitModal.js` | 9 | 1 | 0 | 1 | 1 | 1 / 1: #1E88E5 | PR header/lines lists — status, buttons | 23, 57, 61, 73, 79, 92, 100, 106, 111 |
| 76 | `src/Navigation/DrawerNavigator.js` | 9 | 2 | 2 | 1 | 1 | — | Drawer header (primary bg, white text), active item, stack header options | 35, 42, 95, 152, 178, 208, 220, 500, 502 |
| 77 | `src/screens/EmployeeAdvanceRequest/EmployeeAdvanceSalary_Create.js` | 9 | 0 | 0 | 0 | 0 | — | Form / save-record screen — inputs, dropdown activeColor #E6F0FF, switches | 309, 343, 362, 401, 437-438, 449, 453, 461 |
| 78 | `src/screens/Profile/PersonalInformation/BankAccount/BankAccountListPage.js` | 9 | 0 | 0 | 0 | 0 | 2 / 2: #BDDEFF #CCE6FF | List page — header icon buttons (bg P.primary + white icon), light-blue card gradient | 254, 257, 265, 268, 458-459 |
| 79 | `src/components/AttendanceManagement/MapBackground.js` | 8 | 3 | 0 | 0 | 0 | — | Component — see file | 151, 242, 253, 259, 264, 273, 279 |
| 80 | `src/components/AttendanceManagement/StatusCard.js` | 8 | 0 | 0 | 1 | 1 | — | Component — see file | 57, 60, 71, 78, 81-84 |
| 81 | `src/components/IdentificationRequestCard.js` | 8 | 0 | 0 | 1 | 1 | 1 / 1: #E8F0FE | ID request card — gradient bg, primary buttons | 16-17, 111, 125, 165, 187 |
| 82 | `src/components/PageHeader/MainPageHeader.js` | 8 | 3 | 0 | 1 | 1 | 1 / 1: #0A2540 | App bar — white icons/title, rgba-white icon chips, red badge, #0A2540 shadow | 34, 51, 68, 86, 93, 123, 132, 151 |
| 83 | `src/Customizations/IDAP/screens/ExpenseManagement/Header/ExpenseManagementHeaderListPage.js` | 8 | 0 | 0 | 0 | 0 | 1 / 1: #DFF4FF | List page — header icon buttons (bg P.primary + white icon), light-blue card gradient | 317, 320, 328, 331, 339, 578 |
| 84 | `src/Customizations/IDAP/screens/ExpenseManagement/Header/MedicalExpenseManagmentListPage.js` | 8 | 0 | 0 | 0 | 0 | 1 / 1: #DFF4FF | List page — header icon buttons (bg P.primary + white icon), light-blue card gradient | 351, 354, 362, 365, 373, 639 |
| 85 | `src/Customizations/IDAP/screens/TravelRequisition/Header/TravelRequisitionListPage.js` | 8 | 0 | 0 | 0 | 0 | 1 / 1: #DFF4FF | List page — header icon buttons (bg P.primary + white icon), light-blue card gradient | 340, 343, 351, 354, 362, 575 |
| 86 | `src/screens/ExpenseManagment/Lines/ExpenseManagmentLinesListPage.js` | 8 | 0 | 0 | 0 | 0 | 2 / 2: #BDDEFF #CCE6FF | List page — header icon buttons (bg P.primary + white icon), light-blue card gradient | 289, 292, 300, 303, 311, 509 |
| 87 | `src/screens/PurchaseRequisition/PurchaseRequisitionListPage.js` | 8 | 0 | 0 | 0 | 0 | 1 / 1: #DFF4FF | List page — header icon buttons (bg P.primary + white icon), light-blue card gradient | 152, 155, 163, 166, 174, 585 |
| 88 | `src/shared/ReceiptDetailsModal.js` | 8 | 0 | 0 | 0 | 0 | 1 / 1: #2563EB | Shared modals — attachment/receipt, save buttons | 602, 604, 611, 652, 657, 672, 677, 710 |
| 89 | `src/components/AttendanceManagement/LocationPickerModal.js` | 7 | 0 | 1 | 0 | 0 | 1 / 1: #93C5FD | Component — see file | 156, 158, 167, 169, 178 |
| 90 | `src/screens/EmployeeAdvanceRequest/GenericAdvanceSaveScreen.js` | 7 | 0 | 0 | 0 | 0 | 3 / 1: #E6F0FF | Screen — see file | 1242, 1267, 1357, 1397, 1419, 1435, 1453 |
| 91 | `src/screens/ExpenseManagment/Header/ExpenseManagmentListPage.js` | 7 | 0 | 0 | 0 | 0 | 1 / 1: #DFF4FF | List page — header icon buttons (bg P.primary + white icon), light-blue card gradient | 273, 276, 284, 287, 491 |
| 92 | `src/screens/Profile/PersonalInformation/BankAccount/BankAccountSaveRecord.js` | 7 | 0 | 0 | 0 | 0 | — | Form / save-record screen — inputs, dropdown activeColor #E6F0FF, switches | 471, 483, 494, 506, 517, 528, 539 |
| 93 | `src/screens/Profile/PersonalInformation/FamilyContact/FamilyContact_ListPage.js` | 7 | 0 | 0 | 0 | 0 | 2 / 2: #BDDEFF #CCE6FF | List page — header icon buttons (bg P.primary + white icon), light-blue card gradient | 218, 229, 402-403 |
| 94 | `src/screens/Profile/PersonalInformation/PersonalContacts/ContactDetailsListPage.js` | 7 | 0 | 0 | 0 | 0 | 2 / 2: #BDDEFF #CCE6FF | List page — header icon buttons (bg P.primary + white icon), light-blue card gradient | 205, 214, 281-282 |
| 95 | `src/components/AttendanceManagement/LocationStatusBadge.js` | 6 | 0 | 0 | 1 | 1 | — | Component — see file | 80, 86, 88-91 |
| 96 | `src/components/AttendanceManagement/Screen/ConfirmClockInScreen.js` | 6 | 0 | 0 | 0 | 0 | — | Component — see file | 281, 283, 291, 294, 296, 303 |
| 97 | `src/components/AttendanceManagement/Screen/ConfirmClockOutScreen.js` | 6 | 0 | 0 | 0 | 0 | — | Component — see file | 365, 367, 372, 374, 376, 381 |
| 98 | `src/components/WorkItemAssigned/WorkItemDetailSection.js` | 6 | 0 | 0 | 0 | 2 | — | Component — see file | 309, 317, 344, 352, 365, 369 |
| 99 | `src/screens/HrPolicies/HrPoliciesScreen.js` | 6 | 0 | 0 | 0 | 0 | 3 / 3: #E0F2FE #BAE6FD #DBEAFE | Screen — see file | 117, 151, 232, 243 |
| 100 | `src/screens/Leaves/LeaveRequestSaveRecord.js` | 6 | 0 | 0 | 0 | 0 | 2 / 1: #E6F0FF | Form / save-record screen — inputs, dropdown activeColor #E6F0FF, switches | 883, 897, 909, 947, 967, 979 |
| 101 | `src/components/Alert/AlertDeleteModal.js` | 5 | 0 | 0 | 0 | 0 | — | Alert / confirmation modals — buttons, icon tints | 36-39, 202 |
| 102 | `src/screens/EmployeeEOSClearanceItems/EmployeeEOSClearanceItems_ListPage.js` | 5 | 0 | 0 | 0 | 0 | 2 / 2: #BDDEFF #CCE6FF | List page — header icon buttons (bg P.primary + white icon), light-blue card gradient | 281-282 |
| 103 | `src/screens/LeaveEncashment/LeaveEncashment_ListPage.js` | 5 | 0 | 0 | 0 | 0 | 2 / 2: #BDDEFF #CCE6FF | List page — header icon buttons (bg P.primary + white icon), light-blue card gradient | 236-237 |
| 104 | `src/screens/OvertimePlanner/OvertimePlanner_ListPage.js` | 5 | 0 | 0 | 0 | 0 | — | List page — header icon buttons (bg P.primary + white icon), light-blue card gradient | 275-276 |
| 105 | `src/components/MemoModal.js` | 4 | 0 | 0 | 0 | 0 | — | Component — see file | 62, 68-69, 93 |
| 106 | `src/Customizations/IDAP/screens/TravelRequisition/Lines/TravelRequisitionLinesListPage.js` | 4 | 0 | 0 | 0 | 0 | — | List page — header icon buttons (bg P.primary + white icon), light-blue card gradient | 474, 477, 485, 488 |
| 107 | `src/screens/Certificates/ESSEmployeeCertificate_Listpage.js` | 4 | 0 | 0 | 0 | 0 | 2 / 2: #BDDEFF #CCE6FF | Screen — see file | 67, 128 |
| 108 | `src/screens/EmployeeEOSRequest/EmployeeEOS_SaveRecord.js` | 4 | 0 | 0 | 0 | 0 | 2 / 1: #E6F0FF | Form / save-record screen — inputs, dropdown activeColor #E6F0FF, switches | 403, 415, 462, 477 |
| 109 | `src/screens/ExitInterview/HRExitInterview_ListPage.js` | 4 | 0 | 0 | 0 | 0 | — | List page — header icon buttons (bg P.primary + white icon), light-blue card gradient | 60, 456, 495 |
| 110 | `src/screens/OPD Expense/ESSOPDMedicalExpense_ListPage.js` | 4 | 0 | 0 | 0 | 0 | — | List page — header icon buttons (bg P.primary + white icon), light-blue card gradient | 57, 117 |
| 111 | `src/screens/Profile/PersonalInformation/Identification/IdentificationNumberSaveRecord.js` | 4 | 0 | 0 | 0 | 0 | — | Form / save-record screen — inputs, dropdown activeColor #E6F0FF, switches | 570, 581, 630, 673 |
| 112 | `src/screens/PurchaseOrder/PurchaseOrderListPage.js` | 4 | 0 | 0 | 0 | 0 | 1 / 1: #DFF4FF | List page — header icon buttons (bg P.primary + white icon), light-blue card gradient | 123, 372 |
| 113 | `src/screens/PurchaseRequisition/PurchaseRequisitionSaveRecord.js` | 4 | 0 | 0 | 0 | 0 | — | Form / save-record screen — inputs, dropdown activeColor #E6F0FF, switches | 362, 367, 379 |
| 114 | `src/components/AppComponentsDesign/Rows.js` | 3 | 0 | 0 | 0 | 0 | — | Component — see file | 62, 74-75 |
| 115 | `src/components/AppComponentsDesign/RowSkeleton.js` | 3 | 0 | 0 | 0 | 0 | 2 / 1: #F1F5F9 | Component — see file | 54, 63, 70 |
| 116 | `src/components/EntitlementBalance/EntitlementCards.js` | 3 | 0 | 0 | 0 | 0 | 2 / 2: #BDDEFF #CCE6FF | Entitlement cards — light-blue gradient #6ee0ff→#cce6ff | 10 |
| 117 | `src/components/Filters/ListFilterBar.js` | 3 | 1 | 0 | 0 | 0 | — | Filter panel / list filter bar — radio dot, badge | 135, 151, 266 |
| 118 | `src/components/MainDashboard/QuickAccessSheet.js` | 3 | 0 | 0 | 2 | 4 | — | Quick-access sheet — primary header + StatusBar light-content | 52, 184, 235 |
| 119 | `src/components/PersonalInformation/ContactDetailsSection.js` | 3 | 0 | 2 | 0 | 0 | — | Component — see file | 76, 82, 136 |
| 120 | `src/components/PurchaseRequisition/PurchaseRequisitionListPageCard.js` | 3 | 0 | 0 | 0 | 0 | — | List page — header icon buttons (bg P.primary + white icon), light-blue card gradient | 84, 91, 103 |
| 121 | `src/components/WorkItemAssigned/SelectionHeader.js` | 3 | 0 | 0 | 0 | 0 | — | Component — see file | 27, 31, 43 |
| 122 | `src/Controller/notificationService.js` | 3 | 0 | 0 | 0 | 0 | 3 / 1: #0A66C2 | Controllers / services — notification colours | 363, 405, 429 |
| 123 | `src/Customizations/IDAP/components/AttendanceCalendar/Attendancecalendargrid.js` | 3 | 0 | 1 | 0 | 0 | — | Attendance calendar — STATUS_COLORS, day cells | 40-42 |
| 124 | `src/Customizations/IDAP/components/MedicalReceiptDetailsModal.js` | 3 | 0 | 0 | 0 | 0 | — | Component — see file | 581, 586, 620 |
| 125 | `src/Customizations/IDAP/screens/ExpenseManagement/Header/MedicalExpenseManagementSaveRecord.js` | 3 | 0 | 0 | 0 | 0 | 3 / 2: #0A66C2 #E6F0FF | Form / save-record screen — inputs, dropdown activeColor #E6F0FF, switches | 578, 604, 631 |
| 126 | `src/Customizations/IDAP/screens/ExpenseManagement/Lines/MedicalExpenseLinesListPage.js` | 3 | 0 | 0 | 0 | 0 | — | List page — header icon buttons (bg P.primary + white icon), light-blue card gradient | 444, 456, 467 |
| 127 | `src/Navigation/TabNavigator.js` | 3 | 0 | 1 | 0 | 0 | — |  | 28-29, 86 |
| 128 | `src/screens/Certificates/ESSEmployeeCertificate_Saverecord.js` | 3 | 0 | 0 | 0 | 0 | — | Form / save-record screen — inputs, dropdown activeColor #E6F0FF, switches | 184, 238, 244 |
| 129 | `src/screens/EntitlementBalance/EntitlementBalance.js` | 3 | 0 | 0 | 0 | 0 | 3 / 3: #E0F2FE #BAE6FD #DBEAFE | Screen — see file | 225 |
| 130 | `src/screens/ESSEmployeeTask/ESSEmployeeTask_ListPage.js` | 3 | 0 | 0 | 0 | 0 | 2 / 2: #BDDEFF #CCE6FF | List page — header icon buttons (bg P.primary + white icon), light-blue card gradient | 256 |
| 131 | `src/screens/ESSMyRequestStatus.js` | 3 | 0 | 0 | 0 | 0 | 2 / 2: #E0F2FE #DBEAFE | Screen — see file | 242 |
| 132 | `src/screens/ExpenseManagment/Lines/ExpenseManagmentLinesSaveRecord.js` | 3 | 0 | 0 | 0 | 0 | 2 / 1: #E6F0FF | Form / save-record screen — inputs, dropdown activeColor #E6F0FF, switches | 738, 764, 782 |
| 133 | `src/screens/Profile/PersonalInformation/PersonalEducation/PersonalEducationSaveRecord.js` | 3 | 0 | 0 | 0 | 0 | — | Form / save-record screen — inputs, dropdown activeColor #E6F0FF, switches | 616, 653, 696 |
| 134 | `src/screens/PurchaseRequisitionLines/PurchaseRequisitionLinesListPage.js` | 3 | 1 | 0 | 1 | 1 | — | List page — header icon buttons (bg P.primary + white icon), light-blue card gradient | 317, 322, 332 |
| 135 | `src/store/slices/colorPaletteSlice.js` | 3 | 0 | 0 | 0 | 0 | 2 / 1: #0A66C2 |  | 6-8 |
| 136 | `src/components/AIChatbot/AIFloatingButton.js` | 2 | 1 | 0 | 1 | 1 | 2 / 1: #1A56DB | AI chatbot — independent blue #1A56DB/#0765A2 header, bubbles, gradients | 68, 72 |
| 137 | `src/components/EmployeeAdvanceRequest/RequestTypeSelectionModal.js` | 2 | 0 | 0 | 0 | 0 | — | Component — see file | 16, 67 |
| 138 | `src/components/EmploymentCertificate/CertificateList.js` | 2 | 0 | 0 | 0 | 0 | — | Certificate cards/modals — #2563EB/#0369A1 accents | 27, 38 |
| 139 | `src/components/MultiSelectActionBar.js` | 2 | 0 | 0 | 0 | 0 | — | Component — see file | 470, 489 |
| 140 | `src/Customizations/IDAP/screens/ExpenseManagement/Lines/TravelRequisitionSiteSurveyReport.js` | 2 | 0 | 0 | 1 | 1 | — | Screen — see file | 344, 1020 |
| 141 | `src/screens/ExpenseManagment/Header/ExpenseManagmentHeaderSaveRecord.js` | 2 | 0 | 0 | 0 | 0 | 2 / 1: #E6F0FF | Form / save-record screen — inputs, dropdown activeColor #E6F0FF, switches | 567, 598 |
| 142 | `src/screens/HRHelpDeskRequest/HRHelpDeskSave_Screen.js` | 2 | 0 | 0 | 0 | 0 | 1 / 1: #E6F0FF | Form / save-record screen — inputs, dropdown activeColor #E6F0FF, switches | 576, 614 |
| 143 | `src/screens/LeaveEncashment/LeaveEncashment_SaveRecord.js` | 2 | 0 | 0 | 0 | 0 | 1 / 1: #E6F0FF | Form / save-record screen — inputs, dropdown activeColor #E6F0FF, switches | 274, 305 |
| 144 | `src/screens/OPD Expense/ESSOPDMedicalExpense_SaveRecord.js` | 2 | 0 | 0 | 0 | 0 | — | Form / save-record screen — inputs, dropdown activeColor #E6F0FF, switches | 228, 234 |
| 145 | `src/components/Alert/LanguageModal.js` | 1 | 0 | 0 | 0 | 0 | — | Alert / confirmation modals — buttons, icon tints | 162 |
| 146 | `src/components/AttendanceManagement/Screen/HomeScreen.js` | 1 | 0 | 0 | 0 | 0 | — | Component — see file | 255 |
| 147 | `src/components/AttendanceManagement/Screen/TimeClockScreen.js` | 1 | 11 | 0 | 0 | 0 | — | Component — see file | 766 |
| 148 | `src/components/CommentModal/WorkflowCommentModal.js` | 1 | 1 | 0 | 1 | 1 | — | Component — see file | 167 |
| 149 | `src/components/Filters/FilterPanel.js` | 1 | 1 | 1 | 1 | 1 | — | Filter panel / list filter bar — radio dot, badge | 218 |
| 150 | `src/components/PageHeader/NotificationButton.js` | 1 | 0 | 0 | 0 | 0 | — | Header widgets — company dropdown, notification button | 14 |
| 151 | `src/components/PersonalInformation/SaveButton.js` | 1 | 0 | 0 | 0 | 0 | — | Component — see file | 9 |
| 152 | `src/components/PersonalInformation/SectionHeader.js` | 1 | 0 | 0 | 0 | 0 | — | Component — see file | 29 |
| 153 | `src/screens/AttendanceManagement/AttendanceManagement.js` | 1 | 0 | 0 | 0 | 0 | — | Screen — see file | 221 |
| 154 | `src/screens/ESSEmployeeTask/ESSEmployeeTaskDetail.js` | 1 | 0 | 0 | 0 | 0 | — | Screen — see file | 169 |
| 155 | `src/screens/Profile/PersonalInformation/ChangeProfileImage/ChangeProfileImage.js` | 1 | 0 | 0 | 0 | 0 | — | Profile / preferences — icon badges, switches, cards | 412 |
| 156 | `src/screens/SalarySlip/PRSalarySlip.js` | 1 | 0 | 0 | 0 | 0 | — | Screen — see file | 205 |
| 157 | `src/screens/TaxCertificate/PRTaxCertificate.js` | 1 | 0 | 0 | 0 | 0 | — | Screen — see file | 215 |
| 158 | `src/screens/WorkerAssignedToMe/WorkerAssignedToMe.js` | 1 | 0 | 0 | 2 | 0 | — | Screen — see file | 243 |
| 159 | `src/screens/WorkflowDetailScreen.js` | 1 | 0 | 0 | 1 | 1 | — | Screen — see file | 223 |
| 160 | `src/store/utils/scaling.js` | 1 | 0 | 0 | 1 | 1 | — |  | 263 |
| 161 | `src/utils/lazyLoadScreens.js` | 1 | 0 | 0 | 0 | 0 | 1 / 1: #0000FF |  | 14 |
| 162 | `src/components/AppComponentsDesign/Cards.js` | 0 | 0 | 0 | 2 | 2 | — | Component — see file |  |
| 163 | `src/components/AttendanceManagement/NavigationFAB.js` | 0 | 1 | 0 | 0 | 0 | — | Component — see file |  |
| 164 | `src/components/AttendanceManagement/ProcessingOverlay.js` | 0 | 2 | 0 | 0 | 0 | — | Component — see file |  |
| 165 | `src/components/MainDashboard/DashboardHeader.js` | 0 | 0 | 0 | 1 | 0 | — | Dashboard profile card — avatar ring/initials, Profile chip, dept tag, stat icons (static AppTokens.blue) |  |
| 166 | `src/components/MainDashboard/MenuCard.js` | 0 | 0 | 0 | 1 | 0 | — | Dashboard menu tile — light-blue icon tile bg (static AppTokens.blueBg) |  |
| 167 | `src/components/PageHeader/LogoutButton.js` | 0 | 0 | 1 | 0 | 0 | — | Header widgets — company dropdown, notification button |  |


---

## Appendix B — Reproduction (read-only scan script)

Run from the repo root with Node ≥ 18; writes nothing into the repo. Produces the totals in Appendix A, the blue-family analysis, and the WCAG ratios quoted in §E.

```js
// Read-only color inventory. Walks src/ + App.js + index.js, extracts color literals.
const fs = require('fs');
const path = require('path');
const ROOT = process.argv[2];
const OUT = process.argv[3];

const exts = new Set(['.js', '.jsx', '.ts', '.tsx']);
const files = [];
function walk(d) {
  for (const e of fs.readdirSync(d, {withFileTypes: true})) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (exts.has(path.extname(e.name))) files.push(p);
  }
}
walk(path.join(ROOT, 'src'));
for (const f of ['App.js', 'index.js']) {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) files.push(p);
}

const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g;
const RGB = /rgba?\([^)]*\)/g;
const NAMED = /(['"`])(white|black|blue|red|green|gray|grey|yellow|orange|transparent|navy|teal|purple|pink|silver|gold|lightgray|lightgrey|darkgray|darkgrey|lightblue|darkblue|crimson|tomato|dodgerblue|royalblue|steelblue|skyblue|lime|cyan|magenta|maroon|olive|aqua|fuchsia|brown|beige|ivory|coral|salmon|khaki|indigo|violet|turquoise|wheat|tan)\1/gi;
const SHADOW = /\b(shadowColor|elevation)\s*:\s*([^,\n]+)/g;

const rows = [];
const isCommentLine = l => /^\s*(\/\/|\*|\/\*)/.test(l);

for (const f of files) {
  const rel = path.relative(ROOT, f).split(path.sep).join('/');
  const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    const commented = isCommentLine(line);
    let m;
    HEX.lastIndex = 0;
    while ((m = HEX.exec(line))) {
      rows.push({file: rel, line: i + 1, kind: 'hex', value: m[0].toUpperCase(), ctx: line.trim().slice(0, 140), commented});
    }
    RGB.lastIndex = 0;
    while ((m = RGB.exec(line))) {
      rows.push({file: rel, line: i + 1, kind: 'rgb', value: m[0].replace(/\s+/g, ''), ctx: line.trim().slice(0, 140), commented});
    }
    NAMED.lastIndex = 0;
    while ((m = NAMED.exec(line))) {
      rows.push({file: rel, line: i + 1, kind: 'named', value: m[2].toLowerCase(), ctx: line.trim().slice(0, 140), commented});
    }
    SHADOW.lastIndex = 0;
    while ((m = SHADOW.exec(line))) {
      rows.push({file: rel, line: i + 1, kind: m[1], value: m[2].trim(), ctx: line.trim().slice(0, 140), commented});
    }
  });
}

fs.writeFileSync(OUT, JSON.stringify(rows));

const live = rows.filter(r => !r.commented);
const hexLive = live.filter(r => r.kind === 'hex');
const rgbLive = live.filter(r => r.kind === 'rgb');
const namedLive = live.filter(r => r.kind === 'named');
const shadowLive = live.filter(r => r.kind === 'shadowColor');
const elevLive = live.filter(r => r.kind === 'elevation');

const norm = h => {
  if (h.length === 4) return '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  if (h.length === 5) return '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3] + h[4] + h[4];
  return h;
};
const distinctHex = new Set(hexLive.map(r => norm(r.value)));
const distinctHex6 = new Set(hexLive.map(r => norm(r.value).slice(0, 7)));

console.log('FILES SCANNED:', files.length);
console.log('TOTAL rows (incl. commented):', rows.length);
console.log('LIVE hex literals:', hexLive.length, ' (commented-out:', rows.filter(r => r.kind === 'hex' && r.commented).length, ')');
console.log('LIVE rgb/rgba literals:', rgbLive.length);
console.log('LIVE named colors:', namedLive.length);
console.log('LIVE shadowColor props:', shadowLive.length);
console.log('LIVE elevation props:', elevLive.length);
console.log('DISTINCT hex (normalised, incl alpha):', distinctHex.size);
console.log('DISTINCT hex (6-digit base):', distinctHex6.size);
console.log('FILES with >=1 live hex:', new Set(hexLive.map(r => r.file)).size);

const freq = {};
for (const r of hexLive) { const k = norm(r.value); freq[k] = (freq[k] || 0) + 1; }
const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
console.log('\nTOP 70 HEX BY FREQUENCY:');
for (const [k, v] of sorted.slice(0, 70)) console.log(String(v).padStart(5), k);

const fileFreq = {};
for (const r of hexLive) fileFreq[r.file] = (fileFreq[r.file] || 0) + 1;
console.log('\nTOP 50 FILES BY LIVE HEX COUNT:');
for (const [k, v] of Object.entries(fileFreq).sort((a, b) => b[1] - a[1]).slice(0, 50)) console.log(String(v).padStart(5), k);

const nf = {};
for (const r of namedLive) nf[r.value] = (nf[r.value] || 0) + 1;
console.log('\nNAMED COLORS:');
for (const [k, v] of Object.entries(nf).sort((a, b) => b[1] - a[1])) console.log(String(v).padStart(5), k);
```

Blue-family / contrast analysis over the emitted `rows.json`:

```js
const fs = require('fs');
const rows = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')).filter(r => !r.commented && r.kind === 'hex');

const norm = h => {
  if (h.length === 4) return '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  if (h.length === 5) return '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3] + h[4] + h[4];
  return h;
};
const toRgb = h => {
  const x = norm(h).slice(1, 7);
  return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)];
};
const hsl = ([r, g, b]) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return [h, s, l];
};

// Blue family: hue 195..250, saturation >= 0.35, and not near-white/near-black
const freq = {};
for (const r of rows) { const k = norm(r.value).slice(0, 7); freq[k] = (freq[k] || 0) + 1; }
const blues = [];
for (const [k, v] of Object.entries(freq)) {
  const [h, s, l] = hsl(toRgb(k));
  if (h >= 195 && h <= 250 && s >= 0.35 && l > 0.08 && l < 0.97) blues.push({hex: k, n: v, h: h.toFixed(0), s: s.toFixed(2), l: l.toFixed(2)});
}
blues.sort((a, b) => b.n - a.n);
console.log('DISTINCT BLUE-FAMILY HEX (hue 195-250, sat>=0.35):', blues.length);
console.log('TOTAL BLUE-FAMILY OCCURRENCES:', blues.reduce((a, b) => a + b.n, 0));
console.log('\nhex       n   hue  sat   lum  | files');
for (const b of blues) {
  const files = [...new Set(rows.filter(r => norm(r.value).slice(0, 7) === b.hex).map(r => r.file))];
  console.log(b.hex.padEnd(8), String(b.n).padStart(4), String(b.h).padStart(4), b.s, b.l, '|', files.length, 'file(s)', files.length <= 3 ? files.join(', ') : files.slice(0, 2).join(', ') + ' +' + (files.length - 2));
}

// "Saturated mid-blue" = plausible primary stand-ins (lum 0.30..0.60)
console.log('\nSATURATED MID-BLUES (plausible "primary" stand-ins, lum 0.30-0.60):');
for (const b of blues.filter(b => b.l >= 0.30 && b.l <= 0.60 && b.s >= 0.5)) {
  const files = [...new Set(rows.filter(r => norm(r.value).slice(0, 7) === b.hex).map(r => r.file))];
  console.log(b.hex.padEnd(8), String(b.n).padStart(4), '|', files.join(', '));
}

// WCAG contrast
const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const L = h => { const [r, g, b] = toRgb(h); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
const ratio = (a, b) => { const la = L(a), lb = L(b); const [hi, lo] = la > lb ? [la, lb] : [lb, la]; return ((hi + 0.05) / (lo + 0.05)).toFixed(2); };
console.log('\nWCAG CONTRAST:');
const pairs = [
  ['#FFFFFF', '#0A66C2', 'white on current blue'],
  ['#FFFFFF', '#F4B400', 'white on mustard'],
  ['#1F1F1F', '#F4B400', 'charcoal on mustard'],
  ['#F4B400', '#FFFFFF', 'mustard on white'],
  ['#F4B400', '#F1F5F9', 'mustard on pageBg #F1F5F9'],
  ['#F4B400', '#F5F7FA', 'mustard on bg #F5F7FA'],
  ['#1F1F1F', '#FFFFFF', 'charcoal on white'],
  ['#6B6B6B', '#FFFFFF', 'grey on white'],
  ['#6B6B6B', '#F4B400', 'grey on mustard'],
  ['#F59E0B', '#FFFFFF', 'existing amber on white'],
  ['#F4B400', '#F59E0B', 'mustard vs existing amber'],
  ['#F4B400', '#D9A404', 'mustard vs tab badge mustard'],
  ['#F4B400', '#FEF3C7', 'mustard on amberBg'],
  ['#92400E', '#F4B400', 'amber-dark text on mustard'],
  ['#F4B400', '#E9E9E9', 'mustard on light-grey divider'],
  ['#0A66C2', '#FFFFFF', 'current blue on white'],
];
for (const [fg, bg, label] of pairs) console.log(String(ratio(fg, bg)).padStart(6), ':1 ', label);
```

White-on-primary pairing detector (heuristic, ±4 lines, same file only — a lower bound):

```js
// Find hardcoded white within +/-N lines of a primary-colored background.
const fs = require('fs');
const path = require('path');
const ROOT = process.argv[2];
const N = 4;
const exts = new Set(['.js', '.jsx', '.ts', '.tsx']);
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, {withFileTypes: true})) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p); else if (exts.has(path.extname(e.name))) files.push(p);
  }
})(path.join(ROOT, 'src'));

const BG = /backgroundColor\s*[:=]\s*\{?\s*(P\.primary|T\.blue|tokens\.blue|DEFAULT_PALETTE\.primary|AppTokens\.blue|colors\.primary|'#0A66C2'|"#0A66C2")\b/;
const WHITE = /(color|tintColor|iconColor|headerTintColor)\s*[:=]\s*\{?\s*['"]?(#fff|#ffffff|#FFF|#FFFFFF|white)['"]?/;
const ONPRIMARY = /P\.onPrimary|T\.onPrimary|tokens\.onPrimary/;

const hits = {};
let total = 0, dynamicTotal = 0;
for (const f of files) {
  const rel = path.relative(ROOT, f).split(path.sep).join('/');
  const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
  lines.forEach((l, i) => {
    if (/^\s*\/\//.test(l)) return;
    const m = BG.exec(l);
    if (!m) return;
    const lo = Math.max(0, i - N), hi = Math.min(lines.length - 1, i + N);
    let whiteLine = null, hasOnPrimary = false;
    for (let j = lo; j <= hi; j++) {
      if (/^\s*\/\//.test(lines[j])) continue;
      if (WHITE.test(lines[j]) && whiteLine === null) whiteLine = j + 1;
      if (ONPRIMARY.test(lines[j])) hasOnPrimary = true;
    }
    if (whiteLine !== null && !hasOnPrimary) {
      total++;
      const dyn = /P\.primary|T\.blue|tokens\.blue|colors\.primary/.test(m[1]);
      if (dyn) dynamicTotal++;
      (hits[rel] = hits[rel] || []).push(`${i + 1}(bg:${m[1]}) w/ white@${whiteLine}${dyn ? '' : ' [STATIC]'}`);
    }
  });
}
console.log('WHITE-ON-PRIMARY PAIRINGS (hardcoded white within ±' + N + ' lines of a primary background, no onPrimary nearby):', total);
console.log('  of which primary is DYNAMIC (would auto-turn mustard with white text left behind):', dynamicTotal);
console.log('  files:', Object.keys(hits).length);
console.log();
for (const [f, arr] of Object.entries(hits).sort((a, b) => b[1].length - a[1].length)) {
  console.log(String(arr.length).padStart(3), f);
  console.log('     ', arr.join('; '));
}
```
