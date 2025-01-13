import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const IdentificationFindRequest = async ({employeeId}) => {
  const requestBody = {
    _employeeId: employeeId,
  };
  try {
    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}/HcmPersonIdentificationNumberSvcGroup/HcmPersonIdentificationNumberSvc/findByEmployee`,
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
    const employeeData = await response.json();
    console.log(
      'Contact Identification Find Request: =================:',
      employeeData,
    );

    return employeeData;
  } catch (error) {
    console.error(
      'Failed to fetch Identification Find Request Details:',
      error,
    );
    throw error;
  }
};

export {IdentificationFindRequest};
