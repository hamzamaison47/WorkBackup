import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const FindByEmployeeId = async ({employeeId}) => {
  const requestBody = {
    _employeeId: employeeId,
  };

  try {
    // console.log('requestBody of EMP INFO', requestBody);

    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}PREmploymentInformationSvcGroup/PREmploymentInformationSvc/findByEmployee`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody), // Convert the request body to JSON string
      },
    );

    if (!response.ok) {
      const errorText = await response.text(); // Fetch error details
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    // console.log('result empInfo==================', result);

    return result;
  } catch (error) {
    console.error('Failed to Find Employee Data By EmployeeID:', error);
    throw error;
  }
};

export {FindByEmployeeId};
