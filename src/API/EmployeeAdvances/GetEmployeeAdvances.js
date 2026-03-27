/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const GetEmployeeAdvances = async ({
  employeeId,
  payGroupCode = '',
  payPeriodCode = '',
}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <getEmployeeAdvances xmlns="http://tempuri.org">
        <_employeeId>${employeeId}</_employeeId>
        <_payGroupCode>${payGroupCode}</_payGroupCode>
        <_payPeriodCode>${payPeriodCode}</_payPeriodCode>
      </getEmployeeAdvances>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/PREmployeeAdvancesSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/PREmployeeAdvancesSvc/getEmployeeAdvances',
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
      parsed?.['s:Envelope']?.['s:Body']?.['getEmployeeAdvancesResponse']?.[
        'result'
      ]?.['a:PREmployeeAdvancesSvcContract'];

    if (!rawData) {
      console.log('No Employee Advances found');
      return [];
    }

    const cleanObject = obj => {
      if (obj === null || obj === undefined) {
        return obj;
      }
      if (typeof obj !== 'object') {
        return obj;
      }
      if (Array.isArray(obj)) {
        return obj.map(cleanObject);
      }

      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^[a-zA-Z0-9]+:/, ''),
          typeof value === 'object' ? cleanObject(value) : value,
        ]),
      );
    };

    const cleanedData = Array.isArray(rawData)
      ? rawData.map(cleanObject)
      : [cleanObject(rawData)];

    return cleanedData;
  } catch (err) {
    console.error(
      'Get Employee Advances SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {GetEmployeeAdvances};
