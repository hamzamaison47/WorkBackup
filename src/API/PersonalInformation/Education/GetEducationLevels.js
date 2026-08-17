/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../Controller/secureConfig';

const GetEducationLevels = async () => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <getLevelOfEducation xmlns="http://tempuri.org" />`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/HcmPersonEducationSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/HcmPersonEducationSvc/getLevelOfEducation',
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

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['getLevelOfEducationResponse']?.[
        'result'
      ] ||
      parsed?.['soap:Envelope']?.['soap:Body']?.[
        'getLevelOfEducationResponse'
      ]?.['result'];

    if (!result) {
      console.log('No result found in getLevelOfEducation SOAP response');
      return [];
    }

    const cleanObject = obj => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(cleanObject);

      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^[a-zA-Z0-9]+:/, ''),
          typeof value === 'object' ? cleanObject(value) : value,
        ]),
      );
    };

    const cleanedResult = cleanObject(result);

    // ArrayOfHcmPersonEducationSvcContract → { HcmPersonEducationSvcContract: [...] }
    const rawList = cleanedResult?.HcmPersonEducationSvcContract
      ? Array.isArray(cleanedResult.HcmPersonEducationSvcContract)
        ? cleanedResult.HcmPersonEducationSvcContract
        : [cleanedResult.HcmPersonEducationSvcContract]
      : [];

    const levels = rawList
      .map(item => item?.EducationLevelID)
      .filter(Boolean)
      .map(id => ({label: id, value: id}));

    console.log('Education Levels:', levels);
    return levels;
  } catch (error) {
    console.error(
      'Failed to fetch education levels:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export {GetEducationLevels};
