/* eslint-disable dot-notation */
import {getActiveConfigData} from '../../Controller/secureConfig';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';

const retrieveAllOverTimePlanner = async ({employeeId}) => {
  try {
    // Get configuration from secure storage
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <retrieveAll xmlns="http://tempuri.org">
        <_EmployeeId>${employeeId}</_EmployeeId>
      </retrieveAll>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/TASOvertimePlannerServiceGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/TASOvertimePlannerSvc/retrieveAll',
        },
        responseType: 'text',
      },
    );

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      parseTagValue: true,
      isArray: tagName => tagName.includes('TASOvertimeContract'),
    });

    const parsed = parser.parse(xml);

    const rawData =
      parsed?.['s:Envelope']?.['s:Body']?.['retrieveAllResponse']?.['result']?.[
        'a:TASOvertimeContract'
      ];

    if (!rawData) {
      console.log('No Overtime Response found');
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

    console.log('Cleaned Overtime Data:', JSON.stringify(cleanedData, null, 2));

    return cleanedData;
  } catch (err) {
    console.error(
      'Retrieve Overtime SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {retrieveAllOverTimePlanner};
