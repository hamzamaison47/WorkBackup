import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const approve = async ({CorrelationId}) => {
  const requestBody = {
    _correlationId: CorrelationId,
  };
  try {
    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}EssWorkflowSvcGroup/ESSWorkflowSvc/approveWFByCorrelationId`,
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
    console.log('workflow Submit =================:', workflowData);

    return workflowData;
  } catch (error) {
    console.error('Failed to fetch employee IDs:', error);
    throw error;
  }
};

export {approve};
