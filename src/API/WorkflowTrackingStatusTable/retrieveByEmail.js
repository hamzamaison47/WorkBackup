import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

export const retrieveByEmail = async ({email}) => {
  const requestBody = {
    _email: email,
  };
  try {
    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}WorkflowTrackingStatusTableSvcGroup/WorkflowTrackingStatusTableSvc/retrieveByEmail`,
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
    const employmentInformation = await response.json();
    return employmentInformation;
  } catch (error) {
    console.error('Failed to fetch Work Flow Data:', error);
    throw error;
  }
};
