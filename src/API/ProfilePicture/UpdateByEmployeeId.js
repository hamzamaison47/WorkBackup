import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const UpdateByEmployeeId = async ({employeeId, stringImage}) => {
  const requestBody = {
    _employeeId: employeeId,
    _stringImage: stringImage,
  };
  try {
    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}HcmPersonImageSvcGroup/HcmPersonImageSvc/updateByEmployeeId`,
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
    const updateProfilePicture = await response.json();
    // console.log(
    //   'Profile Picture Update=================:',
    //   updateProfilePicture,
    // );

    return updateProfilePicture;
  } catch (error) {
    console.error('Failed to update Profile Picture:', error);
    throw error;
  }
};

export {UpdateByEmployeeId};
