/* eslint-disable curly */
/* eslint-disable dot-notation */
// import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../Controller/secureConfig';

const submitDFEmployeeLeaveRequest = async ({recId, comment = ''}) => {
  try {
    if (typeof recId === 'object') {
      if ('recId' in recId) {
        recId = recId.recId;
      } else {
        throw new Error('Invalid recId. Expected a number, got an object.');
      }
    }

    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const escapeXml = str =>
      String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    const soapBody = `
      <submitLeaveByRecId xmlns="http://tempuri.org">
        <_recId>${recId}</_recId>
         <_workflowComment>${escapeXml(comment)}</_workflowComment>
      </submitLeaveByRecId>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    // console.log('SubmitDFEmployeeLeaveRequest recId-0-0-0-0-0-', recId);
    // console.log('SOAP ENVELOPE IN SUBMIT REQUEST', soapEnvelope);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/DFEmployeeLeaveRequestSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/DFEmployeeLeaveRequestSvc/submitLeaveByRecId',
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

    // console.log('Parsed SOAP ENVELOPE IN SUBMIT REQUEST', parsed);

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['submitLeaveByRecIdResponse']?.[
        'result'
      ] ||
      parsed?.['soap:Envelope']?.['soap:Body']?.[
        'submitLeaveByRecIdResponse'
      ]?.['result'];

    const infologEntries =
      parsed?.['s:Envelope']?.['s:Header']?.['Infolog']?.['Entries']?.[
        'InfologEntry'
      ];

    const infologMessage = Array.isArray(infologEntries)
      ? infologEntries.map(e => e.Message).join('\n')
      : infologEntries?.Message || null;

    console.log('Infolog Message:', infologMessage); // ✅ "Attachment is mandatory..."

    // console.log('Result SOAP ENVELOPE IN SUBMIT REQUEST', result);

    if (!result) {
      console.log('No result found in Submit DF Employee Leave SOAP response');
      return null;
    }

    const cleanObject = obj => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(cleanObject);

      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^[a-zA-Z0-9]+:/, ''), // strip ns prefix
          typeof value === 'object' ? cleanObject(value) : value,
        ]),
      );
    };

    const cleanedResult = cleanObject(result);

    // console.log(
    //   'Cleaned Result SOAP ENVELOPE IN SUBMIT DF EMPLOYEE LEAVE REQUEST',
    //   cleanedResult,
    // );

    return {
      ...cleanedResult,
      InfologMessage: infologMessage,
    };
  } catch (error) {
    console.error(
      'Failed to submit DF employee leave request:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export default submitDFEmployeeLeaveRequest;
