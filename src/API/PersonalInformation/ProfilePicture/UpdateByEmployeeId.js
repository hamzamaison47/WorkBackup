/* eslint-disable dot-notation */
import {getToken} from '../../Token/getToken';
import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';

const UpdateByEmployeeId = async ({employeeId, stringImage}) => {
  try {
    const accessToken = await getToken();

    const soapBody = `
    <updateByEmployeeId xmlns = "http://tempuri.org">
      <_employeeId>${employeeId}</_employeeId>
      <_stringImage>${stringImage}</_stringImage>
    </updateByEmployeeId>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${resource}soap/services/HcmPersonImageSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/HcmPersonImageSvc/updateByEmployeeId',
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
      parsed?.['s:Envelope']?.['s:Body']?.['updateByEmployeeIdResponse']?.[
        'result'
      ];

    if (!rawData) {
      console.warn('No data found');
      return [];
    }

    // Normalize and remove "a:" prefix from keys
    const cleanObject = obj =>
      Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^a:/, ''),
          value,
        ]),
      );

    const cleanedData = Array.isArray(rawData)
      ? rawData.map(cleanObject)
      : [cleanObject(rawData)];

    return cleanedData;
  } catch (error) {
    console.error('Failed to update Profile Picture:', error);
    throw error;
  }
};

export {UpdateByEmployeeId};
