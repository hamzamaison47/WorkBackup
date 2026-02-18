/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../Controller/secureConfig';

const UpdateIdentityRequest = async ({identityData}) => {
  try {
    const config = await getActiveConfigData();
    console.log('Identity Data in SOAP API:', identityData);
    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <update xmlns="http://tempuri.org">
        <contract xmlns:tem="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">
          ${buildContractXml(identityData)}
        </contract>
      </update>`;

    const soapEnvelope = createSoapEnvelope(soapBody);
    console.log('Soap Envelope :', soapEnvelope);
    const {data: xml} = await axios.post(
      `${config.resource}soap/services/HcmPersonIdentificationNumberSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/HcmPersonIdentificationNumberSvc/update',
        },
        responseType: 'text',
      },
    );

    console.log('Raw Result :', xml);

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: false,
    });

    const parsed = parser.parse(xml);

    const envelope = parsed?.['s:Envelope'] || parsed?.['soap:Envelope'];

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['updateResponse']?.['result'] ||
      parsed?.['soap:Envelope']?.['soap:Body']?.['updateResponse']?.['result'];

    if (!result) {
      console.log('No result found in SOAP response');
      return null;
    }

    const cleanedResult = cleanObject(result);

    // 🔹 Extract Infolog message (fallback)
    const infolog =
      envelope?.['s:Header']?.['Infolog'] ||
      envelope?.['soap:Header']?.['Infolog'];

    let infologMessage = null;

    if (infolog?.['Entries']?.['InfologEntry']) {
      const entry = infolog['Entries']['InfologEntry'];

      if (Array.isArray(entry)) {
        infologMessage = entry
          .map(e => e?.['Message'])
          .filter(Boolean)
          .join('\n');
      } else {
        infologMessage = entry?.['Message'] || null;
      }
    }

    // 🔹 Prefer result.Message, fallback to infolog
    let finalMessage =
      cleanedResult?.Message && cleanedResult.Message.trim() !== ''
        ? cleanedResult.Message
        : infologMessage;

    cleanedResult.Message = finalMessage;

    console.log('Cleaned Result ', cleanedResult);
    return cleanedResult;
  } catch (error) {
    console.error(
      'Failed to update Identification request:',
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
    'RecId',
    'WorkflowOperation',
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
      key.replace(/^[a-zA-Z0-9]+:/, ''),
      typeof value === 'object' ? cleanObject(value) : value,
    ]),
  );
};

export {UpdateIdentityRequest};
