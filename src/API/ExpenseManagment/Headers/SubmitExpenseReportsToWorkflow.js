/* eslint-disable curly */
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

    const expenseReportNumbersXml = reportNumbers
      .map(n => `<a:string>${n}</a:string>`)
      .join('');

    const soapBody = `
      <SubmitExpenseReportsToWorkflow xmlns="http://tempuri.org">
        <expenseReportNumberList xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
          ${expenseReportNumbersXml}
        </expenseReportNumberList>
        <legalEntity>${legalEntity}</legalEntity>
      </SubmitExpenseReportsToWorkflow>
    `;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const response = await axios.post(
      `${config.resource}soap/services/ExpenseManagmentSvcGroup/ExpenseReportsServiceSvc`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/ExpenseReportsServiceSvc/SubmitExpenseReportsToWorkflow',
        },
      },
    );

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      parseTagValue: true,
      trimValues: true,
    });

    const parsed = parser.parse(response.data);

    // Check for SOAP faults
    const fault = parsed?.['s:Envelope']?.['s:Body']?.['s:Fault'];
    if (fault) {
      const faultString = fault?.faultstring || 'Unknown SOAP fault';

      const infolog = parsed?.['s:Envelope']?.['s:Header']?.['Infolog'];
      const entries = infolog?.Entries?.InfologEntry;

      let detailed = faultString;

      if (entries) {
        const msg = Array.isArray(entries)
          ? entries.map(e => e.Message).join('; ')
          : entries.Message;

        detailed = `${faultString} - ${msg}`;
      }

      throw new Error(`Submit operation failed: ${detailed}`);
    }

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

    // Extract GeneralContract
    let contracts = result['a:GeneralContract'];
    if (!contracts) {
      return {
        success: false,
        message: 'Invalid response format',
        submittedReports: reportNumbers,
      };
    }

    if (!Array.isArray(contracts)) contracts = [contracts];

    const processed = contracts.map(c => ({
      IsSuccess: c['a:IsSuccess'],
      Message: c['a:Message'],
      RecId: c['a:RecId'],
    }));

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
      const detailMessages = details.map(d => d.Message).join('; ');
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
    console.error('SOAP Submit Error:', error?.message);
    throw new Error(
      error.response?.data
        ? 'Server error occurred while submitting expense reports'
        : `Failed to submit expense reports: ${error.message}`,
    );
  }
};

export default SubmitExpenseReportsToWorkflow;
