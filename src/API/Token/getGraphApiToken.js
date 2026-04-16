// // Token/getGraphApiToken.js
// import {store} from '../../store';
// import {
//   setGraphAccessToken,
//   setGraphRefreshToken,
//   setGraphUserId,
// } from '../../store/slices/authSlice';
// import {refresh, authorize} from 'react-native-app-auth';
// import {getGraphConsentConfiguration} from '../../Controller/configuration';
// import {apiCache} from '../../utils/apiCache';

// export const getGraphApiToken = async () => {
//   const storeState = store.getState();

//   // 1. FIX: Use 'email' because your handleSuccessfulLogin stores the email
//   // but does NOT store an 'id' or 'userPrincipalName' field.
//   const currentUserId = storeState.user?.userData?.email;

//   const savedGraphUserId = storeState.auth?.graphUserId;

//   console.log('--- IDENTITY CHECK ---');
//   console.log('Current User (Hammad?):', currentUserId);
//   console.log('Saved Graph ID (Hamza?):', savedGraphUserId);

//   // 2. FIX: Handle the case where currentUserId is null/undefined
//   // (e.g., if the user is logging out or session is cleared)
//   const isMismatch = !currentUserId || currentUserId !== savedGraphUserId;
//   console.log('IDs Match?:', !isMismatch);

//   const loginHint = currentUserId ?? null;

//   // 3. CRITICAL CHECK: Clear if mismatch
//   let graphRefreshToken = null;

//   if (isMismatch) {
//     console.log('⚠️ IDENTITY MISMATCH: Clearing cache and old tokens...');
//     apiCache.clear();

//     store.dispatch(setGraphAccessToken(null));
//     store.dispatch(setGraphRefreshToken(null));
//     store.dispatch(setGraphUserId(null));

//     // graphRefreshToken remains null here to skip the Refresh block
//   } else {
//     graphRefreshToken = storeState.auth.graphRefreshToken;
//   }

//   // ── 1. Silent Refresh ─────────────────────────────────────────────────────
//   if (graphRefreshToken) {
//     try {
//       console.log('🔄 Attempting SILENT REFRESH for:', currentUserId);
//       // Pass the loginHint to ensure MS knows which account we are refreshing
//       const graphConfig = await getGraphConsentConfiguration(loginHint, 'none');
//       const result = await refresh(graphConfig, {
//         refreshToken: graphRefreshToken,
//       });

//       store.dispatch(setGraphAccessToken(result.accessToken));
//       store.dispatch(setGraphRefreshToken(result.refreshToken));
//       store.dispatch(setGraphUserId(currentUserId));

//       console.log('✅ REFRESH SUCCESS');
//       return result.accessToken;
//     } catch (err) {
//       console.warn(
//         'Graph token refresh failed, proceeding to authorization:',
//         err.message,
//       );
//     }
//   }

//   // ── 2. Fresh Authorization ───────────────────────────────────────────────
//   try {
//     console.log('🚀 Opening Browser for FRESH AUTHORIZATION (select_account)');
//     const graphConfig = await getGraphConsentConfiguration(
//       loginHint,
//       'select_account',
//     );
//     const result = await authorize(graphConfig);

//     console.log('✅ AUTHORIZE SUCCESS');

//     store.dispatch(setGraphAccessToken(result.accessToken));
//     store.dispatch(setGraphRefreshToken(result.refreshToken));
//     // Save the current app user's email as the owner of this Graph token
//     store.dispatch(setGraphUserId(currentUserId));

//     return result.accessToken;
//   } catch (err) {
//     // ... error handling
//     throw err;
//   }
// };
// Token/getGraphApiToken.js
import {store} from '../../store';
import {
  setGraphAccessToken,
  setGraphRefreshToken,
  setGraphUserId,
} from '../../store/slices/authSlice';
import {refresh, authorize} from 'react-native-app-auth';
import {getGraphConsentConfiguration} from '../../Controller/configuration';

export const getGraphApiToken = async () => {
  const storeState = store.getState();
  const currentUserId = storeState.user?.userData?.email;

  if (!currentUserId) {
    throw new Error('No authenticated user found. Please log in first.');
  }

  const savedGraphUserId = storeState.auth?.graphUserId;
  const graphAccessToken = storeState.auth?.graphAccessToken;
  const graphRefreshToken = storeState.auth?.graphRefreshToken;

  const isSameUser = savedGraphUserId === currentUserId;

  // ── 1. Return cached access token if same user ───────────────────────────
  if (isSameUser && graphAccessToken) {
    console.log('✅ Using cached Graph access token');
    return graphAccessToken;
  }

  // ── 2. If user switched, wipe old Graph tokens ───────────────────────────
  // But DON'T clear graphRefreshToken if it's the same user —
  // a missing access token doesn't mean the session is gone.
  if (!isSameUser && savedGraphUserId) {
    console.warn('👤 User switched — clearing previous Graph tokens');
    store.dispatch(setGraphAccessToken(null));
    store.dispatch(setGraphRefreshToken(null));
    store.dispatch(setGraphUserId(null));
    // Fall through to authorize() for the new user
  }

  // ── 3. Silent refresh — works across app restarts if token is persisted ──
  // Use the refresh token for the current user (only if user didn't switch)
  const tokenToRefresh = isSameUser ? graphRefreshToken : null;

  if (tokenToRefresh) {
    try {
      console.log('🔄 Attempting silent Graph token refresh...');
      const graphConfig = await getGraphConsentConfiguration(
        currentUserId,
        'none', // ← Critical: no UI allowed
      );

      const result = await refresh(graphConfig, {
        refreshToken: tokenToRefresh,
      });

      store.dispatch(setGraphAccessToken(result.accessToken));
      store.dispatch(
        setGraphRefreshToken(result.refreshToken ?? tokenToRefresh),
      );
      store.dispatch(setGraphUserId(currentUserId));

      console.log('✅ Silent refresh succeeded');
      return result.accessToken;
    } catch (err) {
      console.warn('⚠️ Silent refresh failed:', err.message);
      // Refresh token is genuinely expired/revoked — clear it and
      // fall through to ONE interactive authorize() below
      store.dispatch(setGraphAccessToken(null));
      store.dispatch(setGraphRefreshToken(null));
      store.dispatch(setGraphUserId(null));
    }
  }

  // ── 4. One-time interactive authorize() — only hits when truly needed ────
  // After this succeeds, step 2 or 3 handles all future calls silently.
  try {
    console.log('🚀 One-time Graph authorization required...');
    const graphConfig = await getGraphConsentConfiguration(
      currentUserId,
      'select_account',
    );

    const result = await authorize(graphConfig);

    store.dispatch(setGraphAccessToken(result.accessToken));
    store.dispatch(setGraphRefreshToken(result.refreshToken));
    store.dispatch(setGraphUserId(currentUserId));

    console.log(
      '✅ Graph authorization succeeded — future calls will be silent',
    );
    return result.accessToken;
  } catch (err) {
    console.error('❌ Graph authorization failed:', err.message);
    throw err;
  }
};
