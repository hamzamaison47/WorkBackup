/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const deletePurchaseRequisition = async ({_contractList}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
  <delete xmlns="http://tempuri.org">
    <_contractList xmlns:a="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">
      ${_contractList
        .map(
          contract => `
        <a:GeneralContract>
          <a:RecId>${contract.RecId}</a:RecId>
        </a:GeneralContract>
      `,
        )
        .join('')}
    </_contractList>
  </delete>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/PurchaseRequestSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/PurchaseRequestSvc/delete',
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
    const generalContracts =
      parsed?.['s:Envelope']?.['s:Body']?.['deleteResponse']?.['result']?.[
        'a:GeneralContract'
      ];

    if (!generalContracts) {
      console.warn('No delete response data found');
      return [];
    }

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
    console.error('Delete SOAP error:', err.response?.data || err.message);
    throw err;
  }
};

export default deletePurchaseRequisition;
