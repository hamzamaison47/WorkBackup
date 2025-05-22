import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const RetrieveLeaveCodes = async ({dataAreaId}) => {
  const requestBody = {
    _dataAreaId: dataAreaId,
  };
  try {
    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}PRLeaveSvcGroup/PRLeaveSvc/retrieveAll`,
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
    const leaveCodes = await response.json();
    // console.log('Leave Codes Data =================:', leaveCodes);

    return leaveCodes;
  } catch (error) {
    console.error('Failed to fetch employee IDs:', error);
    throw error;
  }
};

export {RetrieveLeaveCodes};
