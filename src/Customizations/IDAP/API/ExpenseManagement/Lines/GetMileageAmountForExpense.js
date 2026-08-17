/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../../Controller/secureConfig';
import {EXP_MGMT_LINES_CONTRACT, EXP_MGMT_LINES_GROUP} from './serviceConfig';

// Calls DFExpenseManagementLinesSvcNew.getMileageAmountForExpense.
// Transaction must default to TODAY, not epoch — calculateMileage() /
// calcMultiTierMileageAmount() use year(TransDate) to look up the worker's
// YTD km sum for tiered rates; an epoch fallback would silently zero that out.
// PersonnelNumber is REQUIRED for the same reason (tier consumption is
// per-worker) — X++ resolves it via HcmWorker::findByPersonnelNumber().
// Element order inside <_contract> MUST stay alphabetical to match the
// service contract's xs:sequence — do not reorder.
const GetMileageAmountForExpense = async ({
  CostType,
  Mileage,
  PersonnelNumber,
  Transaction,
}) => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const transaction =
      Transaction || new Date().toISOString().split('T')[0] + 'T00:00:00';

    const soapBody = `
  <getMileageAmountForExpense xmlns="http://tempuri.org">
    <_contract xmlns:a="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
      <a:AmountInPKR>0</a:AmountInPKR>
      <a:ArrivalDateTime>0001-01-01T00:00:00</a:ArrivalDateTime>
      <a:ArrivalLocation i:nil="true"/>
      <a:ClaimedAmount>0</a:ClaimedAmount>
      <a:CostType>${CostType || ''}</a:CostType>
      <a:DateFrom>0001-01-01T00:00:00</a:DateFrom>
      <a:DateTo>0001-01-01T00:00:00</a:DateTo>
      <a:DepartureDateTime>0001-01-01T00:00:00</a:DepartureDateTime>
      <a:DepartureLocation i:nil="true"/>
      <a:ExchangeCode i:nil="true"/>
      <a:HeaderRecId>0</a:HeaderRecId>
      <a:LineRecId>0</a:LineRecId>
      <a:MealReductionAmount i:nil="true"/>
      <a:Mileage>${Mileage || 0}</a:Mileage>
      <a:PersonnelNumber>${PersonnelNumber || ''}</a:PersonnelNumber>
      <a:Transaction>${transaction}</a:Transaction>
    </_contract>
  </getMileageAmountForExpense>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/${EXP_MGMT_LINES_GROUP}`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: `http://tempuri.org/${EXP_MGMT_LINES_CONTRACT}/getMileageAmountForExpense`,
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
        'getMileageAmountForExpenseResponse'
      ]?.['result']?.['a:DFExpenseManagementLinesContract'];

    if (!rawData) {
      console.log('[ExpMgmt MILEAGE CALC] no data returned');
      return {claimedAmount: 0, amountInPKR: 0};
    }

    const record = Array.isArray(rawData) ? rawData[0] : rawData;

    return {
      claimedAmount: parseFloat(record?.['a:ClaimedAmount']) || 0,
      amountInPKR: parseFloat(record?.['a:AmountInPKR']) || 0,
    };
  } catch (err) {
    console.error(
      '[ExpMgmt MILEAGE CALC] SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {GetMileageAmountForExpense};
