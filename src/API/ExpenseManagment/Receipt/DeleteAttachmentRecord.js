/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../Controller/secureConfig';

const DeleteAttachmentRecord = async ({recId}) => {
  try {
    const config = await getActiveConfigData();

    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    if (!recId) {
      throw new Error('Missing required parameter: recId');
    }

    const token = await getToken();

    const soapBody = `
      <deleteRecord xmlns="http://tempuri.org">
        <_recId>${recId}</_recId>
      </deleteRecord>
    `;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const response = await axios.post(
      `${config.resource}soap/services/DocumentAttachmentSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/DocumentAttachmentSvc/deleteRecord',
        },
        responseType: 'text',
        timeout: 30000,
        validateStatus: () => true,
      },
    );

    const xml = response.data;

    if (!xml || xml.trim() === '') {
      return {
        success: false,
        message: 'Empty response received from server',
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

    const fault = parsed?.['s:Envelope']?.['s:Body']?.['s:Fault'];
    if (fault) {
      const faultString =
        fault?.faultstring || fault?.Reason?.Text || 'Unknown SOAP fault';
      return {
        success: false,
        message: `Delete failed: ${faultString}`,
      };
    }

    // Response shape: deleteRecordResponse > result (GeneralContract)
    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['deleteRecordResponse']?.result;

    if (!result) {
      return {
        success: false,
        message: 'No result returned from delete operation',
      };
    }

    const cleanObject = obj =>
      Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^[a-zA-Z0-9]+:/, ''),
          value,
        ]),
      );

    const cleaned = cleanObject(result);

    const success =
      cleaned.IsSuccess === true ||
      String(cleaned.IsSuccess).toLowerCase() === 'true';

    return {
      success,
      message:
        cleaned.Message ||
        (success
          ? 'Attachment deleted successfully'
          : 'Failed to delete attachment'),
      recId: cleaned.RecId,
    };
  } catch (err) {
    console.error(
      'DeleteAttachmentRecord SOAP error:',
      err.response?.data || err.message,
    );

    let errorMessage = 'Failed to delete attachment';

    if (err.response?.status === 500) {
      errorMessage = 'Server error occurred while deleting attachment';
    } else if (err.response?.status === 401) {
      errorMessage = 'Authentication failed. Please check credentials';
    } else if (err.response?.status === 403) {
      errorMessage = 'You do not have permission to delete this attachment';
    } else if (err.message) {
      errorMessage = err.message;
    }

    return {
      success: false,
      message: errorMessage,
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

  let errorMessage = 'SOAP Fault Occurred';
  if (fault?.faultstring) {
    errorMessage =
      typeof fault.faultstring === 'string'
        ? fault.faultstring
        : fault.faultstring['#text'];
  }

  return {
    success: false,
    message: errorMessage,
    faultDetails: fault,
  };
};

export {DeleteAttachmentRecord};
