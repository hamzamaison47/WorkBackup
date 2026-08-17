/* eslint-disable curly */
/* eslint-disable dot-notation */
// Generates the Medical OPD claim report for an expense report number and
// returns its PDF payload as a base64 string.
//
// BACKEND CHANGE: the operation return type changed from System.IO.MemoryStream
// to plain str. <result> now carries the raw base64 PDF string directly — there
// is NO MemoryStream wrapper element to unwrap. Read <result> as text and return
// it; return null when <result> is empty/absent so the caller can show an error.
//
// NOTE: the operation namespace is "http://tempuri.org" with NO trailing slash.
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

const toStr = value => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object')
    return value['#text'] !== undefined ? String(value['#text']) : '';
  return String(value);
};

const ViewMedicalOPDClaimReport = async expNumber => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    if (!expNumber) {
      throw new Error('Missing expense report number for claim report.');
    }

    const token = await getToken();

    const soapBody = `
      <viewMedicalOPDClaimReport xmlns="http://tempuri.org">
        <_expNumber>${escapeXml(expNumber)}</_expNumber>
      </viewMedicalOPDClaimReport>
    `;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const response = await axios.post(
      `${config.resource}soap/services/DFExpenseReportLinesSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/DFExpenseReportLinesSvc/viewMedicalOPDClaimReport',
        },
        responseType: 'text',
        timeout: 60000,
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
      parsed?.['s:Envelope']?.['s:Body']?.[
        'viewMedicalOPDClaimReportResponse'
      ]?.['result'];

    // <result> is now the raw base64 PDF string (str return type). Read its text
    // content directly. Empty/absent <result> -> null so the caller shows an
    // error instead of trying to write an empty file.
    const base64 = toStr(result);
    if (!base64) {
      return null;
    }

    return base64;
  } catch (err) {
    console.error('ViewMedicalOPDClaimReport SOAP Error:', err.message);
    console.error('Error details:', err.response?.data || err.stack);
    throw err;
  }
};

export {ViewMedicalOPDClaimReport};
