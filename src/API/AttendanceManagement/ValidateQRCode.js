/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';
import {normalizeObject} from './soapNormalize';

// ─────────────────────────────────────────────
// StatusCode values from DFValidateQRSvc. 'Error' is CLIENT-SIDE ONLY —
// synthesized here so callers get exactly one branch shape and never a throw.
// ─────────────────────────────────────────────
export const QR_STATUS = {
  VALID: 'Valid',
  MALFORMED: 'Malformed',
  NOT_RECOGNIZED: 'NotRecognized',
  NOT_YET_VALID: 'NotYetValid',
  EXPIRED: 'Expired',
  ERROR: 'Error',
};

const fail = message => ({
  IsValid: false,
  StatusCode: QR_STATUS.ERROR,
  Message: message,
  GeoFenceId: null,
  ValidFrom: null,
  ValidTo: null,
});

// soapNormalize.normalizeValue() rewrites 'Yes'→1, 'No'→0 and numeric strings
// →Number, but leaves 'true'/'false' as STRINGS. IsValid therefore arrives as
// 'true', which would fail a `=== true` test. Coerce explicitly.
const toBool = v => {
  if (typeof v === 'boolean') {
    return v;
  }
  const s = String(v ?? '')
    .trim()
    .toLowerCase();
  return s === 'true' || s === '1' || s === 'yes';
};

const toStringOrNull = v => {
  const s = String(v ?? '').trim();
  return s.length > 0 ? s : null;
};

const validateQRCode = async ({qrData, geoFenceIds}) => {
  // Fail closed before any I/O — with no fence to validate against, a "valid"
  // answer would be meaningless.
  const ids = (Array.isArray(geoFenceIds) ? geoFenceIds : [])
    .map(id => String(id ?? '').trim())
    .filter(id => id.length > 0);

  if (!ids.length) {
    return fail(
      'No location to validate this QR code against. Pull down to refresh and try again.',
    );
  }

  const qrString = String(qrData ?? '').trim();
  if (!qrString) {
    return fail('No QR data was captured. Please scan again.');
  }

  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // Element order is WSDL-mandated: DFValidateQRSvcContract declares
    // GeoFenceIds then QRData. DataContractSerializer orders members
    // alphabetically and reordering breaks deserialization server-side —
    // same rule as the FIELDS array in CreateUserAttendance.js.
    // GeoFenceIds is ArrayOfstring, so each entry is a <b:string> child.
    const geoFenceIdXml = ids.map(id => `<b:string>${id}</b:string>`).join('');

    // QRData is base64 ASCII — no XML-special characters, so no escaping.
    const soapBody = `
      <validateQR xmlns="http://tempuri.org">
        <_request xmlns:a="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">
          <a:GeoFenceIds xmlns:b="http://schemas.microsoft.com/2003/10/Serialization/Arrays">${geoFenceIdXml}</a:GeoFenceIds>
          <a:QRData>${qrString}</a:QRData>
        </_request>
      </validateQR>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/DFValidateQRSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/DFValidateQRSvc/validateQR',
        },
        responseType: 'text',
      },
    );

    if (xml.includes('<s:Fault>') || xml.includes('<soap:Fault>')) {
      console.error('validateQRCode SOAP fault:', xml);
      return fail(
        'The server could not validate this QR code. Please try again.',
      );
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: true,
      trimValues: true,
    });

    const parsed = parser.parse(xml);

    // Prefix fallbacks mirror CreateUserAttendance.js:95-99 — this is a new
    // service group and its envelope prefix has not been observed in the wild.
    const envelope =
      parsed?.['s:Envelope'] ??
      parsed?.['soap:Envelope'] ??
      parsed?.['Envelope'];
    const body =
      envelope?.['s:Body'] ?? envelope?.['soap:Body'] ?? envelope?.['Body'];
    const result = body?.['validateQRResponse']?.['result'];

    if (result === undefined || result === null) {
      console.error('validateQRCode: no result element in response');
      return fail(
        'The server returned no answer for this QR code. Please try again.',
      );
    }

    // Same normalization path as RetrieveByPerson — strips the a: prefixes.
    const n = normalizeObject(result);

    console.log('[validateQRCode] parsed result keys →', JSON.stringify(n));

    return {
      IsValid: toBool(n?.IsValid),
      StatusCode: toStringOrNull(n?.StatusCode),
      Message: toStringOrNull(n?.Message),
      GeoFenceId: toStringOrNull(n?.GeoFenceId),
      ValidFrom: toStringOrNull(n?.ValidFrom),
      ValidTo: toStringOrNull(n?.ValidTo),
    };
  } catch (err) {
    console.error(
      'validateQRCode SOAP error:',
      err.response?.data || err.message,
    );
    const offline =
      err.code === 'ECONNABORTED' ||
      !err.response ||
      err.message?.toLowerCase().includes('network error');
    return fail(
      offline
        ? 'Could not reach the server to validate your QR code. Check your connection and try again.'
        : err.message || 'QR validation failed. Please try again.',
    );
  }
};

export {validateQRCode};
