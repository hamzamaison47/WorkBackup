// import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const GetEmployeeLookup = async () => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <getEmployeeLookup xmlns="http://tempuri.org">
      </getEmployeeLookup>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/PREmploymentInformationSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/PREmploymentInformationSvc/getEmployeeLookup',
        },
        responseType: 'text',
      },
    );

    // const parser = new XMLParser({
    //   ignoreAttributes: false,
    //   attributeNamePrefix: '@_',
    //   allowBooleanAttributes: false,
    //   parseNodeValue: true,
    //   parseAttributeValue: false,
    //   trimValues: true,
    //   removeNSPrefix: true,
    // });

    // const parsed = parser.parse(xml);

    // // Directly access the employee array from the exact path
    // const employeeArray =
    //   parsed?.Envelope?.Body?.getEmployeeLookupResponse?.result
    //     ?.PREmploymentInformationSvcContract;

    // if (!employeeArray) {
    //   console.log('No employee data found in response');
    //   return [];
    // }

    // // Ensure it's an array
    // const employees = Array.isArray(employeeArray)
    //   ? employeeArray
    //   : [employeeArray];

    // // Extract only EmployeeId and EmployeeName
    // const filteredEmployees = employees
    //   .filter(emp => emp && emp.EmployeeId && emp.EmployeeName)
    //   .map(emp => ({
    //     EmployeeId: emp.EmployeeId,
    //     EmployeeName: emp.EmployeeName,
    //     // Also include WorkerRecId if you need it later
    //     WorkerRecId: emp.WorkerRecId || 0,
    //   }));

    // console.log(`Retrieved ${filteredEmployees.length} employees`);
    // console.log('Filtered employee data:', filteredEmployees);

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      allowBooleanAttributes: false,
      parseNodeValue: false, // Changed from true to false to preserve string values
      parseAttributeValue: false,
      trimValues: true,
      removeNSPrefix: true,
      // Add these options to preserve number formats
      numberParseOptions: {
        hex: false,
        leadingZeros: true, // This preserves leading zeros
        skipLike: /.*/, // Skip all number parsing
      },
      // Alternative: Disable number parsing entirely
      alwaysCreateTextNode: false,
    });

    const parsed = parser.parse(xml);

    // Directly access the employee array from the exact path
    const employeeArray =
      parsed?.Envelope?.Body?.getEmployeeLookupResponse?.result
        ?.PREmploymentInformationSvcContract;

    if (!employeeArray) {
      console.log('No employee data found in response');
      return [];
    }

    // Ensure it's an array
    const employees = Array.isArray(employeeArray)
      ? employeeArray
      : [employeeArray];

    // Extract only EmployeeId and EmployeeName, preserving EmployeeId as string
    const filteredEmployees = employees
      .filter(
        emp =>
          emp && (emp.EmployeeId || emp.EmployeeId === 0) && emp.EmployeeName,
      )
      .map(emp => {
        // Convert EmployeeId to string and pad with leading zeros if needed
        let employeeIdStr = String(emp.EmployeeId || '');

        // If it's a number, pad it to 6 digits with leading zeros
        if (/^\d+$/.test(employeeIdStr)) {
          employeeIdStr = employeeIdStr.padStart(6, '0');
        }

        return {
          EmployeeId: employeeIdStr,
          EmployeeName: emp.EmployeeName || '',
          WorkerRecId: emp.WorkerRecId || 0,
        };
      });

    return filteredEmployees;
  } catch (err) {
    console.error('Get Employee Lookup SOAP error:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
    });
    throw err;
  }
};

export {GetEmployeeLookup};
