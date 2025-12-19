// /* eslint-disable curly */
// /* eslint-disable dot-notation */
// // import {resource} from '@env';
// import axios from 'axios';
// import {XMLParser} from 'fast-xml-parser';
// import {getToken} from '../Token/getToken';
// import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
// import {getActiveConfigData} from '../../Controller/secureConfig';

// const UpdateNotificationStatus = async ({notificationData}) => {
//   try {
//     const config = await getActiveConfigData();

//     if (!config || !config.resource) {
//       throw new Error('No configuration found. Please scan QR code first.');
//     }

//     const token = await getToken();

//     const soapBody = `
//       <updateNotificationStatus xmlns = "http://tempuri.org">
//         <contract xmlns:tem = "http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">
//           ${buildContractXml(notificationData)}
//         </contract>
//       </updateNotificationStatus>`;

//     const soapEnvelope = createSoapEnvelope(soapBody);

//     const {data: xml} = await axios.post(
//       `${config.resource}soap/services/DFNotificationServiceSvcGroup`,
//       soapEnvelope,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'text/xml;charset=utf-8',
//           SOAPAction:
//             'http://tempuri.org/DFNotificationServiceSvc/updateNotificationStatus',
//         },
//         responseType: 'text',
//       },
//     );

//     // console.log('soap envelope data', soapEnvelope);
//     // console.log('soap body data', soapBody);

//     const parser = new XMLParser({
//       ignoreAttributes: false,
//       ignoreNameSpace: false,
//       attributeNamePrefix: '',
//       isArray: () => false,
//       parseTagValue: false,
//     });

//     const parsed = parser.parse(xml);
//     const result =
//       parsed?.['s:Envelope']?.['s:Body']?.[
//         'updateNotificationStatusResponse'
//       ]?.['result'] ||
//       parsed?.['soap:Envelope']?.['soap:Body']?.[
//         'updateNotificationStatusResponse'
//       ]?.['result'];

//     if (!result) {
//       console.log('No result found in Update SOAP response');
//       return null;
//     }

//     const cleanObject = obj => {
//       if (obj === null || obj === undefined) return obj;
//       if (typeof obj !== 'object') return obj;
//       if (Array.isArray(obj)) return obj.map(cleanObject);

//       return Object.fromEntries(
//         Object.entries(obj).map(([key, value]) => [
//           key.replace(/^[a-zA-Z0-9]+:/, ''), // strip ns prefix
//           typeof value === 'object' ? cleanObject(value) : value,
//         ]),
//       );
//     };

//     const cleanedResult = cleanObject(result);
//     return cleanedResult;
//   } catch (error) {
//     console.error(
//       'Failed to update Notification request:',
//       error.response?.data || error.message,
//     );
//     throw error;
//   }
// };

// const buildContractXml = contract => {
//   if (!contract) return '';

//   const ns = 'tem';
//   const fields = ['EmployeeId', 'RecId'];

//   return fields
//     .map(field => {
//       const value = contract[field];
//       if (value === null || value === undefined) {
//         return `<${ns}:${field} xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>`;
//       }
//       return `<${ns}:${field}>${escapeXmlValue(value)}</${ns}:${field}>`;
//     })
//     .join('');
// };

// const escapeXmlValue = value => {
//   return String(value)
//     .replace(/&/g, '&amp;')
//     .replace(/</g, '&lt;')
//     .replace(/>/g, '&gt;')
//     .replace(/"/g, '&quot;')
//     .replace(/'/g, '&#39;');
// };

// export {UpdateNotificationStatus};

/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const UpdateNotificationStatus = async ({notificationData}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // Build the contract XML based on the DFNotificationServiceContract structure
    const contractXml = buildContractXml(notificationData);

    const soapBody = `
      <updateNotificationStatus xmlns="http://tempuri.org/">
        <contract xmlns:b="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">
          ${contractXml}
        </contract>
      </updateNotificationStatus>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    // console.log('Sending SOAP request:', soapEnvelope);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/DFNotificationServiceSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/DFNotificationServiceSvc/updateNotificationStatus',
        },
        responseType: 'text',
      },
    );

    // console.log('SOAP response received');

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: true, // Set to true to simplify parsing
      attributeNamePrefix: '',
      isArray: (tagName, jPath) => {
        // Handle potential array responses
        return (
          tagName === 'DFNotificationServiceContract' ||
          tagName === 'GeneralContract'
        );
      },
      parseTagValue: false,
    });

    const parsed = parser.parse(xml);

    // Try different possible response structures
    const result =
      parsed?.['Envelope']?.['Body']?.['updateNotificationStatusResponse']?.[
        'result'
      ] ||
      parsed?.['s:Envelope']?.['s:Body']?.[
        'updateNotificationStatusResponse'
      ]?.['result'] ||
      parsed?.['soap:Envelope']?.['soap:Body']?.[
        'updateNotificationStatusResponse'
      ]?.['result'];

    if (!result) {
      console.log('No result found in Update SOAP response');
      console.log('Full parsed response:', JSON.stringify(parsed, null, 2));
      return null;
    }

    // Clean the result object
    const cleanObject = obj => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(cleanObject);

      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^[a-zA-Z0-9]+:/, ''), // strip namespace prefix
          typeof value === 'object' ? cleanObject(value) : value,
        ]),
      );
    };

    const cleanedResult = cleanObject(result);
    // console.log('Cleaned result:', cleanedResult);
    return cleanedResult;
  } catch (error) {
    console.error(
      'Failed to update Notification status:',
      error.response?.data || error.message,
    );
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};

const buildContractXml = contract => {
  if (!contract) return '';

  // Based on the DFNotificationServiceContract structure
  // You might need to adjust these fields based on the actual contract structure
  const fields = [
    'EmployeeId', // Employee ID
    'RecId', // Record ID
    // 'NotificationId', // Notification ID (if applicable)
    // 'Status', // Status to update to
    // 'ReadDate', // Read date (if applicable)
    // Add other fields from DFNotificationServiceContract as needed
  ];

  return fields
    .map(field => {
      const value = contract[field];
      if (value === null || value === undefined || value === '') {
        return `<b:${field} i:nil="true" xmlns:i="http://www.w3.org/2001/XMLSchema-instance"/>`;
      }

      // Handle date fields specially
      if (field.includes('Date') && value instanceof Date) {
        const dateValue = value.toISOString();
        return `<b:${field}>${dateValue}</b:${field}>`;
      }

      return `<b:${field}>${escapeXmlValue(value)}</b:${field}>`;
    })
    .join('\n          ');
};

const escapeXmlValue = value => {
  if (value === null || value === undefined) return '';

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

export {UpdateNotificationStatus};
