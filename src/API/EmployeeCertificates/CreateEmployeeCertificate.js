import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const CreateEmployeeCertificate = async certificateData => {
  const requestBody = {
    contract: certificateData,
  };

  try {
    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}/ESSEmploymentCertificateSvcGroup/ESSEmploymentCertificateSvc/create`,
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
    console.log('Employee Certificate Request Created:', result);

    return result;
  } catch (error) {
    console.error('Failed to create Employee Certificate:', error);
    throw error;
  }
};

export {CreateEmployeeCertificate};
