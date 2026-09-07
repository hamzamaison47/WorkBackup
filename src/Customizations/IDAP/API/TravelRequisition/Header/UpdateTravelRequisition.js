/* eslint-disable quotes */
/* eslint-disable curly */
/* eslint-disable dot-notation */
// Updates an EXISTING travel requisition header (Draft/Create status only —
// see the `disabled: !isEditable` gate on TravelRequisitionListPage).
//
// FIXED: matches CreateTravelRequisition.js's now-corrected schema — plain
// PascalCase element names (DFTravelRequisitionContract is properly
// decorated with [DataContractAttribute] now), sent in schema order:
//   Description < FromDate < Location < NumberofDays < RecId < ToDate < TravelType
// Same member set as create, plus RecId to target the existing record.
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

// Same serialization CreateTravelRequisition.js uses.
const toIsoDateTime = value => {
  if (!value) return '';
  let year,
    month,
    day,
    hours = 0,
    minutes = 0,
    seconds = 0;

  if (typeof value === 'string') {
    const [datePart, timePart] = value.split('T');
    const dateParts = datePart.split('-').map(Number);
    if (dateParts.length < 3 || dateParts.some(isNaN)) {
      const parsed = new Date(value);
      if (isNaN(parsed.getTime())) return '';
      year = parsed.getFullYear();
      month = parsed.getMonth() + 1;
      day = parsed.getDate();
      hours = parsed.getHours();
      minutes = parsed.getMinutes();
      seconds = parsed.getSeconds();
    } else {
      [year, month, day] = dateParts;
      if (timePart) {
        const timeParts = timePart.replace('Z', '').split(':').map(Number);
        [hours, minutes, seconds = 0] = timeParts;
      }
    }
  } else {
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '';
    year = d.getFullYear();
    month = d.getMonth() + 1;
    day = d.getDate();
    hours = d.getHours();
    minutes = d.getMinutes();
    seconds = d.getSeconds();
  }

  const literal =
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(
      2,
      '0',
    )}` +
    `T${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0',
    )}:${String(seconds).padStart(2, '0')}`;

  const d = new Date(year, month - 1, day, hours, minutes, seconds);
  return `${literal}${getOffsetSuffix(d)}`;
};

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

const UpdateTravelRequisition = async ({
  recId,
  Location,
  Description,
  FromDate,
  ToDate,
  NumberofDays,
  TravelType,
} = {}) => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    if (!recId) {
      throw new Error('Missing RecId for travel requisition update.');
    }

    const token = await getToken();

    // Plain DataMemberAttribute names, schema order: Description(2)
    // FromDate(3) < Location(5) < NumberofDays(6) < RecId(8) < ToDate(11)
    // TravelType(13) — matches CreateTravelRequisition.js's shape/casing
    // exactly, with RecId added to target the existing record.
    const soapBody =
      `<update xmlns="http://tempuri.org">` +
      `<contract xmlns:d="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">` +
      `<d:Description>${escapeXml(Description)}</d:Description>` +
      `<d:FromDate>${toIsoDateTime(FromDate)}</d:FromDate>` +
      `<d:Location>${escapeXml(Location)}</d:Location>` +
      `<d:NumberofDays>${parseInt(NumberofDays, 10) || 0}</d:NumberofDays>` +
      `<d:RecId>${parseInt(recId, 10) || 0}</d:RecId>` +
      `<d:ToDate>${toIsoDateTime(ToDate)}</d:ToDate>` +
      `<d:TravelType>${escapeXml(TravelType)}</d:TravelType>` +
      `</contract>` +
      `</update>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    console.log('[TravelReq UPDATE] soap body:', soapBody);

    const response = await axios.post(
      `${config.resource}soap/services/DFTravelRequisitionSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/DFTravelRequisitionSvc/update',
        },
        responseType: 'text',
        timeout: 30000,
      },
    );

    console.log(
      '[TravelReq UPDATE] raw response:',
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

    const isSuccessStr = toStr(pick(result, 'IsSuccess')).toLowerCase();

    return {
      IsSuccess: isSuccessStr === 'true' || isSuccessStr === '1',
      Message: toStr(pick(result, 'Message')),
      RecId: toStr(pick(result, 'RecId')),
    };
  } catch (err) {
    console.error('[TravelReq UPDATE] error:', err.message);
    console.error(
      '[TravelReq UPDATE] error body:',
      err.response?.data || err.stack,
    );
    return {
      IsSuccess: false,
      Message: err?.message || 'Error updating travel requisition.',
      RecId: '',
    };
  }
};

export {UpdateTravelRequisition};
