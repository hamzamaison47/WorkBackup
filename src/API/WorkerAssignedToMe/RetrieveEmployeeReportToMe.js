/* eslint-disable dot-notation */
import {getToken} from '../Token/getToken';
import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';

const RetrieveEmployeeReportToMe = async ({employeeId, defaultCompany}) => {
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
        <retrieve xmlns = "http://tempuri.org">
            <_employeeId>${employeeId}</_employeeId>
        </retrieve>
      </soapenv:Body>
    </soapenv:Envelope>`;

    // console.log(
    //   '-=-=-=-=-=-=-=-=-=Worker Request XML-=-=-=-=-=-=-=-=-=-=\n',
    //   soapEnvelope,
    // );

    const {data: xml} = await axios.post(
      `${resource}soap/services/HREmployeesListReportToMeSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/HREmployeesListReportToMeSvc/retrieve',
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
      parsed?.['s:Envelope']?.['s:Body']?.['retrieveResponse']?.['result']?.[
        'a:HREmployeesListReportToMeSvcContract'
      ];

    if (!rawData) {
      console.log('No leave data found');
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
    console.error('Failed to fetch Team employee IDs:', error);
    throw error;
  }
};

export {RetrieveEmployeeReportToMe};
