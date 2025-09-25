// // import {BASE_URL} from '@env';
// import {getToken} from '../Token/getToken';
// import {getActiveConfigData} from '../../Controller/secureConfig';

// export const retrieveByEmail = async ({email}) => {
//   const requestBody = {
//     _email: email,
//   };
//   try {
//     const config = await getActiveConfigData();

//     if (!config || !config.resource) {
//       throw new Error('No configuration found. Please scan QR code first.');
//     }

//     const accessToken = await getToken();
//     const response = await fetch(
//       `${config.resource}api/WorkflowTrackingStatusTableSvcGroup/WorkflowTrackingStatusTableSvc/retrieveByEmail`,
//       {
//         method: 'POST',
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(requestBody),
//       },
//     );
//     if (!response.ok) {
//       const errorText = await response.text();
//       throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
//     }
//     const employmentInformation = await response.json();
//     return employmentInformation;
//   } catch (error) {
//     console.error('Failed to fetch Work Flow Data:', error);
//     throw error;
//   }
// };

/* eslint-disable dot-notation */
import {getToken} from '../Token/getToken';
// import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const RetrieveByEmail = async ({email}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const accessToken = await getToken();

    // SOAP body
    const soapBody = `
      <retrieveByEmail xmlns="http://tempuri.org">
        <_email>${email}</_email>
      </retrieveByEmail>
    `;

    // Wrap in SOAP envelope
    const soapEnvelope = createSoapEnvelope(soapBody);

    // API call with axios
    const {data: xml} = await axios.post(
      `${config.resource}soap/services/WorkflowTrackingStatusTableSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/WorkflowTrackingStatusTableSvc/retrieveByEmail',
        },
        responseType: 'text',
      },
    );

    // XML parser
    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: false,
    });

    const parsed = parser.parse(xml);

    const rawData =
      parsed?.['s:Envelope']?.['s:Body']?.['retrieveByEmailResponse']?.[
        'result'
      ]?.['a:WorkflowTrackingStatusTableSvcContract'];

    if (!rawData) {
      console.log('No workflow data found');
      return [];
    }

    // Normalize keys (remove "a:" prefix)
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

    console.log('Workflow Tracking Status Data (cleaned): ', cleanedData);

    return cleanedData;
  } catch (error) {
    console.error('Failed to fetch Work Flow Data:', error);
    throw error;
  }
};

export {RetrieveByEmail};
