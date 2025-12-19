import {getToken} from '../Token/getToken';
import {getActiveConfigData} from '../../Controller/secureConfig';

const UpdateFirebaseToken = async ({updateData}) => {
  const requestBody = {
    contract: updateData,
  };

  try {
    const accessToken = await getToken();
    const config = await getActiveConfigData();

    const response = await fetch(
      `${config.resource}/api/services/DynafaceTableSvcGroup/DynafaceTableSvc/updateFirebaseToken`,
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
    console.log('Update Employee Certificate Request Updated:', result);

    return result;
  } catch (error) {
    console.error('Failed to Update Employee Certificate Request:', error);
    throw error;
  }
};

export {UpdateFirebaseToken};
