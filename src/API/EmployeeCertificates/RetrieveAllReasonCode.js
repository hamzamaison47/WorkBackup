import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const RetrieveAllReasonCode = async () => {
  try {
    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}HcmReasonCodeSvcGroup/HcmReasonCodeSvc/retrieveAll`,
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
    const ReasonCodeRequest = await response.json();
    // console.log(
    //   'Employee Certificate Request Data =================:',
    //   ReasonCodeRequest,
    // );

    return ReasonCodeRequest;
  } catch (error) {
    console.error('Failed to fetch All Reason Code:', error);
    throw error;
  }
};

export {RetrieveAllReasonCode};
