/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {getActiveConfigData} from '../../../Controller/secureConfig';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';

const UpdateExpenseLine = async ({
  expenseLineFields,
  employeeId,
  legalEntity,
  expenseTransactionNumber,
}) => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource)
      throw new Error('No configuration found. Please scan QR code first.');

    const token = await getToken();

    if (!expenseTransactionNumber) {
      throw new Error(
        'expenseTransactionNumber is required for updating expense line',
      );
    }

    const fieldNameMapping = {
      TransactionDate: 'TransDate',
      ExpenseCategory: 'CostType',
      TransactionAmount: 'AmountCurr',
      Currency: 'ExchangeCode',
      ExpenseReportNumber: 'ExpenseReportNumber',
      MerchantId: 'MerchantId',
    };

    // Transform and sort fields alphabetically by FieldName
    const transformedFields = expenseLineFields.map(f => ({
      FieldName: fieldNameMapping[f.FieldName] || f.FieldName,
      FieldType: f.FieldType || 'String',
      FieldValue: f.FieldValue,
    }));

    // Sort fields alphabetically by FieldName
    const sortedFields = [...transformedFields].sort((a, b) =>
      a.FieldName.localeCompare(b.FieldName),
    );

    // console.log('Sorted fields for update:', sortedFields);

    // Fix date format - should be YYYY-MM-DD, not MM/DD/YY
    const fixedFields = sortedFields.map(f => {
      if (f.FieldName === 'TransDate' && f.FieldValue) {
        // Convert from "11/25/25" to "2025-11-25"
        const dateParts = f.FieldValue.split('/');
        if (dateParts.length === 3) {
          let year = dateParts[2];
          // Handle 2-digit year
          if (year.length === 2) {
            year = '20' + year;
          }
          const month = dateParts[0].padStart(2, '0');
          const day = dateParts[1].padStart(2, '0');
          f.FieldValue = `${year}-${month}-${day}`;
        }
      }
      return f;
    });

    const fieldsXml = fixedFields
      .map(
        f => `<a:ExpenseLineRequest>
        <a:__k_parmFieldName>${escapeXml(f.FieldName)}</a:__k_parmFieldName>
        <a:__k_parmFieldType>${escapeXml(f.FieldType)}</a:__k_parmFieldType>
        <a:__k_parmFieldValue>${escapeXml(f.FieldValue)}</a:__k_parmFieldValue>
        </a:ExpenseLineRequest>`,
      )
      .join('');

    const soapBody = `
    <UpdateExpenseLine xmlns="http://tempuri.org">
      <employeeId>${escapeXml(employeeId)}</employeeId>
      <expenseLineFields xmlns:a="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">
        ${fieldsXml}
      </expenseLineFields>
      <expenseTransactionNumber>${escapeXml(
        expenseTransactionNumber,
      )}</expenseTransactionNumber>
      <legalEntity>${escapeXml(legalEntity)}</legalEntity>
    </UpdateExpenseLine>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    // console.log('UpdateExpenseLine SOAP Request:', {soapEnvelope});

    const response = await axios.post(
      `${config.resource}soap/services/ExpenseManagmentSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/ExpenseLinesServiceSvc/UpdateExpenseLine',
        },
        responseType: 'text',
        timeout: 30000,
        validateStatus: function (status) {
          return true;
        },
      },
    );

    const xml = response.data;
    // console.log('Response Status:', response.status);
    // console.log('SOAP Response:', xml);

    // Check for completely empty response
    if (!xml || xml.trim() === '') {
      console.error('Empty response with status:', response.status);
      return {
        IsSuccess: false,
        Message: `Empty response with status ${response.status}. Check server logs.`,
        AlertType: 'Error',
      };
    }

    // Check for SOAP Fault
    if (xml.includes('s:Fault') || xml.includes('faultstring')) {
      return parseSoapFault(xml);
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      parseTagValue: true,
      trimValues: true,
    });

    const parsed = parser.parse(xml);

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['UpdateExpenseLineResponse']
        ?.result ||
      parsed?.['s:Envelope']?.['s:Body']?.['UpdateExpenseLineResponse']
        ?.UpdateExpenseLineResult;

    if (!result) {
      console.error('No result found in response');
      console.error(
        'Available paths:',
        Object.keys(parsed?.['s:Envelope']?.['s:Body'] || {}),
      );
      throw new Error('No response data received from server');
    }

    const cleaned = extractKeyValuePairs(result);

    // console.log('Parsed result:', cleaned);

    if (cleaned.ExpenseLineNumber || cleaned.RecId || cleaned.LineNumber) {
      return {
        IsSuccess: true,
        Message: 'Expense Line Updated Successfully',
        AlertType: 'Success',
        RecId: String(cleaned.RecId || ''),
        ExpenseLineNumber: String(cleaned.ExpenseLineNumber || ''),
        LineNumber: String(cleaned.LineNumber || ''),
        ExpenseReportNumber: String(cleaned.ExpenseReportNumber || ''),
        ...cleaned,
      };
    }

    return {
      IsSuccess: false,
      Message: 'Error Updating Expense Line - No valid data returned',
      AlertType: 'Error',
      DebugInfo: cleaned,
    };
  } catch (err) {
    console.error(
      'Failed to update expense line:',
      err?.response?.data || err.message,
    );

    // Enhanced error logging
    if (err?.response) {
      console.error('Response Status:', err.response.status);
      console.error('Response Headers:', err.response.headers);
      console.error('Response Data:', err.response.data);
    }

    let errorMessage = 'Error Updating Expense Line';

    if (err?.response?.data) {
      try {
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: '',
        });
        const errorParsed = parser.parse(err.response.data);
        const fault = errorParsed?.['s:Envelope']?.['s:Body']?.['s:Fault'];

        if (fault) {
          if (typeof fault.faultstring === 'string') {
            errorMessage = fault.faultstring;
          } else if (fault.faultstring?.['#text']) {
            errorMessage = fault.faultstring['#text'];
          } else if (fault.detail?.Fault?.ExceptionMessage) {
            errorMessage = fault.detail.Fault.ExceptionMessage;
          }
        }
      } catch (parseErr) {
        console.error('Error parsing SOAP fault:', parseErr);
      }
    } else if (err.message) {
      errorMessage = err.message;
    }

    return {
      IsSuccess: false,
      Message: errorMessage,
      AlertType: 'Error',
    };
  }
};

