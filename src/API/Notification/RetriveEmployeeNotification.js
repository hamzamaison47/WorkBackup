/* eslint-disable dot-notation */
// import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const RetrieveEmployeeNotification = async ({employeeId}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <retrieveEmployeeNotification xmlns="http://tempuri.org">
        <_employeeId>${employeeId}</_employeeId>
      </retrieveEmployeeNotification>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    // console.log({soapEnvelope});

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/DFNotificationServiceSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/DFNotificationServiceSvc/retrieveEmployeeNotification',
        },
        responseType: 'text',
      },
    );

    // console.log({xml});

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: false,
    });

    const parsed = parser.parse(xml);
    const rawData =
      parsed?.['s:Envelope']?.['s:Body']?.[
        'retrieveEmployeeNotificationResponse'
      ]?.['result']?.['a:DFNotificationServiceContract'];

    if (!rawData) {
      // console.log('No Notification data found');
      return [];
    }

    const cleanObject = obj =>
      Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^a:/, ''),
          value,
        ]),
      );

    const cleanedData = Array.isArray(rawData)
      ? rawData.map(cleanObject)
      : [cleanObject(rawData)];

    // console.log({cleanedData});

    return cleanedData;
  } catch (err) {
    console.error('RetrieveAll SOAP error:', err.response?.data || err.message);
    throw err;
  }
};

export {RetrieveEmployeeNotification};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// import axios from 'axios';
// import {getToken} from '../Token/getToken';
// import {getActiveConfigData} from '../../Controller/secureConfig';

// const RetrieveEmployeeNotification = async ({employeeId, company = 'dat'}) => {
//   try {
//     const config = await getActiveConfigData();

//     if (!config || !config.resource) {
//       throw new Error('No configuration found. Please scan QR code first.');
//     }

//     const token = await getToken();

//     console.log('Fetching notifications for employee:', employeeId);

//     // Use the REST API endpoint instead of SOAP
//     const response = await axios.post(
//       `${config.resource}api/services/DFNotificationServiceSvcGroup/DFNotificationServiceSvc/retrieveEmployeeNotification`,
//       {
//         _employeeId: employeeId,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//           Accept: 'application/json',
//           // Add company context header if needed
//           'X-Ms-Dyn-Company': company,
//         },
//         timeout: 30000,
//       },
//     );

//     console.log('Response received:', response.status);

//     // The REST API should return an array directly
//     const notifications = response.data || [];

//     if (!Array.isArray(notifications)) {
//       console.log('Unexpected response format:', notifications);
//       return [];
//     }

//     console.log(`Found ${notifications.length} notifications`);
//     return notifications;
//   } catch (err) {
//     console.error('=== API REQUEST FAILED ===');
//     console.error('Error message:', err.message);

//     if (err.response) {
//       console.error('Response status:', err.response.status);
//       console.error('Response data:', err.response.data);
//       console.error('Response headers:', err.response.headers);

//       // Handle specific error cases
//       if (err.response.status === 401) {
//         throw new Error('Authentication failed. Please login again.');
//       } else if (err.response.status === 403) {
//         throw new Error(
//           'Access denied. You do not have permission to view notifications.',
//         );
//       } else if (err.response.status === 404) {
//         throw new Error(
//           'Notification service not found. Please check the endpoint.',
//         );
//       } else if (err.response.status === 500) {
//         const errorMsg =
//           err.response.data?.error?.message ||
//           err.response.data?.message ||
//           'Server error occurred';
//         throw new Error(`Server Error: ${errorMsg}`);
//       }
//     } else if (err.request) {
//       console.error('No response received from server');
//       throw new Error('Network error. Please check your connection.');
//     }

//     // Return mock data in development
//     if (process.env.NODE_ENV === 'development') {
//       console.log('Returning mock data for development');
//       return [
//         {
//           NotificationId: 'MOCK-001',
//           EmployeeId: employeeId,
//           Company: company,
//           Title: 'Test Notification',
//           Message: 'This is a mock notification for testing',
//           CreatedDate: new Date().toISOString(),
//           IsRead: false,
//         },
//       ];
//     }

//     throw err;
//   }
// };

// export {RetrieveEmployeeNotification};
