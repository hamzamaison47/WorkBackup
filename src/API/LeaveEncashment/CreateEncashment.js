/* eslint-disable curly */
/* eslint-disable dot-notation */

import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';

import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const CreateEncashment = async ({encashmentData}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <create xmlns="http://tempuri.org">
        <contract xmlns:a="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
          ${buildContractXml(encashmentData)}
        </contract>
      </create>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    console.log('CreateEncashment SOAP BODY:', soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/PREmployeeLeaveEncashmentSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/PREmployeeLeaveEncashmentSvc/create',
        },
        responseType: 'text',
      },
    );

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      parseTagValue: false,
    });

    const parsed = parser.parse(xml);

    console.log('CreateEncashment RAW:', JSON.stringify(parsed, null, 2));

    const envelope =
      parsed?.['s:Envelope'] ??
      parsed?.['soap:Envelope'] ??
      parsed?.['Envelope'];

    const body =
      envelope?.['s:Body'] ?? envelope?.['soap:Body'] ?? envelope?.['Body'];

    const result = body?.['createResponse']?.['result'];

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

    const cleanedResult = cleanObject(result);

    console.log(
      'CreateEncashment cleaned result:',
      JSON.stringify(cleanedResult, null, 2),
    );

    return cleanedResult;
  } catch (error) {
    console.error(
      'Failed to create Leave Encashment:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

const buildContractXml = contract => {
  if (!contract) return '';

  // ✅ FIXED: use 'a:' namespace prefix — matches how AX response sends data back
  // and how the SOAP serializer expects it on the way in.
  // The xmlns:a is declared on the <contract> element above.
  const ns = 'a';

  const fields = [
    'BalanceBeforeApplication',
    'Department',
    'Description',
    'EarningAmount',
    'EmployeeId',
    'EmployeeName',
    'EntitlementCode',
    'LastEncashmentDate',
    'LastEncashmentLeave',
    'LeavesToEncashed',
    'RecId',
    'RemainingBalance',
    'RequestDate',
    'RequestId',
    'WFStatus',
  ];

  return fields
    .map(field => {
      const value = contract[field];

      if (value === null || value === undefined || value === '') {
        // ✅ For numeric fields send 0, for string fields send empty
        const numericFields = [
          'BalanceBeforeApplication',
          'EarningAmount',
          'LastEncashmentLeave',
          'LeavesToEncashed',
          'RecId',
          'RemainingBalance',
        ];
        if (numericFields.includes(field)) {
          return `<${ns}:${field}>0</${ns}:${field}>`;
        }
        return `<${ns}:${field}></${ns}:${field}>`;
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

export {CreateEncashment};
