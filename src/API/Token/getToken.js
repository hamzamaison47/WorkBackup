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
//     const accessToken = storeState.auth.accessToken; // Azure token
//     const idToken = storeState.auth.idToken; // Google token

//     // ✅ FIX: If user logged in with Google, return the Google ID token
//     if (idToken && !accessToken) {
//       console.log('Using Google ID token for API calls');
//       return idToken;
//     }

//     // ✅ If user logged in with Azure and has a valid token, try to refresh it
//     if (userData?.isDynamicsUser === 'Yes' && refreshToken) {
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
//         // Fall through to client credentials flow below
//       }
//     }

//     // ✅ Fallback: Use client credentials flow
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

export const getToken = async () => {
  try {
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

    // ✅ CHANGED: For Dynamics API calls, ALWAYS use Azure AD tokens
    // Try to refresh Azure token if available
    if (userData?.isDynamicsUser === 'Yes' && refreshToken && accessToken) {
      try {
        const refreshResult = await refresh(await getAzureConfigurationV2(), {
          refreshToken: refreshToken,
        });

        store.dispatch(setAccessToken(refreshResult.accessToken));
        store.dispatch(setRefreshToken(refreshResult.refreshToken));

        return refreshResult.accessToken;
      } catch (refreshError) {
        console.warn(
          'Token refresh failed, falling back to client credentials:',
          refreshError.message,
        );
        // Fall through to client credentials
      }
    }

    // ✅ DEFAULT: Always use client credentials for Dynamics API
    // This works for BOTH Google and Microsoft users
    const url = tokenUrl;
    const details = {
      client_id: client_id,
      client_secret: client_secret,
      grant_type: grant_type,
      resource: resource,
    };

    let formBody = [];
    for (const property in details) {
      const encodedKey = encodeURIComponent(property);
      const encodedValue = encodeURIComponent(details[property]);
      formBody.push(encodedKey + '=' + encodedValue);
    }
    formBody = formBody.join('&');

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
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

    return newAccessToken;
  } catch (error) {
    console.error('Failed to fetch token:', error);
    throw error;
  }
};
