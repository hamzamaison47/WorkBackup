import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const RetrieveByEmail = async ({dataAreaId, email}) => {
  const requestBody = {
    _dataAreaId: dataAreaId,
    _email: email,
  };

  try {
    const accessToken = await getToken();

    const response = await fetch(
      `${BASE_URL}PREmploymentInformationSvcGroup/PREmploymentInformationSvc/retrieveByEmailAddress`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
    );

    const responseBody = await response.text();

    if (!response.ok) {
      throw new Error(
        `HTTP error! Status: ${response.status} - ${responseBody}`,
      );
    }

    const employmentInformation = JSON.parse(responseBody);

    return employmentInformation;
  } catch (error) {
    console.error('Failed to fetch Employment Information Data:', error);
    throw error;
  }
};

export {RetrieveByEmail};
