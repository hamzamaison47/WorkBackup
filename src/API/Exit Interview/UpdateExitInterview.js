/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const updateExitInterview = async ({questionRecId, answer}) => {
  console.log('Updating Question:', questionRecId, 'Answer:', answer);

  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // 🔹 SOAP Body
    const soapBody = `
    <updateAnswerByQuestion xmlns="http://tempuri.org">
    <_answer>${answer}</_answer>
    <_questionRecId>${questionRecId}</_questionRecId>
    </updateAnswerByQuestion>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    console.log('SOAP REQUEST:', soapEnvelope);

    // 🔹 API Call
    const {data: xml} = await axios.post(
      `${config.resource}soap/services/HREmployeeExitInterviewSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/HRExitInterviewSvc/updateAnswerByQuestion',
        },
        responseType: 'text',
      },
    );

    // 🔹 Parse Response
    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
    });

    const parsed = parser.parse(xml);

    console.log('UPDATE RESPONSE:', JSON.stringify(parsed, null, 2));

    return parsed;
  } catch (err) {
    console.error(
      'Update Exit Interview ERROR:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {updateExitInterview};
