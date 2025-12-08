/* eslint-disable no-bitwise */
/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {getActiveConfigData} from '../../../Controller/secureConfig';

const UpdateExpenseReport = async ({
  expenseReportFields,
  employeeId,
  legalEntity,
  expenseReportNumber,
}) => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource)
      throw new Error('No configuration found. Please scan QR code first.');

    const token = await getToken();

    // Sort fields to match .NET order: Purpose first, then Location
    const sortedFields = [...expenseReportFields].sort((a, b) => {
      const order = {Purpose: 1, Location: 2};
      return (order[a.FieldName] || 999) - (order[b.FieldName] || 999);
    });

    // Filter out fields with empty values to prevent NullReferenceException
    const validFields = sortedFields.filter(
      f => f.FieldValue && f.FieldValue.trim() !== '',
    );

    // If no valid fields, return error
    if (validFields.length === 0) {
      return {
        IsSuccess: false,
        Message: 'At least one field (Purpose or Location) must have a value',
        AlertType: 'Error',
      };
    }

    // Build expense report fields XML
    const fieldsXml = validFields
      .map(
        f => `<a:ExpenseReportRequestSvc>
<a:__k_parmFieldName>${escapeXml(f.FieldName)}</a:__k_parmFieldName>
<a:__k_parmFieldType>${escapeXml(f.FieldType || 'String')}</a:__k_parmFieldType>
<a:__k_parmFieldValue>${escapeXml(f.FieldValue)}</a:__k_parmFieldValue>
</a:ExpenseReportRequestSvc>
`,
      )
      .join('');

    // CRITICAL FIX: Parameter order MUST match WSDL specification
    // Order: legalEntity, employeeId, expenseReportNumber, expenseReportFields
    const soapEnvelope = `
    <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
      <s:Header>
        <h:CallContext xmlns:h="http://schemas.microsoft.com/dynamics/2013/01/datacontracts" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
          <h:Company>${escapeXml(legalEntity)}</h:Company>
          <h:Language i:nil="true"></h:Language>
          <h:MessageId>${generateGuid()}</h:MessageId>
          <h:PartitionKey i:nil="true"></h:PartitionKey>
        </h:CallContext>
      </s:Header>
      <s:Body>
        <UpdateExpenseReport xmlns="http://tempuri.org">
          <employeeId>${escapeXml(employeeId)}</employeeId>
          <expenseReportFields xmlns:a="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
          ${fieldsXml}</expenseReportFields>
          <expenseReportNumber>${escapeXml(
            expenseReportNumber,
          )}</expenseReportNumber>
          <legalEntity>${escapeXml(legalEntity)}</legalEntity>
        </UpdateExpenseReport>
      </s:Body>
    </s:Envelope>`;

    // console.log('SOAP Request Envelope:', soapEnvelope);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/ExpenseManagmentSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/ExpenseReportsServiceSvc/UpdateExpenseReport',
        },
        responseType: 'text',
        timeout: 30000,
      },
    );

    // console.log('SOAP Response:', xml);

    // Check for SOAP Fault first
    if (xml.includes('s:Fault') || xml.includes('faultstring')) {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
      });
      const errorParsed = parser.parse(xml);
      const fault = errorParsed?.['s:Envelope']?.['s:Body']?.['s:Fault'];

      let errorMessage = 'SOAP Fault occurred';

      if (fault?.faultstring) {
        if (typeof fault.faultstring === 'string') {
          errorMessage = fault.faultstring;
        } else if (fault.faultstring['#text']) {
          errorMessage = fault.faultstring['#text'];
        }
      } else if (fault?.detail?.Fault?.ExceptionMessage) {
        errorMessage = fault.detail.Fault.ExceptionMessage;
      } else if (fault?.detail?.['s:message']) {
        errorMessage = fault.detail['s:message'];
      }

      console.error('SOAP Fault:', fault);

      return {
        IsSuccess: false,
        Message: errorMessage,
        AlertType: 'Error',
      };
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      parseTagValue: true,
      trimValues: true,
      allowBooleanAttributes: true,
      parseAttributeValue: true,
    });

    const parsed = parser.parse(xml);

    // Navigate to the result
    let result =
      parsed?.['s:Envelope']?.['s:Body']?.['UpdateExpenseReportResponse']?.[
        'result'
      ] ||
      parsed?.['s:Envelope']?.['s:Body']?.['UpdateExpenseReportResponse']?.[
        'UpdateExpenseReportResult'
      ];

    // console.log('Raw parsed result:', JSON.stringify(result, null, 2));

    if (!result) {
      throw new Error('No response data received from server');
    }

    // Extract the KeyValuePair array from the nested structure
    const extractKeyValuePairs = resultObj => {
      if (!resultObj) return {};

      const kvpArray =
        resultObj?.['a:fields']?.['b:KeyValueOfanyTypeanyType'] ||
        resultObj?.fields?.['b:KeyValueOfanyTypeanyType'] ||
        resultObj?.fields?.KeyValueOfanyTypeanyType;

      if (!kvpArray || !Array.isArray(kvpArray)) {
        console.log(
          'No KeyValueOfanyTypeanyType array found, trying direct extraction',
        );
        return resultObj;
      }

      const resultObjClean = {};
      kvpArray.forEach(kvp => {
        const key =
          kvp?.['b:Key']?.['#text'] ||
          kvp?.['b:Key'] ||
          kvp?.Key?.['#text'] ||
          kvp?.Key;

        const value =
          kvp?.['b:Value']?.['#text'] !== undefined
            ? kvp['b:Value']['#text']
            : kvp?.['b:Value'] !== undefined
            ? kvp['b:Value']
            : kvp?.Value?.['#text'] !== undefined
            ? kvp.Value['#text']
            : kvp?.Value;

        if (key) {
          resultObjClean[key] = value;
        }
      });

      return resultObjClean;
    };

    const cleanedResult = extractKeyValuePairs(result);

    // console.log('Converted Result:', JSON.stringify(cleanedResult, null, 2));

    // Check if we have valid data
    const hasValidData =
      cleanedResult.ExpenseReportNumber ||
      cleanedResult.RecId ||
      cleanedResult.DocumentStatus;

    if (hasValidData) {
      return {
        IsSuccess: true,
        Message: 'Records Updated Successfully',
        AlertType: 'Success',
        RecId: String(cleanedResult.RecId || ''),
        ExpenseReportNumber: String(
          cleanedResult.ExpenseReportNumber || expenseReportNumber,
        ),
        EmployeePersonnelNumber: String(
          cleanedResult.EmployeePersonnelNumber || employeeId,
        ),
        DocumentStatus: cleanedResult.DocumentStatus || 'Draft',
        Location: cleanedResult.Location || '',
        Purpose: cleanedResult.Purpose || '',
        Company: cleanedResult.Company || cleanedResult.DataArea || legalEntity,
        ...cleanedResult,
      };
    } else {
      console.log(
        'No valid data found in response. Available keys:',
        Object.keys(cleanedResult),
      );
      return {
        IsSuccess: false,
        Message: 'Error Updating Record - No valid data returned',
        AlertType: 'Error',
        DebugInfo: {
          availableKeys: Object.keys(cleanedResult),
          sampleValues: {
            ExpenseReportNumber: cleanedResult.ExpenseReportNumber,
            RecId: cleanedResult.RecId,
            DocumentStatus: cleanedResult.DocumentStatus,
          },
        },
      };
    }
  } catch (err) {
    console.error(
      'Failed to update expense report:',
      err?.response?.data || err.message,
    );
    console.error('Error details:', {
      status: err?.response?.status,
      statusText: err?.response?.statusText,
      headers: err?.response?.headers,
      data: err?.response?.data,
    });

    let errorMessage = 'Error Updating Record';

    if (err?.response?.data) {
      // console.log('Raw error response:', err.response.data);

      try {
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: '',
        });
        const errorParsed = parser.parse(err.response.data);

        // console.log('Parsed error:', JSON.stringify(errorParsed, null, 2));

        const fault = errorParsed?.['s:Envelope']?.['s:Body']?.['s:Fault'];
        if (fault) {
          if (fault?.faultstring) {
            if (typeof fault.faultstring === 'string') {
              errorMessage = fault.faultstring;
            } else if (fault.faultstring['#text']) {
              errorMessage = fault.faultstring['#text'];
            }
          } else if (fault?.detail?.Fault?.ExceptionMessage) {
            errorMessage = fault.detail.Fault.ExceptionMessage;
          } else if (fault?.detail?.['s:message']) {
            errorMessage = fault.detail['s:message'];
          }

          // console.log('SOAP Fault Details:', JSON.stringify(fault, null, 2));
        }
      } catch (parseErr) {
        console.error('Error parsing SOAP fault:', parseErr);
        errorMessage = 'Internal Server Error - Unable to process request';
      }
    }

    return {
      IsSuccess: false,
      Message: errorMessage,
      AlertType: 'Error',
    };
  }
};

// Generate GUID for MessageId
const generateGuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// XML escape to prevent breaking
const escapeXml = value =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export {UpdateExpenseReport};
