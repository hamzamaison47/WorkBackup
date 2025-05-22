import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const DeleteCertificate = async ({recordsRecId}) => {
  const requestBody = {
    _recordsRecId: recordsRecId,
  };

  try {
    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}ESSEmploymentCertificateSvcGroup/ESSEmploymentCertificateSvc/delete`,
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

    const result = await response.json();
    console.log('Employee Certificate request deleted successfully:', result);

    return result;
  } catch (error) {
    console.error('Failed to delete Employee Certificate Request:', error);
    throw error;
  }
};

export {DeleteCertificate};
