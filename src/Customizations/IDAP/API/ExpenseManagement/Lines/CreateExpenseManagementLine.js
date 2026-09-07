/* eslint-disable quotes */
/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../../Controller/secureConfig';
import {EXP_MGMT_LINES_CONTRACT, EXP_MGMT_LINES_GROUP} from './serviceConfig';

// // Serializes to the D365 dateTime literal YYYY-MM-DDTHH:MM:SS. Unlike the
// // header's date-only members, these are TrvDateTime, so an existing time
// // component is PRESERVED rather than flattened to midnight. String inputs keep
// // their calendar day verbatim so no timezone shift can move the date.
// const toIsoDateTime = value => {
//   if (!value) return '';

//   if (typeof value === 'string') {
//     // Already a full ISO-ish literal — keep date + time, drop any zone suffix.
//     const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})/);
//     if (match) return `${match[1]}T${match[2]}`;

//     // Date-only string — default to midnight.
//     const dateOnly = value.match(/^(\d{4}-\d{2}-\d{2})$/);
//     if (dateOnly) return `${dateOnly[1]}T00:00:00`;
//   }

//   const d = value instanceof Date ? value : new Date(value);
//   if (isNaN(d.getTime())) return '';

//   const pad = n => String(n).padStart(2, '0');
//   return (
//     `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
//     `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
//   );
// };

const getOffsetSuffix = date => {
  const offsetMin = -date.getTimezoneOffset(); // e.g. +300 for GMT+5
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${sign}${hh}:${mm}`;
};

const toIsoDateTime = value => {
  if (!value) return '';

  let d;
  if (value instanceof Date) {
    d = value;
  } else {
    const match = String(value).match(
      /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2}))?/,
    );
    if (!match) return '';
    const [, year, month, day, hours = '00', minutes = '00', seconds = '00'] =
      match;
    d = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
      Number(seconds),
    );
  }

  if (isNaN(d.getTime())) return '';

  const pad = n => String(n).padStart(2, '0');
  const literal =
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

  return `${literal}${getOffsetSuffix(d)}`;
};

const toIsoDateTimeLiteral = value => {
  if (!value) return '';

  let d;
  if (value instanceof Date) {
    d = value;
  } else {
    const match = String(value).match(
      /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2}))?/,
    );
    if (!match) return '';
    const [, year, month, day, hours = '00', minutes = '00', seconds = '00'] =
      match;
    d = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
      Number(seconds),
    );
  }

  if (isNaN(d.getTime())) return '';

  const pad = n => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
};

const escapeXml = value =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

// Blank stays blank (so the empty-drop filter removes the member); anything
// unparseable becomes 0 rather than NaN.
const toNumber = value => {
  if (value === '' || value === null || value === undefined) return '';
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

const CreateExpenseManagementLine = async ({
  headerRecId,
  CostType,
  Transaction,
  ClaimedAmount,
  AmountCurr, // ← new
  ExchangeCode,
  DepartureLocation,
  DepartureDateTime,
  ArrivalLocation,
  ArrivalDateTime,
  DateFrom,
  DateTo,
  Mileage,
} = {}) => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    if (!headerRecId) {
      throw new Error('Missing expense header RecId for line create.');
    }

    const token = await getToken();

    // ALPHABETICAL by DataMember name. Empty members are dropped below.
    const members = [
      ['AmountCurr', toNumber(AmountCurr)],
      ['ArrivalDateTime', toIsoDateTime(ArrivalDateTime)],
      ['ArrivalLocation', escapeXml(ArrivalLocation)],
      ['ClaimedAmount', toNumber(ClaimedAmount)],
      ['CostType', escapeXml(CostType)],
      ['DateFrom', toIsoDateTimeLiteral(DateFrom)],
      ['DateTo', toIsoDateTimeLiteral(DateTo)],
      ['DepartureDateTime', toIsoDateTime(DepartureDateTime)],
      ['DepartureLocation', escapeXml(DepartureLocation)],
      ['ExchangeCode', escapeXml(ExchangeCode)],
      ['HeaderRecId', headerRecId],
      ['Mileage', toNumber(Mileage)],
      ['Transaction', toIsoDateTime(Transaction)],
    ];

    // NO whitespace between elements.
    const memberXml = members
      .filter(
        ([, value]) => value !== '' && value !== undefined && value !== null,
      )
      .map(([name, value]) => `<d:${name}>${value}</d:${name}>`)
      .join('');

    // SINGLE contract — no array wrapper element (unlike the header create).
    const soapBody =
      `<create xmlns="http://tempuri.org">` +
      `<contract xmlns:d="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">` +
      `${memberXml}` +
      `</contract>` +
      `</create>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    // ── DIAGNOSTIC (keep until create round-trips against the live endpoint) ──
    console.log('[ExpMgmt LINES CREATE] soap body:', soapBody);

    const response = await axios.post(
      `${config.resource}soap/services/${EXP_MGMT_LINES_GROUP}`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: `http://tempuri.org/${EXP_MGMT_LINES_CONTRACT}/create`,
        },
        responseType: 'text',
        timeout: 30000,
      },
    );

    // ── DIAGNOSTIC (keep until create round-trips against the live endpoint) ──
    console.log(
      '[ExpMgmt LINES CREATE] raw response:',
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
      parsed?.['s:Envelope']?.['s:Body']?.['createResponse']?.['result'];

    if (!result) {
      return {
        IsSuccess: false,
        Message: 'No response returned from server.',
        RecId: '',
      };
    }

    // A SINGLE GeneralContract — may be namespace-prefixed, bare, or inlined
    // directly on <result>.
    const contract =
      result?.['a:GeneralContract'] || result?.['GeneralContract'] || result;

    const isSuccessStr = toStr(pick(contract, 'IsSuccess')).toLowerCase();

    return {
      IsSuccess: isSuccessStr === 'true' || isSuccessStr === '1',
      Message: toStr(pick(contract, 'Message')),
      // RecId on the response is the new LineRecId.
      RecId: toStr(pick(contract, 'RecId')),
    };
  } catch (err) {
    // ── DIAGNOSTIC (keep until create round-trips against the live endpoint) ──
    console.error('[ExpMgmt LINES CREATE] error:', err.message);
    console.error(
      '[ExpMgmt LINES CREATE] error body:',
      err.response?.data || err.stack,
    );
    return {
      IsSuccess: false,
      Message: err?.message || 'Error creating expense line.',
      RecId: '',
    };
  }
};

export {CreateExpenseManagementLine};
