/* eslint-disable curly */
/* eslint-disable quotes */
/* eslint-disable dot-notation */
// Find API — New Expense Management HEADERS.
// findExpenseManagementHeaders(_personnelNumber: String) → DFExpenseManagementHeaderContract[]
// Record id member is HeaderRecId (NOT RecId).
//
// PERSONNEL NUMBER: the find is keyed on _personnelNumber. userData has no
// explicit personnelNumber field; employeeId is the D365 HcmWorker personnel
// number (HcmPersonnelNumberId), so the caller passes employeeId here. Confirm
// via the [ExpMgmt FIND] log on first run — if empty, try Person instead.
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../../Controller/secureConfig';

const escapeXml = value =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

// Tolerates a: prefix; reads bare-lowercase form first, then __k_parm form,
// matching the doubled wire shape seen on Travel.
const pick = (obj, name) => {
  if (!obj) return undefined;
  const lower = name.charAt(0).toLowerCase() + name.slice(1);
  if (obj['a:' + lower] !== undefined) return obj['a:' + lower];
  if (obj[lower] !== undefined) return obj[lower];
  if (obj['a:' + name] !== undefined) return obj['a:' + name];
  if (obj[name] !== undefined) return obj[name];
  if (obj['a:__k_parm' + name] !== undefined) return obj['a:__k_parm' + name];
  if (obj['__k_parm' + name] !== undefined) return obj['__k_parm' + name];
  return undefined;
};

const toStr = value => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') {
    if (value['#text'] !== undefined) return String(value['#text']);
    if (value['b:_value'] !== undefined) return String(value['b:_value']);
    return '';
  }
  return String(value);
};

const GetAllExpenseManagementHeaders = async ({
  personnelNumber,
  purpose = '',
}) => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }
    if (!personnelNumber) {
      console.log(
        'GetAllExpenseManagementHeaders: No personnelNumber provided',
      );
      return [];
    }
    console.log('here is data,', personnelNumber, purpose);

    const token = await getToken();

    const soapBody =
      `<findExpenseManagementHeaders xmlns="http://tempuri.org">` +
      `<_personnelNumber>${escapeXml(personnelNumber)}</_personnelNumber>` +
      `<_purpose>${escapeXml(purpose)}</_purpose>` +
      `</findExpenseManagementHeaders>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    console.log('GetAllExpenseManagementHeaders: SOAP request:', soapEnvelope);

    const response = await axios.post(
      `${config.resource}soap/services/DFExpenseManagementHeaderSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/DFExpenseManagementHeaderSvcNewAgain/findExpenseManagementHeaders',
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

    console.log('GetAllExpenseManagementHeaders: SOAP response:', parsed);

    // ── DIAGNOSTIC (remove after confirmed) ──
    console.log(
      '[ExpMgmt FIND] raw first 2000:',
      String(response.data).slice(0, 2000),
    );

    if (parsed?.['s:Envelope']?.['s:Body']?.['s:Fault']) {
      const fault = parsed['s:Envelope']['s:Body']['s:Fault'];
      throw new Error(`SOAP Fault: ${fault.faultstring || 'Unknown fault'}`);
    }

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.[
        'findExpenseManagementHeadersResponse'
      ]?.['result'];

    if (!result) {
      console.log('[ExpMgmt FIND] no result node');
      return [];
    }

    let contracts =
      result['a:DFExpenseManagementHeaderContract'] ??
      result['DFExpenseManagementHeaderContract'] ??
      null;

    if (!contracts) return [];
    if (!Array.isArray(contracts)) contracts = [contracts];

    // ── DIAGNOSTIC (remove after confirmed) ──
    console.log('[ExpMgmt FIND] count:', contracts.length);
    console.log(
      '[ExpMgmt FIND] first contract keys:',
      contracts[0] ? Object.keys(contracts[0]) : 'NONE',
    );
    console.log(
      '[ExpMgmt FIND] first contract JSON:',
      JSON.stringify(contracts[0] ?? {}),
    );

    return contracts.map((raw, i) => {
      const mapped = {
        HeaderRecId: toStr(pick(raw, 'HeaderRecId')),
        ExpenseNumber: toStr(pick(raw, 'ExpenseNumber')),
        ApprovalStatus: toStr(pick(raw, 'ApprovalStatus')),
        Location: toStr(pick(raw, 'Location')),
        Amount: toStr(pick(raw, 'Amount')),
        CreatedDateTime: toStr(pick(raw, 'CreatedDateTime')),
        HasReceiptAttached: toStr(pick(raw, 'HasReceiptAttached')),
        PaymentDate: toStr(pick(raw, 'PaymentDate')),
        PaymentVoucher: toStr(pick(raw, 'PaymentVoucher')),
        InvoiceId: toStr(pick(raw, 'InvoiceId')),
        MapToTravelRequisition: toStr(pick(raw, 'MapToTravelRequisition')),
        DateFrom: toStr(pick(raw, 'DateFrom')),
        DateTo: toStr(pick(raw, 'DateTo')),
        PersonnelNumber: toStr(pick(raw, 'PersonnelNumber')),
        TableId: toStr(pick(raw, 'TableId')), // ← was missing, needed by handleViewHistory
        // Added for Medical edit-mode prefill (MedicalExpenseManagementSaveRecord).
        // DataMember names on DFExpenseManagementHeaderContract are literally
        // "SLD_CostType" / "SLD_MonthOfYear" (not camelCase like the other
        // fields), so pick() finds them via its exact-name fallback branch.
        SLD_CostType: toStr(pick(raw, 'SLD_CostType')),
        SLD_MonthOfYear: toStr(pick(raw, 'SLD_MonthOfYear')),
        RequisitionNumber: toStr(pick(raw, 'RequisitionNumber')),
      };
      // ── DIAGNOSTIC (remove after confirmed) ──
      if (i === 0) {
        console.log('[ExpMgmt FIND] picks row0:', JSON.stringify(mapped));
      }
      return mapped;
    });
  } catch (err) {
    console.error(
      'GetAllExpenseManagementHeaders SOAP error:',
      err.response?.data || err.message,
    );
    return [];
  }
};

export {GetAllExpenseManagementHeaders};
