/* eslint-disable dot-notation */
import {getToken} from '../Token/getToken';
import {XMLParser} from 'fast-xml-parser';
import {resource} from '@env';
import axios from 'axios';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';

const PREmailSalarySlip = async ({payPeriodCode, employeeId}) => {
  try {
    const accessToken = await getToken();

    const soapBody = `
      <sendSalarySlipEmail xmlns="http://tempuri.org">
        <_employeeId>${employeeId}</_employeeId>
        <_payPeriodCode>${payPeriodCode}</_payPeriodCode>
      </sendSalarySlipEmail>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${resource}soap/services/RetrieveReportsSvcGroup`,
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
