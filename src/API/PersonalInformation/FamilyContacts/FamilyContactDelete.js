/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../Controller/secureConfig';

const deleteFamilyContactRecord = async ({records}) => {
  try {
    const config = await getActiveConfigData();
    console.log('DELETEEEEEEEEEE', records);

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    /// 🧾 Build SOAP Body with full records
    const soapBody = `
  <delete xmlns="http://tempuri.org">
    <contract xmlns:a="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
      ${records
        .map(
          rec => `
          <a:ESSPersonalContactsContract>
            <a:EmergencyContact>${
              rec.EmergencyContact === true || rec.EmergencyContact === 'true'
                ? 'true'
                : 'false'
            }</a:EmergencyContact>
            <a:EmployeeId>${
              rec.employeeId || rec.EmployeeId || ''
            }</a:EmployeeId>
            <a:Name>${
              rec.Name ? `<![CDATA[${rec.Name}]]>` : '<![CDATA[]]>'
            }</a:Name>
            <a:RecId>${rec.RecId || '0'}</a:RecId>
            <a:RelationShipTypeId>${
              rec.RelationShipTypeId || ''
            }</a:RelationShipTypeId>
            <a:isBeneficiary>${
              rec.isBeneficiary === true || rec.isBeneficiary === 'true'
                ? 'true'
                : 'false'
            }</a:isBeneficiary>
            <a:isDependent>${
              rec.isDependent === true || rec.isDependent === 'true'
                ? 'true'
                : 'false'
            }</a:isDependent>
          </a:ESSPersonalContactsContract>
        `,
        )
        .join('')}
    </contract>
  </delete>
`;

    console.log(soapBody);
    // Wrap with SOAP envelope
    const soapEnvelope = createSoapEnvelope(soapBody);

    // 🚀 Send SOAP Request to D365FO
    const {data: xml} = await axios.post(
      `${config.resource}soap/services/ESSPersonalContactsSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/ESSPersonalContactsSvc/delete',
        },
        responseType: 'text',
      },
    );

    // 🧩 Parse SOAP XML Response
    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: false,
    });

    const parsed = parser.parse(xml);

    // Extract response data safely
    const generalContracts =
      parsed?.['s:Envelope']?.['s:Body']?.['deleteResponse']?.['result']?.[
        'a:GeneralContract'
      ];

    if (!generalContracts) {
      console.warn('No delete response data found');
      return [];
    }

    // 🧹 Clean namespace prefixes
    const cleanObject = obj =>
      Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^a:/, ''),
          value,
        ]),
      );

    const cleanedData = Array.isArray(generalContracts)
      ? generalContracts.map(cleanObject)
      : [cleanObject(generalContracts)];

    return cleanedData;
  } catch (err) {
    console.error(
      'DeleteEducationDetails SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {deleteFamilyContactRecord};
