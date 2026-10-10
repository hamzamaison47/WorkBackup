/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {getActiveConfigData} from '../../Controller/secureConfig';

const RegisterDevice = async ({registrationData}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
      <soapenv:Header>
        <dat:CallContext xmlns:dat="http://schemas.microsoft.com/dynamics/2013/01/datacontracts">
            <dat:Company></dat:Company>
            <dat:Language>en-us</dat:Language>
        </dat:CallContext>
      </soapenv:Header>
      <soapenv:Body>
        <registerDevice xmlns="http://tempuri.org">
          <_contract xmlns:tem="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">
            ${buildContractXml(registrationData)}
          </_contract>
        </registerDevice>
      </soapenv:Body>
    </soapenv:Envelope>`;

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/DFDeviceRegistrationSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/DFDeviceRegistrationSvc/registerDevice',
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
      parsed?.['s:Envelope']?.['s:Body']?.['registerDeviceResponse']?.[
        'result'
      ] ||
      parsed?.['soap:Envelope']?.['soap:Body']?.['registerDeviceResponse']?.[
        'result'
      ];

    if (!result) {
      console.log('No result found in SOAP response');
      return null;
    }

    const cleanObject = obj => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(cleanObject);

      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^[a-zA-Z0-9]+:/, ''),
          typeof value === 'object' ? cleanObject(value) : value,
        ]),
      );
    };

    return cleanObject(result);
  } catch (error) {
    console.error(
      'Failed to register device:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

const CONTRACT_FIELDS = [
  'APPVersion',
  'DeviceID',
  'DeviceName',
  'DeviceToken',
  'DeviceType',
  'Email',
  'IPAddress',
  'OSVersion',
];

const buildContractXml = contract => {
  if (!contract) return '';

  const ns = 'tem';

  return CONTRACT_FIELDS.map(field => {
    const value = contract[field];

    if (value === null || value === undefined || value === '') {
      return `<${ns}:${field} xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>`;
    }

    return `<${ns}:${field}>${escapeXmlValue(value)}</${ns}:${field}>`;
  }).join('');
};

const escapeXmlValue = value =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export {RegisterDevice};
