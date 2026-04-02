/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const DeleteAttendanceRecord = async ({recId}) => {
  try {
    // ✅ Guard check
    if (!recId || !Array.isArray(recId) || recId.length === 0) {
      throw new Error('No RecIds provided for deletion');
    }

    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // ✅ FIXED SOAP BODY (namespace + correct param)
    const soapBody = `
      <tem:delete xmlns:tem="http://tempuri.org">
        <tem:_recId xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
          ${recId.map(id => `<a:long>${id}</a:long>`).join('')}
        </tem:_recId>
      </tem:delete>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    // ✅ DEBUG (keep this while testing)
    console.log('SOAP REQUEST:\n', soapEnvelope);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/DFUserAttendanceSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/DFUserAttendanceSvc/delete',
        },
        responseType: 'text',
      },
    );

    // ✅ DEBUG RESPONSE
    console.log('SOAP RESPONSE:\n', xml);

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: false,
    });

    const parsed = parser.parse(xml);

    // ✅ SAFER RESPONSE HANDLING (dynamic key)
    const body = parsed?.['s:Envelope']?.['s:Body'];

    const responseKey = Object.keys(body || {}).find(k =>
      k.toLowerCase().includes('deleteresponse'),
    );

    const generalContracts =
      body?.[responseKey]?.['result']?.['a:GeneralContract'];

    if (!generalContracts) {
      console.warn('No delete response data found');
      return [];
    }

    // ✅ CLEAN RESPONSE
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

export default DeleteAttendanceRecord;
