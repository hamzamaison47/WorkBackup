/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {clearConfig, getActiveConfigData} from '../../Controller/secureConfig';

const FindByEmployeeHRHelpDesk = async ({employeeId}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <findByEmployee xmlns="http://tempuri.org">
        <_employeeId>${employeeId}</_employeeId>
      </findByEmployee>`;

    const soapEnvelope = createSoapEnvelope(soapBody);
    console.log(soapEnvelope);
    const {data: xml} = await axios.post(
      `${config.resource}soap/services/ESSHRHelpDeskRequestSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/ESSHRHelpDeskRequestSvc/findByEmployee',
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
      parsed?.['s:Envelope']?.['s:Body']?.['findByEmployeeResponse']?.[
        'result'
      ]?.['a:ESSHRHelpDeskRequestSvcContract'] ||
      parsed?.['soap:Envelope']?.['soap:Body']?.['findByEmployeeResponse']?.[
        'result'
      ]?.['a:ESSHRHelpDeskRequestSvcContract'];

    if (!rawData) {
      console.log('No HR HelpDesk records found for employee');
      return [];
    }

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
    console.log('cleanedData', cleanedData);
    return cleanedData;
  } catch (err) {
    console.error(
      'FindByEmployee HR HelpDesk SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {FindByEmployeeHRHelpDesk};
