/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../Controller/secureConfig';

const CreateIdentityRequest = async ({identityData}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <create xmlns="http://tempuri.org">
        <contract xmlns:tem="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">
          ${buildContractXml(identityData)}
        </contract>
      </create>`;

    const soapEnvelope = createSoapEnvelope(soapBody);
    const {data: xml} = await axios.post(
      `${config.resource}soap/services/HcmPersonIdentificationNumberSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/HcmPersonIdentificationNumberSvc/create',
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
      console.log('No result found in SOAP response');
      return null;
    }

    const cleanedResult = cleanObject(result);
    return cleanedResult;
  } catch (error) {
    console.error(
      'Failed to create Identification request:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

const buildContractXml = contract => {
  if (!contract) return '';

  const ns = 'tem';
  const fields = [
    'Description',
    'EmployeeId',
    'ExpirationDate',
    'IdentificationNumber',
    'IdentificationType',
    'IdentificationTypeId',
    'IsPrimary',
    'IssuedDate',
    'IssuingAgency',
    'IssuingAgencyId',
    'PersonIdentificationNumberRecVersion',
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

const escapeXmlValue = value => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

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

export {CreateIdentityRequest};
