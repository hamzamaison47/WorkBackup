import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const PREmailTaxCertificate = async ({employeeId, startDate, endDate}) => {
  const requestBody = {
    _employeeId: employeeId,
    _startDate: startDate,
    _endDate: endDate,
  };
  try {
    console.log('startDate', startDate);
    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}RetrieveReportsSvcGroup/RetrieveReportsSvc/sendTaxCertificateEmail`,
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
    const taxCertoficateData = await response.json();
    console.log('Tax Certificate Data ==========:', taxCertoficateData);
    return taxCertoficateData;
  } catch (error) {
    console.error('Failed to fetch Tax Certificate Data:', error);
    throw error;
  }
};

export {PREmailTaxCertificate};
