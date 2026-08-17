/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../../Controller/secureConfig';

const GetAllMedicalExpenseLines = async headerRecId => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // NOTE: the operation namespace is "http://tempuri.org" with NO trailing
    // slash. Do not add one.
    const soapBody = `
      <findEmployeeMedicalExpenseRecord xmlns="http://tempuri.org">
        <recId>${headerRecId}</recId>
      </findEmployeeMedicalExpenseRecord>
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
            'http://tempuri.org/DFExpenseReportLinesSvc/findEmployeeMedicalExpenseRecord',
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

    // Check for SOAP fault
    if (parsed?.['s:Envelope']?.['s:Body']?.['s:Fault']) {
      const fault = parsed['s:Envelope']['s:Body']['s:Fault'];
      const faultReason =
        fault.faultstring || fault.Reason?.Text || 'Unknown SOAP fault';
      throw new Error(`SOAP Fault: ${faultReason}`);
    }

    // Extract response data
    const responseBody =
      parsed?.['s:Envelope']?.['s:Body']?.[
        'findEmployeeMedicalExpenseRecordResponse'
      ];

    if (!responseBody) {
      console.log('No findEmployeeMedicalExpenseRecordResponse found');
      return [];
    }

    const result = responseBody.result;

    // 0-row case: result absent or empty object
    if (
      !result ||
      (typeof result === 'object' && Object.keys(result).length === 0)
    ) {
      console.log('Empty result - no medical expense lines found');
      return [];
    }

    // The contract may be namespace-prefixed (a:) or bare depending on the
    // response serialization.
    const contracts =
      result['a:DFExpenseReportLinesContract'] ||
      result['DFExpenseReportLinesContract'];

    if (!contracts) {
      console.log('No DFExpenseReportLinesContract data found');
      return [];
    }

    // Normalize single-element responses to an array
    const contractsArray = Array.isArray(contracts) ? contracts : [contracts];

    // Field access helper — tolerates the a: namespace prefix
    const pick = (obj, name) =>
      obj?.['a:' + name] !== undefined ? obj['a:' + name] : obj?.[name];

    const toStr = value => {
      if (value === undefined || value === null) return '';
      if (typeof value === 'object') {
        return value['#text'] !== undefined ? String(value['#text']) : '';
      }
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

    const toBoolean = value => {
      const str = toStr(value).toLowerCase();
      return str === 'true' || str === '1';
    };

    const toDate = value => {
      const str = toStr(value);
      if (!str) return null;
      const date = new Date(str);
      return isNaN(date.getTime()) ? null : date;
    };

    const lines = contractsArray.map(contract => ({
      RecId: toInt(pick(contract, 'RecId')),
      TrvExpTable: toInt(pick(contract, 'TrvExpTable')),
      SubCategory: toStr(pick(contract, 'SubCategory')),
      Name: toStr(pick(contract, 'Name')),
      Relation: toStr(pick(contract, 'Relation')),
      ReceiptNum: toStr(pick(contract, 'ReceiptNum')),
      TransDate: toDate(pick(contract, 'TransDate')),
      ClaimedAmount: toNumber(pick(contract, 'ClaimedAmount')),
      TransAmount: toNumber(pick(contract, 'TransAmount')),
      AuthAmount: toNumber(pick(contract, 'AuthAmount')),
      IsReceiptAttached: toBoolean(pick(contract, 'IsReceiptAttached')),
    }));

    return lines;
  } catch (err) {
    console.error('GetAllMedicalExpenseLines SOAP Error:', err.message);
    console.error('Error details:', err.response?.data || err.stack);
    throw err;
  }
};

export {GetAllMedicalExpenseLines};
