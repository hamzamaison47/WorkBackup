import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const deleteLeaveRequest = async ({recordsRecId}) => {
  const requestBody = {
    _recordsRecId: recordsRecId,
  };

  try {
    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}PREmployeeLeavesSvcGroup/PREmployeeLeavesSvc/Delete`,
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
    // console.log('Leave request deleted successfully:', result);

    return result;
  } catch (error) {
    console.error('Failed to delete Leave Request:', error);
    throw error;
  }
};

export {deleteLeaveRequest};
