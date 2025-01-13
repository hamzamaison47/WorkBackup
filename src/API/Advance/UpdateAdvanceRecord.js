import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

//Ensure that the createLeaveRequest function correctly uses the leaveData passed to it:

const UpdateAdvanceRecord = async advanceData => {
  // Define the request body
  const requestBody = {
    contract: advanceData,
  };

  console.log('Update Advance Request =================', requestBody);

  try {
    // Get the token from the separate token file
    const accessToken = await getToken();
    // Make the POST request
    const response = await fetch(
      `${BASE_URL}PREmployeeAdvanceRequestSvcGroup/PREmployeeAdvanceRequestSvc/update`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
    );

    // Check if the response is successful
    if (!response.ok) {
      const errorText = await response.text(); // Fetch error details
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    // Parse the JSON response
    const result = await response.json();
    console.log('ADvance Request Updated:', result);

    // Return the response data
    return result;
  } catch (error) {
    console.error('Failed to update Advance request:', error);
    throw error;
  }
};

export {UpdateAdvanceRecord};
