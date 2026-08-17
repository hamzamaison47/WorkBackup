/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../Controller/secureConfig';

/**
 * CreateEducationDetails
 * Calls the create() method exposed by HcmPersonEducationSvcGroup
 * (line-for-line copy of createLeaveRequest – only service + fields differ)
 */
const CreateEducationDetails = async ({educationData}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    console.log('Education Data: ', educationData);

    const token = await getToken();

    /* -------------  SOAP body (same shape as leave)  ------------- */
    const soapBody = `
      <create xmlns="http://tempuri.org">
        <contract xmlns:tem="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">
          ${buildContractXml(educationData)}
        </contract>
      </create>
    `;

    const soapEnvelope = createSoapEnvelope(soapBody);

    /* -------------  SOAP call (same axios pattern)  ------------- */
    const {data: xml} = await axios.post(
      `${config.resource}soap/services/HcmPersonEducationSvcGroup`, // << your working base address
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/HcmPersonEducationSvc/create', // << action you see in metadata
        },
        responseType: 'text',
      },
    );

    /* -------------  parse (identical to leave)  ------------- */
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
    console.log('Education Record Created (SOAP):', cleanedResult);
    return cleanedResult;
  } catch (error) {
    console.error(
      'CreateEducationDetails SOAP error:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

/* -------------  helpers (identical to leave – only fields differ)  ------------- */
const buildContractXml = contract => {
  if (!contract) return '';

  const ns = 'tem';
  const fields = [
    'Description',
    'Duration',
    'DurationUnit',
    'EducationDiscipline',
    'EducationDisciplineId',
    'EducationLevelID',
    'EmployeeId',
    'EndDate',
    'InstitutionID',
    'Notes',
    'Person',
    'RecId',
    'StartDate',
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

const escapeXmlValue = value => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export {CreateEducationDetails};
