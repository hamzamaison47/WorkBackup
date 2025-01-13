import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const ResonCode = async () => {
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
      },
    );
    // console.log("Request Body ============:", JSON.stringify(requestBody));
    if (!response.ok) {
      const errorText = await response.text(); // Fetch error details
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }
    const esoData = await response.json();
    console.log('Retrieve Reason Code ==========:', esoData);
    return esoData;
  } catch (error) {
    console.error('Failed to fetch reason codes:', error);
    throw error;
  }
};

export {ResonCode};
