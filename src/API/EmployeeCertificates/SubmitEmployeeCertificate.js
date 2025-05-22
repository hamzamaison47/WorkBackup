import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const SubmitEmployeeCertificate = async ({recId}) => {
  const requestBody = {
    _recId: recId,
  };

  try {
    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}EssWorkflowSvcGroup/ESSWorkflowSvc/submitEmploymentCertificateRequestByRecId`,
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
    const result = await response.json();
    console.log('Employee Certificate Request Submitted Successfully:', result);

    return result;
  } catch (error) {
    console.error('Failed to submit Employee Certificate Request:', error);
    throw error;
  }
};

export {SubmitEmployeeCertificate};
