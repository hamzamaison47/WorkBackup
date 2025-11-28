/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../Controller/secureConfig';

const DeleteReceipts = async ({docuRefRecIds}) => {
  try {
    const config = await getActiveConfigData();

    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    if (!docuRefRecIds || docuRefRecIds.length === 0) {
      throw new Error('Missing required parameter: docuRefRecIds');
    }

    const token = await getToken();

    // Build the Int64[] structure required by SOAP
    const recIdsXml = Array.isArray(docuRefRecIds)
      ? docuRefRecIds.map(id => `<a:long>${id}</a:long>`).join('')
      : `<a:long>${docuRefRecIds}</a:long>`;

    // SOAP tags in alphabetical order (docuRefRecIds is the only parameter)
    const soapBody = `
      <DeleteReceipts xmlns="http://tempuri.org">
        <docuRefRecIds xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
          ${recIdsXml}
        </docuRefRecIds>
      </DeleteReceipts>
    `;

    const soapEnvelope = createSoapEnvelope(soapBody);

    // console.log({soapEnvelope});

    const response = await axios.post(
      `${config.resource}soap/services/ExpenseManagmentSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/ExpenseReceiptSvc/DeleteReceipts',
        },
        responseType: 'text',
        timeout: 30000,
        validateStatus: () => true,
      },
    );

    // console.log({response});

    const xml = response.data;

    // console.log({xml});

    // Handle empty response
    if (!xml || xml.trim() === '') {
      // Empty response might indicate success for void return type
      return {
        success: true,
        message: 'Receipts deleted successfully',
        deletedRecIds: docuRefRecIds,
      };
    }

    // Check SOAP Fault
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
      const faultString =
        fault?.faultstring || fault?.Reason?.Text || 'Unknown SOAP fault';
      return {
        success: false,
        message: `DeleteReceipts failed: ${faultString}`,
      };
    }

    const deleteResponse =
      parsed?.['s:Envelope']?.['s:Body']?.['DeleteReceiptsResponse'];

    const result = deleteResponse?.return;

    // console.log({result});

    // For void return type, empty/null result indicates success
    const success = result === '' || result === null || result === undefined;

    return {
      success,
      message: success
        ? 'Receipts deleted successfully'
        : 'Delete operation completed with warnings',
      deletedRecIds: docuRefRecIds,
      response: result,
    };
  } catch (err) {
    console.error(
      'Delete Receipts SOAP error:',
      err.response?.data || err.message,
    );

    let errorMessage = 'Failed to delete receipts';

    if (err.response?.status === 500) {
      errorMessage = 'Server error occurred while deleting receipts';
    } else if (err.response?.status === 401) {
      errorMessage = 'Authentication failed. Please check credentials';
    } else if (err.response?.status === 403) {
      errorMessage = 'You do not have permission to delete receipts';
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

export {DeleteReceipts};
