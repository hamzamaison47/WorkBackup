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
      `${config.resource}soap/services/ExpenseManagmentSvcGroup`,
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

    // Parse XML with better configuration
    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: true,
      removeNSPrefix: true,
      attributeNamePrefix: '',
      isArray: (name, jpath, isLeafNode, isAttribute) => {
        return name === 'ExpenseReportLookupSvcContract';
      },
      parseTagValue: true,
      trimValues: true,
    });

    const parsed = parser.parse(xml);

    // Navigate to the result array (without namespace prefixes)
    const responseBody = parsed?.Envelope?.Body?.[0];
    const lookupResponse = responseBody?.LocationLookupResponse?.[0];
    const result = lookupResponse?.result?.[0];

    let rawData = result?.ExpenseReportLookupSvcContract;

    if (!rawData) {
      rawData =
        parsed?.Envelope?.Body?.LocationLookupResponse?.result
          ?.ExpenseReportLookupSvcContract;
    }

    if (!rawData) {
      rawData =
        parsed?.['s:Envelope']?.['s:Body']?.['LocationLookupResponse']?.[
          'result'
        ]?.['a:ExpenseReportLookupSvcContract'];
    }

    if (!rawData || (Array.isArray(rawData) && rawData.length === 0)) {
      console.log('No location data found');
      return [];
    }

    // Ensure rawData is an array
    const dataArray = Array.isArray(rawData) ? rawData : [rawData];

    // Map data into a simple JSON array
    const processData = dataArray.map(item => ({
      location: item['__k_parmLocation'] || item['locations'] || '',
      purpose: item['__k_parmPurpose'] || item['purpose'] || '',
    }));

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
