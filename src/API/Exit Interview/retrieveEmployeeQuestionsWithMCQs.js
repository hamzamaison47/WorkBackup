/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const retrieveEmployeeQuestionsWithMCQs = async ({employeeId}) => {
  console.log('Fetching questions for employee ID:', employeeId);

  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // 🔹 SOAP body
    const soapBody = `
  <retrieveEmployeeQuestionsWithMCQs xmlns="http://tempuri.org">
    <_personnelNumber>${employeeId}</_personnelNumber>
  </retrieveEmployeeQuestionsWithMCQs>`;

    console.log('SOAP envelope:', soapBody);

    const soapEnvelope = createSoapEnvelope(soapBody);

    // 🔹 Send SOAP request
    const {data: xml} = await axios.post(
      `${config.resource}soap/services/HREmployeeExitInterviewSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/HRExitInterviewSvc/retrieveEmployeeQuestionsWithMCQs',
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
    // console.log('SOAP PARSED RESPONSE:', JSON.stringify(parsed, null, 2));

    const rawData =
      parsed['s:Envelope']['s:Body'][
        'retrieveEmployeeQuestionsWithMCQsResponse'
      ]?.['result']?.['a:HRExitInterviewContract'];

    if (!rawData) {
      console.log('No questions found for this employee');
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
    // console.log('Cleaned Data:', cleanedData);
    return cleanedData;
  } catch (err) {
    console.error(
      'Retrieve Employee Questions SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {retrieveEmployeeQuestionsWithMCQs};
