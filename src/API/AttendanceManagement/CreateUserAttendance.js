/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const FIELDS = [
  'BSSID',
  'DeviceId',
  'FenceName',
  'GenerationType',
  'GeoFenceID',
  'Latitude',
  'LocationCode',
  'Longitude',
  'Mode',
  'NetworkID',
  'NetworkName',
  'PersonRecId',
  'PunchDateTime',
  'QRImage',
  'VerifyBiometric',
  'VerifyFaceId',
];

// D365 DFNoYes members travel on the wire as the strings 'Yes'/'No'. Callers
// hand us a boolean (or a 1/0 from a normalized SOAP read); anything else is
// already in wire form and passes through untouched.
const toNoYes = value => {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === 1 || value === 0) return value === 1 ? 'Yes' : 'No';
  return value;
};

const CreateUserAttendance = async ({attendanceData}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const normalizedData = {
      ...attendanceData,
      PersonRecId: attendanceData.PersonRecId
        ? Number(attendanceData.PersonRecId)
        : undefined,
    };

    normalizedData.VerifyFaceId = toNoYes(normalizedData.VerifyFaceId);
    normalizedData.VerifyBiometric = toNoYes(normalizedData.VerifyBiometric);

    const soapBody = `
      <create xmlns="http://tempuri.org">
        <contract xmlns:tem="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">
          ${buildContractXml(normalizedData)}
        </contract>
      </create>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    console.log('attendanceData payload:', normalizedData);
    console.log('SOAP Envelope:', soapEnvelope);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/DFUserAttendanceSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/DFUserAttendanceSvc/create',
        },
        responseType: 'text',
      },
    );

    if (xml.includes('<s:Fault>') || xml.includes('<soap:Fault>')) {
      const faultMessage = extractFaultMessage(xml);
      throw new Error(`Server error: ${faultMessage}`);
    }

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
      parsed?.['soap:Envelope']?.['soap:Body']?.['createResponse']?.[
        'result'
      ] ||
      parsed?.['Envelope']?.['Body']?.['createResponse']?.['result'];

    if (!result) {
      throw new Error(
        'Attendance could not be recorded. The server returned no result.',
      );
    }

    const cleanedResult = cleanObject(result);

    // The AX backend returns 'IsSuccess' (capital I capital S).
    // Check all known casing variants so no backend rejection is silently swallowed.
    const successVal =
      cleanedResult?.IsSuccess ??
      cleanedResult?.isSuccess ??
      cleanedResult?.success ??
      cleanedResult?.Success;
    if (successVal === false || String(successVal).toLowerCase() === 'false') {
      const serverMsg =
        cleanedResult?.Message ||
        cleanedResult?.message ||
        cleanedResult?.errorMessage ||
        'Attendance was rejected by the server.';
      throw new Error(serverMsg);
    }

    console.log('Attendance created successfully:', cleanedResult);
    return cleanedResult;
  } catch (error) {
    console.error(
      'Failed to create attendance:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

const buildContractXml = contract => {
  if (!contract) return '';

  const ns = 'tem';

  return FIELDS.map(field => {
    const value = contract[field];
    if (value === null || value === undefined || value === '') {
      return `<${ns}:${field} xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>`;
    }
    return `<${ns}:${field}>${escapeXmlValue(value)}</${ns}:${field}>`;
  }).join('');
};

const escapeXmlValue = value => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const extractFaultMessage = xmlString => {
  try {
    const faultMatch = xmlString.match(
      /<faultstring[^>]*>([^<]*)<\/faultstring>/,
    );
    if (faultMatch) return faultMatch[1];
    const detailMatch = xmlString.match(/<detail[^>]*>([^<]*)<\/detail>/);
    if (detailMatch) return detailMatch[1];
    return 'Unknown server error occurred';
  } catch {
    return 'Failed to parse server error message';
  }
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

export {CreateUserAttendance};
