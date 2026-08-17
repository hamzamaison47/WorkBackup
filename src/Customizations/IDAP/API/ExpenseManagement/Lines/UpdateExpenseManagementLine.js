/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../../Controller/secureConfig';

// Calls DFExpenseManagementLinesSvcNew.update.
// The backend's updateRecord() keys off contract.parmLineRecId() and only
// applies a field if it was actually provided (truthy) — same "partial
// patch" semantics as the X++ update() shown in the service class. Element
// order inside <contract> MUST stay alphabetical to match the service
// contract's xs:sequence — do not reorder.
const UpdateExpenseManagementLine = async ({
  LineRecId,
  HeaderRecId,
  CostType,
  Transaction,
  ClaimedAmount,
  AmountCurr, // ← new
  ExchangeCode,
  DateFrom,
  DateTo,
  DepartureLocation,
  DepartureDateTime,
  ArrivalLocation,
  ArrivalDateTime,
  Mileage,
  AmountInPKR,
  MealReductionAmount,
  PersonnelNumber,
}) => {
  try {
    const config = await getActiveConfigData();
    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const lineRecId = Number(LineRecId) || 0;
    const headerRecId = Number(HeaderRecId) || 0;

    const esc = v =>
      (v ?? '')
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const soapBody = `
  <update xmlns="http://tempuri.org">
    <contract xmlns:a="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
      <a:AmountCurr>${AmountCurr || 0}</a:AmountCurr>
      <a:AmountInPKR>${AmountInPKR || 0}</a:AmountInPKR>
      <a:ArrivalDateTime>${
        ArrivalDateTime || '0001-01-01T00:00:00'
      }</a:ArrivalDateTime>
      <a:ArrivalLocation>${esc(ArrivalLocation)}</a:ArrivalLocation>
      <a:ClaimedAmount>${ClaimedAmount || 0}</a:ClaimedAmount>
      <a:CostType>${esc(CostType)}</a:CostType>
      <a:DateFrom>${DateFrom || '0001-01-01T00:00:00'}</a:DateFrom>
      <a:DateTo>${DateTo || '0001-01-01T00:00:00'}</a:DateTo>
      <a:DepartureDateTime>${
        DepartureDateTime || '0001-01-01T00:00:00'
      }</a:DepartureDateTime>
      <a:DepartureLocation>${esc(DepartureLocation)}</a:DepartureLocation>
      <a:ExchangeCode>${esc(ExchangeCode)}</a:ExchangeCode>
      <a:HeaderRecId>${headerRecId}</a:HeaderRecId>
      <a:LineRecId>${lineRecId}</a:LineRecId>
      <a:MealReductionAmount>${esc(MealReductionAmount)}</a:MealReductionAmount>
      <a:Mileage>${Mileage || 0}</a:Mileage>
      <a:PersonnelNumber>${esc(PersonnelNumber)}</a:PersonnelNumber>
      <a:Transaction>${Transaction || '0001-01-01T00:00:00'}</a:Transaction>
    </contract>
  </update>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/DFExpenseManagementLinesSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/DFExpenseManagementLinesSvcNew/update',
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

    return {
      IsSuccess:
        rawData['a:IsSuccess'] === 'true' || rawData['a:IsSuccess'] === true,
      Message: rawData['a:Message'] || '',
      RecId: parseFloat(rawData['a:RecId']) || 0,
    };
  } catch (err) {
    console.error(
      'UpdateExpenseManagementLine SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {UpdateExpenseManagementLine};
