/* eslint-disable quotes */
/* eslint-disable curly */
/* eslint-disable dot-notation */
// Creates a single travel requisition header (DFTravelRequisitionContract).
//
// NOTE: the operation namespace is "http://tempuri.org" with NO trailing slash.
// Do NOT copy any trailing-slash convention — DFTravelRequisitionSvcGroup is a
// real, dedicated service.
//
// SCHEMA CHANGE: DFTravelRequisitionContract was originally decorated with
// [DataMemberAttribute] on the CLASS instead of [DataContractAttribute],
// which produced a malformed WSDL requiring __k_parm-prefixed element names
// (with inconsistent internal casing) to deserialize correctly. That's why
// this file used to send __k_parmDescription, __k_parmfromDate, etc.
//
// FIXED: the class is now properly decorated with [DataContractAttribute],
// producing a clean, standard schema — plain PascalCase element names
// matching the DataMemberAttribute strings exactly:
//   ApprovalStatus, Description, FromDate, HcmWorkerRecId, Location,
//   NumberofDays, RecId, RequisitionDate, RequisitionNumber, TableId,
//   ToDate, TotalEstimateWithCurrency, TravelType
// (alphabetical — DataContractSerializer's default ordering absent an
// explicit Order= on each DataMemberAttribute). ELEMENT ORDER IS
// LOAD-BEARING: sending fields out of this relative order causes the
// deserializer to silently drop whatever comes after the misplaced field —
// confirmed on UpdateTravelRequisition.js's debugging history. This file
// sends its fields in schema order: Description < FromDate <
// HcmWorkerRecId < Location < NumberofDays < ToDate < TravelType.
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

  return (
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(
      2,
      '0',
    )}` +
    `T${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0',
    )}:${String(seconds).padStart(2, '0')}`
  );
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

const CreateTravelRequisition = async (headerData = {}) => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // Plain DataMemberAttribute names against the new (correct) schema, in
    // schema order: Description(2) < FromDate(3) < HcmWorkerRecId(4) <
    // Location(5) < NumberofDays(6) < ToDate(11) < TravelType(13).
    const soapBody =
      `<create xmlns="http://tempuri.org">` +
      `<contract xmlns:d="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">` +
      `<d:Description>${escapeXml(headerData.Description)}</d:Description>` +
      `<d:FromDate>${toIsoDateTime(headerData.FromDate)}</d:FromDate>` +
      `<d:Location>${escapeXml(headerData.Location)}</d:Location>` +
      `<d:NumberofDays>${
        parseInt(headerData.NumberofDays, 10) || 0
      }</d:NumberofDays>` +
      `<d:PersonnelNumber>${escapeXml(
        headerData.PersonnelNumber || headerData.employeeId,
      )}</d:PersonnelNumber>` +
      `<d:ToDate>${toIsoDateTime(headerData.ToDate)}</d:ToDate>` +
      `<d:TravelType>${escapeXml(headerData.TravelType)}</d:TravelType>` +
      `</contract>` +
      `</create>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    // ── DIAGNOSTIC (instrumentation only — remove after wire shape confirmed) ──
    console.log('[TravelReq CREATE] soap body:', soapBody);

    const response = await axios.post(
      `${config.resource}soap/services/DFTravelRequisitionSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/DFTravelRequisitionSvc/create',
        },
        responseType: 'text',
        timeout: 30000,
      },
    );

    // ── DIAGNOSTIC (instrumentation only) ──
    console.log(
      '[TravelReq CREATE] raw response:',
      String(response.data).slice(0, 1500),
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
    console.error('CreateTravelRequisition SOAP Error:', err.message);
    console.error('Error details:', err.response?.data || err.stack);
    return {
      IsSuccess: false,
      Message: err?.message || 'Error creating travel requisition.',
      RecId: '',
    };
  }
};

export {CreateTravelRequisition};
