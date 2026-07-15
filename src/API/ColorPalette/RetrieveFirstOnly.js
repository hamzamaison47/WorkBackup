/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const RetrieveFirstOnly = async () => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // SOAP body for the retrieveFirstOnly method
    const soapBody = `
      <retrieveFirstOnly xmlns="http://tempuri.org">
      </retrieveFirstOnly>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      // ✅ CORRECTED: Added the service name and proper endpoint
      `${config.resource}soap/services/DFColorPaletteSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          // ✅ CORRECTED: Proper SOAPAction for the specific service
          SOAPAction: 'http://tempuri.org/DFColorPaletteSvc/retrieveFirstOnly',
        },
        responseType: 'text',
      },
    );

    // TEMP [PALETTE-DEBUG] raw SOAP response — remove after diagnosis
    console.log(
      '[PALETTE-DEBUG] raw xml:',
      typeof xml === 'string' ? xml.slice(0, 1500) : xml,
    );

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '@',
      isArray: () => false,
      parseTagValue: true,
      trimValues: true,
      removeNSPrefix: false,
    });

    const parsed = parser.parse(xml);

    // ✅ CORRECTED: Properly parse the response structure
    const response =
      parsed?.['s:Envelope']?.['s:Body']?.['retrieveFirstOnlyResponse']?.[
        'result'
      ];

    // TEMP [PALETTE-DEBUG] what keys actually live under <result> — remove after diagnosis
    console.log(
      '[PALETTE-DEBUG] result node keys:',
      response && typeof response === 'object'
        ? Object.keys(response)
        : response,
    );

    // Parse the list response
    let result = null;
    if (response && response['a:DFColorPaletteContract']) {
      // If the response contains a single contract
      result = response['a:DFColorPaletteContract'];
    } else if (
      response &&
      Array.isArray(response['a:DFColorPaletteContract'])
    ) {
      // If there are multiple contracts (should be only one)
      result = response['a:DFColorPaletteContract'][0];
    }

    if (!result) {
      console.log('No data found in DFParameter table');
      return {
        primaryColor: '',
        selectionColor: '',
        message: 'No data available',
      };
    }

    // Clean the data
    const cleanObject = obj => {
      if (!obj || typeof obj !== 'object') return obj;

      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        const cleanKey = key.replace(/^[a-z]+:/, '');

        if (value && typeof value === 'object' && !Array.isArray(value)) {
          cleaned[cleanKey] = cleanObject(value);
        } else {
          cleaned[cleanKey] = value;
        }
      }
      return cleaned;
    };

    const cleanedData = cleanObject(result);

    // Extract the actual data
    const finalData = {
      primaryColor: cleanedData['PrimaryColor'] || '',
      onPrimaryColor: cleanedData['OnPrimary'] || '',
      selectionColor: cleanedData['SelectionColor'] || '',
    };

    console.log('Retrieved data Color Palette:', finalData);

    return finalData;
  } catch (err) {
    console.error('RetrieveFirstOnly SOAP error:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
      headers: err.response?.headers,
    });
    throw err;
  }
};

export {RetrieveFirstOnly};
