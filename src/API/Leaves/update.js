import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const update = async leaveData => {
  const requestBody = {
    contract: leaveData,
  };

  try {
    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}PREmployeeLeavesSvcGroup/PREmployeeLeavesSvc/Update`,
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
    // console.log('Leave Request Updated:', result);

    return result;
  } catch (error) {
    console.error('Failed to update leave request:', error);
    throw error;
  }
};

export {update};
