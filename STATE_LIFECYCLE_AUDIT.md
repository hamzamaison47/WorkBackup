# Redux State Lifecycle & Cache-Clearing Audit

**Scope:** Dynaface React Native app, branch `operational` (working tree, incl. uncommitted changes).
**Date:** 2026-08-07
**Status:** Audit only — no code changed.

**Target behaviour assumed throughout:** all state wiped at cold start, login, and logout, with exactly two exceptions that must survive all three — (a) client/tenant configuration, (b) biometric enrolment (Keychain credentials + accounts list).

**Headline:** the patch is not complete. Three of the four logout UI entry points perform no Redux teardown at all, the biometric login path performs none either, and the one path that does work leaves five slices untouched. Cold start clears nothing by design — everything is persisted to disk, including OAuth tokens in plaintext.

---

## 1. Slice inventory

Store is assembled in `src/store/index.ts:61`. Eleven slices, all whitelisted for persistence.

| # | Slice | File | Holds | initialState | Clear/reset action | Dispatched? |
|---|-------|------|-------|--------------|--------------------|-------------|
| 1 | `company` | `src/store/slices/companySlice.js` | Selected/default legal entity, legal-entity list | `{selectedLegalEntity: null, legalEntities: [], defaultLegalEntity: null}` | `resetCompanyState` | **NEVER** ⚠️ |
| 2 | `user` | `src/store/slices/userSlice.js` | Full employee record incl. `employeeFullInfo` (name, id, dept, position, hire date, payroll flag) | `{userData: null}` | `clearUserData` | Yes — `authUtils.js:138`, `useSessionTimeout.js:27`, `ApiService.js:30` (dead module) |
| 3 | `menuItem` | `src/store/slices/menuItemSlice.js` | Role-derived menu/permission list | `{menuItems: []}` | `clearMenuItems` | Yes — `authUtils.js:141` only |
| 4 | `language` | `src/store/slices/languageSlice.js` | `currentLanguage`, `languageCode`, `isRTL`, `skipLoginAfterRestart`, `appRestarting` | `{en, en-us, false, false, false}` | `resetLanguageState` | **NEVER** ⚠️ (only `setSkipLoginAfterRestart(false)` on logout) |
| 5 | `biometric` | `src/store/slices/biometricSlice.js` | `enabled`, `selectedAccount`, `accounts[]` (incl. employeeId/employeeName), `credentials` | `{false, null, [], null}` | `clearBiometric` | Yes — `authUtils.js:140`, `biometricUtils.js:176` |
| 6 | `firebase` | `src/store/slices/firebaseSlice.js` | `fcmToken`, `deviceId`, `lastSyncedToken`, `userEmail`, `employeeId`, `company`, `dynamicsSynced`, `inAppNotifications[]` | all `null`/`false`/`[]` | `clearFirebaseData` | Yes — `authUtils.js:139` & `:358`, `FirebaseService.js:449`, `ApiService.js:31` (dead) |
| 7 | `auth` | `src/store/slices/authSlice.js` | `accessToken`, `idToken`, `refreshToken`, `userToken`, `aiServiceToken`, `graphAccessToken`, `graphRefreshToken`, `graphUserId`, `lastBackgroundTime` | all `null` | `clearAuthTokens` | Yes — `authUtils.js:137`, `useSessionTimeout.js:26` |
| 8 | `chatbot` | `src/store/slices/chatbotSlice.js` | `messages[]`, `state.{leaveHandlerState, currentIntent, conversationContext[]}`, `settings` | `{[], {null,null,[]}, {voice,autoSpeak,lang}}` | `chatbotClearMessages` (partial), `chatbotResetState`, `chatbotResetAll` (full) | Partial — only `chatbotClearMessages` (`authUtils.js:145`, `:359`). `chatbotResetAll` **NEVER** ⚠️ |
| 9 | `dateFormat` | `src/store/slices/dateFormatSlice.js` | `selectedFormat`, `selectedTimeFormat`, `selectedTimezone` | first option of each list | **NONE — no reset reducer exists** ⚠️ | n/a |
| 10 | `theme` | `src/store/slices/themeSlice.js` | `mode` (`light`/`dark`) | `{mode: 'light'}` | `resetThemeState` | **NEVER** ⚠️ |
| 11 | `colorPalette` | `src/store/slices/colorPaletteSlice.js` | `primary`, `onPrimary`, `selection`, `hydrated` | `DEFAULT_PALETTE` + `hydrated:false` | `resetPalette` | **NEVER** ⚠️ |

