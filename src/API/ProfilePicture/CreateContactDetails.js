import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const CreateContactDetails = async contactData => {
  const requestBody = {
    contract: contactData,
  };

  try {
    console.log('requestBody-0-0-0-0-0-0-0-0-0--0-', requestBody);
    const accessToken = await getToken();
    // Make the POST request
    const response = await fetch(
      `${BASE_URL}LogisticsElectronicAddressSvcGroup/LogisticsElectronicAddressSvc/create`,
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
    console.log('Contact Details Created:-------------------------', result);

    // Return the response data
    return result;
  } catch (error) {
    console.error('Failed to create Contact Details:', error);
    throw error;
  }
};

export {CreateContactDetails};
