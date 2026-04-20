/* eslint-disable dot-notation */
import {getToken} from '../Token/getToken';
import {XMLParser} from 'fast-xml-parser';
import {getActiveConfigData} from '../../Controller/secureConfig';
import axios from 'axios';

const RetrieveUserInfoByEmail = async ({email}) => {
  try {
    // Get configuration from secure storage
    const config = await getActiveConfigData();
    console.log(
      '🔍 Full active config keys:',
      JSON.stringify(Object.keys(config || {})),
    );
    console.log('🔍 Full active config:', JSON.stringify(config));

    // console.log({config});

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const accessToken = await getToken();
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
      <soapenv:Header>
        <dat:CallContext xmlns:dat="http://schemas.microsoft.com/dynamics/2013/01/datacontracts">
            <dat:Company>USMF</dat:Company>
            <dat:Language>en-us</dat:Language>
        </dat:CallContext>
      </soapenv:Header>
      <soapenv:Body>
        <retrieveUserInfoByEmail xmlns = "http://tempuri.org">
          <_email>${email}</_email>
        </retrieveUserInfoByEmail>
      </soapenv:Body>
    </soapenv:Envelope>`;

    console.log({soapEnvelope});

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/DFUserInfoSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/DFUserInfoSvc/retrieveUserInfoByEmail',
        },
        responseType: 'text',
      },
    );

    // console.log({xml});

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: false,
    });

    const parsed = parser.parse(xml);

    const rawData =
      parsed?.['s:Envelope']?.['s:Body']?.['retrieveUserInfoByEmailResponse']?.[
        'result'
      ];

    let userInfoContract =
      rawData?.['a:DFUserInfoSvcContract'] ||
      rawData?.['DFUserInfoSvcContract'] ||
      rawData;

    if (!userInfoContract || Object.keys(userInfoContract).length === 0) {
      console.warn('No Employee User data found');
      return [];
    }

    const cleanObject = obj =>
      Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^a:/, ''), // remove the namespace prefix
          value,
        ]),
      );

    const cleanedData = [cleanObject(userInfoContract)];

    // console.log({cleanedData});

    return cleanedData;
  } catch (error) {
    console.error('Failed to fetch Employee User Data:', error);
    throw error;
  }
};

export {RetrieveUserInfoByEmail};
