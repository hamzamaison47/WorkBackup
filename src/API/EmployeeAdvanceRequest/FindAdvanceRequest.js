// import {BASE_URL} from '@env';
// import {getToken} from '../Token/getToken';

// const FindAdvanceRequest = async ({requestId}) => {
//   const requestBody = {
//     _requestId: requestId,
//   };

//   try {
//     const accessToken = await getToken();
//     const response = await fetch(
//       `${BASE_URL}PREmployeeAdvanceRequestSvcGroup/PREmployeeAdvanceRequestSvc/find`,
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

//     const result = await response.json();
//     console.log('Find Records Request Successfully:', result);

//     return result;
//   } catch (error) {
//     console.error('Failed to Find Records Request:', error);
//     throw error;
//   }
// };

// export {FindAdvanceRequest};

/* eslint-disable dot-notation */
import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';

const FindAdvanceRequest = async ({requestId}) => {
  try {
    const token = await getToken();

    const soapBody = `
      <find xmlns="http://tempuri.org">
        <_requestId xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
          ${requestId.map(id => `<a:long>${id}</a:long>`).join('')}
        </_requestId>
      </find>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${resource}soap/services/PREmployeeAdvanceRequestSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/PREmployeeAdvanceRequestSvc/find',
        },
        responseType: 'text',
      },
    );

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: false,
    });

    const parsed = parser.parse(xml);
    const generalContracts =
      parsed?.['s:Envelope']?.['s:Body']?.['findResponse']?.['result']?.[
        'a:PREmployeeAdvanceRequestSvcContract'
      ];

    if (!generalContracts) {
      console.warn('No find advance request response data found');
      return [];
    }

    const cleanObject = obj =>
      Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^a:/, ''),
          value,
        ]),
      );

    const cleanedData = Array.isArray(generalContracts)
      ? generalContracts.map(cleanObject)
      : [cleanObject(generalContracts)];

    return cleanedData;
  } catch (err) {
    console.error(
      'Find advance request SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {FindAdvanceRequest};
