/* eslint-disable dot-notation */
// import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const PREmailTaxCertificate = async ({employeeId, startDate, endDate}) => {
  try {
    const config = await safeGetActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <sendTaxCertificateEmail xmlns="http://tempuri.org">
        <_employeeId>${employeeId}</_employeeId>
        <_endDate>${endDate}</_endDate>
        <_startDate>${startDate}</_startDate>
      </sendTaxCertificateEmail>
    `;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/RetrieveReportsSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/RetrieveReportSvc/sendTaxCertificateEmail',
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
      parsed?.['s:Envelope']?.['s:Body']?.['sendTaxCertificateEmailResponse']?.[
        'result'
      ];

    if (!result) {
      console.log('No Tax Certificate data found');
      return null;
    }

    return result; // Return as-is (could be string, boolean, or number)
  } catch (err) {
    console.error(
      'PREmailTaxCertificate SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

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

export {PREmailTaxCertificate};