**Slices with no clear action:** `dateFormat`.
**Slices whose clear action exists but is never called:** `company`, `language`, `theme`, `colorPalette`, plus `chatbot`'s full reset (`chatbotResetAll`).

---

## 2. Persistence configuration

`src/store/index.ts:19-58`.

- **redux-persist: yes**, key `root`, single blob.
- **Custom storage engine (`index.ts:21-43`): `react-native-fs`**, not AsyncStorage/EncryptedStorage. The blob is written with `RNFS.writeFile` to `${RNFS.DocumentDirectoryPath}/persist_root.json` as **plaintext UTF-8 JSON**.
- **Whitelist: all eleven slices.** `blacklist: []`.
- **Which slices survive cold start today:** all of them.
- **Are auth tokens written to disk? Yes.** `auth` is whitelisted, so `accessToken`, `idToken`, `refreshToken`, `graphAccessToken`, `graphRefreshToken` and `aiServiceToken` land in that plaintext file. On iOS `DocumentDirectoryPath` is user-visible via Files/iTunes and is included in iCloud backup unless excluded; nothing here sets `NSURLIsExcludedFromBackupKey`.
- **`persistor.purge()` on logout: no — it is never called anywhere in the codebase.** The only persistor call outside `store/index.ts` is `persistor.flush()` in `src/components/Alert/LanguageModal.js:123`, used to force-write before the RTL restart.
- Consequence: even when Redux is cleared in memory, the on-disk blob is only overwritten by the subsequent persist write. If the process is killed between the clear and the write, the previous user's blob is still on disk.

---

## 3. Non-Redux state

| Store | Where | Contents | Cleared on logout? |
|---|---|---|---|
| `apiCache` (in-memory Map + timers) | `src/utils/apiCache.js:166` | API responses; `useDashboardData.js:53` writes profile pictures keyed by `employeeId`, 15 min TTL | **Only** via `apiCache.clear()` in `authUtils.js:130`. Not cleared on cold start (irrelevant — memory) or login. |
| AI-service token cache | `src/services/AzureAuthService.js:13-14` (`_cachedAIToken`, `_cachedAITokenExpiry`) | Bearer token for AI services | **No.** `clearAIServiceToken()` (`:128`) exists and is **never called anywhere**. Survives logout in module memory. |
| `firebaseService` singleton | `src/store/FirebaseService.js:582` | Only `this.messaging`; user data is read from Redux on demand (`getUserDataFromRedux`) | `cleanup()` dispatches `clearFirebaseData()`. No stale instance fields. |
| `MasterService` | `src/services/MasterService.js:26` | Not a singleton — a hook (`useState`/`useRef`), initialised per-mount with `userData`. Dies with its component. | n/a |
| `AttendanceForegroundService` module vars | `src/services/AttendanceManagement/AttendanceForegroundService.js:25-29` | `_isRunning`, `_clockInEpoch`, `_breakStartEpoch`, `_totalBreakMs`, `_isOnBreak` | **No.** A clocked-in session survives logout in process memory. |
| `SyncManager` | `.../SyncManager.js:17,166` (`syncing`, `networkListenerActive`) + EncryptedStorage `@attendance_sync_queue` | Queued attendance punches with the enqueuing user's payload | **No.** Queue drains under whatever session is active later. |
| AsyncStorage (direct) | `@attendance_location`, `@attendance_last_coords` (`useLocation.js:13-14`); `@attendance_clock_in_fence` (`GeofenceContext.js:24`); `@fs_attendance_state` (`AttendanceForegroundService.js:22`); `@fs_action_debounce` (`AttendanceHeadlessTask.js:24`); `df_geofences_v1`, `offline_attendance_queue`, `failed_attendance_queue` (`CreateAttendanceScreen.js:45-47`) | Location, geofences, offline/failed punch queues | **No — none of these are touched by any logout path.** |
| EncryptedStorage | `@attendance_sync_queue` (`SyncManager.js:15`); `SecureConfigService.js:108` config keys | Punch queue; secure config | **No.** (`SecureConfigService.js:176` has an `EncryptedStorage.clear()` but it is not on a logout path.) |
| Keychain — tenant config | `src/Controller/secureConfig.js` services `appConfig`, `appConfigsList`, `activeConfig`, `appConfig_<id>` | tokenUrl, client_id, client_secret, resource | **No — correct, this must survive.** |
| Keychain — biometric | `biometricUtils.js:19` service `biometric_credentials` | `{email, provider, isBiometricEnabled, timestamp}` | Not cleared on logout (only by explicit `disableBiometric()`). Intended to survive — but see Finding 10 for the drift this creates. |
| React state outliving navigation | `ActionPaneContainer.js:604-605` `notifications`/`notificationCount`; `GeofenceContext` provider state | Notification list, geofence/watch state | Dies on unmount when the stack resets to Login. Geofence provider survives while mounted. |

