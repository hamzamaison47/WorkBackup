import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const GetLeaveBalance = async ({employeeId, leaveCode, leaveStartDate}) => {
  const requestBody = {
    _employeeId: employeeId,
    _leaveCode: leaveCode,
    _leaveStartDate: leaveStartDate,
  };
  try {
    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}PREmploymentInformationSvcGroup/PREmploymentInformationSvc/getLeaveBalance`,
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
    console.log('Total Leave Balance =================:', getBalance);

    return getBalance;
  } catch (error) {
    console.error('Failed to fetch employee IDs:', error);
    throw error;
  }
};

export {GetLeaveBalance};
