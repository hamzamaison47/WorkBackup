/* eslint-disable dot-notation */
import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';

const PREmailTaxCertificate = async ({employeeId, startDate, endDate}) => {
  try {
    const token = await getToken();

    const soapBody = `
      <sendTaxCertificateEmail xmlns="http://tempuri.org">
        <_employeeId>${employeeId}</_employeeId>
        <_endDate>${endDate}</_endDate>
        <_startDate>${startDate}</_startDate>
      </sendTaxCertificateEmail>
    `;

    const soapEnvelope = createSoapEnvelope(soapBody);

    console.log('soapEnvelope-0-0-0-0-0-0-', soapEnvelope);

    const {data: xml} = await axios.post(
      `${resource}soap/services/RetrieveReportsSvcGroup`,
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

    console.log('SOAP Parsed Response:', parsed); // debug log
    console.log('SOAP XML Response:', xml); // debug log

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['sendTaxCertificateEmailResponse']?.[
        'result'
      ];

    if (!result) {
      console.log('No Tax Certificate data found');
      return null;
    }

    console.log('SOAP Result Response:', result); // debug log

    return result; // Return as-is (could be string, boolean, or number)
  } catch (err) {
    console.error(
      'PREmailTaxCertificate SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {PREmailTaxCertificate};
