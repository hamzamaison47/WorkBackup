/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../../Controller/secureConfig';

// Calls DFTravelRequisitionLinesSvc.amountINPKRCalculation.
// Currency, EstimatedAmount, and EstimatedDate are meaningful inputs —
// EstimatedDate drives the exchange-rate lookup date. LegalEntity is left
// nil; the server falls back to CompanyInfo::current() (the session's own
// legal entity) when it's not supplied. The rest of the contract is sent as
// empty/zero placeholders purely to satisfy the strict xs:sequence field
// ordering. DO NOT reorder these elements.
const GetAmountInPKR = async ({Currency, EstimatedAmount, EstimatedDate}) => {
  try {
    const config = await getActiveConfigData();
    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const toIsoDateTime = value => {
      if (!value) return new Date().toISOString().split('T')[0] + 'T12:00:00';
      if (value instanceof Date) {
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const day = String(value.getDate()).padStart(2, '0');
        const hours = String(value.getHours()).padStart(2, '0');
        const minutes = String(value.getMinutes()).padStart(2, '0');
        const seconds = String(value.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      }
      // Already a string — assume it's ISO-ish and pass through.
      return String(value);
    };

    const estimatedDate = toIsoDateTime(EstimatedDate);

    const soapBody = `
  <amountINPKRCalculation xmlns="http://tempuri.org">
    <_contract xmlns:a="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
      <a:AirlineServiceClass i:nil="true"/>
      <a:AmountInPKR>0</a:AmountInPKR>
      <a:Category i:nil="true"/>
      <a:Currency>${Currency || ''}</a:Currency>
      <a:EstimatedAmount>${EstimatedAmount || 0}</a:EstimatedAmount>
      <a:EstimatedDate>${estimatedDate}</a:EstimatedDate>
      <a:LegalEntity i:nil="true"/>
      <a:Mileage>0</a:Mileage>
      <a:PerDiemFromDate>0001-01-01T00:00:00</a:PerDiemFromDate>
      <a:PerDiemToDate>0001-01-01T00:00:00</a:PerDiemToDate>
      <a:RecId>0</a:RecId>
      <a:RequisitionHeaderRecId>0</a:RequisitionHeaderRecId>
      <a:TrvLocationsRecId>0</a:TrvLocationsRecId>
    </_contract>
  </amountINPKRCalculation>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/DFTravelRequisitionLinesSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/DFTravelRequisitionLinesSvc/amountINPKRCalculation',
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
      parsed?.['s:Envelope']?.['s:Body']?.['amountINPKRCalculationResponse']?.[
        'result'
      ]?.['a:DFTravelRequisitionLinesContract'];

    if (!rawData) {
      console.log('No PKR amount data returned');
      return {amountInPKR: 0, exchangeRate: 0};
    }

    const record = Array.isArray(rawData) ? rawData[0] : rawData;
    return {
      amountInPKR: parseFloat(record?.['a:AmountInPKR']) || 0,
      exchangeRate: parseFloat(record?.['a:ExchangeRate']) || 0,
    };
  } catch (err) {
    console.error(
      'GetAmountInPKR SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {GetAmountInPKR};
