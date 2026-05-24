/* eslint-disable curly */
/* eslint-disable dot-notation */
// import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../Controller/secureConfig';

const UpdateBankAccountRecord = async ({bankaccountdata}) => {
  console.log('sending data', bankaccountdata);
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
          <update xmlns="http://tempuri.org">
            <contract xmlns:tem="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">
              ${buildContractXml(bankaccountdata)}
            </contract>
          </update>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    console.log('envolpe-0-0-0-0-0-0-0-0', soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/HcmWorkerESSBankAccountSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/HcmWorkerESSBankAccountSvc/update',
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
    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['updateResponse']?.['result'] ||
      parsed?.['soap:Envelope']?.['soap:Body']?.['updateResponse']?.['result'];

    if (!result) {
      console.log('No result found in Update SOAP response');
      return null;
    }

    const cleanObject = obj => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(cleanObject);

      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^[a-zA-Z0-9]+:/, ''), // strip ns prefix
          typeof value === 'object' ? cleanObject(value) : value,
        ]),
      );
    };

    const cleanedResult = cleanObject(result);
    return cleanedResult;
  } catch (error) {
    console.error(
      'Failed to update bank account record:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

const buildContractXml = contract => {
  if (!contract) return '';

  const ns = 'tem';
  const numericFields = new Set(['recId', 'Worker']);

  // xmlTag = what WSDL expects, contractKey = what our JS object has
  const fieldMappings = [
    {xmlTag: 'AccountHolder', contractKey: 'AccountHolder'},
    {xmlTag: 'AccountId', contractKey: 'AccountId'},
    {xmlTag: 'AccountNum', contractKey: 'AccountNum'},
    {xmlTag: 'BankIBAN', contractKey: 'BankIBAN'},
    {xmlTag: 'BranchName', contractKey: 'BranchName'},
    {xmlTag: 'BranchNumber', contractKey: 'BranchNumber'},
    {xmlTag: 'EmployeeId', contractKey: 'EmployeeId'},
    {xmlTag: 'Name', contractKey: 'Name'},
    {xmlTag: 'recId', contractKey: 'RecId'}, // ← WSDL is lowercase recId
    {xmlTag: 'WFOperation', contractKey: 'WFOperation'},
    {xmlTag: 'WFStatus', contractKey: 'WFStatus'},
    {xmlTag: 'Worker', contractKey: 'Worker'},
  ];

  return fieldMappings
    .map(({xmlTag, contractKey}) => {
      // Always hardcode these
      if (xmlTag === 'WFStatus')
        return `<${ns}:${xmlTag}>Not Submitted</${ns}:${xmlTag}>`;
      if (xmlTag === 'WFOperation')
        return `<${ns}:${xmlTag}>Update</${ns}:${xmlTag}>`;

      const value = contract[contractKey];

      // Numeric fields must never be nil
      if (numericFields.has(xmlTag)) {
        const numVal = !value || value === '' ? '0' : String(value);
        return `<${ns}:${xmlTag}>${numVal}</${ns}:${xmlTag}>`;
      }

      if (value === null || value === undefined || value === '') {
        return `<${ns}:${xmlTag} xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>`;
      }

      return `<${ns}:${xmlTag}>${escapeXmlValue(value)}</${ns}:${xmlTag}>`;
    })
    .join('');
};

const escapeXmlValue = value => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export {UpdateBankAccountRecord};
