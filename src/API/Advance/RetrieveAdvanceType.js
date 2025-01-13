import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const RetrieveAdvanceType = async () => {
  try {
    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}PRAdvanceTypesSvcGroup/PRAdvanceTypesSvc/retrieveAll`,
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
    const leaveCodes = await response.json();
    console.log(
      'Advance Type Code Request Data =================:',
      leaveCodes,
    );

    return leaveCodes;
  } catch (error) {
    console.error('Failed to fetch All Advance Type Code Request:', error);
    throw error;
  }
};

export {RetrieveAdvanceType};
