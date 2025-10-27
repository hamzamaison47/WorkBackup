/* eslint-disable dot-notation */
import {getToken} from '../Token/getToken';
import {XMLParser} from 'fast-xml-parser';
import axios from 'axios';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const safeGetActiveConfigData = async () => {
  try {
    if (typeof getActiveConfigData === 'function') {
      return await getActiveConfigData();
    } else {
      console.error('getActiveConfigData is not available');
      return null; // or default config
    }
  } catch (error) {
    console.error('Error getting config data:', error);
    return null;
  }
};

const PREmailSalarySlip = async ({payPeriodCode, employeeId}) => {
  try {
    // const config = await getActiveConfigData();
    // Use the safe function instead
    const config = await safeGetActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const accessToken = await getToken();

    const soapBody = `
      <sendSalarySlipEmail xmlns="http://tempuri.org">
        <_employeeId>${employeeId}</_employeeId>
        <_payPeriodCode>${payPeriodCode}</_payPeriodCode>
      </sendSalarySlipEmail>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/RetrieveReportsSvcGroup`,
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
