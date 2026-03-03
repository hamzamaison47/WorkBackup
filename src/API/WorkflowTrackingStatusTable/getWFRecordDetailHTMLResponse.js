import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {decode} from 'html-entities'; // <-- decode HTML entities
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const getWFRecordDetailHTMLResponse = async ({tableId, contextRecId}) => {
  try {
    if (!tableId || !contextRecId)
      throw new Error('Some Parameters are missing.');

    const config = await getActiveConfigData();
    if (!config || !config.resource) throw new Error('No configuration found.');

    const token = await getToken();

    const soapBody = `
      <getWFRecordDetailHTMLResponse xmlns="http://tempuri.org">
        <_contextRecId>${contextRecId}</_contextRecId>
        <_tableId>${tableId}</_tableId>
      </getWFRecordDetailHTMLResponse>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/WorkflowTrackingStatusTableSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/WorkflowTrackingStatusTableSvc/getWFRecordDetailHTMLResponse',
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

    // Extract the <result> content
    const resultEncoded =
      parsed?.['s:Envelope']?.['s:Body']?.[
        'getWFRecordDetailHTMLResponseResponse'
      ]?.['result'];

    if (!resultEncoded) return '<p>No data returned</p>';
    // Decode HTML entities
    const resultHtml = resultEncoded;

    return resultHtml;
  } catch (error) {
    console.error(
      'Failed to fetch HTML:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export default getWFRecordDetailHTMLResponse;
