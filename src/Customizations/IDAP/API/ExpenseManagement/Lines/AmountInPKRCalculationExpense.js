/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../../Controller/secureConfig';
import {EXP_MGMT_LINES_CONTRACT, EXP_MGMT_LINES_GROUP} from './serviceConfig';

// Calls DFExpenseManagementLinesSvcNew.amountInPKRCalculation.
// ⚠️ CASING TRAP: the WSDL operation is "amountInPKRCalculation" — lowercase
// "n" in "In". "amountINPKRCalculation" (capital N) is a DIFFERENT string to
// WCF's ContractFilter and returns ActionNotSupported / a SOAP 500, even
// though it looks identical at a glance. Must match exactly: element name,
// SOAPAction header, AND the response node all use "amountInPKRCalculation".
const AmountInPKRCalculationExpense = async ({
  ClaimedAmount,
  ExchangeCode,
  Transaction,
}) => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const toIsoDateTime = value => {
      if (!value) return new Date().toISOString().split('T')[0] + 'T00:00:00';
      if (value instanceof Date) {
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const day = String(value.getDate()).padStart(2, '0');
        const hours = String(value.getHours()).padStart(2, '0');
        const minutes = String(value.getMinutes()).padStart(2, '0');
        const seconds = String(value.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      }
      return String(value);
    };

    const transaction = toIsoDateTime(Transaction);

    const soapBody = `
  <amountInPKRCalculation xmlns="http://tempuri.org">
    <_contract xmlns:a="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
      <a:AmountInPKR>0</a:AmountInPKR>
      <a:ArrivalDateTime>0001-01-01T00:00:00</a:ArrivalDateTime>
      <a:ArrivalLocation i:nil="true"/>
      <a:ClaimedAmount>${ClaimedAmount || 0}</a:ClaimedAmount>
      <a:CostType i:nil="true"/>
      <a:DateFrom>0001-01-01T00:00:00</a:DateFrom>
      <a:DateTo>0001-01-01T00:00:00</a:DateTo>
      <a:DepartureDateTime>0001-01-01T00:00:00</a:DepartureDateTime>
      <a:DepartureLocation i:nil="true"/>
      <a:ExchangeCode>${ExchangeCode || ''}</a:ExchangeCode>
      <a:HeaderRecId>0</a:HeaderRecId>
      <a:LineRecId>0</a:LineRecId>
      <a:MealReductionAmount i:nil="true"/>
      <a:Mileage>0</a:Mileage>
      <a:PersonnelNumber i:nil="true"/>
      <a:Transaction>${transaction}</a:Transaction>
    </_contract>
  </amountInPKRCalculation>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/${EXP_MGMT_LINES_GROUP}`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: `http://tempuri.org/${EXP_MGMT_LINES_CONTRACT}/amountInPKRCalculation`,
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
      parsed?.['s:Envelope']?.['s:Body']?.['amountInPKRCalculationResponse']?.[
        'result'
      ]?.['a:DFExpenseManagementLinesContract'];

    if (!rawData) {
      console.log('[ExpMgmt PKR CALC] no data returned');
      return {amountInPKR: 0, exchangeRate: 0};
    }

    const record = Array.isArray(rawData) ? rawData[0] : rawData;
    return {
      amountInPKR: parseFloat(record?.['a:AmountInPKR']) || 0,
      // X++ ExchRate is stored/returned scaled by 100 (e.g. a rate of 3.567
      // comes back as 356.7000) — divide down to the real conversion factor.
      exchangeRate: (parseFloat(record?.['a:ExchangeRate']) || 0) / 100,
    };
  } catch (err) {
    console.error(
      '[ExpMgmt PKR CALC] SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {AmountInPKRCalculationExpense};
