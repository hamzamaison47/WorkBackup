import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

//Ensure that the createLeaveRequest function correctly uses the leaveData passed to it:

const createLeaveRequest = async leaveData => {
  // Define the request body
  const requestBody = {
    contract: leaveData,
  };

  console.log(
    'requestBody create Leave Request =================',
    requestBody,
  );

  try {
    // Get the token from the separate token file
    const accessToken = await getToken();
    // Make the POST request
    const response = await fetch(
      `${BASE_URL}PREmployeeLeavesSvcGroup/PREmployeeLeavesSvc/create`,
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
    console.log('Leave Request Created:', result);

    // Return the response data
    return result;
  } catch (error) {
    console.error('Failed to create leave request:', error);
    throw error;
  }
};

export {createLeaveRequest};
