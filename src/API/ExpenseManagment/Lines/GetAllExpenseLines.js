/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../Controller/secureConfig';

const GetAllExpenseLines = async ({
  employeeId,
  expenseReportNumber,
  legalEntity,
}) => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // CORRECTED SOAP Body - match the exact parameter names from JSON schema
    const soapBody = `
      <GetAllExpenseLines xmlns="http://tempuri.org">
        <employeeId>${employeeId}</employeeId>
        <expenseReportNumber>${expenseReportNumber}</expenseReportNumber>
        <legalEntity>${legalEntity}</legalEntity>
      </GetAllExpenseLines>
    `;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const response = await axios.post(
      `${config.resource}soap/services/ExpenseManagmentSvcGroup/ExpenseLinesServiceSvc`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/ExpenseLinesServiceSvc/GetAllExpenseLines',
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
      parsed?.['s:Envelope']?.['s:Body']?.['GetAllExpenseLinesResponse'];

    if (!responseBody) {
      console.log('No GetAllExpenseLinesResponse found');
      return [];
    }

    const result = responseBody.result;

    // Check if result is completely empty (as in your case)
    if (
      !result ||
      (typeof result === 'object' && Object.keys(result).length === 0)
    ) {
      console.log('Empty result - no expense lines found');
      return [];
    }

    // Try to extract expense lines with different possible structures
    let expenseLines =
      result['a:ExpenseLineResponse'] ||
      result['ExpenseLineResponse'] ||
      result;

    if (!expenseLines) {
      console.log('No expense lines data found');
      return [];
    }

    // Convert to array if single object
    const expenseLinesArray = Array.isArray(expenseLines)
      ? expenseLines
      : [expenseLines];

    const processLine = line => {
      if (!line) return null;

      // Try different field structures
      const kvPairs =
        line?.['a:fields']?.['b:KeyValueOfanyTypeanyType'] ||
        line?.['fields']?.['KeyValueOfanyTypeanyType'] ||
        line?.['a:KeyValueOfanyTypeanyType'] ||
        line?.['KeyValueOfanyTypeanyType'];

      const obj = {};

      // If we have key-value pairs, process them
      if (kvPairs) {
        const pairsArray = Array.isArray(kvPairs) ? kvPairs : [kvPairs];

        pairsArray.forEach(p => {
          if (!p) return;

          const rawKey = p?.['b:Key'] || p?.['Key'];
          const rawVal = p?.['b:Value'] || p?.['Value'];

          if (!rawKey) return;

          let key =
            typeof rawKey === 'object'
              ? rawKey['#text'] || rawKey['_text'] || rawKey
              : rawKey;

          // Clean the key but be less aggressive
          key = key?.replace(/[^a-zA-Z0-9_]/g, '');

          if (!key) return;

          let val = rawVal;
          if (val && typeof val === 'object') {
            val =
              val['#text'] ||
              val['_text'] ||
              val['c:value'] ||
              JSON.stringify(val);
          }

          obj[key] = val != null ? String(val) : null;
        });
      }

      // Also try direct properties from the line object
      Object.keys(line).forEach(key => {
        if (key.startsWith('@_') || key === 'a:fields' || key === 'fields')
          return;

        let cleanKey = key.replace(/^[a-z]:/, ''); // Remove namespace prefixes
        if (!obj[cleanKey] && line[key] !== undefined) {
          obj[cleanKey] = String(line[key]);
        }
      });

      return Object.keys(obj).length > 0 ? obj : null;
    };

    const cleanList = expenseLinesArray.map(processLine).filter(Boolean);

    return cleanList;
  } catch (err) {
    console.error('GetAllExpenseLines SOAP Error:', err.message);
    console.error('Error details:', err.response?.data || err.stack);
    throw err;
  }
};

export {GetAllExpenseLines};
