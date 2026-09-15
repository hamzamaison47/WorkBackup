// import {getActiveConfigData} from '../../Controller/secureConfig';
// import {store} from '../../store';
// import {setAccessToken, setRefreshToken} from '../../store/slices/authSlice';
// import {refresh} from 'react-native-app-auth';
// import {getAzureConfigurationV2} from '../../Controller/configuration';

// export const getToken = async () => {
//   try {
//     const config = await getActiveConfigData();
//     if (!config) {
//       throw new Error('No configuration found. Please scan QR code first.');
//     }

//     const {tokenUrl, client_id, client_secret, grant_type, resource} = config;

//     if (!tokenUrl || !client_id || !client_secret || !grant_type || !resource) {
//       throw new Error(
//         'Invalid configuration. Missing required fields for authentication.',
//       );
//     }

//     const storeState = store.getState();
//     const userData = storeState.user.userData;
//     const refreshToken = storeState.auth.refreshToken;
//     const accessToken = storeState.auth.accessToken;
//     // console.log('=-=-=-=-=-=-==-=-=-=-=-==-=', userData);
//     // ✅ CHANGED: For Dynamics API calls, ALWAYS use Azure AD tokens
//     // Try to refresh Azure token if available
//     if (userData?.isDynamicsUser === 'Yes' && refreshToken && accessToken) {
//       try {
//         const refreshResult = await refresh(await getAzureConfigurationV2(), {
//           refreshToken: refreshToken,
//         });

//         store.dispatch(setAccessToken(refreshResult.accessToken));
//         store.dispatch(setRefreshToken(refreshResult.refreshToken));

//         return refreshResult.accessToken;
//       } catch (refreshError) {
//         console.warn(
//           'Token refresh failed, falling back to client credentials:',
//           refreshError.message,
//         );
//         // Fall through to client credentials
//       }
//     }

//     // ✅ DEFAULT: Always use client credentials for Dynamics API
//     // This works for BOTH Google and Microsoft users
//     const url = tokenUrl;
//     const details = {
//       client_id: client_id,
//       client_secret: client_secret,
//       grant_type: grant_type,
//       resource: resource,
//     };

//     let formBody = [];
//     for (const property in details) {
//       const encodedKey = encodeURIComponent(property);
//       const encodedValue = encodeURIComponent(details[property]);
//       formBody.push(encodedKey + '=' + encodedValue);
//     }
//     formBody = formBody.join('&');

//     const requestOptions = {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded',
//       },
//       body: formBody,
//     };

//     const response = await fetch(url, requestOptions);
//     if (!response.ok) {
//       const errorText = await response.text();
//       throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
//     }

//     const data = await response.json();
//     const newAccessToken = data.access_token;

//     if (!newAccessToken) {
//       throw new Error('No access token received from server');
//     }

//     return newAccessToken;
//   } catch (error) {
//     console.error('Failed to fetch token:', error);
//     throw error;
//   }
// };
import {getActiveConfigData} from '../../Controller/secureConfig';
import {store} from '../../store';
import {setAccessToken, setRefreshToken} from '../../store/slices/authSlice';
import {refresh} from 'react-native-app-auth';
import {getAzureConfigurationV2} from '../../Controller/configuration';

// ─────────────────────────────────────────────
// Token cache + in-flight de-dupe.
//
// Previously EVERY SOAP call independently fetched its own token — at app
// boot, 4-6 concurrent SOAP calls meant 4-6 concurrent OAuth requests to
// login.windows.net, each blocking its own SOAP call until it resolved. This
// doubled the connection burden during the exact window causing ERR_NETWORK
// on the attendance endpoint. Now: cache the token for its actual lifetime,
// and de-dupe concurrent fetches so a boot-time burst results in ONE token
// request, not one per caller.
// ─────────────────────────────────────────────
let cachedToken = null;
let cachedTokenExpiresAt = 0;
let inFlightTokenRequest = null;

// Refresh 60s before actual expiry so a call never starts a SOAP request
// with a token that expires mid-flight.
const EXPIRY_SAFETY_MARGIN_MS = 60_000;

const isTokenStillValid = () =>
  cachedToken && Date.now() < cachedTokenExpiresAt - EXPIRY_SAFETY_MARGIN_MS;

const fetchNewToken = async () => {
  const config = await getActiveConfigData();
  if (!config) {
    throw new Error('No configuration found. Please scan QR code first.');
  }

  const {tokenUrl, client_id, client_secret, grant_type, resource} = config;

  if (!tokenUrl || !client_id || !client_secret || !grant_type || !resource) {
    throw new Error(
      'Invalid configuration. Missing required fields for authentication.',
    );
  }

  const storeState = store.getState();
  const userData = storeState.user.userData;
  const refreshToken = storeState.auth.refreshToken;
  const accessToken = storeState.auth.accessToken;

  if (userData?.isDynamicsUser === 'Yes' && refreshToken && accessToken) {
    try {
      const refreshResult = await refresh(await getAzureConfigurationV2(), {
        refreshToken: refreshToken,
      });

      store.dispatch(setAccessToken(refreshResult.accessToken));
      store.dispatch(setRefreshToken(refreshResult.refreshToken));

      // Azure AD tokens are typically ~60-90 min; without an expires_in field
      // here, default to a conservative 55 minutes.
      cachedToken = refreshResult.accessToken;
      cachedTokenExpiresAt = Date.now() + 55 * 60 * 1000;
      return cachedToken;
    } catch (refreshError) {
      console.warn(
        'Token refresh failed, falling back to client credentials:',
        refreshError.message,
      );
      // Fall through to client credentials
    }
  }

  const url = tokenUrl;
  const details = {client_id, client_secret, grant_type, resource};

  let formBody = [];
  for (const property in details) {
    const encodedKey = encodeURIComponent(property);
    const encodedValue = encodeURIComponent(details[property]);
    formBody.push(encodedKey + '=' + encodedValue);
  }
  formBody = formBody.join('&');

  const requestOptions = {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: formBody,
  };

  const response = await fetch(url, requestOptions);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const newAccessToken = data.access_token;

  if (!newAccessToken) {
    throw new Error('No access token received from server');
  }

  cachedToken = newAccessToken;
  // Client-credentials grants return expires_in (seconds) — use it if
  // present, otherwise fall back to the same conservative 55 min.
  const expiresInMs = data.expires_in
    ? Number(data.expires_in) * 1000
    : 55 * 60 * 1000;
  cachedTokenExpiresAt = Date.now() + expiresInMs;

  return cachedToken;
};

export const getToken = async () => {
  // Serve from cache when still valid — no network call at all.
  if (isTokenStillValid()) {
    return cachedToken;
  }

  // De-dupe: if a fetch is already in flight (e.g. several SOAP calls hit
  // an expired/cold cache in the same instant at boot), every caller shares
  // the SAME request instead of each firing its own.
  if (inFlightTokenRequest) {
    return inFlightTokenRequest;
  }

  inFlightTokenRequest = (async () => {
    try {
      return await fetchNewToken();
    } catch (error) {
      console.error('Failed to fetch token:', error);
      // Invalidate cache on failure so the next call retries cleanly.
      cachedToken = null;
      cachedTokenExpiresAt = 0;
      throw error;
    } finally {
      inFlightTokenRequest = null;
    }
  })();

  return inFlightTokenRequest;
};

// Exposed for explicit prewarming (e.g. TimeClockScreen's mount effect) —
// now this actually matters, since the result gets cached and reused by
// every subsequent getToken() call instead of being thrown away.
export const invalidateTokenCache = () => {
  cachedToken = null;
  cachedTokenExpiresAt = 0;
};
