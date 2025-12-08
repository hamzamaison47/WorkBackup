/* eslint-disable dot-notation */
import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const submitPurchaseRequisition = async ({_requestList}) => {
  try {
    // Get config and token
    const config = await getActiveConfigData();
    if (!config?.resource)
      throw new Error('No configuration found. Please scan QR code first.');

    const token = await getToken();

    // Convert string array to XML
    const requestListXml = _requestList
      .map(id => `<a:string>${id}</a:string>`)
      .join('');

    // Build SOAP body
    const soapBody = `
      <SubmitPurchaseRequisitionRequest xmlns="http://tempuri.org">
        <_requestList xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
          ${requestListXml}
        </_requestList>
      </SubmitPurchaseRequisitionRequest>
    `;

    const soapEnvelope = createSoapEnvelope(soapBody);

    // Send SOAP request
    const {data: xml} = await axios.post(
      `${config.resource}soap/services/EssWorkflowSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/ESSWorkflowSvc/SubmitPurchaseRequisitionRequest',
        },
        responseType: 'text',
      },
    );

    // Parse SOAP response
    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
    });

    const parsed = parser.parse(xml);

    const generalContracts =
      parsed?.['s:Envelope']?.['s:Body']?.[
        'SubmitPurchaseRequisitionRequestResponse'
      ]?.['result']?.['a:GeneralContract'];

    if (!generalContracts) {
      console.warn('No submit response data found');
      return [];
    }

    // Clean the namespace prefix
    const cleanObject = obj =>
      Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^a:/, ''),
          value,
        ]),
      );

    const cleanedData = Array.isArray(generalContracts)
      ? generalContracts.map(cleanObject)
      : [cleanObject(generalContracts)];

    return cleanedData;
  } catch (err) {
    console.error('Submit SOAP error:', err.response?.data || err.message);
    throw err;
  }
};

export {submitPurchaseRequisition};
