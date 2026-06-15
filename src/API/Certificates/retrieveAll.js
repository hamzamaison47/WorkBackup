/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const retrieveAll = async ({person}) => {
  try {
    console.log('PERSON:', person);

    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // ✅ FIXED SOAP BODY (IMPORTANT: no trailing slash)
    const soapBody = `
      <retrieveAll xmlns="http://tempuri.org">
        <_person>${person}</_person>
      </retrieveAll>`;

    console.log('SOAP BODY:', soapBody);

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/ESSEmployeeCertificatesSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/ESSEmployeeCertificatesSvc/retrieveAll',
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

    console.log('SOAP PARSED RESPONSE:', JSON.stringify(parsed, null, 2));

    // ✅ SAFE RESPONSE PATH
    const rawData =
      parsed?.['s:Envelope']?.['s:Body']?.['retrieveAllResponse']?.['result'];

    const certificates =
      rawData?.['a:ESSEmployeeCertificatesContract'] ||
      rawData?.['ESSEmployeeCertificatesContract'] ||
      rawData;

    if (!certificates) {
      console.log('No certificates found');
      return [];
    }

    const cleanObject = obj =>
      Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^a:/, ''),
          value,
        ]),
      );

    const result = Array.isArray(certificates)
      ? certificates.map(cleanObject)
      : [cleanObject(certificates)];
    console.log('Cleaned Result', result);
    return result;
  } catch (err) {
    console.error('RetrieveAll SOAP error:', err.response?.data || err.message);
    throw err;
  }
};

export {retrieveAll};
