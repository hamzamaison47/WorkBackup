import {getToken} from '../Token/getToken';
// import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const retrieveWorkflowHistory = async ({_recId, _tableId}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const accessToken = await getToken();

    // SOAP body
    const soapBody = `
      <retrieveAll xmlns="http://tempuri.org">
        <_recId>${_recId}</_recId>
        <_tableId>${_tableId}</_tableId>
      </retrieveAll>
    `;

    // Wrap in SOAP envelope
    const soapEnvelope = createSoapEnvelope(soapBody);

    // API call with axios
    const {data: xml} = await axios.post(
      `${config.resource}soap/services/ESSWorkflowHistorySvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/ESSWorkflowHistorySvc/retrieveAll',
        },
        responseType: 'text',
      },
    );
    // XML parser
    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: false,
    });

    const parsed = parser.parse(xml);
    const rawData =
      parsed?.['s:Envelope']?.['s:Body']?.['retrieveAllResponse']?.['result']?.[
        'a:ESSWorkflowHistoryContract'
      ];
    if (!rawData) {
      console.log('No workflow data found');
      return [];
    }

    // Normalize keys (remove "a:" prefix)
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
    console.error('Failed to fetch Work Flow Data:', error);
    throw error;
  }
};

export {retrieveWorkflowHistory};
