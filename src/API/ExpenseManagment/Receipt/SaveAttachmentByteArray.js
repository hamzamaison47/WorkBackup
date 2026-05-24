/* eslint-disable no-bitwise */

/* eslint-disable curly */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {getActiveConfigData} from '../../../Controller/secureConfig';

/**
 * Save Attachment Byte Array - Generic attachment API for any table
 *
 * @param {Object} params
 * @param {string} params.recordRefRecId - The record ID to attach to (leaveReqId, expenseTransactionNumber, etc.)
 * @param {string} params.tableName - The table name (PREmployeeLeaveRequest, TrvExpTrans, etc.)
 * @param {string} params.legalEntity - Legal entity identifier (Company)
 * @param {string} params.employeeId - Employee ID
 * @param {string} params.fileName - File name
 * @param {string} params.fileExt - File extension (with dot, e.g., ".png")
 * @param {string} params.fileByteArray - File content (base64 string)
 */
const SaveAttachmentByteArray = async ({
  recordRefRecId,
  tableName,
  legalEntity,
  employeeId,
  fileName,
  fileExt,
  fileByteArray,
}) => {
  console.log('🔵 [SaveAttachmentByteArray] START - Saving attachment...');
  console.log('📋 Attachment Details:', {
    recordRefRecId,
    tableName,
    legalEntity,
    employeeId,
    fileName,
    fileExt,
    byteArrayLength: fileByteArray?.length,
  });

  try {
    const config = await getActiveConfigData();
    if (!config?.resource)
      throw new Error('No configuration found. Please scan QR code first.');

    // Validate required fields
    if (!recordRefRecId) throw new Error('recordRefRecId is required');
    if (!tableName) throw new Error('tableName is required');
    if (!legalEntity) throw new Error('legalEntity is required');
    if (!employeeId) throw new Error('employeeId is required');
    if (!fileName) throw new Error('fileName is required');
    if (!fileExt) throw new Error('fileExt is required');
    if (!fileByteArray) throw new Error('fileByteArray is required');

    // Ensure fileExt starts with a dot
    if (!fileExt.startsWith('.')) {
      fileExt = '.' + fileExt;
    }

    const token = await getToken();

    // Build the SOAP envelope - Simple approach
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Header>
    <h:CallContext xmlns:i="http://www.w3.org/2001/XMLSchema-instance" xmlns:h="http://schemas.microsoft.com/dynamics/2013/01/datacontracts">
      <h:Company>${escapeXml(legalEntity)}</h:Company>
      <h:Language i:nil="true"></h:Language>
      <h:MessageId>${generateMessageId()}</h:MessageId>
      <h:PartitionKey i:nil="true"></h:PartitionKey>
    </h:CallContext>
  </s:Header>
  <s:Body>
    <saveAttachmentByteArray xmlns="http://tempuri.org">
      <_contract xmlns:d4p1="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
        <d4p1:EmployeeId>${escapeXml(employeeId)}</d4p1:EmployeeId>
        <d4p1:FileBase64String i:nil="true"></d4p1:FileBase64String>
        <d4p1:FileByteArray>${escapeXml(fileByteArray)}</d4p1:FileByteArray>
        <d4p1:FileExt>${escapeXml(fileExt)}</d4p1:FileExt>
        <d4p1:FileName>${escapeXml(fileName)}</d4p1:FileName>
        <d4p1:RecordRefRecId>${escapeXml(recordRefRecId)}</d4p1:RecordRefRecId>
        <d4p1:TableName>${escapeXml(tableName)}</d4p1:TableName>
      </_contract>
    </saveAttachmentByteArray>
  </s:Body>
</s:Envelope>`;

    console.log('=== SAVE ENVELOPE (first 500 chars) ===');
    console.log(soapEnvelope.substring(0, 500));
    console.log('RecordRefRecId being sent:', recordRefRecId);
    console.log('TableName being sent:', tableName);

    const endpoint = `${config.resource}soap/services/DocumentAttachmentSvcGroup`;

    const response = await axios.post(endpoint, soapEnvelope, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/xml;charset=utf-8',
        SOAPAction:
          'http://tempuri.org/DocumentAttachmentSvc/saveAttachmentByteArray',
      },
      responseType: 'text',
      timeout: 60000,
      validateStatus: () => true,
    });
    const xml = response.data;
    if (!xml || xml.trim() === '') {
      return {
        IsSuccess: false,
        Message: 'Empty response from server',
        AlertType: 'Error',
      };
    }

    console.log('=== RAW SAVE RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Response XML:', response.data);
    console.log('=== END SAVE RESPONSE ===');

    // Check for SOAP Fault
    if (
      xml.includes('s:Fault') ||
      xml.includes('<faultstring') ||
      response.status >= 400
    ) {
      console.log('SOAP Fault detected');

      // Try to extract error message
      let errorMessage = 'Server error occurred';
      try {
        const parser = new XMLParser({
          ignoreAttributes: false,
          ignoreNamespace: true,
        });
        const parsed = parser.parse(xml);
        const fault = parsed?.Envelope?.Body?.Fault;
        console.log('=== FAULT PARSED ===', JSON.stringify(parsed, null, 2));
        if (fault?.faultstring) {
          errorMessage = fault.faultstring;
        } else if (fault?.ExceptionMessage) {
          errorMessage = fault.ExceptionMessage;
        }
      } catch (e) {
        // If parsing fails, use raw response
        errorMessage = `Server error: ${response.status}`;
      }

      return {
        IsSuccess: false,
        Message: errorMessage,
        AlertType: 'Error',
      };
    }

    // If we get here and status is 200, assume success
    if (response.status === 200) {
      console.log('✅ Attachment saved successfully');
      return {
        IsSuccess: true,
        Message: 'Attachment saved successfully',
        AlertType: 'Success',
      };
    }

    return {
      IsSuccess: false,
      Message: `Unexpected response: ${response.status}`,
      AlertType: 'Error',
    };
  } catch (err) {
    console.error('Error:', err.message);

    let errorMessage = err.message || 'Unknown error occurred';

    // Try to extract error from response
    if (err?.response?.data) {
      try {
        const parser = new XMLParser({
          ignoreAttributes: false,
          ignoreNamespace: true,
        });
        const parsed = parser.parse(err.response.data);
        console.log('=== SUCCESS PARSED RESPONSE ===');
        console.log(JSON.stringify(parsed, null, 2));
        const fault = parsed?.Envelope?.Body?.Fault;
        if (fault?.faultstring) {
          errorMessage = fault.faultstring;
        }
      } catch (e) {
        console.log('Could not parse success response:', e.message);
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

const escapeXml = value => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&apos;')
    .replace(/"/g, '&quot;');
};

export {SaveAttachmentByteArray};
