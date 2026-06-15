/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const SubmitHRHelpDeskRequest = async ({recId}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // ── mirrors submitAdvanceRequestByRecId exactly ──────────
    const soapBody = `
      <submitHRHelpDeskRequestByRecId xmlns="http://tempuri.org">
        <_recId>${recId}</_recId>
      </submitHRHelpDeskRequestByRecId>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    console.log('[SUBMIT HELPDESK BY RECID] recId:', recId);
    console.log('[SUBMIT HELPDESK BY RECID] envelope:', soapEnvelope);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/ESSWorkflowSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/ESSWorkflowSvc/submitHRHelpDeskRequestByRecId',
        },
        responseType: 'text',
      },
    );

    console.log('[SUBMIT HELPDESK BY RECID] raw response:', xml);

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
        'submitHRHelpDeskRequestByRecIdResponse'
      ]?.['result'] ||
      parsed?.['soap:Envelope']?.['soap:Body']?.[
        'submitHRHelpDeskRequestByRecIdResponse'
      ]?.['result'];

    console.log('[SUBMIT HELPDESK BY RECID] extracted result:', result);

    if (!result) {
      console.log('[SUBMIT HELPDESK BY RECID] No result found in response');
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

    console.log('[SUBMIT HELPDESK BY RECID] cleaned result:', cleanedResult);

    return cleanedResult;
  } catch (error) {
    console.error(
      'Failed to submit HR HelpDesk request:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export {SubmitHRHelpDeskRequest};
