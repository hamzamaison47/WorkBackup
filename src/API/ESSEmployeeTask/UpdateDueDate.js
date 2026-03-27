import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const UpdateDueDate = async ({dueDate, recId}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // ✅ SOAP Body
    const soapBody = `
  <updateTaskDueDate xmlns="http://tempuri.org">
    <_contract xmlns:tem="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">
      ${buildContractXml({dueDate, recId})}
    </_contract>
  </updateTaskDueDate>`;

    console.log('SOAP Body:', soapBody);

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/ESSPersonTaskServiceGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/ESSPersonTaskSvc/updateTaskDueDate',
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

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['updateTaskDueDateResponse']?.[
        'result'
      ];

    if (!result) {
      console.log('No result found');
      return null;
    }

    // ✅ Clean namespace
    const cleanObject = obj => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(cleanObject);

      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^[a-zA-Z0-9]+:/, ''),
          typeof value === 'object' ? cleanObject(value) : value,
        ]),
      );
    };

    return cleanObject(result);
  } catch (error) {
    console.error(
      'Update Due Date Error:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

// ✅ Build XML
const buildContractXml = contract => {
  const ns = 'tem';

  const fields = ['dueDate', 'recId']; // ✅ ONLY THESE TWO

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

// ✅ Escape XML
const escapeXmlValue = value => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export {UpdateDueDate};
