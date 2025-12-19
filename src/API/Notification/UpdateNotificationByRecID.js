/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const updateNotificationByRecID = async recordsRecId => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // Convert to array if it's not already
    const recIds = Array.isArray(recordsRecId) ? recordsRecId : [recordsRecId];

    // Create the SOAP body with proper array structure
    // The array should be serialized according to WCF serialization rules
    const soapBody = `
      <updateNotificationByRecID xmlns="http://tempuri.org">
        <_recordsRecId xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
          ${recIds.map(id => `<a:long>${id}</a:long>`).join('')}
        </_recordsRecId>
      </updateNotificationByRecID>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    // console.log('SOAP Request:', soapEnvelope);

    const response = await axios.post(
      `${config.resource}soap/services/DFNotificationServiceSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/DFNotificationServiceSvc/updateNotificationByRecID',
        },
        responseType: 'text',
        timeout: 30000,
      },
    );

    // Parse the XML response
    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: false,
    });

    const parsed = parser.parse(response.data);

    // Check for SOAP fault
    if (parsed['s:Envelope']?.['s:Body']?.['s:Fault']) {
      const fault = parsed['s:Envelope']['s:Body']['s:Fault'];
      const errorMsg =
        fault.faultstring ||
        fault.detail?.Fault?.ExceptionMessage ||
        'SOAP service fault occurred';
      throw new Error(errorMsg);
    }

    // Extract the response
    const responseBody =
      parsed['s:Envelope']?.['s:Body']?.['updateNotificationByRecIDResponse'];

    if (!responseBody) {
      throw new Error('Invalid response from server');
    }

    // Extract the result list
    const resultList = responseBody.result?.['a:GeneralContract'];

    return {
      success: true,
      message: 'Notification updated successfully',
      data: resultList || [],
    };
  } catch (err) {
    console.error(
      'UpdateNotificationByRecID SOAP error:',
      err.response?.data || err.message,
    );

    // Try to parse error from SOAP fault
    if (err.response?.data && typeof err.response.data === 'string') {
      try {
        const parser = new XMLParser({
          ignoreAttributes: false,
          ignoreNameSpace: false,
        });
        const parsed = parser.parse(err.response.data);
        const fault = parsed['s:Envelope']?.['s:Body']?.['s:Fault'];
        if (fault) {
          const errorMsg =
            fault.faultstring ||
            fault.detail?.Fault?.ExceptionMessage ||
            'SOAP service fault';
          throw new Error(errorMsg);
        }
      } catch (parseErr) {
        console.error('Error parsing SOAP fault:', parseErr);
      }
    }

    throw new Error(err.message || 'Failed to update notification');
  }
};

export {updateNotificationByRecID};
