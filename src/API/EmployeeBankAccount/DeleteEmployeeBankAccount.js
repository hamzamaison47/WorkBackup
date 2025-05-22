import {BASE_URL} from '@env';
import {getToken} from '../Token/getToken';

const DeleteEmployeeBankAccount = async ({recordsRecId}) => {
  const requestBody = {
    _recordsRecId: recordsRecId,
  };

  try {
    const accessToken = await getToken();
    const response = await fetch(
      `${BASE_URL}HcmWorkerESSBankAccountSvcGroup/HcmWorkerESSBankAccountSvc/delete`,
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
    // console.log('Employee Bank Account Request Deleted successfully:', result);

    return result;
  } catch (error) {
    console.error('Failed to Delete Employee Bank Account Request:', error);
    throw error;
  }
};

export {DeleteEmployeeBankAccount};
