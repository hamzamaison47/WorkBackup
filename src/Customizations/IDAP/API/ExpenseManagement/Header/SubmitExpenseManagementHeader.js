/* eslint-disable quotes */
/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../../Controller/secureConfig';
import {EXP_MGMT_HEADER_CONTRACT, EXP_MGMT_HEADER_GROUP} from './serviceConfig';

const pick = (obj, name) =>
  obj?.['a:' + name] !== undefined ? obj['a:' + name] : obj?.[name];

const toStr = value => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object')
    return value['#text'] !== undefined ? String(value['#text']) : '';
  return String(value);
};

const toBoolean = value => {
  const str = toStr(value).toLowerCase();
  return str === 'true' || str === '1';
};

const stripDebugTrace = message => {
  if (!message) return message;

  const cleaned = message
    .replace(/Site Survey Debug:[\s\S]*?skipped\.\s*/gi, '')
    .replace(/^\s*\n+/g, '') // drop now-empty leading lines
    .trim();

  return cleaned || message; // fall back to original if we stripped everything
};

// Infolog entries land in the SOAP response header regardless of success or
// failure. When a fault occurs, these carry the real validation message
// (e.g. "Attachment is missing...") — the fault's faultstring is often just
// a generic CLR exception (e.g. NullReferenceException) and not useful.
const extractInfologMessages = parsed => {
  const entries =
    parsed?.['s:Envelope']?.['s:Header']?.['Infolog']?.['Entries']?.[
      'InfologEntry'
    ];
  if (!entries) return [];
  const list = Array.isArray(entries) ? entries : [entries];
  return list
    .map(entry => toStr(pick(entry, 'Message') ?? entry?.['Message']))
    .filter(Boolean);
};

const SubmitExpenseManagementHeader = async ({recId}) => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    if (!recId) {
      throw new Error('Missing expense header RecId for submit.');
    }

    const token = await getToken();

    const soapBody =
      `<submitExpenseHeaderbyRecId xmlns="http://tempuri.org">` +
      `<_recId>${recId}</_recId>` +
      `</submitExpenseHeaderbyRecId>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const response = await axios.post(
      `${config.resource}soap/services/${EXP_MGMT_HEADER_GROUP}`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: `http://tempuri.org/${EXP_MGMT_HEADER_CONTRACT}/submitExpenseHeaderbyRecId`,
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

    if (parsed?.['s:Envelope']?.['s:Body']?.['s:Fault']) {
      const infologMessages = extractInfologMessages(parsed);
      if (infologMessages.length > 0) {
        return {
          IsSuccess: false,
          Message: stripDebugTrace(infologMessages.join('\n')),
          RecId: '',
        };
      }

      const fault = parsed['s:Envelope']['s:Body']['s:Fault'];
      const faultReason =
        fault.faultstring || fault.Reason?.Text || 'Unknown SOAP fault';
      throw new Error(`SOAP Fault: ${faultReason}`);
    }

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.[
        'submitExpenseHeaderbyRecIdResponse'
      ]?.['result'];

    if (!result) {
      return {
        IsSuccess: false,
        Message: 'No response returned from server.',
        RecId: '',
      };
    }

    // Single GeneralContract — may be namespace-prefixed, bare, or inlined
    // directly on <result>.
    const contract =
      result?.['a:GeneralContract'] || result?.['GeneralContract'] || result;

    return {
      IsSuccess: toBoolean(pick(contract, 'IsSuccess')),
      Message: stripDebugTrace(toStr(pick(contract, 'Message'))),
      RecId: toStr(pick(contract, 'RecId')),
    };
  } catch (err) {
    console.error(
      'SubmitExpenseManagementHeader SOAP Error:',
      err.response?.data || err.message,
    );
    return {
      IsSuccess: false,
      Message: err?.message || 'Error submitting expense header.',
      RecId: '',
    };
  }
};

export {SubmitExpenseManagementHeader};
