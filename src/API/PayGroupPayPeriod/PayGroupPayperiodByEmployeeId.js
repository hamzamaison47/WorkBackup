import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const PayGroupPayperiodByEmployeeId = async ({employeeId}) => {
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
      const errorText = await response.text(); // Fetch error details
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }
    const payGroupPayPeriodData = await response.json();
    return payGroupPayPeriodData;
  } catch (error) {
    console.error('Failed to fetch PayGroup PayPeriodData:', error);
    throw error;
  }
};

export {PayGroupPayperiodByEmployeeId};
