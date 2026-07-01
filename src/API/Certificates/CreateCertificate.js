/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const CreateCertificate = async ({certificateData, person}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // ✅ SOAP BODY (IMPORTANT: namespace WITHOUT "/")
    const soapBody = `
      <create xmlns="http://tempuri.org">
        <_contract>
          <certificateType>${certificateData.certificateType}</certificateType>
          <expirationdate>${certificateData.expirationDate}</expirationdate>
          <issuedate>${certificateData.issueDate}</issuedate>
          <note>${certificateData.note}</note>
        </_contract>
        <_person>${person}</_person>
      </create>`;

    console.log('CREATE SOAP BODY:', soapBody);

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/ESSEmployeeCertificatesSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/ESSEmployeeCertificatesSvc/create',
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

    console.log('CREATE RESPONSE:', JSON.stringify(parsed, null, 2));

    // ✅ Success check (Dynamics usually returns empty body on void)
    const response = parsed?.['s:Envelope']?.['s:Body']?.['createResponse'];

    return {
      success: true,
      data: response || {},
    };
  } catch (err) {
    console.error('Create SOAP error:', err.response?.data || err.message);
    throw err;
  }
};

export {CreateCertificate};
