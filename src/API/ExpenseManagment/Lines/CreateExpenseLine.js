// /* eslint-disable no-bitwise */
// /* eslint-disable curly */
// /* eslint-disable dot-notation */
// import axios from 'axios';
// import {XMLParser} from 'fast-xml-parser';
// import {getToken} from '../../Token/getToken';
// import {getActiveConfigData} from '../../../Controller/secureConfig';

// const CreateExpenseLine = async ({
//   expenseLineFields,
//   employeeId,
//   legalEntity,
// }) => {
//   try {
//     const config = await getActiveConfigData();
//     if (!config?.resource)
//       throw new Error('No configuration found. Please scan QR code first.');

//     const token = await getToken();

//     // CRITICAL FIX: Use the exact field names from the .NET code
//     const fieldNameMapping = {
//       TransactionDate: 'TransDate',
//       ExpenseCategory: 'CostType',
//       TransactionAmount: 'AmountCurr',
//       Currency: 'ExchangeCode',
//       ExpenseReportNumber: 'ExpenseReportNumber',
//       MerchantId: 'MerchantId',
//       // Add other mappings as needed
//     };

//     // Transform fields to use correct API field names
//     const transformedFields = expenseLineFields.map(f => {
//       const mappedFieldName = fieldNameMapping[f.FieldName] || f.FieldName;
//       return {
//         FieldName: mappedFieldName,
//         FieldType: f.FieldType || 'String',
//         FieldValue: f.FieldValue,
//       };
//     });

//     // Sort fields to maintain consistent order
//     const sortedFields = [...transformedFields].sort((a, b) => {
//       return a.FieldName.localeCompare(b.FieldName);
//     });

//     console.log('Transformed fields for SOAP request:', sortedFields);

//     // Build expense line fields XML - matching the same pattern as CreateExpenseReport
//     const fieldsXml = sortedFields
//       .map(
//         f => `<a:ExpenseLineRequest>
// <a:__k_parmFieldName>${escapeXml(f.FieldName)}</a:__k_parmFieldName>
// <a:__k_parmFieldType>${escapeXml(f.FieldType)}</a:__k_parmFieldType>
// <a:__k_parmFieldValue>${escapeXml(f.FieldValue)}</a:__k_parmFieldValue>
// </a:ExpenseLineRequest>
// `,
//       )
//       .join('');

//     // Build SOAP Envelope matching the same structure as CreateExpenseReport
//     const soapEnvelope = `
//     <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
//       <s:Header>
//         <h:CallContext xmlns:h="http://schemas.microsoft.com/dynamics/2013/01/datacontracts" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
//           <h:Company>${escapeXml(legalEntity)}</h:Company>
//           <h:Language i:nil="true"></h:Language>
//           <h:MessageId>${generateGuid()}</h:MessageId>
//           <h:PartitionKey i:nil="true"></h:PartitionKey>
//         </h:CallContext>
//       </s:Header>
//       <s:Body>
//         <CreateExpenseLine xmlns="http://tempuri.org">
//         <employeeId>${escapeXml(employeeId)}</employeeId>
//         <expenseLineFields xmlns:a="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
//         ${fieldsXml}</expenseLineFields>
//         <legalEntity>${escapeXml(legalEntity)}</legalEntity>
//         </CreateExpenseLine>
//       </s:Body>
//     </s:Envelope>`;

//     console.log('SOAP Request Envelope:', soapEnvelope);

//     // Use the same service group name as CreateExpenseReport
//     const {data: xml} = await axios.post(
//       `${config.resource}soap/services/ExpenseManagmentSvcGroup`,
//       soapEnvelope,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'text/xml;charset=utf-8',
//           SOAPAction:
//             'http://tempuri.org/ExpenseLinesServiceSvc/CreateExpenseLine',
//         },
//         responseType: 'text',
//         timeout: 30000,
//       },
//     );

