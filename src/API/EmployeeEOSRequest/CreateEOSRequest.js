/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

/**
 * CreateEOSRequest API
 * @param {Object} param - Object containing the EOS request data (PREmployeeEOSRequestsSvcContract)
 * @returns {Promise<Object>} - Returns cleaned GeneralContract object
 */
const CreateEOSRequest = async ({contract}) => {
  try {
    if (!contract) throw new Error('Contract data is required.');
    console.log(contract);
    const config = await getActiveConfigData();
    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // Build SOAP body
    const soapBody = `
      <create xmlns="http://tempuri.org">
        <contract xmlns:tem="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">
          ${buildContractXml(contract)}
        </contract>
      </create>`;

    const soapEnvelope = createSoapEnvelope(soapBody);
    console.log(soapEnvelope);
    const {data: xml} = await axios.post(
      `${config.resource}soap/services/PREmployeeEOSRequestsSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/PREmployeeEOSRequestsSvc/create',
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

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['createResponse']?.['result'] ||
      parsed?.['soap:Envelope']?.['soap:Body']?.['createResponse']?.['result'];

    if (!result) {
      console.log('No result found in CreateEOSRequest SOAP response');
      return null;
    }

    const cleanObject = obj => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(cleanObject);

      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^[a-zA-Z0-9]+:/, ''), // strip ns prefix
          typeof value === 'object' ? cleanObject(value) : value,
        ]),
      );
    };
    console.log(result);
    return cleanObject(result);
  } catch (error) {
    console.error(
      'Failed to create EOS request:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

/**
 * Build XML for the SOAP contract
 * @param {Object} contract - Contract object
 * @returns {string} - XML string
 */
const buildContractXml = contract => {
  if (!contract) return '';

  const ns = 'tem';
  const numericFields = ['RecId']; // fields that must not be null
  const fields = [
    'EOSNotificationDate',
    'EOSType',
    'EmployeeId',
    'LastWorkingDate_Actual',
    'NoticePeriodCode',
    'Remarks',
  ];

  return fields
    .map(field => {
      const value = contract[field];

      if (value === null || value === undefined || value === '') {
        // numeric fields must not be nil
        if (numericFields.includes(field)) {
          return `<${ns}:${field}>0</${ns}:${field}>`;
        }
        return `<${ns}:${field} xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>`;
      }
      return `<${ns}:${field}>${escapeXmlValue(value)}</${ns}:${field}>`;
    })
    .join('');
};
// const buildContractXml = contract => {
//   if (!contract) return '';

//   const ns = 'tem';
//   const fields = [
//     'EmployeeId',
//     'EmployeeName',
//     'EOSType',
//     'EOSNotificationDate',
//     'LastWorkingDate_Actual',
//     'LastWorkingDate_Planned',
//     'NoticePeriodCode',
//     'ReasonCode',
//     'HiringDate',
//     'ServiceDuration',
//     'Remarks',
//     'RecId',
//   ];

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

/**
 * Escape XML reserved characters
 * @param {string|number} value
 * @returns {string}
 */
const escapeXmlValue = value => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export {CreateEOSRequest};
