import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const DeleteServiceRequest = async ({recordsRecId}) => {
  // Define the request body
  const requestBody = {
    _recordsRecId: recordsRecId,
  };

  try {
    console.log('recordsRecId0-0-0-0-0-0-0---0-0-0-0--', recordsRecId);

    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}PREmployeeEOSRequestsSvcGroup/PREmployeeEOSRequestsSvc/delete`,
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
    console.log('EOS request deleted successfully:', result);

    // Return the response data
    return result;
  } catch (error) {
    console.error('Failed to delete EOS Request:', error);
    throw error;
  }
};

export {DeleteServiceRequest};
