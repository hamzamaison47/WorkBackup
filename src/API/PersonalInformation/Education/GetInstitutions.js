/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../Controller/secureConfig';

const GetInstitutions = async () => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <getInstitution xmlns="http://tempuri.org" />`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/HcmPersonEducationSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/HcmPersonEducationSvc/getInstitution',
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
      parsed?.['s:Envelope']?.['s:Body']?.['getInstitutionResponse']?.[
        'result'
      ] ||
      parsed?.['soap:Envelope']?.['soap:Body']?.['getInstitutionResponse']?.[
        'result'
      ];

    if (!result) {
      console.log('No result found in getInstitution SOAP response');
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

    const rawList = cleanedResult?.HcmPersonEducationSvcContract
      ? Array.isArray(cleanedResult.HcmPersonEducationSvcContract)
        ? cleanedResult.HcmPersonEducationSvcContract
        : [cleanedResult.HcmPersonEducationSvcContract]
      : [];

    const institutions = rawList
      .map(item => item?.InstitutionID)
      .filter(Boolean)
      .map(id => ({label: id, value: id}));

    console.log('Institutions:', institutions);
    return institutions;
  } catch (error) {
    console.error(
      'Failed to fetch institutions:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export {GetInstitutions};
