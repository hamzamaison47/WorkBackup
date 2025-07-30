/* eslint-disable dot-notation */
import {resource} from '@env';
import {getToken} from '../Token/getToken';
import {XMLParser} from 'fast-xml-parser';
import axios from 'axios';

const deleteLeaveRequest = async ({recordsRecId, defaultCompany}) => {
  try {
    const token = await getToken();

    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
      <soapenv:Header>
        <dat:CallContext xmlns:dat="http://schemas.microsoft.com/dynamics/2013/01/datacontracts">
          <dat:Company>${defaultCompany}</dat:Company>
          <dat:Language>en-us</dat:Language>
        </dat:CallContext>
      </soapenv:Header>
      <soapenv:Body>
        <Delete xmlns="http://tempuri.org">
          <_recordsRecId xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
            ${recordsRecId.map(id => `<a:long>${id}</a:long>`).join('')}
          </_recordsRecId>
        </Delete>
      </soapenv:Body>
    </soapenv:Envelope>`;

    const {data: xml} = await axios.post(
      `${resource}soap/services/PREmployeeLeavesSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/PREmployeeLeavesSvc/Delete',
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
    const generalContracts =
      parsed?.['s:Envelope']?.['s:Body']?.['DeleteResponse']?.['result']?.[
        'a:GeneralContract'
      ];

    if (!generalContracts) {
      console.warn('No delete response data found');
      return [];
    }

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
    console.error('Delete SOAP error:', err.response?.data || err.message);
    throw err;
  }
};

export {deleteLeaveRequest};
