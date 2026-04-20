/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

/**
 * SubmitEOSRequest API
 * @param {Object|number} param - Either a number (RecId) or object { recId: number }
 * @returns {Promise<Object>} - Returns cleaned GeneralContract object
 */
const SubmitEOSRequest = async param => {
  try {
    let recId = param;

    // Handle object input
    if (typeof recId === 'object') {
      if ('recId' in recId) {
        recId = recId.recId;
      } else {
        throw new Error('Invalid recId. Expected a number, got an object.');
      }
    }

    // Get current configuration
    const config = await getActiveConfigData();
    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    // Get token
    const token = await getToken();

    // Create SOAP body
    const soapBody = `
      <submitEOSRequestByRecId xmlns="http://tempuri.org">
        <_recId>${recId}</_recId>
      </submitEOSRequestByRecId>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    // Make SOAP request
    const {data: xml} = await axios.post(
      `${config.resource}soap/services/EssWorkflowSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/ESSWorkflowSvc/submitEOSRequestByRecId',
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

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['submitEOSRequestByRecIdResponse']?.[
        'GeneralContract'
      ] ||
      parsed?.['soap:Envelope']?.['soap:Body']?.[
        'submitEOSRequestByRecIdResponse'
      ]?.['GeneralContract'];

    if (!result) {
      console.log('No result found in SubmitEOSRequest SOAP response');
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

    return cleanObject(result);
  } catch (error) {
    console.error(
      'Failed to submit EOS request:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export default SubmitEOSRequest;