//     console.log('SOAP Response:', xml);

//     // Check for SOAP Fault first
//     if (xml.includes('s:Fault') || xml.includes('faultstring')) {
//       const parser = new XMLParser({
//         ignoreAttributes: false,
//         attributeNamePrefix: '',
//       });
//       const errorParsed = parser.parse(xml);
//       const fault = errorParsed?.['s:Envelope']?.['s:Body']?.['s:Fault'];

//       let errorMessage = 'SOAP Fault occurred';

//       // FIXED: Properly extract the error message from the fault object
//       if (fault?.faultstring) {
//         if (typeof fault.faultstring === 'string') {
//           errorMessage = fault.faultstring;
//         } else if (fault.faultstring['#text']) {
//           errorMessage = fault.faultstring['#text'];
//         } else {
//           errorMessage = JSON.stringify(fault.faultstring);
//         }
//       } else if (fault?.detail?.Fault?.ExceptionMessage) {
//         errorMessage = fault.detail.Fault.ExceptionMessage;
//       }

//       console.error('SOAP Fault:', fault);

//       return {
//         IsSuccess: false,
//         Message: errorMessage, // Now it's a string, not an object
//         AlertType: 'Error',
//       };
//     }

//     const parser = new XMLParser({
//       ignoreAttributes: false,
//       attributeNamePrefix: '',
//       parseTagValue: true,
//       trimValues: true,
//       allowBooleanAttributes: true,
//       parseAttributeValue: true,
//     });

//     const parsed = parser.parse(xml);

//     // Navigate to the result - handle different possible response structures
//     let result =
//       parsed?.['s:Envelope']?.['s:Body']?.['CreateExpenseLineResponse']?.[
//         'result'
//       ] ||
//       parsed?.['s:Envelope']?.['s:Body']?.['CreateExpenseLineResponse']?.[
//         'CreateExpenseLineResult'
//       ];

//     console.log('Raw parsed result:', JSON.stringify(result, null, 2));

//     if (!result) {
//       throw new Error('No response data received from server');
//     }

//     // The response has a complex nested structure with namespaces
//     // Extract the KeyValuePair array from the nested structure
//     const extractKeyValuePairs = resultObj => {
//       if (!resultObj) return {};

//       // Handle the nested structure: result -> a:fields -> b:KeyValueOfanyTypeanyType[]
//       const kvpArray =
//         resultObj?.['a:fields']?.['b:KeyValueOfanyTypeanyType'] ||
//         resultObj?.fields?.['b:KeyValueOfanyTypeanyType'] ||
//         resultObj?.fields?.KeyValueOfanyTypeanyType;

//       if (!kvpArray || !Array.isArray(kvpArray)) {
//         console.log(
//           'No KeyValueOfanyTypeanyType array found, trying direct extraction',
//         );
//         return resultObj;
//       }

//       const resultObjClean = {};
//       kvpArray.forEach(kvp => {
//         const key =
//           kvp?.['b:Key']?.['#text'] ||
//           kvp?.['b:Key'] ||
//           kvp?.Key?.['#text'] ||
//           kvp?.Key;

//         const value =
//           kvp?.['b:Value']?.['#text'] !== undefined
//             ? kvp['b:Value']['#text']
//             : kvp?.['b:Value'] !== undefined
//             ? kvp['b:Value']
//             : kvp?.Value?.['#text'] !== undefined
//             ? kvp.Value['#text']
//             : kvp?.Value;

//         if (key) {
//           resultObjClean[key] = value;
//         }
//       });

//       return resultObjClean;
//     };

//     const cleanedResult = extractKeyValuePairs(result);

//     console.log('Converted Result:', JSON.stringify(cleanedResult, null, 2));

//     // Check if we have valid data - look for expense line specific fields
//     const hasValidData =
//       cleanedResult.ExpenseLineNumber ||
//       cleanedResult.RecId ||
//       cleanedResult.LineNumber;