---

## 4. The three lifecycle points — what actually runs today

### 4.1 Cold start

`index.js` → `App.js:97` → `PersistGate` → `AppNavigator` → `SplashScreen`.

1. `persistStore` rehydrates **all eleven slices** from `persist_root.json`. No purge, no version/migration gate.
2. `App.js:57` calls `firebaseService.setupMessageHandlers(...)`.
3. `SplashScreens.js:106` `checkAuthStatus()` waits for `_persist.rehydrated`, then computes `hasSession` from the rehydrated tokens/user (`:118`).
4. If `skipLogin` (set only by the language-change restart) **and** `hasSession`: `bootstrapSessionIfNeeded()` (`:132-220`) re-fetches the persisted user's employee record, legal entities, menus and re-dispatches `setFirebaseUserData`, then navigates straight to `DrawerNavigator` — a silent re-login.
5. Otherwise: 3-second timeout → `navigation.replace('Login')`.

**Nothing is cleared at cold start.** The normal path routes to Login, but the previous user's `user`, `auth`, `menuItem`, `company`, `chatbot`, `firebase`, `biometric` and preference slices are all live in the store and on disk before anyone authenticates.

### 4.2 Login

Three distinct paths, only one of which clears anything.

**(a) SSO — `handleLogin` (`authUtils.js:163`) → `handleSuccessfulLogin` (`:256`)**

Order of operations:
1. `:210-214` — **writes** `setAccessToken`/`setIdToken`/`setRefreshToken` for the new user. *No teardown has happened yet.*
2. `:271` `setAccessToken` again; `:278` `fetchUserInfo`.
3. `:295-300` `initializeLegalEntity`, `setLegalEntities`, `setMenuItems` — overwrite company/menu.
4. `:303-318` `RetrieveFirstOnly()` → `setPalette`. On failure (`:325` catch) the **previous** palette survives.
5. `:355` `setUserData(completeUserData)`.
6. `:358-359` — `clearFirebaseData()` and `chatbotClearMessages()` **after** the user record is written (harmless in isolation: `setFirebaseUserData` follows at `:366`, so the firebase slice ends correct).
7. `:378` `syncDeviceAfterLogin()` → registers FCM token against the new employee.
8. `:395` `saveAccountAfterLogin(...)` → replaces `biometric.accounts` with the new single account.

