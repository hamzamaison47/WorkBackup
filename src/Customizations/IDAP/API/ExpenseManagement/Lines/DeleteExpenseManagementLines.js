/* eslint-disable curly */
/* eslint-disable quotes */
/* eslint-disable dot-notation */
// Bulk-deletes Expense Management LINES by line RecId.
//
// Operation: delete(_recordsRecId: Int64[]) → GeneralContract[]
//
// The Int64[] serialization (b:long + the Serialization/Arrays namespace) is
// copied verbatim from the working DeleteExpenseManagementHeader.
//
// Response shape (ArrayOfGeneralContract): the FIRST element is a SUMMARY row
// (RecId=0, Message="N Record(s) Deleted & M Record(s) failed", IsSuccess=false
// if any failed). Subsequent elements are per-record. The summary drives the
// toast; the per-record failures are returned so the list page can keep the
// failed rows selected for a retry.
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../../Controller/secureConfig';
import {EXP_MGMT_LINES_CONTRACT, EXP_MGMT_LINES_GROUP} from './serviceConfig';

// Tolerates the a: datacontract namespace prefix on GeneralContract elements.
const pick = (obj, name) =>
  obj?.['a:' + name] !== undefined ? obj['a:' + name] : obj?.[name];

const toStr = value => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object')
    return value['#text'] !== undefined ? String(value['#text']) : '';
  return String(value);
};

const toBoolean = value => {
  const str = toStr(value).toLowerCase();
  return str === 'true' || str === '1';
};

const normalizeContract = contract => ({
  IsSuccess: toBoolean(pick(contract, 'IsSuccess')),
  Message: toStr(pick(contract, 'Message')),
  RecId: toStr(pick(contract, 'RecId')),
});

const DeleteExpenseManagementLines = async recIds => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const ids = Array.isArray(recIds) ? recIds : [recIds];
    const cleanIds = ids.filter(
      id => id !== undefined && id !== null && id !== '',
    );

    if (cleanIds.length === 0) {
      return {
        IsSuccess: false,
        Message: 'No records to delete.',
        failures: [],
      };
    }

    const token = await getToken();

    // Int64[] via the Serialization/Arrays namespace (same as the header delete).
    const longsXml = cleanIds.map(id => `<b:long>${id}</b:long>`).join('');

    const soapBody =
      `<delete xmlns="http://tempuri.org">` +
      `<_recordsRecId xmlns:b="http://schemas.microsoft.com/2003/10/Serialization/Arrays">` +
      `${longsXml}` +
      `</_recordsRecId>` +
      `</delete>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const response = await axios.post(
      `${config.resource}soap/services/${EXP_MGMT_LINES_GROUP}`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: `http://tempuri.org/${EXP_MGMT_LINES_CONTRACT}/delete`,
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

    if (parsed?.['s:Envelope']?.['s:Body']?.['s:Fault']) {
      const fault = parsed['s:Envelope']['s:Body']['s:Fault'];
      const faultReason =
        fault.faultstring || fault.Reason?.Text || 'Unknown SOAP fault';
      throw new Error(`SOAP Fault: ${faultReason}`);
    }

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['deleteResponse']?.['result'];

    const rawContracts =
      result?.['a:GeneralContract'] || result?.['GeneralContract'];

    if (!rawContracts) {
      return {
        IsSuccess: false,
        Message: 'No response returned from server.',
        failures: [],
      };
    }

    const contracts = Array.isArray(rawContracts)
      ? rawContracts
      : [rawContracts];

    const normalized = contracts.map(normalizeContract);

    // Element 0 is the summary; the rest are per-record.
    const summary = normalized[0];
    const failures = normalized.slice(1).filter(c => c.IsSuccess === false);

    return {
      IsSuccess: summary.IsSuccess,
      Message: summary.Message || 'Delete completed.',
      failures,
    };
  } catch (err) {
    console.error(
      'DeleteExpenseManagementLines SOAP error:',
      err.response?.data || err.message,
    );
    return {
      IsSuccess: false,
      Message: err?.message || 'Error deleting expense line(s).',
      failures: [],
    };
  }
};

export {DeleteExpenseManagementLines};
