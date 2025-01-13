import {BASE_URL} from '@env';
import {getToken} from '../../Token/getToken';

const CreateIdentityRequest = async identityData => {
  const requestBody = {
    contract: identityData,
  };
  try {
    console.log('Final Request Body for Identification:', requestBody);
    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}HcmPersonIdentificationNumberSvcGroup/HcmPersonIdentificationNumberSvc/create`,
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
    console.log('Identification Request Created:', result);
    return result;
  } catch (error) {
    console.error('Failed to create Identification request:', error);
    throw error;
  }
};

export {CreateIdentityRequest};
