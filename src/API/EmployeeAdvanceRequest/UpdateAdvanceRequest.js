/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

// ─── Date normalization ───────────────────────────────────────────────────────
// Converts any date format (MM/DD/YYYY, YYYY-MM-DD, ISO, etc.) to
// YYYY-MM-DDTHH:MM:SS — the only format AX SOAP accepts for DateTime fields.
//
// NOTE: The duplicate DD/MM/YYYY branch that was here before has been removed.
//       It had the same regex as MM/DD/YYYY so it was dead code and could never
//       be reached. The app consistently uses MM/DD/YYYY for display dates.
const normalizeDate = value => {
  if (!value) return '';
  const str = String(value).trim();
  if (!str) return '';

  // Already full ISO with time — return as-is
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) return str;

  // MM/DD/YYYY  (the display format used in the edit modal)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [mm, dd, yyyy] = str.split('/');
    return `${yyyy}-${mm}-${dd}T12:00:00`;
  }

  // YYYY-MM-DD  (date-only ISO)
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return `${str}T12:00:00`;
  }

  // Last resort — let JS parse it
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T12:00:00`;
  }

  // Return as-is and let the server produce a clear error
  return str;
};

// Fields that must be sent as ISO DateTime
const DATE_FIELDS = new Set([
  'RecoveryStartDate',
  'RequestDate',
  'RequestedPaymentDate',
]);

// ─── API ──────────────────────────────────────────────────────────────────────

const UpdateAdvanceRequest = async ({advanceData}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <update xmlns = "http://tempuri.org">
        <contract xmlns:tem = "http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">
          ${buildContractXml(advanceData)}
        </contract>
      </update>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/PREmployeeAdvanceRequestSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/PREmployeeAdvanceRequestSvc/update',
        },
        responseType: 'text',
      },
    );

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: false,
    });

    const parsed = parser.parse(xml);
    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['updateResponse']?.['result'] ||
      parsed?.['soap:Envelope']?.['soap:Body']?.['updateResponse']?.['result'];

    if (!result) {
      console.log('No result found in Update SOAP response');
      return null;
    }

    const cleanObject = obj => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(cleanObject);

      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^[a-zA-Z0-9]+:/, ''),
          typeof value === 'object' ? cleanObject(value) : value,
        ]),
      );
    };

    const cleanedResult = cleanObject(result);

    return cleanedResult;
  } catch (error) {
    console.error(
      'Failed to update advance request:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

// ─── XML builder ──────────────────────────────────────────────────────────────
// Only the 12 fields the AX SOAP contract expects are serialized.
// Every other field that arrives via the spread of editingItem is intentionally
// ignored here — they are kept in the JS object only to preserve local state.
const buildContractXml = contract => {
  if (!contract) return '';

  const ns = 'tem';
  const fields = [
    'AdvanceAmount',
    'AdvanceDescription',
    'AdvanceTypeCode',
    'EmployeeId',
    'Guarantor1',
    'Guarantor2',
    'RecId',
    'RecoveryStartDate',
    'RequestDate',
    'RequestedInstallmentAmount',
    'RequestedInstallments',
    'RequestedPaymentDate',
  ];

  return fields
    .map(field => {
      let value = contract[field];

      // Normalize every date field regardless of what format arrived
      if (DATE_FIELDS.has(field)) {
        value = normalizeDate(value);
      }

      if (value === null || value === undefined || value === '') {
        return `<${ns}:${field} xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>`;
      }
      return `<${ns}:${field}>${escapeXmlValue(value)}</${ns}:${field}>`;
    })
    .join('');
};

const escapeXmlValue = value => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export {UpdateAdvanceRequest};