//     if (hasValidData) {
//       return {
//         IsSuccess: true,
//         Message: 'Expense Line Created Successfully',
//         AlertType: 'Success',
//         RecId: String(cleanedResult.RecId || ''),
//         ExpenseLineNumber: String(cleanedResult.ExpenseLineNumber || ''),
//         LineNumber: String(cleanedResult.LineNumber || ''),
//         EmployeePersonnelNumber: String(
//           cleanedResult.EmployeePersonnelNumber || employeeId,
//         ),
//         ExpenseReportNumber: String(cleanedResult.ExpenseReportNumber || ''),
//         TransactionDate:
//           cleanedResult.TransactionDate || cleanedResult.TransDate || '',
//         Amount: cleanedResult.Amount || cleanedResult.AmountCurr || '',
//         Currency: cleanedResult.Currency || cleanedResult.ExchangeCode || '',
//         Category: cleanedResult.Category || cleanedResult.CostType || '',
//         Merchant: cleanedResult.Merchant || cleanedResult.MerchantId || '',
//         Description: cleanedResult.Description || '',
//         Company: cleanedResult.Company || cleanedResult.DataArea || legalEntity,
//         // Include all other fields for debugging
//         ...cleanedResult,
//       };
//     } else {
//       console.log(
//         'No valid data found in response. Available keys:',
//         Object.keys(cleanedResult),
//       );
//       return {
//         IsSuccess: false,
//         Message: 'Error Creating Expense Line - No valid data returned',
//         AlertType: 'Error',
//         DebugInfo: {
//           availableKeys: Object.keys(cleanedResult),
//           sampleValues: {
//             ExpenseLineNumber: cleanedResult.ExpenseLineNumber,
//             RecId: cleanedResult.RecId,
//             LineNumber: cleanedResult.LineNumber,
//           },
//         },
//       };
//     }
//   } catch (err) {
//     console.error(
//       'Failed to create expense line:',
//       err?.response?.data || err.message,
//     );
//     console.error('Error details:', {
//       status: err?.response?.status,
//       statusText: err?.response?.statusText,
//       headers: err?.response?.headers,
//       data: err?.response?.data,
//     });

//     let errorMessage = 'Error Creating Expense Line';

//     if (err?.response?.data) {
//       console.log('Raw error response:', err.response.data);

//       try {
//         const parser = new XMLParser({
//           ignoreAttributes: false,
//           attributeNamePrefix: '',
//         });
//         const errorParsed = parser.parse(err.response.data);

//         console.log('Parsed error:', JSON.stringify(errorParsed, null, 2));

//         const fault = errorParsed?.['s:Envelope']?.['s:Body']?.['s:Fault'];
//         if (fault) {
//           // FIXED: Properly extract error message string
//           if (typeof fault.faultstring === 'string') {
//             errorMessage = fault.faultstring;
//           } else if (fault.faultstring?.['#text']) {
//             errorMessage = fault.faultstring['#text'];
//           } else if (fault.detail?.Fault?.ExceptionMessage) {
//             errorMessage = fault.detail.Fault.ExceptionMessage;
//           }
//         }
//       } catch (parseErr) {
//         console.error('Error parsing SOAP fault:', parseErr);
//       }
//     } else if (err.message) {
//       errorMessage = err.message;
//     }

//     return {
//       IsSuccess: false,
//       Message: errorMessage,
//       AlertType: 'Error',
//     };
//   }
// };

// // Generate GUID for MessageId
// const generateGuid = () => {
//   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
//     const r = (Math.random() * 16) | 0;
//     const v = c === 'x' ? r : (r & 0x3) | 0x8;
//     return v.toString(16);
//   });
// };

// // XML escape to prevent breaking
// const escapeXml = value =>
//   String(value || '')
//     .replace(/&/g, '&amp;')
//     .replace(/</g, '&lt;')
//     .replace(/>/g, '&gt;')
//     .replace(/"/g, '&quot;')
//     .replace(/'/g, '&apos;');

