/* eslint-disable curly */
/* eslint-disable dot-notation */
// Retrieves the receipts (documents) attached to a single medical expense line,
// scoped to SLD_MediExpLineDetails via the line's RecId.
//
// Operation: DocumentAttachmentSvc/retrieve   (DocumentAttachmentSvcGroup)
//   Endpoint : {resource}soap/services/DocumentAttachmentSvcGroup
//   Request  :
//     <retrieve xmlns="http://tempuri.org">
//       <_recordRefRecId>{lineRecId}</_recordRefRecId>
//       <_tableName>SLD_MediExpLineDetails</_tableName>
//     </retrieve>
//   Response : retrieveResponse > result > (Array of) a:DocuRefContract
//
// The endpoint, envelope namespace ("http://tempuri.org", NO trailing slash) and
// SOAPAction ("http://tempuri.org/DocumentAttachmentSvc/retrieve") are copied
// VERBATIM from the working shared client for this same service group:
//   src/API/ExpenseManagment/Receipt/RetrieveReciepts.js
//
// CRITICAL: FileBase64 is populated INLINE on each DocuRefContract by the backend.
// There is NO second call to fetch bytes — download reads FileBase64 straight off
// the returned row. Do not call retrieveAttachment / getAttachmentURL anywhere.
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../../../Controller/secureConfig';

// The record-ref table for medical expense line documents.
const MEDICAL_LINE_TABLE = 'SLD_MediExpLineDetails';

const escapeXml = value =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

// nil / empty elements are parsed as objects (e.g. {'@_i:nil':'true'}); flatten
// those to '' so callers always get a string.
const toStr = value => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object')
    return value['#text'] !== undefined ? String(value['#text']) : '';
  return String(value);
};

// Contract members arrive with the a: namespace prefix; tolerate both forms.
const pick = (obj, name) =>
  obj?.['a:' + name] !== undefined ? obj['a:' + name] : obj?.[name];

const RetrieveMedicalLineReceipts = async lineRecId => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }
    if (!lineRecId) {
      throw new Error('Missing medical expense line RecId.');
    }

    const token = await getToken();

    const soapBody = `
      <retrieve xmlns="http://tempuri.org">
        <_recordRefRecId>${escapeXml(lineRecId)}</_recordRefRecId>
        <_tableName>${escapeXml(MEDICAL_LINE_TABLE)}</_tableName>
      </retrieve>
    `;

    const soapEnvelope = createSoapEnvelope(soapBody);

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

    const xml = response.data;

    // parseTagValue:false keeps FileBase64 and dateTime values as raw strings so
    // a numeric-looking base64 chunk is never coerced to a Number.
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseTagValue: false,
      trimValues: true,
    });

    const parsed = parser.parse(xml);

    // SOAP fault — log the raw fault body to aid debugging.
    const fault = parsed?.['s:Envelope']?.['s:Body']?.['s:Fault'];
    if (fault) {
      const faultReason =
        fault.faultstring || fault.Reason?.Text || 'Unknown SOAP fault';
      console.error('RetrieveMedicalLineReceipts SOAP Fault body:', xml);
      throw new Error(`SOAP Fault: ${faultReason}`);
    }

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['retrieveResponse']?.['result'];

    // 0-row: result absent, empty text node, or empty object.
    if (
      !result ||
      (typeof result === 'object' && Object.keys(result).length === 0)
    ) {
      return [];
    }

    // Contracts may sit directly under result, or under an ArrayOfDocuRefContract
    // wrapper; either may carry the a: prefix.
    const wrapper =
      result['a:ArrayOfDocuRefContract'] ||
      result['ArrayOfDocuRefContract'] ||
      result;

    const rawContracts =
      pick(wrapper, 'DocuRefContract') ?? pick(result, 'DocuRefContract');

    if (!rawContracts) return [];

    // 1-row: fast-xml-parser yields a single object, not an array.
    const contracts = Array.isArray(rawContracts)
      ? rawContracts
      : [rawContracts];

    return contracts.map(raw => {
      const recIdStr = toStr(pick(raw, 'RecId'));
      const recIdNum = Number(recIdStr);
      return {
        // Int64 RecId coerced to Number; kept as string only if unparseable.
        RecId: recIdStr !== '' && !Number.isNaN(recIdNum) ? recIdNum : recIdStr,
        Name: toStr(pick(raw, 'Name')),
        OriginalFileName: toStr(pick(raw, 'OriginalFileName')),
        FileType: toStr(pick(raw, 'FileType')),
        TypeId: toStr(pick(raw, 'TypeId')),
        Notes: toStr(pick(raw, 'Notes')),
        // Full file bytes, base64, inline — no second round-trip needed.
        FileBase64: toStr(pick(raw, 'FileBase64')),
        CreatedBy: toStr(pick(raw, 'CreatedBy')),
        CreatedDateTime: toStr(pick(raw, 'CreatedDateTime')),
        ModifiedBy: toStr(pick(raw, 'ModifiedBy')),
        ModifiedDateTime: toStr(pick(raw, 'ModifiedDateTime')),
      };
    });
  } catch (err) {
    console.error('RetrieveMedicalLineReceipts SOAP Error:', err.message);
    console.error('Error details:', err.response?.data || err.stack);
    throw err;
  }
};

export {RetrieveMedicalLineReceipts};
