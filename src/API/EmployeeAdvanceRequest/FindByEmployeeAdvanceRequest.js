// import {BASE_URL} from '@env';
// import {getToken} from '../Token/getToken';

// const FindByEmployee = async ({employeeId}) => {
//   const requestBody = {
//     _employeeId: employeeId,
//   };
//   try {
//     const accessToken = await getToken();
//     const response = await fetch(
//       `${BASE_URL}PREmployeeAdvanceRequestSvcGroup/PREmployeeAdvanceRequestSvc/findByEmployee`,
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
//     const employeeData = await response.json();
//     // console.log('Advance employee ID Data =================:', employeeData);

//     return employeeData;
//   } catch (error) {
//     console.error('Failed to fetch Advance employee IDs:', error);
//     throw error;
//   }
// };

// export {FindByEmployee};

/* eslint-disable dot-notation */
import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';

const FindByEmployeeAdvanceRequest = async ({employeeId}) => {
  try {
    const token = await getToken();

    const soapBody = `
      <findByEmployee xmlns="http://tempuri.org">
        <_employeeId>${employeeId}</_employeeId>
      </findByEmployee>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${resource}soap/services/PREmployeeAdvanceRequestSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/PREmployeeAdvanceRequestSvc/findByEmployee',
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
    const rawData =
      parsed?.['s:Envelope']?.['s:Body']?.['findByEmployeeResponse']?.[
        'result'
      ]?.['a:PREmployeeAdvanceRequestSvcContract'];

    if (!rawData) {
      console.log('No Find By Employee Advance Request Response found');
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
      'Find By Employee Advance Request SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {FindByEmployeeAdvanceRequest};
