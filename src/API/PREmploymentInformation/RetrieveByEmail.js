// import {BASE_URL} from '@env';
// import {getToken} from '../Token/getToken';

// const RetrieveByEmail = async ({dataAreaId, email}) => {
//   const requestBody = {
//     _dataAreaId: dataAreaId,
//     _email: email,
//   };
//   try {
//     const accessToken = await getToken();
//     console.log('AccessToken=============', accessToken);
//     const response = await fetch(
//       `${BASE_URL}/PREmploymentInformationSvcGroup/PREmploymentInformationSvc/retrieveByEmail`,
//       {
//         method: 'POST',
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(requestBody),
//       },
//     );
//     console.log('Response=============', response);
//     if (!response.ok) {
//       const errorText = await response.text();
//       throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
//     }
//     const employmentInformation = await response.json();
//     console.log(
//       'Employment Information Data by Email =================:',
//       employmentInformation,
//     );

//     return employmentInformation;
//   } catch (error) {
//     console.error('Failed to fetch Employment Information Data:', error);
//     throw error;
//   }
// };

// export {RetrieveByEmail};

import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const RetrieveByEmail = async ({dataAreaId, email}) => {
  const requestBody = {
    _dataAreaId: dataAreaId,
    _email: email,
  };

  try {
    const accessToken = await getToken();
    console.log('AccessToken=============', accessToken);

    const response = await fetch(
      `${BASE_URL}PREmploymentInformationSvcGroup/PREmploymentInformationSvc/retrieveByEmail`,
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
    console.log('Response Body:', responseBody);

    if (!response.ok) {
      throw new Error(
        `HTTP error! Status: ${response.status} - ${responseBody}`,
      );
    }

    const employmentInformation = JSON.parse(responseBody);
    console.log(
      'Employment Information Data by Email =================:',
      employmentInformation,
    );

    return employmentInformation;
  } catch (error) {
    console.error('Failed to fetch Employment Information Data:', error);
    throw error;
  }
};

export {RetrieveByEmail};
