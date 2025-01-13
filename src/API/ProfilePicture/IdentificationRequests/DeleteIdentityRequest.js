import {BASE_URL} from '@env';
import {getToken} from '../../Token/getToken';

const DeleteIdentityRequest = async ({recordsRecId}) => {
  // Define the request body
  const requestBody = {
    _recordsRecId: recordsRecId,
  };

  try {
    // Get the token from the separate token file
    const accessToken = await getToken();
    // Make the POST request
    const response = await fetch(
      `${BASE_URL}HcmPersonIdentificationNumberSvcGroup/HcmPersonIdentificationNumberSvc/delete`,
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
    console.log('Identification Details Deleted:', result);

    // Return the response data
    return result;
  } catch (error) {
    console.error('Failed to delete Identification Details:', error);
    throw error;
  }
};

export {DeleteIdentityRequest};