Not cleared on this path: `auth.idToken`/`userToken`/`aiServiceToken`/`graph*` (only the current provider's token is overwritten — sign in as Azure after a Google user and the previous `idToken` remains), `chatbot.state`/`settings`, `dateFormat`, `theme`, `language`, `colorPalette` (on API failure), `apiCache`, AI token cache, all attendance storage.

**(b) Biometric — `LoginScreen.loadUserDataFromBiometric` (`LoginScreen.js:143`), reached from `handleBiometricLogin` (`:386`) and the auto-login effect (`:232`)**

Dispatches, in order: `setUserData`, `initializeLegalEntity`, `setLegalEntities`, `setMenuItems`, `setPalette`. **That is the entire list.** No clear action of any kind is dispatched, `setFirebaseUserData` is never called, no tokens are written, `syncDeviceAfterLogin` is never called.

**(c) Attendance shortcut — `handleAttendanceLogin` (`LoginScreen.js:462`)** — wraps `handleLogin` with a proxy navigation object; same clearing behaviour as (a).

### 4.3 Logout

`handleLogoutauth` (`authUtils.js:126`) is the intended teardown. It does:

```
apiCache.clear()                     :130
await firebaseService.cleanup()      :134  → store.dispatch(clearFirebaseData())
dispatch(clearAuthTokens())          :137
dispatch(clearUserData())            :138
dispatch(clearFirebaseData())        :139
dispatch(clearBiometric())           :140
dispatch(clearMenuItems())           :141
dispatch(setSkipLoginAfterRestart(false)) :142
dispatch(chatbotClearMessages())     :145
navigation.reset({routes:[{name:'Login'}]}) :150
```

Even when it runs correctly it does **not** touch: `company`, `dateFormat`, `theme`, `language` (beyond one flag), `colorPalette`, `chatbot.state`/`chatbot.settings`, the persisted on-disk blob, the AI token cache, or any attendance storage.

**Call sites — they do not agree with each other:**

| Entry point | Code | What actually happens |
|---|---|---|
| `ActionPaneContainer.confirmLogout` (`ActionPaneContainer.js:726-745`) | `await handleLogoutauth(navigation, dispatch)` | ✅ Correct call. |
| `AttendanceManagement.confirmLogout` (`AttendanceManagement.js:139-142`) | `handleLogoutauth(navigation, dispatch)` | ✅ Correct call (not awaited). |
| **`DrawerNavigator.confirmLogout` (`DrawerNavigator.js:292-296`)** | `handleLogoutauth(userData.Provider); props.navigation.navigate('Login');` | ❌ **Wrong signature.** See Finding 2. |
| **`Profile.confirmLogout` (`Profile/Profile.js:73-76`)** | `navigation.navigate('Login')` | ❌ **No teardown whatsoever.** |
| **`Maindasboard.confirmLogout` (`Maindasboard.js:127-130`)** | `navigation.reset({routes:[{name:'Login'}]})` | ❌ **No teardown whatsoever.** (Bound to hardware back on the dashboard.) |
| `useSessionTimeout.handleOkPress` (`useSessionTimeout.js:23-32`) | `clearAuthTokens` + `clearUserData` + reset | ⚠️ Partial — 2 of 11 slices. |
| `ApiService.logout()` (`store/ApiService.js:28`) | `clearUserData` + `clearFirebaseData` | ⚠️ Dead code — module is never imported. |

---

## 5. Gap table

Legend: ✅ cleared · ❌ not cleared · ⚠️ partial/path-dependent. "Login" = worst case across the three login paths (biometric). "Logout" = worst case across the five logout entry points.

| State item | Cold start? | Login? | Logout? | Should be? | Notes |
|---|---|---|---|---|---|
| `auth.accessToken` / `refreshToken` | ❌ | ⚠️ overwritten on SSO only | ⚠️ only on 2 of 5 paths | ✅ all three | **Finding 1** — survives biometric login |
| `auth.idToken` | ❌ | ❌ | ⚠️ | ✅ | Stale across provider switch |
| `auth.userToken` / `aiServiceToken` / `graph*` | ❌ | ❌ | ⚠️ | ✅ | Never written on login, so never refreshed |
| `user.userData` | ❌ | ✅ overwritten | ⚠️ | ✅ | |
| `menuItem.menuItems` | ❌ | ✅ overwritten | ⚠️ | ✅ | Drives visible modules/permissions |
| `company.*` | ❌ | ✅ overwritten | ❌ **never, any path** | ✅ | **Finding 6** — `resetCompanyState` is dead |
| `firebase.userEmail` / `employeeId` / `company` | ❌ | ❌ on biometric | ⚠️ | ✅ | **Finding 1** |
| `firebase.fcmToken` / `lastSyncedToken` / `dynamicsSynced` | ❌ | ❌ on biometric | ⚠️ | ✅ | **Finding 5** |
| `firebase.inAppNotifications` | ❌ | ❌ on biometric | ⚠️ | ✅ | Previous user's notification bodies remain visible |
| `chatbot.messages` | ❌ | ⚠️ SSO only | ⚠️ | ✅ | |
| `chatbot.state.conversationContext` | ❌ | ❌ | ❌ | ✅ | **Finding 9** — holds prior conversation content |
| `chatbot.settings` | ❌ | ❌ | ❌ | ✅ | |
| `colorPalette.*` | ❌ | ⚠️ only if API succeeds | ❌ | ✅ | `resetPalette` dead |
| `dateFormat.*` | ❌ | ❌ | ❌ | ✅ | **No reset action exists** |
| `theme.mode` | ❌ | ❌ | ❌ | ✅ | `resetThemeState` dead |
| `language.*` | ❌ | ❌ | ⚠️ one flag | ✅ | `resetLanguageState` dead |
| `biometric.enabled` / `accounts` / `selectedAccount` | ❌ | ✅ accounts replaced | ⚠️ wiped on 2 paths | ❌ **must survive** | **Finding 10** — currently cleared when it shouldn't be |
| Keychain `biometric_credentials` | ❌ | ❌ | ❌ | ❌ **must survive** | ✅ correct today |
| Keychain tenant config | ❌ | ❌ | ❌ | ❌ **must survive** | ✅ correct today |
| `apiCache` | n/a (memory) | ❌ | ⚠️ only via `handleLogoutauth` | ✅ | |
| `_cachedAIToken` (AzureAuthService) | n/a | ❌ | ❌ | ✅ | **Finding 14** |
| Attendance AsyncStorage keys (7) | ❌ | ❌ | ❌ | ✅ | **Finding 13** |
| `@attendance_sync_queue` (EncryptedStorage) | ❌ | ❌ | ❌ | ✅ | **Finding 13** |
| Foreground-service module vars | n/a | ❌ | ❌ | ✅ | **Finding 13** |
| On-disk `persist_root.json` | ❌ | ❌ | ❌ (no `purge()`) | ✅ | **Finding 7** |

---

## 6. Findings, by severity

### CRITICAL — data leaks between users

**1. Biometric login inherits the previous user's auth tokens and Firebase identity.**
`LoginScreen.js:143-229` dispatches only `setUserData`, `initializeLegalEntity`, `setLegalEntities`, `setMenuItems`, `setPalette`. It clears nothing and never writes tokens or `setFirebaseUserData`. So after user A logs out through a path that doesn't clear (Findings 2/3) — or after a cold start — user B signing in biometrically runs with:
- `auth.accessToken` / `auth.refreshToken` still belonging to **A**;
- `firebase.userEmail` / `employeeId` / `company` still **A**;
- `firebase.inAppNotifications` still **A**'s.

This is not merely cosmetic. `src/API/Token/getToken.js:29` reads `state.user.userData.isDynamicsUser`, `state.auth.refreshToken` and `state.auth.accessToken`: with B's `userData` (`isDynamicsUser === 'Yes'`) and A's refresh token, it calls `refresh()` on **A's** token and returns it as the bearer for B's Dynamics calls. Every Dynamics request in B's session is then made with A's delegated access token.

**2. `DrawerNavigator` logout calls `handleLogoutauth` with the wrong arguments — almost nothing is cleared.**
`src/Navigation/DrawerNavigator.js:294`:
```js
handleLogoutauth(userData.Provider);   // signature is (navigation, dispatch)
```
`DrawerNavigator.js` imports `useSelector` but not `useDispatch` (`:9`), and `Provider` is not a field on the object built in `authUtils.js:329` — so `navigation` is `undefined` and `dispatch` is `undefined`. Execution reaches `apiCache.clear()` (`:130`) and `await firebaseService.cleanup()` (`:134`, which uses the imported `store` and does work), then throws `TypeError: dispatch is not a function` at `:137`. The `catch` at `:154` then calls `navigation.reset` on `undefined` and throws again — an unhandled rejection.

Net effect of the drawer logout: `apiCache` and the `firebase` slice are cleared; **`auth`, `user`, `menuItem`, `company`, `biometric`, `chatbot`, `colorPalette`, `dateFormat`, `theme`, `language` all survive intact.** The user still lands on Login because `props.navigation.navigate('Login')` runs on the next line, so it looks like a successful logout.

**3. `Profile` and `Maindasboard` "logout" only navigate.**
`src/screens/Profile/Profile.js:73-76` — `navigation.navigate('Login')`.
`src/screens/Maindasboard.js:127-130` — `navigation.reset(...)`. Bound to the hardware back button via `useFocusEffect` (`:115-125`), so this is easy to hit accidentally.
Neither imports or calls `handleLogoutauth`. Nothing is cleared — not even `apiCache`.

### HIGH

**4. Auto-biometric login can sign a second physical user into the first user's account.**
`LoginScreen.js:232-311` fires on mount without user action. It gates on `hasPersistentBiometricCredentials()` (`biometricUtils.js:232`), which requires the Keychain entry **and** `state.biometric.enabled === true`. After any of the broken logout paths, both are still true. `ReactNativeBiometrics({allowDeviceCredentials: true})` (`biometricUtils.js:16`) accepts **any** fingerprint/face enrolled on the device, plus the device PIN. On a shared device, whoever picks it up next is auto-signed-in as the previous user with no prompt to choose an account.

**5. Stale FCM device→employee mapping.**
`syncDeviceAfterLogin()` (`FirebaseService.js:514`) is called **only** from `handleSuccessfulLogin` (`authUtils.js:378`) — never from the biometric path. Logout clears the local `fcmToken`/`lastSyncedToken` but never tells Dynamics to unmap the device. So: A signs in via SSO → device token mapped to A in Dynamics. A logs out. B signs in biometrically → no re-registration → **Dynamics still routes A's push notifications to this device**, where B is now the signed-in user. The `lastSyncedToken === firebaseToken` early return (`:538`) also short-circuits re-registration whenever `firebase` was not cleared first.

**6. `company` is never reset on any path, and the code comments claim otherwise.**
`resetCompanyState` (`companySlice.js:26`) has zero dispatch sites. `company` is persisted. Legal entity carries across users and across cold starts; it is only masked when a login path happens to overwrite it. Meanwhile `ActionPaneContainer.js:735-738` documents the opposite:
> *"Clears the API cache, tears down Firebase, resets every Redux slice (company included)"*

That comment is wrong today and will mislead the next person to touch this.

**7. Auth tokens are persisted to plaintext on disk, and never purged.**
`store/index.ts:44-56` whitelists `auth`; the custom RNFS engine (`:21-43`) writes `persist_root.json` to `DocumentDirectoryPath` in the clear. No `persistor.purge()` exists anywhere, so logout never removes the file — it is only overwritten by the next persist write. Nothing clears at cold start, so a device that is powered off mid-session comes back up with a full token set in the store. Recommend moving `auth` off the persist whitelist entirely, or backing the engine with `react-native-keychain`/`EncryptedStorage`, and excluding the file from iCloud backup.

**8. Session timeout clears 2 slices of 11.**
`useSessionTimeout.js:23-32` dispatches `clearAuthTokens` + `clearUserData` and resets navigation. `menuItem`, `company`, `firebase`, `chatbot`, `biometric` and every preference slice survive a "session expired" event, as does `apiCache`. This is a fourth, independent definition of teardown.

### MEDIUM

**9. Chatbot state and settings survive logout.**
Only `chatbotClearMessages` is dispatched (`authUtils.js:145`, `:359`). `state.leaveHandlerState`, `state.currentIntent` and `state.conversationContext` (up to 10 entries of prior conversation, `chatbotSlice.js:78-86`) persist across users. `chatbotResetAll` (`:68`) exists and is never used.

**10. Logout wipes biometric enrolment, which is supposed to survive — and desynchronises Redux from the Keychain.**
`handleLogoutauth` dispatches `clearBiometric()` (`authUtils.js:140`), zeroing `enabled`, `accounts` and `selectedAccount`. The Keychain entry is untouched (only `disableBiometric()` resets it). Result after a *correct* logout: Keychain still holds A's email, but `enabled === false`, so `hasPersistentBiometricCredentials()` returns false and `handleBiometricLogin` tells the user biometric login "is not set up" (`LoginScreen.js:390`). Biometric is effectively broken by logging out, while the credential is still on the device. This directly contradicts exception (b) in the target behaviour, and it is inconsistent with the drawer path, where enrolment survives because nothing is cleared.

Note the tension with Finding 4: preserving `biometric.accounts` across logout is the stated requirement, but the accounts array carries `employeeId`, `employeeName`, `userName` and `defaultLegalEntity` (`biometricUtils.js:65-75`) — that is user data, not enrolment data. Recommend preserving only what is needed to *offer* the sign-in (email, provider, display name) and dropping the employee fields.

**11. Login writes the new user's tokens before any teardown; a failed login leaves a mixed-identity store.**
`handleLogin` (`authUtils.js:210-214`) dispatches the new tokens immediately after `authorize()`. If `handleSuccessfulLogin` then throws — unregistered email (`:281`), incomplete profile (`:288`), any network failure — the catch at `:230` shows an alert and returns the user to Login **with B's live tokens in the store and A's `userData`/`menuItems`/`company` still present**, all of it persisted to disk. There is no rollback.

**12. Attendance state outside Redux is never cleared.**
Seven AsyncStorage keys, one EncryptedStorage queue and five module-level variables (inventory in §3). Concretely: A clocks in and logs out; `_isRunning`/`_clockInEpoch` (`AttendanceForegroundService.js:25-29`) still describe A's shift, `@fs_attendance_state` still holds it on disk, and `@attendance_sync_queue` may hold unsent punches that `drainSyncQueue()` (`SyncManager.js:77`) will submit under B's session token. The queued payloads carry their own identity fields, so the *records* stay attributed to A, but they are transmitted with B's credentials.

**13. Two in-memory caches are unmanaged.**
`clearAIServiceToken()` (`AzureAuthService.js:128`) is defined, documented as "call this on logout", and never called — the AI bearer token for user A stays in module memory for user B. `apiCache` is only cleared inside `handleLogoutauth`, so the three broken logout paths leave it populated (profile pictures are keyed by `employeeId`, `useDashboardData.js:53`, which limits — but does not eliminate — cross-read risk).

### LOW

**14. Notification poll race — mitigated on one path only.**
`ActionPaneContainer.js:700-709` stops the 30 s interval when `loggingOut` flips, and `fetchNotifications` (`:683`) early-returns without an `employeeId`. That guard is local component state, set only by `ActionPaneContainer.confirmLogout`. Logging out from the drawer, Profile, Maindasboard or session timeout does not set it, so the interval keeps firing until the component unmounts on the navigation reset. A request already in flight still resolves into `setNotifications` — but that is component state on an unmounting component, so nothing survives into the next session. **This is currently latent rather than harmful**; it becomes a real write-back-after-wipe race the moment notifications move into Redux, or if a logout path stops unmounting the tree. Worth fixing at the source (drive the guard off the store, not off local state) rather than per-component.

**15. `ApiService` is dead code offering a fifth, incomplete teardown.**
`src/store/ApiService.js` is not imported anywhere (the only `apiService` hit in the tree is the unrelated `Controller/leaveRequestApiService`). Its `logout()` (`:28`) clears 2 of 11 slices. Delete it, or it will eventually get wired up.

**16. `dateFormat` has no reset reducer at all** (`dateFormatSlice.js:37-47`) — the only slice with no way to return to `initialState` short of a root-level reset.

---

## 7. Recommended approach

**Yes — replace per-slice clearing with a root-reducer reset.** The per-slice list is the direct cause of Findings 6, 9, 10 and 16: it requires every future slice author to remember to add themselves to a list in `authUtils.js`, and five slices have already been missed. A root reset inverts the default from "leaks unless listed" to "wiped unless listed", which is the correct default for a multi-user device.

Shape (in `src/store/index.ts`, wrapping `combineReducers`):

```
appReducer = combineReducers({...})

rootReducer = (state, action) => {
  if (action.type === 'app/resetState') {
    const preserved = pick(state, PRESERVE)
    return appReducer({...preserved, _persist: state._persist}, action)
  }
  return appReducer(state, action)
}
```

**Preserve list: `['biometric']` — and nothing else.**

Rationale against the two stated exceptions:
- **Tenant/client config** needs no entry. It does not live in Redux at all — it is in the Keychain under `appConfig`, `appConfigsList`, `activeConfig` and `appConfig_<id>` (`Controller/secureConfig.js`). A root reset cannot touch it. Just ensure the reset never calls `clearConfig()`/`setActiveConfig(null)`.
- **Biometric enrolment** is split across the Keychain entry `biometric_credentials` (untouched by Redux, already survives) and the `biometric` slice (`enabled`, `accounts`, `selectedAccount`). Only the slice needs preserving. Per Finding 10, narrow the persisted account shape to `{email, provider, displayName, id, addedAt}` and drop `employeeId`/`employeeName`/`userName`/`defaultLegalEntity`, so the preserve list carries enrolment rather than user data.

Everything else — `auth`, `user`, `menuItem`, `company`, `firebase`, `chatbot`, `colorPalette`, `dateFormat`, `theme`, `language` — returns to `initialState`. Note that `language`, `theme` and `dateFormat` are device preferences that a reasonable person might want to keep; the stated target says wipe them, so they are excluded from the preserve list. Worth an explicit confirmation before implementing, since it means each new sign-in starts in English/light/default date format.

To finish the job, the reset action needs to be paired with:

1. **One teardown function, called by every logout entry point.** Fix `DrawerNavigator.js:294`, and route `Profile.js:73`, `Maindasboard.js:127` and `useSessionTimeout.js:23` through it. Consider making the signature `handleLogoutauth(navigation, dispatch)` fail loudly (or drop the params and use the imported `store` and a navigation ref, as `firebaseService.cleanup()` already does) so a bad call site cannot silently skip teardown again.
2. **The same reset dispatched at the top of every login path** — including `loadUserDataFromBiometric` — *before* any new-user data is written, and before tokens are stored in `handleLogin`. That fixes Findings 1 and 11 together.
3. **`await persistor.purge()`** as part of teardown (Finding 7), plus removing `auth` from the whitelist or moving the persist engine to encrypted storage.
4. **A reset at cold start**, dispatched after `PersistGate` rehydration, unless a deliberate "resume session" path is wanted. Note this makes the `SplashScreens.js:132` bootstrap unreachable except in the language-restart case it was written for — decide explicitly which of the two behaviours you want.
5. **Non-Redux teardown in the same function:** `apiCache.clear()`, `clearAIServiceToken()`, `AsyncStorage.multiRemove([...7 attendance keys])`, `EncryptedStorage.removeItem('@attendance_sync_queue')`, a foreground-service stop that zeroes its module vars, and a Dynamics call to unmap the FCM token (Finding 5).
6. **A guard against write-back after reset** (Finding 14): drive the polling guard off a store flag set by the reset, not off per-component local state.
