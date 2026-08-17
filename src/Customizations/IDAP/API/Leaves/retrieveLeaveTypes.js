/* eslint-disable dot-notation */
// import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../Controller/secureConfig';

const retrieveLeaveTypes = async ({employeeId}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <retrieveLeaveTypes xmlns="http://tempuri.org">
        <_employeeId>${employeeId}</_employeeId>
      </retrieveLeaveTypes>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/DFEmployeeLeaveRequestSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/DFEmployeeLeaveRequestSvc/retrieveLeaveTypes',
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
      parsed?.['s:Envelope']?.['s:Body']?.['retrieveLeaveTypesResponse']?.[
        'result'
      ]?.['a:DFEmployeeLeaveRequestContract'];

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

export {retrieveLeaveTypes};
