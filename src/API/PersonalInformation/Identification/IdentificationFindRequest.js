import {BASE_URL} from '@env';
import {getToken} from '../../Token/getToken';
import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';

const IdentificationFindRequest = async ({employeeId, defaultCompany}) => {
  try {
    const accessToken = await getToken();
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
      <soapenv:Header>
        <dat:CallContext xmlns:dat="http://schemas.microsoft.com/dynamics/2013/01/datacontracts">
          <dat:Company>${defaultCompany}</dat:Company>
          <dat:Language>en-us</dat:Language>
        </dat:CallContext>
      </soapenv:Header>
      <soapenv:Body>
        <findByEmployee xmlns = "http://tempuri.org">
        <_employeeId>${employeeId}</_employeeId>
        </findByEmployee>
      </soapenv:Body>
    </soapenv:Envelope>`;

    const {data: xml} = await axios.post(
      `${resource}soap/services/HcmPersonIdentificationNumberSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/HcmPersonIdentificationNumberSvc/findByEmployee',
        },
        responseType: 'text',
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
      parsed?.['s:Envelope']?.['s:Body']?.['findByEmployeeResponse']?.[
        'result'
      ]?.['a:HcmPersonIdentificationNumberSvcContract'];

    if (!rawData) {
      console.warn('No data found');
      return [];
    }

    // Normalize and remove "a:" prefix from keys
    const cleanObject = obj =>
      Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^a:/, ''),
          value,
        ]),
      );

    const cleanedData = Array.isArray(rawData)
      ? rawData.map(cleanObject)
      : [cleanObject(rawData)];

    return cleanedData;
  } catch (error) {
    console.error(
      'Failed to fetch Identification Find Request Details:',
      error,
    );
    throw error;
  }
};

export {IdentificationFindRequest};
