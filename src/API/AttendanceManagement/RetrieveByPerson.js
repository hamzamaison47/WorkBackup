/* eslint-disable dot-notation */
import {getActiveConfigData} from '../../Controller/secureConfig';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {normalizeObject} from './soapNormalize';

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
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
        responseType: 'text',
        timeout: 10000, // 10 seconds timeout for slow internet
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

    if (__DEV__) {
      console.log(
        'Final cleaned person location data:',
        cleanedData?.length,
        'records fetched',
      );
      console.log('Final cleaned person location data:', cleanedData);
    }

    return cleanedData;
  } catch (err) {
    if (__DEV__) {
      console.error(
        'Retrieve Person location SOAP error:',
        err.response?.data || err.message,
      );
    }
    if (
      err.code === 'ECONNABORTED' ||
      !err.response ||
      err.message?.toLowerCase().includes('network error')
    ) {
      throw new Error('Internet connection is slow or down. Please try again.');
    }
    throw err;
  }
};

export {RetrieveByPerson};
