import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const FindAdvanceRequest = async ({requestId}) => {
  const requestBody = {
    _requestId: requestId,
  };

  try {
    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}PREmployeeAdvanceRequestSvcGroup/PREmployeeAdvanceRequestSvc/find`,
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

    const result = await response.json();
    console.log('Find Records Request Successfully:', result);

    return result;
  } catch (error) {
    console.error('Failed to Find Records Request:', error);
    throw error;
  }
};

export {FindAdvanceRequest};
