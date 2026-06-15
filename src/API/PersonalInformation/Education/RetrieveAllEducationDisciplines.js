import {getToken} from '../../Token/getToken';
import axios from 'axios';
import {getActiveConfigData} from '../../../Controller/secureConfig';

const RetrieveAllEducationDisciplines = async () => {
  try {
    // 🔹 Get active environment config (contains resource base URL)
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    // 🔹 Get OAuth token
    const accessToken = await getToken();

    // 🔹 API URL (no SOAP envelope — it's a REST call)
    const url = `${config.resource}api/services/HcmEducationDisciplineSvcGroup/HcmEducationDisciplineSvc/retrieveAll`;

    // console.log('Calling:', url);

    // 🔹 Perform REST POST request
    const response = await axios.post(
      url,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    // 🔹 Extract data
    const result = response?.data?.value || response?.data;

    if (!result || result.length === 0) {
      console.log('No Education Discipline data found');
      return [];
    }

    // console.log('Retrieved Education Disciplines:', result);
    return result;
  } catch (error) {
    console.error('Failed to fetch Education Discipline data:', error);
    throw error;
  }
};

export {RetrieveAllEducationDisciplines};
