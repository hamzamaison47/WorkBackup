// Token/getGraphApiToken.js
import {store} from '../../store';
import {
  setGraphAccessToken,
  setGraphRefreshToken,
} from '../../store/slices/authSlice';
import {refresh, authorize} from 'react-native-app-auth';
import {getActiveConfigData} from '../../Controller/secureConfig';

const getGraphScopedConfig = async () => {
  const config = await getActiveConfigData();
  const tenantIdMatch = config.tokenUrl.match(/\/([0-9a-fA-F-]{36})\//);
  const tenantId = tenantIdMatch?.[1];
  if (!tenantId) throw new Error('Could not extract tenant ID.');

  return {
    issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
    clientId: config.client_id,
    redirectUrl: 'authentication://callback/',
    scopes: [
      // ✅ Graph-only scopes — NO resource.default here
      'openid',
      'offline_access',
      'https://graph.microsoft.com/Calendars.ReadWrite',
    ],
  };
};

export const getGraphApiToken = async () => {
  const storeState = store.getState();

  // ── 1. Already have a Graph-specific refresh token (best case) ────────────
  const graphRefreshToken = storeState.auth.graphRefreshToken;
  if (graphRefreshToken) {
    try {
      const graphConfig = await getGraphScopedConfig();
      const result = await refresh(graphConfig, {
        refreshToken: graphRefreshToken,
      });
      store.dispatch(setGraphAccessToken(result.accessToken));
      store.dispatch(setGraphRefreshToken(result.refreshToken));
      return result.accessToken;
    } catch (err) {
      console.warn('Graph refresh failed:', err.message);
      // Fall through to try Dynamics refresh token next
    }
  }

  // ── 2. Try exchanging the Dynamics refresh token for a Graph token ────────
  // This works silently because same client_id, same tenant, user already
  // consented — Azure issues a Graph-scoped access token without any prompt
  const dynamicsRefreshToken = storeState.auth.refreshToken;
  if (dynamicsRefreshToken) {
    try {
      const graphConfig = await getGraphScopedConfig();
      const result = await refresh(graphConfig, {
        refreshToken: dynamicsRefreshToken,
      });
      // Save to Graph-specific slots so Dynamics token is untouched
      store.dispatch(setGraphAccessToken(result.accessToken));
      store.dispatch(setGraphRefreshToken(result.refreshToken));
      return result.accessToken;
    } catch (err) {
      console.warn('Cross-resource token exchange failed:', err.message);

      if (err.message?.includes('AADSTS65001')) {
        // Consent not yet granted for Graph — bubble up for UI to handle
        throw new Error('GRAPH_CONSENT_REQUIRED');
      }

      throw err;
    }
  }

  // ── 3. No tokens at all ───────────────────────────────────────────────────
  throw new Error('No active session. Please log in first.');
};
