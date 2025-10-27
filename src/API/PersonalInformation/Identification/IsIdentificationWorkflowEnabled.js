/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../Controller/secureConfig';

const isWorkflowConfigured = async () => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <isWorkflowConfigured xmlns="http://tempuri.org" />`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/HcmPersonIdentificationNumberSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/HcmPersonIdentificationNumberSvc/isWorkflowConfigured',
        },
        responseType: 'text',
      },
    );

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: true,
    });

    const parsed = parser.parse(xml);
    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['isWorkflowConfiguredResponse']?.[
        'result'
      ];

    // Normalize boolean response
    const isConfigured =
      result === true ||
      result === 'true' ||
      result === '1' ||
      result === 'yes';

    return Boolean(isConfigured);
  } catch (err) {
    console.error(
      'isWorkflowConfigured SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {isWorkflowConfigured};
