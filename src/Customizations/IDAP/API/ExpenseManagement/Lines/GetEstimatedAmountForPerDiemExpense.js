/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../../Controller/secureConfig';
import {EXP_MGMT_LINES_CONTRACT, EXP_MGMT_LINES_GROUP} from './serviceConfig';

// ── ADD HERE ──────────────────────────────────────────────────────────
const getOffsetSuffix = date => {
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${sign}${hh}:${mm}`;
};

const toIsoDateTime = value => {
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

const toIsoDateTimeLiteral = value => {
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
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
};

// Calls DFExpenseManagementLinesSvcNew.getEstimatedAmountForPerDiem.
// PersonnelNumber is REQUIRED — X++ resolves it via
// HcmWorker::findByPersonnelNumber() to set CreatingWorker, which perDiem()
// checks against TrvPartyEmployeeRelationship for an employee-specific
// override before falling back to location-based rates. Omitting it means
// findByPersonnelNumber() gets '', resolves no worker (RecId 0), and the
// override branch silently never matches.
// Element order inside <_contract> MUST stay alphabetical to match the
// service contract's xs:sequence — do not reorder.
const GetEstimatedAmountForPerDiemExpense = async ({
  CostType,
  DateFrom,
  DateTo,
  PersonnelNumber,
  Transaction,
}) => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
  <getEstimatedAmountForPerDiem xmlns="http://tempuri.org">
    <_contract xmlns:a="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
      <a:AmountInPKR>0</a:AmountInPKR>
      <a:ArrivalDateTime>0001-01-01T00:00:00</a:ArrivalDateTime>
      <a:ArrivalLocation i:nil="true"/>
      <a:ClaimedAmount>0</a:ClaimedAmount>
      <a:CostType>${CostType || ''}</a:CostType>
      <a:DateFrom>${
        toIsoDateTimeLiteral(DateFrom) || '0001-01-01T00:00:00'
      }</a:DateFrom>
      <a:DateTo>${
        toIsoDateTimeLiteral(DateTo) || '0001-01-01T00:00:00'
      }</a:DateTo>
      <a:DepartureDateTime>0001-01-01T00:00:00</a:DepartureDateTime>
      <a:DepartureLocation i:nil="true"/>
      <a:ExchangeCode i:nil="true"/>
      <a:HeaderRecId>0</a:HeaderRecId>
      <a:LineRecId>0</a:LineRecId>
      <a:MealReductionAmount i:nil="true"/>
      <a:Mileage>0</a:Mileage>
      <a:PersonnelNumber>${PersonnelNumber || ''}</a:PersonnelNumber>
      <a:Transaction>${
        toIsoDateTime(Transaction) || '0001-01-01T00:00:00'
      }</a:Transaction>
    </_contract>
  </getEstimatedAmountForPerDiem>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/${EXP_MGMT_LINES_GROUP}`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: `http://tempuri.org/${EXP_MGMT_LINES_CONTRACT}/getEstimatedAmountForPerDiem`,
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
      ]?.['result']?.['a:DFExpenseManagementLinesContract'];

    if (!rawData) {
      console.log('[ExpMgmt PERDIEM CALC] no data returned');
      return {claimedAmount: 0, exchangeCode: 'PKR', amountInPKR: 0};
    }

    const record = Array.isArray(rawData) ? rawData[0] : rawData;

    return {
      claimedAmount: parseFloat(record?.['a:ClaimedAmount']) || 0,
      exchangeCode: record?.['a:ExchangeCode'] || 'PKR',
      amountInPKR: parseFloat(record?.['a:AmountInPKR']) || 0,
    };
  } catch (err) {
    console.error(
      '[ExpMgmt PERDIEM CALC] SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {GetEstimatedAmountForPerDiemExpense};
