/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../Controller/secureConfig';

const ExpenseCategoryLookup = async ({legalEntity}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <ExpenseCategoryLookup xmlns="http://tempuri.org">
          <legalEntity>${legalEntity}</legalEntity>
      </ExpenseCategoryLookup>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    // console.log({soapEnvelope});

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/ExpenseManagmentSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/ExpenseLinesServiceSvc/ExpenseCategoryLookup',
        },
        responseType: 'text',
        timeout: 30000,
      },
    );

    // console.log({xml});

    // Parse XML with better configuration
    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: true,
      removeNSPrefix: true,
      attributeNamePrefix: '',
      isArray: (name, jpath, isLeafNode, isAttribute) => {
        return name === 'ExpenseLineLookupSvcContract';
      },
      parseTagValue: true,
      trimValues: true,
    });

    const parsed = parser.parse(xml);

    // console.log({parsed});

    // Navigate to the result array (without namespace prefixes)
    const responseBody = parsed?.Envelope?.Body?.[0];
    const lookupResponse = responseBody?.ExpenseCategoryLookupResponse?.[0];
    const result = lookupResponse?.result?.[0];

    let rawData = result?.ExpenseLineLookupSvcContract;

    if (!rawData) {
      rawData =
        parsed?.Envelope?.Body?.ExpenseCategoryLookupResponse?.result
          ?.ExpenseLineLookupSvcContract;
    }

    if (!rawData) {
      rawData =
        parsed?.['s:Envelope']?.['s:Body']?.['ExpenseCategoryLookupResponse']?.[
          'result'
        ]?.['a:ExpenseLineLookupSvcContract'];
    }

    if (!rawData || (Array.isArray(rawData) && rawData.length === 0)) {
      console.log('No expense category data found');
      return [];
    }

    // Ensure rawData is an array
    const dataArray = Array.isArray(rawData) ? rawData : [rawData];

    // Map data into a simple JSON array
    const processData = dataArray.map(item => ({
      categoryId: item['__k_parmCategoryId'] || item['categoryId'] || '',
      categoryName: item['__k_parmCategoryName'] || item['categoryName'] || '',
      description: item['__k_parmDescription'] || item['description'] || '',
    }));

    // console.log({processData});

    return processData;
  } catch (err) {
    console.error(
      'ExpenseCategoryLookup SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {ExpenseCategoryLookup};
