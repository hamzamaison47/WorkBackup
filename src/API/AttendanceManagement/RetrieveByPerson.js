/* eslint-disable dot-notation */
import {getActiveConfigData} from '../../Controller/secureConfig';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {normalizeObject} from './soapNormalize';
import {postSoapWithRetry} from './soapRequestHelper';

// De-dupe guard: if a request for this data is already in flight, every
// caller that comes in while it's running gets the SAME promise instead of
// firing a brand-new SOAP call. Prevents concurrent callers (mount sync,
// post-action refresh, button-press prepare()) from hitting
// DFUserGeofencesSvcGroup at the same time and tripping ERR_NETWORK on an
// otherwise-fine connection.
let inFlightRequest = null;

const RetrieveByPerson = async ({person}) => {
  if (inFlightRequest) {
    if (__DEV__) {
      console.log('[RetrieveByPerson] reusing in-flight request');
    }
    return inFlightRequest;
  }

  inFlightRequest = (async () => {
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

      const {data: xml} = await postSoapWithRetry(
        `${config.resource}soap/services/DFUserGeofencesSvcGroup`,
        soapEnvelope,
        {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/DFUserGeofencesSvc/retrieveByPerson',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
        {timeout: 10000, retries: 1},
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
        console.error('Retrieve Person location SOAP error:', {
          code: err.code,
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
          isAxiosError: err.isAxiosError,
        });
      }

      const isRealNetworkFailure =
        err.code === 'ECONNABORTED' ||
        (err.isAxiosError === true && !err.response);

      if (isRealNetworkFailure) {
        throw new Error(
          'Internet connection is slow or down. Please try again.',
        );
      }

      // Not a network issue — surface the real error (auth, config, SOAP fault, etc.)
      throw err;
    } finally {
      inFlightRequest = null;
    }
  })();

  return inFlightRequest;
};

export {RetrieveByPerson};
