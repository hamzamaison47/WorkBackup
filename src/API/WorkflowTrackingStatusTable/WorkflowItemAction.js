/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const WorkflowItemAction = async ({recId, action}) => {
  try {
    // Get active environment configuration
    const config = await getActiveConfigData();
    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    // Get access token
    const token = await getToken();
    // Build SOAP body for rejection
    //User Id is to be filled inside Dynamics
    const soapBody = `
      <workflowBulkActionProcess xmlns="http://tempuri.org">
      <_comments>Mobile</_comments>
      <_userId></_userId> 
      <_workflowAction>${action}</_workflowAction>
        <_workflowWorkItemRecId xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
          ${recId.map(id => `<a:long>${id}</a:long>`).join('')}
        </_workflowWorkItemRecId>
      </workflowBulkActionProcess>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    console.log(soapEnvelope);
    // Send SOAP request via axios
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
    console.log('After API Call', xml);
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
      parsed?.['s:Envelope']?.['s:Body']?.[
        'workflowBulkActionProcessResponse'
      ]?.['result'] ||
      parsed?.['Envelope']?.['Body']?.['workflowBulkActionProcessResponse']?.[
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

export default WorkflowItemAction;
