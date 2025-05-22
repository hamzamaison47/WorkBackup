import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const RetrieveAllRequestedFor = async () => {
  try {
    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}ESSRequestedForSvcGroup/ESSRequestedForSvc/retrieveAll`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(),
      },
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }
    const RequestedForCode = await response.json();
    // console.log(
    //   'Employee Certificate Request Data =================:',
    //   RequestedForCode,
    // );

    return RequestedForCode;
  } catch (error) {
    console.error('Failed to fetch All Requested For:', error);
    throw error;
  }
};

export {RetrieveAllRequestedFor};
