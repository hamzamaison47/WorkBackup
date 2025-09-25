/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const GetRegisterDetails = async ({employeeId, fromDate, toDate}) => {
  try {
    const config = await getActiveConfigData();
    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // ✅ SOAP Body
    const soapBody = `
      <getRegisterDetails xmlns="http://tempuri.org">
        <_employeeId>${employeeId}</_employeeId>
        <fromDate>${fromDate}</fromDate>
        <toDate>${toDate}</toDate>
      </getRegisterDetails>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    // ✅ SOAP Request
    const {data: xml} = await axios.post(
      `${config.resource}soap/services/TASAttendanceRegisterSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/TASAttendanceRegisterSvc/getRegisterDetails',
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
      parsed?.['s:Envelope']?.['s:Body']?.['getRegisterDetailsResponse']?.[
        'result'
      ]?.['a:TASAttendanceRegisterSvcContract'];

    if (!rawData) {
      console.log('⚠️ No register details found in SOAP response');
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
      '❌ GetRegisterDetails SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {GetRegisterDetails};
