import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const updateESSEmployeeTask = async ({employeeTaskData}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // SOAP Body - Direct ESSPersonTaskContract without wrapper
    const soapBody = `
      <updateTask xmlns="http://tempuri.org">
        <_contract xmlns:tem="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">
          ${buildContractXml(employeeTaskData)}
        </_contract>
      </updateTask>`;

    console.log('SOAP Body:', soapBody);

    const soapEnvelope = createSoapEnvelope(soapBody);
    console.log('SOAP Envelope:', soapEnvelope);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/ESSPersonTaskServiceGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/ESSPersonTaskSvc/updateTask',
        },
        responseType: 'text',
      },
    );

    console.log('Raw XML Response:', xml);

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: false,
    });

    const parsed = parser.parse(xml);
    console.log('Parsed Response:', JSON.stringify(parsed, null, 2));

    // Extract result following the example pattern
    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['updateTaskResponse']?.['result'];

    if (!result) {
      console.log('No result found in SOAP response');
      return null;
    }

    // Clean the object by removing namespace prefixes
    const cleanObject = obj => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(cleanObject);

      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^[a-zA-Z0-9]+:/, ''), // strip namespace prefix
          typeof value === 'object' ? cleanObject(value) : value,
        ]),
      );
    };

    const cleanedResult = cleanObject(result);
    console.log('Cleaned Result:', cleanedResult);

    return cleanedResult;
  } catch (error) {
    console.error(
      'Failed to update ESS Employee Task:',
      error.response?.data || error.message,
    );
    console.error('Full error:', error);
    throw error;
  }
};

const buildContractXml = contract => {
  if (!contract) return '';

  const ns = 'tem';
  const fields = ['Status', 'contactperson', 'recId'];
  console.log('This is the data received in request', contract);

  return fields
    .map(field => {
      const value = contract[field];
      if (value === null || value === undefined) {
        return `<${ns}:${field} xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>`;
      }
      return `<${ns}:${field}>${escapeXmlValue(value)}</${ns}:${field}>`;
    })
    .join('');
};

// Helper function to escape XML special characters
const escapeXmlValue = value => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export {updateESSEmployeeTask};
