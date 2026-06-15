/* eslint-disable curly */
/* eslint-disable dot-notation */

import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';

import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const CreateOvertimePlanner = async ({overtimeData}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // Build SOAP body
    const soapBody = `
      <create xmlns="http://tempuri.org">
        <_contract
          xmlns:a="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application"
          xmlns:i="http://www.w3.org/2001/XMLSchema-instance">

          ${buildContractXml(overtimeData)}

        </_contract>
      </create>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    console.log('SOAP BODY:', soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/TASOvertimePlannerServiceGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/TASOvertimePlannerSvc/create',
        },
        responseType: 'text',
      },
    );

    console.log('RAW XML RESPONSE:', xml);

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      parseTagValue: true,
      removeNSPrefix: false,
    });

    const parsed = parser.parse(xml);

    console.log('PARSED RESPONSE:', JSON.stringify(parsed, null, 2));

    // SOAP Envelope
    const envelope =
      parsed?.['s:Envelope'] ||
      parsed?.['soap:Envelope'] ||
      parsed?.['Envelope'];

    // SOAP Body
    const body =
      envelope?.['s:Body'] || envelope?.['soap:Body'] || envelope?.['Body'];

    // Response node
    const responseNode =
      body?.['createResponse'] ||
      body?.['ns0:createResponse'] ||
      body?.['a:createResponse'];

    // Result node
    const result = responseNode?.['createResult'] || responseNode?.['result'];

    if (!result) {
      console.log('No result found in SOAP response');
      return {
        IsSuccess: false,
        Message: 'No response received from server.',
      };
    }

    console.log('FINAL RESULT:', JSON.stringify(result, null, 2));

    const message = typeof result === 'string' ? result : result?.Message || '';
    const isSuccess =
      typeof result === 'string'
        ? result.toLowerCase().includes('successfully')
        : result?.IsSuccess === 'true' || result?.IsSuccess === true;

    return {
      IsSuccess: isSuccess,
      Message: message,
    };
  } catch (error) {
    console.error(
      'CreateOvertimePlanner ERROR:',
      error?.response?.data || error?.message || error,
    );

    throw error;
  }
};

// // Build XML Contract
// const buildContractXml = contract => {
//   if (!contract) return '';

//   const ns = 'a';

//   const fields = [
//     'employeeId',
//     'employeeName',
//     'endTime',
//     'planDate',
//     'recId',
//     'requestDate',
//     'startTime',
//   ];

//   return fields
//     .map(field => {
//       const value = contract[field];

//       if (value === null || value === undefined || value === '') {
//         return `<${ns}:${field}></${ns}:${field}>`;
//       }

//       return `<${ns}:${field}>${escapeXmlValue(value)}</${ns}:${field}>`;
//     })
//     .join('');
// };

const buildContractXml = contract => {
  if (!contract) return '';

  const ns = 'a';

  // Map XML field name → payload key (PascalCase from screen)
  const fieldMap = [
    ['employeeId', 'EmployeeId'],
    ['employeeName', 'EmployeeName'],
    ['endTime', 'EndTime'],
    ['planDate', 'PlanDate'],
    ['recId', 'RecId'],
    ['requestDate', 'RequestDate'],
    ['startTime', 'StartTime'],
  ];

  // Int32 fields — must emit 0, not an empty string
  const int32Fields = new Set(['endTime', 'recId', 'startTime']);

  return fieldMap
    .map(([xmlField, payloadKey]) => {
      let value = contract[payloadKey];

      if (value === null || value === undefined || value === '') {
        // Numeric fields must have a valid integer, not empty content
        value = int32Fields.has(xmlField) ? 0 : '';
      }

      return `<${ns}:${xmlField}>${escapeXmlValue(value)}</${ns}:${xmlField}>`;
    })
    .join('');
};

// Escape XML Special Characters
const escapeXmlValue = value => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

// IMPORTANT: Default export
export default CreateOvertimePlanner;
