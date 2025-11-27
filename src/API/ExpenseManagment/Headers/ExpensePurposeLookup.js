import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {getActiveConfigData} from '../../../Controller/secureConfig';

const ExpensePurposeLookup = async ({legalEntity}) => {
  try {
    const config = await getActiveConfigData();
    const token = await getToken();

    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
      <soapenv:Envelope
        xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
        xmlns:tem="http://tempuri.org"
        xmlns:dat="http://schemas.microsoft.com/dynamics/2013/01/datacontracts">

        <soapenv:Header>
            <dat:CallContext>
                <dat:Company>${legalEntity}</dat:Company>
            </dat:CallContext>
        </soapenv:Header>

        <soapenv:Body>
            <tem:PurposeLookup>
                <tem:legalEntity>${legalEntity}</tem:legalEntity>
            </tem:PurposeLookup>
        </soapenv:Body>
      </soapenv:Envelope>`;

    const response = await axios.post(
      `${config.resource}soap/services/ExpenseManagmentSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/ExpenseReportsServiceSvc/PurposeLookup',
        },
        responseType: 'text',
        timeout: 30000,
      },
    );

    const xml = response.data;

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      removeNSPrefix: true,
    });

    const parsed = parser.parse(xml);

    const result =
      parsed.Envelope?.Body?.PurposeLookupResponse?.result
        ?.ExpenseReportLookupSvcContract;

    const purposesArray = Array.isArray(result) ? result : [result];

    if (!purposesArray || purposesArray.length === 0) {
      throw new Error('No purposes found in SOAP response.');
    }

    const purposes = purposesArray.map(item => ({
      purpose: item.purpose,
      locations: item.locations,
    }));

    return {
      success: true,
      data: purposes,
    };
  } catch (error) {
    console.error('Purpose Lookup SOAP error:', error);
    throw new Error(
      `Failed to fetch purposes: ${error.response?.status || error.message}`,
    );
  }
};

export default ExpensePurposeLookup;
