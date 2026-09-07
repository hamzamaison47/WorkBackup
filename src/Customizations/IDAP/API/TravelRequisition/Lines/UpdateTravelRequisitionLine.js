/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../../Controller/secureConfig';

const getOffsetSuffix = date => {
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${sign}${hh}:${mm}`;
};

const toIsoDateTimePreserveTime = value => {
  if (!value) return '';

  let d;
  if (value instanceof Date) {
    d = value;
  } else {
    const match = String(value).match(
      /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2}))?/,
    );
    if (!match) return '';
    const [, year, month, day, hours = '00', minutes = '00', seconds = '00'] =
      match;
    d = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
      Number(seconds),
    );
  }

  if (isNaN(d.getTime())) return '';

  const pad = n => String(n).padStart(2, '0');
  const literal =
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

  return `${literal}${getOffsetSuffix(d)}`;
};

// Calls DFTravelRequisitionLinesSvc.update.
// Element order inside <contract> MUST stay alphabetical to match the
// service contract's xs:sequence — do not reorder.
const UpdateTravelRequisitionLine = async ({
  RecId,
  Category,
  Currency,
  EstimatedAmount,
  EstimatedDate,
  LegalEntity,
  Mileage,
  AirlineServiceClass,
  PerDiemFromDate,
  PerDiemToDate,
  AmountInPKR,
  RequisitionHeaderRecId,
}) => {
  try {
    const config = await getActiveConfigData();
    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const recId = Number(RecId) || 0;
    const reqHeaderRecId = Number(RequisitionHeaderRecId) || 0;

    const soapBody = `
  <update xmlns="http://tempuri.org">
    <contract xmlns:a="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
      <a:AirlineServiceClass>${
        AirlineServiceClass || ''
      }</a:AirlineServiceClass>
      <a:AmountInPKR>${AmountInPKR || 0}</a:AmountInPKR>
      <a:Category>${Category || ''}</a:Category>
      <a:Currency>${Currency || ''}</a:Currency>
      <a:EstimatedAmount>${EstimatedAmount || 0}</a:EstimatedAmount>
      <a:EstimatedDate>${
        EstimatedDate || '0001-01-01T00:00:00'
      }</a:EstimatedDate>
      <a:LegalEntity>${LegalEntity || ''}</a:LegalEntity>
      <a:Mileage>${Mileage || 0}</a:Mileage>
     <a:PerDiemFromDate>${
       toIsoDateTimePreserveTime(PerDiemFromDate) || '0001-01-01T00:00:00'
     }</a:PerDiemFromDate>
      <a:PerDiemToDate>${
        toIsoDateTimePreserveTime(PerDiemToDate) || '0001-01-01T00:00:00'
      }</a:PerDiemToDate>
      <a:RecId>${recId}</a:RecId>
      <a:RequisitionHeaderRecId>${reqHeaderRecId}</a:RequisitionHeaderRecId>
      <a:TrvLocationsRecId>0</a:TrvLocationsRecId>
    </contract>
  </update>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    console.log('here is what it is in soap', soapEnvelope);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/DFTravelRequisitionLinesSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/DFTravelRequisitionLinesSvc/update',
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
      parsed?.['s:Envelope']?.['s:Body']?.['updateResponse']?.['result'];

    if (!rawData) {
      return {IsSuccess: false, Message: 'No response from server', RecId: 0};
    }

    console.log('here is response', rawData);

    return {
      IsSuccess:
        rawData['a:IsSuccess'] === 'true' || rawData['a:IsSuccess'] === true,
      Message: rawData['a:Message'] || '',
      RecId: parseFloat(rawData['a:RecId']) || 0,
    };
  } catch (err) {
    console.error(
      'UpdateTravelRequisitionLine SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {UpdateTravelRequisitionLine};
