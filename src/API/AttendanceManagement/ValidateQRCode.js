/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const ValidateQRCode = async ({qrImage, geoFenceID}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <validateQRCode xmlns="http://tempuri.org">
        <_geoFenceID>${String(geoFenceID)}</_geoFenceID>
        <_qrImage>${qrImage}</_qrImage>
      </validateQRCode>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    console.log({soapEnvelope});

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/DFUserAttendanceSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/DFUserAttendanceSvc/validateQRCode',
        },
        responseType: 'text',
      },
    );

    // console.log({xml});

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: true,
    });

    const parsed = parser.parse(xml);

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['validateQRCodeResponse']?.[
        'result'
      ];

    if (result === undefined || result === null) {
      console.log('No QR Code validation found');
      return null;
    }

    // console.log({result});

    return Number(result); // Convert to number if not already
  } catch (err) {
    console.error(
      'ValidateQRCode SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {ValidateQRCode};
