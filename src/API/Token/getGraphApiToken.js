// Token/getGraphApiToken.js
import {store} from '../../store';
import {
  setGraphAccessToken,
  setGraphRefreshToken,
} from '../../store/slices/authSlice';
import {refresh, authorize} from 'react-native-app-auth';
import {
  getGraphConsentConfiguration, // ← new import
} from '../../Controller/configuration';

export const getGraphApiToken = async () => {
  const storeState = store.getState();

  // ── Get the signed-in user's email to pin the account ────────────────────
  // Adjust the path below to match wherever email is stored in your user slice
  const loginHint =
    storeState.user?.userData?.email ??
    storeState.user?.userData?.userPrincipalName ??
    null;

  // ── 1. Refresh existing Graph token silently ──────────────────────────────
  const graphRefreshToken = storeState.auth.graphRefreshToken;
  if (graphRefreshToken) {
    try {
      const graphConfig = await getGraphConsentConfiguration(loginHint);
      const result = await refresh(graphConfig, {
        refreshToken: graphRefreshToken,
      });
      store.dispatch(setGraphAccessToken(result.accessToken));
      store.dispatch(setGraphRefreshToken(result.refreshToken));
      return result.accessToken;
    } catch (err) {
      console.warn('Graph token refresh failed:', err.message);
    }
  }

  // ── 2. No Graph token — silent authorize with pinned account ──────────────
  try {
    const graphConfig = await getGraphConsentConfiguration(loginHint);
    const result = await authorize(graphConfig);
    store.dispatch(setGraphAccessToken(result.accessToken));
    store.dispatch(setGraphRefreshToken(result.refreshToken));
    return result.accessToken;
  } catch (err) {
    const msg = err.message ?? '';
    if (
      msg.includes('interaction_required') ||
      msg.includes('consent_required') ||
      msg.includes('AADSTS65001') ||
      msg.includes('login_required') ||
      msg.includes('AADSTS16000') // ← also catch this here as fallback
    ) {
      throw new Error('GRAPH_CONSENT_REQUIRED');
    }
    throw err;
  }
};
