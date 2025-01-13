import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const RetrieveAll = async ({employeeId}) => {
  const requestBody = {
    _employeeId: employeeId,
  };
  try {
    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}PREmployeeEOSRequestsSvcGroup/PREmployeeEOSRequestsSvc/retriveEmployeeReportees`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
    );
    // console.log("Request Body ============:", JSON.stringify(requestBody));
    if (!response.ok) {
      const errorText = await response.text(); // Fetch error details
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }
    const esoData = await response.json();
    console.log('RetrieveAll API Data ==========:', esoData);
    return esoData;
  } catch (error) {
    console.error('Failed to fetch leaves123:', error);
    throw error;
  }
};

export {RetrieveAll};
