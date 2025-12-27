import {getActiveConfigData} from '../../Controller/secureConfig';
import {store} from '../../store';
import {setAccessToken, setRefreshToken} from '../../store/slices/authSlice';
import {refresh} from 'react-native-app-auth';
import {getAzureConfigurationV2} from '../../Controller/configuration';

export const getToken = async () => {
  try {
    // Get configuration from secure storage instead of env
    const config = await getActiveConfigData();
    if (!config) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const {tokenUrl, client_id, client_secret, grant_type, resource} = config;

    // Validate required configuration fields
    if (!tokenUrl || !client_id || !client_secret || !grant_type || !resource) {
      throw new Error(
        'Invalid configuration. Missing required fields for authentication.',
      );
    }

    const url = tokenUrl;

    const details = {
      client_id: client_id,
      client_secret: client_secret,
      grant_type: grant_type,
      resource: resource,
    };

    const storeState = store.getState();
    const userData = storeState.user.userData; // 👈 access user slice data
    const refreshToken = storeState.auth.refreshToken; // Get from Redux

    if (userData != null) {
      if (userData.isDynamicsUser === 'Yes') {
        if (refreshToken != null || refreshToken !== 'undefined') {
          const refreshResult = await refresh(await getAzureConfigurationV2(), {
            refreshToken: refreshToken,
          });

          // Update Redux state with new tokens
          store.dispatch(setAccessToken(refreshResult.accessToken));
          store.dispatch(setRefreshToken(refreshResult.refreshToken));

          return refreshResult.accessToken;
        }
      }
    }

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
    const accessToken = data.access_token;

    if (!accessToken) {
      throw new Error('No access token received from server');
    }

    // console.log('Access Token received successfully', accessToken);
    return accessToken;
  } catch (error) {
    console.error('Failed to fetch token:', error);
    throw error;
  }
};
