/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

/**
 * Calls the retrieveTypesofProblems operation on ESSHRHelpDeskRequestSvcGroup.
 * Returns an array of objects: [{ TypeOfProblems: string, ... }, ...]
 */
const RetrieveTypesOfProblems = async () => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <retrieveTypesofProblems xmlns="http://tempuri.org">
      </retrieveTypesofProblems>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/ESSHRHelpDeskRequestSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/ESSHRHelpDeskRequestSvc/retrieveTypesofProblems',
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

    // Try both s: and soap: namespace prefixes for compatibility
    const rawData =
      parsed?.['s:Envelope']?.['s:Body']?.['retrieveTypesofProblemsResponse']?.[
        'result'
      ]?.['a:ESSHRHelpDeskRequestSvcContract'] ||
      parsed?.['soap:Envelope']?.['soap:Body']?.[
        'retrieveTypesofProblemsResponse'
      ]?.['result']?.['a:ESSHRHelpDeskRequestSvcContract'];

    if (!rawData) {
      console.log('No TypesOfProblems records found');
      return [];
    }

    // Strip the "a:" namespace prefix from all keys
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
    console.log('Cleaned Data', cleanedData);
    return cleanedData;
  } catch (err) {
    console.error(
      'RetrieveTypesOfProblems SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {RetrieveTypesOfProblems};
