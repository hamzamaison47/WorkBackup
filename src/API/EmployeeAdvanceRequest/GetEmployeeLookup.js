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

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      allowBooleanAttributes: false,
      parseNodeValue: false,
      parseAttributeValue: false,
      trimValues: true,
      removeNSPrefix: true,
      numberParseOptions: {
        hex: false,
        leadingZeros: true,
        skipLike: /.*/,
      },
      alwaysCreateTextNode: false,
    });

    const parsed = parser.parse(xml);

    const employeeArray =
      parsed?.Envelope?.Body?.getEmployeeLookupResponse?.result
        ?.PREmploymentInformationSvcContract;

    if (!employeeArray) {
      console.log('No employee data found in response');
      return [];
    }

    const employees = Array.isArray(employeeArray)
      ? employeeArray
      : [employeeArray];

    const filteredEmployees = employees
      .filter(
        emp =>
          emp && (emp.EmployeeId || emp.EmployeeId === 0) && emp.EmployeeName,
      )
      .map(emp => {
        let employeeIdStr = String(emp.EmployeeId || '');

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
