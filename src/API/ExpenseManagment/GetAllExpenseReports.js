/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const GetAllExpenseReports = async ({employeeId, legalEntity}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
        <GetAllExpenseReports xmlns="http://tempuri.org">
            <employeeid>${employeeId}</employeeid>
            <legalEntity>${legalEntity}</legalEntity>
        </GetAllExpenseReports>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const response = await axios.post(
      `${config.resource}soap/services/ExpenseManagmentSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/ExpenseReportsServiceSvc/GetAllExpenseReports',
        },
        responseType: 'text',
        timeout: 30000,
      },
    );

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '@_',
      parseTagValue: false,
      trimValues: true,
      allowBooleanAttributes: false,
      parseAttributeValue: false,
      preserveOrder: false,
      alwaysCreateTextNode: true,
    });

    const parsed = parser.parse(response.data);

    // Extract the expense reports array from the response
    const expenseReportsArray =
      parsed?.['s:Envelope']?.['s:Body']?.['GetAllExpenseReportsResponse']?.[
        'result'
      ]?.['a:ExpenseReportResponse'];

    if (!expenseReportsArray) {
      console.log('No expense reports data found in response');
      return [];
    }

    // Process each expense report to convert key-value pairs to a clean object
    const processExpenseReport = report => {
      const fields = report?.['a:fields']?.['b:KeyValueOfanyTypeanyType'];

      if (!fields || !Array.isArray(fields)) {
        return null;
      }

      // Convert the array of key-value pairs to a clean object
      const cleanReport = {};

      fields.forEach(field => {
        const key = field?.['b:Key'];
        let value = field?.['b:Value'];

        // Handle different value structures
        if (value && typeof value === 'object') {
          // If value is an object with text property, use that
          if (value['#text'] !== undefined) {
            value = value['#text'];
          } else {
            // Otherwise, stringify the object
            value = JSON.stringify(value);
          }
        }

        if (key) {
          // Extract the actual key text
          let cleanKey = key;
          if (typeof key === 'object' && key['#text'] !== undefined) {
            cleanKey = key['#text'];
          }

          // Clean the key name by removing any namespace prefixes and special characters
          cleanKey = cleanKey.replace(/[^a-zA-Z0-9]/g, '');

          // PRESERVE ALL VALUES AS STRINGS - NO CONVERSION AT ALL
          if (value !== undefined && value !== null) {
            // Keep as raw string - no toString() conversion
            cleanReport[cleanKey] = String(value);
          } else {
            cleanReport[cleanKey] = null;
          }
        }
      });

      return cleanReport;
    };

    // Process all expense reports
    let processedReports = [];

    if (Array.isArray(expenseReportsArray)) {
      processedReports = expenseReportsArray
        .map(processExpenseReport)
        .filter(report => report !== null);
    } else {
      const singleReport = processExpenseReport(expenseReportsArray);
      if (singleReport) {
        processedReports = [singleReport];
      }
    }

    return processedReports;
  } catch (err) {
    console.error(
      'Get All Expense Reports data SOAP error:',
      err.response?.data || err.message,
      err.stack,
    );
    throw err;
  }
};

export {GetAllExpenseReports};
