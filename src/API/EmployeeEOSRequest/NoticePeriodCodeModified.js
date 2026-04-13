/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const NoticePeriodCodeModified = async (
  noticePeriodCode,
  employeeId,
  notificationDate,
) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // ✅ SOAP Body WITH parameters
    const soapBody = `
      <onNoticePeriodCodeModified xmlns="http://tempuri.org">
       
        <_employeeId>${employeeId}</_employeeId>
         <_code>${noticePeriodCode}</_code>
        <_notificationDate>${notificationDate}</_notificationDate>
      </onNoticePeriodCodeModified>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/PREmployeeEOSRequestsSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/PREmployeeEOSRequestsSvc/onNoticePeriodCodeModified',
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

    console.log(
      'NoticePeriodCodeModified RESPONSE:',
      JSON.stringify(parsed, null, 2),
    );

    const rawData =
      parsed['s:Envelope']['s:Body']['onNoticePeriodCodeModifiedResponse'][
        'result'
      ]['a:PREmployeeEOSRequestsSvcContract'];

    if (!rawData) {
      console.log('No data returned');
      return null;
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

    return cleanedData;
  } catch (err) {
    console.error(
      'NoticePeriodCodeModified SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {NoticePeriodCodeModified};
