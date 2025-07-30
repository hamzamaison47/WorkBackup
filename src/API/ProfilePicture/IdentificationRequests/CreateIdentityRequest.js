import {getToken} from '../../Token/getToken';
import {XMLParser} from 'fast-xml-parser';
import {resource} from '@env';
import axios from 'axios';

const CreateIdentityRequest = async ({identityData, defaultCompany}) => {
  try {
    const accessToken = await getToken();
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
      <soapenv:Header>
        <dat:CallContext xmlns:dat="http://schemas.microsoft.com/dynamics/2013/01/datacontracts">
            <dat:Company>${defaultCompany}</dat:Company>
            <dat:Language>en-US</dat:Language>
        </dat:CallContext>
      </soapenv:Header>
      <soapenv:Body>
        <create xmlns = "http://tempuri.org">
          <contract xmlns:tem="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">
            <Description>${identityData.Description}</Description>
            <EmployeeId>${identityData.EmployeeId}</EmployeeId>
            <ExpirationDate>${identityData.ExpirationDate}</ExpirationDate>
            <IdentificationNumber>${identityData.IdentificationNumber}</IdentificationNumber>
            <IdentificationType>${identityData.IdentificationType}</IdentificationType>
            <IdentificationTypeId>${identityData.IdentificationTypeId}</IdentificationTypeId>
            <IsPrimary>${identityData.IsPrimary}</IsPrimary>
            <IssuingAgency>${identityData.IssuingAgency}</IssuingAgency>
            <IssuingAgencyId>${identityData.IssuingAgencyId}</IssuingAgencyId>
            <PersonIdentificationNumberRecVersion>${identityData.PersonIdentificationNumberRecVersion}</PersonIdentificationNumberRecVersion>
        </contract>
        </create>
      </soapenv:Body>
    </soapenv:Envelope>`;
    console.log(
      'Create Identity Request--------------------------------------------------\n',
      soapEnvelope,
    );
    const {data: xml} = await axios.post(
      `${resource}soap/services/HcmPersonIdentificationNumberSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/HcmPersonIdentificationNumberSvc/create',
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
      parsed?.['s:Envelope']?.['s:Body']?.['createResponse']?.['result'];

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
    console.error('Failed to create Identification request:', error);
    throw error;
  }
};

export {CreateIdentityRequest};
