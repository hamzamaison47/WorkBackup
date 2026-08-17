/* eslint-disable curly */
/* eslint-disable quotes */
/* eslint-disable dot-notation */
// Expense categories (cost types) available to a worker for expense LINES.
// Feeds the CostType dropdown on the line create form.
//
// Operation: retrieveExpenseCategory(_workerRecId: Int64)
//            → DFExpenseManagementLinesContract[]  (CostType populated only)
//
// The backend filters TrvCostType by the worker's HRMS grade, excluding
// import-only, inactive and medical cost types — so this list is per-worker and
// cannot be cached across employees.
//
// ⚠️ PARAM TYPE TRAP: this takes _workerRecId — the NUMERIC worker RecId. That
// is the opposite of the header module's retrieveMapTravelRequisitions, which
// takes a personnel-number STRING (_employeeId). Passing the personnel number
// here will not match a worker. The two lookups genuinely differ; this one
// matches the Travel lines retrieveExpenseCategory.
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

const RetrieveExpenseCategory = async workerRecId => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    if (!workerRecId) {
      console.log('[ExpMgmt CAT] no workerRecId supplied — returning []');
      return [];
    }

    const token = await getToken();

    // ── DIAGNOSTIC (keep until the dropdown is confirmed populating) ──
    console.log('[ExpMgmt CAT] sending _workerRecId:', workerRecId);

    const soapBody =
      `<retrieveExpenseCategory xmlns="http://tempuri.org">` +
      `<_workerRecId>${workerRecId}</_workerRecId>` +
      `</retrieveExpenseCategory>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const response = await axios.post(
      `${config.resource}soap/services/${EXP_MGMT_LINES_GROUP}`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: `http://tempuri.org/${EXP_MGMT_LINES_CONTRACT}/retrieveExpenseCategory`,
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
      parsed?.['s:Envelope']?.['s:Body']?.['retrieveExpenseCategoryResponse']?.[
        'result'
      ];

    if (
      !result ||
      (typeof result === 'object' && Object.keys(result).length === 0)
    ) {
      console.log('[ExpMgmt CAT] empty result — no categories for worker');
      return [];
    }

    const rawContracts =
      result['a:DFExpenseManagementLinesContract'] ||
      result['DFExpenseManagementLinesContract'];

    if (!rawContracts) {
      console.log('[ExpMgmt CAT] result node had no contracts:', result);
      return [];
    }

    const contracts = Array.isArray(rawContracts)
      ? rawContracts
      : [rawContracts];

    // ── DIAGNOSTIC (keep until the dropdown is confirmed populating) ──
    console.log('[ExpMgmt CAT] count:', contracts.length);
    console.log(
      '[ExpMgmt CAT] first contract raw keys:',
      contracts[0] ? Object.keys(contracts[0]) : 'NONE',
    );

    const categories = contracts
      .map(contract => toStr(pick(contract, 'CostType')))
      .filter(costType => costType !== '');

    // ── DIAGNOSTIC (keep until the dropdown is confirmed populating) ──
    console.log('[ExpMgmt CAT] cost types:', JSON.stringify(categories));

    return categories;
  } catch (err) {
    console.error(
      '[ExpMgmt CAT] RetrieveExpenseCategory SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {RetrieveExpenseCategory};
