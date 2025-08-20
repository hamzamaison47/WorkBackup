/* eslint-disable dot-notation */
import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';

const RetrieveEntitlementBalanceRequest = async ({employeeId}) => {
  try {
    const token = await getToken();

    const soapBody = `
      <retrieve xmlns="http://tempuri.org">
        <_employeeId>${employeeId}</_employeeId>
      </retrieve>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${resource}soap/services/PREntitlementBalanceSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/PREntitlementBalanceSvc/retrieve',
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
    const rawData =
      parsed?.['s:Envelope']?.['s:Body']?.['retrieveResponse']?.['result']?.[
        'a:PREntitlementBalanceSvcContract'
      ];

    if (!rawData) {
      console.log('No Retrieve Entitlement Balance Request found');
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

    return cleanedData;
  } catch (err) {
    console.error(
      'Retrieve Entitlement Balance Request SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {RetrieveEntitlementBalanceRequest};
