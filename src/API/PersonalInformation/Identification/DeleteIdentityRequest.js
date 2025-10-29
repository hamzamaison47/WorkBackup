/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../Controller/secureConfig';

const DeleteIdentityRequest = async ({recordsRecId, defaultCompany}) => {
  try {
    console.log('Records To Delete :', recordsRecId);
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <delete xmlns="http://tempuri.org">
        <_recordsRecId xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
          ${recordsRecId.map(id => `<a:long>${id}</a:long>`).join('')}
        </_recordsRecId>
      </delete>`;

    const soapEnvelope = createSoapEnvelope(soapBody, defaultCompany);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/HcmPersonIdentificationNumberSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/HcmPersonIdentificationNumberSvc/delete',
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
      parsed?.['s:Envelope']?.['s:Body']?.['deleteResponse']?.['result']?.[
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
    console.error(
      'Delete Identity SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {DeleteIdentityRequest};
