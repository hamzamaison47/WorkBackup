/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../Controller/secureConfig';

/**
 * Retrieves relationship types from SOAP API and returns them
 * in a safe, Picker-friendly format: { label, value }
 */
const retrieveRelationshipTypeId = async () => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // SOAP body
    const soapBody = `
      <retrieveRelationshipTypeId xmlns="http://tempuri.org">
      </retrieveRelationshipTypeId>
    `;
    const soapEnvelope = createSoapEnvelope(soapBody);

    // POST SOAP request
    const {data: xml} = await axios.post(
      `${config.resource}soap/services/ESSPersonalContactsSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/ESSPersonalContactsSvc/retrieveRelationshipTypeId',
        },
        responseType: 'text',
      },
    );

    // Parse XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      parseTagValue: false,
      isArray: (name, jpath, isLeafNode, isAttribute) => {
        // Ensure multiple contracts are always parsed as array
        return name === 'a:ESSPersonalContactsContract';
      },
    });

    const parsed = parser.parse(xml);

    // Navigate safely to raw data
    const rawData =
      parsed?.['s:Envelope']?.['s:Body']?.[
        'retrieveRelationshipTypeIdResponse'
      ]?.['result']?.['a:ESSPersonalContactsContract'];

    if (!rawData) {
      console.warn('No relationship types found in response.');
      return [];
    }

    // Ensure array
    const rawArray = Array.isArray(rawData) ? rawData : [rawData];

    // Clean namespace prefixes
    const cleanedData = rawArray.map(item =>
      Object.fromEntries(
        Object.entries(item).map(([key, value]) => [
          key.replace(/^a:/, ''),
          value,
        ]),
      ),
    );

    // Map to Picker format
    const mappedData = cleanedData.map(item => ({
      label: item.Name || item.RelationShipTypeId || 'Unknown',
      value: item.RelationShipTypeId || '',
    }));

    return mappedData;
  } catch (err) {
    console.error(
      'Error fetching relationship types:',
      err.response?.data || err.message,
    );
    return []; // Return empty array instead of throwing to avoid crashes
  }
};

export {retrieveRelationshipTypeId};
