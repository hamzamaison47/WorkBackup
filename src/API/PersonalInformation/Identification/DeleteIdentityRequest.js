import {getToken} from '../../Token/getToken';
import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';

const DeleteIdentityRequest = async ({recordsRecId, defaultCompany}) => {
  try {
    // Get the token from the separate token file
    const accessToken = await getToken();
    // Make the POST request
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:arr="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
  <soapenv:Header>
    <dat:CallContext xmlns:dat="http://schemas.microsoft.com/dynamics/2013/01/datacontracts">
          <dat:Company>${defaultCompany}</dat:Company>
      <dat:Language>en-us</dat:Language>
    </dat:CallContext>
  </soapenv:Header>
  <soapenv:Body>
    <delete xmlns="http://tempuri.org">
      <_recordsRecId>
          <arr:long>${recordsRecId}</arr:long>
      </_recordsRecId>
    </delete>
  </soapenv:Body>
</soapenv:Envelope>`;
    console.log('soapEnvelope Delete Identity Request', soapEnvelope);
    const {data: xml} = await axios.post(
      `${resource}soap/services/HcmPersonIdentificationNumberSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/HcmPersonIdentificationNumberSvc/delete',
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
      parsed?.['s:Envelope']?.['s:Body']?.['deleteResponse']?.['result']?.[
        'a:GeneralContract'
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
    console.log('Returnded Data Delete Identity Request', cleanedData);
    return cleanedData;
  } catch (error) {
    console.error('Failed to delete Identification Details:', error);
    throw error;
  }
};

export {DeleteIdentityRequest};
