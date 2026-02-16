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

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: true,
    });

    const parsed = parser.parse(xml);

    // Try both common AX patterns: ...Response > return  OR  ...Response > result
    const container =
      parsed?.['s:Envelope']?.['s:Body']?.['getGPSCoordinatesResponse'];
    const rawListNode =
      container?.['return']?.['a:DFgpsCoordinatesSvcContract'] ??
      container?.['result']?.['a:DFgpsCoordinatesSvcContract'];
    console.log('rawListNode', rawListNode);

    if (!rawListNode) {
      return [];
    }

    const stripA = obj =>
      Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k.replace(/^a:/, ''), v]),
      );

    const rows = Array.isArray(rawListNode)
      ? rawListNode.map(stripA)
      : [stripA(rawListNode)];

    // Use values EXACTLY as provided by D365 (no swapping/fixing)
    const list = rows
      .map(r => ({
        latitude: Number(r.Latitude),
        longitude: Number(r.Longitude),
        radius: Number(r.Radius),
        machineIPAddress: r.MachineIPAddress || r.IPAddress || '', // Handle both possible field names
      }))
      .filter(
        p =>
          Number.isFinite(p.latitude) &&
          Number.isFinite(p.longitude) &&
          Number.isFinite(p.radius),
      );

    return list;
  } catch (err) {
    console.error(
      '❌ GetGPSCoordinates SOAP error:',
      err?.response?.data || err,
    );
    throw err;
  }
};

export {GetGPSCoordinates};
