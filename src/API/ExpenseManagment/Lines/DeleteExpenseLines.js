/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../Controller/secureConfig';

const DeleteExpenseLines = async ({
  employeeId,
  expenseTransactionNumbers,
  legalEntity,
}) => {
  try {
    const config = await getActiveConfigData();

    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    if (!employeeId || !expenseTransactionNumbers || !legalEntity) {
      throw new Error('Missing required parameters for delete operation');
    }

    const token = await getToken();

    // Convert expenseTransactionNumbers array to proper XML format with correct namespace
    const expenseTransactionNumbersXml = Array.isArray(
      expenseTransactionNumbers,
    )
      ? expenseTransactionNumbers
          .map(number => `<a:string>${number}</a:string>`)
          .join('')
      : `<a:string>${expenseTransactionNumbers}</a:string>`;

    const soapBody = `
      <DeleteExpenseLines xmlns="http://tempuri.org">
        <employeeId>${employeeId}</employeeId>
        <expenseTransactionNumbers xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
          ${expenseTransactionNumbersXml}
        </expenseTransactionNumbers>
        <legalEntity>${legalEntity}</legalEntity>
      </DeleteExpenseLines>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const response = await axios.post(
      `${config.resource}soap/services/ExpenseManagmentSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/ExpenseLinesServiceSvc/DeleteExpenseLines',
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
      const faultString =
        fault?.faultstring || fault?.Reason?.Text || 'Unknown SOAP fault';
      throw new Error(`Delete operation failed: ${faultString}`);
    }

    // Extract response - based on the JSON schema, it returns a GeneralContract
    const deleteResponse =
      parsed?.['s:Envelope']?.['s:Body']?.['DeleteExpenseLinesResponse'];

    const result = deleteResponse?.result;

    // Check if the operation was successful
    // You might need to adjust this based on the actual GeneralContract structure
    const success = result !== undefined && result !== null;

    return {
      success: success,
      message: success
        ? 'Expense lines deleted successfully'
        : 'Delete operation completed with warnings',
      deletedTransactionNumbers: expenseTransactionNumbers,
      response: result,
    };
  } catch (err) {
    console.error(
      'Delete Expense Lines SOAP error:',
      err.response?.data || err.message,
      err.stack,
    );

    // Provide more specific error messages
    if (err.response?.status === 500) {
      throw new Error(
        'Server error occurred while deleting expense lines. Please try again.',
      );
    } else if (err.response?.status === 401) {
      throw new Error('Authentication failed. Please check your credentials.');
    } else if (err.response?.status === 403) {
      throw new Error('You do not have permission to delete expense lines.');
    } else {
      throw new Error(
        err.response?.data
          ? `Failed to delete expense lines: ${err.message}`
          : `Network error: ${err.message}`,
      );
    }
  }
};

export {DeleteExpenseLines};
