/* eslint-disable curly */
/* eslint-disable dot-notation */
// Retrieves the list of medical expense sub-categories.
// Only the SubCategory field of each DFExpenseReportLinesContract is populated.
//
// NOTE: the operation namespace is "http://tempuri.org" with NO trailing slash.
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../../Controller/secureConfig';

// Tolerates the a: namespace prefix on contract elements.
const pick = (obj, name) =>
  obj?.['a:' + name] !== undefined ? obj['a:' + name] : obj?.[name];

const toStr = value => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object')
    return value['#text'] !== undefined ? String(value['#text']) : '';
  return String(value);
};

const RetrieveExpenseSubCategory = async () => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <retrieveExpenseSubCategory xmlns="http://tempuri.org"/>
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
            'http://tempuri.org/DFExpenseReportLinesSvc/retrieveExpenseSubCategory',
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

    // SOAP fault
    if (parsed?.['s:Envelope']?.['s:Body']?.['s:Fault']) {
      const fault = parsed['s:Envelope']['s:Body']['s:Fault'];
      const faultReason =
        fault.faultstring || fault.Reason?.Text || 'Unknown SOAP fault';
      throw new Error(`SOAP Fault: ${faultReason}`);
    }

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.[
        'retrieveExpenseSubCategoryResponse'
      ]?.['result'];

    // 0-row case
    if (
      !result ||
      (typeof result === 'object' && Object.keys(result).length === 0)
    ) {
      return [];
    }

    const rawContracts =
      result['a:DFExpenseReportLinesContract'] ||
      result['DFExpenseReportLinesContract'];

    if (!rawContracts) {
      return [];
    }

    // Normalize single-element responses to an array.
    const contracts = Array.isArray(rawContracts)
      ? rawContracts
      : [rawContracts];

    return contracts
      .map(contract => toStr(pick(contract, 'SubCategory')))
      .filter(subCategory => subCategory !== '');
  } catch (err) {
    console.error('RetrieveExpenseSubCategory SOAP Error:', err.message);
    console.error('Error details:', err.response?.data || err.stack);
    throw err;
  }
};

export {RetrieveExpenseSubCategory};
