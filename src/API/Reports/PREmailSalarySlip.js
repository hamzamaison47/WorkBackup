import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';
const PREmailSalarySlip = async ({payPeriodCode, employeeId}) => {
  const requestBody = {
    _payPeriodCode: payPeriodCode,
    _employeeId: employeeId,
  };
  try {
    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}RetrieveReportsSvcGroup/RetrieveReportsSvc/sendSalarySlipEmail`,
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
    const salarySlipData = await response.json();
    return salarySlipData;
  } catch (error) {
    console.error('Failed to fetch Salary Slip Data:', error);
    throw error;
  }
};
export {PREmailSalarySlip};
