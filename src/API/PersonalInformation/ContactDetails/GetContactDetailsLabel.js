import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../Controller/secureConfig';

const getContactDetailsLabels = async () => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <getContactDetailsLabels xmlns="http://tempuri.org">
      </getContactDetailsLabels>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    // console.log({soapEnvelope});

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/LogisticsElectronicAddressSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/LogisticsElectronicAddressSvc/getContactDetailsLabels',
        },
        responseType: 'text',
      },
    );

    // console.log({xml});

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '@',
      isArray: () => false,
      parseTagValue: true,
      trimValues: true,
      removeNSPrefix: false,
    });

    const parsed = parser.parse(xml);

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.getContactDetailsLabelsResponse
        ?.result;

    // console.log('Raw result:', result);

    if (!result) {
      console.log('No Contact Details data found');
      return [];
    }

    const cleanObject = obj => {
      if (!obj || typeof obj !== 'object') {
        return obj;
      }

      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        const cleanKey = key.replace(/^[a-z]+:/, '');

        if (value && typeof value === 'object' && !Array.isArray(value)) {
          cleaned[cleanKey] = cleanObject(value);
        } else {
          cleaned[cleanKey] = value;
        }
      }
      return cleaned;
    };

    const cleanedData = cleanObject(result);

    // Filter out the namespace attributes
    const finalData = {};
    for (const [key, value] of Object.entries(cleanedData)) {
      if (!key.startsWith('@xmlns')) {
        finalData[key] = value;
      }
    }

    // console.log('Leave Labels data:', finalData);

    return finalData;
  } catch (err) {
    console.error('getContactDetailsLabels SOAP error:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
      headers: err.response?.headers,
    });
    throw err;
  }
};
export {getContactDetailsLabels};
