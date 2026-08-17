/* eslint-disable curly */
/* eslint-disable dot-notation */
// Creates a single medical expense line (DFExpenseReportLinesContract) against
// an existing expense report header.
//
// NOTE: the operation namespace is "http://tempuri.org" with NO trailing slash.
// Do NOT copy the trailing-slash convention used by ExpenseManagmentSvcGroup —
// DFExpenseReportLinesSvcGroup is a real, different service.
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../../Controller/secureConfig';

// Serialize any accepted date shape to the D365 dateTime literal the contract
// expects: YYYY-MM-DDT00:00:00 (midnight). String inputs keep their calendar
// day verbatim (split on 'T') so no timezone shift can move the date.
const toIsoDateTime = value => {
  if (!value) return '';
  let year;
  let month;
  let day;
  if (typeof value === 'string') {
    const datePart = value.split('T')[0];
    const parts = datePart.split('-').map(Number);
    if (parts.length < 3 || parts.some(isNaN)) {
      const parsed = new Date(value);
      if (isNaN(parsed.getTime())) return '';
      year = parsed.getFullYear();
      month = parsed.getMonth() + 1;
      day = parsed.getDate();
    } else {
      [year, month, day] = parts;
    }
  } else {
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '';
    year = d.getFullYear();
    month = d.getMonth() + 1;
    day = d.getDate();
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(
    2,
    '0',
  )}T00:00:00`;
};

const escapeXml = value =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const toNumber = value => {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

// Tolerates the a: datacontract namespace prefix on GeneralContract elements.
const pick = (obj, name) =>
  obj?.['a:' + name] !== undefined ? obj['a:' + name] : obj?.[name];

const toStr = value => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object')
    return value['#text'] !== undefined ? String(value['#text']) : '';
  return String(value);
};

const CreateMedicalExpenseLine = async (headerRecId, lineData = {}) => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    if (!headerRecId) {
      throw new Error('Missing expense report header RecId for line create.');
    }

    const token = await getToken();

    // Element order MUST match the schema sequence: alphabetical, then
    // TrvExpTable. RecId is omitted on create. IsReceiptAttached is always
    // false — it is backend-derived from actual attachments, never a user field.
    const soapBody = `
      <create xmlns="http://tempuri.org">
        <contract xmlns:d="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">
          <d:ClaimedAmount>${toNumber(lineData.ClaimedAmount)}</d:ClaimedAmount>
          <d:IsReceiptAttached>false</d:IsReceiptAttached>
          <d:Name>${escapeXml(lineData.Name)}</d:Name>
          <d:ReceiptNum>${escapeXml(lineData.ReceiptNum)}</d:ReceiptNum>
          <d:Relation>${escapeXml(lineData.Relation)}</d:Relation>
          <d:SubCategory>${escapeXml(lineData.SubCategory)}</d:SubCategory>
          <d:TransAmount>${toNumber(lineData.TransAmount)}</d:TransAmount>
          <d:TransDate>${toIsoDateTime(lineData.TransDate)}</d:TransDate>
          <d:TrvExpTable>${headerRecId}</d:TrvExpTable>
        </contract>
      </create>
    `;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const response = await axios.post(
      `${config.resource}soap/services/DFExpenseReportLinesSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/DFExpenseReportLinesSvc/create',
        },
        responseType: 'text',
        timeout: 30000,
      },
    );

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      parseTagValue: false,
      trimValues: true,
      alwaysCreateTextNode: false,
      allowBooleanAttributes: false,
      parseAttributeValue: false,
    });

    const parsed = parser.parse(response.data);

    // SOAP fault
    if (parsed?.['s:Envelope']?.['s:Body']?.['s:Fault']) {
      const fault = parsed['s:Envelope']['s:Body']['s:Fault'];
      const faultReason =
        fault.faultstring || fault.Reason?.Text || 'Unknown SOAP fault';
      throw new Error(`SOAP Fault: ${faultReason}`);
    }

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['createResponse']?.['result'];

    if (!result) {
      return {
        IsSuccess: false,
        Message: 'No response returned from server.',
        RecId: '',
      };
    }

    const isSuccessStr = toStr(pick(result, 'IsSuccess')).toLowerCase();

    return {
      IsSuccess: isSuccessStr === 'true' || isSuccessStr === '1',
      Message: toStr(pick(result, 'Message')),
      RecId: toStr(pick(result, 'RecId')),
    };
  } catch (err) {
    console.error('CreateMedicalExpenseLine SOAP Error:', err.message);
    console.error('Error details:', err.response?.data || err.stack);
    return {
      IsSuccess: false,
      Message: err?.message || 'Error creating medical expense line.',
      RecId: '',
    };
  }
};

export {CreateMedicalExpenseLine};
