/* eslint-disable dot-notation */
import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';

const RetrieveAllLeaves = async ({employeeId}) => {
  try {
    const token = await getToken();

    const soapBody = `
      <findByEmployee xmlns="http://tempuri.org">
        <_employeeId>${employeeId}</_employeeId>
      </findByEmployee>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${resource}soap/services/PREmployeeLeavesSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/PREmployeeLeavesSvc/findByEmployee',
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
      ]?.['a:PREmployeeLeavesSvcContract'];

    if (!rawData) {
      console.log('No leave data found');
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
    console.error('RetrieveAll SOAP error:', err.response?.data || err.message);
    throw err;
  }
};

export {RetrieveAllLeaves};
