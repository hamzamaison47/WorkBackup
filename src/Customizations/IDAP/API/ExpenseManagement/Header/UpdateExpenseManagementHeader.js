/* eslint-disable quotes */
/* eslint-disable curly */
/* eslint-disable dot-notation */
// Updates an EXISTING Expense Management header (Draft/Create status only —
// the X++ updateRecord() does not itself re-check status, so the screen is
// responsible for disabling the Edit action once ApprovalStatus is no longer
// Create/Draft, the same pattern GenericAdvanceListScreen uses for its Edit
// icon: `disabled: !isDraft`).
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../../Controller/secureConfig';
import {EXP_MGMT_HEADER_CONTRACT, EXP_MGMT_HEADER_GROUP} from './serviceConfig';

const USE_KPARM_NAMES = false;
const WRAP_CONTRACT_ITEM = false;

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

// Tolerates the a: datacontract namespace prefix on GeneralContract elements.
const pick = (obj, name) =>
  obj?.['a:' + name] !== undefined ? obj['a:' + name] : obj?.[name];

const toStr = value => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object')
    return value['#text'] !== undefined ? String(value['#text']) : '';
  return String(value);
};

// The SOAP Header carries an Infolog with every info()/error() message
// logged during the request — the Body's result.Message is often just the
// first Info entry (e.g. "Before insert..."), while the actual failure
// reason (e.g. a requisition conflict) only shows up here as a Type=Error
// entry. Pull all of it out so nothing gets silently dropped.
const extractInfologEntries = parsed => {
  const entries =
    parsed?.['s:Envelope']?.['s:Header']?.['Infolog']?.['Entries']?.[
      'InfologEntry'
    ];
  if (!entries) return [];
  const list = Array.isArray(entries) ? entries : [entries];
  return list.map(e => ({
    message: toStr(e?.Message),
    type: toStr(e?.Type),
  }));
};

// Bare names are used verbatim as the DataMember name. The __k_parm fallback
// follows the X++ parm-method casing, which is NOT always the same as the
// DataMember casing — so if that toggle is ever flipped back on, the casing
// here needs revisiting too.
const memberTag = name => (USE_KPARM_NAMES ? `__k_parm${name}` : name);

const UpdateExpenseManagementHeader = async ({
  headerRecId,
  Location,
  DateFrom,
  DateTo,
  MapToTravelRequisition,
  RequisitionNumber,
} = {}) => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    if (!headerRecId) {
      throw new Error('Missing header RecId for expense header update.');
    }

    const token = await getToken();
    const members = [
      ['DateFrom', toIsoDateTime(DateFrom)],
      ['DateTo', toIsoDateTime(DateTo)],
      ['HeaderRecId', escapeXml(headerRecId)],
      ['Location', escapeXml(Location)],
      ['MapToTravelRequisition', escapeXml(MapToTravelRequisition)],
      ['RequisitionNumber', escapeXml(RequisitionNumber)],
    ];

    // NO whitespace between elements — the DataContract reader treats stray text
    // nodes as content and fails with "Encountered 'Text'".
    const memberXml = members
      .filter(([, value]) => value !== '' && value !== undefined)
      .map(([name, value]) => {
        const tag = `d:${memberTag(name)}`;
        return `<${tag}>${value}</${tag}>`;
      })
      .join('');

    const contractInner = WRAP_CONTRACT_ITEM
      ? `<d:DFExpenseManagementHeaderContract>${memberXml}</d:DFExpenseManagementHeaderContract>`
      : memberXml;

    const soapBody =
      `<update xmlns="http://tempuri.org">` +
      `<contract xmlns:d="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">` +
      `${contractInner}` +
      `</contract>` +
      `</update>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    // ── DIAGNOSTIC (keep until update round-trips against the live endpoint) ──
    console.log('[ExpMgmt UPDATE] soap body:', soapBody);

    const response = await axios.post(
      `${config.resource}soap/services/${EXP_MGMT_HEADER_GROUP}`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: `http://tempuri.org/${EXP_MGMT_HEADER_CONTRACT}/update`,
        },
        responseType: 'text',
        timeout: 30000,
      },
    );

    // ── DIAGNOSTIC (keep until update round-trips against the live endpoint) ──
    console.log(
      '[ExpMgmt UPDATE] raw response:',
      String(response.data).slice(0, 2000),
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

    if (parsed?.['s:Envelope']?.['s:Body']?.['s:Fault']) {
      const fault = parsed['s:Envelope']['s:Body']['s:Fault'];
      const faultReason =
        fault.faultstring || fault.Reason?.Text || 'Unknown SOAP fault';
      throw new Error(`SOAP Fault: ${faultReason}`);
    }

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['updateResponse']?.['result'];

    if (!result) {
      return {
        IsSuccess: false,
        Message: 'No response returned from server.',
        RecId: '',
      };
    }

    // GeneralContract — updateRecord() returns a single contract, not a list,
    // so no array-index/summary-row unwrapping is needed here (unlike delete()).
    const contract =
      result?.['a:GeneralContract'] ?? result?.['GeneralContract'] ?? result;
    const isSuccessStr = toStr(pick(contract, 'IsSuccess')).toLowerCase();

    const bodyMessage = toStr(pick(contract, 'Message'));
    const errorEntries = extractInfologEntries(parsed)
      .filter(e => e.type === 'Error')
      .map(e => e.message);

    const combinedMessage = [bodyMessage, ...errorEntries]
      .filter(Boolean)
      .filter((msg, idx, arr) => arr.indexOf(msg) === idx)
      .join('\n');

    return {
      IsSuccess: isSuccessStr === 'true' || isSuccessStr === '1',
      Message: combinedMessage || bodyMessage,
      RecId: toStr(pick(contract, 'RecId')),
    };
  } catch (err) {
    // ── DIAGNOSTIC (keep until update round-trips against the live endpoint) ──
    console.error('[ExpMgmt UPDATE] error:', err.message);
    console.error(
      '[ExpMgmt UPDATE] error body:',
      err.response?.data || err.stack,
    );
    return {
      IsSuccess: false,
      Message: err?.message || 'Error updating expense header.',
      RecId: '',
    };
  }
};

export {UpdateExpenseManagementHeader};
