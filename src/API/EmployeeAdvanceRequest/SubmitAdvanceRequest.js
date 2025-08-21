/* eslint-disable curly */
/* eslint-disable dot-notation */
import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';

const SubmitAdvanceRequest = async ({recId}) => {
  try {
    if (typeof recId === 'object') {
      if ('recId' in recId) {
        recId = recId.recId;
      } else {
        throw new Error('Invalid recId. Expected a number, got an object.');
      }
    }

    const token = await getToken();

    const soapBody = `
      <submitAdvanceRequestByRecId xmlns="http://tempuri.org">
        <_recId>${recId}</_recId>
      </submitAdvanceRequestByRecId>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    // console.log('SOAP ENVELOPE IN SUBMIT REQUEST', soapEnvelope);

    const {data: xml} = await axios.post(
      `${resource}soap/services/EssWorkflowSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/ESSWorkflowSvc/submitAdvanceRequestByRecId',
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
      parsed?.['s:Envelope']?.['s:Body']?.[
        'submitAdvanceRequestByRecIdResponse'
      ]?.['result'] ||
      parsed?.['soap:Envelope']?.['soap:Body']?.[
        'submitAdvanceRequestByRecIdResponse'
      ]?.['result'];

    // console.log('Result SOAP ENVELOPE IN SUBMIT REQUEST', result);

    if (!result) {
      console.log('No result found in Submit SOAP response');
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
    //   'Cleaned Result SOAP ENVELOPE IN SUBMIT REQUEST',
    //   cleanedResult,
    // );

    return cleanedResult;
  } catch (error) {
    console.error(
      'Failed to submit advance request:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export {SubmitAdvanceRequest};
