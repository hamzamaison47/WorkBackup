import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const reject = async ({CorrelationId}) => {
  const requestBody = {
    _correlationId: CorrelationId,
  };
  try {
    console.log('requestBody-0-0-0-0-0-0-0-', requestBody);
    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}EssWorkflowSvcGroup/ESSWorkflowSvc/rejectWFByCorrelationId`,
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
    const workflowData = await response.json();
    console.log('workflow reject =================:', workflowData);

    return workflowData;
  } catch (error) {
    console.error('Failed to fetch employee IDs:', error);
    throw error;
  }
};

export {reject};
