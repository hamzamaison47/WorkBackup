/* eslint-disable curly */
/* eslint-disable dot-notation */
// Finds every Expense Management LINE for a header.
//
// Operation: findExpenseManagementLines(_headerRecId: Int64)
//            → DFExpenseManagementLinesContract[]
//
// The X++ expLineBufferToContract() populates only these members on find:
//   CostType, Transaction (= TransDate), ClaimedAmount, ExchangeCode,
//   AmountInPKR, DateFrom, DateTo, LineRecId, MealReductionAmount
// The other contract members (PersonnelNumber, HeaderRecId, Departure*/Arrival*)
// exist on the contract but are NOT filled in by this operation.
//
// ⚠️ WIRE NAME TRAP: the transaction-date member is "Transaction", NOT
// "TransactionDate" — the X++ field is transactionDate but its DataMember
// attribute is "Transaction". Reading "TransactionDate" silently yields ''.
//
// Bare a: names are confirmed for this module (the header find returned
// a:Location / a:DateFrom etc., never __k_parm), so pick() only has to tolerate
// the a: prefix.
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../../Controller/secureConfig';
import {EXP_MGMT_LINES_CONTRACT, EXP_MGMT_LINES_GROUP} from './serviceConfig';

// Tolerates the a: datacontract namespace prefix on contract elements.
const pick = (obj, name) =>
  obj?.['a:' + name] !== undefined ? obj['a:' + name] : obj?.[name];

const toStr = value => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object')
    return value['#text'] !== undefined ? String(value['#text']) : '';
  return String(value);
};

const toNumber = value => {
  const num = parseFloat(toStr(value));
  return isNaN(num) ? 0 : num;
};

const toInt = value => {
  const num = parseInt(toStr(value), 10);
  return isNaN(num) ? 0 : num;
};

// D365 serializes "no date" as 1900-01-01T00:00:00; surface that as null so the
// UI renders N/A rather than a bogus 1900 date.
//
// Parses date components directly from the string instead of new Date(str) —
// Hermes interprets a timezone-less ISO string as UTC, which silently shifts
// the wall-clock time by the device's UTC offset once read back via local
// getters (date can look right while the hour/minute is wrong). Building the
// Date from explicit local components avoids any timezone reinterpretation.
const toDate = value => {
  const str = toStr(value);
  if (!str || str.startsWith('1900-01-01')) return null;

  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (!match) {
    // Fallback for unexpected formats — still avoid new Date(str) directly.
    return null;
  }

  const [, year, month, day, hours, minutes, seconds] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
    Number(seconds),
  );

  return isNaN(date.getTime()) ? null : date;
};

const FindExpenseManagementLines = async headerRecId => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    if (!headerRecId) {
      // ── DIAGNOSTIC ──
      console.log(
        '[ExpMgmt LINES FIND] bailing — missing _headerRecId. value:',
        headerRecId,
        typeof headerRecId,
      );
      return [];
    }

    const token = await getToken();

    const soapBody =
      '<findExpenseManagementLines xmlns="http://tempuri.org">' +
      `<_headerRecId>${headerRecId}</_headerRecId>` +
      '</findExpenseManagementLines>';

    const soapEnvelope = createSoapEnvelope(soapBody);

    const response = await axios.post(
      `${config.resource}soap/services/${EXP_MGMT_LINES_GROUP}`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: `http://tempuri.org/${EXP_MGMT_LINES_CONTRACT}/findExpenseManagementLines`,
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
      parsed?.['s:Envelope']?.['s:Body']?.[
        'findExpenseManagementLinesResponse'
      ]?.['result'];

    // 0-row case: result absent or an empty object.
    if (
      !result ||
      (typeof result === 'object' && Object.keys(result).length === 0)
    ) {
      console.log('[ExpMgmt LINES FIND] empty result — no lines for header');
      return [];
    }

    const rawContracts =
      result['a:DFExpenseManagementLinesContract'] ||
      result['DFExpenseManagementLinesContract'];

    if (!rawContracts) {
      console.log('[ExpMgmt LINES FIND] result node had no contracts:', result);
      return [];
    }

    const contracts = Array.isArray(rawContracts)
      ? rawContracts
      : [rawContracts];

    // ── DIAGNOSTIC (keep until the wire shape is confirmed on first run) ──
    console.log('[ExpMgmt LINES FIND] count:', contracts.length);
    console.log(
      '[ExpMgmt LINES FIND] first contract raw keys:',
      contracts[0] ? Object.keys(contracts[0]) : 'NONE',
    );
    console.log(
      '[ExpMgmt LINES FIND] first contract raw:',
      JSON.stringify(contracts[0] ?? {}),
    );

    const lines = contracts.map(contract => ({
      // LineRecId is the line's OWN record id (the header's is HeaderRecId).
      LineRecId: toInt(pick(contract, 'LineRecId')),
      HeaderRecId: toInt(pick(contract, 'HeaderRecId')),
      CostType: toStr(pick(contract, 'CostType')),
      // "Transaction" is the DataMember name for the transaction date.
      Transaction: toDate(pick(contract, 'Transaction')),
      ClaimedAmount: toNumber(pick(contract, 'ClaimedAmount')),
      ExchangeCode: toStr(pick(contract, 'ExchangeCode')),
      ExchangeRate: toNumber(pick(contract, 'ExchangeRate')), // ← add this
      AmountInPKR: toNumber(pick(contract, 'AmountInPKR')),
      MealReductionAmount: toNumber(pick(contract, 'MealReductionAmount')),
      DateFrom: toDate(pick(contract, 'DateFrom')),
      DateTo: toDate(pick(contract, 'DateTo')),
      DepartureLocation: toStr(pick(contract, 'DepartureLocation')),
      DepartureDateTime: toDate(pick(contract, 'DepartureDateTime')),
      ArrivalLocation: toStr(pick(contract, 'ArrivalLocation')),
      ArrivalDateTime: toDate(pick(contract, 'ArrivalDateTime')),
      Mileage: toNumber(pick(contract, 'Mileage')),
      RatePerMile: toNumber(pick(contract, 'RatePerMile')),
      PersonnelNumber: toStr(pick(contract, 'PersonnelNumber')),
      CreatedDateTime: toDate(pick(contract, 'CreatedDateTime')),
    }));

    // ── DIAGNOSTIC (keep until the wire shape is confirmed on first run) ──
    console.log(
      '[ExpMgmt LINES FIND] picked row0:',
      JSON.stringify(lines[0] ?? {}),
    );

    return lines;
  } catch (err) {
    console.error(
      '[ExpMgmt LINES FIND] SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {FindExpenseManagementLines};
