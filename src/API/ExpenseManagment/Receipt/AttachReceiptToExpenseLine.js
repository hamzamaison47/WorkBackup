/* eslint-disable dot-notation */
/* eslint-disable curly */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {getActiveConfigData} from '../../../Controller/secureConfig';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';

const AttachReceiptToExpenseLine = async ({
  docuRefRecId,
  expenseTransactionNumber,
  legalEntity,
  employeeId,
  isAttach,
}) => {
  try {
    const config = await getActiveConfigData();

    if (!config?.resource)
      throw new Error('No configuration found. Please scan QR code first.');

    if (!docuRefRecId)
      throw new Error(
        'docuRefRecId is required for AttachReceiptToExpenseLine',
      );

    if (!expenseTransactionNumber)
      throw new Error('expenseTransactionNumber is required');

    if (!legalEntity) throw new Error('legalEntity is required');

    if (!employeeId) throw new Error('employeeId is required');

    const token = await getToken();

    // SOAP tags in alphabetical order
    const soapBody = `
      <AttachReceiptToExpenseLine xmlns="http://tempuri.org">
        <docuRefRecId>${escapeXml(docuRefRecId)}</docuRefRecId>
        <employeeId>${escapeXml(employeeId)}</employeeId>
        <expenseTransactionNumber>${escapeXml(
          expenseTransactionNumber,
        )}</expenseTransactionNumber>
        <isAttach>${String(isAttach ?? true).toLowerCase()}</isAttach>
        <legalEntity>${escapeXml(legalEntity)}</legalEntity>
      </AttachReceiptToExpenseLine>
    `;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const response = await axios.post(
      `${config.resource}soap/services/ExpenseManagmentSvcGroup/ExpenseReceiptSvc`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/ExpenseReceiptSvc/AttachReceiptToExpenseLine',
        },
        responseType: 'text',
        timeout: 30000,
        validateStatus: () => true,
      },
    );

    const xml = response.data;

    // Handle empty response
    if (!xml || xml.trim() === '') {
      return {
        IsSuccess: false,
        Message: 'Empty response received from server',
        AlertType: 'Error',
      };
    }

    // Detect SOAP Fault
    if (xml.includes('s:Fault') || xml.includes('<faultstring')) {
      return parseSoapFault(xml);
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      trimValues: true,
      attributeNamePrefix: '@_',
      parseTagValue: true,
    });

    const parsed = parser.parse(xml);

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['AttachReceiptToExpenseLineResponse']
        ?.return;

    if (!result) {
      return {
        IsSuccess: false,
        Message: 'No valid response returned from the server',
        AlertType: 'Error',
        RawResponse: parsed,
      };
    }

    // Extract GeneralContract fields
    const flatResult = flattenGeneralContract(result);

    return {
      IsSuccess: true,
      Message: isAttach
        ? 'Receipt successfully attached to expense line'
        : 'Receipt successfully detached from expense line',
      AlertType: 'Success',
      Result: flatResult,
    };
  } catch (err) {
    console.error('AttachReceiptToExpenseLine Error:', err);

    return {
      IsSuccess: false,
      Message: err.message || 'Unknown error occurred',
      AlertType: 'Error',
    };
  }
};

// ========================================================
// Helper Functions
// ========================================================

const flattenGeneralContract = contract => {
  if (!contract || typeof contract !== 'object') return contract;

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
  } else if (fault?.detail?.Fault?.ExceptionMessage) {
    errorMessage = fault.detail.Fault.ExceptionMessage;
  }

  return {
    IsSuccess: false,
    Message: errorMessage,
    AlertType: 'Error',
    FaultDetails: fault,
  };
};

const escapeXml = value =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&apos;')
    .replace(/"/g, '&quot;');

export {AttachReceiptToExpenseLine};
