/* eslint-disable dot-notation */
import {getToken} from '../Token/getToken';
import {XMLParser} from 'fast-xml-parser';
import {resource} from '@env';
import axios from 'axios';

const RetrieveByEmail = async ({email}) => {
  try {
    const accessToken = await getToken();
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
      <soapenv:Header>
        <dat:CallContext xmlns:dat="http://schemas.microsoft.com/dynamics/2013/01/datacontracts">
            <dat:Company>DAT</dat:Company>
            <dat:Language>en-us</dat:Language>
        </dat:CallContext>
      </soapenv:Header>
      <soapenv:Body>
        <retrieveByEmail xmlns = "http://tempuri.org">
          <_dataAreaId>DAT</_dataAreaId>
          <_email>${email}</_email>
        </retrieveByEmail>
      </soapenv:Body>
    </soapenv:Envelope>`;

    console.log('Soap Envelope In Retrieve Email:', soapEnvelope);

    const {data: xml} = await axios.post(
      `${resource}soap/services/PREmploymentInformationSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/PREmploymentInformationSvc/retrieveByEmail',
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

    console.log('parsed In Retrieve Email:', parsed);

    const rawData =
      parsed?.['s:Envelope']?.['s:Body']?.['retrieveByEmailResponse']?.[
        'result'
      ]?.['a:PREmploymentInformationSvcContract'];

    if (!rawData) {
      console.warn('No leave data found');
      return [];
    }

    console.log('rawData In Retrieve Email:', rawData);

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

    console.log('cleanedData In Retrieve Email:', rawData);

    return cleanedData;
  } catch (error) {
    console.error('Failed to fetch Employment Information Data:', error);
    throw error;
  }
};

export {RetrieveByEmail};
