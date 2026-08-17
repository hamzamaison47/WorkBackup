/* eslint-disable curly */
/* eslint-disable quotes */
/* eslint-disable dot-notation */
// Delete Expense Management HEADERS.
// delete(_recordsRecId: Int64[]) → GeneralContract[]  (element[0] = summary)
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../../Controller/secureConfig';
import {EXP_MGMT_HEADER_CONTRACT, EXP_MGMT_HEADER_GROUP} from './serviceConfig';

const pick = (obj, name) =>
  obj?.['a:' + name] !== undefined ? obj['a:' + name] : obj?.[name];

const toStr = value => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object')
    return value['#text'] !== undefined ? String(value['#text']) : '';
  return String(value);
};

const DeleteExpenseManagementHeader = async ({recordsRecId}) => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }
    if (!recordsRecId || recordsRecId.length === 0) {
      return {success: false, message: 'No records to delete.'};
    }

    const token = await getToken();

    // Int64[] via the Serialization/Arrays namespace (same as Travel delete).
    const ids = recordsRecId.map(id => `<b:long>${id}</b:long>`).join('');

    const soapBody =
      `<delete xmlns="http://tempuri.org">` +
      `<_recordsRecId xmlns:b="http://schemas.microsoft.com/2003/10/Serialization/Arrays">` +
      `${ids}` +
      `</_recordsRecId>` +
      `</delete>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const response = await axios.post(
      `${config.resource}soap/services/${EXP_MGMT_HEADER_GROUP}`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: `http://tempuri.org/${EXP_MGMT_HEADER_CONTRACT}/delete`,
        },
        responseType: 'text',
        timeout: 30000,
      },
    );

    const parser = new XMLParser({
      ignoreAttributes: false,
      parseTagValue: false,
      trimValues: true,
    });
    const parsed = parser.parse(response.data);

    if (parsed?.['s:Envelope']?.['s:Body']?.['s:Fault']) {
      const fault = parsed['s:Envelope']['s:Body']['s:Fault'];
      return {
        success: false,
        message: fault.faultstring || 'SOAP fault during delete.',
      };
    }

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['deleteResponse']?.['result'];

    let contracts =
      result?.['a:GeneralContract'] ?? result?.['GeneralContract'] ?? null;
    if (!contracts) {
      return {success: false, message: 'No response from delete.'};
    }
    if (!Array.isArray(contracts)) contracts = [contracts];

    // Element 0 is the summary contract.
    const summary = contracts[0];
    const isSuccessStr = toStr(pick(summary, 'IsSuccess')).toLowerCase();

    return {
      success: isSuccessStr === 'true' || isSuccessStr === '1',
      message: toStr(pick(summary, 'Message')) || 'Delete completed.',
    };
  } catch (err) {
    console.error(
      'DeleteExpenseManagementHeader SOAP error:',
      err.response?.data || err.message,
    );
    return {success: false, message: err?.message || 'Delete failed.'};
  }
};

export {DeleteExpenseManagementHeader};
