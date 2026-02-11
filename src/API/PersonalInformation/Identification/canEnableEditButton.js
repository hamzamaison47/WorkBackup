import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { getToken } from '../../Token/getToken';
import { createSoapEnvelope } from '../../../store/utils/soapHeaderUtils';
import { getActiveConfigData } from '../../../Controller/secureConfig';

const canEnableEditButton = async (recId, recVersion) => {
  try {
    // 1️⃣ Get service config
    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    // 2️⃣ Get auth token
    const token = await getToken();

    // 3️⃣ Prepare SOAP body
    const soapBody = `
      <canEnableEditButton xmlns="http://tempuri.org">
        <_recId>${recId}</_recId>
        <_recVersion>${recVersion}</_recVersion>
      </canEnableEditButton>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    // 4️⃣ Make SOAP request
    const { data: xml } = await axios.post(
      `${config.resource}soap/services/HcmPersonIdentificationNumberSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/HcmPersonIdentificationNumberSvc/canEnableEditButton',
        },
        responseType: 'text',
      }
    );

    // 5️⃣ Parse XML response
    const parser = new XMLParser({
      ignoreAttributes: false,
      parseTagValue: true,
      trimValues: true,
    });

    const parsed = parser.parse(xml);

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['canEnableEditButtonResponse']?.result;

      const canEdit = result === true ||
      result === 'true' ||
      result === '1' ||
      result === 'yes';

    return Boolean(canEdit);
    // 6️⃣ Convert SOAP result to boolean
    return result;
  } catch (err) {
    console.error('canEnableEditButton SOAP error:', {
      message: err.message,
      status: err.response?.status,
      response: err.response?.data,
    });
    throw err;
  }
};

export {canEnableEditButton};
