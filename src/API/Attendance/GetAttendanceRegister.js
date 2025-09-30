/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const GetAttendanceRegister = async ({employeeId, attendanceDate}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // ✅ SOAP Body
    const soapBody = `
      <getAttendanceRegister xmlns="http://tempuri.org">
      <_attendanceDate>${attendanceDate}</_attendanceDate>
      <_employeeId>${employeeId}</_employeeId>
        
      </getAttendanceRegister>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    // console.log('0-0-0-0-0-0-0-0-0-', soapEnvelope);

    // ✅ SOAP Request
    const {data: xml} = await axios.post(
      `${config.resource}soap/services/TASAttendanceRegisterSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/TASAttendanceRegisterSvc/getAttendanceRegister',
        },
        responseType: 'text',
      },
    );

    // ✅ Parse XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: true,
    });

    const parsed = parser.parse(xml);

    // ✅ Navigate to result
    const rawData =
      parsed?.['s:Envelope']?.['s:Body']?.['getAttendanceRegisterResponse']?.[
        'result'
      ]?.['a:TASAttendanceRegisterSvcContract'];

    if (!rawData) {
      console.log('⚠️ No attendance register found in SOAP response');
      return [];
    }

    // ✅ Clean namespaces like "a:"
    const cleanObject = obj =>
      Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^a:/, ''),
          value,
        ]),
      );

    // ✅ Handle single vs multiple
    const cleanedData = Array.isArray(rawData)
      ? rawData.map(cleanObject)
      : [cleanObject(rawData)];

    return cleanedData;
  } catch (err) {
    console.error(
      '❌ GetAttendanceRegister SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {GetAttendanceRegister};