// export {CreateExpenseLine};

/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {getActiveConfigData} from '../../../Controller/secureConfig';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';

const CreateExpenseLine = async ({
  expenseLineFields,
  employeeId,
  legalEntity,
}) => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource)
      throw new Error('No configuration found. Please scan QR code first.');

    const token = await getToken();

    const fieldNameMapping = {
      TransactionDate: 'TransDate',
      ExpenseCategory: 'CostType',
      TransactionAmount: 'AmountCurr',
      Currency: 'ExchangeCode',
      ExpenseReportNumber: 'ExpenseReportNumber',
      MerchantId: 'MerchantId',
    };

    const sortedFields = expenseLineFields
      .map(f => ({
        FieldName: fieldNameMapping[f.FieldName] || f.FieldName,
        FieldType: f.FieldType || 'String',
        FieldValue: f.FieldValue,
      }))
      .sort((a, b) => a.FieldName.localeCompare(b.FieldName));

    const fieldsXml = sortedFields
      .map(
        f => `
      <a:ExpenseLineRequest>
        <a:__k_parmFieldName>${escapeXml(f.FieldName)}</a:__k_parmFieldName>
        <a:__k_parmFieldType>${escapeXml(f.FieldType)}</a:__k_parmFieldType>
        <a:__k_parmFieldValue>${escapeXml(f.FieldValue)}</a:__k_parmFieldValue>
      </a:ExpenseLineRequest>`,
      )
      .join('');

    const soapBody = `
    <CreateExpenseLine xmlns="http://tempuri.org">
      <employeeId>${escapeXml(employeeId)}</employeeId>
      <expenseLineFields xmlns:a="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">
        ${fieldsXml}
      </expenseLineFields>
      <legalEntity>${escapeXml(legalEntity)}</legalEntity>
    </CreateExpenseLine>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    // console.log({soapEnvelope});

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/ExpenseManagmentSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/ExpenseLinesServiceSvc/CreateExpenseLine',
        },
        responseType: 'text',
        timeout: 30000,
      },
    );

    if (xml.includes('s:Fault')) {
      return parseSoapFault(xml);
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
    });
    const parsed = parser.parse(xml);

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['CreateExpenseLineResponse']
        ?.result ||
      parsed?.['s:Envelope']?.['s:Body']?.['CreateExpenseLineResponse']
        ?.CreateExpenseLineResult;

    if (!result) throw new Error('No response data received from server');

    const cleaned = extractKeyValuePairs(result);

    if (cleaned.ExpenseLineNumber || cleaned.RecId || cleaned.LineNumber) {
      return {
        IsSuccess: true,
        Message: 'Expense Line Created Successfully',
        AlertType: 'Success',
        ...cleaned,
      };
    }

    return {
      IsSuccess: false,
      Message: 'Error Creating Expense Line - No valid data returned',
      AlertType: 'Error',
      DebugInfo: cleaned,
    };
  } catch (err) {
    return {
      IsSuccess: false,
      Message: err?.message || 'Error Creating Expense Line',
      AlertType: 'Error',
    };
  }
};

// Extract KVPs from AX service
const extractKeyValuePairs = obj => {
  const kvpArray =
    obj?.['a:fields']?.['b:KeyValueOfanyTypeanyType'] ||
    obj?.fields?.['b:KeyValueOfanyTypeanyType'];

  if (!Array.isArray(kvpArray)) return obj;

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
  const message =
    fault?.faultstring?.['#text'] ||
    fault?.faultstring ||
    fault?.detail?.Fault?.ExceptionMessage ||
    'SOAP Fault Occurred';

  return {
    IsSuccess: false,
    Message: message,
    AlertType: 'Error',
  };
};

const escapeXml = value =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export {CreateExpenseLine};
