/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const GetGPSCoordinates = async () => {
  try {
    const config = await getActiveConfigData();
    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <getGPSCoordinates xmlns="http://tempuri.org" />
    `;
    const soapEnvelope = createSoapEnvelope(soapBody);

    // Adjust group/action if your service name differs
    const endpoint = `${config.resource}soap/services/DFgpsCoordinatesSVCGroup`;
    const soapAction =
      'http://tempuri.org/DFgpsCoordinatesSVC/getGPSCoordinates';

    const {data: xml} = await axios.post(endpoint, soapEnvelope, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/xml;charset=utf-8',
        SOAPAction: soapAction,
      },
      responseType: 'text',
    });

    console.log('Raw XML response:', xml); // Add this for debugging

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: (name, jpath, isLeafNode, isAttribute) => {
        // Force arrays for specific paths
        if (
          jpath ===
            's:Envelope.s:Body.getGPSCoordinatesResponse.return.DFgpsCoordinatesSvcContract' ||
          jpath ===
            's:Envelope.s:Body.getGPSCoordinatesResponse.result.DFgpsCoordinatesSvcContract'
        ) {
          return true;
        }
        return false;
      },
      parseTagValue: true,
      trimValues: true,
    });

    const parsed = parser.parse(xml);
    console.log('Parsed XML:', JSON.stringify(parsed, null, 2)); // Add this for debugging

    // Navigate through the response structure
    const envelope = parsed?.['s:Envelope'];
    const body = envelope?.['s:Body'];
    const response = body?.['getGPSCoordinatesResponse'];

    if (!response) {
      console.log('No response found in XML');
      return [];
    }

    // Get the return value (could be 'return' or 'result')
    const returnData = response['return'] || response['result'];

    if (!returnData) {
      console.log('No return/result found in response');
      return [];
    }

    // Check if we have the contract data
    let contractData = returnData['a:DFgpsCoordinatesSvcContract'];

    if (!contractData) {
      console.log('No DFgpsCoordinatesSvcContract found');
      return [];
    }

    // Always treat as array, even for single record
    const records = Array.isArray(contractData) ? contractData : [contractData];
    console.log('Records found:', records.length); // Debug log

    const stripA = obj => {
      // eslint-disable-next-line curly
      if (!obj || typeof obj !== 'object') return obj;

      const cleaned = {};
      Object.entries(obj).forEach(([key, value]) => {
        // Remove namespace prefixes
        const cleanKey = key.replace(/^a:/, '').replace(/^@_/, '');

        // Handle if value is an object with #text property (common in XML parsing)
        if (
          value &&
          typeof value === 'object' &&
          value['#text'] !== undefined
        ) {
          cleaned[cleanKey] = value['#text'];
        } else {
          cleaned[cleanKey] = value;
        }
      });
      return cleaned;
    };

    // Process all records
    const list = records
      .map(record => {
        const cleaned = stripA(record);
        console.log('Cleaned record:', cleaned); // Debug log

        // Try different possible field names
        const latitude = Number(cleaned.Latitude ?? cleaned.latitude ?? 0);
        const longitude = Number(cleaned.Longitude ?? cleaned.longitude ?? 0);
        const radius = Number(cleaned.Radius ?? cleaned.radius ?? 0);
        const machineIPAddress =
          cleaned.MachineIPAddress ??
          cleaned.machineIPAddress ??
          cleaned.IPAddress ??
          cleaned.ipAddress ??
          '';

        // Only include if we have valid coordinates
        if (
          Number.isFinite(latitude) &&
          Number.isFinite(longitude) &&
          Number.isFinite(radius) &&
          latitude !== 0 &&
          longitude !== 0
        ) {
          return {
            latitude,
            longitude,
            radius,
            machineIPAddress: String(machineIPAddress),
          };
        }
        return null;
      })
      .filter(item => item !== null);

    console.log('Final geofence list:', list); // Debug log
    return list;
  } catch (err) {
    console.error(
      '❌ GetGPSCoordinates SOAP error:',
      err?.response?.data || err.message || err,
    );
    // Return empty array instead of throwing to prevent app crash
    return [];
  }
};

export {GetGPSCoordinates};
