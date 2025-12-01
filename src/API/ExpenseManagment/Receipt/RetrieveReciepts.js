/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../Controller/secureConfig';

const RetrieveReceipts = async ({recordRefRecId, tableName}) => {
  try {
    const config = await getActiveConfigData();

    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }
    if (!recordRefRecId) {
      throw new Error('Missing required parameter: recordRefRecId');
    }
    if (!tableName) {
      throw new Error('Missing required parameter: tableName');
    }

    const token = await getToken();

    const soapBody = `
      <retrieve xmlns="http://tempuri.org">
        <_recordRefRecId>${recordRefRecId}</_recordRefRecId>
        <_tableName>${tableName}</_tableName>
      </retrieve>
    `;

    const soapEnvelope = createSoapEnvelope(soapBody);

    // console.log({soapEnvelope});

    const response = await axios.post(
      `${config.resource}soap/services/DocumentAttachmentSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/DocumentAttachmentSvc/retrieve',
        },
        responseType: 'text',
        timeout: 30000,
        validateStatus: () => true,
      },
    );

    // console.log({response});

    const xml = response.data;
    // console.log({xml});

    if (!xml || xml.trim() === '') {
      return {
        success: false,
        message: 'Empty response received from server',
        attachments: [],
      };
    }

    if (xml.includes('s:Fault') || xml.includes('faultstring')) {
      return parseSoapFault(xml);
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseTagValue: true,
      trimValues: true,
    });

    const parsed = parser.parse(xml);

    // console.log({parsed});

    const fault = parsed?.['s:Envelope']?.['s:Body']?.['s:Fault'];
    if (fault) {
      return {
        success: false,
        message: fault?.faultstring ?? 'Unknown SOAP fault',
        attachments: [],
      };
    }

    // ✅ Correct Node Path
    const resultNode =
      parsed?.['s:Envelope']?.['s:Body']?.['retrieveResponse']?.result;

    if (!resultNode) {
      return {
        success: true,
        attachments: [],
        message: 'No attachments found',
      };
    }

    // Extract attachments (DocuRefContract)
    let contract = resultNode['a:DocuRefContract'];

    // Normalize into array
    let attachments = [];
    if (Array.isArray(contract)) {
      attachments = contract;
    } else if (typeof contract === 'object') {
      attachments = [contract];
    }

    // console.log({attachments});

    return {
      success: true,
      attachments,
      message: `Found ${attachments.length} attachment(s)`,
    };
  } catch (err) {
    console.error(
      'RetrieveReceipts SOAP error:',
      err.response?.data || err.message,
    );

    let errorMessage = 'Failed to retrieve receipts';

    if (err.response?.status === 500) {
      errorMessage = 'Server error occurred while retrieving receipts';
    } else if (err.response?.status === 401) {
      errorMessage = 'Authentication failed. Please check credentials';
    } else if (err.response?.status === 403) {
      errorMessage = 'You do not have permission to retrieve receipts';
    } else if (err.message) {
      errorMessage = err.message;
    }

    return {
      success: false,
      message: errorMessage,
      attachments: [],
    };
  }
};

const parseSoapFault = xml => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  const parsed = parser.parse(xml);
  const fault = parsed?.['s:Envelope']?.['s:Body']?.['s:Fault'];

  return {
    success: false,
    message: fault?.faultstring || 'SOAP Fault Occurred',
    attachments: [],
    faultDetails: fault,
  };
};

export {RetrieveReceipts};
