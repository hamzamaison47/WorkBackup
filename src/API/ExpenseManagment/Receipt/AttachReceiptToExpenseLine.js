/* eslint-disable dot-notation */
/* eslint-disable curly */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {getActiveConfigData} from '../../../Controller/secureConfig';

const AttachReceiptToExpenseLine = async ({
  docuRefRecId,
  expenseTransactionNumber,
  legalEntity,
  employeeId,
  isAttach = true,
}) => {
  console.log('🔵 [AttachReceipt] START - Attaching receipt via SOAP...');
  console.log('📋 Attachment Details:', {
    docuRefRecId,
    expenseTransactionNumber,
    legalEntity,
    employeeId,
    isAttach,
  });

  try {
    const config = await getActiveConfigData();
    console.log('🔵 [AttachReceipt] Config loaded:', {
      hasResource: !!config?.resource,
      resource: config?.resource ? '✓' : '✗',
    });

    if (!config?.resource)
      throw new Error('No configuration found. Please scan QR code first.');

    // Validate required fields
    if (!docuRefRecId) {
      console.log('❌ [AttachReceipt] Missing docuRefRecId');
      throw new Error(
        'docuRefRecId is required for AttachReceiptToExpenseLine',
      );
    }

    if (!expenseTransactionNumber) {
      console.log('❌ [AttachReceipt] Missing expenseTransactionNumber');
      throw new Error('expenseTransactionNumber is required');
    }

    if (!legalEntity) {
      console.log('❌ [AttachReceipt] Missing legalEntity');
      throw new Error('legalEntity is required');
    }

    if (!employeeId) {
      console.log('❌ [AttachReceipt] Missing employeeId');
      throw new Error('employeeId is required');
    }

    console.log('🔵 [AttachReceipt] Getting authentication token...');
    const token = await getToken();
    console.log('🔵 [AttachReceipt] Token received:', token ? '✓' : '✗');

    // FIX: Create the exact SOAP envelope structure from .NET example
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Header>
    <h:CallContext xmlns:h="http://schemas.microsoft.com/dynamics/2013/01/datacontracts" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
      <h:Company>${escapeXml(legalEntity)}</h:Company>
      <h:Language i:nil="true"></h:Language>
      <h:MessageId>${generateMessageId()}</h:MessageId>
      <h:PartitionKey i:nil="true"></h:PartitionKey>
    </h:CallContext>
  </s:Header>
  <s:Body>
    <AttachReceiptToExpenseLine xmlns="http://tempuri.org">
      <docuRefRecId>${escapeXml(docuRefRecId)}</docuRefRecId>
      <employeeId>${escapeXml(employeeId)}</employeeId>
      <expenseTransactionNumber>${escapeXml(
        expenseTransactionNumber,
      )}</expenseTransactionNumber>
      <isAttach>${String(isAttach).toLowerCase()}</isAttach>
      <legalEntity>${escapeXml(legalEntity)}</legalEntity>
    </AttachReceiptToExpenseLine>
  </s:Body>
</s:Envelope>`;

    console.log(
      '🔵 [AttachReceipt] SOAP Envelope created, length:',
      soapEnvelope.length,
    );
    console.log(
      '🔵 [AttachReceipt] SOAP Envelope preview:',
      soapEnvelope.substring(0, 500) + '...',
    );

    // FIX: Use the correct endpoint (same as UploadReceipt)
    const endpoint = `${config.resource}soap/services/ExpenseManagmentSvcGroup`;

    console.log('🔵 [AttachReceipt] Making SOAP API call to:', endpoint);

    const response = await axios.post(endpoint, soapEnvelope, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/xml;charset=utf-8',
        SOAPAction:
          'http://tempuri.org/ExpenseReceiptSvc/AttachReceiptToExpenseLine',
      },
      responseType: 'text',
      timeout: 30000,
      validateStatus: () => true,
    });

    console.log('🔵 [AttachReceipt] API Response received:', {
      status: response.status,
      statusText: response.statusText,
    });

    const xml = response.data;
    console.log('🔵 [AttachReceipt] Response XML length:', xml?.length);
    console.log(
      '🔵 [AttachReceipt] Response XML preview (first 1000 chars):',
      xml?.substring(0, 1000),
    );

    // Handle empty response
    if (!xml || xml.trim() === '') {
      console.log('❌ [AttachReceipt] Empty response from server');
      return {
        IsSuccess: false,
        Message: 'Empty response received from server',
        AlertType: 'Error',
      };
    }

    // Detect SOAP Fault
    if (xml.includes('s:Fault') || xml.includes('<faultstring')) {
      console.log('❌ [AttachReceipt] SOAP Fault detected in response');
      return parseSoapFault(xml);
    }

    console.log('🔵 [AttachReceipt] Parsing XML response...');
    const parser = new XMLParser({
      ignoreAttributes: false,
      trimValues: true,
      attributeNamePrefix: '@_',
      parseTagValue: true,
      ignoreNamespace: true,
    });

    const parsed = parser.parse(xml);
    console.log(
      '🔵 [AttachReceipt] Full parsed XML structure:',
      JSON.stringify(parsed, null, 2),
    );

    // DEBUG: Check the exact structure
    const envelope = parsed?.['s:Envelope'];
    const body = envelope?.['s:Body'];
    const attachResponse = body?.['AttachReceiptToExpenseLineResponse'];

    console.log('🔵 [AttachReceipt] Structure debug:', {
      hasEnvelope: !!envelope,
      hasBody: !!body,
      hasAttachResponse: !!attachResponse,
      attachResponseKeys: attachResponse
        ? Object.keys(attachResponse)
        : 'NO ATTACH RESPONSE',
    });

    const result = attachResponse?.result;

    console.log('🔵 [AttachReceipt] Extracted result:', result);

    // For attach operations, even an empty response with no fault means success
    if (response.status === 200 && !xml.includes('Fault')) {
      console.log('✅ [AttachReceipt] SUCCESS - Receipt attached via SOAP');
      return {
        IsSuccess: true,
        Message: isAttach
          ? 'Receipt successfully attached to expense line'
          : 'Receipt successfully detached from expense line',
        AlertType: 'Success',
      };
    }

    if (!result) {
      console.log('❌ [AttachReceipt] No valid response returned');
      return {
        IsSuccess: false,
        Message: 'No valid response returned from the server',
        AlertType: 'Error',
        RawResponse: parsed,
      };
    }

    console.log('✅ [AttachReceipt] SUCCESS - Receipt attached via SOAP');
    return {
      IsSuccess: true,
      Message: isAttach
        ? 'Receipt successfully attached to expense line'
        : 'Receipt successfully detached from expense line',
      AlertType: 'Success',
      Result: result,
    };
  } catch (err) {
    console.error('❌ [AttachReceipt] CATCH ERROR:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
      stack: err.stack,
    });

    let errorMessage = err.message || 'Unknown error occurred';

    if (err?.response?.data) {
      console.log('🔵 [AttachReceipt] Response error data:', err.response.data);
      try {
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: '@_',
          ignoreNamespace: true,
        });
        const errorParsed = parser.parse(err.response.data);
        console.log('🔵 [AttachReceipt] Parsed error response:', errorParsed);

        const fault = errorParsed?.['s:Envelope']?.['s:Body']?.Fault;
        if (fault?.faultstring) {
          errorMessage =
            typeof fault.faultstring === 'string'
              ? fault.faultstring
              : fault.faultstring['#text'];
        }
      } catch (e) {
        console.log('🔵 [AttachReceipt] Error parsing fault:', e);
      }
    }

    return {
      IsSuccess: false,
      Message: errorMessage,
      AlertType: 'Error',
    };
  }
};

/* ---------------------- Helpers ------------------------- */

const generateMessageId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const parseSoapFault = xml => {
  console.log('🔵 [parseSoapFault] Parsing SOAP fault XML');
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    ignoreNamespace: true,
  });

  const parsed = parser.parse(xml);
  console.log('🔵 [parseSoapFault] Parsed fault XML:', parsed);

  const fault = parsed?.['s:Envelope']?.['s:Body']?.Fault;
  console.log('🔵 [parseSoapFault] Extracted fault:', fault);

  let errorMessage = 'SOAP Fault Occurred';

  if (fault?.faultstring) {
    errorMessage =
      typeof fault.faultstring === 'string'
        ? fault.faultstring
        : fault.faultstring['#text'];
  } else if (fault?.Reason?.Text) {
    errorMessage = fault.Reason.Text;
  }

  console.log('❌ [parseSoapFault] SOAP Fault message:', errorMessage);
  return {
    IsSuccess: false,
    Message: errorMessage,
    AlertType: 'Error',
    FaultDetails: fault,
  };
};

const escapeXml = value => {
  const escaped = String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&apos;')
    .replace(/"/g, '&quot;');
  return escaped;
};

export {AttachReceiptToExpenseLine};
