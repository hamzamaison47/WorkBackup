/* eslint-disable curly */
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

    console.log({soapEnvelope});

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

    // console.log({xml});

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      allowBooleanAttributes: false,
      parseNodeValue: true,
      parseAttributeValue: false,
      trimValues: true,
      removeNSPrefix: true, // Remove namespace prefixes
      isArray: (name, jpath, isLeafNode, isAttribute) => {
        // Return true for array nodes - adjust based on your XML structure
        if (name === 'PREmploymentInformationSvcContract') return true;
        if (name === 'item') return true;
        return false;
      },
    });

    const parsed = parser.parse(xml);

    // Navigate through the parsed XML structure
    const result = parsed?.Envelope?.Body?.retrieveAllResponse?.result;

    // console.log('Raw parsed result:', JSON.stringify(result, null, 2));

    if (!result) {
      console.log('No employee data found');
      return [];
    }

    // Extract the employee array
    let employees = [];

    // Check different possible structures
    if (result.PREmploymentInformationSvcContract) {
      if (Array.isArray(result.PREmploymentInformationSvcContract)) {
        employees = result.PREmploymentInformationSvcContract;
      } else {
        employees = [result.PREmploymentInformationSvcContract];
      }
    } else if (Array.isArray(result)) {
      employees = result;
    } else if (result['@_xmlns:a'] || result['@_xmlns:i']) {
      // This handles the structure from your log
      if (result.PREmploymentInformationSvcContract) {
        if (Array.isArray(result.PREmploymentInformationSvcContract)) {
          employees = result.PREmploymentInformationSvcContract;
        } else {
          employees = [result.PREmploymentInformationSvcContract];
        }
      }
    }

    // Clean up the employee data - remove namespace attributes and flatten structure
    const cleanEmployeeData = employees.map(emp => {
      const cleaned = {};

      // Check if emp is an object with nested structure
      let employeeObj = emp;
      if (emp && typeof emp === 'object') {
        // If it has a value property, use that
        if (emp['#text'] !== undefined) {
          employeeObj = emp['#text'];
        } else if (emp.value !== undefined) {
          employeeObj = emp.value;
        }
      }

      // Extract all properties
      if (employeeObj && typeof employeeObj === 'object') {
        for (const [key, value] of Object.entries(employeeObj)) {
          // Skip namespace attributes
          if (key.startsWith('@_xmlns') || key.startsWith('xmlns:')) {
            continue;
          }

          // Clean the key by removing any namespace prefix
          const cleanKey = key.replace(/^[a-zA-Z]+:/, '').replace('@_', '');

          if (value && typeof value === 'object') {
            // Handle nested objects
            if (value['#text'] !== undefined) {
              cleaned[cleanKey] = value['#text'];
            } else if (Array.isArray(value)) {
              cleaned[cleanKey] = value.map(v => {
                if (typeof v === 'object' && v['#text'] !== undefined) {
                  return v['#text'];
                }
                return v;
              });
            } else {
              cleaned[cleanKey] = value;
            }
          } else {
            cleaned[cleanKey] = value;
          }
        }
      }

      return cleaned;
    });

    // Filter out empty objects
    const filteredEmployees = cleanEmployeeData.filter(
      emp => emp && Object.keys(emp).length > 0,
    );

    // console.log('Final employee data:', filteredEmployees);
    console.log(`Retrieved ${filteredEmployees.length} employees`);

    return filteredEmployees;
  } catch (err) {
    console.error('Retrieve All Employees SOAP error:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
    });
    throw err;
  }
};

export {GetEmployeeLookup};
