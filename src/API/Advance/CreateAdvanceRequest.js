import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const CreateAdvanceRequest = async advanceData => {
  const requestBody = {
    contract: advanceData,
  };

  try {
    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}/PREmployeeAdvanceRequestSvcGroup/PREmployeeAdvanceRequestSvc/create`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    // Parse the JSON response
    const result = await response.json();
    console.log('Advance Request Created:', result);

    return result;
  } catch (error) {
    console.error('Failed to create Advance request:', error);
    throw error;
  }
};

export {CreateAdvanceRequest};
