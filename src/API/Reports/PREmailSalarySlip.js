import {getToken} from '../Token/getToken';
import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';

const PREmailSalarySlip = async ({payPeriodCode, employeeId, dataAreaId}) => {
  try {
    const accessToken = await getToken();
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
      <soapenv:Header>
        <dat:CallContext xmlns:dat="http://schemas.microsoft.com/dynamics/2013/01/datacontracts">
          <dat:Company>${dataAreaId}</dat:Company>
          <dat:Language>en-us</dat:Language>
        </dat:CallContext>
      </soapenv:Header>
      <soapenv:Body>
        <sendSalarySlipEmail xmlns = "http://tempuri.org">
          <_employeeId>${employeeId}</_employeeId>
          <_payPeriodCode>${payPeriodCode}</_payPeriodCode>
        </sendSalarySlipEmail>
      </soapenv:Body>
    </soapenv:Envelope>`;
    const {data: xml} = await axios.post(
      `${resource}/soap/services/RetrieveReportsSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/RetrieveReportSvc/sendSalarySlipEmail',
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
      parsed?.['s:Envelope']?.['s:Body']?.['sendSalarySlipEmailResponse']?.[
        'result'
      ];

    if (!rawData) {
      console.warn('No data found');
      return [];
    }
    return rawData;
  } catch (error) {
    console.error('Failed to fetch Salary Slip Data:', error);
    throw error;
  }
};
export {PREmailSalarySlip};
