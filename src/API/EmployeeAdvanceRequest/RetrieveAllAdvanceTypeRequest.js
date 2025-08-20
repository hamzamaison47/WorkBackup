// import {BASE_URL} from '@env';
// import {getToken} from '../Token/getToken';

// const RetrieveAdvanceType = async () => {
//   try {
//     const accessToken = await getToken();
//     const response = await fetch(
//       `${BASE_URL}PRAdvanceTypesSvcGroup/PRAdvanceTypesSvc/retrieveAll`,
//       {
//         method: 'POST',
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(),
//       },
//     );
//     if (!response.ok) {
//       const errorText = await response.text();
//       throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
//     }
//     const leaveCodes = await response.json();
//     // console.log(
//     //   'Advance Type Code Request Data =================:',
//     //   leaveCodes,
//     // );

//     return leaveCodes;
//   } catch (error) {
//     console.error('Failed to fetch All Advance Type Code Request:', error);
//     throw error;
//   }
// };

// export {RetrieveAdvanceType};

/* eslint-disable dot-notation */
import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';

const RetrieveAllAdvanceTypeRequest = async () => {
  try {
    const token = await getToken();

    // const soapBody = `
    //   <retrieveAll xmlns="http://tempuri.org" >
    //   </retrieveAll>`;
    const soapBody = `
      <tem:retrieveAll xmlns:tem="http://tempuri.org" />`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    console.log('soapEnvelope of advance Type request', soapEnvelope);

    const {data: xml} = await axios.post(
      `${resource}soap/services/PRAdvanceTypesSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml; charset=utf-8',
          SOAPAction: 'http://tempuri.org/PRAdvanceTypesSvc/retrieveAll',
        },
        responseType: 'text',
      },
    );

    console.log('xml of advance Type request', xml);

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: false,
    });

    const parsed = parser.parse(xml);
    // const rawData =
    //   parsed?.['s:Envelope']?.['s:Body']?.['retrieveAllResponse']?.['result']?.[
    //     'a:PRAdvanceTypesSvcContract'
    //   ];
    const rawData =
      parsed?.['soapenv:Envelope']?.['soapenv:Body']?.['retrieveAllResponse']?.[
        'result'
      ]?.['a:PRAdvanceTypesSvcContract'];

    if (!rawData) {
      console.log('No Retrieve All Advance Type Request Response found');
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

    return cleanedData;
  } catch (err) {
    console.error(
      'Retrieve All Advance Type Request SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {RetrieveAllAdvanceTypeRequest};
