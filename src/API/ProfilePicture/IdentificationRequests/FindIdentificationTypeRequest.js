import {getToken} from '../../Token/getToken';
import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';

const FindIdentificationTypeRequest = async () => {
  try {
    const accessToken = await getToken();
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
      <soapenv:Header>
        <dat:CallContext xmlns:dat="http://schemas.microsoft.com/dynamics/2013/01/datacontracts">
          <dat:Company></dat:Company>
          <dat:Language>en-us</dat:Language>
        </dat:CallContext>
      </soapenv:Header>
       <soapenv:Body>
        <retrieveAll xmlns = "http://tempuri.org"></retrieveAll>
      </soapenv:Body>
    </soapenv:Envelope>`;
    const {data: xml} = await axios.post(
      `${resource}soap/services/HcmIdentificationTypeSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/HcmIdentificationTypeSvc/retrieveAll',
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
      parsed?.['s:Envelope']?.['s:Body']?.['retrieveAllResponse']?.['result']?.[
        'a:HcmIdentificationTypeSvcContract'
      ];

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
    console.error('Failed to fetch All employee IDs:', error);
    throw error;
  }
};

export {FindIdentificationTypeRequest};
