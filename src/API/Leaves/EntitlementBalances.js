import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const EntitlementBalances = async ({employeeId}) => {
  const requestBody = {
    _employeeId: employeeId,
  };
  try {
    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}PREntitlementBalanceSvcGroup/PREntitlementBalanceSvc/retrieve`,
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
    const getBalance = await response.json();
    console.log('Total Entitlement Balances =================:', getBalance);

    return getBalance;
  } catch (error) {
    console.error('Failed to fetch Entitlement Balances:', error);
    throw error;
  }
};

export {EntitlementBalances};
