/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../../Controller/secureConfig';

// Calls DFTravelRequisitionLinesSvc.getEstimatedAmountForPerDiem.
// Element order inside <_contract> MUST stay alphabetical to match the
// service contract's xs:sequence — do not reorder.
const GetEstimatedAmountForPerDiem = async ({
  Category,
  Currency = 'PKR',
  EstimatedDate,
  PerDiemFromDate,
  PerDiemToDate,
  RequisitionHeaderRecId,
}) => {
  try {
    const config = await getActiveConfigData();
    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const reqHeaderRecId = Number(RequisitionHeaderRecId) || 0;

    const soapBody = `
  <getEstimatedAmountForPerDiem xmlns="http://tempuri.org">
    <_contract xmlns:a="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
      <a:AirlineServiceClass i:nil="true"/>
      <a:AmountInPKR>0</a:AmountInPKR>
      <a:Category>${Category || ''}</a:Category>
      <a:Currency>${Currency || 'PKR'}</a:Currency>
      <a:EstimatedAmount>0</a:EstimatedAmount>
      <a:EstimatedDate>${
        EstimatedDate || '0001-01-01T00:00:00'
      }</a:EstimatedDate>
      <a:LegalEntity i:nil="true"/>
      <a:Mileage>0</a:Mileage>
      <a:PerDiemFromDate>${
        PerDiemFromDate || '0001-01-01T00:00:00'
      }</a:PerDiemFromDate>
      <a:PerDiemToDate>${
        PerDiemToDate || '0001-01-01T00:00:00'
      }</a:PerDiemToDate>
      <a:RecId>0</a:RecId>
      <a:RequisitionHeaderRecId>${reqHeaderRecId}</a:RequisitionHeaderRecId>
      <a:TrvLocationsRecId>0</a:TrvLocationsRecId>
    </_contract>
  </getEstimatedAmountForPerDiem>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/DFTravelRequisitionLinesSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/DFTravelRequisitionLinesSvc/getEstimatedAmountForPerDiem',
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
      parsed?.['s:Envelope']?.['s:Body']?.[
        'getEstimatedAmountForPerDiemResponse'
      ]?.['result']?.['a:DFTravelRequisitionLinesContract'];

    if (!rawData) {
      console.log('No per diem estimate data returned');
      return {currency: Currency || 'PKR', estimatedAmount: 0, amountInPKR: 0};
    }

    const record = Array.isArray(rawData) ? rawData[0] : rawData;

    return {
      currency: record?.['a:Currency'] || Currency || 'PKR',
      estimatedAmount: parseFloat(record?.['a:EstimatedAmount']) || 0,
      amountInPKR: parseFloat(record?.['a:AmountInPKR']) || 0,
    };
  } catch (err) {
    console.error(
      'GetEstimatedAmountForPerDiem SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {GetEstimatedAmountForPerDiem};
