/* eslint-disable curly */
/* eslint-disable dot-notation */
// Retrieves attachments bound to a Medical Expense HEADER record.
// Called by MedicalExpenseManagmentListPage via the modal's retrieveApi prop.
// Keys on the HEADER table (SLD_MedicalExpenseTable) + header RecId.
// Returns inline bytes: [{ RecId, OriginalFileName, FileType, FileBase64 }].
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getActiveConfigData} from '../../../../../Controller/secureConfig';
import {getToken} from '../../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../../store/utils/soapHeaderUtils';

const HEADER_TABLE = 'TrvExpTableView';

const RetrieveMedicalHeaderReceipts = async headerRecId => {
  try {
    const config = await getActiveConfigData();
    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }
    if (!headerRecId) {
      console.log('RetrieveMedicalHeaderReceipts: No header RecId');
      return [];
    }

    const token = await getToken();

    // NOTE: op name + param names are modeled on the standard retrieve pattern.
    // If your working RetrieveMedicalLineReceipts uses a different operation/param
    // names, MATCH THOSE EXACTLY (only the _tableName value changes to the header
    // table). See the "CONFIRM" note below.
    const soapBody = `
        <retrieve xmlns="http://tempuri.org">
            <_recordRefRecId>${headerRecId}</_recordRefRecId>
            <_tableName>${HEADER_TABLE}</_tableName>
        </retrieve>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const response = await axios.post(
      `${config.resource}soap/services/DocumentAttachmentSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/DocumentAttachmentSvc/retrieve',
        },
        responseType: 'text',
        timeout: 30000,
      },
    );

    console.log('[HeaderReceipts RAW] status:', response.status);
    console.log(
      '[HeaderReceipts RAW] first 3000:',
      String(response.data).slice(0, 3000),
    );

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '@_',
      parseTagValue: false,
      trimValues: true,
      allowBooleanAttributes: false,
      parseAttributeValue: false,
      preserveOrder: false,
      alwaysCreateTextNode: true,
    });

    const parsed = parser.parse(response.data);

    console.log(
      '[HeaderReceipts RAW] parsed result keys:',
      result ? Object.keys(result) : 'result is null/undefined',
    );

    if (parsed?.['s:Envelope']?.['s:Body']?.['s:Fault']) {
      const fault = parsed['s:Envelope']['s:Body']['s:Fault'];
      const faultString =
        fault?.faultstring?.['#text'] ||
        fault?.faultstring ||
        'Unknown SOAP fault';
      console.error('RetrieveMedicalHeaderReceipts SOAP Fault:', faultString);
      return [];
    }

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['retrieveResponse']?.['result'];

    if (!result) {
      console.log('No header attachment data found in response');
      return [];
    }

    // Normalize the contract node(s) to an array.
    let items =
      result?.['a:DocumentAttachmentSvcContract'] ??
      result?.['DocumentAttachmentSvcContract'] ??
      null;

    if (!items) return [];
    if (!Array.isArray(items)) items = [items];

    const pickText = node => {
      if (node === undefined || node === null) return '';
      if (typeof node === 'object') {
        return node['#text'] !== undefined ? String(node['#text']) : '';
      }
      return String(node);
    };

    const pick = (obj, name) =>
      obj?.['a:' + name] !== undefined ? obj['a:' + name] : obj?.[name];

    return items.map(node => ({
      RecId: pickText(pick(node, 'RecId')),
      OriginalFileName:
        pickText(pick(node, 'OriginalFileName')) ||
        pickText(pick(node, 'Name')),
      FileType: pickText(pick(node, 'FileType')),
      FileBase64: pickText(pick(node, 'FileBase64')),
    }));
  } catch (err) {
    console.error(
      'RetrieveMedicalHeaderReceipts SOAP error:',
      err.response?.data || err.message,
      err.stack,
    );
    return [];
  }
};

export default RetrieveMedicalHeaderReceipts;
