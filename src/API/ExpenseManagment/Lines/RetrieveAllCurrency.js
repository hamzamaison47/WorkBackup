/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../Controller/secureConfig';

const RetrieveAllCurrency = async () => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <retrieveAll xmlns="http://tempuri.org">
      </retrieveAll>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    // console.log({soapEnvelope});

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/CurrencySvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/CurrencySvc/retrieveAll',
        },
        responseType: 'text',
        timeout: 30000,
      },
    );

    // console.log({xml});

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: (name, jpath, isLeafNode, isAttribute) => {
        return name === 'CurrencySvcContract';
      },
      parseTagValue: true,
      trimValues: true,
    });

    const parsed = parser.parse(xml);

    // console.log({parsed});

    // Multiple ways to access the data due to potential XML structure variations
    let rawData;

    // Try different XML structure paths
    if (
      parsed?.['s:Envelope']?.['s:Body']?.['retrieveAllResponse']?.['result']?.[
        'a:CurrencySvcContract'
      ]
    ) {
      rawData =
        parsed['s:Envelope']['s:Body']['retrieveAllResponse']['result'][
          'a:CurrencySvcContract'
        ];
    } else if (
      parsed?.Envelope?.Body?.retrieveAllResponse?.result?.CurrencySvcContract
    ) {
      rawData =
        parsed.Envelope.Body.retrieveAllResponse.result.CurrencySvcContract;
    } else if (
      parsed?.['soap:Envelope']?.['soap:Body']?.['retrieveAllResponse']?.[
        'result'
      ]?.['CurrencySvcContract']
    ) {
      rawData =
        parsed['soap:Envelope']['soap:Body']['retrieveAllResponse']['result'][
          'CurrencySvcContract'
        ];
    }

    if (!rawData || (Array.isArray(rawData) && rawData.length === 0)) {
      console.log('No currency data found');
      return [];
    }

    // Ensure rawData is an array
    const dataArray = Array.isArray(rawData) ? rawData : [rawData];

    // Clean the object by removing namespace prefixes
    const cleanObject = obj =>
      Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^[a-z]:/, ''), // Remove any single letter namespace prefix like 'a:'
          value,
        ]),
      );

    const cleanedData = dataArray.map(cleanObject);

    // console.log({cleanedData});

    return cleanedData;
  } catch (err) {
    console.error(
      'RetrieveAllCurrency SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {RetrieveAllCurrency};
