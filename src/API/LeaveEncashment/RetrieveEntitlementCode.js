/* eslint-disable dot-notation */

import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';

import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const RetrieveEntitlementCode = async employeeId => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <getEntitlementCode xmlns="http://tempuri.org">
        <_employeeId>${employeeId}</_employeeId>
      </getEntitlementCode>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/PREmployeeLeaveEncashmentSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/PREmployeeLeaveEncashmentSvc/getEntitlementCode',
        },
        responseType: 'text',
      },
    );

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      parseTagValue: false,
    });

    const parsed = parser.parse(xml);

    console.log(
      'RetrieveEntitlementCode SOAP RESPONSE:',
      JSON.stringify(parsed, null, 2),
    );

    // Envelope/body fallback
    const envelope =
      parsed?.['s:Envelope'] ??
      parsed?.['soap:Envelope'] ??
      parsed?.['Envelope'];

    const body =
      envelope?.['s:Body'] ?? envelope?.['soap:Body'] ?? envelope?.['Body'];

    const response = body?.['getEntitlementCodeResponse'];

    // ✅ FIXED: response key is 'result', not 'return'
    const resultNode = response?.['result'];

    const rawData =
      resultNode?.['a:PREmployeeLeaveEncashmentContract'] ??
      resultNode?.['PREmployeeLeaveEncashmentContract'];

    if (!rawData) {
      console.log(
        'No Entitlement Codes found. Response body:',
        JSON.stringify(body, null, 2),
      );
      return [];
    }

    // Strip any single-letter namespace prefix (a:, i:, etc.)
    const cleanObject = obj =>
      Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^[a-z]:/, ''),
          value,
        ]),
      );

    // Always normalise to array (single item comes back as object, not array)
    const rawArray = Array.isArray(rawData) ? rawData : [rawData];
    const cleanedData = rawArray.map(cleanObject);

    console.log('Entitlement Codes:', cleanedData);

    return cleanedData;
  } catch (err) {
    console.error(
      'RetrieveEntitlementCode SOAP error:',
      err.response?.data || err.message,
    );

    throw err;
  }
};

export {RetrieveEntitlementCode};
