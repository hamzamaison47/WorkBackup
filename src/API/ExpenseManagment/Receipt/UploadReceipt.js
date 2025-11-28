/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {getActiveConfigData} from '../../../Controller/secureConfig';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';

const UploadReceipt = async ({
  legalEntity,
  fileName,
  capturedReceipt,
  contentType,
  fileExtension,
  employeeId,
}) => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource)
      throw new Error('No configuration found. Please scan QR code first.');

    if (
      !legalEntity ||
      !fileName ||
      !capturedReceipt ||
      !contentType ||
      !fileExtension ||
      !employeeId
    ) {
      throw new Error('Missing required fields for UploadReceipt.');
    }

    const token = await getToken();

    // SOAP tags in alphabetical order
    const soapBody = `
      <UploadReceipt xmlns="http://tempuri.org">
        <capturedReceipt>${escapeXml(capturedReceipt)}</capturedReceipt>
        <contentType>${escapeXml(contentType)}</contentType>
        <employeeId>${escapeXml(employeeId)}</employeeId>
        <fileExtension>${escapeXml(fileExtension)}</fileExtension>
        <fileName>${escapeXml(fileName)}</fileName>
        <legalEntity>${escapeXml(legalEntity)}</legalEntity>
      </UploadReceipt>
    `;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const response = await axios.post(
      `${config.resource}soap/services/ExpenseManagmentSvcGroup/ExpenseReceiptSvc`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/ExpenseReceiptSvc/UploadReceipt',
        },
        responseType: 'text',
        timeout: 30000,
        validateStatus: () => true,
      },
    );

    const xml = response.data;

    // EMPTY response
    if (!xml || xml.trim() === '') {
      return {
        IsSuccess: false,
        Message: 'Empty response received from server.',
        AlertType: 'Error',
      };
    }

    // SOAP Fault handling
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

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['UploadReceiptResponse']?.return;

    if (!result) {
      return {
        IsSuccess: false,
        Message: 'UploadReceipt returned no data.',
        AlertType: 'Error',
      };
    }

    // Extract Receipt Contracts
    const receipts = extractReceiptContracts(result);

    return {
      IsSuccess: true,
      Message: 'Receipt Uploaded Successfully',
      AlertType: 'Success',
      Receipts: receipts,
    };
  } catch (err) {
    console.error('UploadReceipt Error:', err?.response?.data || err.message);

    let errorMessage = 'Error Uploading Receipt';

    if (err?.response?.data) {
      try {
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: '@_',
        });
        const errorParsed = parser.parse(err.response.data);
        const fault = errorParsed?.['s:Envelope']?.['s:Body']?.['s:Fault'];
        if (fault?.faultstring) {
          errorMessage =
            typeof fault.faultstring === 'string'
              ? fault.faultstring
              : fault.faultstring['#text'];
        }
      } catch (e) {
        // Ignore parse errors
      }
    } else if (err.message) {
      errorMessage = err.message;
    }

    return {
      IsSuccess: false,
      Message: errorMessage,
      AlertType: 'Error',
    };
  }
};

/* ---------------------- Helpers ------------------------- */

const extractReceiptContracts = obj => {
  const receipts = obj?.['a:ExpenseReceiptContract'] || obj;

  if (!receipts) return [];

  if (Array.isArray(receipts)) {
    return receipts.map(r => flattenContract(r));
  }

  return [flattenContract(receipts)];
};

const flattenContract = contract => {
  const out = {};
  for (const key in contract) {
    const cleanKey = key.replace('a:', '');
    if (typeof contract[key] === 'string') {
      out[cleanKey] = contract[key];
    } else if (contract[key]?.['#text']) {
      out[cleanKey] = contract[key]['#text'];
    } else if (contract[key] !== null && contract[key] !== undefined) {
      out[cleanKey] = contract[key];
    }
  }
  return out;
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
    IsSuccess: false,
    Message: errorMessage,
    AlertType: 'Error',
    FaultDetails: fault,
  };
};

const escapeXml = value =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export {UploadReceipt};
