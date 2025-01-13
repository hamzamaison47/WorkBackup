// import {BASE_URL} from '@env';
// import {getToken} from '../Token/getToken';

// const FindByEmployee = async ({employeeId}) => {
//   const requestBody = {
//     _employeeId: employeeId,
//   };
//   try {
//     console.log('This is form FindByEmployee: ', requestBody);
//     const accessToken = await getToken();
//     const response = await fetch(
//       `${BASE_URL}/PREmployeeAdvanceRequestSvcGroup/PREmployeeAdvanceRequestSvc/findByEmployee`,
//       {
//         method: 'POST',
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(requestBody),
//       },
//     );
//     if (!response.ok) {
//       const errorText = await response.text();
//       throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
//     }
//     const employeeData = await response.json();
//     console.log('employee ID Data =================:', employeeData);

//     return employeeData;
//   } catch (error) {
//     console.error('Failed to fetch employee IDs:', error);
//     throw error;
//   }
// };

// export {FindByEmployee};

import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const FindByEmployee = async ({employeeId}) => {
  const requestBody = {
    _employeeId: employeeId,
  };
  try {
    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}PREmployeeAdvanceRequestSvcGroup/PREmployeeAdvanceRequestSvc/findByEmployee`,
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
    // console.log('Advance employee ID Data =================:', employeeData);

    return employeeData;
  } catch (error) {
    console.error('Failed to fetch Advance employee IDs:', error);
    throw error;
  }
};

export {FindByEmployee};
