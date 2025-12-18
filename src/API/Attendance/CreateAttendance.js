/* eslint-disable curly */
/* eslint-disable dot-notation */
// import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const CreateAttendance = async ({employeeId, punchDateTime}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // ✅ SOAP body
    const soapBody = `
      <createAttendance xmlns="http://tempuri.org">
        <contract xmlns:tem="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">
          ${buildContractXml({employeeId, punchDateTime})}
        </contract>
      </createAttendance>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    console.log({soapEnvelope});

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/TASEmployeeTimeLogSVCGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/TASEmployeeTimeLogSVC/createAttendance',
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

    console.log('🔹 Raw XML Response:', xml);
    console.log('🔹 Parsed SOAP Response:', JSON.stringify(parsed, null, 2));

    // ✅ Response should be inside <createAttendanceResponse><result>
    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['createAttendanceResponse']?.[
        'result'
      ] ||
      parsed?.['soap:Envelope']?.['soap:Body']?.['createAttendanceResponse']?.[
        'result'
      ];

    if (!result) {
      console.log('⚠️ No result found in SOAP response', parsed);
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

    const cleanedResult = cleanObject(result);

    console.log('🔹 Cleaned Result:', cleanedResult);

    // ✅ return normalized result
    const returnObj = {
      recId: cleanedResult?.RecId,
      isSuccess:
        String(cleanedResult?.IsSuccess).toLowerCase() === 'true' ||
        cleanedResult?.IsSuccess === true,
      message: cleanedResult?.Message || 'No message returned',
    };
    console.log('🔹 Final Return Object:', returnObj);

    return returnObj;
  } catch (error) {
    console.error(
      '❌ Failed to create Attendance:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

// Build SOAP contract xml
const buildContractXml = ({employeeId, punchDateTime}) => {
  if (!employeeId && !punchDateTime) return '';

  const ns = 'tem';
  const fields = {
    EmployeeId: employeeId,
    GenerationType: 'MobileApp',
    PunchDate: punchDateTime,
  };

  return Object.entries(fields)
    .map(([field, value]) => {
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

export {CreateAttendance};
