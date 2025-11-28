/* eslint-disable curly */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {getActiveConfigData} from '../../../Controller/secureConfig';

const UploadReceipt = async ({
  legalEntity,
  fileName,
  capturedReceipt,
  contentType,
  fileExtension,
  employeeId,
}) => {
  console.log('🔵 [UploadReceipt] START - Uploading receipt via SOAP...');
  console.log('📁 Receipt Details:', {
    legalEntity,
    fileName,
    contentType,
    fileExtension,
    employeeId,
    base64Length: capturedReceipt?.length,
    base64Preview: capturedReceipt?.substring(0, 100) + '...',
  });

  try {
    const config = await getActiveConfigData();
    console.log('🔵 [UploadReceipt] Config loaded:', {
      hasResource: !!config?.resource,
      resource: config?.resource ? '✓' : '✗',
    });

    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    // Validate required fields
    const missingFields = [];
    if (!legalEntity) missingFields.push('legalEntity');
    if (!fileName) missingFields.push('fileName');
    if (!capturedReceipt) missingFields.push('capturedReceipt');
    if (!contentType) missingFields.push('contentType');
    if (!fileExtension) missingFields.push('fileExtension');
    if (!employeeId) missingFields.push('employeeId');

    if (missingFields.length > 0) {
      console.log('❌ [UploadReceipt] Missing required fields:', missingFields);
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    console.log('🔵 [UploadReceipt] Getting authentication token...');
    const token = await getToken();
    console.log('🔵 [UploadReceipt] Token received:', token ? '✓' : '✗');

    // FIX: Ensure fileExtension starts with dot (like .NET request shows ".pdf")
    const formattedFileExtension = fileExtension.startsWith('.')
      ? fileExtension
      : `.${fileExtension}`;

    console.log(
      '🔵 [UploadReceipt] Formatted file extension:',
      formattedFileExtension,
    );

    // FIX: Create the EXACT SOAP envelope structure from the .NET example
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
    <UploadReceipt xmlns="http://tempuri.org">
      <capturedReceipt>${escapeXml(capturedReceipt)}</capturedReceipt>
      <contentType>${escapeXml(contentType)}</contentType>
      <employeeId>${escapeXml(employeeId)}</employeeId>
      <fileExtension>${escapeXml(formattedFileExtension)}</fileExtension>
      <fileName>${escapeXml(fileName)}</fileName>
      <legalEntity>${escapeXml(legalEntity)}</legalEntity>
    </UploadReceipt>
  </s:Body>
</s:Envelope>`;

    console.log(
      '🔵 [UploadReceipt] SOAP Envelope created, length:',
      soapEnvelope.length,
    );
    console.log(
      '🔵 [UploadReceipt] SOAP Envelope preview (first 500 chars):',
      soapEnvelope.substring(0, 500) + '...',
    );

    // FIX: Use the EXACT endpoint from the .NET example
    const endpoint = `${config.resource}soap/services/ExpenseManagmentSvcGroup`;

    console.log('🔵 [UploadReceipt] Making SOAP API call to:', endpoint);
    console.log(
      '🔵 [UploadReceipt] SOAP Action:',
      'http://tempuri.org/ExpenseReceiptSvc/UploadReceipt',
    );

    const response = await axios.post(endpoint, soapEnvelope, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'http://tempuri.org/ExpenseReceiptSvc/UploadReceipt',
      },
      responseType: 'text',
      timeout: 30000,
      validateStatus: () => true, // Don't throw on HTTP error status
    });

    console.log('🔵 [UploadReceipt] API Response received:', {
      status: response.status,
      statusText: response.statusText,
    });

    const xml = response.data;
    console.log('🔵 [UploadReceipt] Response XML length:', xml?.length);

    if (xml && xml.length > 0) {
      console.log(
        '🔵 [UploadReceipt] Response XML preview (first 1000 chars):',
        xml.substring(0, Math.min(1000, xml.length)),
      );
    }

    // Handle empty response
    if (!xml || xml.trim() === '') {
      console.log('❌ [UploadReceipt] Empty response from server');
      return {
        IsSuccess: false,
        Message: 'Empty response received from server.',
        AlertType: 'Error',
      };
    }

    // SOAP Fault handling
    if (
      xml.includes('s:Fault') ||
      xml.includes('faultstring') ||
      xml.includes('Fault') ||
      xml.includes('soap:Fault')
    ) {
      console.log('❌ [UploadReceipt] SOAP Fault detected in response');
      return parseSoapFault(xml);
    }

    console.log('🔵 [UploadReceipt] Parsing XML response...');
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseTagValue: true,
      trimValues: true,
      ignoreNamespace: true,
    });

    const parsed = parser.parse(xml);
    console.log(
      '🔵 [UploadReceipt] Full parsed XML structure:',
      JSON.stringify(parsed, null, 2).substring(0, 2000) + '...',
    );

    // FIX: Parse the response structure correctly based on actual response
    const envelope = parsed?.['s:Envelope'];
    const body = envelope?.['s:Body'];
    const uploadResponse = body?.UploadReceiptResponse;

    console.log('🔵 [UploadReceipt] Structure debug:', {
      hasEnvelope: !!envelope,
      hasBody: !!body,
      hasUploadResponse: !!uploadResponse,
      uploadResponseKeys: uploadResponse
        ? Object.keys(uploadResponse)
        : 'NO UPLOAD RESPONSE',
    });

    // FIX: Handle the actual response structure from the logs
    // The response has: s:Envelope -> s:Body -> UploadReceiptResponse -> result -> a:ExpenseReceiptContract
    const result = uploadResponse?.result;

    console.log('🔵 [UploadReceipt] Extracted result:', result);

    if (!result) {
      console.log('❌ [UploadReceipt] No result data in response');
      console.log(
        '🔵 [UploadReceipt] Available data in UploadReceiptResponse:',
        uploadResponse,
      );

      // Check if we have a simple success case
      if (uploadResponse) {
        console.log(
          '🔵 [UploadReceipt] UploadResponse exists, treating as success',
        );
        return {
          IsSuccess: true,
          Message: 'Receipt Uploaded Successfully',
          AlertType: 'Success',
          Receipts: [], // Empty array since we don't have receipt data
        };
      }

      return {
        IsSuccess: false,
        Message: 'UploadReceipt returned no result data.',
        AlertType: 'Error',
        DebugInfo: {
          parsed,
          uploadResponse,
        },
      };
    }

    // FIX: The actual receipt data is in result['a:ExpenseReceiptContract']
    const receiptContract = result['a:ExpenseReceiptContract'];
    console.log('🔵 [UploadReceipt] Receipt contract:', receiptContract);

    if (!receiptContract) {
      console.log('❌ [UploadReceipt] No receipt contract found in result');
      return {
        IsSuccess: false,
        Message: 'No receipt contract data found in response.',
        AlertType: 'Error',
        DebugInfo: {result},
      };
    }

    // Extract Receipt Contracts
    console.log('🔵 [UploadReceipt] Extracting receipt contracts...');
    const receipts = extractReceiptContracts(receiptContract); // Pass receiptContract instead of result
    console.log('🔵 [UploadReceipt] Extracted receipts:', receipts);

    if (receipts.length === 0) {
      console.log('❌ [UploadReceipt] No receipts extracted from response');

      // Check for direct RecId in result
      if (receiptContract && typeof receiptContract === 'object') {
        console.log(
          '🔵 [UploadReceipt] Receipt contract exists, checking for docuRefRecId directly',
        );
        const directRecId =
          receiptContract['a:docuRefRecId'] || receiptContract.docuRefRecId;
        if (directRecId) {
          console.log(
            '✅ [UploadReceipt] Found direct docuRefRecId:',
            directRecId,
          );
          return {
            IsSuccess: true,
            Message: 'Receipt Uploaded Successfully',
            AlertType: 'Success',
            Receipts: [{docuRefRecId: directRecId}],
          };
        }
      }

      return {
        IsSuccess: false,
        Message: 'No receipt data found in response.',
        AlertType: 'Error',
        DebugInfo: {receiptContract},
      };
    }

    // Validate that we have the required RecId
    const validReceipts = receipts.filter(
      receipt => receipt.docuRefRecId || receipt.RecId || receipt.recId,
    );
    if (validReceipts.length === 0) {
      console.log('❌ [UploadReceipt] No valid receipts with docuRefRecId');
      return {
        IsSuccess: false,
        Message: 'Upload succeeded but no document reference returned.',
        AlertType: 'Error',
        DebugInfo: {receipts},
      };
    }

    console.log('✅ [UploadReceipt] SUCCESS - Receipt uploaded via SOAP');
    const recId =
      validReceipts[0].docuRefRecId || // FIX: Check docuRefRecId first (from the response)
      validReceipts[0].RecId ||
      validReceipts[0].recId;
    console.log('✅ [UploadReceipt] RecId received:', recId);

    return {
      IsSuccess: true,
      Message: 'Receipt Uploaded Successfully',
      AlertType: 'Success',
      Receipts: validReceipts,
    };
  } catch (err) {
    console.error('❌ [UploadReceipt] CATCH ERROR:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
      stack: err.stack,
    });

    let errorMessage = 'Error Uploading Receipt';

    if (err?.response?.data) {
      console.log('🔵 [UploadReceipt] Response error data:', err.response.data);
      try {
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: '@_',
          ignoreNamespace: true,
        });
        const errorParsed = parser.parse(err.response.data);
        console.log('🔵 [UploadReceipt] Parsed error response:', errorParsed);

        const fault =
          errorParsed?.Envelope?.Body?.Fault ||
          errorParsed?.['s:Envelope']?.['s:Body']?.Fault;
        if (fault?.faultstring) {
          errorMessage =
            typeof fault.faultstring === 'string'
              ? fault.faultstring
              : fault.faultstring['#text'];
          console.log('🔵 [UploadReceipt] SOAP Fault message:', errorMessage);
        }
      } catch (e) {
        console.log('🔵 [UploadReceipt] Error parsing fault:', e);
        // If XML parsing fails, try to extract fault string manually
        const faultMatch = err.response.data.match(
          /<faultstring[^>]*>([^<]+)</,
        );
        if (faultMatch) {
          errorMessage = faultMatch[1];
        }
      }
    } else if (err.message) {
      errorMessage = err.message;
    }

    // Handle specific HTTP errors
    if (err.response?.status === 401) {
      errorMessage = 'Authentication failed. Please check your credentials.';
    } else if (err.response?.status === 403) {
      errorMessage = 'You do not have permission to upload receipts.';
    } else if (err.response?.status === 500) {
      errorMessage = 'Server error occurred while uploading receipt.';
    } else if (err.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout. Please try again.';
    }

    console.log('❌ [UploadReceipt] FINAL ERROR:', errorMessage);
    return {
      IsSuccess: false,
      Message: errorMessage,
      AlertType: 'Error',
    };
  }
};

/* ---------------------- Helpers ------------------------- */

const generateMessageId = () => {
  // Generate a UUID similar to the .NET example: "a4172d38-d9d1-4465-86b1-3c98186208af"
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const extractReceiptContracts = obj => {
  console.log('🔵 [extractReceiptContracts] Input object:', obj);

  // FIX: Handle the actual structure from response
  let receipts = obj;

  console.log('🔵 [extractReceiptContracts] Raw receipts data:', receipts);

  if (!receipts) {
    console.log('❌ [extractReceiptContracts] No receipts data found');
    return [];
  }

  // If it's already an object with receipt data, wrap it in array
  if (receipts && typeof receipts === 'object' && !Array.isArray(receipts)) {
    console.log(
      '🔵 [extractReceiptContracts] Processing single receipt object',
    );
    const singleReceipt = [flattenContract(receipts)];
    console.log(
      '🔵 [extractReceiptContracts] Processed single receipt:',
      singleReceipt,
    );
    return singleReceipt;
  }

  if (Array.isArray(receipts)) {
    console.log(
      '🔵 [extractReceiptContracts] Processing array of receipts, count:',
      receipts.length,
    );
    const processed = receipts.map(r => flattenContract(r));
    console.log('🔵 [extractReceiptContracts] Processed array:', processed);
    return processed;
  }

  console.log('🔵 [extractReceiptContracts] Unknown receipts format');
  return [];
};

const flattenContract = contract => {
  console.log('🔵 [flattenContract] Input contract:', contract);
  const out = {};

  for (const key in contract) {
    const cleanKey = key.replace(/^[a-z]:/, ''); // Remove namespace prefixes like 'a:'
    if (typeof contract[key] === 'string') {
      out[cleanKey] = contract[key];
    } else if (contract[key]?.['#text']) {
      out[cleanKey] = contract[key]['#text'];
    } else if (contract[key] !== null && contract[key] !== undefined) {
      out[cleanKey] = contract[key];
    }
  }

  console.log('🔵 [flattenContract] Output:', out);
  return out;
};

const parseSoapFault = xml => {
  console.log('🔵 [parseSoapFault] Parsing SOAP fault XML');
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    ignoreNamespace: true,
  });

  const parsed = parser.parse(xml);
  console.log('🔵 [parseSoapFault] Parsed fault:', parsed);

  const fault =
    parsed?.Envelope?.Body?.Fault || parsed?.['s:Envelope']?.['s:Body']?.Fault;
  console.log('🔵 [parseSoapFault] Extracted fault:', fault);

  let errorMessage = 'SOAP Fault Occurred';

  if (fault?.faultstring) {
    errorMessage =
      typeof fault.faultstring === 'string'
        ? fault.faultstring
        : fault.faultstring['#text'];
  } else if (fault?.Reason?.Text) {
    errorMessage = fault.Reason.Text;
  } else if (fault?.detail?.message) {
    errorMessage = fault.detail.message;
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
  const escaped = String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
  return escaped;
};

export {UploadReceipt};
