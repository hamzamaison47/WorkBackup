// services/AzureAuthService.js
//
// Silently obtains an Azure AI Services token (https://ai.azure.com/.default)
// by exchanging the existing refresh token from the user's main login session.
// No second login prompt is shown to the user.

import {jwtDecode} from 'jwt-decode';
import {getActiveConfigData} from '../Controller/secureConfig';
import {store} from '../store';
import {setAIServiceToken} from '../store/slices/authSlice';

// In-memory cache — avoids hitting the token endpoint on every agent call
let _cachedAIToken = null; // the token string
let _cachedAITokenExpiry = null; // expiration timestamp in ms

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns a valid Azure AI Services access token.
 * Uses the cached token if still valid, otherwise exchanges the refresh
 * token from the user's existing login session — no user interaction needed.
 *
 * @returns {Promise<string|null>} AI Services token or null on failure
 */
export const getAIServiceToken = async () => {
  // Return cached token if still valid (with 1-min safety buffer)
  // if (_cachedAIToken && _cachedAITokenExpiry > Date.now() + 60_000) {
  //   console.log('✅ Using cached AI Services token');
  //   return _cachedAIToken;
  // }

  console.log('🔄 AI Services token missing or expired — refreshing...');
  return _refreshAIServiceToken();
};

// ── Internal ──────────────────────────────────────────────────────────────────

/**
 * Exchanges the user's existing refresh token for an AI Services scoped token.
 * Reads client_id and tenant_id from the active QR code config so it always
 * uses the same app registration as the main login.
 */
const _refreshAIServiceToken = async () => {
  try {
    // 1. Get the refresh token from the user's existing login session
    const {auth} = store.getState();
    const {user} = store.getState();
    const refreshToken = auth.refreshToken;

    if (!refreshToken) {
      console.error('❌ No refresh token in Redux — user must log in first.');
      return null;
    }

    // 2. Pull client_id and tenant_id from the same config used at login
    const config = await getActiveConfigData();
    if (!config?.client_id || !config?.tokenUrl) {
      console.error('❌ Missing client_id or tokenUrl in active config.');
      return null;
    }

    const tenantIdMatch = config.tokenUrl.match(/\/([0-9a-fA-F-]{36})\//);
    const tenantId = tenantIdMatch?.[1];
    if (!tenantId) {
      console.error(
        '❌ Could not extract tenant ID from tokenUrl:',
        config.tokenUrl,
      );
      return null;
    }

    // 3. Silent token exchange — no browser, no user interaction
    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    console.log('🔐 Exchanging refresh token for AI Services scope...');
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: config.client_id,
        refresh_token: refreshToken,
        scope: 'https://ai.azure.com/.default offline_access',
      }).toString(),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('❌ AI Services token exchange failed:', err);
      return null;
    }
    console.log('Respose from ai token generation :', response);
    const data = await response.json();
    const aiToken = data.access_token;

    // 4. Cache the token in memory
    _cachedAIToken = aiToken;
    _cachedAITokenExpiry = _getTokenExpiry(aiToken);

    // 5. Also store in Redux for anything that reads it from there
    store.dispatch(setAIServiceToken(aiToken));

    console.log('✅ AI Services token obtained and cached successfully');
    return aiToken;
  } catch (error) {
    console.error('Error refreshing AI Services token:', error);
    return null;
  }
};

/**
 * Reads the exp claim from a JWT and returns it as milliseconds.
 * Falls back to 5 minutes from now if the token can't be decoded.
 */
const _getTokenExpiry = token => {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000;
  } catch {
    console.warn('Could not decode AI token expiry — defaulting to 5 min');
    return Date.now() + 5 * 60 * 1000;
  }
};

/**
 * Clears the in-memory AI token cache (call this on logout).
 */
export const clearAIServiceToken = () => {
  _cachedAIToken = null;
  _cachedAITokenExpiry = null;
};
