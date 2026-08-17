/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../../Controller/secureConfig';

// Calls DFTravelRequisitionLinesSvc.getMileageAmount.
// Element order inside <_contract> MUST stay alphabetical to match the
// service contract's xs:sequence — do not reorder.
// EstimatedDate must default to TODAY, not epoch — calculateMileage() uses
// year(EstimatedDate) to look up the worker's YTD km sum for tiered rates;
// an epoch fallback would silently zero out that lookup.
const GetMileageAmount = async ({
  Category,
  Currency = 'PKR',
  EstimatedDate,
  Mileage,
  RequisitionHeaderRecId,
}) => {
  try {
    const config = await getActiveConfigData();
    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const reqHeaderRecId = Number(RequisitionHeaderRecId) || 0;
    const estimatedDate =
      EstimatedDate || new Date().toISOString().split('T')[0] + 'T12:00:00';

    const soapBody = `
  <getMileageAmount xmlns="http://tempuri.org">
    <_contract xmlns:a="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
      <a:AirlineServiceClass i:nil="true"/>
      <a:AmountInPKR>0</a:AmountInPKR>
      <a:Category>${Category || ''}</a:Category>
      <a:Currency>${Currency || 'PKR'}</a:Currency>
      <a:EstimatedAmount>0</a:EstimatedAmount>
      <a:EstimatedDate>${estimatedDate}</a:EstimatedDate>
      <a:LegalEntity i:nil="true"/>
      <a:Mileage>${Mileage || 0}</a:Mileage>
      <a:PerDiemFromDate>0001-01-01T00:00:00</a:PerDiemFromDate>
      <a:PerDiemToDate>0001-01-01T00:00:00</a:PerDiemToDate>
      <a:RecId>0</a:RecId>
      <a:RequisitionHeaderRecId>${reqHeaderRecId}</a:RequisitionHeaderRecId>
      <a:TrvLocationsRecId>0</a:TrvLocationsRecId>
    </_contract>
  </getMileageAmount>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/DFTravelRequisitionLinesSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/DFTravelRequisitionLinesSvc/getMileageAmount',
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
      parsed?.['s:Envelope']?.['s:Body']?.['getMileageAmountResponse']?.[
        'result'
      ]?.['a:DFTravelRequisitionLinesContract'];

    if (!rawData) {
      return {estimatedAmount: 0, amountInPKR: 0};
    }

    const record = Array.isArray(rawData) ? rawData[0] : rawData;

    return {
      estimatedAmount: parseFloat(record?.['a:EstimatedAmount']) || 0,
      amountInPKR: parseFloat(record?.['a:AmountInPKR']) || 0,
    };
  } catch (err) {
    console.error(
      'GetMileageAmount SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {GetMileageAmount};
