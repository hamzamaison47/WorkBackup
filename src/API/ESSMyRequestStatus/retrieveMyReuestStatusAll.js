/* eslint-disable dot-notation */
// import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const retrieveMyReuestStatusAll = async ({email}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <retrieveMySubmittedRequestsByEmail xmlns="http://tempuri.org">
        <_email>${email}</_email>
      </retrieveMySubmittedRequestsByEmail>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/WorkflowTrackingStatusTableSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/WorkflowTrackingStatusTableSvc/retrieveMySubmittedRequestsByEmail',
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
      parsed?.['s:Envelope']?.['s:Body']?.[
        'retrieveMySubmittedRequestsByEmailResponse'
      ]?.['result']?.['a:WorkflowTrackingStatusTableContract'] ||
      parsed?.['Envelope']?.['Body']?.[
        'retrieveMySubmittedRequestsByEmailResponse'
      ]?.['result']?.['WorkflowTrackingStatusTableContract'];

    if (!rawData) {
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
    console.log(cleanedData);
    return cleanedData;
  } catch (err) {
    console.error('RetrieveAll SOAP error:', err.response?.data || err.message);
    throw err;
  }
};

export {retrieveMyReuestStatusAll};
