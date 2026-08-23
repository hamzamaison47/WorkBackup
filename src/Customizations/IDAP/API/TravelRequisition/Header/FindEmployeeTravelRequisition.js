/* eslint-disable curly */
/* eslint-disable dot-notation */
// Finds every travel requisition header for a worker.
//
// Operation: DFTravelRequisitionSvc/findEmployeeTravelRequisitionRecord
//   Group    : DFTravelRequisitionSvcGroup
//   Param    : <_workerRecId> (Int64) — the worker's RecId
//   Returns  : (Array of) a:DFTravelRequisitionContract
//
// NOTE: the operation namespace is "http://tempuri.org" with NO trailing slash.
// Do not add one.
//
// SCHEMA CHANGE: DFTravelRequisitionContract was originally decorated with
// [DataMemberAttribute] on the CLASS instead of [DataContractAttribute],
// which produced a malformed WSDL with a double element family
// (__k_parm-prefixed AND separate bare-lowercase elements for the same
// fields) and wrapped date objects ({_value, ruleId} instead of a plain
// dateTime string). That's why this file used to carry pick()/
// pickRequisitionDate()/pickWrappedDateTime() unwrapping logic.
//
// FIXED: the class is now properly decorated with [DataContractAttribute],
// producing a clean, standard schema — plain PascalCase element names
// (ApprovalStatus, Description, FromDate, HcmWorkerRecId, Location,
// NumberofDays, RecId, RequisitionDate, RequisitionNumber, TableId, ToDate,
// TotalEstimateWithCurrency, TravelType), with FromDate/ToDate/
// RequisitionDate now plain xs:dateTime (flat string values, no wrapper
// object). All the old unwrapping/dual-name-family logic is gone — this
// file now just picks the plain PascalCase names directly.
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../../Controller/secureConfig';

const FindEmployeeTravelRequisition = async workerRecId => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    if (!workerRecId) {
      throw new Error('Missing worker RecId for travel requisition find.');
    }

    const token = await getToken();

    const soapBody = `
      <findEmployeeTravelRequisitionRecord xmlns="http://tempuri.org">
        <_workerRecId>${workerRecId}</_workerRecId>
      </findEmployeeTravelRequisitionRecord>
    `;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const response = await axios.post(
      `${config.resource}soap/services/DFTravelRequisitionSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/DFTravelRequisitionSvc/findEmployeeTravelRequisitionRecord',
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

    // ── DIAGNOSTIC (instrumentation only — remove after wire shape confirmed) ──
    console.log(
      '[TravelReq FIND] raw XML first 2000 chars:',
      String(response.data).slice(0, 2000),
    );

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
        'findEmployeeTravelRequisitionRecordResponse'
      ];

    if (!responseBody) {
      console.log('No findEmployeeTravelRequisitionRecordResponse found');
      return [];
    }

    const result = responseBody.result;

    // 0-row case: result absent or empty object
    if (
      !result ||
      (typeof result === 'object' && Object.keys(result).length === 0)
    ) {
      console.log('Empty result - no travel requisition headers found');
      return [];
    }

    // The contract may be namespace-prefixed (a:) or bare depending on the
    // response serialization.
    const contracts =
      result['a:DFTravelRequisitionContract'] ||
      result['DFTravelRequisitionContract'];

    if (!contracts) {
      console.log('No DFTravelRequisitionContract data found');
      return [];
    }

    // Normalize single-element responses to an array
    const contractsArray = Array.isArray(contracts) ? contracts : [contracts];

    // ── DIAGNOSTIC (instrumentation only) ──
    console.log(
      '[TravelReq FIND] result node keys:',
      result ? Object.keys(result) : 'NO RESULT NODE',
    );
    console.log(
      '[TravelReq FIND] contracts count:',
      Array.isArray(contracts) ? contracts.length : contracts ? 1 : 0,
    );
    console.log(
      '[TravelReq FIND] first contract raw keys:',
      contractsArray?.[0] ? Object.keys(contractsArray[0]) : 'NONE',
    );
    console.log(
      '[TravelReq FIND] first contract JSON:',
      JSON.stringify(contractsArray?.[0] ?? {}),
    );

    // Field access helper — tolerates the a: namespace prefix. Plain
    // PascalCase names only now; no __k_parm/bare-lowercase fallback chain
    // needed against the new clean schema.
    const pick = (obj, name) =>
      obj?.['a:' + name] !== undefined ? obj['a:' + name] : obj?.[name];

    const toStr = value => {
      if (value === undefined || value === null) return '';
      if (typeof value === 'object') {
        return value['#text'] !== undefined ? String(value['#text']) : '';
      }
      return String(value);
    };

    const toInt = value => {
      const num = parseInt(toStr(value), 10);
      return isNaN(num) ? 0 : num;
    };

    const toDate = value => {
      const str = toStr(value);
      if (!str) return null;
      const date = new Date(str);
      return isNaN(date.getTime()) ? null : date;
    };

    // Wire member names are now plain PascalCase, matching the
    // DataMemberAttribute strings directly — output keys stay the same
    // PascalCase names (what the cards/save screen already read).
    const headers = contractsArray.map((contract, i) => {
      // ── DIAGNOSTIC (instrumentation only — first row) ──
      if (i === 0) {
        console.log('[TravelReq FIND] picks:', {
          RecId: pick(contract, 'RecId'),
          Location: pick(contract, 'Location'),
          RequisitionNumber: pick(contract, 'RequisitionNumber'),
          ApprovalStatus: pick(contract, 'ApprovalStatus'),
          TotalEstimateWithCurrency: pick(
            contract,
            'TotalEstimateWithCurrency',
          ),
          RequisitionDate: pick(contract, 'RequisitionDate'),
          TableId: pick(contract, 'TableId'),
          Description: pick(contract, 'Description'),
          FromDate: pick(contract, 'FromDate'),
          ToDate: pick(contract, 'ToDate'),
          NumberofDays: pick(contract, 'NumberofDays'),
          TravelType: pick(contract, 'TravelType'),
        });
      }
      return {
        RecId: toInt(pick(contract, 'RecId')),
        RequisitionNumber: toStr(pick(contract, 'RequisitionNumber')),
        Location: toStr(pick(contract, 'Location')),
        RequisitionDate: toDate(pick(contract, 'RequisitionDate')),
        ApprovalStatus: toStr(pick(contract, 'ApprovalStatus')),
        TotalEstimateWithCurrency: toStr(
          pick(contract, 'TotalEstimateWithCurrency'),
        ),
        TableId: toStr(pick(contract, 'TableId')),
        Description: toStr(pick(contract, 'Description')),
        // Kept as the raw ISO-ish string (not toDate()'d) — the save screen's
        // own parseLocalDateTimeString()/toLocalDateTimeString() convention
        // expects a YYYY-MM-DDTHH:MM:SS string, same as what it writes on
        // create, not a JS Date object.
        FromDate: toStr(pick(contract, 'FromDate')),
        ToDate: toStr(pick(contract, 'ToDate')),
        NumberofDays: toStr(pick(contract, 'NumberofDays')),
        TravelType: toStr(pick(contract, 'TravelType')),
        CreatedDateTime: toDate(pick(contract, 'CreatedDateTime')),
      };
    });

    return headers;
  } catch (err) {
    console.error('FindEmployeeTravelRequisition SOAP Error:', err.message);
    console.error('Error details:', err.response?.data || err.stack);
    throw err;
  }
};

export {FindEmployeeTravelRequisition};
