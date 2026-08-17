/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../../Controller/secureConfig';

// Calls DFExpenseReportLinesSvc.update.
// Element order inside <contract> MUST stay alphabetical to match the
// service contract's xs:sequence — do not reorder.
const UpdateMedicalExpenseLine = async ({
  RecId,
  SubCategory,
  Name,
  Relation,
  ReceiptNum,
  TransDate,
  ClaimedAmount,
  TransAmount,
  AuthAmount,
  Remarks,
  IsReceiptAttached,
  TrvExpTable,
}) => {
  try {
    const config = await getActiveConfigData();
    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const recId = Number(RecId) || 0;
    const trvExpTable = Number(TrvExpTable) || 0;

    const soapBody = `
  <update xmlns="http://tempuri.org">
    <contract xmlns:a="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
      <a:AuthAmount>${AuthAmount || 0}</a:AuthAmount>
      <a:ClaimedAmount>${ClaimedAmount || 0}</a:ClaimedAmount>
      <a:IsReceiptAttached>${
        IsReceiptAttached ? 'true' : 'false'
      }</a:IsReceiptAttached>
      <a:Name>${escapeXmlValue(Name || '')}</a:Name>
      <a:RecId>${recId}</a:RecId>
      <a:ReceiptNum>${escapeXmlValue(ReceiptNum || '')}</a:ReceiptNum>
      <a:Relation>${escapeXmlValue(Relation || '')}</a:Relation>
      <a:Remarks>${escapeXmlValue(Remarks || '')}</a:Remarks>
      <a:SubCategory>${escapeXmlValue(SubCategory || '')}</a:SubCategory>
      <a:TransAmount>${TransAmount || 0}</a:TransAmount>
      <a:TransDate>${TransDate || '0001-01-01T00:00:00'}</a:TransDate>
      <a:TrvExpTable>${trvExpTable}</a:TrvExpTable>
    </contract>
  </update>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/DFExpenseReportLinesSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/DFExpenseReportLinesSvc/update',
        },
        responseType: 'text',
      },
    );

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: false,
    });

    const parsed = parser.parse(xml);
    const rawData =
      parsed?.['s:Envelope']?.['s:Body']?.['updateResponse']?.['result'];

    if (!rawData) {
      return {IsSuccess: false, Message: 'No response from server', RecId: 0};
    }

    return {
      IsSuccess:
        rawData['a:IsSuccess'] === 'true' || rawData['a:IsSuccess'] === true,
      Message: rawData['a:Message'] || '',
      RecId: parseFloat(rawData['a:RecId']) || 0,
    };
  } catch (err) {
    console.error(
      'UpdateMedicalExpenseLine SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

const escapeXmlValue = value =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export {UpdateMedicalExpenseLine};
