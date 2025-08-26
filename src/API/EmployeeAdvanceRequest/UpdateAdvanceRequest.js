/* eslint-disable curly */
/* eslint-disable dot-notation */
import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';

const UpdateAdvanceRequest = async ({advanceData}) => {
  try {
    const token = await getToken();

    const soapBody = `
      <update xmlns = "http://tempuri.org">
        <contract xmlns:tem = "http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">
          ${buildContractXml(advanceData)}
        </contract>
      </update>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${resource}soap/services/PREmployeeAdvanceRequestSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/PREmployeeAdvanceRequestSvc/update',
        },
        responseType: 'text',
      },
    );

    console.log('soap envelope data', soapEnvelope);
    console.log('soap body data', soapBody);

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

    console.log('soap body cleanedResult', cleanedResult);

    return cleanedResult;
  } catch (error) {
    console.error(
      'Failed to update advance request:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

const buildContractXml = contract => {
  if (!contract) return '';

  const ns = 'tem';
  const fields = [
    'AdvanceAmount',
    'AdvanceDescription',
    'AdvanceTypeCode',
    'EmployeeId',
    'RecId',
    'RecoveryStartDate',
    'RequestDate',
    'RequestedInstallmentAmount',
    'RequestedInstallments',
    'RequestedPaymentDate',
  ];

  return fields
    .map(field => {
      const value = contract[field];
      if (value === null || value === undefined) {
        return `<${ns}:${field} xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>`;
      }
      return `<${ns}:${field}>${escapeXmlValue(value)}</${ns}:${field}>`;
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

export {UpdateAdvanceRequest};
