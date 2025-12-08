/* eslint-disable radix */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {getActiveConfigData} from '../../../Controller/secureConfig';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';

const SubmitExpenseReportsToWorkflow = async ({
  expenseReportNumberList,
  legalEntity,
}) => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    if (!expenseReportNumberList || !legalEntity) {
      throw new Error(
        'Missing required parameters: expenseReportNumberList and legalEntity',
      );
    }

    const token = await getToken();

    // Ensure array format
    const reportNumbers = Array.isArray(expenseReportNumberList)
      ? expenseReportNumberList
      : [expenseReportNumberList];

    // Build expense report numbers XML with proper indentation
    const expenseReportNumbersXml = reportNumbers
      .map(n => `        <a:string>${escapeXml(n)}</a:string>`)
      .join('\n');

    const soapBody = `<SubmitExpenseReportsToWorkflow xmlns="http://tempuri.org">
          <expenseReportNumberList xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
            ${expenseReportNumbersXml}
          </expenseReportNumberList>
          <legalEntity>${escapeXml(legalEntity)}</legalEntity>
        </SubmitExpenseReportsToWorkflow>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    // console.log('SOAP Submit Request:', soapEnvelope);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/ExpenseManagmentSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/ExpenseReportsServiceSvc/SubmitExpenseReportsToWorkflow',
        },
        responseType: 'text',
        timeout: 30000,
      },
    );

    // console.log('SOAP Submit Response:', xml);

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

      // Check for Infolog entries with additional error details
      const infolog = errorParsed?.['s:Envelope']?.['s:Header']?.['Infolog'];
      if (infolog?.Entries?.InfologEntry) {
        const entries = infolog.Entries.InfologEntry;
        const messages = Array.isArray(entries)
          ? entries.map(e => e.Message).join('; ')
          : entries.Message;

        if (messages) {
          errorMessage = `${errorMessage} - ${messages}`;
        }
      }

      console.error('SOAP Fault:', fault);

      return {
        success: false,
        message: errorMessage,
        submittedReports: reportNumbers,
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

    // console.log('Parsed Submit Response:', JSON.stringify(parsed, null, 2));

    // Extract submit response
    const submitResponse =
      parsed?.['s:Envelope']?.['s:Body']?.[
        'SubmitExpenseReportsToWorkflowResponse'
      ];

    const result = submitResponse?.result;

    if (!result) {
      return {
        success: false,
        message: 'Unexpected response from server',
        submittedReports: reportNumbers,
      };
    }

    // Extract GeneralContract - handle both array and single object
    let contracts = result['a:GeneralContract'];
    if (!contracts) {
      return {
        success: false,
        message: 'Invalid response format',
        submittedReports: reportNumbers,
      };
    }

    // Ensure array format
    if (!Array.isArray(contracts)) {
      contracts = [contracts];
    }

    // Process contracts and extract data
    const processed = contracts.map(c => ({
      IsSuccess: c['a:IsSuccess'] === true || c['a:IsSuccess'] === 'true',
      Message: c['a:Message'] || '',
      RecId: parseInt(c['a:RecId']) || 0,
    }));

    // console.log('Processed Contracts:', JSON.stringify(processed, null, 2));

    // Find summary (RecId = 0) and detail records
    const summary = processed.find(c => c.RecId === 0);
    const details = processed.filter(c => c.RecId !== 0);

    if (!summary) {
      return {
        success: false,
        message: 'No summary result returned',
        submittedReports: reportNumbers,
      };
    }

    // Handle "0 records submitted" scenario
    if (summary.Message?.includes('0 Record(s) submitted')) {
      const detailMessages = details
        .map(d => d.Message)
        .filter(Boolean)
        .join('; ');
      return {
        success: false,
        message:
          detailMessages ||
          `No expense reports were processed. The report ${reportNumbers[0]} may not exist or cannot be submitted.`,
        submittedReports: reportNumbers,
        summary,
        individualResults: details,
      };
    }

    return {
      success: Boolean(summary.IsSuccess),
      message:
        summary.Message ||
        (summary.IsSuccess
          ? 'Expense reports submitted successfully'
          : 'Submission failed'),
      submittedReports: reportNumbers,
      summary,
      individualResults: details,
    };
  } catch (error) {
    console.error('SOAP Submit Error:', error);
    console.error('Error details:', {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
    });

    let errorMessage = 'Failed to submit expense reports';

    if (error?.response?.data) {
      try {
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: '',
        });
        const errorParsed = parser.parse(error.response.data);
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
          }
        }
      } catch (parseErr) {
        console.error('Error parsing SOAP fault:', parseErr);
      }
    }

    return {
      success: false,
      message: errorMessage,
      submittedReports: Array.isArray(expenseReportNumberList)
        ? expenseReportNumberList
        : [expenseReportNumberList],
    };
  }
};

// XML escape to prevent breaking
const escapeXml = value =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export default SubmitExpenseReportsToWorkflow;
