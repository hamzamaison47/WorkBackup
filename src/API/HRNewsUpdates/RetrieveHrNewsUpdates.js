/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const RetrieveHrNewsUpdates = async () => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <retrieveWithoutDate xmlns="http://tempuri.org">
      </retrieveWithoutDate>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/HRNewsUpdatesSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/HRNewsUpdatesSvc/retrieveWithoutDate',
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
    const rawData =
      parsed?.['s:Envelope']?.['s:Body']?.['retrieveWithoutDateResponse']?.[
        'result'
      ]?.['a:HRNewsUpdatesSvcContract'] ||
      parsed?.['soap:Envelope']?.['soap:Body']?.[
        'retrieveWithoutDateResponse'
      ]?.['result']?.['a:HRNewsUpdatesSvcContract'];

    if (!rawData) {
      console.log('No employee requestioner data found');
      return [];
    }

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

    return cleanedData;
  } catch (err) {
    console.error(
      'RetrieveHRNewsUpdates SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {RetrieveHrNewsUpdates};