// Extract KVPs from AX service
const extractKeyValuePairs = obj => {
  const kvpArray =
    obj?.['a:fields']?.['b:KeyValueOfanyTypeanyType'] ||
    obj?.fields?.['b:KeyValueOfanyTypeanyType'] ||
    obj?.fields?.KeyValueOfanyTypeanyType;

  if (!Array.isArray(kvpArray)) {
    console.log(
      'No KeyValueOfanyTypeanyType array found, trying direct extraction',
    );
    return obj;
  }

  const result = {};
  kvpArray.forEach(kvp => {
    const key = kvp?.['b:Key']?.['#text'] || kvp?.['b:Key'];
    const value = kvp?.['b:Value']?.['#text'] || kvp?.['b:Value'];
    if (key) result[key] = value;
  });
  return result;
};

// SOAP Fault Parser
const parseSoapFault = xml => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
  });
  const parsed = parser.parse(xml);

  const fault = parsed?.['s:Envelope']?.['s:Body']?.['s:Fault'];
  let errorMessage = 'SOAP Fault Occurred';

  if (fault?.faultstring) {
    if (typeof fault.faultstring === 'string') {
      errorMessage = fault.faultstring;
    } else if (fault.faultstring?.['#text']) {
      errorMessage = fault.faultstring['#text'];
    }
  } else if (fault?.detail?.Fault?.ExceptionMessage) {
    errorMessage = fault.detail.Fault.ExceptionMessage;
  } else if (fault?.detail?.['s:message']) {
    errorMessage = fault.detail['s:message'];
  }

  console.error('SOAP Fault Details:', JSON.stringify(fault, null, 2));

  return {
    IsSuccess: false,
    Message: errorMessage,
    AlertType: 'Error',
    FaultDetails: fault,
  };
};

const escapeXml = value =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export {UpdateExpenseLine};
