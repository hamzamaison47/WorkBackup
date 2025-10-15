/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const SVC_GROUP = 'EssWorkflowSvcGroup';
const SOAP_ACTION =
  'http://tempuri.org/ESSWorkflowSvc/submitEmployeeAdjustment';

const truthy = v => {
  if (v === true) return true;
  const s = String(v ?? '')
    .trim()
    .toLowerCase();
  return s === 'true' || s === '1' || s === 'yes';
};

const SubmitAdjustment = async ({recIds}) => {
  try {
    const config = await getActiveConfigData();
    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }
    if (!recIds || !Array.isArray(recIds) || recIds.length === 0) {
      throw new Error('recIds required');
    }

    const token = await getToken();

    const soapBody = `
      <submitEmployeeAdjustment xmlns="http://tempuri.org">
        <_requestList xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
          ${recIds.map(x => `<a:long>${Number(x)}</a:long>`).join('')}
        </_requestList>
      </submitEmployeeAdjustment>
    `;
    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/${SVC_GROUP}`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml; charset=utf-8',
          SOAPAction: SOAP_ACTION,
        },
        responseType: 'text',
        timeout: 30000,
      },
    );

    const parsed = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: false,
    }).parse(xml);

    const body =
      parsed?.['s:Envelope']?.['s:Body'] ||
      parsed?.['soap:Envelope']?.['soap:Body'] ||
      {};
    const fault = body?.['s:Fault'] || body?.['soap:Fault'];
    if (fault) throw new Error(fault.faultstring || 'SOAP Fault occurred');

    const resp =
      body.submitEmployeeAdjustmentResponse ||
      body['submitEmployeeAdjustmentResponse'] ||
      {};
    const resultNode =
      resp.submitEmployeeAdjustmentResult ||
      resp['submitEmployeeAdjustmentResult'] ||
      resp.result ||
      resp['result'] ||
      resp;

    // Normalize namespaces off keys
    const stripNs = obj => {
      if (!obj || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(stripNs);
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [
          k.replace(/^[a-zA-Z0-9]+:/, ''),
          stripNs(v),
        ]),
      );
    };
    const cleaned = stripNs(resultNode);

    // Accept both single and array shapes
    let items =
      cleaned?.ArrayOfGeneralContract?.GeneralContract ??
      cleaned?.GeneralContract ??
      cleaned;

    // If it's a single object, make it an array
    if (items && !Array.isArray(items) && typeof items === 'object') {
      items = [items];
    }

    // If we still can't see items, fall back to direct flags (legacy)
    if (!Array.isArray(items)) {
      const isSuccess = truthy(cleaned?.IsSuccess || cleaned?.isSuccess);
      const message = cleaned?.Message || cleaned?.message || '';
      return {IsSuccess: isSuccess, isSuccess, Message: message, raw: cleaned};
    }

    // Map all GeneralContract items
    const mapped = items.map(it => ({
      isSuccess: truthy(it?.IsSuccess ?? it?.isSuccess),
      message: it?.Message ?? it?.message ?? '',
      recId: it?.RecId ?? it?.recId ?? it?.RecordId ?? it?.recordId ?? null,
    }));

    // Convention: first item is the summary (as per your X++ code)
    const summary = mapped[0] || {isSuccess: false, message: ''};

    // Aggregate: if any non-summary item failed, overall fail; else use summary
    const detail = mapped.slice(1);
    const anyFail = detail.some(x => x.isSuccess === false);

    const isSuccess = summary.isSuccess && !anyFail;
    const message =
      summary.message ||
      (isSuccess ? 'Submitted successfully' : 'Some records failed to submit');

    return {
      IsSuccess: isSuccess,
      isSuccess,
      Message: message,
      details: mapped,
      raw: cleaned,
    };
  } catch (error) {
    console.error(
      '❌ SubmitAdjustment failed:',
      error?.response?.data || error?.message,
    );
    throw error;
  }
};

export {SubmitAdjustment};
