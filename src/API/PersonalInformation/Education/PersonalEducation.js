/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../Controller/secureConfig';

const EmployeePersonalEducation = async ({employeeId}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // 🔹 SOAP body specific to Education service
    const soapBody = `
      <findByEmployee xmlns="http://tempuri.org">
        <_employeeId>${employeeId}</_employeeId>
      </findByEmployee>`;

    // 🔹 Create SOAP envelope
    const soapEnvelope = createSoapEnvelope(soapBody);

    // 🔹 POST request to Education service endpoint
    const {data: xml} = await axios.post(
      `${config.resource}soap/services/HcmPersonEducationSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/HcmPersonEducationSvc/findByEmployee', // 🔹 Correct SOAP Action
        },
        responseType: 'text',
      },
    );

    // 🔹 Parse XML response
    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: false,
    });

    const parsed = parser.parse(xml);

    // 🔹 Navigate through SOAP structure to get education details
    const rawData =
      parsed?.['s:Envelope']?.['s:Body']?.['findByEmployeeResponse']?.[
        'result'
      ]?.['a:HcmPersonEducationSvcContract'];

    if (!rawData) {
      console.log('No education details found');
      return [];
    }

    // 🔹 Clean up XML prefixes like "a:"
    const cleanObject = obj =>
      Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^a:/, ''),
          value,
        ]),
      );

    // 🔹 Normalize response
    const cleanedData = Array.isArray(rawData)
      ? rawData.map(cleanObject)
      : [cleanObject(rawData)];

    return cleanedData;
  } catch (err) {
    console.error(
      'EducationDetails SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {EmployeePersonalEducation};
