/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const RejectWorkItem = async ({correlationId}) => {
  try {
    // Support passing an object with CorrelationId or a raw value
    if (typeof correlationId === 'object') {
      if ('CorrelationId' in correlationId) {
        correlationId = correlationId.CorrelationId;
      } else {
        throw new Error(
          'Invalid CorrelationId. Expected a string/number or object with CorrelationId.',
        );
      }
    }

    // Get active environment configuration
    const config = await getActiveConfigData();
    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    // Get access token
    const token = await getToken();

    // Build SOAP body for rejection
    const soapBody = `
      <rejectWFByCorrelationId xmlns="http://tempuri.org">
        <_correlationId>${correlationId}</_correlationId>
      </rejectWFByCorrelationId>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    // Send SOAP request via axios
    const {data: xml} = await axios.post(
      `${config.resource}soap/services/EssWorkflowSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/ESSWorkflowSvc/rejectWFByCorrelationId',
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
    // Extract result (namespace-safe)
    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['rejectWFByCorrelationIdResponse']?.[
        'result'
      ] ||
      parsed?.['Envelope']?.['Body']?.['rejectWFByCorrelationIdResponse']?.[
        'result'
      ];

    if (!result) {
      console.log('No result found in Reject SOAP response');
      return null;
    }

    // Recursively clean namespace prefixes
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
      'Failed to reject workflow:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export default RejectWorkItem;
