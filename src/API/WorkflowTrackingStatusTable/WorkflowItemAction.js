/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const WorkflowItemAction = async ({recId, action}) => {
  try {
    if (!recId || (Array.isArray(recId) && recId.length === 0)) {
      throw new Error('recId is required and cannot be empty.');
    }

    if (!action) {
      throw new Error('workflow action is required.');
    }

    // 🔵 Normalize to array (supports single or list)
    const recIdList = Array.isArray(recId) ? recId : [recId];

    // Get active environment configuration
    const config = await getActiveConfigData();
    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    // Get access token
    const token = await getToken();

    // 🔵 Build SOAP body for bulk processing
    const soapBody = `
      <workflowBulkActionProcess xmlns="http://tempuri.org">
        <_comments>Mobile</_comments>
        <_userId></_userId>
        <_workflowAction>${action}</_workflowAction>
        <_workflowWorkItemRecId xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
          ${recIdList.map(id => `<a:long>${Number(id)}</a:long>`).join('')}
        </_workflowWorkItemRecId>
      </workflowBulkActionProcess>`;

    const soapEnvelope = createSoapEnvelope(soapBody);
    console.log('Soap Envelope: ', soapEnvelope);
    const {data: xml} = await axios.post(
      `${config.resource}soap/services/EssWorkflowSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/ESSWorkflowSvc/workflowBulkActionProcess',
        },
        responseType: 'text',
      },
    );
    console.log('Response XML:', xml);
    // 🔵 Parse XML response
    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: false,
    });

    const parsed = parser.parse(xml);

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.[
        'workflowBulkActionProcessResponse'
      ]?.['result'] ||
      parsed?.['Envelope']?.['Body']?.['workflowBulkActionProcessResponse']?.[
        'result'
      ];

    if (!result) {
      console.log('No result found in workflowBulkActionProcess response');
      return null;
    }

    // 🔵 Remove namespace prefixes recursively
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

    const infolog =
      parsed?.['s:Header']?.['Infolog'] || parsed?.['soap:Header']?.['Infolog'];

    let infologMessage = null;

    if (infolog?.['Entries']?.['InfologEntry']) {
      const entry = infolog['Entries']['InfologEntry'];

      if (Array.isArray(entry)) {
        infologMessage = entry
          .map(e => e?.['Message'])
          .filter(Boolean)
          .join('\n');
      } else {
        infologMessage = entry?.['Message'] || null;
      }
    }
    cleanedResult.Message = '';
    // 🔹 Prefer result.Message, fallback to infolog
    let finalMessage =
      cleanedResult?.Message && cleanedResult.Message.trim() !== ''
        ? cleanedResult.Message
        : infologMessage;

    cleanedResult.Message = finalMessage;

    return cleanedResult;
  } catch (error) {
    console.error(
      'Workflow bulk action failed:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export default WorkflowItemAction;
