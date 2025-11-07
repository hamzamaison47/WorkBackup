// eslint-disable-next-line no-unused-vars
import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const retrieveEmployeeAdjustments = async ({employeeId, fromDate, toDate}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    console.log('-0-0-0-0-0-0-0-0-', employeeId);
    console.log('-0-0-0-0-0-0-0-0-', fromDate);
    console.log('-0-0-0-0-0-0-0-0-', toDate);

    const soapBody = `
          <retrieveEmployeeAdjustments xmlns="http://tempuri.org">
            <_employeeID>${employeeId}</_employeeID>
            <_fromDate>${fromDate}</_fromDate>
            <_toDate>${toDate}</_toDate>
          </retrieveEmployeeAdjustments>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    console.log('soapEnvelope-0-0-0-0-0-0-', soapEnvelope);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/TASEmployeeAdjustmentsGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/TASEmployeeAdjustmentSvc/retrieveEmployeeAdjustments',
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
      parsed?.['s:Envelope']?.['s:Body']?.retrieveEmployeeAdjustmentsResponse
        ?.result?.['a:TASEmployeeAdjustmentsSvcContract'];

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
      'retrieveEmployeeAdjustments SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export default retrieveEmployeeAdjustments;
