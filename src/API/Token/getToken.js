import {getActiveConfigData} from '../../Controller/secureConfig';

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

    // console.log('Config Token details:', {
    //   tokenUrl,
    //   client_id: client_id.substring(0, 8) + '...',
    //   grant_type,
    //   resource,
    // });

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

    // console.log('Access Token received successfully');
    return accessToken;
  } catch (error) {
    console.error('Failed to fetch token:', error);
    throw error;
  }
};
