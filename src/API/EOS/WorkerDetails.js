import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const WorkerDetails = async ({employeeId, lastWorkingDateActual}) => {
  const requestBody = {
    _employeeId: employeeId,
    _lastWorkingDateActual: lastWorkingDateActual,
  };
  try {
    // console.log('request Body', requestBody);

    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}HcmWorkerDetailsSvcGroup/HcmWorkerDetailsSvc/RetrieveWorkerDetails`,
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
    const data = await response.json();
    // console.log('Retrieve Worker Details ==========:', data);
    return data;
  } catch (error) {
    console.error('Failed to fetch worker details:', error);
    throw error;
  }
};

export {WorkerDetails};
