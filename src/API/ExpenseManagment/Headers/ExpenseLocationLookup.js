/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../Controller/secureConfig';

const ExpenseLocationLookup = async ({legalEntity}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
        <LocationLookup xmlns="http://tempuri.org">
            <legalEntity>${legalEntity}</legalEntity>
        </LocationLookup>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}ExpenseReportsServiceSvc/LocationLookup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/ExpenseReportsServiceSvc/LocationLookup',
        },
        responseType: 'text',
        timeout: 30000,
      },
    );

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: false,
    });

    const parsed = parser.parse(xml);
    const rawData =
      parsed?.['s:Envelope']?.['s:Body']?.['LocationLookupResponse']?.[
        'result'
      ]?.['a:ExpenseReportLookupSvcContract'];

    if (!rawData) {
      console.log('No location data found');
      return [];
    }

    // Simple key-value pair extraction if needed
    const extractFields = obj => {
      const fields = obj?.['a:fields']?.['b:KeyValueOfanyTypeanyType'];
      if (!fields) return obj;

      const cleanObj = {};
      const fieldArray = Array.isArray(fields) ? fields : [fields];

      fieldArray.forEach(field => {
        const key = field?.['b:Key']?.['#text'] || field?.['b:Key'];
        const value = field?.['b:Value']?.['#text'] || field?.['b:Value'];
        if (key) {
          cleanObj[key.replace(/^[a-z]:/, '')] = value;
        }
      });

      return cleanObj;
    };

    const processData = Array.isArray(rawData)
      ? rawData.map(extractFields)
      : [extractFields(rawData)];

    console.log({processData});

    return processData;
  } catch (err) {
    console.error(
      'LocationLookup SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {ExpenseLocationLookup};
