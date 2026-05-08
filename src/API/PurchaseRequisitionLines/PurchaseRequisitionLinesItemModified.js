/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const itemModifiedforPurchaseRequisitionLines = async ({_itemId}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <purchReqLineItemModified xmlns="http://tempuri.org">
        <_itemId>${_itemId}</_itemId>
      </purchReqLineItemModified>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const soapAction =
      'http://tempuri.org/PurchaseRequisitonLineSvc/purchReqLineItemModified';

    // CALL AX SOAP SERVICE
    const {data: xml} = await axios.post(
      `${config.resource}soap/services/PurchaseRequisitonLineSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: soapAction,
        },
        responseType: 'text',
        timeout: 30000,
      },
    );

    // PARSER
    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: (name, jpath) => {
        return (
          jpath ===
          's:Envelope.s:Body.purchReqLineItemModifiedResponse.result.a:PurchaseRequisitonLineSvcContract'
        );
      },
      parseTagValue: false,
      trimValues: true,
    });

    const parsed = parser.parse(xml);

    let rawData;
    const responseBody =
      parsed?.['s:Envelope']?.['s:Body']?.['purchReqLineItemModifiedResponse'];

    if (responseBody?.result) {
      rawData = responseBody.result['a:PurchaseRequisitonLineSvcContract'];
    }

    if (!rawData) {
      console.log('No Item Res[pmse] found in response:', xml);
      return [];
    }

    // REMOVE "a:" PREFIX FROM ELEMENTS
    const cleanObject = obj => {
      if (!obj || typeof obj !== 'object') {
        return obj;
      }

      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^a:/, ''),
          typeof value === 'object' ? cleanObject(value) : value,
        ]),
      );
    };

    // HANDLE ARRAY or SINGLE ELEMENT
    let cleanedData;
    if (Array.isArray(rawData)) {
      cleanedData = rawData.map(cleanObject);
    } else if (rawData && typeof rawData === 'object') {
      cleanedData = [cleanObject(rawData)];
    } else {
      console.log('Unexpected data format:', rawData);
      cleanedData = [];
    }

    return cleanedData;
  } catch (err) {
    console.error('RetrieveAll SOAP error:', err.response?.data || err.message);
    console.error('Full error details:', err);
    throw err;
  }
};

export {itemModifiedforPurchaseRequisitionLines};
