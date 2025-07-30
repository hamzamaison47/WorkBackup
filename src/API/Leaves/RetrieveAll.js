/* eslint-disable dot-notation */
import {resource} from '@env';
import {getToken} from '../Token/getToken';
import {XMLParser} from 'fast-xml-parser';
import axios from 'axios';

const RetrieveAll = async ({employeeId, defaultCompany}) => {
  try {
    const token = await getToken();

    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
      <soapenv:Header>
        <dat:CallContext xmlns:dat="http://schemas.microsoft.com/dynamics/2013/01/datacontracts">
          <dat:Company>${defaultCompany}</dat:Company>
          <dat:Language>en-us</dat:Language>
        </dat:CallContext>
      </soapenv:Header>
      <soapenv:Body>
        <findByEmployee xmlns="http://tempuri.org">
          <_employeeId>${employeeId}</_employeeId>
        </findByEmployee>
      </soapenv:Body>
    </soapenv:Envelope>`;

    const {data: xml} = await axios.post(
      `${resource}soap/services/PREmployeeLeavesSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/PREmployeeLeavesSvc/findByEmployee',
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
      ]?.['a:PREmployeeLeavesSvcContract'];

    if (!rawData) {
      console.log('No leave data found');
      return [];
    }
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
  } catch (err) {
    console.error('RetrieveAll SOAP error:', err.response?.data || err.message);
    throw err;
  }
};

export {RetrieveAll};
