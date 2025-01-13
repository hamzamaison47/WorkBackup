import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const PayGroupPayPeriod = async ({employeeId}) => {
  const requestBody = {
    _employeeId: employeeId,
  };
  try {
    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}PRPayGroupPayPeriodSvcGroup/PRPayGroupPayPeriodSvc/findByEmployee`,
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
    const employeeData = await response.json();
    console.log('Pay Group employee ID Data =================:', employeeData);

    return employeeData;
  } catch (error) {
    console.error('Failed to fetch Pay Group employee ID Data:', error);
    throw error;
  }
};

export {PayGroupPayPeriod};
