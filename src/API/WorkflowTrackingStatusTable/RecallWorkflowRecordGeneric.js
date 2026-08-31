/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

/**
 * Generic recall (cancel) of an in-review workflow record, calling
 * ESSWorkflowSvc::recallWorkflowRecordGeneric. Works for any table wired
 * up on the X++ side — caller just supplies the table's tableId and the
 * record's RecId.
 *
 * SOAP body field order follows the WSDL's alphabetical xs:sequence:
 * _comment, _recId, _tableId.
 */
const RecallWorkflowRecordGeneric = async ({tableId, recId, comment = ''}) => {
  try {
    if (!tableId || !recId) {
      throw new Error('tableId and recId are required to recall a record.');
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
      <recallWorkflowRecordGeneric xmlns="http://tempuri.org">
        <_comment>${comment}</_comment>
        <_recId>${recId}</_recId>
        <_tableId>${tableId}</_tableId>
      </recallWorkflowRecordGeneric>`;

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
            'http://tempuri.org/ESSWorkflowSvc/recallWorkflowRecordGeneric',
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
        'recallWorkflowRecordGenericResponse'
      ]?.['result'] ||
      parsed?.['soap:Envelope']?.['soap:Body']?.[
        'recallWorkflowRecordGenericResponse'
      ]?.['result'];

    console.log('Result in Recall', result);

    if (!result) {
      console.log('No result found in Recall SOAP response');
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
      'Failed to recall workflow record:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export default RecallWorkflowRecordGeneric;
