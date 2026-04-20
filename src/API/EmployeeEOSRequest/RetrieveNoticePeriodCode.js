/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const eosRetrieveNoticePeriodCode = async () => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // ✅ SOAP Body (no parameters)
    const soapBody = `
      <retrieveNoticePeriodCode xmlns="http://tempuri.org" />`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/PREmployeeEOSRequestsSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/PREmployeeEOSRequestsSvc/retrieveNoticePeriodCode',
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

    console.log('NoticePeriod SOAP RESPONSE:', JSON.stringify(parsed, null, 2));

    const rawData =
      parsed['s:Envelope']['s:Body']['retrieveNoticePeriodCodeResponse'][
        'result'
      ]['a:PREmployeeEOSRequestsSvcContract'];

    if (!rawData) {
      console.log('No Notice Period Codes found');
      return [];
    }

    // ✅ Clean namespace
    const cleanObject = obj =>
      Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^a:/, ''),
          value,
        ]),
      );

    const cleanedData = Array.isArray(rawData)
      ? rawData.map(cleanObject)
      : [cleanObject(rawData)];
    console.log(cleanedData);
    return cleanedData;
  } catch (err) {
    console.error(
      'EOS RetrieveNoticePeriodCode SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {eosRetrieveNoticePeriodCode};
