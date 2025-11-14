/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

// ---- Service group & SOAP action ----
const SVC_GROUP = 'TASAttendanceRegisterSvcGroup';
const SOAP_ACTION =
  'http://tempuri.org/TASAttendanceRegisterSvc/EditAttendance';

/* ---------------- helpers ---------------- */

/** Sanitize remarks */
const sanitizeRemarks = txt =>
  String(txt ?? '')
    .replace(/\\n/g, ' ')
    .replace(/\/n/g, ' ')
    .replace(/\r?\n/g, ' ')
    .trim();

/** Escape XML */
const escapeXmlValue = value =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Parse SOAP */
const parseSoap = xml =>
  new XMLParser({
    ignoreAttributes: false,
    ignoreNameSpace: false,
    attributeNamePrefix: '',
    isArray: () => false,
    parseTagValue: false,
  }).parse(xml);

/** Clean namespaces on a parsed object */
const cleanNamespaces = obj => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanNamespaces);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k.replace(/^[a-zA-Z0-9]+:/, ''),
      typeof v === 'object' ? cleanNamespaces(v) : v,
    ]),
  );
};

/**
 * Convert UI time to seconds.
 * Accepts: "58020", "16:05", "16:05:30", "4:05 PM", "04:05 am"
 */
const toSeconds = v => {
  if (v === null || v === undefined || v === '') return '';
  const raw = String(v).trim();

  // Already seconds
  if (/^\d+$/.test(raw)) {
    const s = Number(raw);
    return Number.isFinite(s) && s >= 0 ? s : '';
  }

  // HH:mm:ss (24h)
  let m = raw.match(/^([01]?\d|2[0-3]):([0-5]\d):([0-5]\d)$/);
  if (m) {
    const h = Number(m[1]);
    const min = Number(m[2]);
    const s = Number(m[3]);
    return h * 3600 + min * 60 + s;
  }

  // HH:mm (24h)
  m = raw.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (m) {
    const h = Number(m[1]);
    const min = Number(m[2]);
    return h * 3600 + min * 60;
  }

  // h:mm AM/PM
  m = raw.match(/^(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i);
  if (m) {
    let h = Number(m[1]);
    const min = Number(m[2]);
    const mer = m[3].toUpperCase();
    if (h < 1 || h > 12) return '';
    if (mer === 'AM') h = h === 12 ? 0 : h;
    else h = h === 12 ? 12 : h + 12;
    return h * 3600 + min * 60;
  }

  return ''; // unsupported
};

/* ---------------- XML contract builder ---------------- */

/**
 * Build the contract XML with ClockIn/ClockOut forced to seconds (Int32).
 * Note: `nsPrefix` must match the prefix declared on the <contract> element.
 */
const buildContractXml = (c, nsPrefix = 'tem') => {
  if (!c || typeof c !== 'object') {
    throw new Error('Contract object is required');
  }

  // Force seconds
  const secIn = toSeconds(c?.ClockIn);
  const secOut = toSeconds(c?.ClockOut);

  // Validate
  if ((c?.ClockIn && secIn === '') || (c?.ClockOut && secOut === '')) {
    throw new Error(
      'Invalid time format. Use "HH:mm", "HH:mm:ss", "h:mm AM/PM", or seconds.',
    );
  }

  // If the backend expects these field names exactly, keep them as-is.
  // (You previously used EMPLOYEEID in all-caps—retained below.)
  const safe = {
    AttendanceDate: c?.AttendanceDate ?? '',
    ClockIn: secIn,
    ClockOut: secOut,
    EMPLOYEEID: c?.EmployeeId ?? '',
    EmployeeName: c?.EmployeeName ?? '',
    GenerationType: 'MobileApp',
    Remarks: sanitizeRemarks(c?.Remarks),
  };

  const has = v => !(v === '' || v === null || v === undefined);

  const emit = (field, val) =>
    has(val)
      ? `<${nsPrefix}:${field}>${escapeXmlValue(
          String(val),
        )}</${nsPrefix}:${field}>`
      : `<${nsPrefix}:${field} xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>`;

  // Order (doesn't usually matter, but keeping it consistent is nice)
  const ordered = [
    'AttendanceDate',
    'ClockIn',
    'ClockOut',
    'EMPLOYEEID',
    'EmployeeName',
    'GenerationType',
    'Remarks',
  ];

  return ordered.map(k => emit(k, safe[k])).join('');
};

/* ---------------- main call ---------------- */

const EditAdjustment = async ({contract}) => {
  try {
    const config = await getActiveConfigData();
    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // Always declare and use the same prefix. Do NOT let it drift from the declaration.
    const nsPrefix = 'tem';
    const soapBody = `
      <EditAttendance xmlns="http://tempuri.org">
        <contract xmlns:${nsPrefix}="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">
          ${buildContractXml(contract, nsPrefix)}
        </contract>
      </EditAttendance>
    `;

    const soapEnvelope = createSoapEnvelope(soapBody);

    console.log({soapEnvelope});

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/${SVC_GROUP}`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: SOAP_ACTION,
        },
        responseType: 'text',
        timeout: 15000,
      },
    );

    const parsed = parseSoap(xml);

    // Faults?
    const body =
      parsed?.['s:Envelope']?.['s:Body'] ||
      parsed?.['soap:Envelope']?.['soap:Body'] ||
      {};
    const fault = body?.['s:Fault'] || body?.['soap:Fault'];
    if (fault) {
      const code = fault?.faultcode || fault?.Code?.Value || 'Fault';
      const msg =
        fault?.faultstring || fault?.Reason?.Text || 'SOAP fault occurred';
      throw new Error(`${code}: ${msg}`);
    }

    const result =
      body?.EditAttendanceResponse?.result ||
      body?.['EditAttendanceResponse']?.['result'];

    if (!result) {
      return {
        isSuccess: false,
        message: 'No result in SOAP response',
        raw: parsed,
      };
    }

    const cleaned = cleanNamespaces(result);

    return {
      recId:
        cleaned?.RecId ||
        cleaned?.recId ||
        cleaned?.RecordId ||
        cleaned?.recordId ||
        null,
      isSuccess:
        cleaned?.IsSuccess === true ||
        String(cleaned?.IsSuccess ?? cleaned?.isSuccess ?? '').toLowerCase() ===
          'true',
      message: cleaned?.Message || cleaned?.message || '',
      raw: cleaned,
    };
  } catch (error) {
    console.error(
      '❌ EditAttendance failed:',
      error?.response?.data || error?.message,
    );
    throw error;
  }
};

export default EditAdjustment;
