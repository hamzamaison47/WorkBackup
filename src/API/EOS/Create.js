import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const Create = async eosData => {
  const requestBody = {
    contract: eosData,
  };

  console.log('requestBody  create EOS Request =================', requestBody);

  try {
    const accessToken = await getToken();
    // Make the POST request
    const response = await fetch(
      `${BASE_URL}PREmployeeEOSRequestsSvcGroup/PREmployeeEOSRequestsSvc/create`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody), // Convert the request body to JSON string
      },
    );

    // Check if the response is successful
    if (!response.ok) {
      const errorText = await response.text(); // Fetch error details
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    // Parse the JSON response
    const result = await response.json();
    console.log('EOS Request Created:', result);

    // Return the response data
    return result;
  } catch (error) {
    console.error('Failed to create EOS request:', error);
    // throw error;
  }
};

export {Create};
