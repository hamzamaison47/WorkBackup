/* eslint-disable dot-notation */
import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';

const PayGroupPayperiodByEmployeeId = async ({employeeId}) => {
  try {
    const accessToken = await getToken();

    const soapBody = `
      <findByEmployee xmlns="http://tempuri.org">
        <_employeeId>${employeeId}</_employeeId>
      </findByEmployee>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${resource}soap/services/PRPayGroupPayPeriodSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/PRPayGroupPayPeriodSvc/findByEmployee',
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
      parsed?.['s:Envelope']?.['s:Body']?.['findByEmployeeResponse']?.[
        'result'
      ]?.['a:PRPayGroupPayPeriodSvcContract'];

    console.log('Parsed In Email Salary Slip', parsed);
    console.log('Raw Data In Email Salary Slip', rawData);

    if (!rawData) {
      console.warn('No Pay Periods found');
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
  } catch (error) {
    console.error('Failed to fetch PayGroup PayPeriodData:', error);
    throw error;
  }
};

export {PayGroupPayperiodByEmployeeId};
