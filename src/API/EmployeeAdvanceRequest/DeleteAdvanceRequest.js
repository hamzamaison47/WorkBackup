// import {BASE_URL} from '@env';
// import {getToken} from '../Token/getToken';

// //Ensure that the createLeaveRequest function correctly uses the leaveData passed to it:

// const DeleteAdvanceRequest = async ({recordsRecId}) => {
//   // Define the request body
//   const requestBody = {
//     _recordsRecId: recordsRecId,
//   };

//   try {
//     // Get the token from the separate token file
//     const accessToken = await getToken();
//     // Make the POST request
//     const response = await fetch(
//       `${BASE_URL}PREmployeeAdvanceRequestSvcGroup/PREmployeeAdvanceRequestSvc/delete`,
//       {
//         method: 'POST',
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(requestBody), // Convert the request body to JSON string
//       },
//     );

//     // Check if the response is successful
//     if (!response.ok) {
//       const errorText = await response.text(); // Fetch error details
//       throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
//     }

//     // Parse the JSON response
//     const result = await response.json();
//     console.log('Advance request deleted successfully:', result);

//     // Return the response data
//     return result;
//   } catch (error) {
//     console.error('Failed to delete Advance Request:', error);
//     throw error;
//   }
// };

// export {DeleteAdvanceRequest};

/* eslint-disable dot-notation */
import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';

const DeleteAdvanceRequest = async ({recordsRecId}) => {
  try {
    const token = await getToken();

    const soapBody = `
      <delete xmlns="http://tempuri.org">
        <_recordsRecId xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
          ${recordsRecId.map(id => `<a:long>${id}</a:long>`).join('')}
        </_recordsRecId>
      </delete>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${resource}soap/services/PREmployeeAdvanceRequestSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/PREmployeeAdvanceRequestSvc/delete',
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
      parsed?.['s:Envelope']?.['s:Body']?.['deleteResponse']?.['result']?.[
        'a:GeneralContract'
      ];

    if (!generalContracts) {
      console.warn('No delete response data found');
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
    console.error('Delete SOAP error:', err.response?.data || err.message);
    throw err;
  }
};

export {DeleteAdvanceRequest};
