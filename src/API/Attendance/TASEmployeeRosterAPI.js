import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const getRosterDetailsByDate = async ({employeeId, fromDate, toDate}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
          <getRosterDetailsByDate xmlns="http://tempuri.org">
            <_employeeId>${employeeId}</_employeeId>
            <fromDate>${fromDate}</fromDate>
            <toDate>${toDate}</toDate>
          </getRosterDetailsByDate>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/TASEmployeeRosterGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/TASEmployeeRosterSvc/getRosterDetailsByDate',
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
    const generalContracts =
      parsed?.['s:Envelope']?.['s:Body']?.getRosterDetailsByDateResponse
        ?.result?.['a:TASEmployeeRosterSvcContract'];

    if (!generalContracts) {
      console.warn('No response data found');
      return [];
    }

    const cleanObject = obj =>
      Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^a:/, ''),
          value,
        ]),
      );

    const cleanedData = Array.isArray(generalContracts)
      ? generalContracts.map(cleanObject)
      : [cleanObject(generalContracts)];

    return cleanedData;
  } catch (err) {
    console.error(
      'getRosterDetailsByDate SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export default getRosterDetailsByDate;
