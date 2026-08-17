/* eslint-disable curly */
/* eslint-disable dot-notation */
// Finds every travel requisition LINE for a header.
//
// Operation: DFTravelRequisitionLinesSvc/findEmployeeTravelRequisitionLinesRecord
//   Group    : DFTravelRequisitionLinesSvcGroup
//   Param    : <_recId> (Int64) — the parent header RecId
//   Returns  : (Array of) a:DFTravelRequisitionLinesContract
//
// NOTE: the operation namespace is "http://tempuri.org" with NO trailing slash.
// Do not add one.
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../../Controller/secureConfig';

const FindTravelRequisitionLines = async headerRecId => {
  try {
    // ── DIAGNOSTIC (instrumentation only) — the sent <_recId> param ──
    console.log(
      '[TravelReqLines FIND] received _recId param:',
      headerRecId,
      typeof headerRecId,
    );

    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // NOTE: the operation namespace is "http://tempuri.org" with NO trailing
    // slash. Do not add one.
    const soapBody = `
      <findEmployeeTravelRequisitionLinesRecord xmlns="http://tempuri.org">
        <_recId>${headerRecId}</_recId>
      </findEmployeeTravelRequisitionLinesRecord>
    `;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const response = await axios.post(
      `${config.resource}soap/services/DFTravelRequisitionLinesSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/DFTravelRequisitionLinesSvc/findEmployeeTravelRequisitionLinesRecord',
        },
        responseType: 'text',
        timeout: 30000,
      },
    );

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      parseTagValue: false,
      trimValues: true,
      alwaysCreateTextNode: false,
      allowBooleanAttributes: false,
      parseAttributeValue: false,
    });

    const parsed = parser.parse(response.data);

    // Check for SOAP fault
    if (parsed?.['s:Envelope']?.['s:Body']?.['s:Fault']) {
      const fault = parsed['s:Envelope']['s:Body']['s:Fault'];
      const faultReason =
        fault.faultstring || fault.Reason?.Text || 'Unknown SOAP fault';
      throw new Error(`SOAP Fault: ${faultReason}`);
    }

    // Extract response data
    const responseBody =
      parsed?.['s:Envelope']?.['s:Body']?.[
        'findEmployeeTravelRequisitionLinesRecordResponse'
      ];

    if (!responseBody) {
      console.log('No findEmployeeTravelRequisitionLinesRecordResponse found');
      return [];
    }

    const result = responseBody.result;

    // 0-row case: result absent or empty object
    if (
      !result ||
      (typeof result === 'object' && Object.keys(result).length === 0)
    ) {
      console.log('Empty result - no travel requisition lines found');
      return [];
    }

    // The contract may be namespace-prefixed (a:) or bare depending on the
    // response serialization.
    const contracts =
      result['a:DFTravelRequisitionLinesContract'] ||
      result['DFTravelRequisitionLinesContract'];

    if (!contracts) {
      console.log('No DFTravelRequisitionLinesContract data found');
      return [];
    }

    // Normalize single-element responses to an array
    const contractsArray = Array.isArray(contracts) ? contracts : [contracts];

    // Field access helper — tolerates the a: namespace prefix
    const pick = (obj, name) =>
      obj?.['a:' + name] !== undefined ? obj['a:' + name] : obj?.[name];

    const toStr = value => {
      if (value === undefined || value === null) return '';
      if (typeof value === 'object') {
        return value['#text'] !== undefined ? String(value['#text']) : '';
      }
      return String(value);
    };

    const toNumber = value => {
      const num = parseFloat(toStr(value));
      return isNaN(num) ? 0 : num;
    };

    const toInt = value => {
      const num = parseInt(toStr(value), 10);
      return isNaN(num) ? 0 : num;
    };

    const toDate = value => {
      const str = toStr(value);
      if (!str) return null;

      const match = str.match(
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/,
      );
      if (!match) return null;

      const [, year, month, day, hours, minutes, seconds] = match;
      const date = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hours),
        Number(minutes),
        Number(seconds),
      );

      return isNaN(date.getTime()) ? null : date;
    };

    console.log('[TravelReqLines FIND] raw SOAP response:', response.data);

    // On find, RecId is the line's OWN id. AmountInPKR is the read-only
    // accounting-currency (PKR) value — display only, never sent on create.
    const lines = contractsArray.map(contract => ({
      RecId: toInt(pick(contract, 'RecId')),
      Category: toStr(pick(contract, 'Category')),
      EstimatedDate: toDate(pick(contract, 'EstimatedDate')),
      EstimatedAmount: toNumber(pick(contract, 'EstimatedAmount')),
      Currency: toStr(pick(contract, 'Currency')),
      AmountInPKR: toNumber(pick(contract, 'AmountInPKR')),
      AirlineServiceClass: toStr(pick(contract, 'AirlineServiceClass')),
      Mileage: toNumber(pick(contract, 'Mileage')),
      PerDiemFromDate: toDate(pick(contract, 'PerDiemFromDate')),
      PerDiemToDate: toDate(pick(contract, 'PerDiemToDate')),
    }));

    return lines;
  } catch (err) {
    console.error('FindTravelRequisitionLines SOAP Error:', err.message);
    console.error('Error details:', err.response?.data || err.stack);
    throw err;
  }
};

export {FindTravelRequisitionLines};
