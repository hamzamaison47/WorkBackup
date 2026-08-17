/* eslint-disable quotes */
/* eslint-disable curly */
/* eslint-disable dot-notation */
// Lookup feeding the "Map to Travel Requisition" dropdown on the expense header
// create form.
//
// Operation: retrieveMapTravelRequisitions(_employeeId: String)
//            → DFExpenseManagementHeaderContract[]
//
// CONFIRMED against the AIF operation metadata (GET on
// /api/services/DFExpenseManagementHeaderSvcGroup/DFExpenseManagementHeaderSvc/
// retrieveMapTravelRequisitions):
//   - param name/type  : _employeeId (String)            ✅ matches this file
//   - return type      : DFExpenseManagementHeaderContract[]  ✅ matches this file
// NOT confirmed by that metadata (it only describes the operation signature,
// not the live SOAP payload):
//   - the SOAP array-wrapper element name (still assumed a:DFExpenseManagementHeaderContract)
//   - which DataMember actually carries the travel-requisition identifier/label
//   - which DataMember carries the travel-requisition amount
//
// ── ⚠️ KNOWN BACKEND FAULT — THE CLIENT SIDE HERE IS CORRECT. DO NOT "FIX" IT ──
// This lookup returns nothing today, and no change in this file will alter that.
//
// What the backend does: HcmWorker::findByPersonnelNumber(_employeeId) — so
// _employeeId MUST be the personnel number ("M102"). That is exactly what we
// send (SEND_WORKER_REC_ID = false). CONFIRMED CORRECT against the X++ source.
//
// The two live results, and what they actually meant:
//   - workerRecId (5637159577) → zero rows. Not a type problem: the RecId is
//     simply not a personnel number, so findByPersonnelNumber matched no worker.
//     This is why the toggle below must stay false.
//   - personnel number ("M102") → InfoException, "Error executing code: Wrong
//     argument type for function." This fault is thrown DEEPER in the X++, in
//     the position/grade chain (getPrimaryPosition → findByPosition →
//     SLD_HRHRMSGrade), most likely because worker M102 has no primary position
//     or HRMS grade assigned — or a bug in that chain. It is NOT about the value
//     we pass.
//
// => The dropdown stays EMPTY until the D365 team fixes that backend chain. The
//    [ExpMgmt MAPTRV] logs below are kept precisely so we can confirm rows start
//    coming back once they do. Resist the temptation to flip this toggle or
//    widen the field-picking again: both were already tried and neither is the
//    problem.
const SEND_WORKER_REC_ID = false;
//
// ── DISPLAY / STORED FIELD STILL NOT CONFIRMED ──
// The D365 "New expense report" panel shows a *separate*, greyed-out
// "Travel requisition amount" box next to the "Map to travel requisition"
// dropdown — i.e. picking a requisition populates an amount, it isn't
// typed by the user. So this lookup now also tries to surface an amount
// per row (best-effort, same "first non-empty candidate wins" strategy as
// the label), so the save screen can display/populate it once the real
// field name is confirmed from the [ExpMgmt MAPTRV] log below.
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../../Controller/secureConfig';
import {EXP_MGMT_HEADER_CONTRACT, EXP_MGMT_HEADER_GROUP} from './serviceConfig';

// CONFIRMED from the backend: it populates the lookup contract with exactly one
// value — newcontract.parmMapToTravelRequisition(newView.Name) — so the name is
// both what we display and what we store back on create()'s
// MapToTravelRequisition. No amount is returned on this lookup (an earlier
// guess at a "Travel requisition amount" box has been dropped from the form).
const LABEL_FIELD = 'MapToTravelRequisition';

const escapeXml = value =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const toStr = value => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') {
    if (value['#text'] !== undefined) return String(value['#text']);
    return '';
  }
  return String(value);
};

// Strips the a: namespace prefix and the __k_parm serialization prefix so the
// caller sees plain DataMember names regardless of which shape the wire uses.
const cleanContract = raw =>
  Object.fromEntries(
    Object.entries(raw || {}).map(([key, value]) => [
      key.replace(/^a:/, '').replace(/^__k_parm/, ''),
      toStr(value),
    ]),
  );

