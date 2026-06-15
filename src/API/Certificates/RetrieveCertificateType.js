/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const RetrieveCertificateType = async () => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // ✅ SOAP BODY (no parameters required)
    const soapBody = `
      <retrieveCertificateType xmlns="http://tempuri.org" />`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/ESSEmployeeCertificatesSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/ESSEmployeeCertificatesSvc/retrieveCertificateType',
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

    console.log(
      'SOAP PARSED RESPONSE (Certificate Types):',
      JSON.stringify(parsed, null, 2),
    );

    // ✅ RESPONSE PATH (same structure as your leave API)
    const rawData =
      parsed?.['s:Envelope']?.['s:Body']?.['retrieveCertificateTypeResponse']?.[
        'result'
      ]?.['a:ESSEmployeeCertificatesContract'];

    if (!rawData) {
      console.log('No Certificate Types found');
      return [];
    }

    // ✅ CLEAN DATA (remove namespace prefix a:)
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
    console.error(
      'RetrieveCertificateType SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {RetrieveCertificateType};
