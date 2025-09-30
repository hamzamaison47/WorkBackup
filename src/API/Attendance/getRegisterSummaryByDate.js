/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const getRegisterSummaryByDate = async ({employeeId, fromDate, toDate}) => {
  try {
    const config = await getActiveConfigData();
    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // ✅ SOAP Body (your working JSON converted)
    const soapBody = `
      <getRegisterSummaryByDate xmlns="http://tempuri.org">
        <_employeeId>${employeeId}</_employeeId>
        <fromDate>${fromDate}</fromDate>
        <toDate>${toDate}</toDate>
      </getRegisterSummaryByDate>`;

    // Wrap with your helper
    const soapEnvelope = createSoapEnvelope(soapBody);

    console.log('soapEnvelope=-=-=-==-=-=-', soapEnvelope);

    // ✅ SOAP Request
    const {data: xml} = await axios.post(
      `${config.resource}soap/services/TASAttendanceRegisterSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/TASAttendanceRegisterSvc/getRegisterSummaryByDate',
        },
        responseType: 'text',
      },
    );
    console.log('xml=-=-=-==-=-=-', xml);

    // ✅ Parse XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: true,
    });

    const parsed = parser.parse(xml);

    console.log('parsed=-=-=-==-=-=-', parsed);

    // ✅ Navigate to result node
    const rawData =
      parsed?.['s:Envelope']?.['s:Body']?.[
        'getRegisterSummaryByDateResponse'
      ]?.['result']?.['a:TASAttendanceRegisterSvcContract'];

    console.log('rawData=-=-=-==-=-=-', rawData);

    if (!rawData) {
      console.log('⚠️ No register summary found in SOAP response');
      return [];
    }

    // ✅ Remove namespace prefixes like "a:"
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
      '❌ getRegisterSummaryByDate SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {getRegisterSummaryByDate};
