/* eslint-disable dot-notation */
import {getActiveConfigData} from '../../Controller/secureConfig';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';

const RetrieveAll = async ({employeeId}) => {
  try {
    // Get configuration from secure storage
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <retrieveAll xmlns="http://tempuri.org">
        <_employeeId>${employeeId}</_employeeId>
      </retrieveAll>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/PREmployeeLeaveEncashmentSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/PREmployeeLeaveEncashmentSvc/retrieveAll',
        },
        responseType: 'text',
      },
    );

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      parseTagValue: true,
      isArray: tagName => tagName.includes('PREmployeeLeaveEncashmentContract'),
    });

    const parsed = parser.parse(xml);

    const rawData =
      parsed?.['s:Envelope']?.['s:Body']?.['retrieveAllResponse']?.['result']?.[
        'a:PREmployeeLeaveEncashmentContract'
      ];

    if (!rawData) {
      console.log('No Leave Encashment Response found');
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
      'Retrieve Leave Encashment SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {RetrieveAll};
