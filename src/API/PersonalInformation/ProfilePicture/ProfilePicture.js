/* eslint-disable dot-notation */
/* eslint-disable curly */
import {getToken} from '../../Token/getToken';
import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';

const ProfilePicture = async ({employeeId, defaultCompany}) => {
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
        <tem:findByEmployee xmlns:tem="http://tempuri.org">
          <tem:_employeeId>${employeeId}</tem:_employeeId>
        </tem:findByEmployee>
      </soapenv:Body>
    </soapenv:Envelope>`;

    // console.log('SOAP Request Body (ProfilePicture):', soapEnvelope);

    const {data: xml} = await axios.post(
      `${resource}soap/services/HcmPersonImageSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/HcmPersonImageSvc/findByEmployee',
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

    // console.log('Raw SOAP Response (ProfilePicture):', xml);
    // console.log('Parsed SOAP Response (ProfilePicture):', parsed);

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['findByEmployeeResponse']?.[
        'result'
      ] ||
      parsed?.['soap:Envelope']?.['soap:Body']?.['findByEmployeeResponse']?.[
        'result'
      ];

    if (!result) {
      console.warn('No profile picture result found');
      return null;
    }

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

    const cleanedResult = Array.isArray(result)
      ? result.map(cleanObject)
      : [cleanObject(result)];

    // console.log('Cleaned Profile Picture Data:', cleanedResult);
    return cleanedResult;
  } catch (error) {
    console.error(
      'Failed to fetch profile picture:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export {ProfilePicture};
