/* eslint-disable dot-notation */

import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';

import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const GetBalanceBeforeApplication = async (employeeId, entitlementCode) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <getBalanceBeforeApplication xmlns="http://tempuri.org">
        <_employeeId>${employeeId}</_employeeId>
        <_entitlementCode>${entitlementCode}</_entitlementCode>
      </getBalanceBeforeApplication>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/PREmployeeLeaveEncashmentSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/PREmployeeLeaveEncashmentSvc/getBalanceBeforeApplication',
        },
        responseType: 'text',
      },
    );

    // ✅ FIXED: removed isArray: () => false
    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      parseTagValue: false,
    });

    const parsed = parser.parse(xml);

    console.log(
      'GetBalanceBeforeApplication SOAP RESPONSE:',
      JSON.stringify(parsed, null, 2),
    );

    // ✅ FIXED: namespace fallbacks for envelope and body
    const envelope =
      parsed?.['s:Envelope'] ??
      parsed?.['soap:Envelope'] ??
      parsed?.['Envelope'];

    const body =
      envelope?.['s:Body'] ?? envelope?.['soap:Body'] ?? envelope?.['Body'];

    const response = body?.['getBalanceBeforeApplicationResponse'];

    // ✅ FIXED: 'result' instead of 'return' (matches your AX SOAP pattern)
    const resultNode = response?.['result'];

    const rawData =
      resultNode?.['a:PREmployeeLeaveEncashmentContract'] ??
      resultNode?.['PREmployeeLeaveEncashmentContract'];

    if (!rawData) {
      console.log(
        'No Balance data found. Response body:',
        JSON.stringify(body, null, 2),
      );
      return null;
    }

    // Strip any single-letter namespace prefix (a:, i:, etc.)
    const cleanObject = obj =>
      Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^[a-z]:/, ''),
          value,
        ]),
      );

    // ✅ Normalise to array then take first item (balance is always single record)
    const rawArray = Array.isArray(rawData) ? rawData : [rawData];
    const cleaned = cleanObject(rawArray[0]);

    console.log('Balance Before Application:', cleaned);

    return cleaned;
  } catch (error) {
    console.error(
      'GetBalanceBeforeApplication error:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export {GetBalanceBeforeApplication};
