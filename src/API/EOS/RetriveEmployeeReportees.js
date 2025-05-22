import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const RetriveEmployeeReportees = async ({employeeId}) => {
  const requestBody = {
    _employeeId: employeeId,
  };
  try {
    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}PREmploymentInformationSvcGroup/PREmploymentInformationSvc/retriveEmployeeReportees`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
    );
    console.log('Request Body ============:', JSON.stringify(requestBody));
    if (!response.ok) {
      const errorText = await response.text(); // Fetch error details
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }
    const esoData = await response.json();
    console.log('Retrieve Reportees  API Data ==========:', esoData);
    return esoData;
  } catch (error) {
    console.error('Failed to fetch reportees:', error);
    throw error;
  }
};

export {RetriveEmployeeReportees};
