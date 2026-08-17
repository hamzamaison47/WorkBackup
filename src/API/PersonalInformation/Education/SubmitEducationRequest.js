/* eslint-disable curly */
/* eslint-disable dot-notation */
// import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
// import {getToken} from '../Token/getToken';
// import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../Controller/secureConfig';
import {getToken} from '../../Token/getToken';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';
// import {getActiveConfigData} from '../../../Controller/secureConfig';

const safeGetActiveConfigData = async () => {
  try {
    if (typeof getActiveConfigData === 'function') {
      return await getActiveConfigData();
    } else {
      console.error('getActiveConfigData is not available');
      return null; // or default config
    }
  } catch (error) {
    console.error('Error getting config data:', error);
    return null;
  }
};

const SubmitEducationRequest = async ({recId}) => {
  try {
    if (typeof recId === 'object') {
      if ('recId' in recId) {
        recId = recId.recId;
      } else {
        throw new Error('Invalid recId. Expected a number, got an object.');
      }
    }

    const config = await safeGetActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <submitESSPersonEducation xmlns="http://tempuri.org">
        <_requestList xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
          <a:long>${recId}</a:long>
        </_requestList>
      </submitESSPersonEducation>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/EssWorkflowSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/ESSWorkflowSvc/submitESSPersonEducation',
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
      parsed?.['s:Envelope']?.['s:Body']?.[
        'submitESSPersonEducationResponse'
      ]?.['result'] ||
      parsed?.['soap:Envelope']?.['soap:Body']?.[
        'submitESSPersonEducationResponse'
      ]?.['result'];

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
          key.replace(/^[a-zA-Z0-9]+:/, ''),
          typeof value === 'object' ? cleanObject(value) : value,
        ]),
      );
    };

    const cleanedResult = cleanObject(result);
    console.log('here is the resulttttttttttttttttt', cleanedResult);

    return cleanedResult;
  } catch (error) {
    console.error(
      'Failed to submit education request. Raw fault:',
      JSON.stringify(error.response?.data, null, 2),
    );
    throw error;
  }
};

export {SubmitEducationRequest};
