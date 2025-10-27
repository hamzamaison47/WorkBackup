/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../Controller/secureConfig';

const CreateContactDetails = async contactData => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    console.log('Contact Data: ', contactData);
    const token = await getToken();

    // 🧾 Build the SOAP body (with correct namespaces and tag structure)
    const soapBody = `
      <tem:create xmlns:tem="http://tempuri.org">
        <tem:contract xmlns:dyn="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">
          ${buildContractXml(contactData)}
        </tem:contract>
      </tem:create>
    `;

    // Wrap inside SOAP Envelope with callContext (handled inside createSoapEnvelope)
    const soapEnvelope = createSoapEnvelope(soapBody);

    // 🚀 Send SOAP request
    const {data: xml} = await axios.post(
      `${config.resource}soap/services/LogisticsElectronicAddressSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/LogisticsElectronicAddressSvc/create',
        },
        responseType: 'text',
      },
    );

    // 🧩 Parse XML response
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
      console.log('No result found in SOAP response');
      return null;
    }

    // 🧹 Clean namespace prefixes
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

    const cleanedResult = cleanObject(result);
    console.log('Contact Details Created (SOAP):', cleanedResult);

    return cleanedResult;
  } catch (error) {
    console.error(
      'CreateContactDetails SOAP error:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

/**
 * Build XML body for contact details with correct namespace prefix (dyn:)
 */
const buildContractXml = contract => {
  if (!contract) return '';

  const ns = 'dyn';
  const fields = [
    'Description',
    'EmployeeId',
    'IsMobilePhone',
    'IsPrimary',
    'IsPrivate',
    'Location',
    'Locator',
    'LocatorExtension',
    'RecId',
    'Type',
  ];

  return fields
    .map(field => {
      const value = contract[field];
      if (value === null || value === undefined) {
        return `<${ns}:${field} xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>`;
      }
      return `<${ns}:${field}>${escapeXmlValue(value)}</${ns}:${field}>`;
    })
    .join('');
};

/**
 * Escape unsafe XML characters
 */
const escapeXmlValue = value => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export {CreateContactDetails};
