/* eslint-disable dot-notation */

import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';

import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const GetRemainingBalance = async (
  employeeId,
  entitlementCode,
  leavesToBeEncashed,
  balanceBeforeApplication,
) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // ✅ FIXED: sanitize decimal values before sending to SOAP
    // Empty string or non-numeric input causes DeserializationFailed on server
    const safeLeavesToBeEncashed = parseFloat(leavesToBeEncashed) || 0;
    const safeBalanceBeforeApplication =
      parseFloat(balanceBeforeApplication) || 0;

    // ✅ FIXED: guard — don't call API if leaves is 0 or invalid
    if (safeLeavesToBeEncashed <= 0) {
      return {RemainingBalance: 0, EarningAmount: 0};
    }

    const soapBody = `
      <getEarningAmountNew xmlns="http://tempuri.org">
        <_employeeId>${employeeId}</_employeeId>
        <_entitlementCode>${entitlementCode}</_entitlementCode>
        <_leavesToBeEncashed>${safeLeavesToBeEncashed}</_leavesToBeEncashed>
        <_balanceBeforeApplication>${safeBalanceBeforeApplication}</_balanceBeforeApplication>
      </getEarningAmountNew>
    `;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/PREmployeeLeaveEncashmentSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/PREmployeeLeaveEncashmentSvc/getEarningAmountNew',
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
      'GetRemainingBalance SOAP RESPONSE:',
      JSON.stringify(parsed, null, 2),
    );

    const envelope =
      parsed?.['s:Envelope'] ??
      parsed?.['soap:Envelope'] ??
      parsed?.['Envelope'];

    const body =
      envelope?.['s:Body'] ?? envelope?.['soap:Body'] ?? envelope?.['Body'];

    const response = body?.['getEarningAmountNewResponse'];
    const resultNode = response?.['result'];

    const rawData =
      resultNode?.['a:PREmployeeLeaveEncashmentContract'] ??
      resultNode?.['PREmployeeLeaveEncashmentContract'];

    if (!rawData) {
      console.log(
        'No RemainingBalance data found. Response body:',
        JSON.stringify(body, null, 2),
      );
      return {RemainingBalance: 0, EarningAmount: 0};
    }

    const cleanObject = obj =>
      Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^[a-z]:/, ''),
          value,
        ]),
      );

    const rawArray = Array.isArray(rawData) ? rawData : [rawData];
    const cleaned = cleanObject(rawArray[0]);

    console.log('RemainingBalance result:', cleaned);

    return {
      RemainingBalance: cleaned?.RemainingBalance ?? 0,
      EarningAmount: cleaned?.EarningAmount ?? 0,
    };
  } catch (error) {
    console.error(
      'GetRemainingBalance error:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export {GetRemainingBalance};
