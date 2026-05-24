import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const retrieveEOSItemWise = async ({employeeId, recId}) => {
  console.log('eeee', employeeId, recId);
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <retrieveEOSItemWise xmlns="http://tempuri.org">
        <_employeeId>${employeeId}</_employeeId>
        <_recId>${recId}</_recId>
      </retrieveEOSItemWise>`;

    console.log(employeeId, recId);

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/PREmployeeEOSClearanceItemsSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/PREmployeeEOSClearanceItemsSvc/retrieveEOSItemWise',
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
      parsed?.['s:Envelope']?.['s:Body']?.retrieveEOSItemWiseResponse?.result?.[
        'a:PREmployeeEOSClearanceItemsContract'
      ];

    if (!rawData) {
      console.log('No EOS Clearance Items data found');
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

    console.log('cleanedData', cleanedData);

    return cleanedData;
  } catch (err) {
    console.error(
      'RetrieveEOSItemWise SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {retrieveEOSItemWise};
