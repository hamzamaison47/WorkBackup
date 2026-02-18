/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../Controller/secureConfig';

const SubmitIdentificationRequest = async ({recId}) => {
  console.log('ReciD : ', recId);
  try {
    // Handle if recId comes wrapped in an object
    if (typeof recId === 'object') {
      if ('recId' in recId) {
        recId = recId.recId;
      } else {
        throw new Error('Invalid recId. Expected a number, got an object.');
      }
    }

    // Load environment config (from QR setup or config file)
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    // Get access token
    const token = await getToken();

    // Build SOAP body for submit identification
    const soapBody = `
      <submitESSPersonIdentificaitonNumberByRecId xmlns="http://tempuri.org">
        <_recId>${recId}</_recId>
      </submitESSPersonIdentificaitonNumberByRecId>`;

    // Wrap inside SOAP envelope
    const soapEnvelope = createSoapEnvelope(soapBody);
    // Make SOAP POST request
    const {data: xml} = await axios.post(
      `${config.resource}soap/services/EssWorkflowSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/ESSWorkflowSvc/submitESSPersonIdentificaitonNumberByRecId',
        },
        responseType: 'text',
      },
    );

    // Parse SOAP XML response
    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: false,
    });

    const parsed = parser.parse(xml);

    // Extract result node from response (handle different namespace patterns)
    const result =
      parsed?.['s:Envelope']?.['s:Body']?.[
        'submitESSPersonIdentificaitonNumberByRecIdResponse'
      ]?.['result'] ||
      parsed?.['soap:Envelope']?.['soap:Body']?.[
        'submitESSPersonIdentificaitonNumberByRecIdResponse'
      ]?.['result'];

    if (!result) {
      console.log('No result found in Submit Identification SOAP response');
      return null;
    }

    // Utility: remove namespace prefixes for cleaner keys
    const cleanObject = obj => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(cleanObject);

      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^[a-zA-Z0-9]+:/, ''), // remove "ns1:", etc.
          typeof value === 'object' ? cleanObject(value) : value,
        ]),
      );
    };
    const cleanedResult = cleanObject(result);
    console.log('Cleaned Resut: ', cleanedResult);

    return cleanedResult;
  } catch (error) {
    console.error(
      'Failed to submit identification request:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export {SubmitIdentificationRequest};
