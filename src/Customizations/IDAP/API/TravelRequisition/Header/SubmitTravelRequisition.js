/* eslint-disable curly */
/* eslint-disable dot-notation */
// Submits a single travel requisition header to workflow by its RecId.
//
// Operation: DFTravelRequisitionSvc/submitTravelRequisitionByRecId
//   Group    : DFTravelRequisitionSvcGroup
//   Param    : <_recId> (Int64) — the header RecId
//   Returns  : a single GeneralContract → { IsSuccess, Message, RecId }
//
// NOTE: the operation namespace is "http://tempuri.org" with NO trailing slash.
// This is a NEW single-recId submit shape (no Medical analog); the response is
// parsed with the same GeneralContract mapper the create/delete calls use.
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

const SubmitTravelRequisition = async recId => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    if (!recId) {
      throw new Error('Missing travel requisition RecId for submit.');
    }

    const token = await getToken();

    const soapBody = `
      <submitTravelRequisitionByRecId xmlns="http://tempuri.org">
        <_recId>${recId}</_recId>
      </submitTravelRequisitionByRecId>
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
            'http://tempuri.org/DFTravelRequisitionSvc/submitTravelRequisitionByRecId',
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
      parsed?.['s:Envelope']?.['s:Body']?.[
        'submitTravelRequisitionByRecIdResponse'
      ]?.['result'];

    if (!result) {
      return {
        success: false,
        message: 'No response returned from server.',
        RecId: '',
      };
    }

    // Single GeneralContract may be namespace-prefixed or bare.
    const contract =
      result?.['a:GeneralContract'] || result?.['GeneralContract'] || result;

    const isSuccess = toBoolean(pick(contract, 'IsSuccess'));

    return {
      success: isSuccess,
      message: toStr(pick(contract, 'Message')),
      RecId: toStr(pick(contract, 'RecId')),
    };
  } catch (err) {
    console.error('SubmitTravelRequisition SOAP Error:', err.message);
    console.error('Error details:', err.response?.data || err.stack);
    return {
      success: false,
      message: err?.message || 'Error submitting travel requisition.',
      RecId: '',
    };
  }
};

export {SubmitTravelRequisition};
