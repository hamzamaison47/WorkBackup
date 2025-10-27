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
  'http://tempuri.org/TASAttendanceRegisterSvc/markAttendance';

/**
 * MarkAdjustment
 * Expect in contract:
 *   - EmployeeId (string/number)
 *   - EmployeeName (string)
 *   - ClockIn / ClockOut: seconds (number or numeric string)
 *   - AttendanceDate: 'YYYY-MM-DD' or full ISO 'YYYY-MM-DDTHH:mm:ssZ' (or with offset)
 *   - Remarks (string)
 */
const MarkAdjustment = async ({contract}) => {
  try {
    const config = await getActiveConfigData();
    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <markAttendance xmlns="http://tempuri.org">
        <contract xmlns:tem="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">
          ${buildContractXml(contract)}
        </contract>
      </markAttendance>
    `;

    const soapEnvelope = createSoapEnvelope(soapBody);

    // Optional: debug log (remove in production)
    try {
      console.log('[markAttendance] SOAP Request:', soapEnvelope);
    } catch {}

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
      },
    );

    const parsed = parseSoap(xml);

    const body =
      parsed?.['s:Envelope']?.['s:Body'] ||
      parsed?.['soap:Envelope']?.['soap:Body'] ||
      {};
    const result =
      body?.markAttendanceResponse?.result ||
      body?.['markAttendanceResponse']?.['result'];

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
      IsSuccess:
        cleaned?.IsSuccess === true ||
        String(cleaned?.IsSuccess).toLowerCase() === 'true',
      isSuccess:
        cleaned?.isSuccess === true ||
        String(cleaned?.isSuccess).toLowerCase() === 'true',
      Message: cleaned?.Message || '',
      message: cleaned?.message || '',
      raw: cleaned,
    };
  } catch (error) {
    console.error(
      '❌ markAttendance failed:',
      error?.response?.data || error?.message,
    );
    throw error;
  }
};

// ---------------- helpers ----------------
const buildContractXml = c => {
  // IMPORTANT: never treat 0 as empty
  const has = v => !(v === '' || v === null || v === undefined);

  const safe = {
    EMPLOYEEID: c?.EmployeeId,
    EmployeeName: c?.EmployeeName,
    ClockIn: c?.ClockIn, // seconds
    ClockOut: c?.ClockOut, // seconds
    AttendanceDate: c?.AttendanceDate, // ✅ single correct field only
    Remarks: sanitizeRemarks(c?.Remarks),
  };

  const ns = 'tem';
  const emit = (field, val) =>
    has(val)
      ? `<${ns}:${field}>${escapeXmlValue(String(val))}</${ns}:${field}>`
      : `<${ns}:${field} xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>`;

  // Consistent order (no misspelled field)
  const ordered = [
    'AttendanceDate',
    'ClockIn',
    'ClockOut',
    'EMPLOYEEID',
    'EmployeeName',
    'Remarks',
  ];

  return ordered.map(k => emit(k, safe[k])).join('');
};

const sanitizeRemarks = txt =>
  String(txt ?? '')
    .replace(/\\n/g, ' ')
    .replace(/\/n/g, ' ')
    .replace(/\r?\n/g, ' ')
    .trim();

const escapeXmlValue = value =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const parseSoap = xml =>
  new XMLParser({
    ignoreAttributes: false,
    ignoreNameSpace: false,
    attributeNamePrefix: '',
    isArray: () => false,
    parseTagValue: false,
  }).parse(xml);

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

export {MarkAdjustment};
