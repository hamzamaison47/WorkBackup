import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const FindEmployeeBankAccount = async ({employeeId}) => {
  const requestBody = {
    _employeeId: employeeId,
  };

  try {
    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}HcmWorkerESSBankAccountSvcGroup/HcmWorkerESSBankAccountSvc/findByEmployee`,
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

    // Parse the JSON response
    const employeeData = await response.json();
    // console.log(
    //   'Employee ESS Bank Account Data =================:',
    //   employeeData,
    // );

    return employeeData;
  } catch (error) {
    console.error('Failed to fetch ESS Employee Bank Account IDs Data:', error);
    throw error;
  }
};

export {FindEmployeeBankAccount};
