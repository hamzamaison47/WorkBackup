import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const RetrieveAllCertificates = async () => {
  try {
    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}ESSEmploymentCertificateSvcGroup/ESSEmploymentCertificateSvc/retrieveAll`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(),
      },
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }
    const CertificateCode = await response.json();
    // console.log(
    //   'Employee Certificate Request Data =================:',
    //   CertificateCode,
    // );

    return CertificateCode;
  } catch (error) {
    console.error('Failed to fetch All employee IDs:', error);
    throw error;
  }
};

export {RetrieveAllCertificates};
