import {BASE_URL} from '@env';
import {getToken} from '../../Token/getToken';

const UpdateIdentityRequest = async identityData => {
  const requestBody = {
    contract: identityData,
  };

  try {
    console.log('Update Identity Request', identityData);
    const accessToken = await getToken();
    // Make the POST request
    const response = await fetch(
      `${BASE_URL}HcmPersonIdentificationNumberSvcGroup/HcmPersonIdentificationNumberSvc/update`,
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
    console.log('Identification Details Updated:', result);

    // Return the response data
    return result;
  } catch (error) {
    console.error('Failed to Updated Identification Details:', error);
    throw error;
  }
};

export {UpdateIdentityRequest};
