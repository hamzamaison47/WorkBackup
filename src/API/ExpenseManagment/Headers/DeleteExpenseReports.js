/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../Controller/secureConfig';

const DeleteExpenseReports = async ({
  employeeId,
  expenseReportNumbers,
  legalEntity,
}) => {
  try {
    const config = await getActiveConfigData();

    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    if (!employeeId || !expenseReportNumbers || !legalEntity) {
      throw new Error('Missing required parameters for delete operation');
    }

    const token = await getToken();

    // Convert expenseReportNumbers array to proper XML format with correct namespace
    const expenseReportNumbersXml = Array.isArray(expenseReportNumbers)
      ? expenseReportNumbers
          .map(number => `<a:string>${number}</a:string>`)
          .join('')
      : `<a:string>${expenseReportNumbers}</a:string>`;

    const soapBody = `
      <DeleteExpenseReports xmlns="http://tempuri.org">
        <employeeId>${employeeId}</employeeId>
        <expenseReportNumbers xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
          ${expenseReportNumbersXml}
        </expenseReportNumbers>
        <legalEntity>${legalEntity}</legalEntity>
      </DeleteExpenseReports>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const response = await axios.post(
      `${config.resource}soap/services/ExpenseManagmentSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/ExpenseReportsServiceSvc/DeleteExpenseReports',
        },
        responseType: 'text',
        timeout: 30000,
      },
    );

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '@_',
      parseTagValue: true,
      trimValues: true,
      allowBooleanAttributes: false,
      parseAttributeValue: false,
      preserveOrder: false,
      alwaysCreateTextNode: false,
    });

    const parsed = parser.parse(response.data);

    // Check for SOAP fault
    const fault = parsed?.['s:Envelope']?.['s:Body']?.['s:Fault'];
    if (fault) {
      const faultString = fault?.faultstring || 'Unknown SOAP fault';
      throw new Error(`Delete operation failed: ${faultString}`);
    }

    // Extract response
    const deleteResponse =
      parsed?.['s:Envelope']?.['s:Body']?.['DeleteExpenseReportsResponse'];

    const result = deleteResponse?.['DeleteExpenseReportsResult'];

    return {
      success: true,
      message: 'Expense reports deleted successfully',
      deletedReports: expenseReportNumbers,
      response: result,
    };
  } catch (err) {
    console.error(
      'Delete Expense Reports SOAP error:',
      err.response?.data || err.message,
    );

    throw new Error(
      err.response?.data
        ? 'Server error occurred while deleting expense reports'
        : `Failed to delete expense reports: ${err.message}`,
    );
  }
};

export {DeleteExpenseReports};
