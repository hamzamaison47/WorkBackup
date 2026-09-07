/* eslint-disable curly */
/* eslint-disable dot-notation */
// Creates a single travel requisition line (DFTravelRequisitionLinesContract)
// against an existing travel requisition header.
//
// NOTE: the operation namespace is "http://tempuri.org" with NO trailing slash.
// Do NOT copy any trailing-slash convention — DFTravelRequisitionLinesSvcGroup
// is a real, dedicated service.
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../../Controller/secureConfig';

const getOffsetSuffix = date => {
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${sign}${hh}:${mm}`;
};

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

// Preserves the actual time component (unlike toIsoDateTime, which forces
// midnight) — used for PerDiemFromDate/PerDiemToDate now that those fields
// are time-selectable, not just date-only like EstimatedDate.
const toIsoDateTimePreserveTime = value => {
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

const CreateTravelRequisitionLine = async (headerRecId, lineData = {}) => {
  try {
    // ── DIAGNOSTIC (instrumentation only — remove after wire shape confirmed) ──
    console.log(
      '[TravelReqLine CREATE] headerRecId received:',
      headerRecId,
      typeof headerRecId,
      'full props:',
      JSON.stringify(lineData ?? {}),
    );

    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    if (!headerRecId) {
      throw new Error(
        'Missing travel requisition header RecId for line create.',
      );
    }

    const token = await getToken();

    // Members use explicit [DataMemberAttribute("Name")]; names (case-sensitive)
    // matter, not order. There is NO separate parent-FK member: the parent header
    // RecId is carried in the contract's own RecId member (backend does
    // requisitionLine.TrvRequisitionTable = contract.parmRecId()).
    // LegalEntity is REQUIRED on the contract — backend calls
    // CompanyInfo::findDataArea(parmLegalEntity()); it is NOT taken from
    // CallContext here. AmountInPKR is read-only (never sent on create).
    //
    // AirlineServiceClass / Mileage / PerDiemFromDate / PerDiemToDate are
    // category-conditional on the screen (Flight * / Car Mileage / Per Diem *
    // respectively) and are only included in the envelope when the caller
    // actually supplies them, so unrelated categories don't push empty/zero
    // values into fields the backend doesn't expect for that category.
    const optionalFields = [];
    if (lineData.AirlineServiceClass !== undefined) {
      optionalFields.push(
        `<d:AirlineServiceClass>${escapeXml(
          lineData.AirlineServiceClass,
        )}</d:AirlineServiceClass>`,
      );
    }
    if (lineData.Mileage !== undefined) {
      optionalFields.push(
        `<d:Mileage>${toNumber(lineData.Mileage)}</d:Mileage>`,
      );
    }
    if (lineData.PerDiemFromDate !== undefined) {
      optionalFields.push(
        `<d:PerDiemFromDate>${toIsoDateTimePreserveTime(
          lineData.PerDiemFromDate,
        )}</d:PerDiemFromDate>`,
      );
    }
    if (lineData.PerDiemToDate !== undefined) {
      optionalFields.push(
        `<d:PerDiemToDate>${toIsoDateTimePreserveTime(
          lineData.PerDiemToDate,
        )}</d:PerDiemToDate>`,
      );
    }

    const soapBody = `
  <create xmlns="http://tempuri.org">
    <contract xmlns:d="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">
      ${
        lineData.AirlineServiceClass !== undefined
          ? `<d:AirlineServiceClass>${escapeXml(
              lineData.AirlineServiceClass,
            )}</d:AirlineServiceClass>`
          : ''
      }
      ${
        lineData.AmountInPKR !== undefined
          ? `<d:AmountInPKR>${toNumber(lineData.AmountInPKR)}</d:AmountInPKR>`
          : ''
      }
      <d:Category>${escapeXml(lineData.Category)}</d:Category>
      <d:Currency>${escapeXml(lineData.Currency)}</d:Currency>
      <d:EstimatedAmount>${toNumber(
        lineData.EstimatedAmount,
      )}</d:EstimatedAmount>
      <d:EstimatedDate>${toIsoDateTime(
        lineData.EstimatedDate,
      )}</d:EstimatedDate>
      <d:LegalEntity>${escapeXml(lineData.LegalEntity)}</d:LegalEntity>
      ${
        lineData.Mileage !== undefined
          ? `<d:Mileage>${toNumber(lineData.Mileage)}</d:Mileage>`
          : ''
      }
      ${
        lineData.PerDiemFromDate !== undefined
          ? `<d:PerDiemFromDate>${toIsoDateTimePreserveTime(
              lineData.PerDiemFromDate,
            )}</d:PerDiemFromDate>`
          : ''
      }
      ${
        lineData.PerDiemToDate !== undefined
          ? `<d:PerDiemToDate>${toIsoDateTimePreserveTime(
              lineData.PerDiemToDate,
            )}</d:PerDiemToDate>`
          : ''
      }
      <d:RecId>${headerRecId}</d:RecId>
    </contract>
  </create>
`;

    console.log('here is the bodu', soapBody);

    const soapEnvelope = createSoapEnvelope(soapBody);

    console.log('here is soap', soapEnvelope);

    const response = await axios.post(
      `${config.resource}soap/services/DFTravelRequisitionLinesSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/DFTravelRequisitionLinesSvc/create',
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
    console.error('CreateTravelRequisitionLine SOAP Error:', err.message);
    console.error('Error details:', err.response?.data || err.stack);
    return {
      IsSuccess: false,
      Message: err?.message || 'Error creating travel requisition line.',
      RecId: '',
    };
  }
};

export {CreateTravelRequisitionLine};
