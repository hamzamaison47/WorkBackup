/* eslint-disable curly */
/* eslint-disable dot-notation */
import {getActiveConfigData} from '../../Controller/secureConfig';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';

const RetrieveByPersonAttendance = async ({person}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <retrieveByPerson xmlns="http://tempuri.org">
        <_personRecId>${person}</_personRecId>
      </retrieveByPerson>
    `;

    const soapEnvelope = createSoapEnvelope(soapBody);

    console.log('Person =-=-=-=-=-', {person});
    console.log('soapEnvelope =-=-=-=-=-', {soapEnvelope});

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/DFUserAttendanceSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/DFUserAttendanceSvc/retrieveByPerson',
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
      console.log('No person attendance returned from backend');
      return [];
    }

    // AX SOAP sometimes returns single object instead of array
    let attendanceContracts =
      result?.['a:DFUserAttendanceSvcContract'] ||
      result?.['DFUserAttendanceSvcContract'];

    // If the contract key is missing, it means there are no actual records (even if "result" has XML namespaces)
    if (!attendanceContracts) {
      console.log('No person attendance records found');
      return [];
    }

    if (!Array.isArray(attendanceContracts)) {
      attendanceContracts = [attendanceContracts];
    }

    const cleanedData = attendanceContracts.map((item, index) => {
      const normalized = normalizeObject(item);

      return {
        $id: String(index + 1),
        ...normalized,
      };
    });

    // console.log('Final cleaned person location data:', cleanedData);

    console.log(
      'Final cleaned person attendance data:',
      JSON.stringify(cleanedData, null, 2),
    );

    return cleanedData;
  } catch (err) {
    console.error(
      'Retrieve Person attendance SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

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

export {RetrieveByPersonAttendance};
