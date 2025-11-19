/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const ApproveWorkItem = async ({correlationId}) => {
  try {
    // Support passing an object with CorrelationId or a raw value
    if (typeof correlationId === 'object') {
      if ('correlationId' in correlationId) {
        correlationId = correlationId.correlationId;
      } else {
        throw new Error(
          'Invalid CorrelationId. Expected a string/number or object with CorrelationId.',
        );
      }
    }

    // Fetch active configuration
    const config = await getActiveConfigData();
    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    // Get bearer token
    const token = await getToken();

    // Build SOAP body
    const soapBody = `
      <approveWFByCorrelationId xmlns="http://tempuri.org">
        <_correlationId>${correlationId}</_correlationId>
      </approveWFByCorrelationId>`;

    const soapEnvelope = createSoapEnvelope(soapBody);
    // Send SOAP request
    const {data: xml} = await axios.post(
      `${config.resource}soap/services/EssWorkflowSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/ESSWorkflowSvc/approveWFByCorrelationId',
        },
        responseType: 'text',
      },
    );

    // Parse XML response
    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: false,
    });

    const parsed = parser.parse(xml);
    // Extract result from possible SOAP namespaces
    const result =
      parsed?.['s:Envelope']?.['s:Body']?.[
        'approveWFByCorrelationIdResponse'
      ]?.['result'] ||
      parsed?.['soap:Envelope']?.['soap:Body']?.[
        'approveWFByCorrelationIdResponse'
      ]?.['result'];
    console.log('Result in Approve', result);
    if (!result) {
      console.log('No result found in Approve SOAP response');
      return null;
    }

    // Clean namespace prefixes recursively
    const cleanObject = obj => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(cleanObject);

      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^[a-zA-Z0-9]+:/, ''),
          typeof value === 'object' ? cleanObject(value) : value,
        ]),
      );
    };

    const cleanedResult = cleanObject(result);

    return cleanedResult;
  } catch (error) {
    console.error(
      'Failed to approve workflow:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export default ApproveWorkItem;
