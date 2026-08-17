/* eslint-disable curly */
/* eslint-disable dot-notation */
// Bulk-deletes travel requisition lines by line RecId.
//
// NOTE: the operation namespace is "http://tempuri.org" with NO trailing slash.
//
// Response shape (ArrayOfGeneralContract): the FIRST element is a SUMMARY row
// (RecId=0, Message="N Record(s) Deleted & M Record(s) failed", IsSuccess=false
// if any failed). Subsequent elements are per-record. The summary drives the
// toast; per-record entries are only surfaced on failure.
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../../Controller/secureConfig';

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

const DeleteTravelRequisitionLines = async recIds => {
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
      throw new Error('No record ids supplied for delete.');
    }

    const token = await getToken();

    const longsXml = cleanIds.map(id => `<a:long>${id}</a:long>`).join('');

    const soapBody = `
      <delete xmlns="http://tempuri.org">
        <_recordsRecId xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
          ${longsXml}
        </_recordsRecId>
      </delete>
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
            'http://tempuri.org/DFTravelRequisitionLinesSvc/delete',
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

    // SOAP fault
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

    // First element is the summary; the rest are per-record.
    const summary = normalized[0];
    const perRecord = normalized.slice(1);
    const failures = perRecord.filter(c => c.IsSuccess === false);

    return {
      IsSuccess: summary.IsSuccess,
      Message: summary.Message,
      failures,
    };
  } catch (err) {
    console.error('DeleteTravelRequisitionLines SOAP Error:', err.message);
    console.error('Error details:', err.response?.data || err.stack);
    return {
      IsSuccess: false,
      Message: err?.message || 'Error deleting travel requisition line(s).',
      failures: [],
    };
  }
};

export {DeleteTravelRequisitionLines};