const labelOf = row => (row?.[LABEL_FIELD] ? String(row[LABEL_FIELD]) : '');

const RetrieveMapTravelRequisitions = async ({employeeId, workerRecId}) => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    // See header comment: the live fault ("Wrong argument type for function")
    // points at this op wanting a numeric WorkerRecId under the _employeeId
    // tag, not the personnel-number string. Pick per the toggle, but don't
    // silently swallow a missing value either way.
    const valueToSend = SEND_WORKER_REC_ID ? workerRecId : employeeId;

    if (!valueToSend) {
      console.log(
        `[ExpMgmt MAPTRV] no ${
          SEND_WORKER_REC_ID ? 'workerRecId' : 'employeeId'
        } supplied — returning []`,
      );
      return [];
    }

    // ── DIAGNOSTIC (keep until the fault is confirmed fixed) ──
    console.log(
      '[ExpMgmt MAPTRV] sending _employeeId as:',
      SEND_WORKER_REC_ID ? 'workerRecId' : 'employeeId',
      '=',
      valueToSend,
    );

    const token = await getToken();

    const soapBody =
      `<retrieveMapTravelRequisitions xmlns="http://tempuri.org">` +
      `<_employeeId>${escapeXml(valueToSend)}</_employeeId>` +
      `</retrieveMapTravelRequisitions>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const response = await axios.post(
      `${config.resource}soap/services/${EXP_MGMT_HEADER_GROUP}`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: `http://tempuri.org/${EXP_MGMT_HEADER_CONTRACT}/retrieveMapTravelRequisitions`,
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
      parseAttributeValue: false,
    });

    const parsed = parser.parse(response.data);

    if (parsed?.['s:Envelope']?.['s:Body']?.['s:Fault']) {
      const fault = parsed['s:Envelope']['s:Body']['s:Fault'];
      throw new Error(`SOAP Fault: ${fault.faultstring || 'Unknown fault'}`);
    }

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.[
        'retrieveMapTravelRequisitionsResponse'
      ]?.['result'];

    if (!result) {
      console.log('[ExpMgmt MAPTRV] no result node');
      return [];
    }

    let contracts =
      result['a:DFExpenseManagementHeaderContract'] ??
      result['DFExpenseManagementHeaderContract'] ??
      null;

    if (!contracts) {
      console.log('[ExpMgmt MAPTRV] result node had no contracts:', result);
      return [];
    }
    if (!Array.isArray(contracts)) contracts = [contracts];

    // ── DIAGNOSTIC (keep until the display/amount fields are pinned) ──
    console.log('[ExpMgmt MAPTRV] count:', contracts.length);
    console.log(
      '[ExpMgmt MAPTRV] raw keys:',
      contracts[0] ? Object.keys(contracts[0]) : 'NONE',
    );
    console.log(
      '[ExpMgmt MAPTRV] first contract raw:',
      JSON.stringify(contracts[0] ?? {}),
    );

    const cleaned = contracts.map(cleanContract);

    // ── DIAGNOSTIC (keep until the backend fault is fixed and rows come back) ──
    console.log(
      '[ExpMgmt MAPTRV] first contract cleaned:',
      JSON.stringify(cleaned[0] ?? {}),
    );
    console.log(
      '[ExpMgmt MAPTRV] resolved label sample:',
      JSON.stringify({label: labelOf(cleaned[0] ?? {})}),
    );

    // label === value: the backend puts the requisition Name on
    // MapToTravelRequisition, and that same name is what create() stores back.
    return cleaned.map(row => ({
      label: labelOf(row),
      value: row.RequisitionNumber
        ? String(row.RequisitionNumber)
        : labelOf(row),
      requisitionNumber: row.RequisitionNumber
        ? String(row.RequisitionNumber)
        : '',
      raw: row,
    }));
  } catch (err) {
    console.error(
      '[ExpMgmt MAPTRV] RetrieveMapTravelRequisitions SOAP error:',
      err.response?.data || err.message,
    );
    return [];
  }
};

export {RetrieveMapTravelRequisitions};
