/* eslint-disable dot-notation */
import {resource} from '@env';
import {getToken} from '../Token/getToken';
import {XMLParser} from 'fast-xml-parser';
import axios from 'axios';

const GetLeaveBalance = async ({
  employeeId,
  leaveCode,
  leaveStartDate,
  defaultCompany,
}) => {
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
        <getLeaveBalance xmlns="http://tempuri.org">
          <_employeeId>${employeeId}</_employeeId>
          <_leaveCode>${leaveCode}</_leaveCode>
          <_leaveStartDate>${leaveStartDate}</_leaveStartDate>
        </getLeaveBalance>
      </soapenv:Body>
    </soapenv:Envelope>`;

    const {data: xml} = await axios.post(
      `${resource}soap/services/PREmploymentInformationSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/PREmploymentInformationSvc/getLeaveBalance',
        },
        responseType: 'text',
      },
    );

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: true,
    });

    const parsed = parser.parse(xml);

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['getLeaveBalanceResponse']?.[
        'result'
      ];

    if (result === undefined || result === null) {
      console.log('No leave balance found');
      return null;
    }

    return Number(result); // Convert to number if not already
  } catch (err) {
    console.error(
      'GetLeaveBalance SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {GetLeaveBalance};
