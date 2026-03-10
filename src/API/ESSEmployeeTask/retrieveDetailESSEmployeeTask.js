/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

/**
 * Retrieve detailed info for a single employee task by RecId
 * @param {Object} params
 * @param {string|number} params.recId
 * @returns {Promise<Array>} Returns array with single task contract
 */
const retrieveDetailESSEmployeeTask = async ({recId}) => {
  console.log('Fetching detail for RecId:', recId);

  try {
    const config = await getActiveConfigData();
    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // SOAP body for retrieveDetail
    const soapBody = `
      <retrieveDetail xmlns="http://tempuri.org">
        <_recId>${recId}</_recId>
      </retrieveDetail>`;

    console.log('SOAP Envelope:', soapBody);

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/ESSPersonTaskServiceGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/ESSPersonTaskSvc/retrieveDetail',
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
    console.log(
      'SOAP PARSED DETAIL RESPONSE:',
      JSON.stringify(parsed, null, 2),
    );

    // Path to the returned List of ESSPersonTaskContract
    const rawData =
      parsed['s:Envelope']['s:Body']['retrieveDetailResponse']['result'][
        'a:ESSPersonTaskContract'
      ];

    if (!rawData) {
      console.log('No Task detail found');
      return [];
    }

    // Clean object keys (remove "a:" prefix)
    const cleanObject = obj =>
      Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^a:/, ''),
          value,
        ]),
      );

    // Ensure array for consistency
    const cleanedData = Array.isArray(rawData)
      ? rawData.map(cleanObject)
      : [cleanObject(rawData)];

    return cleanedData;
  } catch (err) {
    console.error(
      'retrieveDetailESSEmployeeTask SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {retrieveDetailESSEmployeeTask};
