import {tokenUrl, client_id, client_secret, grant_type, resource} from '@env';

export const getToken = async () => {
  const url = tokenUrl;

  const details = {
    client_id: client_id,
    client_secret: client_secret,
    grant_type: grant_type,
    resource: resource,
  };

  console.log('ENV Token details ===========', details);

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

  try {
    const response = await fetch(url, requestOptions);
    if (!response.ok) {
      const errorText = await response.text(); // Fetch error details
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    const accessToken = data.access_token;

    // Log the access token
    console.log('Access Token ============:', accessToken);

    return accessToken; // Return the access token
  } catch (error) {
    console.error('Failed to fetch token:', error);
    throw error;
  }
};
