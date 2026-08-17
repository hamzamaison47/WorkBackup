/* eslint-disable curly */
/* eslint-disable quotes */
/* eslint-disable dot-notation */
// Currency codes available for expense LINES. Feeds the ExchangeCode dropdown
// on the line create form.
//
// Operation: getCurrencyCode()  — NO parameters, so the request element is
//            self-closing — → DFExpenseManagementLinesContract[]
//
// Only ExchangeCode is populated on each returned contract (the backend fills it
// from CurrencyCodeISO).
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../../Controller/secureConfig';
import {EXP_MGMT_LINES_CONTRACT, EXP_MGMT_LINES_GROUP} from './serviceConfig';

// Tolerates the a: namespace prefix on contract elements.
const pick = (obj, name) =>
  obj?.['a:' + name] !== undefined ? obj['a:' + name] : obj?.[name];

const toStr = value => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object')
    return value['#text'] !== undefined ? String(value['#text']) : '';
  return String(value);
};

const GetCurrencyCode = async () => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `<getCurrencyCode xmlns="http://tempuri.org"/>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const response = await axios.post(
      `${config.resource}soap/services/${EXP_MGMT_LINES_GROUP}`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: `http://tempuri.org/${EXP_MGMT_LINES_CONTRACT}/getCurrencyCode`,
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
      const fault = parsed['s:Envelope']['s:Body']['s:Fault'];
      const faultReason =
        fault.faultstring || fault.Reason?.Text || 'Unknown SOAP fault';
      throw new Error(`SOAP Fault: ${faultReason}`);
    }

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['getCurrencyCodeResponse']?.[
        'result'
      ];

    if (
      !result ||
      (typeof result === 'object' && Object.keys(result).length === 0)
    ) {
      console.log('[ExpMgmt CURR] empty result — no currency codes');
      return [];
    }

    const rawContracts =
      result['a:DFExpenseManagementLinesContract'] ||
      result['DFExpenseManagementLinesContract'];

    if (!rawContracts) {
      console.log('[ExpMgmt CURR] result node had no contracts:', result);
      return [];
    }

    const contracts = Array.isArray(rawContracts)
      ? rawContracts
      : [rawContracts];

    // ── DIAGNOSTIC (keep until the dropdown is confirmed populating) ──
    console.log('[ExpMgmt CURR] count:', contracts.length);
    console.log(
      '[ExpMgmt CURR] first contract raw keys:',
      contracts[0] ? Object.keys(contracts[0]) : 'NONE',
    );

    const currencies = contracts
      .map(contract => toStr(pick(contract, 'ExchangeCode')))
      .filter(code => code !== '');

    // ── DIAGNOSTIC (keep until the dropdown is confirmed populating) ──
    console.log('[ExpMgmt CURR] codes:', JSON.stringify(currencies));

    return currencies;
  } catch (err) {
    console.error(
      '[ExpMgmt CURR] GetCurrencyCode SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {GetCurrencyCode};
