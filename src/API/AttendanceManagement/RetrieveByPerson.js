/* eslint-disable curly */
/* eslint-disable dot-notation */
import {getActiveConfigData} from '../../Controller/secureConfig';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';

const removeNamespace = key => {
  return key.includes(':') ? key.split(':')[1] : key;
};

const normalizeValue = value => {
  if (value === null || value === undefined || value === '') return [];

  if (value === 'Yes') return 1;
  if (value === 'No') return 0;

  if (typeof value === 'string' && !isNaN(value)) {
    return Number(value);
  }

  return value;
};

const normalizeObject = obj => {
  if (Array.isArray(obj)) {
    return obj.map(normalizeObject);
  }

  if (typeof obj === 'object' && obj !== null) {
    const keys = Object.keys(obj);

    // 🔹 Auto-flatten SOAP wrappers like:
    // { DFGeoFencesNetworksSvcContract: [ ... ] }
    if (keys.length === 1 && Array.isArray(obj[keys[0]])) {
      return normalizeObject(obj[keys[0]]);
    }

    const newObj = {};

    keys.forEach(key => {
      const cleanKey = removeNamespace(key);
      const value = obj[key];

      if (typeof value === 'object') {
        const normalized = normalizeObject(value);

        if (Array.isArray(normalized)) {
          newObj[cleanKey] = normalized;
        } else {
          newObj[cleanKey] = [normalized];
        }
      } else {
        newObj[cleanKey] = normalizeValue(value);
      }
    });

    return newObj;
  }

  return normalizeValue(obj);
};

const RetrieveByPerson = async ({person}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <retrieveByPerson xmlns="http://tempuri.org">
        <_person>${person}</_person>
      </retrieveByPerson>
    `;

    const soapEnvelope = createSoapEnvelope(soapBody);

    // console.log('Person =-=-=-=-=-', {person});

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/DFUserGeofencesSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/DFUserGeofencesSvc/retrieveByPerson',
        },
        responseType: 'text',
      },
    );

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      trimValues: true,
    });

    const parsed = parser.parse(xml);

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['retrieveByPersonResponse']?.[
        'result'
      ];

    if (!result || Object.keys(result).length === 0) {
      console.log('No person location returned from backend');
      return [];
    }

    // AX SOAP sometimes returns single object instead of array
    let locationContracts =
      result?.['a:DFUserGeoFencesSvcContract'] ||
      result?.['DFUserGeoFencesSvcContract'];

    if (!locationContracts) {
      console.log('No person geofences found');
      return [];
    }

    if (!Array.isArray(locationContracts)) {
      locationContracts = [locationContracts];
    }

    const cleanedData = locationContracts.map((item, index) => {
      const normalized = normalizeObject(item);

      return {
        $id: String(index + 1),
        ...normalized,
      };
    });

    // console.log('Final cleaned person location data:', cleanedData);

    console.log(
      'Final cleaned person location data:',
      JSON.stringify(cleanedData, null, 2),
    );

    return cleanedData;
  } catch (err) {
    console.error(
      'Retrieve Person location SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {RetrieveByPerson};
