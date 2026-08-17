/* eslint-disable curly */
/* eslint-disable dot-notation */
// Attaches a document to a Travel Requisition HEADER via the GENERIC
// DocumentAttachmentSvc/AddAttachment op — binds by (_recordRefRecId + _tableName)
// and takes the file bytes directly, so it does upload+attach in ONE call.
// This is the header equivalent of the line-only UploadReceipt→AttachReceiptToExpenseLine
// flow (which binds by expense-transaction-number and CANNOT bind a header).
//
// Params (from the AddAttachment operation signature):
//   _recordRefRecId : Int64  — the header RecId
//   _employeeId     : String
//   _tableName      : String — 'TrvRequisitionTable'
//   _base64Str      : String — file bytes, base64
//   _fileName       : String
//   _fileExt        : String — with leading dot, e.g. '.pdf'
// Returns: GeneralContract → { IsSuccess, Message, RecId }
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../../Controller/secureConfig';

const escapeXml = value =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const pick = (obj, name) =>
  obj?.['a:' + name] !== undefined ? obj['a:' + name] : obj?.[name];

const toStr = value => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object')
    return value['#text'] !== undefined ? String(value['#text']) : '';
  return String(value);
};

const AddTravelRequisitionAttachment = async ({
  recordRefRecId,
  employeeId,
  tableName = 'TrvRequisitionTable',
  base64Str,
  fileName,
  fileExt,
}) => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }
    if (!recordRefRecId)
      throw new Error('Missing header RecId for attachment.');
    if (!base64Str) throw new Error('Missing file data for attachment.');

    const token = await getToken();

    // Ensure the extension has a leading dot (backend expects '.pdf' form).
    const ext = fileExt
      ? fileExt.startsWith('.')
        ? fileExt
        : `.${fileExt}`
      : '';

    // Elements in alphabetical order by param name (DataContract convention),
    // no whitespace between tags. base64 is large — kept as a raw string.
    const soapBody =
      `<AddAttachment xmlns="http://tempuri.org">` +
      `<_recordRefRecId>${escapeXml(recordRefRecId)}</_recordRefRecId>` +
      `<_employeeId>${escapeXml(employeeId)}</_employeeId>` +
      `<_tableName>${escapeXml(tableName)}</_tableName>` +
      `<_base64Str>${escapeXml(base64Str)}</_base64Str>` +
      `<_fileName>${escapeXml(fileName)}</_fileName>` +
      `<_fileExt>${escapeXml(ext)}</_fileExt>` +
      `</AddAttachment>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const response = await axios.post(
      `${config.resource}soap/services/DocumentAttachmentSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/DocumentAttachmentSvc/AddAttachment',
        },
        responseType: 'text',
        timeout: 60000,
        validateStatus: () => true,
      },
    );

    const xml = response.data;

    const parser = new XMLParser({
      ignoreAttributes: false,
      parseTagValue: false,
      trimValues: true,
    });
    const parsed = parser.parse(xml);

    if (parsed?.['s:Envelope']?.['s:Body']?.['s:Fault']) {
      const fault = parsed['s:Envelope']['s:Body']['s:Fault'];
      const faultReason =
        fault.faultstring || fault.Reason?.Text || 'Unknown SOAP fault';
      throw new Error(`SOAP Fault: ${faultReason}`);
    }

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['AddAttachmentResponse']?.['result'];

    // GeneralContract; may be a:-prefixed or bare.
    const contract =
      result?.['a:GeneralContract'] || result?.['GeneralContract'] || result;

    if (!contract) {
      // Some ops return a bare string on success; treat a clean 200 as success.
      const ok = response.status === 200 && !String(xml).includes('Fault');
      return {
        IsSuccess: ok,
        Message: ok ? 'Attachment saved successfully' : 'No response returned.',
        RecId: '',
      };
    }

    const isSuccessStr = toStr(pick(contract, 'IsSuccess')).toLowerCase();

    return {
      IsSuccess: isSuccessStr === 'true' || isSuccessStr === '1',
      Message:
        toStr(pick(contract, 'Message')) || 'Attachment saved successfully',
      RecId: toStr(pick(contract, 'RecId')),
    };
  } catch (err) {
    console.error('AddTravelRequisitionAttachment SOAP Error:', err.message);
    console.error('Error details:', err.response?.data || err.stack);
    return {
      IsSuccess: false,
      Message: err?.message || 'Error saving attachment.',
      RecId: '',
    };
  }
};

export {AddTravelRequisitionAttachment};
